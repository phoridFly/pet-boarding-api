/**************************************************************************************************
 * John Hash
 * CS 493 Cloud Development Spring 2020
 * Portfolio Assignment: Final Project
 * Created: June 1, 2020
 * Last Modifed: June 7, 2020
 * 
 * rooms.js
 * This file handles all the endpoints for creating, reading, updating, and deleting Room Entities.
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
const {OAuth2Client} = require('google-auth-library');
const clientIDParam = [client id here];
const client = new OAuth2Client(clientIDParam);
router.use(bodyParser.json());


const ROOM = "Room";
const PET = "Pet";
const ROOM_ATTRIBUTES = 4;

/** 
 * Function reqFull checks if request has proper number of attributes for the kind.
 * @param  {object}     requestBod   The request body sent by user.
 * @param  {constant}   atributNum   Constant set for number of attributes expected.
 * @returns {boolean}                True if number matches, false if it doesn't.
*/
function reqFull(requestBod, attributNum) {
    let reqOK = true;
    if (Object.keys(requestBod).length != attributNum) {
        reqOK = false;
    }
    return reqOK;
}

/** 
 * Function check_status is a general purpose function to return an entity given an id and kind
 * @param   {string}     id     ID of entity
 * @param   {string}     kind   Type of entity. Use one of the constants
 * @returns {object}            The entity.
*/
function check_status (id, kind){
    const q = datastore.key([kind, parseInt(id,10)]);
    return datastore.get(q);
}

/* ------------- Begin Room Model Functions ------------- */
/** 
 * Function post_room creates and saves a new room to ds
 * @param  {string}   name    String for the new room's name.
 * @param  {string}   type    String for description of type of room.
 * @param  {string}   size    String for size of room.
 * @param  {number}   rate    Decimal value for cost per night for room.
 * @returns {array}           Returns entity key and new room data in an array.
*/
function post_room(name, type, size, rate){
    var key = datastore.key(ROOM);
    const new_room = {"name": name, "type": type, "size": size, "occupants": [], "rate": rate};
    return datastore.save({"key":key, "data":new_room}).then(() => {return ([key, new_room])});
}

/** 
 * Function get_one_room takes and id and returns that entity
 * @param  {string}     id    The id that the user wants to check for.
 * @returns {array}           Returns an entity in an array.
*/
function get_one_room(id) {
    const q = datastore.key([ROOM, parseInt(id,10)]);
    return datastore.get(q);
}

/** 
 * Function get_rooms_without_pagination doesn't use Pagination takes no params and creates a query to get all rooms in ds
 * @returns {array}           Returns an array of room entities.
*/
function get_rooms_without_pagination(){
	const q = datastore.createQuery(ROOM);
	return datastore.runQuery(q).then( (entities) => {
		return entities[0].map(ds.fromDatastore);
	});
}

/** 
 * Function get_rooms uses Pagination takes a request object and returns object with two attributes (rooms, next link) limit 5
 * @param   {object}     req  The GET request
 * @returns {object}          Returns and object w/ two attributes array of "rooms" and "next" link
*/
function get_rooms(req){
    var q = datastore.createQuery(ROOM).limit(5);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
	return datastore.runQuery(q).then( (entities) => {
        results.rooms = entities[0].map(ds.fromDatastore);
        if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
            results.next = 'https' + "://" + req.get("host") + req.baseUrl + "?cursor=" + encodeURIComponent(entities[1].endCursor);
        }
        return results;
    });
}

/** 
 * Function delete_room takes an id for room to be deleted
 * @param  {string}     room_id    The id of room entity to delete.
*/
function delete_room(room_id){
    const key = datastore.key([ROOM, parseInt(room_id,10)]);
    return datastore.delete(key);
}

