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
var GetBill =  function(req, res){
    var _this = exports;
    let id=req.params.shopping_cart_id;
    let type=req.query.split_type;
    let num_people=req.query.num_person;
    if(!type){
        type=_this.enums.PosSplitType.ALL_IN_ONE;
    }
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.GetBill',
        shopping_cart_id: id
    });

    co(function*(){
        let query = function *(){
            let result=yield _this.posPaymentAPI.posPaymentAPI.GetBill(id,type,num_people);
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
            function: 'DEBUG-ERROR: pos-payment-controller.GetBill',
            stack: error
        });
    });

};
var CreatePayment =  function(req, res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let body=req.body;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.CreatePayment',
        body: body
    });

    co(function*(){
        let create = function *(){
            let result=yield _this.posPaymentAPI.posPaymentAPI.CreatePosPayment(body,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        var schemas = [
            _this.Schema.PosPaymentCreateSchema,
            _this.Schema.PosPaymentCreateTablesSchema,
            _this.Schema.PosPaymentCreateSeatsSchema,
            _this.Schema.PosPaymentCreateItemsSchema,
            _this.Schema.PosPaymentCreateOrderDetailSchema
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
            function: 'DEBUG-ERROR: pos-payment-controller.CreatePayment',
            stack: error
        });
    });
};

var DirectPrintBill =  function(req, res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let body=req.body;
    let include_customer_copy=req.query.include_customer_copy==='true';
    let include_merchant_copy=req.query.include_merchant_copy==='true';
    if(!include_merchant_copy&&!include_customer_copy){
        include_customer_copy=true;
    }
    
    let options={
        include_customer_copy:include_customer_copy,
        include_merchant_copy:include_merchant_copy
    }
   

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.DirectPrintBill',
        body: body
    });
    
    //fill temp value for mandatory fields if not present
    if(body.tip==undefined){
        body.tip=0;
    }
    
    if(!body.payment_method){
        body.payment_method=_this.Schema.PosPaymentType.CASH;
    }
    
    co(function*(){
        let create = function *(){
            let result=yield _this.posPaymentAPI.posPaymentAPI.DirectPrintBill(body, options,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        var schemas = [
            _this.Schema.PosPaymentCreateSchema,
            _this.Schema.PosPaymentCreateTablesSchema,
            _this.Schema.PosPaymentCreateSeatsSchema,
            _this.Schema.PosPaymentCreateItemsSchema,
            _this.Schema.PosPaymentCreateOrderDetailSchema
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
            function: 'DEBUG-ERROR: pos-payment-controller.DirectPrintBill',
            stack: error
        });
    });
};

var PrintDiningOrderBill =  function(req, res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let order_id=req.params.order_id;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.PrintDiningOrderBill',
        order_id: order_id
    });

  
    co(function*(){
        let create = function *(){
            let result=yield _this.posPaymentAPI.posPaymentAPI.PrintDiningOrderBill(order_id,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
      
        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield create();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield create();
            }
        }
        
    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: pos-payment-controller.PrintDiningOrderBill',
            stack: error
        });
    });
};

var PrintDiningOrderSlips =  function(req, res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let order_id=req.params.order_id;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.PrintDiningOrderSlips',
        order_id: order_id
    });


    co(function*(){
        let create = function *(){
            let result=yield _this.posPaymentAPI.posPaymentAPI.PrintDiningOrderSlips(order_id,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }

        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield create();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield create();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: pos-payment-controller.PrintDiningOrderSlips',
            stack: error.stack?error.stack:error
        });
    });
};

var OpenCashDrawer =  function(req, res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let restid=req.params.restaurant_id;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.OpenCashDrawer',
        restaurant_id: restid
    });
    co(function*(){
        let create = function *(){
            let result=yield _this.posPaymentAPI.posPaymentAPI.OpenCashDrawer(restid,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }

        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield create();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield create();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: pos-payment-controller.OpenCashDrawer',
            stack: error
        });
    });
};

