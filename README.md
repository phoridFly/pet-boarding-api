#
## Portfolio Assignment

John Hash (hashj)

Pet Boarding API

CS 493: Cloud Application Development

Spring 2020

Oregon State University

Last Update: June 7, 2020. 12:00 pm Pacific

Base URL for all API endpoints https://hashj-project.wl.r.appspot.com

URL for account creation/login https://hashj-project.wl.r.appspot.com/account

[Change log 1](#_Toc42442198)

[Data Model 2](#_Toc42442199)

[API Specification 5](#_Toc42442200)

[View All Users 5](#_Toc42442201)

[Create a Room 6](#_Toc42442202)

[View a Single Room 7](#_Toc42442203)

[View All Rooms 9](#_Toc42442204)

[Update a Room Via PATCH 10](#_Toc42442205)

[Update a Room Via PUT 11](#_Toc42442206)

[Delete a Room 12](#_Toc42442207)

[Create a Pet 14](#_Toc42442208)

[View a Pet 16](#_Toc42442209)

[View All Pets 17](#_Toc42442210)

[Update a Pet Via PATCH 19](#_Toc42442211)

[Update a Pet Via PUT 20](#_Toc42442212)

[Delete a Pet 22](#_Toc42442213)

[Assign a Pet to a Room 23](#_Toc42442214)

[Remove a Pet From a Room 25](#_Toc42442215)

[405 and 406 Status Codes: Methods and Media Types Not Allowed 26](#_Toc42442216)

# Change log

| **Page** | **Change** | **Date** |
| --- | --- | --- |
|
 | Initial version. | May 27, 2020 |
|
 | Version submitted | June 7, 2020 |

# Data Model

## Entity: User

These properties cannot be set by the user. They are either automatically generated by the Google Datastore or derived from the user&#39;s Google Account.

| **Property** | **Type** | **Valid Values** | **Description** | **Required?** |
| --- | --- | --- | --- | --- |
| id | String | Arabic numerals 0-9, 16 in length | Generated by Google Datastore upon creation of user. | Yes |
| user\_id | String | Arabic numerals 0-9, less than 23 in length | Generated from the JSON Web Token &#39;sub&#39; field upon creation of a new account when user is authenticated through Google OAuth 2.0 API. | Yes |
| First | String | English letters, a-z or A-Z, less than 20 in length | First name of user. Name is fetched from Google People API upon creation of new account when user is authenticated through Google OAuth 2.0 API. | Yes |
| Last | Number | English letters, a-z or A-Z, less than 20 in length | Last name of user. Name is fetched from Google People API upon creation of new account when user is authenticated through Google OAuth 2.0 API. | Yes |

###

## Entity: Pet

The first three properties listed are the inherent properties to a Pet Entity. These are the properties under control when creating or updating a Pet Entity. Pet Entities can be created or updated without specifying values for these properties, but they really should be given values otherwise their value will be null.

| **Property** | **Type** | **Valid Values** | **Description** | **Required?** |
| --- | --- | --- | --- | --- |
| species | String | English letters and spaces, a-z or A-Z, less than 20 in length | The kind of animal that the pet is. | Not enforced, but strongly recommended |
| color | String | English letters and spaces, a-z or A-Z, less than 20 in length | The color of the animal that is used for identification purposes. | Not enforced, but strongly recommended |
| name | String | English letters and spaces, a-z or A-Z, less than 20 in length | What the pet is called by the owner. | Not enforced, but strongly recommended |

The next three properties listed are automatically created when the Pet Entity is created.

| **Property** | **Type** | **Valid Values** | **Description** | **Required?** |
| --- | --- | --- | --- | --- |
| owner (relationship) | String | Arabic numerals 0-9, less than 23 in length | The user\_id of the pet&#39;s owner | Yes |
| room (relationship) | Object | JSON object attributes-begins empty on creation-once pet is assigned to room, &quot;id&quot; of room and &quot;name&quot; of room are stored in the object | Description of the room that the pet is currently in. | Yes |
| id | String | Arabic numerals 0-9, 16 in length | Generated by Google Datastore upon creation of user. | Yes |

## Entity: Room

The first four properties listed are the inherent properties to a Room Entity. These are the properties under control when creating or updating a Room Entity. Room Entities can be created or updated without specifying values for these properties, but they really should be given values otherwise their value will be null.

| **Name** | **Type** | **Valid Values** | **Description** | **Required?** |
| --- | --- | --- | --- | --- |
| type | String | English letters and spaces, a-z or A-Z, less than 20 in length | The kind of room. | Not enforced, but strongly recommended |
| name | String | English letters and spaces, a-z or A-Z, less than 20 in length | What the room is called. | Not enforced, but strongly recommended |
| size | Number | Arabic numerals 0-9, up to 999 | The area of the room in square feet. | Not enforced, but strongly recommended |
| rate | Number (decimal) | Arabic numerals 0-9 and radix, up to 99.99 | The price of the room per night | Not enforced, but strongly recommended |

The next two properties listed are automatically created when a Room Entity is created.

| **Property** | **Type** | **Valid Values** | **Description** | **Required?** |
| --- | --- | --- | --- | --- |
| id | String | Arabic numerals 0-9, 16 in length | Generated by Google Datastore upon creation of user. | Yes |
| occupants (relationship) | Array | Array populated with JSON objects-begins empty on creation-once pet is assigned to room, &quot;id&quot; of pet and &quot;name&quot; of of are stored an object in the array | Description of the room that the pet is currently in. | Yes |

## Relationship Summary

Figure 1 shows a simple ERD that summaries the relationships among the three entities.

Users can own 0 to many pets. Pets can have only one owner.

Pets can reside in 0 or only one room. A room can hold 0 to many pets.

![](RackMultipart20200611-4-tgzhne_html_9b351a812c23f976.png) Figure 1. ERD showing entities, their properties, and relationships.

## Relationship Rules

1) Pets are protected and can only be created, read, updated, or deleted by their authenticated owner.

2) Rooms are unprotected. They can be created, read, updated, or deleted by non-authenticated users.

3) Rooms can only be deleted if no pets are in them.

4) Pets can only reside in rooms with pets of the same owner, and the number of pets placed in the same room is not limited.

5) Relationship properties cannot be changed through PATCH and PUT update operations on room in order to protect the pet relationships.

# API Specification

Details for all the valid endpoints for the Pet Boarding API are listed below.

# View All Users

List all the current user accounts.

| GET /users |
| --- |

## Request

### Request Parameters

None

### Request Body

None

### Request Header : Accept

&quot;Accept&quot; header value must be &#39;application/json&#39;

## Response

### Response Body Format

JSON

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 200 OK |
 |

### Response Examples

- An attribute for self is automatically created in the response for each registered user.

#### Success

| Status: 200 OK
[{&quot;user\_id&quot;: &quot;114614630321977629406&quot;,&quot;First&quot;: &quot;Christa&quot;,&quot;Last&quot;: &quot;Hash&quot;,&quot;id&quot;: &quot;5117579211309056&quot;,&quot;self&quot;: &quot;https://localhost:8080/5117579211309056&quot;},{&quot;user\_id&quot;: &quot;114791681322698322383&quot;,&quot;First&quot;: &quot;John M&quot;,&quot;Last&quot;: &quot;Hash&quot;,&quot;id&quot;: &quot;5631671361601536&quot;,&quot;self&quot;: &quot;https://localhost:8080/5631671361601536&quot;}] |
| --- |

# Create a Room

Allows for creation of a new room entity.

| POST /rooms |
| --- |

## Request

### Request Parameters

None

### Request Body

Required

### Authorization

None

### Request Header : Accept

&quot;Accept&quot; header value must be &#39;application/json&#39;

### Request Body Format

JSON

### Request JSON Attributes

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| type | String | The kind of room. | Yes |
| name | String | What the room is called. | Yes |
| size | Number | The area of the room in square feet. | Yes |
| rate | Number | The price of the room per night. | Yes |

###

### Request Body Example

| {&quot;type&quot;: &quot;Standard Suite&quot;,&quot;name&quot;: &quot;Bay View&quot;,&quot;size&quot;: 48, &quot;rate&quot;: 39.99} |
| --- |

## Response

### Response Body Format

Success: &#39;application/json&#39;

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 201 Created |
 |

### Response Examples

- Datastore will automatically generate an ID and store it with the room being created.
- The self attribute will contain the live link to the REST resource corresponding to this room. The self attribute is not stored in Datastore but is generated for the response only.
- A newly created room entity will contain a occupants attribute with a single empty array.

#### Success

| Status: 201 Created
{&quot;id&quot;: &quot;abc123&quot;,&quot;name&quot;: &quot;Bay View&quot;,&quot;type&quot;: &quot;Standard Suite&quot;, &quot;rate&quot;: 39.99,&quot;size&quot;: 48,&quot;occupants&quot;:[],&quot;self&quot;: &quot;https://base-url/rooms/abc123&quot;} |
| --- |

####

# View a Single Room

Allows for retrieving a record for a single existing room.

| GET /rooms/:room\_id |
| --- |

## Request

### Request Parameters

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| room\_id | String | ID of the room | Yes |

### Request Body

None

### Request Header : Accept

&quot;Accept&quot; header value must be &#39;application/json&#39;

## Response

### Response Body Format

Success: JSON

Failure: JSON

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 200 OK |
 |
| Failure | 404 Not Found | No room with this room\_id exists |

### Response Examples

- An attribute for self is automatically created in the response for both the boat and each of the loads currently assigned to the room.

#### Success

| Status: 200 OKExample of a room returned with no occupants yet assigned{&quot;id&quot;: &quot;abc123&quot;,&quot;name&quot;: &quot;Bay View&quot;,&quot;type&quot;: &quot;Standard Suite&quot;, &quot;rate&quot;: 39.99,&quot;size&quot;: 48,&quot;occupants&quot;:[],&quot;self&quot;: &quot;https://base-url/rooms/abc123&quot;}Example of a room returned with two occupants currently assigned{&quot;id&quot;: &quot;abc123&quot;,&quot;name&quot;: &quot;Bay View&quot;,&quot;type&quot;: &quot;Standard Suite&quot;, &quot;rate&quot;: 39.99,&quot;size&quot;: 48,&quot;occupants&quot;:[{&quot;id&quot;: &quot;5701666712059904&quot;,&quot;self&quot;: &quot;http://localhost:8080/loads/5701666712059904&quot;},{&quot;id&quot;: &quot;6278060542263296&quot;,&quot;self&quot;: &quot;http://localhost:8080/loads/6278060542263296&quot;}],
&quot;self&quot;: &quot;https://base-url/rooms/abc123&quot;}
 |
| --- |

#### Failure

| Status: 404 Not Found
{ &quot;Error&quot;: &quot;No room with this room\_id exists&quot; } |
| --- |

# View All Rooms

List all the rooms currently in the datastore and their attributes.

| GET /rooms |
| --- |

## Request

### Request Parameters

None

### Request Body

None

### Request Header : Accept

&quot;Accept&quot; header value must be &#39;application/json&#39;

## Response

### Response Body Format

JSON

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 200 OK |
 |

### Response Examples

- An attribute for self is automatically created in the response for both the room and each of the occupants currently assigned to the room.
- The results for rooms are paginated with a limit of 5 records per page. A next attribute is generated with a link to the next set of rooms results in sequential order.
- Attribute total rooms lists the total number of rooms in the collection
- A GET request with the next link provided returns the next set of room results.

#### Success

| Status: 200 OK
{&quot;rooms&quot;: [{&quot;name&quot;: &quot;Harbor View&quot;,&quot;rate&quot;: 25.5,&quot;size&quot;: 49,&quot;type&quot;: &quot;Standard Suite&quot;,&quot;occupants&quot;: [],&quot;id&quot;: &quot;5079418695319552&quot;,&quot;self&quot;: &quot;https://localhost:8080/rooms/5079418695319552&quot;},{&quot;name&quot;: &quot;Peaceful Meadows&quot;,&quot;rate&quot;: 49.99,&quot;size&quot;: 75,&quot;type&quot;: &quot;Luxury Suite&quot;,&quot;occupants&quot;: [],&quot;id&quot;: &quot;5636645067948032&quot;,&quot;self&quot;: &quot;https://localhost:8080/rooms/5636645067948032&quot;},{&quot;size&quot;: 88,&quot;type&quot;: &quot;Presidential Suite&quot;,&quot;occupants&quot;: [],&quot;name&quot;: &quot;Grand View&quot;,&quot;rate&quot;: 79.99,&quot;id&quot;: &quot;5646488461901824&quot;,&quot;self&quot;: &quot;https://localhost:8080/rooms/5646488461901824&quot;},{&quot;size&quot;: 48,&quot;type&quot;: &quot;Standard Suite&quot;,&quot;occupants&quot;: [],&quot;name&quot;: &quot;Bay View&quot;,&quot;rate&quot;: 29.99,&quot;id&quot;: &quot;5706627130851328&quot;,&quot;self&quot;: &quot;https://localhost:8080/rooms/5706627130851328&quot;},{&quot;occupants&quot;: [],&quot;name&quot;: &quot;Hallway View&quot;,&quot;rate&quot;: 19.99,&quot;size&quot;: 20,&quot;type&quot;: &quot;Simple Suite&quot;,&quot;id&quot;: &quot;5714489739575296&quot;,&quot;self&quot;: &quot;https://localhost:8080/rooms/5714489739575296&quot;}],&quot;next&quot;: https://localhost:8080/rooms?cursor=CioSJGoPbX5oYXNoai1wcm9qZWN0chELEgRSb29tGICAgJjFqZMKDBgAIAA=, &quot;total\_rooms&quot;: 7} |
| --- |

# Update a Room Via PATCH

Allows for updating a room&#39;s attributes with the HTTP Verb &#39;PATCH&#39;

All JSON attributes of the room entity remain the same unless specifically specified in request body.

Caution: This route is not intended for managing pet-room assignments. Pet-room relationships can only be managed through: DELETE /room/:room\_id/pets/:pet\_id or PUT /room/:room\_id/pets/:pet\_id Only attributes inherit to the room entity will be affected.

| PATCH /rooms/:room\_id |
| --- |

## Request

### Request Parameters

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| room\_id | String | ID of the room | Yes |

### Request Body

Required

### Request JSON Attributes

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| type | String | The kind of room. | Optional |
| name | String | What the room is called. | Optional |
| size | Number | The area of the room in square feet. | Optional |
| rate | Number | The price of the room per night | Optional |

##

## Response

### Response Body Format

Success: none

Failure: JSON

### Response Header

Location header has live URL to the updated resource.

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 204 No Content | Returns a 204 status code and URL to resource in the Location header. |
| Failure | 404 Not Found | No room with this room\_id exists. If room\_id isn&#39;t found, 404 is returned. |

### Response Examples

#### Failure

| Status: 404 Not Found
{ &quot;Error&quot;: &quot;No room with this room\_id exists&quot; } |
| --- |

# Update a Room Via PUT

Allows for updating a room&#39;s attributes with the HTTP Verb &#39;PUT&#39;

All JSON attributes of the room will reflect those provided in JSON request body. Failing to provide values for attributes will be overwritten with &#39;null&#39;. It is recommended that all attributes are provided.

Caution: This route not intended for managing pet-room assignments. Pet-room assignments can only be managed through: DELETE /room/:room\_id/pets/:pet\_id or PUT /room/:room\_id/pets/:pet\_id Only attributes inherit to the room entity will be affected.

| PUT /rooms/:room\_id |
| --- |

## Request

### Request Parameters

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| room\_id | String | ID of the room | Yes |

### Request Body

Required

### Request JSON Attributes

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| type | String | The kind of room. | Optional |
| name | String | What the room is called. | Optional |
| size | Number | The area of the room in square feet. | Optional |
| rate | Number | The price of the room per night | Optional |

## Response

No body

### Response Body Format

Success: No body

Failure: JSON

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 204 No Content | Returns a 204 status code and URL to resource in the Location header. |
| Failure | 404 Not Found | No room with this room\_id exists. If room\_id isn&#39;t found, 404 is returned. |

### Response Examples

#### Success

| Status: 204 No Content |
| --- |

#### Failure

| Status: 404 Not Found
{ &quot;Error&quot;: &quot;No room with this room\_id exists&quot; } |
| --- |

# Delete a Room

Allows for removing a room. Note that if the room currently has any occupants, the room cannot be deleted until all occupants are removed.

Note: To remove an an occupant, use: DELETE /room/:room\_id/pets/:pet\_id

| DELETE /rooms/:room\_id |
| --- |

## Request

### Request Parameters

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| room\_id | String | ID of the room | Yes |

### Request Body

None

## Response

No body

### Response Body Format

Success: No body

Failure: JSON

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 204 No Content |
 |
| Failure | 404 Not Found | No room with this room\_id was found in the datastore |
| Failure | 403 Forbidden | 403 is returned if the room has occupants, and therefore, cannot be deleted at this time. |

### Response Examples

- Removal of the room from the datastore is allowed only if the room is empty

#### Success

| Status: 204 No Content |
| --- |

#### Failure

| Status: 404 Not Found
{ &quot;Error&quot;: &quot;No room with this room\_id exists&quot; } |
| --- |

#### Failure

| Status: 403 Forbidden
{ &quot;Error&quot;: &quot;Occupants of room must be removed before room can be deleted.&quot; } |
| --- |

# Create a Pet

Allows for creation of a new pet that is initially unassigned to a room.

| POST /pets |
| --- |

## Request

### Request Parameters

None

### Request Body

Required

### Request Header: Authorization

&quot;Authorization&quot; header required. Type &quot;Bearer&quot;. Token format: JSON Web Token (JWT).

### Request Header : Accept

&quot;Accept&quot; header value must be &#39;application/json&#39;

### Request Body Format

JSON

### Request JSON Attributes

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| species | String | The kind of animal. | Yes |
| color | String | The color of the animal (e.g. &quot;black and white&quot; or &quot;brown&quot;) | Yes |
| name | String | What the pet is called by the owner. | Yes |

### Request Body Example

| {&quot;species&quot;: &quot;Canine&quot;,&quot;color&quot;: &quot;Red&quot;,&quot;name&quot;: &quot;Cooper&quot;} |
| --- |

## Response

### Response Body Format

Success: &#39;application/json&#39;

Failure: &#39;application/json&#39;

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 201 Created |
 |
| Failure | 401 Unauthorized | If the JSON Web Token (JWT) is not valid, the user cannot create a pet record.The user must return to:https://hashj-project.wl.r.appspot.com/accountto get a valid JWT by either creating an account or re-signing in. |

### Response Examples

- Datastore will automatically generate an ID and store it with the entity being created. This value is sent in the response body as shown in the example. The room attribute is generated automatically and added the entity.
- The value of the attribute room begins as an empty object because the pet is not in a room initially. Later, room will be updated to hold identifying information about the room that the pet currently resides in.
- The value of the attribute self is a live link to the REST resource corresponding to this pet. In other words, this is the URL to get this newly created pet. This link is generated for the response and not stored in the datastore.

#### Success

| Status: 201 Created
{ &quot;species&quot;: &quot;Canine&quot;, &quot;color&quot;: &quot;Red&quot;, &quot;name&quot;: &quot;Cooper&quot;, &quot;room&quot;: {}, &quot;owner&quot;: &quot;114791681322698322383&quot;, &quot;id&quot;: &quot;5755374237908992&quot;, &quot;self&quot;: &quot;https://localhost:8080/pets/5755374237908992&quot;} |
| --- |

#### Failure

| Status: 401 Unauthorized
{ &quot;Error&quot;: &quot;Invalid token signature&quot;} |
| --- |

# View a Pet

Allows for viewing information on an existing pet that is owned by the user.

| GET /pets/:pet\_id |
| --- |

## Request

### Request Parameters

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| pet\_id | String | ID of the pet | Yes |

### Request Body

None

### Request Header : Authorization

&quot;Authorization&quot; header required. Type &quot;Bearer&quot;. Token format: JSON Web Token (JWT).

### Request Header : Accept

&quot;Accept&quot; header value must be &#39;application/json&#39;

## Response

### Response Body Format

Success: &#39;application/json&#39;

Failure: &#39;application/json&#39;

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 200 OK | Returns request pet information |
| Failure | 404 Not Found | No pet with this pet\_id exists |
| Failure | 404 Not Found | No pets exist in data store |
| Failure | 403 Forbidden | User has been authenticated, but the pet with the pet\_id in the request doesn&#39;t belong to the user making the request. |
| Failure | 401 Unauthorized | The JSON Web Token provided in the Authorization header of the request is invalid. User wasn&#39;t recognized by server. |

### Response Examples

- If the pet is currently in a room, the name, id, and self URL for the room will appear in the room attribute in the response.

#### Success

| Status: 200 OK
{ &quot;id&quot;: &quot;4693933435125760&quot;, &quot;species&quot;: &quot;Box turtle&quot;, &quot;color&quot;: &quot;Brown&quot;, &quot;name&quot;: &quot;Boxer&quot;, &quot;room&quot;: { &quot;name&quot;: &quot;Bay View&quot;, &quot;id&quot;: &quot;6485250678980608&quot;, &quot;self&quot;: &quot;https://localhost:8080/rooms/6485250678980608&quot; }, &quot;owner&quot;: &quot;114791681322698322383&quot;, &quot;self&quot;: &quot;https://localhost:8080/pets/4693933435125760&quot;} |
| --- |

#### Failure

| Status: 404 Not Found
{ &quot;Error&quot;: &quot;No pet with this pet\_id exists.&quot; } |
| --- |

#### Failure

| Status: 404 Not Found
{ &quot;Error&quot;: &quot;No pets in datastore.&quot; } |
| --- |

#### Failure

| Status: 403 Forbidden
{ &quot;Error&quot;: &quot;No authorization to access this pet!&quot; } |
| --- |

#### Failure

| Status: 401 Unauthorized
{ &quot;Error&quot;: &quot;Invalid token signature.&quot; } |
| --- |

# View All Pets

List all the current pets whether they are in a room or not.

| GET /pets |
| --- |

## Request

### Request Parameters

None

### Request Body

None

### Authorization

&quot;Authorization&quot; header required. Type &quot;Bearer&quot;. Token format: JSON Web Token (JWT).

### Request Header : Accept

&quot;Accept&quot; header value must be &#39;application/json&#39;

## Response

### Response Body Format

JSON

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 200 OK |
 |

### Response Examples

- An attribute for self is automatically created in the response for both the pets and room they are assigned to if applicable.
- The results for pets are paginated with a limit of 5 records per page. A next attribute is generated with a link to the next set of pets results in sequential order.
- Attribute total\_pets lists the total number of pets in the collection
- A GET request with the next link provided returns the next set of pets results.

#### Success

| Status: 200 OK
{&quot;pets&quot;: [{&quot;name&quot;: &quot;Rex&quot;,&quot;species&quot;: &quot;Canine&quot;,&quot;color&quot;: &quot;Black and tan&quot;,&quot;owner&quot;: &quot;114791681322698322383&quot;,&quot;room&quot;: {},&quot;id&quot;: &quot;4887575659544576&quot;,&quot;self&quot;: &quot;https://localhost:8080/pets/4887575659544576&quot;},{&quot;owner&quot;: &quot;114791681322698322383&quot;,&quot;room&quot;: {},&quot;name&quot;: &quot;Dani&quot;,&quot;species&quot;: &quot;Canine&quot;,&quot;color&quot;: &quot;Black and tan&quot;,&quot;id&quot;: &quot;5104074961715200&quot;,&quot;self&quot;: &quot;https://localhost:8080/pets/5104074961715200&quot;},{&quot;owner&quot;: &quot;114791681322698322383&quot;,&quot;room&quot;: {},&quot;name&quot;: &quot;Polly&quot;,&quot;species&quot;: &quot;Parrot&quot;,&quot;color&quot;: &quot;Gray&quot;,&quot;id&quot;: &quot;5685335367352320&quot;,&quot;self&quot;: &quot;https://localhost:8080/pets/5685335367352320&quot;},{&quot;name&quot;: &quot;Tigger&quot;,&quot;species&quot;: &quot;Feline&quot;,&quot;color&quot;: &quot;Striped&quot;,&quot;owner&quot;: &quot;114791681322698322383&quot;,&quot;room&quot;: {},&quot;id&quot;: &quot;5704642587525120&quot;,&quot;self&quot;: &quot;https://localhost:8080/pets/5704642587525120&quot;},{&quot;name&quot;: &quot;Boxer&quot;,&quot;species&quot;: &quot;Box turtle&quot;,&quot;color&quot;: &quot;Brown&quot;,&quot;owner&quot;: &quot;114791681322698322383&quot;,&quot;room&quot;: {},&quot;id&quot;: &quot;5740073718906880&quot;,&quot;self&quot;: &quot;https://localhost:8080/pets/5740073718906880&quot;}],&quot;next&quot;: &quot;https://localhost:8080/pets?cursor=CikSI2oPbX5oYXNoai1wcm9qZWN0chALEgNQZXQYgICA%2BJCSmQoMGAAgAA%3D%3D&quot;,&quot;total\_pets&quot;: 7} |
| --- |

# Update a Pet Via PATCH

Allows for updating a pet&#39;s attributes with the HTTP Verb &#39;PATCH&#39;

All JSON stored attributes of the pet entity remain the same unless specifically specified in request body.

Disclaimer: This route not intended for managing pet-room assignments. Pet-room assignments can only be managed through: DELETE /room/:room\_id/pets/:pet\_id or PUT /room/:room\_id/pets/:pet\_id Only attributes inherit to the pet entity will be affected.

| PATCH /pets/:pet\_id |
| --- |

## Request

### Request Parameters

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| pet\_id | String | ID of the pet | Yes |

### Authorization

&quot;Authorization&quot; header required. Type &quot;Bearer&quot;. Token format: JSON Web Token (JWT).

### Request Body Format

JSON

### Request JSON Attributes

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| species | String | The kind of animal. | Optional |
| color | String | The color of the animal (e.g. &quot;black and white&quot; or &quot;brown&quot;) | Optional |
| name | String | What the pet is called by the owner. | Optional |

## Response

No body

Location response header has live URL to the the updated resource

### Response Body Format

Success: No body

Failure: JSON

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 204 No Content | Location header has URL to the resource |
| Failure | 404 Not Found | No pet with this pet\_id exists for the user. Rather than having a 403 for the user if they are forbidden from accessing the pet, the 404 leaves it ambiguous as to whether they have stumbled upon another user&#39;s pet&#39;s id. This is used in other API&#39;s such as GitHub to further protect privacy. |
| Failure | 401 Unauthorized | The JSON Web Token provided in the Authorization header of the request is invalid. User wasn&#39;t recognized by server. |

### Response Examples

#### Success

| Status: 204 No Content |
| --- |

#### Failure

| Status: 404 Not Found
{ &quot;Error&quot;: &quot;User owns no pet with this pet\_id&quot; } |
| --- |
| Status: 401 Unauthorized
{ &quot;Error&quot;: &quot;Invalid token signature&quot; } |

# Update a Pet Via PUT

Allows for updating a pet&#39;s attributes with the HTTP Verb &#39;PUT&#39;

All JSON attributes of the pet will reflect those provided in JSON request body. Failing to provide values for attributes will be overwritten with &#39;null&#39;.

Disclaimer: This route not intended for managing pet-room assignments. Pet-room assignments can only be managed through: DELETE /room/:room\_id/pets/:pet\_id or PUT /room/:room\_id/pets/:pet\_id Only attributes inherit to the pet entity will be affected.

| PUT /pets/:pet\_id |
| --- |

## Request

### Request Parameters

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| pet\_id | String | ID of the pet | Yes |

### Authorization

&quot;Authorization&quot; header required. Type &quot;Bearer&quot;. Token format: JSON Web Token (JWT).

### Request Body Format

JSON

### Request JSON Attributes

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| species | String | The kind of animal. | Optional |
| color | String | The color of the animal (eg &quot;black and white&quot; or &quot;brown&quot;) | Optional |
| name | String | What the pet is called by the owner. | Optional |

## Response

No body

Location response header has live URL to the the updated resource

### Response Body Format

Success: No body

Failure: JSON

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 204 No Content | Location header has URL to the resource |
| Failure | 404 Not Found | No pet with this pet\_id exists for the user. Rather than having a 403 for the user if they are forbidden from accessing the pet, the 404 leaves it ambiguous as to whether they have stumbled upon another user&#39;s pet&#39;s id. This is used in other API&#39;s such as GitHub to further protect privacy. |
| Failure | 401 Unauthorized | The JSON Web Token provided in the Authorization header of the request is invalid. User wasn&#39;t recognized by server. |

### Response Examples

#### Success

| Status: 204 No Content |
| --- |

#### Failure

| Status: 404 Not Found
{ &quot;Error&quot;: &quot;User owns no pet with this pet\_id&quot; } |
| --- |
| Status: 401 Unauthorized
{ &quot;Error&quot;: &quot;Invalid token signature&quot; } |

#

# Delete a Pet

Allows for deleting a pet from the system. If the pet is currently in a room, the pet will be removed from that room.

| DELETE /pets/:pet\_id |
| --- |

## Request

### Request Parameters

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| pet\_id | String | ID of the pet | Yes |

### Request Body

None

### Authorization

&quot;Authorization&quot; header required. Type &quot;Bearer&quot;. Token format: JSON Web Token (JWT).

## Response

No body

### Response Body Format

Success: No body

Failure: JSON

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 204 No Content |
 |
| Failure | 404 Not Found | If the pet is not found in the set of pets that the user owns or if the user tries delete a pet that they do not own, then the 404 error is produced. It is possible that a 403 could have been used for the later case, but the 404 seems appropriate because it is also a way to protect the privacy of the other user in not allowing the other users to know the id of pets that they do not own. It is also borderline an appropriate case because the combination of the user&#39;s id and pet id do not exist. |

### Response Examples

- Removal of the pet from the datastore also updates the occupants attribute for the room that the pet was assigned to by removing pet&#39;s id from the array of occupants.

#### Success

| Status: 204 No Content |
| --- |

#### Failure

| Status: 404 Not Found
{ &quot;Error&quot;: &quot;No pet with this pet id exists for current user.&quot; } |
| --- |

# Assign a Pet to a Room

An empty room or a room that has a pet in it that is owned by the user can have a new pet assigned to it.

| PUT /rooms/:room\_id/pets/:pet\_id |
| --- |

## Request

### Request Parameters

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| room\_id | String | ID of the room | Yes |
| pet\_id | String | ID of the pet | Yes |

### Request Body

None

Note: Set Content-Length to 0 in your request when calling out to this endpoint.

## Response

No body

## Authorization

Authorization&quot; header required. Type &quot;Bearer&quot;. Token format: JSON Web Token (JWT).

### Response Body Format

Success: No body

Failure: JSON

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 204 No Content | Succeeds only if a room exists with this room\_id, a pet with the specified pet\_id exists, and the pet with that pet\_id is not already assigned to another room. |
| Failure | 403 Forbidden | This pet is already assigned to another room. |
| Failure | 403 Forbidden | User does not have authorization to assign pet to room. |
| Failure | 403 Forbidden | Another owner already has pets in that room. Pets from two different owners cannot be in the same room. |
| Failure | 404 Not Found | No room with this room\_id exists, and/or no pet with this pet\_id exits. |
| Failure | 401 Unauthorized | The user was not authenticated and not recognized by the server. |

### Response Examples

#### Success

| Status: 204 No Content |
| --- |

#### Failure

| Status: 403 Forbidden
{ &quot;Error&quot;: &quot;The pet with this pet\_id is already assigned to another room.&quot; } |
| --- |
| Status: 403 Forbidden
{ &quot;Error&quot;: &quot;You lack authorization for this request.&quot; }
 |
| Status: 403 Forbidden
{ &quot;Error&quot;: &quot;This room is in use by another pet owner. Pick another room number.&quot; }
 |

#### Failure

| Status: 404 Not Found
{ &quot;Error&quot;: &quot;The specified room and/or pet don&#39;t exist&quot; } |
| --- |

#### Failure

| Status: 401 Unauthorized
{ &quot;Error&quot;: &quot;Invalid token signature.&quot; } |
| --- |

Notes: A pet can only be assigned to one room, but a room can hold an unlimited number of pets. Pets can only be in rooms with other pets that have the same owner.

# Remove a Pet From a Room

A room that has a pet in it can be removed from the room by the pet&#39;s owner.

| DELETE /rooms/:room\_id/pets/:pet\_id |
| --- |

## Request

### Request Parameters

| **Name** | **Type** | **Description** | **Required?** |
| --- | --- | --- | --- |
| room\_id | String | ID of the room | Yes |
| pet\_id | String | ID of the pet | Yes |

### Request Body

None

Note: Set Content-Length to 0 in your request when calling out to this endpoint.

## Response

No body

## Authorization

Authorization&quot; header required. Type &quot;Bearer&quot;. Token format: JSON Web Token (JWT).

### Response Body Format

Success: No body

Failure: JSON

### Response Statuses

| **Outcome** | **Status Code** | **Notes** |
| --- | --- | --- |
| Success | 204 No Content | Succeeds only if a room exists with this room\_id and the specified pet owned by the user is in that room. |
| Failure | 404 Not Found | No room with that room id exists. |
| Failure | 404 Not Found | No pet with that pet\_id exists under the current user&#39;s ownership. Again, a 404 here protects the pet\_id leaving it ambiguous as to whether a pet with that id exists. The actual owner would know it does. A 403 would let a non-owner know a pet&#39;s id number and what room it is in. |
| Failure | 401 Unauthorized | The user was not authenticated and not recognized by the server. |

### Response Examples

#### Success

| Status: 204 No Content |
| --- |

#### Failure

| Status: 404 Not Found
{ &quot;Error&quot;: &quot;The specified room does not exist.&quot; } |
| --- |
| Status: 404 Not Found
{ &quot;Error&quot;: &quot;The specified pet is not in that room.&quot; } |

#### Failure

| Status: 401 Unauthorized
{ &quot;Error&quot;: &quot;Invalid token signature.&quot; } |
| --- |

# 405 and 406 Status Codes: Methods and Media Types Not Allowed

## 405 (Method Not Allowed)

The following endpoints are not allowed and will return a 405 status code:

DELETE /rooms

PUT /rooms

PATCH /rooms

DELETE /pets

PUT/pets

PATCH /pets

### Response Example

| Status: 405 Method Not Allowed
{ &quot;Error&quot;: &quot;Method not allowed.&quot; } |
| --- |

## 406 (Not Acceptable)

Endpoints that return full response bodies and either a 200 status code or a 201 status code require that the content is returned in &#39;application/json&#39; format. The &#39;accept&#39; header in the request must specify that &#39;application/json&#39; is accepted.

The following endpoints will return a 406 status code if &#39;accept&#39; header is properly set:

POST /rooms

GET /rooms

GET /rooms/:room\_id

POST /pets

GET /pets

GET /pets/:pet\_id

GET /users

### Response Example

| Status: 406 Not Acceptable
{ &quot;Error&quot;: &quot;Only application/json is acceptable.&quot; } |
| --- |

Page **30** of **30**
