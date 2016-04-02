[![NPM](https://nodei.co/npm/google-batch.svg?downloads=true&downloadRank=true)](https://nodei.co/npm/google-batch/)&nbsp;&nbsp;
[![Build Status](https://travis-ci.org/pradeep-mishra/google-batch.svg?branch=master)](https://travis-ci.org/pradeep-mishra/google-batch)


google-batch
=========
Sends Batch Requests to Google REST API
=======


(C) Pradeep Mishra <pradeep23oct@gmail.com>

**google-batch** is very easy to use, it seamlessly integrate with googleapis (official node.js sdk) module.
so no need to provide all background information like url, query, authorizations.


Warning
--------
* It is in development mode , so some of apis may not work.
* Tested on some gmail apis only.
* Right now only application/json response/request type is supported, so no upload, download kinda things.
* Not compatible with ES6 

Features
--------

* Simple to use
* Support googleapis method directly to make batch call
* Many helper functions to handle batch call smoothly



Example usage
-------------
```javascript
var googleBatch = require('google-batch');
var batch = new googleBatch();

// important, always require googleapis using google-batch require() method.
var google = googleBatch.require('googleapis'); 


// how to use google OAuth instance to provide access token to google-batch
var oauthClient = new google.auth.OAuth2;
oauthClient.setCredentials({
    access_token: "MY_ACCESS_TOKEN"
});
batch.setAuth(oauthClient);

// OR simply pass access_token directly
batch.setAuth("MY_ACCESS_TOKEN");


var gmail = google.gmail({
    version : 'v1'
});

/* 
Do not use oauth object in google service constructer like this
it may bypass patch in a new version of googleapis module

var gmail = google.gmail({
    version : 'v1',
    oauth : oauthClient
});

*/

// now lets make some batch calls
var params1 = {
    googleBatch : true,
    maxResults : 5,
    userId : "me"
};

var params2 = {
    googleBatch : true,
    maxResults : 10,
    userId : "me"
};

/*

notice googleBatch property, this property is required by google-batch 
to identify batch call and prevent it to make the request.

*/

// use add() method to add calls in batch
// yes we can use gogoleapis method directly :)

batch.add(gmail.users.messages.list(params1));
batch.add(gmail.users.messages.list(params2));

batch.exec(function(error, responses, errorDetails){
    console.log(responses);
    // clear batch queue to make new batch call using same instance 
    batch.clear();
});



/* 

In case you are getting a hard time decoding raw (base64) data of gmail body 
you can use this api.


*/





googleBatch.decodeRawData(rawBody);

```


```bash
npm install google-batch --save
```
