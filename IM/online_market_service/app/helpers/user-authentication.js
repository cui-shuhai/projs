/**
 * Created by richardmaglaya on 2014-10-31.
 */
'use strict';


var RequireAuthentication = function (req, res, next) {
    var _this = exports;
    _this.httpHelper = _this.backendHelpers.httpHelper();
    //-- Duplicate (JSON object) headers and copy query params (JSON object) to local variable
    var headers = req.headers;
    var options = req.query;
//    console.log('==============================================================');
//    console.log('DEBUG-INFO: headers = %j\n\n', JSON.stringify(headers));
//    console.log('DEBUG-INFO: options = %j\n\n', JSON.stringify(options));
    //-- Use lower case for header field as express/note will convert camel-case to all lower case
    //-- Temporarily hard-code 'usertoken'
    headers.usertoken = 'something-something';

    var token = headers.usertoken || options.usertoken || null;
    if (token) {
        if (_this.isValidToken(token)) {
            var authentication = req.apiAuth || {};

            var user = authentication.user || {};
            user.id = token;

            var service = authentication.svc || {};

            authentication.token = token;
            authentication.user = user;
            authentication.svc = service;

            req.apiAuth = authentication;

            next();
        }
        else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid usertoken',
                data: token
            }, null, 403, res);
        }
    } else {
        _this.httpHelper.sendFormattedResponse({
            message: 'missing usertoken'
        }, null, null, res);
    }
};


var IsValidToken = function (token) {
    //-- var _this = exports;
    //if (token) {
    //    console.log('Token: ' + token);
    //}
    return true;
};


module.exports = function (app) {
    var _this = exports;
    _this.backendHelpers = require('./../../utils/lib/backend-helpers')(app.config, {}, app.logger);
    _this.isValidToken = IsValidToken;
    _this.requireAuthentication = RequireAuthentication;
    return _this;
};
