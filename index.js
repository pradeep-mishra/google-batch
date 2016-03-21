var path        = require('path');
var request 	= require('request');
var querystring = require('querystring');
var parser 		= require('http-string-parser');
var fs 			= require('fs');

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
		opts.json = opts.json || { } ;
		var contentId = (opts.qs.contentId || opts.json.contentId || Math.floor(Math.random() * Date.now()));
		var options = {
			'Content-Type': 'application/http',
			'Content-ID' : contentId,
			'body' : 'GET ' + opts.url + (Object.keys(opts.qs).length ? '?' + querystring.stringify(opts.qs) : "") +  '\n'
		};
		if(opts.method !== "GET"){
			options.body +=  'Content-Type: application/json'  + '\n\n' +
        	JSON.stringify(opts.json);
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

function clearCache(module){
	if(require.resolve(module) && require.cache[require.resolve(module)]){
    	try{ delete require.cache[require.resolve(module)] }catch(e){ }
	}
}

function GoogleBatch(){
	var apiCalls = [ ];
	var token = null;
	this.setAuth = function(auth){
		if(typeof(auth) === "string"){
			token = auth;
		}else if(auth &&
			auth.credentials &&
			auth.credentials.access_token){
				token = auth.credentials.access_token;
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
				return callback(new Error('Auth Token not found'));
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
			return callback(e);
		});
	    req.on('response', function (res) {
	    	var boundary = res.headers['content-type'].split('boundary=');
			if(boundary.length < 2){
				return callback(new Error('Wrong content-type :' + res.headers['content-type']));
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

				var errors = responses.filter(function(item){
					return (item.body && item.body.error);
				}).map(function(item) {
					return item.body.error;
				});
				if(errors.length !== 0) {
					return callback(new Error(errors.toString()), responses, errors);
				}
				callback(null, responses, null);
	      });

	    });

	}
}

GoogleBatch.require = function(moduleName){
	if(moduleName === "googleapis"){
		try{
            // Make sure that forward slashes are used on windows
            var transportJsPath = path.join(__dirname, '/transport.js').replace(/\\/g, '/');
            var data = "module.exports = require('" + transportJsPath + "');"
            var existingGoogle = require.resolve(moduleName);
            if(existingGoogle){
                existingGoogle = existingGoogle.substr(0, existingGoogle.indexOf(moduleName)) + 'googleapis/lib/transporters.js';
                fs.writeFileSync(existingGoogle, data);
            }else{
                throw Error('googleapis module not found');
            }
            clearCache('googleapis');
        }catch(e){
			var error = new Error('Error while patching googleapis');
			error.stack = e.stack;
			throw error;
		}
	}
	return require(moduleName);
}

GoogleBatch.decodeRawData = function(body){
	return (new Buffer(body.replace(/-/g, '+').replace(/_/g, '/'), "base64")).toString();
}

module.exports = GoogleBatch;


