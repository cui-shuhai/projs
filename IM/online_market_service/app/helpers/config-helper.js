/**
 * Created by richardmaglaya on 2014-10-31.
 */
'use strict';


var ResolveConfig = function (rawConfig) {
    var _this = exports;
    var resolvedConfig = {
        mongo: {
            hosts: _this.environmentHelper.getEnvironmentValue(JSON.stringify(rawConfig.mongo), null, 'hosts', null),
            database: _this.environmentHelper.getEnvironmentValue(JSON.stringify(rawConfig.mongo), null, 'database', null)
        },
        rabbitMQ: {
            connection: _this.environmentHelper.getEnvironmentValue(JSON.stringify(rawConfig.rabbitMQ), null, 'connection', null),
            leadExchange: _this.environmentHelper.getEnvironmentValue(JSON.stringify(rawConfig.rabbitMQ), null, 'restaurant-exchange', null)
        },
        smtp: {
            connection: _this.environmentHelper.getEnvironmentValue(JSON.stringify(rawConfig.smtp), null, 'connection', null)
        },
        socketIO: {
            connection: _this.environmentHelper.getEnvironmentValue(JSON.stringify(rawConfig.smtp), null, 'connection', null)
        },
        redis: {
            connection: _this.environmentHelper.getEnvironmentValue(JSON.stringify(rawConfig.redis), null, 'connection', null)
        },
        rawConfig: rawConfig
    };
    return resolvedConfig;
};


module.exports = function (logger) {
    var _this = exports;
    _this.environmentHelper = require('backend-helpers')({}, {}, logger).environmentHelper();
    _this.resolveConfig = ResolveConfig;
    return _this;
};