var GetPosPayments =  function(req, res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let shopping_cart_id=req.params.shopping_cart_id;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.GetPosPayments',
        shopping_cart_id: shopping_cart_id
    });
    co(function*(){
        let query = function *(){
            let result=yield _this.posPaymentAPI.posPaymentAPI.GetPosPayments(shopping_cart_id,headerToken);
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
            function: 'DEBUG-ERROR: pos-payment-controller.GetPosPayments',
            stack: error
        });
    });
};

var UpdatePosPayments =  function(req, res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let payment_id=req.params.payment_id;
    let body=req.body;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.UpdatePosPayments',
        payment_id: payment_id
    });
    co(function*(){
        let query = function *(){
            let result=yield _this.posPaymentAPI.posPaymentAPI.UpdatePosPayments(payment_id,body);
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
            function: 'DEBUG-ERROR: pos-payment-controller.UpdatePosPayments',
            stack: error
        });
    });
};

var ContinuePay = function(req,res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let payment_id=req.params.payment_id;
    let body=req.body;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.ContinuePay',
        payment_id: payment_id
    });
    co(function*(){
        let query = function *(){
            let result=yield _this.posPaymentAPI.posPaymentAPI.ContinuePay(payment_id,body,headerToken);
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
            function: 'DEBUG-ERROR: pos-payment-controller.GetPosPayments',
            stack: error
        });
    });
};

var UpdatePosPayments =  function(req, res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let payment_id=req.params.payment_id;
    let body=req.body;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.UpdatePosPayments',
        payment_id: payment_id
    });
    co(function*(){
        let query = function *(){
            let result=yield _this.posPaymentAPI.posPaymentAPI.UpdatePosPayments(payment_id,body);
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
            function: 'DEBUG-ERROR: pos-payment-controller.UpdatePosPayments',
            stack: error
        });
    });
};

var Update_AllPosPayments =  function(req, res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let shopping_cart_id=req.params.shopping_cart_id;
    let body=req.body;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.Update_AllPosPayments',
         shopping_cart_id: shopping_cart_id
    });
    co(function*(){
        let query = function *(){
            let result=yield _this.posPaymentAPI.posPaymentAPI.Update_AllPosPayments(shopping_cart_id,body);
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
            function: 'DEBUG-ERROR: pos-payment-controller.Update_AllPosPayments',
            stack: error
        });
    });
};


var ContinuePay = function(req,res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let payment_id=req.params.payment_id;
    let body=req.body;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: pos-payment-controller.ContinuePay',
        payment_id: payment_id
    });
    co(function*(){
        let query = function *(){
            let result=yield _this.posPaymentAPI.posPaymentAPI.ContinuePay(payment_id,body,headerToken);
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
            function: 'DEBUG-ERROR: pos-payment-controller.ContinuePay',
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
    _this.posPaymentAPI = orderAPI.posPayment;
    _this.httpHelper = _this.backendHelpers.httpHelper();
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.loggerName = 'order';
    _this.logger = _this.app.log4jsHelper.initialize(_this.loggerName);


    _this.oauthUtils = _this.backendHelpers.oauthUtils;
    _this.Schema = _this.backendHelpers.Schemas;
    _this.validators = _this.backendHelpers.SchemaValidator;
    _this.responseUtilsAPI = _this.backendHelpers.responseUtilsAPI;
    _this.logger.info('pos-payment-controller: initialized');
    
    _this.CreatePayment = CreatePayment;
    _this.GetBill = GetBill;
    _this.DirectPrintBill = DirectPrintBill;
    _this.OpenCashDrawer = OpenCashDrawer;
    _this.GetPosPayments = GetPosPayments;
    _this.UpdatePosPayments = UpdatePosPayments;
    _this.Update_AllPosPayments = Update_AllPosPayments;
    _this.ContinuePay = ContinuePay;
    _this.PrintDiningOrderBill = PrintDiningOrderBill;
    _this.PrintDiningOrderSlips = PrintDiningOrderSlips;
    _this.ContinuePay = ContinuePay;
    return _this;
};
