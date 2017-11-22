
/**
 * Created by richardmaglaya on 2014-11-18.
 */
'use strict';


var CreateReservation =  function(req,res){
    var _this = exports;
    var userId = req.params.userId;
    var reservationBody = req.body;
    var restaurantId = reservationBody.restaurantId;
    //if(reservationBody.userId === '' || reservationBody.userId === null || reservationBody.userId === undefined){
        //reservationBody.userId = userId;
    //}
    reservationBody._id = _this.dataGenerationHelper.generateUUID();
    _this.logger.info({
        function: 'CreateReservation',
        reservationId: reservationBody._id,
        userId: userId,
        reservationBody: JSON.stringify(reservationBody)
    });
    if(_this.validateRequestBody(reservationBody, [_this.Schema.ReservationSaveSchema],res)){
        if (_this.dataGenerationHelper.isValidUUID(restaurantId)) {
            _this.reservationAPI.createReservation(reservationBody, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: restaurantId',
                data: restaurantId
            }, null, null, res);
        }
    }
};

var GetReservationsByRestaurantId = function(req,res){
    var _this = exports;
    var restaurantId = req.params.restaurantId;
    var type = req.query.type;
    _this.logger.info({
        function: 'GetReservationsByRestaurantId',
        restaurantId: restaurantId
    });
    if (_this.dataGenerationHelper.isValidUUID(restaurantId)) {
        _this.reservationAPI.getReservationsByRestaurantId (restaurantId,type, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    } else {
        _this.httpHelper.sendFormattedResponse({
            message: 'invalid_format: restaurantId',
            data: restaurantId
        }, null, null, res);
    }
};

var UpdateReservationById = function(req,res){
    var _this = exports;
    var reservationId = req.params.reservationId;
    var reservationBody = req.body;
    _this.logger.info({
        function: 'UpdateReservationById',
        reservationId: reservationId
    });
    if (_this.dataGenerationHelper.isValidUUID(reservationId)) {
        _this.reservationAPI.updateReservationById(reservationId,reservationBody, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    } else {
        _this.httpHelper.sendFormattedResponse({
            message: 'invalid_format: reservationId',
            data: reservationId
        }, null, null, res);
    }
};

var DeleteReservationById = function(req,res) {
    var _this = exports;
    var reservationId = req.params.reservationId;
    _this.logger.info({
        function: 'DeleteReservationById',
        reservationId: reservationId
    });
    if (_this.dataGenerationHelper.isValidUUID(reservationId)) {
        _this.reservationAPI.deleteReservationById(reservationId, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    } else {
        _this.httpHelper.sendFormattedResponse({
            message: 'invalid_format: reservationId',
            data: reservationId
        }, null, null, res);
    }
};

var DeleteReservationsByRestaurantId = function(req,res) {
    var _this = exports;
    var restaurantId = req.params.restaurantId;
    _this.logger.info({
        function: 'DeleteReservationsByRestaurantId',
        restaurantId: restaurantId
    });
    if (_this.dataGenerationHelper.isValidUUID(restaurantId)) {
        _this.reservationAPI.deleteReservationsByRestaurantId(restaurantId, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    } else {
        _this.httpHelper.sendFormattedResponse({
            message: 'invalid_format: restaurantId',
            data: restaurantId
        }, null, null, res);
    }
};

var GetPreOrder = function(req, res) {
    var _this = exports;
    var userId = req.params.user_id;

    var getPreOrder = function() {
        if (_this.dataGenerationHelper.isValidUUID(userId)) {
            _this.reservationAPI.getPreOrder(userId, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: userId',
                data: userId
            }, null, null, res);
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        getPreOrder();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                getPreOrder();
            }
        });
    }
}

var GetPreOrderByReservationId = function(req, res) {
    var _this = exports;
    var userId = req.params.user_id;
    var reservationId = req.params.reservation_id;

    var getPreOrderByReservationId = function() {
        if (!_this.dataGenerationHelper.isValidUUID(userId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('user_id', userId) ,null, res);
        } else if (!_this.dataGenerationHelper.isValidUUID(reservationId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('reservation_id', reservationId) ,null, res);
        } else {
            _this.reservationAPI.getPreOrderByReservationId(userId, reservationId, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        getPreOrderByReservationId();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                getPreOrderByReservationId();
            }
        });
    }
}

