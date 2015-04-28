'use strict';

var request = require('request'),
  pkg = require('./package.json');

/**
 * Default transporter constructor.
 * Wraps request and callback functions.
 */
function DefaultTransporter() {

}

/**
 * Default user agent.
 */
DefaultTransporter.prototype.USER_AGENT =
  'google-api-nodejs-client/' + pkg.version;

/**
 * Configures request options before making a request.
 * @param {object} opts Options to configure.
 * @return {object} Configured options.
 */
DefaultTransporter.prototype.configure = function(opts) {
  // set transporter user agent
  opts.headers = opts.headers || {};
  opts.headers['User-Agent'] = opts.headers['User-Agent'] ?
    opts.headers['User-Agent'] + ' ' + this.USER_AGENT : this.USER_AGENT;
  return opts;
};

/**
 * Makes a request with given options and invokes callback.
 * @param {object} opts Options.
 * @param {Function=} opt_callback Optional callback.
 * @return {Request} Request object
 */
DefaultTransporter.prototype.request = function(opts, opt_callback) {
  opts = this.configure(opts);
    if(opts && opts.qs && opts.qs.googleBatch){
        delete opts.qs.googleBatch;
        return opts;  
    }
    if(opts && opts.json && opts.json.googleBatch){
        delete opts.json.googleBatch;
        return opts;  
    }   
    return request(opts, this.wrapCallback_(opt_callback));
};

/**
 * Wraps the response callback.
 * @param {Function=} opt_callback Optional callback.
 * @return {Function} Wrapped callback function.
 * @private
 */
DefaultTransporter.prototype.wrapCallback_ = function(opt_callback) {
  return function(err, res, body) {
    if (err || !body) {
      return opt_callback && opt_callback(err, body, res);
    }
    // Only and only application/json responses should
    // be decoded back to JSON, but there are cases API back-ends
    // responds without proper content-type.
    try {
      body = JSON.parse(body);
    } catch (err) { /* no op */ }

    if (body && body.error) {
      if (typeof body.error === 'string') {
        err = new Error(body.error_description);
        err.code = res.statusCode;
        err.type = body.error;

      } else {
        err = new Error(body.error.message);
        err.code = body.error.code || res.statusCode;
      }

      body = null;

    } else if (res.statusCode >= 500) {
      // Consider all '500 responses' errors.
      err = new Error(body);
      err.code = res.statusCode;
      body = null;
    }

    if (opt_callback) {
      opt_callback(err, body, res);
    }
  };
};

/**
 * Exports DefaultTransporter.
 */
module.exports = DefaultTransporter;
