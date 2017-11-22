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

var DailySalesReport=function(req,res){
    var _this = exports;
    let restaurant_id=req.params.restaurant_id;
    let close_period=req.query.close_period==='true';
    let start_time=req.query.start_time;
    let end_time=req.query.end_time;
    if(start_time){
        start_time=new Date(start_time);
    }
    if(end_time){
        end_time=new Date(end_time);
    }
    
    let headerToken = req.headers.authorization;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.DailySalesReport',
        restaurant_id: restaurant_id
    });
    co(function*(){
        let change = function *(){
            let result=yield _this.posAnalyticsAPI.analyticsAPI.DailySalesReport(restaurant_id,headerToken,close_period,start_time,end_time);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield change();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield change();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.DailySalesReport',
            stack: error
        });
    });

}



var HourlySalesReport=function(req,res){
    var _this = exports;
    let restaurant_id=req.params.restaurant_id;
    let start_time=new Date(req.query.start_time.replace(/-/g, '\/'));
    let end_time=new Date(req.query.end_time.replace(/-/g, '\/'));
 

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.HourlySalesReport',
        restaurant_id: restaurant_id
    });
    co(function*(){
        let doget = function *(){
            let result=yield _this.posAnalyticsAPI.analyticsAPI.BuildReportJSON(_this.posAnalyticsAPI.REPORT_TYPE.HOURLY,restaurant_id,start_time,end_time);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield doget();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield doget();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.HourlySalesReport',
            stack: error
        });
    });
}

var ItemSalesReport=function(req,res){
    var _this = exports;
    let restaurant_id=req.params.restaurant_id;
    let start_time=new Date(req.query.start_time.replace(/-/g, '\/'));
    let end_time=new Date(req.query.end_time.replace(/-/g, '\/'));


    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.ItemSalesReport',
        restaurant_id: restaurant_id
    });
    co(function*(){
        let doget = function *(){
            let result=yield _this.posAnalyticsAPI.analyticsAPI.BuildReportJSON(_this.posAnalyticsAPI.REPORT_TYPE.ITEM,restaurant_id,start_time,end_time);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield doget();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield doget();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.ItemSalesReport',
            stack: error
        });
    });

}

var CashierCloseReport=function(req,res){
    var _this = exports;
    let restaurant_id=req.params.restaurant_id;
    
    let start_time=new Date(req.query.start_time);
    let end_time=new Date(req.query.end_time);


    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.CashierCloseReport',
        restaurant_id: restaurant_id
    });
    co(function*(){
        let doget = function *(){
            let result=yield _this.posAnalyticsAPI.analyticsAPI.BuildReportJSON(_this.posAnalyticsAPI.REPORT_TYPE.DAILY,restaurant_id,start_time,end_time);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield doget();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield doget();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.CashierCloseReport',
            stack: error
        });
    });

}


var SalesSummaryReport=function(req,res){
    var _this = exports;
    let restaurant_id=req.params.restaurant_id;
    let start_time=new Date(req.query.start_time.replace(/-/g, '\/'));
    let end_time=new Date(req.query.end_time.replace(/-/g, '\/'));


    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.SalesSummaryReport',
        restaurant_id: restaurant_id
    });
    co(function*(){
        let doget = function *(){
            let result=yield _this.posAnalyticsAPI.analyticsAPI.BuildReportJSON(_this.posAnalyticsAPI.REPORT_TYPE.SUMMARY,restaurant_id,start_time,end_time);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield doget();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield doget();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.SalesSummaryReport',
            stack: error
        });
    });
}


var EmployeeReport=function(req,res){
    var _this = exports;
    let restaurant_id=req.params.restaurant_id;
    let passcode=req.query.passcode;
    let headerToken = req.headers.authorization;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.EmployeeReport',
        restaurant_id: restaurant_id
    });
    co(function*(){
        let doget = function *(){
            let result=yield _this.posAnalyticsAPI.analyticsAPI.EmployeeReport(restaurant_id,passcode,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield doget();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield doget();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.EmployeeReport',
            stack: error
        });
    });
}

var PrintEmployeeReport=function(req,res){
    var _this = exports;
    let restaurant_id=req.params.restaurant_id;
    let passcode=req.params.passcode;
    let headerToken = req.headers.authorization;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.PrintEmployeeReport',
        restaurant_id: restaurant_id
    });
    co(function*(){
        let doget = function *(){
            let result=yield _this.posAnalyticsAPI.analyticsAPI.EmployeeReport(restaurant_id,passcode,headerToken,true);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield doget();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield doget();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.PrintEmployeeReport',
            stack: error
        });
    });
}


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
    _this.posAnalyticsAPI = orderAPI.posAnalytics;
    _this.httpHelper = _this.backendHelpers.httpHelper();
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.loggerName = 'order';
    _this.logger = _this.app.log4jsHelper.initialize(_this.loggerName);


    _this.oauthUtils = _this.backendHelpers.oauthUtils;
    _this.Schema = _this.backendHelpers.Schemas;
    _this.validators = _this.backendHelpers.SchemaValidator;
    _this.responseUtilsAPI = _this.backendHelpers.responseUtilsAPI;
    _this.logger.info('pos-analytics-controller: initialized');
    
    _this.DailySalesReport=DailySalesReport;
    
    _this.HourlySalesReport=HourlySalesReport;
    
    _this.ItemSalesReport=ItemSalesReport;
    
    _this.CashierCloseReport=CashierCloseReport;
    
    _this.SalesSummaryReport=SalesSummaryReport;

    _this.EmployeeReport=EmployeeReport;
    
    _this.PrintEmployeeReport=PrintEmployeeReport;
    return _this;
};
