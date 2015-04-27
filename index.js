var request = require('request');
var querystring = require('querystring');
var parser = require('http-string-parser');
var authLibInstance = new (require('google-auth-library/lib/transporters.js'));
var authRequest = authLibInstance.request || authLibInstance._oldRequest;

function patchGoogleAuthLibrary(){
	var googleAuthLibrary = require('google-auth-library/lib/transporters.js');
	if(typeof(googleAuthLibrary.prototype._oldRequest) !== "function"){
		googleAuthLibrary.prototype.oldRequest = googleAuthLibrary.prototype.request;
		googleAuthLibrary.prototype.request = requestPatch; 
	}
}

function requestPatch(opts, opt_callback) {
	opts = authLibInstance.configure(opts);
  	if(opts && opts.qs && opts.qs.googleBatch){
  			delete opts.qs.googleBatch;
  			return opts;	
  	}
  	if(opts && opts.json && opts.json.googleBatch){
  			delete opts.json.googleBatch;
  			return opts;	
  	} 	
  	return authRequest(opts, opt_callback);
}

function findToken(opts){
	var token = null;
	opts.some(function(item){
		if(item && item.headers && item.headers.Authorization){
			token =  item.headers.Authorization.replace(/^Bearer/, "").trim();
			return true;
		}
	});	
	return token;
}

function getMultipart(calls){
	return calls.map(function (opts) {
		opts.qs = opts.qs || { };
		var options = {
			'Content-Type': 'application/http',
			'Content-ID' : Math.floor(Math.random() * Date.now()),
			'body' : 'GET ' + opts.url + (Object.keys(opts.qs).length ? '?' + querystring.stringify(opts.qs) : "") +  '\n'
		};
		if(opts.method !== "GET"){
			var body = (opts.json || opts.data || opts.body);
			options.body +=  'Content-Type: application/json'  + '\n\n' +
        	JSON.stringify(body);	
		}
		return options;
	});
}

function parseHTTPStrings(item){
	var returnValues = { };
	var data = parser.parseResponse(item);
	returnValues.headers = data.headers;
	if(data.body.indexOf('HTTP/1.1') !== -1){
		data = parser.parseResponse(data.body);
	}
	Object.keys(data.headers).forEach(function(item){
		returnValues.headers[item] = data.headers[item];
	});	      		
	returnValues.body = data.body;
	try{  returnValues.body = JSON.parse(returnValues.body) }catch(e){ }
	return returnValues;
}

function removeGarbage(initial, item){
	if(item.match(/content-type/ig)){
		initial.push(item);
	}
	return initial;
}

function GoogleBatch(){
	patchGoogleAuthLibrary();
	var apiCalls = [ ];
	var token = null;
	this.setAuth = function(auth){
		if(typeof(auth) === "string"){
			token = auth;
		}else if(auth && 
			oauth2Client.credentials && 
			oauth2Client.credentials.access_token){
				token = oauth2Client.credentials.access_token;
		}
		return this;
	}

	this.clear = function(){
		apiCalls = [ ];
		return this;
	}

	this.add = function(calls){
		if(!Array.isArray(calls)){
			calls = [ calls ];
		}
		apiCalls = apiCalls.concat(calls);
		return this;
	}

	this.exec = function(callback){
		if(!token){
			token = findToken(apiCalls);
			if(!token){
				return callback([Error('Auth Token not found')]);
			}	
		}
		var opts = {
			url : 'https://www.googleapis.com/batch',
			method : 'POST',
			headers : {
				'content-type': 'multipart/mixed',
				'Authorization' : 'Bearer ' + token
			},
			multipart : getMultipart(apiCalls)
		}
		var req = request(opts);

		req.on('error', function (e) {
			return callback([e]);
		});

	    req.on('response', function (res) {
	    	var boundary = res.headers['content-type'].split('boundary=');
			if(boundary.length < 2){
				return callback([Error('Wrong content-type :' + res.headers['content-type'])]);
			}
			var boundary = boundary[1];	
			var responsData = "";
			res.on('data', function(data){
				responsData += data.toString();
			});
			res.on('end', function(){
				var bRegex = RegExp('^.*' + boundary,'igm');
				var responses = responsData.split(bRegex)
							.reduce(removeGarbage, [ ])
							.map(parseHTTPStrings);

				var errors = responses.map(function(item){
					if(item.body && item.body.error){
						return item.body.error;
					}
					return null;
				});
				callback(errors, responses);
	      });
			
	    });
			
	}
}


module.exports = GoogleBatch;