var GetPreOrderById = function(req, res) {
    var _this = exports;
    var userId = req.params.user_id;
    var preOrderId = req.params.pre_order_id;

    var getPreOrderById = function() {
        if (!_this.dataGenerationHelper.isValidUUID(userId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('user_id', userId) ,null, res);
        } else if (!_this.dataGenerationHelper.isValidUUID(preOrderId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('pre_order_id', preOrderId) ,null, res);
        } else {
            _this.reservationAPI.getPreOrderById(userId, preOrderId, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        getPreOrderById();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                getPreOrderById();
            }
        });
    }
}

var DeletePreOrderById = function(req, res) {
    var _this = exports;
    var userId = req.params.user_id;
    var preOrderId = req.params.pre_order_id;

    var deletePreOrderById = function() {
        if (!_this.dataGenerationHelper.isValidUUID(userId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('user_id', userId) ,null, res);
        } else if (!_this.dataGenerationHelper.isValidUUID(preOrderId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('pre_order_id', preOrderId) ,null, res);
        } else {
            _this.reservationAPI.deletePreOrderById(userId, preOrderId, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        deletePreOrderById();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                deletePreOrderById();
            }
        });
    }
}

var CreatePreOrder = function(req, res) {
    var _this = exports;

    var userId = req.params.user_id;
    var reservationId = req.params.reservation_id;

    var createPreOrder = function() {
        if (!_this.dataGenerationHelper.isValidUUID(userId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('user_id', userId) ,null, res);
        } else if (!_this.dataGenerationHelper.isValidUUID(reservationId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('reservation_id', reservationId) ,null, res);
        } else {
            _this.reservationAPI.createPreOrder(userId, reservationId, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        createPreOrder();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.CREATE, res, function(error, result){
            if(result) {
                createPreOrder();
            }
        });
    }
}

var UpdatePreOrderItems = function(req, res) {
    var _this = exports;
    var userId = req.params.user_id;
    var preOrderId = req.params.pre_order_id;
    var updatePreOrderBody = req.body;

    var updatePreOrderItems = function() {
        var validateSchema = [_this.Schema.AddOrderItemToOrderSchema,_this.Schema.orderItems,
            _this.Schema.childrenItemV1,_this.Schema.MoneySchema1];
        if(_this.validateRequestBody(updatePreOrderBody,validateSchema, res)) {
            if (_this.dataGenerationHelper.isValidUUID(userId)) {
                _this.reservationAPI.updatePreOrderItems(userId, preOrderId, updatePreOrderBody, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            } else {
                _this.httpHelper.sendFormattedResponse({
                    message: 'invalid_format: userId',
                    data: userId
                }, null, null, res);
            }
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        updatePreOrderItems();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            if(result) {
                updatePreOrderItems();
            }
        });
    }
}

var DeletePreOrderItemsByOrderItemId = function(req, res) {
    var _this = exports;
    var userId = req.params.user_id;
    var preOrderId = req.params.pre_order_id;
    var orderItemId = req.params.order_item_id;;

    var deletePreOrderItemsByOrderItemId = function() {
        if (!_this.dataGenerationHelper.isValidUUID(userId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('user_id', userId) ,null, res);
        } else if (!_this.dataGenerationHelper.isValidUUID(preOrderId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('pre_order_id', preOrderId) ,null, res);
        } else if (!_this.dataGenerationHelper.isValidUUID(orderItemId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('order_item_id', orderItemId) ,null, res);
        } else {
            _this.reservationAPI.deletePreOrderItemsByOrderItemId(userId, preOrderId, orderItemId, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }

    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        deletePreOrderItemsByOrderItemId();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.DELETE, res, function(error, result){
            if(result) {
                deletePreOrderItemsByOrderItemId();
            }
        });
    }
}

var SubmitPreOrder = function(req, res) {
    var _this = exports;
    var userId = req.params.user_id;
    var preOrderId = req.params.pre_order_id;

    var submitPreOrder = function() {
        if (_this.dataGenerationHelper.isValidUUID(userId)) {
            _this.reservationAPI.submitPreOrder(userId, preOrderId, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: userId',
                data: userId
            }, null, null, res);
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        submitPreOrder();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            if(result) {
                submitPreOrder();
            }
        });
    }
}

