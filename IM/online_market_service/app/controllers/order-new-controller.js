
/**
 * Created by webber.wang on 2016-5-4.
 */
'use strict';


var OnlineCloseOrder =  function(req,res){
    var _this = exports;
    var orderId = req.params.order_id;
    var headerToken = req.headers.authorization;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-New-Controller.OnlineCloseOrder',
        orderId: orderId
    });
    var onlineClose = function(){
        _this.orderNewAPI.onlineCloseOrder(orderId,headerToken, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    }
    if(_this.otherServers.oauth.TOKEN_OFF) {
        onlineClose();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                onlineClose();
            }
        });
    }
};


var GetFirstOrderStatistics = function(req, res) {
    var _this = exports;
    var reqParams = {
        startDate: req.query.start_date,
        endDate: req.query.end_date
    };

    var fetchOrderStat = function() {
        _this.orderNewAPI.getFirstOrderStatistics(reqParams, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        fetchOrderStat();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if (result) {
                fetchOrderStat();
            }
        })
    }
}

var GetAllOrders = function(req, res) {
    var _this = exports;
    var userId = req.query.userid;
    var from = req.query.from;
    var pageSize = req.query.pageSize;

    var queryParas = req.query;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-New-Controller.GetAllOrders received parameters',
        queryParas: queryParas
    });

    var getOrders = function(){
        _this.orderNewAPI.getAllOrders(queryParas,function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    };
    if(_this.otherServers.oauth.TOKEN_OFF){
        getOrders();
    } else {
        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                getOrders();
            }
        });
    }
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
    _this.orderNewAPI = orderAPI.orderNew;
    _this.httpHelper = _this.backendHelpers.httpHelper();
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.loggerName = 'order';
    _this.logger = _this.app.log4jsHelper.initialize(_this.loggerName);


    _this.oauthUtils = _this.backendHelpers.oauthUtils;
    _this.Schema = _this.backendHelpers.Schemas;
    _this.validators = _this.backendHelpers.SchemaValidator;
    _this.validateRequestBody = _this.validators.validateRequestBody;    //-- Helpers, Schemas, and Validators
    _this.responseUtilsAPI = _this.backendHelpers.responseUtilsAPI;
    _this.logger.info('order-new-controller: initialized');

    _this.onlineCloseOrder = OnlineCloseOrder;

    _this.getFirstOrderStatistics = GetFirstOrderStatistics;

    _this.getAllOrders = GetAllOrders;


    return _this;
};
