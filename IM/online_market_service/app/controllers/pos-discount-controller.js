'use strict';

var co=require('co');
var Promise=require('es6-promise').Promise;

var checkPermission=function(req,res){
    var _this=exports;
    return new Promise(function(resolve,reject){
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(error){
                reject(error);
            }else {
                resolve(result);
            }
            
        });
    });
}

var CreateDiscount =  function(req, res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let body=req.body;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.CreateDiscount',
        body: body
    });

    co(function*(){
        let create = function *(){
            let result=yield _this.posPaymentAPI.posDiscountAPI.CreateDiscount(body,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        var schemas = [
            _this.Schema.PosDiscountSchema,
            _this.Schema.PosDiscountTimePeriod,
            _this.Schema.PosDiscountDate,
            _this.Schema.PosDiscountTime,
            _this.Schema.PosDiscountHourMin
        ];
        if(_this.validators.validateRequestBody(body, schemas,res)) {
            if (_this.otherServers.oauth.TOKEN_OFF) {
                yield create();
            } else {
                let result = yield checkPermission(req, res);
                if (result) {
                    yield create();
                }
            }
        }
    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: pos-payment-controller.CreateDiscount',
            stack: error
        });
    });

};

var UpdateDiscount =  function(req, res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let body=req.body;
    let id=req.params.discount_id;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.UpdateDiscount',
        body: body
    });

    co(function*(){
        let create = function *(){
            let result=yield _this.posPaymentAPI.posDiscountAPI.UpdateDiscount(id,body,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        var schemas = [
            _this.Schema.PosDiscountUpdateSchema,
            _this.Schema.PosDiscountTimePeriod,
            _this.Schema.PosDiscountDate,
            _this.Schema.PosDiscountTime,
            _this.Schema.PosDiscountHourMin
        ];
        if(_this.validators.validateRequestBody(body, schemas,res)) {
            if (_this.otherServers.oauth.TOKEN_OFF) {
                yield create();
            } else {
                let result = yield checkPermission(req, res);
                if (result) {
                    yield create();
                }
            }
        }
    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: pos-payment-controller.UpdateDiscount',
            stack: error
        });
    });

};

var GetDiscountById =  function(req, res){
    var _this = exports;
    let id=req.params.discount_id;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.GetDiscountById',
        discount_id: id
    });

    co(function*(){
        let query = function *(){
            let result=yield _this.posPaymentAPI.posDiscountAPI.GetDiscountById(id);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }

        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield query();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield query();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: pos-payment-controller.GetDiscountById',
            stack: error
        });
    });

};

var DeleteDiscountById =  function(req, res){
    var _this = exports;
    let id=req.params.discount_id;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.DeleteDiscountById',
        discount_id: id
    });

    co(function*(){
        let remove = function *(){
            let result=yield _this.posPaymentAPI.posDiscountAPI.DeleteDiscountById(id);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }

        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield remove();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield remove();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: pos-payment-controller.DeleteDiscountById',
            stack: error.stack
        });
    });

};
var GetDiscounts =  function(req, res){
    var _this = exports;
    let query=req.query;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.GetDiscounts',
        query: query
    });

    co(function*(){
        let find = function *(){
            let result=yield _this.posPaymentAPI.posDiscountAPI.GetDiscountList(query);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }

        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield find();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield find();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: pos-payment-controller.GetDiscounts',
            stack: error
        });
    });

};


module.exports = function (app) {
    var _this = exports;
    _this.app = app;
    _this.logger = app.logger;
    _this.config = app.config;
    _this.mongoConfig = app.resolvedConfig.mongo;
    _this.otherServers = _this.config.other_servers;

    _this.backendHelpers = require(_this.app.utilsPath)(_this.config, _this.mongoConfig, _this.logger);
    
    _this.enums = _this.backendHelpers.enums;

    //-- Default is NA
    var country = _this.enums.RegionCode.NA;
    if (process.argv[2] && process.argv[2] !== _this.enums.RegionCode.NA) {
        country = _this.enums.RegionCode.CHINA;
    }
    _this.otherServers.country = country;

    var orderAPI = require('./../lib/order-api')(_this.app,_this.config, _this.mongoConfig, _this.logger);
    _this.posPaymentAPI = orderAPI.posDiscount;
    _this.httpHelper = _this.backendHelpers.httpHelper();
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.loggerName = 'order';
    _this.logger = _this.app.log4jsHelper.initialize(_this.loggerName);


    _this.oauthUtils = _this.backendHelpers.oauthUtils;
    _this.Schema = _this.backendHelpers.Schemas;
    _this.validators = _this.backendHelpers.SchemaValidator;
    _this.responseUtilsAPI = _this.backendHelpers.responseUtilsAPI;
    _this.logger.info('pos-payment-controller: initialized');


    _this.CreateDiscount = CreateDiscount;

    _this.GetDiscountById = GetDiscountById;

    _this.GetDiscounts = GetDiscounts;

    _this.DeleteDiscountById = DeleteDiscountById;
    
    _this.UpdateDiscount = UpdateDiscount;
    
    return _this;
};
