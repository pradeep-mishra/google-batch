var googleBatch = require('../index');
var google = googleBatch.require('googleapis');

var batch = new googleBatch();

var token = "ACCESS_TOKEN_HERE";

batch.setAuth(token);

var gmail = google.gmail({
    version : 'v1'
});

var params = {
	googleBatch : true,
    maxResults : 5,
    userId : "me"
};

var params2 = {
	googleBatch : true,
    maxResults : 10,
    userId : "me"
};


batch.add(gmail.users.messages.list(params));
batch.add(gmail.users.messages.list(params2));

batch.exec(function(err, data){
	console.log(err, data);
	batch.clear();
});



