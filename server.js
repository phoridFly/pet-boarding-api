/**************************************************************************************************
 * John Hash
 * CS 493 Cloud Development Spring 2020
 * Portfolio Assignment: Final Project
 * Created: June 1, 2020
 * Last Modifed: June 7, 2020
 * 
 * server.js
 * This server file is responsible for setting up the server, handling the welcome, and 
 * handling the login pages for creating a user account and showing the user their id and JWT.
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

 // boilerplate for setting up express, express handlebars, and connecting to the google datastore
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ds = require('./datastore');
const datastore = ds.datastore;
const {Datastore} = require('@google-cloud/datastore');
// axios for sending requests from node
const axios = require('axios').default;
var expressHB = require('express-handlebars');
app.engine('handlebars', expressHB());
app.set('view engine', 'handlebars');
app.use(bodyParser.json());
// using a public folder for CSS
app.use(express.static('public'));
// using the index js file for setting routers for 'rooms' and 'pets'
app.use('/', require('./index'));


// details needed for authorization and authentication
const clientIDParam = [client id here]
const redirectURIParam = "https://hashj-project.wl.r.appspot.com/user-info";
const scopeParam = "profile";
var stateParam = "";
var userIdToken = "";
var userSub = "";
const peopleApiUrl = "https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses";
const googleOauth = "https://oauth2.googleapis.com/token";
const clientSecrectParam = [client secret];
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(clientIDParam);

const USER = "User";


/** 
 * Function makeRandomState takes a number for lthe length of the random string and returns a random string
 * @param   {number}   len  Length of desired string           
 * @returns {string}        Returns an array of user entities.
*/
function makeRandomState (len) {
  let stringy = '';
  let possibilities = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < len; i++) {
      stringy = stringy + possibilities.charAt(Math.floor(Math.random() * possibilities.length));
  }
  return stringy;
}

function fromDatastore(item){
  item.id = item[Datastore.KEY].id;
  return item;
}

/* ------------- Begin User Model Functions ------------- */

/** 
 * Function post_user creates a new User Entity in the Google datastore
 * @param   {string}   first    User first name
 * @param   {string}   last     User last name         
 * @param   {number}   user_id  User unique identifier        
 *          
 * @returns {object}            Returns record of new user.
 */
function post_user(first, last, user_id, ){
  var key = datastore.key(USER);
  const new_user = {"First": first, "Last": last, "user_id": user_id};
  return datastore.save({"key":key, "data":new_user});
}

/** 
 * Function get_users takes no params and creates a query to get all users in ds
 * @returns {array}           Returns an array of user entities.
*/
function get_users(){
	const q = datastore.createQuery(USER);
	return datastore.runQuery(q).then( (entities) => {
		return entities[0].map(fromDatastore);
	});
}

/* ------------- End User Model Functions ------------- */

/* ------------- Begin User Controller Functions ------------- */

// root URL that gets user to the welcome page
app.get('/account', function(req, res){
  stateParam = makeRandomState(12);
  res.render('home', {
      // parameters that are needed to build the URL to Google OAuth 2.0 server
      state: stateParam,
      clientID: clientIDParam,
      redirectURI: redirectURIParam,
      scope: scopeParam
  });
 
});

// redirect URL to page that shows user information including unique ID and JWT
app.get('/user-info', (req, res) => {
  // first check if the state parameter sent orginally from client matches what server returns
  // if not, do not proceed
  if (req.query.state == stateParam) {
      // redirect request has the access code in the code parameter, decode it
      var googleAccessCode = req.query.code;
      var googleAccessCodeFixed = decodeURIComponent(googleAccessCode);
      console.log('googleAccessCode :' + googleAccessCodeFixed);

      // make the POST request to get the Token
      axios({
          method: 'post',
          url: `${googleOauth}?&code=${googleAccessCodeFixed}&client_id=${clientIDParam}&redirect_uri=${redirectURIParam}&grant_type=authorization_code&client_secret=${clientSecrectParam}`

      // from the response, pull the Token from response body and make a GET request to People API
      }).then((authResponse) => {
          var userAccessToken = authResponse.data.access_token;
          userIdToken = authResponse.data.id_token;
          console.log('userAccessToken :' + userAccessToken);
          console.log('userIdToken: ' + userIdToken);

          // function to validate the ID token from Google Auth Library for Node.js
          async function verify(){
              const ticket = await client.verifyIdToken({
                 idToken: userIdToken,
                 audience: clientIDParam, 
              });
              const payload = ticket.getPayload();
              const userid = payload['sub'];
              userSub = userid;
              console.log("sub: " + userid);

          }
          verify().catch(console.error);

          // GET request to People API
          axios({
            method: 'get',
            url: peopleApiUrl,
            headers: {
                Authorization: 'Bearer ' + userAccessToken
            }
          
          // pull the first and last name from the JSON response body
          }).then(function(APIresponse) {
            var userLastName = APIresponse.data.names[0].familyName;
            var userFirstName = APIresponse.data.names[0].givenName;

            const users = get_users()
	          .then( (users) => {
              // use a for loop for length of array to add self to each object in array
              var userFound = false;
              for (i = 0; i < users.length; i++){
                if(users[i].user_id == userSub) {
                  userFound = true;
                }
              }

              if (userFound == true) {
                res.render('user-info-found', {
                  firstName: userFirstName,
                  lastName: userLastName,
                  jwt: userIdToken,
                  uniqueID: userSub
                })
              }
              else {
                //call function to add user entity to datastore
                post_user(userFirstName, userLastName, userSub);
                // render the page showing the user information
                res.render('user-info', {
                  firstName: userFirstName,
                  lastName: userLastName,
                  jwt: userIdToken,
                  uniqueID: userSub
                });
              }

            });
          });
      });
  }
  else {
      res.send("Could not confirm value of State Variable.");
  }
});

// route to get all the users
app.get('/users', function(req, res){

   // check that the request header accepts is correct mime type (json)
   var accepts = req.accepts('application/json');
   if(!accepts){
       // send the 406, but go ahead and send the application/json as well
       res.status(406).set("Content-Type", "application/json").send('{\n"Error": "Only application\u2215json is acceptable."\n}');
   }

  const users = get_users()
  .then( (users) => {

      res.status(200).set("Content-Type", "application/json").send(users);
  });
});

/* ------------- End User Controller Functions ------------- */

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
