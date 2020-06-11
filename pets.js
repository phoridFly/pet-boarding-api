/**************************************************************************************************
 * John Hash
 * CS 493 Cloud Development Spring 2020
 * Portfolio Assignment: Final Project
 * Created: June 1, 2020
 * Last Modifed: June 7, 2020
 * 
 * pets.js
 * This file handles all the endpoints for creating, reading, updating, and deleting Pet Entities.
 * 
 * Description: An API that simulates a pet boarding facility. There are three entities:
 * User, Pet, Room. Rooms are unprotected. Pets are protected. User's own pets and can make
 * reservations by assigning pets to rooms or viewing pets. Rooms and pets can be modified.
 * User accounts are created automatically when the user authenticates using Google OAuth 2.0 by
 * entering their account email and password. The user is uniquely identified by the 'sub'
 * attribute of their JSON Web Token.
 * 
 * Citations:
 * 1) I had to look for references to learn how to make HTTP requests within Express routes
 *    and decided to go with the promise-based Axios package.
 *    https://www.npmjs.com/package/axios
 *    https://www.twilio.com/blog/2017/08/http-requests-in-node-js.html
 *    https://stackoverflow.com/questions/45578844/how-to-set-header-and-options-in-axios
 * 
 * 2) Refresher on Express Handlebars and passsing data to HTML in Node.js
 *    https://www.npmjs.com/package/express-handlebars
 *    https://stackoverflow.com/questions/37991995/passing-a-variable-from-node-js-to-html
 * 
 * 3) Sources used for setting up the library for and using OpenID Connect on Google OAuth 2.0.
 *    https://developers.google.com/identity/protocols/oauth2/openid-connect
 *    https://developers.google.com/identity/sign-in/web/backend-auth
 * 
 * 4) Needed to review documentation and see samples on how to use .catch() for error handling.
 *    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
 * 
 * 5) Much of the code was reused from previous assignments in the course with modifications for
 *    this particular assignment. 
 * 
 * 6) For information on HTTP response codes and methods.
 *    https://restfulapi.net/http-status-codes/
 *    https://restfulapi.net/http-methods/
 * 
 * 7) Troubleshooting the error catching in the async functions for 404 not found
 *    https://itnext.io/error-handling-with-async-await-in-js-26c3f20bc06a
 * 
 * 8) Disucssions on Slack with students and instructor about various issues, including
 *    setting up access to datastore
 * 
 * 9) Filtering results on Datastore queries
 *    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
 *    https://cloud.google.com/datastore/docs/concepts/queries#datastore-datastore-run-query-nodejs
 * 
 *************************************************************************************************/

/* ------------------ Boilerplate server setup and ds connection  ------------------*/
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');
const datastore = ds.datastore;
router.use(bodyParser.json());
const {OAuth2Client} = require('google-auth-library');
const clientIDParam = [client parameter here];
const client = new OAuth2Client(clientIDParam);

const ROOM = "Room";
const PET = "Pet";


/* ------------- Begin Pet Model Functions ------------- */
/** 
 * Function post_pet creates a new Pet Entity in datastore
 * @param  {string}     species    Kind of animal
 * @param  {string}     color      Color of pet
 * @param  {string}     name       Pet's name
 * @param  {string}     owner      Owner's id number
 * @returns {array}                Key and new pet object.
*/
function post_pet(species, color, name, owner){
    var key = datastore.key(PET);
	const new_pet = {"species": species, "color": color, "name": name, "room": {}, "owner": owner};
	return datastore.save({"key":key, "data":new_pet}).then(() => {return ([key, new_pet])});
}

/** 
 * Function get_one_pet gets the pet the user owns
 * @param  {string}     pet_id    The pet id that the user wants to check for.
 * @param  {string}     userSub   The user id that the user wants to check for.
 * @returns {array}               Returns a json object in an array
*/
function get_one_pet(pet_id, userSub) {
	const q = datastore.createQuery(PET);
	return datastore.runQuery(q).then( (entities) => {
		return entities[0].map(ds.fromDatastore).filter(item => item.owner === userSub && item.id === pet_id);
	});   
}

/** 
 * Function get_pets_without_pagination simply returns all the pets in ds
 * @returns {array}           Returns an array of pet entities.
*/
function get_pets_without_pagination(){
	const q = datastore.createQuery(PET);
	return datastore.runQuery(q).then( (entities) => {
		return entities[0].map(ds.fromDatastore);
	});
}

/** 
 * Function get_pets_authorized returns all pets owned by a specific user, uses pagination limit 5 per page
 * @param   {string}  userSub String that is used for the pet owner id and derived from jwt 'sub' field 
 * @param   {object}  req     The request object
 * @returns {array}           Returns an array of pet entities.
*/
function get_pets_authorized(req, userSub){
    var q = datastore.createQuery(PET).filter('owner' , '=', userSub).limit(5);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
	return datastore.runQuery(q).then( (entities) => {
        results.pets = entities[0].map(ds.fromDatastore)
        if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
            results.next = 'https' + "://" + req.get("host") + req.baseUrl + "?cursor=" + encodeURIComponent(entities[1].endCursor);
        
        }
        return results;
	});
}

