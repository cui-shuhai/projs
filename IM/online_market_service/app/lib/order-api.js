/**
 * Created by richardmaglaya on 2014-10-21.
 */
'use strict';


module.exports = function init(app, config, mongoConfig, logger) {
    var _this = exports;
    _this.app = app;
    _this.config = config;
    _this.logger = logger;
    _this.mongoConfig = mongoConfig;

    _this.order = require('./order')(_this.app, _this.config, _this.mongoConfig, _this.logger);
    _this.message = require('./message')(_this.app,_this.config, _this.mongoConfig,_this.logger);
    _this.orderNew = require('./order-new')(_this.app,_this.config, _this.mongoConfig,_this.logger);
    return _this;
};