/** 
 * Function put_pet_in_room updates the occupants array on a room with a new pet occupant
 * @param   {string}     roomID    Room pet is going into
 * @param   {string}     petID     Pet's id
 * @param   {string}     userSub   Pet owner's id
 * @param   {string}     name      The pet's name
 * @returns {object}               Returns and object w/ two attributes array of "rooms" and "next" link
*/
function put_pet_in_room(roomID, petID, userSub, name){
    const room_key = datastore.key([ROOM, parseInt(roomID,10)]);
    return datastore.get(room_key)
    .then( (rooms) => {
        rooms[0].occupants.push({"id": petID, "owner": userSub, "name": name});
        return datastore.save({"key":room_key, "data":rooms[0]})
        .then(() => {return ([room_key, rooms])});
    });
}

/** 
 * Function remove_pet_from_room used remove the pet with the given id from the occupants array in the room
 * @param   {string}  roomId      The room that needs to be updated
 * @param   {string}  petId       The room that needs to be removed from the room
*/
function remove_pet_from_room(roomID, petID){
    const room_key = datastore.key([ROOM, parseInt(roomID,10)]);
    return datastore.get(room_key)
    .then( (rooms) => {
        const room = rooms[0];
        // the array of occupants currently in the room
        var initiaOccupantsArray = room.occupants;
        // filter for the petID number and save new array without that pet
        var updatedOccupantsArray = initiaOccupantsArray.filter(function(occupants) {
            return occupants.id != petID;
        });
        const room_update = {"name": room.name, "type": room.type, "size": room.size, "rate": room.rate, "occupants": updatedOccupantsArray } ;
        return datastore.save({"key": room_key, "data": room_update});
    });
}

/** 
 * Function update_room used to add a room id and room name to the room attribute of the pet when the pet is moved to a room
 * @param   {string}  roomId      The room that pet is moving to
 * @param   {string}  petId       The id of the pet
 * @param   {string}  roomName    Name of the room the pet is moving to
 * @returns {array}               Array with two elements - key, and updated pet object
*/
function update_room(roomID, roomName, petID){
    const key = datastore.key([PET, parseInt(petID,10)]);
    return datastore.get(key)
    .then ( (pets) => {
        const pet = pets[0];
	    const pet_update = {"species": pet.species, "name": pet.name, "color": pet.color, "owner": pet.owner, "room": {"id": roomID, "name": roomName}};
        return datastore.save({"key":key, "data":pet_update}).then(() => {return ([key, pet_update])});

    });
}

/** 
 * Function patch_update_room used to update attributes inherent to the room
 * @param   {string}  roomId      The room that needs to be updated
 * @param   {object}  reqBody     The body of the patch request
*/
function patch_update_room(reqBody, roomID){
    var key = datastore.key([ROOM, parseInt(roomID,10)]);
    datastore.get(key, function(err, entity){
        // define all default values based on what is already there
        let patchName = entity.name;
        let patchType = entity.type;
        let patchSize = entity.size;
        let patchRate = entity.rate;
        let patchOccupants = entity.occupants;

        // logic of checking if the the attributes are in the body
        // if in the request body, then replace
        if (typeof reqBody.name !== 'undefined') {
            patchName = reqBody.name;
        }
        if (typeof reqBody.type !== 'undefined') {
            patchType = reqBody.type;
        }
        if (typeof reqBody.size !== 'undefined') {
            patchSize = reqBody.size;
        }
        if (typeof reqBody.rate !== 'undefined') {
            patchRate = reqBody.rate;
        }
        const patchedRoom = {"name": patchName, "type": patchType, "rate": patchRate, "size": patchSize, "occupants": patchOccupants};
        console.log(patchedRoom);
        console.log(key.id);
        datastore.save({"key":key, "data":patchedRoom});
    });
}

/** 
 * Function put_update_room used to update attributes inherent to the room
 * @param   {string}  roomId      The room that needs to be updated
 * @param   {object}  reqBody     The body of the put request
*/
function put_update_room(reqBody, roomID){
    var key = datastore.key([ROOM, parseInt(roomID,10)]);
    datastore.get(key, function(err, entity){
        // define all default value for occupants from what was there
        let putOccupants = entity.occupants;
        const updatedRoom = {"name": reqBody.name, "type": reqBody.type, "rate": reqBody.rate, "size": reqBody.size, "occupants": putOccupants};
        console.log(updatedRoom);
        console.log(key.id);
        datastore.save({"key":key, "data":updatedRoom}); 
    });
}