/** 
 * Function update_room_info used to update the occupants attribute of a room by taking a pet out of the room
 * @param   {string}  pet_id      The pet that needs to be taken out of the room
 * @param   {string}  room_id     The room that needs occupants field updated
 * @returns {array}               Returns the key and updated room in an array
*/
function update_room_info(pet_id, room_id){
    const room_key = datastore.key([ROOM, parseInt(room_id,10)]);
    return datastore.get(room_key)
    .then( (rooms) => {
        const room = rooms[0];
        // the array of pets on the current room
        var initialPetsArray = room.occupants;
        // filter out the pet_id number and save in new array
        var updatedPetsArray = initialPetsArray.filter(function(pets) {
            return pets.id != pet_id;
        });
        const room_update = {"type": room.type, "name": room.name, "size": room.size, "rate": room.rate, "occupants": updatedPetsArray } ;
        return datastore.save({"key": room_key, "data": room_update}).then(() => {return ([room_key, room_update])});
    });
}

/** 
 * Function patch_update_pet used to update attributes inherent to the pet
 * @param   {string}  petId       The pet that needs to be updated
 * @param   {object}  reqBody     The body of the patch request
*/
function patch_update_pet(reqBody, petID){
    var key = datastore.key([PET, parseInt(petID,10)]);
    datastore.get(key, function(err, entity){
        // define all default values based on what is already there
        let patchName = entity.name;
        let patchSpecies = entity.species;
        let patchColor = entity.color;
        let patchOwner = entity.owner;
        let patchRoom = entity.room;

        // logic of checking if the the attributes are in the body
        // if in the request body, then replace
        if (typeof reqBody.name !== 'undefined') {
            patchName = reqBody.name;
        }
        if (typeof reqBody.species !== 'undefined') {
            patchType = reqBody.species;
        }
        if (typeof reqBody.color !== 'undefined') {
            patchColor = reqBody.color;
        }
        const patchedPet = {"name": patchName, "species": patchSpecies, "color": patchColor, "owner": patchOwner, "room": patchRoom};
        //console.log(patchedPet);
        //console.log(key.id);
        datastore.save({"key":key, "data":patchedPet});
    });
}

/** 
 * Function put_update_pet used to update attributes inherent to the pet
 * @param   {string}  petId       The pet that needs to be updated
 * @param   {object}  reqBody     The body of the put request
*/
function put_update_pet(reqBody, petID){
    var key = datastore.key([PET, parseInt(petID,10)]);
    datastore.get(key, function(err, entity){
        // define all default value for occupants from what was there
        let putRoom = entity.room;
        let putOwner = entity.owner;
        const updatedPet = {"name": reqBody.name, "species": reqBody.species, "color": reqBody.color, "owner": putOwner, "room": putRoom};
        console.log(updatedPet);
        console.log(key.id);
        datastore.save({"key":key, "data":updatedPet}); 
    });
}