var CompleteReservation = function (req, res) {
    var _this = exports;

    var userId = req.params.user_id;
    var reservationId = req.params.reservation_id;
    var tableId = req.query.table_id;

    var headerToken = req.headers.authorization;

    var completeReservation = function() {
        if (!_this.dataGenerationHelper.isValidUUID(userId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('user_id', userId) ,null, res);
        } else if (!_this.dataGenerationHelper.isValidUUID(reservationId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('reservation_id', reservationId) ,null, res);
        } else if (!_this.dataGenerationHelper.isValidUUID(tableId)) {
            _this.responseUtilsAPI.processResponse(
                new _this.httpExceptions.InvalidParameterException('table_id', tableId) ,null, res);
        } else {
            _this.reservationAPI.completeReservation(userId, reservationId, tableId, _this.otherServers, headerToken, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        completeReservation();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            if(result) {
                completeReservation();
            }
        });
    }
}

var GetReservationByUserId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var restaurantId = req.query.restaurantId;

    var getReservationByUserId = function() {
        if (_this.dataGenerationHelper.isValidUUID(userId)) {
            _this.reservationAPI.getReservationByUserId(userId, restaurantId, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: userId',
                data: userId
            }, null, null, res);
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        getReservationByUserId();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                getReservationByUserId();
            }
        });
    }
}

module.exports = function (app) {
    var _this = exports;
    _this.app = app;
    _this.logger = app.logger;
    _this.mongoConfig=app.resolvedConfig.mongo;
    _this.backendHelpers = require(_this.app.utilsPath)(_this.config, _this.mongoConfig, _this.logger);
    _this.httpExceptions =_this.backendHelpers.httpExceptions;

    _this.config = app.config;
    _this.otherServers = _this.config.other_servers;

    var orderAPI = require('./../lib/order-api')(_this.app,_this.config, _this.mongoConfig, _this.logger);
    _this.reservationAPI = orderAPI.reservation;
    _this.httpHelper = _this.backendHelpers.httpHelper();
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.loggerName = 'order';
    _this.logger = _this.app.log4jsHelper.initialize(_this.loggerName);


    _this.oauthUtils = _this.backendHelpers.oauthUtils;
    _this.Schema = _this.backendHelpers.Schemas;
    _this.validators = _this.backendHelpers.SchemaValidator;
    _this.validateRequestBody = _this.validators.validateRequestBody;    //-- Helpers, Schemas, and Validators
    _this.responseUtilsAPI = _this.backendHelpers.responseUtilsAPI;
    _this.logger.info('reservation-controller: initialized');

    _this.createReservation = CreateReservation;
    _this.getReservationsByRestaurantId = GetReservationsByRestaurantId;
    _this.updateReservationById = UpdateReservationById;
    _this.deleteReservationById = DeleteReservationById;
    _this.deleteReservationsByRestaurantId = DeleteReservationsByRestaurantId;

    // Pre-Order
    _this.getPreOrder = GetPreOrder;
    _this.getPreOrderByReservationId = GetPreOrderByReservationId;
    _this.getPreOrderById = GetPreOrderById;
    _this.deletePreOrderById = DeletePreOrderById;
    _this.createPreOrder = CreatePreOrder;
    _this.updatePreOrderItems = UpdatePreOrderItems;
    _this.deletePreOrderItemsByOrderItemId = DeletePreOrderItemsByOrderItemId;
    _this.submitPreOrder = SubmitPreOrder;
    _this.completeReservation = CompleteReservation;
    _this.getReservationByUserId = GetReservationByUserId;

    return _this;
};