/** 
 * Function update_pet_room_attribute used to update the room attribute of pet when it is removed from a room
 * @param   {string}  pet Id      The pet that needs to be updated
*/
function update_pet_room_attribute( petID){
    var key = datastore.key([PET, parseInt(petID,10)]);
    datastore.get(key, function(err, entity){
        // define all default values based on what is already there
        let patchName = entity.name;
        let patchSpecies = entity.species;
        let patchColor = entity.color;
        let patchOwner = entity.owner;
        const patchedPet = {"name": patchName, "species": patchSpecies, "color": patchColor, "owner": patchOwner, "room": {}};
        datastore.save({"key":key, "data":patchedPet});
    });
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

// route to post a room
router.post('/', function(req, res){

    // check that the request header accepts is correct mime type (json)
    var accepts = req.accepts('application/json');
    if(!accepts){
        // send the 406, but go ahead and send the application/json as well
        res.status(406).set("Content-Type", "application/json").send('{\n"Error": "Only application\u2215json is acceptable."\n}').end();
        return;
    }

    // reqFull true means that the correct, full number of attributes are present in request body
    if (reqFull(req.body, ROOM_ATTRIBUTES) == true){
        post_room(req.body.name, req.body.type, req.body.size, req.body.rate)
        .then( ([key, new_room]) => {
            // add the "id" attribute to the json object
            new_room.id = key.id;
            // add on the "self" attribute for room
            new_room.self = 'https' + '://' + req.get("host") + req.baseUrl + '/' + key.id;
            res.status(201).send(new_room);
        });
    }
    else {
        res.status(400).set("Content-Type", "application/json").send('{\n"Error": "The request object is missing at least one of the required attributes"\n}');
    }
});

// route to get a single room
router.get('/:id', function(req, res){

    // check that the request header accepts is correct mime type (json)
    var accepts = req.accepts('application/json');
    if(!accepts){
        // send the 406, but go ahead and send the application/json as well
        res.status(406).set("Content-Type", "application/json").send('{\n"Error": "Only application\u2215json is acceptable."\n}');
    }
    const oneRoom = get_one_room(req.params.id)
    .then( (oneRoom) => {
        try {
            // add on the required attributes to the json object
            console.log(oneRoom[0].name);
            if (typeof (oneRoom[0].name[0]) !== 'undefined') {
                for (i = 0; i < oneRoom[0].occupants.length; i++){
                    console.log(oneRoom[0].occupants.length);
                    console.log(oneRoom[0].occupants[i]);
                    // add self attribute to each object
                    oneRoom[0].occupants[i].self = 'https' + '://' + req.get("host") + '/pets' + '/' + oneRoom[0].occupants[i].id;
                }
            }
            console.log(oneRoom[0]);
            oneRoom[0].self = 'https' + '://' + req.get("host") + req.baseUrl + '/' + req.params.id;
            res.status(200).send(oneRoom[0]);
        } catch (error) {
            res.status(404).set("Content-Type", "application/json").send('{\n"Error": "No room with this room_id exists"\n}');
        }           
    });
});

// route to get all the rooms
router.get('/', function(req, res){

    // check that the request header accepts is correct mime type (json)
    var accepts = req.accepts('application/json');
    if(!accepts){
        // send the 406, but go ahead and send the application/json as well
        res.status(406).set("Content-Type", "application/json").send('{\n"Error": "Only application\u2215json is acceptable."\n}');
    }

    const items = get_rooms(req)
	.then( (items) => {

        for (let k = 0; k < items.rooms.length; k++) {

            // self link for the room
            items.rooms[k].self = 'https' + '://' + req.get("host") + req.baseUrl + '/' + items.rooms[k].id;
            
            if( typeof(items.rooms[k].occupants[0]) !== 'undefined') {
                for (i = 0; i < items.rooms[k].occupants.length; i++){
                    // add self attribute to each object
                    items.rooms[k].occupants[i] = 'https' + '://' + req.get("host") + '/pets' + '/' + items.rooms[k].occupants[i].id;
                }
            }

        }
        const numberOfRooms = get_rooms_without_pagination()
        .then( (numberOfRooms) =>{
            var totalNumber = numberOfRooms.length;
            items.total_rooms = totalNumber;
            res.status(200).set("Content-Type", "application/json").json(items);

        });
    });
});

// route to add a pet to a room
router.put('/:room_id/pets/:pet_id', function(req, res){
    // extract the token from the auth header and remove "Bearer "
    var userAuth = req.headers.authorization.slice(7);

    // check if the requested room exists
    const roomStatus = check_status(req.params.room_id, ROOM)
    .then( (roomStatus) => {
        try {
            // check that the requested room exists, otherwise jump to catch 404
            var roomTest = {};
            roomTest.name = roomStatus[0].name;
            const petStatus = check_status(req.params.pet_id, PET)
            .then( (petStatus) => {
                try {
                    var petTest = {};
                    petTest.content = petStatus[0].content;
                    // check if pet has a room
                    if (typeof(petStatus[0].room.id) === 'undefined'){

                        // function to validate the ID token from Google Auth Library for Node.js
                        async function verify(){
                            const ticket = await client.verifyIdToken({
                                idToken: userAuth,
                                audience: clientIDParam, 
                            });
                            const payload = ticket.getPayload();
                            const userid = payload['sub'];
                            userSub = userid;

                            // check if the room has occupants whose owners are not the user
                            if (typeof roomStatus[0].occupants !== 'undefined'){
                                for (let s = 0; s < roomStatus[0].occupants.length; s++){
                                    if (roomStatus[0].occupants[s].owner != userSub){
                                        res.status(403).set("Content-type", "application/json").send('{\n"Error": "This room is in use by another pet owner. Pick another room number."\n}').end();
                                        return; 
                                    }
                                }
                            }

                            // check if the user owns the pet in question
                            if (userSub == petStatus[0].owner) {
                           
                                put_pet_in_room(req.params.room_id, req.params.pet_id, userSub, petStatus[0].name)
                                .then( ([key, updated_room]) => {
                                
                                // CALL A function to update the room attribute on pet
                                update_room(req.params.room_id, updated_room[0].name, req.params.pet_id)
                                .then( ([pet_key, updated_pet]) => {
                                });
                                res.status(204).end();
                            });
                            }
                            else {

                                res.status(403).set("Content-type", "application/json").send('{\n"Error": "You are not authorized to access this pet."\n}').end();
                                return; 
                            }
                        }
                        verify().catch(function(error){
                            if (error) {
                                console.log(error);
                                res.status(401).set("Content-type", "application/json").send('{\n"Error": "Invalid token signature"\n}');
                            }
                        }); 
                    }
                    // if not:
                    else {
                        // pet exists but on another room
                        res.status(403).set("Content-type", "application/json").send('{\n"Error": "The pet with this pet_id is already in a room"\n}');
                    }
                } catch (error) {
                    // room does exist, pet does not exist
                    res.status(404).set("Content-type", "application/json").send('{\n"Error": "The specified room and/or pet don\u2019t exist"\n}'); 
                }
            });
        } catch (error) {
            // room does not exist, pet may or may not exist
            res.status(404).set("Content-type", "application/json").send('{\n"Error": "The specified room and/or pet don\u2019t exist"\n}');
        }
    }); 
});

// route to remove a pet from a room
router.delete('/:room_id/pets/:pet_id', function(req, res){
    // extract the token from the auth header and remove "Bearer "
    var userAuth = req.headers.authorization.slice(7);

    // check if the requested room exists
    const roomInQuestion = check_status(req.params.room_id, ROOM)
    .then( (roomInQuestion) => {
        try {
            // check that the requested room exists, otherwise jump to catch 404
            var roomTest = {};
            roomTest.name = roomInQuestion[0].name;

            // function to validate the ID token from Google Auth Library for Node.js
            async function verify(){
                const ticket = await client.verifyIdToken({
                    idToken: userAuth,
                    audience: clientIDParam, 
                });
                const payload = ticket.getPayload();
                const userid = payload['sub'];
                userSub = userid;

                var petFound = false;
                // get all the pets in that room and check if it matches pet id, and the owner matches the token 'sub'
                for (let p = 0; p < roomInQuestion[0].occupants.length; p++) {
                    if (roomInQuestion[0].occupants[p].id == req.params.pet_id && roomInQuestion[0].occupants[p].owner == userSub) {
                        petFound = true;
                    }
                }

                // proceed with updating the record
                if (petFound == true) {
                    // call remove_pet_from_room
                    remove_pet_from_room(req.params.room_id, req.params.pet_id)
                    .then(() => {
                        // call update_pet_room_attribute
                        update_pet_room_attribute(req.params.pet_id);
                        res.status(204).end();
                        return;
                    });
                }
                else {
                    res.status(404).set("Content-type", "application/json").send('{\n"Error": "The specified pet is not in that room"\n}');
                }
            }
            verify().catch(function(error){
                if (error) {
                    console.log(error);
                    res.status(401).set("Content-type", "application/json").send('{\n"Error": "Invalid token signature"\n}');
                }
            }); 
        } catch (error) {
            // room does not exist, pet may or may not exist
            res.status(404).set("Content-type", "application/json").send('{\n"Error": "The specified room does not exist"\n}');
        }
    }); 
});

// route to update a room via PATCH
router.patch('/:room_id', function(req, res) {
    const roomToPatch = get_one_room(req.params.room_id)
    .then ((roomToPatch) => {
        // check if the foom exists
        try {
            var roomTest = roomToPatch[0];
            console.log("IM HERE " + roomTest.name);
            patch_update_room(req.body, req.params.room_id);
            
            res.location('https' + "://" + req.get('host') + req.baseUrl + '/' + req.params.room_id);
            res.status(204).set("Content-Type", "application/json").end();

        } catch (error) {
            res.status(404).set("Content-Type", "application/json").send('{\n"Error": "No room with this room_id exists"\n}');
        }
    });
});

// route to update a room via PUT
router.put('/:room_id', function(req, res) {
    const roomToUpdate = get_one_room(req.params.room_id)
    .then ((roomToUpdate) => {
        // check if the foom exists
        try {
            var roomTest = roomToUpdate[0];
            console.log("IM HERE " + roomTest.name);
            put_update_room(req.body, req.params.room_id);
            
            res.location('https' + "://" + req.get('host') + req.baseUrl + '/' + req.params.room_id);
            res.status(204).set("Content-Type", "application/json").end();

        } catch (error) {
            res.status(404).set("Content-Type", "application/json").send('{\n"Error": "No room with this room_id exists"\n}');
        }
    });
});

// route to delete a room
router.delete('/:room_id', function(req, res){
    const roomToDelete = get_one_room(req.params.room_id)
    .then( (roomToDelete) => {
        // check that the room exists
        try {
            var roomTest = roomToDelete[0];
            console.log(roomTest.occupants);
            console.log(roomTest.occupants.length);
            // first, remove any pets the room may have
            if (roomTest.occupants.length > 0) {
                res.status(403).set("Content-Type", "application/json").send('{\n"Error": "Occupants of room must be removed before room can be deleted."\n}');
                return;

            }
            else {
                // then delete the room
                delete_room(req.params.room_id).then(res.status(204).end());
            }
        } catch (error) {
            res.status(404).set("Content-Type", "application/json").send('{\n"Error": "No room with this room_id exists"\n}');
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