/** 
 * Function delete_pet used to delete a pet
 * @param   {string}  petId       The pet that needs to be deleted
*/
function delete_pet(id){
    const key = datastore.key([PET, parseInt(id,10)]);
    return datastore.delete(key);
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

// route to create a pet
router.post('/', function(req, res){

    // check that the request header accepts is correct mime type (json)
    var accepts = req.accepts('application/json');
    if(!accepts){
        // send the 406, but go ahead and send the application/json as well
        res.status(406).set("Content-Type", "application/json").send('{\n"Error": "Only application\u2215json is acceptable."\n}').end();
        return;
    }

    // remove the "Bearer " prefix
    var userAuth = req.headers.authorization.slice(7);

    // function to validate the ID token from Google Auth Library for Node.js
    async function verify(){
        const ticket = await client.verifyIdToken({
            idToken: userAuth,
            audience: clientIDParam, 
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        userSub = userid;

        // call the post_boat function
        post_pet(req.body.species, req.body.color, req.body.name, userSub)
        .then( ([key, new_pet]) => {
            // add the id attribute
            new_pet.id = key.id;
            // add the self attribute for the pet
            new_pet.self = 'https' + '://' + req.get("host") + req.baseUrl + '/' + key.id;
            res.status(201).set("Content-type", "application/json").send(new_pet).end();
            return;
        
        });
    }
    verify().catch(function(error){
        if (error) {
            console.log(error);
            res.status(401).set("Content-type", "application/json").send('{\n"Error": "Invalid token signature"\n}');
        }
    });   
});

// route to get a single pet
router.get('/:id', function(req, res){

    // check that the request header accepts is correct mime type (json)
    var accepts = req.accepts('application/json');
    if(!accepts){
        // send the 406, but go ahead and send the application/json as well
        res.status(406).set("Content-Type", "application/json").send('{\n"Error": "Only application\u2215json is acceptable."\n}');
    }

    var userAuthGet = req.headers.authorization.slice(7);

    // function to validate the ID token from Google Auth Library for Node.js
    async function verify(){

        const ticket = await client.verifyIdToken({
            idToken: userAuthGet,
            audience: clientIDParam, 
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        userSub = userid;

        const pets = get_pets_without_pagination()
        .then( (pets) => {
                    
            try {
                // if there are no pets, this will trigger error
                //console.log(boats[0].name);
                var checkBoatExist = pets[0].name;
            } catch (error) {
                res.status(404).set("Content-Type", "application/json").send('{\n"Error": "No pets in datastore"\n}').end();
                return;
            }

            // check if the pet id requested actually exists
            var petExists = false;
            var userOwnsIt = false;
            var singlePet = {};

            // use a for loop for length of array to check each boat name
            for (let i = 0; i < pets.length; i++){
                if (pets[i].id == req.params.id) {
                    petExists = true;
                    
                }
                if (pets[i].id == req.params.id && pets[i].owner == userSub){
                    userOwnsIt = true;
                    singlePet.id = req.params.id;
                    singlePet.species = pets[i].species;
                    singlePet.color = pets[i].color;
                    singlePet.name = pets[i].name;
                    singlePet.room = pets[i].room;
                    singlePet.owner = pets[i].owner;

                }
            }  
            console.log("userSub:" + userSub);

            // name is found, but still need to check if the user owns the boat
            if (petExists == true) {
                console.log("petExists: " + petExists);
                
                // all checks have passed: jwt, boats in ds, boat_id exists, user owns the boat
                if (userOwnsIt == true) {
                    console.log("userOwnsIt: " + userOwnsIt);
    
                    if( typeof singlePet.room.name  === 'string') {                        // add self attribute for the room
                        singlePet.room.self = 'https' + '://' + req.get("host") + '/rooms' + '/' + singlePet.room.id;
                    }

                    singlePet.self = 'https' + '://' + req.get("host") + req.baseUrl + '/' + req.params.id;
                    res.status(200).set("Content-type", "application/json").send(singlePet);
                }
                // pet exists but user doesn't own it
                else {
                    // status 403
                    res.status(403).set("Content-Type", "application/json").send('{\n"Error": "No authorization to access this pet!"\n}').end();
                    console.log("4013 pet exist doesn't own");
                    return;
                }
            }
            // requested pet_id does not match and existing pet
            else {
                res.status(404).set("Content-Type", "application/json").send('{\n"Error": "No pet with that pet id exists."\n}').end();
                console.log("404 pet exist");
                return;
            }
        });
    }
    verify().catch(function(error){
        if (error) {
            console.log(error);
            res.status(401).set("Content-type", "application/json").send('{\n"Error": "Invalid token signature"\n}');
        }
    });
});

// route to get all the pets
router.get('/', function(req, res){

    console.log("in get all");


    // check that the accept request header is correct mime type (json)
    var accepts = req.accepts('application/json');
    if(!accepts){
        // send the 406, but go ahead and send the application/json as well
        res.status(406).set("Content-Type", "application/json").send('{\n"Error": "Only application\u2215json is acceptable."\n}');
    }

    // remove the "Bearer " prefix
    var userAuthGet = req.headers.authorization.slice(7);

    // function to validate the ID token from Google Auth Library for Node.js
    async function verify(){

        const ticket = await client.verifyIdToken({
            idToken: userAuthGet,
            audience: clientIDParam, 
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        userSub = userid;

        const items = get_pets_authorized(req, userSub)
        .then( (items) => {
            try {
                console.log(items.pets[0].name);

                for (let k = 0; k < items.pets.length; k++) {

                    // self link for the pet
                    items.pets[k].self = 'https' + '://' + req.get("host") + req.baseUrl + '/' + items.pets[k].id;
                    if( typeof items.pets[k].room.name  === 'string') {
                        // add self attribute to each object
                        items.pets[k].room.self = 'https' + '://' + req.get("host") + '/rooms' + '/' + items.pets[k].room.id;
                    }
                }
                const numberOfPets = get_pets_without_pagination()
                .then( (numberOfPets) => {
                    var filterThePets = numberOfPets.filter(userPets => userPets.owner == userSub);
                    var totalNumberPets = filterThePets.length;
                    items.total_pets = totalNumberPets;
                    res.status(200).set("Content-type", "application/json").json(items);

                });
            }
            catch (error) {
                res.status(200).set("Content-type", "application/json").send('User owns no pets.');
            }
        });
    }
    verify().catch(function(error){
        if (error) {
            console.log(error);
            res.status(401).set("Content-type", "application/json").send('{\n"Error": "Invalid token signature"\n}');
        }
    });

});

// route to PATCH a pet record
router.patch('/:pet_id', function(req, res){
    // remove the "Bearer " prefix
    var userAuth = req.headers.authorization.slice(7);

    console.log("in patch");

    // function to validate the ID token from Google Auth Library for Node.js
    async function verify(){
        const ticket = await client.verifyIdToken({
            idToken: userAuth,
            audience: clientIDParam, 
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        userSub = userid;

        // get all the pets and see if it exists
        const items = get_pets_without_pagination()
        .then( (items) => {
            for (let p = 0; p < items.length; p++){
                console.log('pet id ' + items[p].id);
                console.log('rq params id ' + req.params.pet_id);

                if (items[p].id == req.params.pet_id && items[p].owner == userSub) {                
                    // call the patch_update_pet function
                    patch_update_pet(req.body, req.params.pet_id)
                    res.location('https' + "://" + req.get('host') + req.baseUrl + '/' + req.params.pet_id);
                    res.status(204).end(); 
                    return; 
                }
            }
            res.status(404).set("Content-type", "application/json").send('{\n"Error": "User owns no pets with this pet_id"\n}');
        });
    }
    verify().catch(function(error){
        if (error) {
            console.log(error);
            res.status(401).set("Content-type", "application/json").send('{\n"Error": "Invalid token signature"\n}');
        }
    });   
});

// route to update a pet record via PUT
router.put('/:pet_id', function(req, res){
    // remove the "Bearer " prefix
    var userAuth = req.headers.authorization.slice(7);

    // function to validate the ID token from Google Auth Library for Node.js
    async function verify(){
        const ticket = await client.verifyIdToken({
            idToken: userAuth,
            audience: clientIDParam, 
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        userSub = userid;

        // get all the pets and see if it exists
        const items = get_pets_authorized(req, userSub)
        .then( (items) => {
            for (let p = 0; p < items.pets.length; p++){
                //console.log('pet id ' + items.pets[p].id);
                //console.log('rq params id ' + req.params.pet_id);

                if (items.pets[p].id == req.params.pet_id) {                
                    // call the patch_update_pet function
                    put_update_pet(req.body, req.params.pet_id)
                    res.location('https' + "://" + req.get('host') + req.baseUrl + '/' + req.params.pet_id);
                    res.status(204).end(); 
                    return; 
                }
            }
            res.status(404).set("Content-type", "application/json").send('{\n"Error": "User owns no pets with this pet_id"\n}');
        });
    }
    verify().catch(function(error){
        if (error) {
            console.log(error);
            res.status(401).set("Content-type", "application/json").send('{\n"Error": "Invalid token signature"\n}');
        }
    });   
});

// route for deleing a pet
router.delete('/:pet_id', function(req, res){

    // remove the "Bearer " prefix
    var userAuth = req.headers.authorization.slice(7);

    // function to validate the ID token from Google Auth Library for Node.js
    async function verify(){

        const ticket = await client.verifyIdToken({
            idToken: userAuth,
            audience: clientIDParam, 
        });

        const payload = ticket.getPayload();
        const userid = payload['sub'];
        userSub = userid;


        const petToDelete = get_one_pet(req.params.pet_id, userSub)
        .then( (petToDelete) => {
            // check that the pet exists
            try {
                var petTest = petToDelete[0];
                console.log(petTest.name);
                var roomToUpdate = petTest.room.id;
                update_room_info(req.params.pet_id, roomToUpdate);
                delete_pet(req.params.pet_id).then(res.status(204).end());


            } catch (error) {
                res.status(404).set("Content-type", "application/json").send('{\n"Error": "No pet with this pet id exists for current user."\n}');
            }
        });

    }
    verify().catch(function(error){
        if (error) {
            console.log(error);
            res.status(401).set("Content-type", "application/json").send('{\n"Error": "Invalid token signature"\n}');
        }
    });
});

// invalid DELETE method on root URL
router.delete('/', function (req, res){
    res.set('Allow', 'POST', 'GET');
    res.status(405).set("Content-Type", "application/json").send('{\n"Error": "Method not allowed."\n}');
});

// invalid PUT method on root URL
router.put('/', function (req, res){
    res.set('Allow', 'POST', 'GET');
    res.status(405).set("Content-Type", "application/json").send('{\n"Error": "Method not allowed."\n}');
});

// invalid PATCH method on root URL
router.patch('/', function (req, res){
    res.set('Allow', 'POST', 'GET');
    res.status(405).set("Content-Type", "application/json").send('{\n"Error": "Method not allowed."\n}');
});

/* ------------- End Controller Functions ------------- */

module.exports = router;
