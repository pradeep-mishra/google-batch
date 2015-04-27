[![NPM](https://nodei.co/npm/google-batch.svg?downloads=true&downloadRank=true)](https://nodei.co/npm/google-batch/)&nbsp;&nbsp;
[![Build Status](https://travis-ci.org/pradeep-mishra/google-batch.svg?branch=master)](https://travis-ci.org/pradeep-mishra/google-batch)


google-batch
=========
Sends batch requests to Google REST API
=======


(C) Pradeep Mishra <pradeep23oct@gmail.com>

**google-batch** is very easy to use, it seamlessly integrate with googleapis (official node.js sdk) module.
so no need to provide all background informations like url, query, authorizations.


Warning
--------
**It is in development mode , so some of apis may not work.**

right now only application/json response/request type is supported, so no upload, download kinda things.

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

// how to use google OAuth instance to provide access token to google-batch
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var oauthClient = new OAuth2;
oauthClient.setCredentials({
    access_token: "MY_ACCESS_TOKEN"
});
batch.setAuth(oauthClient);
        // OR
batch.setAuth("MY_ACCESS_TOKEN");

        // OR 
        //just put OAuth in google service object, google-batch will extract it from there.

var gmail = google.gmail({
    version : 'v1',
    auth : oauthClient
});

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

// notice googleBatch property, this property is required by google-batch to identify batch call and prevent it to make request.

// use add() method to add calls in batch
// yes we can use gogoleapis method directly :)

batch.add(gmail.users.messages.list(params1));
batch.add(gmail.users.messages.list(params2));

batch.exec(function(errs, responses){
    console.log(responses);
    // clear batch queue to make new batch call using same instance 
    batch.clear();
});


```



```bash
npm install google-batch --save
```
