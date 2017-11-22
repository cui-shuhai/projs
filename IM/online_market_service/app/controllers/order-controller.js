
/**
 * Created by richardmaglaya on 2014-11-18.
 */
'use strict';

var CreateOrder = function(req, res) {
    var _this = exports;

    var userId = req.params.userId;
    var orderBody = req.body;
    var isServer = req.query.isServer;
    var restaurantId = orderBody.restaurantId;
    var headerToken = req.headers.authorization;

    var reqParams = {
        userId: req.params.userId,
        isServer: req.query.isServer,
        tableId: req.body.tableId,
        restaurantId: req.body.restaurantId,
        userName: req.body.userName,
        deviceId: req.body.deviceId,
        headerToken: req.headers.authorization
    }

    orderBody.userId = userId;
    orderBody._id = _this.dataGenerationHelper.generateUUID();

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.CreateOrder',
        userId: userId,
        isServer: isServer,
        orderBody: orderBody,
        restaurantId: restaurantId
    });

    var createOrder = function () {
        if (!_this.dataGenerationHelper.isValidUUID(reqParams.userId)) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: userId',
                data: userId
            }, null, null, res);
        } else if (!_this.dataGenerationHelper.isValidUUID(reqParams.restaurantId)) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: restaurantId',
                data: restaurantId
            }, null, null, res);
        } else {
            if(_this.validateRequestBody(orderBody, [_this.Schema.OrderSaveSchema],res)){
                _this.orderAPI.createOrder(reqParams, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            }
        }

    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        createOrder();
    } else {
        _this.oauthUtils.checkPermission(req,{},'sprint',_this.oauthUtils.ActionType.CREATE,res,function(error,result){
            if(result){
                createOrder();
            }
        });
    }
};

var GetOrdersByUserId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var restaurantId = req.query.restaurantId;
    var isServer = req.query.isServer;
    var tableId = req.query.tableId;
    var status = req.query.status;
    var allIncluded = req.query.allIncluded;
    var from = req.query.from;
    var pageSize = req.query.pageSize;
    var includeEmptyTable = req.query.includeEmptyTable;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.GetOrdersByUserId',
        userId: userId, restaurantId: restaurantId, isServer: isServer, tableId: tableId, status: status, allIncluded: allIncluded, from: from, pageSize: pageSize, includeEmptyTable: includeEmptyTable
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (restaurantId === undefined || _this.dataGenerationHelper.isValidUUID(restaurantId)) {
            _this.orderAPI.getOrdersByUserId(userId,restaurantId,tableId,isServer,status,from,pageSize,allIncluded,includeEmptyTable, function (error, result) {
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
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                if (restaurantId === undefined || _this.dataGenerationHelper.isValidUUID(restaurantId)) {
                    _this.orderAPI.getOrdersByUserId(userId,restaurantId,tableId,isServer,status,from,pageSize,allIncluded,includeEmptyTable, function (error, result) {
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

        });
    }
};

var GetPastOrdersWithRating = function (req, res) {
    var _this = exports;

    var reqParams = {
        userId: req.params.userId || 0,
        index: req.query.index || 0,
        limitSize: req.query.limit || 50,
        acceptEncoding: req.headers['accept-encoding']
    };

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.GetPastOrdersWithRating received arguments',
        reqParams: reqParams
    });

    var retrievePastOrdersWithRating = function () {
        _this.orderAPI.getPastOrdersWithRating(reqParams, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res, reqParams.acceptEncoding);
        });
    };

    if (_this.otherServers.oauth.TOKEN_OFF) {
        retrievePastOrdersWithRating();
    } else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function (error, result) {
            if (result) {
                retrievePastOrdersWithRating();
            }
        });
    }
};

//-- Due to FBE-963, this API will be deprecated soon. DEPRECATION Notice Date: 2015-05-10
var GetBillsByOrderId = function(req, res) {
    var _this = exports;

    var getBillsByOrderIdParams = {
        orderId:  req.params.orderId,
        userId: req.query.userId,
        isServer: !req.query.isServer || req.query.isServer.toLowerCase() === 'true'? true:false,
        useBlueDollars: !req.query.useBlueDollars || req.query.useBlueDollars.toLowerCase() === 'true'? true:false,
        buyBlueDollars: !req.query.buyBlueDollars || req.query.buyBlueDollars.toLowerCase() === 'true'? true:false,
        useGoldDollars: false,
        isOnlinePayment: !req.query.isOnlinePayment || req.query.isOnlinePayment.toLowerCase() === 'true'? true:false,
        headerToken: req.headers.authorization,
        otherServers: _this.otherServers,
        isResponseForV1: true   //-- FBE-1734: Deprecate GET Bill v1 and redirect the call to GET Bill v2; parse GET Bill v2 Response for v1
    };

    _this.logger.info('%j', { function: 'Order-Controller.GetBillsByOrderId received arguments', getBillsByOrderIdParams: getBillsByOrderIdParams } );

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(getBillsByOrderIdParams.orderId)) {

            _this.orderAPI.getBillByOrderId(getBillsByOrderIdParams, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: getBillsByOrderIdParams.orderId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if (result){
                if (_this.dataGenerationHelper.isValidUUID(getBillsByOrderIdParams.orderId)) {
                    _this.orderAPI.getBillByOrderId(getBillsByOrderIdParams, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: getBillsByOrderIdParams.orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var UnlockBillsByOrderId = function(req, res) {
    var _this = exports;

    var orderId = req.params.orderId;
    var userId = req.query.userId;
    var headerToken = req.headers.authorization;
    _this.logger.info({
        function: 'GetBillsByOrderId',
        orderId: orderId,
        userId:userId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            _this.orderAPI.unlockBillsByOrderId(orderId, userId, _this.otherServers,headerToken, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                    _this.orderAPI.unlockBillsByOrderId(orderId, userId, _this.otherServers,headerToken, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var GetOrderByOrderId = function(req, res) {
    var _this = exports;

    var userId = req.params.userId;
    var orderId = req.params.orderId;

    _this.logger.info({
        function: 'GetOrderByOrderId',
        userId: userId,
        orderId: orderId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            _this.orderAPI.getOrderByOrderId(userId, orderId, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                    _this.orderAPI.getOrderByOrderId(userId, orderId, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var DeleteOrderByOrderId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    var isServer = req.query.isServer;
    var action = req.query.action;
    _this.logger.info({
        function: 'DeleteOrderByOrderId',
        userId: userId,
        orderId: orderId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            _this.orderAPI.deleteOrderByOrderId(userId,orderId,isServer,action,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.DELETE,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                    _this.orderAPI.deleteOrderByOrderId(userId,orderId,isServer,action,function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var GetUsersByOrderId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    var isServer = req.query.isServer;

    _this.logger.info({
        function: 'GetUsersByOrderId',
        userId: userId,
        orderId: orderId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            _this.orderAPI.getParameterByOrderId(userId, orderId, 'users', {}, isServer, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                    _this.orderAPI.getParameterByOrderId(userId, orderId, 'users', {}, isServer, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var GetOrderItemsByOrderId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    var isServer = req.query.isServer;
    _this.logger.info({
        function: 'GetOrderItemsByOrderId',
        userId: userId,
        orderId: orderId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {

            _this.orderAPI.getParameterByOrderId(userId, orderId, 'orderItems', {'orderItems': 1, '_id': 0}, isServer, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                    _this.orderAPI.getParameterByOrderId(userId, orderId, 'orderItems', {'orderItems': 1, '_id': 0}, isServer, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var GetServersByOrderId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    _this.logger.info({
        function: 'GetServersByOrderId',
        userId: userId,
        orderId: orderId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            _this.orderAPI.getParameterByOrderId(userId, orderId, 'servers', {'servers': 1}, null, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                    _this.orderAPI.getParameterByOrderId(userId, orderId, 'servers', {'servers': 1}, null, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var UpdateUsersByOrderId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    var isServer = req.query.isServer;
    var userBody = req.body;
    var headerToken = req.headers.authorization;
    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Controller.UpdateUsersByOrderId received arguments', userId: userId, orderId: orderId, userBody: userBody });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            _this.orderAPI.updateParameterByOrderId(userId, orderId, userBody, 'users', isServer, _this.otherServers, headerToken, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                    _this.orderAPI.updateParameterByOrderId(userId, orderId, userBody, 'users', isServer, _this.otherServers,headerToken, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var UpdateDiscountsByOrderId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    var isServer = req.query.isServer;
    var userBody = req.body;
    var headerToken = req.headers.authorization;
    _this.logger.info({
        function: 'UpdateDiscountsByOrderId',
        userId: userId,
        orderId: orderId,
        discountBody:JSON.stringify(userBody)
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            _this.orderAPI.updateParameterByOrderId(userId, orderId, userBody, 'discounts', isServer, _this.otherServers,headerToken, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res,function(error, result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                    _this.orderAPI.updateParameterByOrderId(userId, orderId, userBody, 'discounts', isServer, _this.otherServers,headerToken, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var UpdateActionByOrderId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    var isServer = req.query.isServer;
    var action = req.params.action;
    var userBody = req.body;
    var headerToken = req.headers.authorization;
    _this.logger.info({
        function: 'UpdateActionByOrderId',
        userId: userId,
        orderId: orderId,
        action: action,
        userBody: userBody
    });

    var updateParameterByOrderId = function() {
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            var reqParams = {
                userId: userId,
                orderId: orderId,
                action: action,
                isServer: isServer,
                otherServers: _this.otherServers,
                body: userBody,
                headerToken: headerToken
            };

            if(action ==='picked_up'){
                _this.orderAPI.setPickedUp(reqParams, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            } else if (action === 'ready' || action === 'delivered'){
                _this.orderAPI.setDeliveryStatus(reqParams, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            } else {
                _this.orderAPI.updateParameterByOrderId(userId, orderId, userBody, action, isServer, _this.otherServers,headerToken, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            }

        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    };

    if(_this.otherServers.oauth.TOKEN_OFF){
        updateParameterByOrderId();
    } else {

        //_this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
        _this.oauthUtils.checkPermission(req, {}, 'sprint', _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            if(result){
                updateParameterByOrderId();
            }
        });
    }
};

var UpdateTablesByOrderId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    var isServer = req.query.isServer;
    var userBody = req.body;
    var headerToken = req.headers.authorization;
    _this.logger.info({
        function: 'UpdateTablesByOrderId',
        userId: userId,
        orderId: orderId,
        userBody: userBody
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            _this.orderAPI.updateParameterByOrderId(userId, orderId, userBody, 'tables', isServer, _this.otherServers, headerToken,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result) {
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                    _this.orderAPI.updateParameterByOrderId(userId, orderId, userBody, 'tables', isServer, _this.otherServers,headerToken, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var UpdateServersByOrderId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    var userBody = req.body;
    var headerToken = req.headers.authorization;
    _this.logger.info({
        function: 'UpdateServersByOrderId',
        userId: userId,
        orderId: orderId,

        userBody: userBody
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            _this.orderAPI.updateParameterByOrderId(userId, orderId, userBody, 'servers', '' , _this.otherServers,headerToken, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                    _this.orderAPI.updateParameterByOrderId(userId, orderId, userBody, 'servers', '' , _this.otherServers,headerToken, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var UpdateOrderItemByOrderId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    var orderItemBody = req.body;
    var isServer = req.query.isServer;

    var headerToken = req.headers.authorization;

    _this.logger.info('%j', { function: 'Order-Controller.UpdateOrderItemByOrderId received arguments', userId: userId, orderId: orderId, orderItemBody: orderItemBody });

    var validateSchema = [_this.Schema.AddOrderItemToOrderSchema,_this.Schema.orderItems,
        _this.Schema.childrenItemV1,_this.Schema.MoneySchema1];
    if(_this.validators.validateRequestBody(orderItemBody, validateSchema, res)) {
        if(_this.otherServers.oauth.TOKEN_OFF){
            if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                _this.orderAPI.updateOrderItemByOrderId(userId, orderId, orderItemBody, isServer, headerToken, _this.otherServers, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            } else {
                _this.httpHelper.sendFormattedResponse({
                    message: 'invalid_format: orderId',
                    data: orderId
                }, null, null, res);
            }
        } else {
            //_this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            _this.oauthUtils.checkPermission(req, {}, 'sprint', _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
                if(result){
                    if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                        _this.orderAPI.updateOrderItemByOrderId(userId, orderId, orderItemBody, isServer, headerToken, _this.otherServers, function (error, result) {
                            if (error) {
                                error.res = res;
                                _this.logger.error(error);
                            }
                            _this.responseUtilsAPI.processResponse(error, result, res);
                        });
                    } else {
                        _this.httpHelper.sendFormattedResponse({
                            message: 'invalid_format: orderId',
                            data: orderId
                        }, null, null, res);
                    }
                }
            });
        }
    }
};

var UpdateOrderItemPriceByOrderItemId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    var orderItemId = req.params.orderItemId;
    var priceBody = req.body;
    var isServer = req.query.isServer;
    _this.logger.info({
        function: 'UpdateOrderItemPriceByOrderItemId',
        userId: userId,
        orderId: orderId,
        orderItemId: orderItemId,
        orderItemPriceBody: JSON.stringify(priceBody)
    });
    var validateSchema = [_this.Schema.currencyCode];

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId) && _this.dataGenerationHelper.isValidUUID(orderItemId)) {
            _this.orderAPI.updateOrderItemParameterByOrderItemId(userId, orderId, orderItemId, priceBody, isServer, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            }, 'price');
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId or orderItemId',
                data: 'orderId: '+orderId+' ,orderItemId:'+orderItemId
            }, null, null, res);
        }
    } else {
        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId) && _this.dataGenerationHelper.isValidUUID(orderItemId)) {
                    _this.orderAPI.updateOrderItemParameterByOrderItemId(userId,orderId,orderItemId,priceBody,isServer,function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    },'price');
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId or orderItemId',
                        data: 'orderId: '+orderId+' ,orderItemId:'+orderItemId
                    }, null, null, res);
                }
            }
        });
    }
};

var UpdateOrderItemQuantityByOrderItemId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    var orderItemId = req.params.orderItemId;
    var quantity = req.params.quantity;
    var isServer = req.query.isServer;
    _this.logger.info({
        function: 'UpdateOrderItemQuantityByOrderItemId',
        userId: userId,
        orderId: orderId,
        orderItemId:orderItemId,
        quantity:quantity
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId) && _this.dataGenerationHelper.isValidUUID(orderItemId)) {
            _this.orderAPI.updateOrderItemParameterByOrderItemId(userId,orderId,orderItemId,quantity,isServer,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            },'quantity');
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId or orderItemId',
                data: 'orderId: '+orderId+' ,orderItemId: '+orderItemId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId) && _this.dataGenerationHelper.isValidUUID(orderItemId)) {
                    _this.orderAPI.updateOrderItemParameterByOrderItemId(userId,orderId,orderItemId,quantity,isServer,function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    },'quantity');
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId or orderItemId',
                        data: 'orderId: '+orderId+' ,orderItemId: '+orderItemId
                    }, null, null, res);
                }
            }

        });
    }
};

var DeleteUsersByOrderId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    var ids = req.query.ids;
    var isServer = req.query.isServer;
    _this.logger.info({
        function: 'DeleteUsersByOrderId',
        userId: userId,
        orderId: orderId,
        ids:ids
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            _this.orderAPI.deleteUsersByOrderId(userId,orderId,ids,isServer,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.DELETE,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                    _this.orderAPI.deleteUsersByOrderId(userId,orderId,ids,isServer,function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var DeleteOrderItemByOrderItemId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;
    var orderItemId = req.params.orderItemId;
    var isServer = req.query.isServer;
    _this.logger.info({
        function: 'DeleteOrderItemByOrderItemId',
        userId: userId,
        orderId: orderId,
        orderItemId:orderItemId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId) && _this.dataGenerationHelper.isValidUUID(orderItemId)) {
            _this.orderAPI.deleteOrderItemByOrderItemId(userId,orderId,orderItemId,isServer,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId or orderItemId',
                data: 'orderId: '+orderId+' ,orderItemId:'+orderItemId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.DELETE,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId) && _this.dataGenerationHelper.isValidUUID(orderItemId)) {
                    _this.orderAPI.deleteOrderItemByOrderItemId(userId,orderId,orderItemId,isServer,function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId or orderItemId',
                        data: 'orderId: '+orderId+' ,orderItemId:'+orderItemId
                    }, null, null, res);
                }
            }

        });
    }
};

var GetOrders = function(req, res) {
    var _this = exports;
    var userId = req.query.userid;
    var from = req.query.from;
    var pageSize = req.query.pageSize;

    if(_this.otherServers.oauth.TOKEN_OFF){
        _this.orderAPI.getOrders(userId,from,pageSize,function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                _this.orderAPI.getOrders(userId,from,pageSize,function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            }

        });
    }
};

var DeleteOrdersByRestaurantId = function(req, res) {
    var _this = exports;
    var restaurantId = req.query.restaurantId;
    _this.logger.info({
        function: 'DeleteOrdersByRestaurantId',
        restaurantId:restaurantId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(restaurantId)) {
            _this.orderAPI.deleteOrdersByRestaurantId(restaurantId,function (error, result) {
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
    } else {

        _this.oauthUtils.checkPermission(req,{},_this.oauthPermission, _this.oauthUtils.ActionType.DELETE,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(restaurantId)) {
                    _this.orderAPI.deleteOrdersByRestaurantId(restaurantId,function (error, result) {
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

        });
    }
};

var GetHaveeatenRestaurantsByUserId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var key =  req.query.keyword;
    var from = req.query.from;
    var pageSize = req.query.pageSize;
    _this.logger.info({
        function: 'GetHaveeatenRestaurantsByUserId',
        userId:userId
    });
    if(_this.otherServers.oauth.TOKEN_OFF){
        _this.orderAPI.getHaveEatenRestaurantsByUserId(userId,key,from,pageSize,function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                _this.orderAPI.getHaveEatenRestaurantsByUserId(userId,key,from,pageSize,function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            }
        });
    }
};

var GetLastOrderTimeByUserId = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    _this.logger.info({
        function: 'GetLastOrderTimeByUserId',
        userId:userId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        _this.orderAPI.getLastOrderTimeByUserId(userId,function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                _this.orderAPI.getLastOrderTimeByUserId(userId,function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            }

        });
    }
};

var UpdateServerToTable = function(req, res) {
    var _this = exports;
    var restaurantId = req.params.restaurantId;
    var tableId = req.params.tableId;
    var userId = req.params.userId;
    _this.logger.info({
        function: 'UpdateServerToTable',
        restaurantId:restaurantId,
        tableId:tableId,
        userId:userId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(restaurantId) && _this.dataGenerationHelper.isValidUUID(tableId)) {
            _this.orderAPI.updateStaffToTable(restaurantId,tableId,userId,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            },'server',_this.otherServers);
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: restaurantId or tableId',
                data: 'restaurantId: '+restaurantId+' ,tableId: '+tableId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{},_this.oauthPermission, _this.oauthUtils.ActionType.UPDATE,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(restaurantId) && _this.dataGenerationHelper.isValidUUID(tableId)) {
                    _this.orderAPI.updateStaffToTable(restaurantId,tableId,userId,function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    },'server',_this.otherServers);
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: restaurantId or tableId',
                        data: 'restaurantId: '+restaurantId+' ,tableId: '+tableId
                    }, null, null, res);
                }
            }

        });
    }
};

var UpdateBusserToTable = function(req, res) {
    var _this = exports;
    var restaurantId = req.params.restaurantId;
    var tableId = req.params.tableId;
    var userId = req.params.userId;
    _this.logger.info({
        function: 'UpdateBusserToTable',
        restaurantId:restaurantId,
        tableId:tableId,
        userId:userId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(restaurantId) && _this.dataGenerationHelper.isValidUUID(tableId)) {
            _this.orderAPI.updateStaffToTable(restaurantId,tableId,userId,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            },'busser',_this.otherServers);
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: restaurantId or tableId',
                data: 'restaurantId: '+restaurantId+' ,tableId: '+tableId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(restaurantId) && _this.dataGenerationHelper.isValidUUID(tableId)) {
                    _this.orderAPI.updateStaffToTable(restaurantId,tableId,userId,function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    },'busser',_this.otherServers);
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: restaurantId or tableId',
                        data: 'restaurantId: '+restaurantId+' ,tableId: '+tableId
                    }, null, null, res);
                }
            }

        });
    }
};

var DeleteServerFromTable = function(req, res) {
    var _this = exports;
    var restaurantId = req.params.restaurantId;
    var tableId = req.params.tableId;
    var userId = req.params.userId;
    _this.logger.info({
        function: 'DeleteServerFromTable',
        restaurantId:restaurantId,
        tableId:tableId,
        userId:userId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(restaurantId) && _this.dataGenerationHelper.isValidUUID(tableId)) {
            _this.orderAPI.deleteStaffFromTable(restaurantId,tableId,userId,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            },'server');
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: restaurantId or tableId',
                data: 'restaurantId: '+restaurantId+' ,tableId: '+tableId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.DELETE,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(restaurantId) && _this.dataGenerationHelper.isValidUUID(tableId)) {
                    _this.orderAPI.deleteStaffFromTable(restaurantId,tableId,userId,function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    },'server');
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: restaurantId or tableId',
                        data: 'restaurantId: '+restaurantId+' ,tableId: '+tableId
                    }, null, null, res);
                }
            }

        });
    }
};

var DeleteBusserFromTable = function(req, res) {
    var _this = exports;
    var restaurantId = req.params.restaurantId;
    var tableId = req.params.tableId;
    var userId = req.params.userId;
    _this.logger.info({
        function: 'DeleteBusserFromTable',
        restaurantId:restaurantId,
        tableId:tableId,
        userId:userId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(restaurantId) && _this.dataGenerationHelper.isValidUUID(tableId)) {
            _this.orderAPI.deleteStaffFromTable(restaurantId,tableId,userId,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            },'busser');
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: restaurantId or tableId',
                data: 'restaurantId: '+restaurantId+' ,tableId: '+tableId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.DELETE,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(restaurantId) && _this.dataGenerationHelper.isValidUUID(tableId)) {
                    _this.orderAPI.deleteStaffFromTable(restaurantId,tableId,userId,function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    },'busser');
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: restaurantId or tableId',
                        data: 'restaurantId: '+restaurantId+' ,tableId: '+tableId
                    }, null, null, res);
                }
            }

        });
    }
};

var GetServersByTableId = function(req, res) {
    var _this = exports;
    var restaurantId = req.params.restaurantId;
    var tableId = req.params.tableId;
    _this.logger.info({
        function: 'GetServersByTableId',
        restaurantId:restaurantId,
        tableId:tableId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(restaurantId) && _this.dataGenerationHelper.isValidUUID(tableId)) {
            _this.orderAPI.getStaffByTableId(restaurantId,tableId,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            },'server');
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: restaurantId or tableId',
                data: 'restaurantId: '+restaurantId+' ,tableId: '+tableId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(restaurantId) && _this.dataGenerationHelper.isValidUUID(tableId)) {
                    _this.orderAPI.getStaffByTableId(restaurantId,tableId,function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    },'server');
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: restaurantId or tableId',
                        data: 'restaurantId: '+restaurantId+' ,tableId: '+tableId
                    }, null, null, res);
                }
            }

        });
    }
};

var GetBussersByTableId = function(req, res) {
    var _this = exports;
    var restaurantId = req.params.restaurantId;
    var tableId = req.params.tableId;
    _this.logger.info({
        function: 'GetBussersByTableId',
        restaurantId:restaurantId,
        tableId:tableId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(restaurantId) && _this.dataGenerationHelper.isValidUUID(tableId)) {
            _this.orderAPI.getStaffByTableId(restaurantId,tableId,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            },'busser');
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: restaurantId or tableId',
                data: 'restaurantId: '+restaurantId+' ,tableId: '+tableId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(restaurantId) && _this.dataGenerationHelper.isValidUUID(tableId)) {
                    _this.orderAPI.getStaffByTableId(restaurantId,tableId,function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    },'busser');
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: restaurantId or tableId',
                        data: 'restaurantId: '+restaurantId+' ,tableId: '+tableId
                    }, null, null, res);
                }
            }

        });
    }
};

var GetTableByServerId = function(req, res) {
    var _this = exports;
    var restaurantId = req.params.restaurantId;
    var userId = req.params.userId;
    _this.logger.info({
        function: 'GetTableByServerId',
        restaurantId:restaurantId,
        userId:userId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(restaurantId)) {
            _this.orderAPI.getTableByStaffId(restaurantId,userId,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            },'server');
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: restaurantId',
                data: restaurantId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(restaurantId)) {
                    _this.orderAPI.getTableByStaffId(restaurantId,userId,function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    },'server');
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: restaurantId',
                        data: restaurantId
                    }, null, null, res);
                }
            }

        });
    }
};

var GetTableByBusserId = function(req, res) {
    var _this = exports;
    var restaurantId = req.params.restaurantId;
    var userId = req.params.userId;
    _this.logger.info({
        function: 'GetTableByBusserId',
        restaurantId:restaurantId,
        userId:userId
    });
    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(restaurantId)) {
            _this.orderAPI.getTableByStaffId(restaurantId,userId,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            },'busser');
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: restaurantId',
                data: restaurantId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req,{},_this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(restaurantId)) {
                    _this.orderAPI.getTableByStaffId(restaurantId,userId,function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    },'busser');
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: restaurantId',
                        data: restaurantId
                    }, null, null, res);
                }
            }

        });
    }
};

var UpdateTableAssignment = function(req, res) {
    var _this = exports;
    var restaurantId = req.params.restaurantId;
    var assignmentBody = req.body;
    _this.logger.info({
        function: 'UpdateTableAssignment',
        restaurantId:restaurantId,
        assignmentBody:JSON.stringify(assignmentBody)
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(restaurantId)) {
            _this.orderAPI.updateTableAssignment(restaurantId,assignmentBody,function (error, result) {
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
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(restaurantId)) {
                    _this.orderAPI.updateTableAssignment(restaurantId,assignmentBody,function (error, result) {
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

        });
    }
};

var GetTableAssignments = function(req, res) {
    var _this = exports;
    var restaurantId = req.params.restaurantId;
    _this.logger.info({
        function: 'GetTableAssignments',
        restaurantId:restaurantId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(restaurantId)) {
            _this.orderAPI.getTableAssignments(restaurantId,function (error, result) {
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
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(restaurantId)) {
                    _this.orderAPI.getTableAssignments(restaurantId,function (error, result) {
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

        });
    }
};

var SetSettlement = function(req, res) {
    var _this = exports;
    var orderId = req.params.orderId;
    _this.logger.info({
        function: 'SetSettlement',
        orderId: orderId
    });
    if (_this.dataGenerationHelper.isValidUUID(orderId)) {
        if(_this.otherServers.oauth.TOKEN_OFF){
            _this.orderAPI.setSettlement( orderId, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.oauthUtils.checkPermission(req,{ },_this.oauthPermission , _this.oauthUtils.ActionType.UPDATE,res,function(error,result){
                if(result){
                    _this.orderAPI.setSettlement( orderId, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                }
            });
        }
    } else {
        _this.httpHelper.sendFormattedResponse({
            message: 'invalid_format: orderId',
            data: orderId
        }, null, null, res);
    }
};

var GetResumeOrders = function(req, res) {
    var _this = exports;
    var userId = req.params.userId;

    _this.logger.info({
        function: 'GetResumeOrders',
        userId: userId
    });
    if (_this.dataGenerationHelper.isValidUUID(userId)) {
        if(_this.otherServers.oauth.TOKEN_OFF){
            _this.orderAPI.getResumeOrders(userId, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.oauthUtils.checkPermission(req,{ },_this.oauthPermission , _this.oauthUtils.ActionType.UPDATE,res,function(error,result){
                if(result){
                    _this.orderAPI.getResumeOrders(userId, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                }
            });
        }
    } else {
        _this.httpHelper.sendFormattedResponse({
            message: 'invalid_format: userId',
            data: userId
        }, null, null, res);
    }
};

var SetOrderTips = function(req, res) {
    var _this = exports;
    var orderId = req.params.orderId;
    var tipsBody = req.body;
    _this.logger.info('%j', {function: 'SetOrderTips', orderId: orderId, tipsBody: tipsBody });

    if (_this.dataGenerationHelper.isValidUUID(orderId)) {
        if(_this.validateRequestBody(tipsBody, [_this.Schema.orderTips],res)) {

            if(_this.otherServers.oauth.TOKEN_OFF){
                _this.orderAPI.setOrderTips( orderId, tipsBody, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            } else {
                _this.oauthUtils.checkPermission(req,{ },_this.oauthPermission , _this.oauthUtils.ActionType.UPDATE,res,function(error,result){
                    if(result){
                        _this.orderAPI.setOrderTips( orderId, tipsBody, function (error, result) {
                            if (error) {
                                error.res = res;
                                _this.logger.error(error);
                            }
                            _this.responseUtilsAPI.processResponse(error, result, res);
                        });
                    }
                });
            }
        }
    } else {
        _this.httpHelper.sendFormattedResponse({
            message: 'invalid_format: orderId',
            data: orderId
        }, null, null, res);
    }
};

var GetHealthCheck = function(req, res) {
    var _this = exports;

    if(_this.otherServers.oauth.TOKEN_OFF){
        _this.orderAPI.getHealthCheck(function(error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    } else {
        _this.oauthUtils.checkPermission(req, { }, _this.oauthPermission , _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result){
                _this.orderAPI.getHealthCheck(function(error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            }
        });
    }
};

var BatchUpdateUserInfo = function(req, res ){
    var _this = exports;
    var userId = req.params.userId;
    var userBody = req.body;
    var userName = userBody.userName;
    var avatarPath = userBody.avatarPath;
    _this.orderAPI.batchUpdateUserInfo(userId,userName,avatarPath, function (error, result) {
        if (error) {
            error.res = res;
            _this.logger.error(error);
        }
        _this.responseUtilsAPI.processResponse(error, result, res);
    });
};

var GetOrdersByUserIdV2 = function(req, res) {
    var _this = exports;
    var userId = req.params.user_id;
    var restaurantId = req.query.restaurant_id;
    var isServer = req.query.is_server;
    var tableId = req.query.table_id;
    var status = req.query.status;
    var allIncluded = req.query.all_included;
    var from = req.query.from;
    var pageSize = req.query.page_size;
    var includeEmptyTable = req.query.include_empty_table;
    var beginDatetime = req.query.date_time_from;
    var endDatetime = req.query.date_time_to;
    _this.logger.info({
        function: 'GetOrdersByUserIdV2',
        userId: userId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (restaurantId === undefined || _this.dataGenerationHelper.isValidUUID(restaurantId)) {
            _this.orderAPI.getOrdersByUserIdV2(userId,restaurantId,tableId,isServer,status,from,pageSize,allIncluded,includeEmptyTable,beginDatetime,endDatetime, function (error, result) {
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
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                if (restaurantId === undefined || _this.dataGenerationHelper.isValidUUID(restaurantId)) {
                    _this.orderAPI.getOrdersByUserIdV2(userId,restaurantId,tableId,isServer,status,from,pageSize,allIncluded,includeEmptyTable,beginDatetime,endDatetime, function (error, result) {
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

        });
    }
};

var GetTransactions = function(req, res) {
    var _this = exports;
    var restaurantName = req.query.restaurantName;
    var orderId = req.query.orderId;
    var startTime = req.query.date_time_from;
    var endTime = req.query.date_time_to;
    var from = req.query.from;
    var pageSize = req.query.pageSize;

    var headerToken = req.headers.authorization;

    _this.logger.info({
        function: 'GetTransactions',
        restaurantName: restaurantName,
        orderId: orderId,
        startTime: startTime,
        endTime: endTime,
        from: from,
        pageSize: pageSize
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        _this.orderAPI.getTransactions(restaurantName, orderId, startTime, endTime, from, pageSize, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                _this.orderAPI.getTransactions(restaurantName, orderId, startTime, endTime, from, pageSize, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            }

        });
    }
};

//-- FBE-963: [Orders] New v2 API to GET Bill by OrderID
var GetBillByOrderId = function(req, res) {
    var _this = exports;
    var reqParams = {
        orderId:  req.params.order_id,
        userId: req.query.user_id,
        isServer: req.query.is_server === 'TRUE' || req.query.is_server === '' || !req.query.is_server? true:false,
        useBlueDollars: req.query.use_blue_dollars === 'TRUE' || req.query.use_blue_dollars === '' || !req.query.use_blue_dollars? true:false,
        buyBlueDollars: req.query.buy_blue_dollars === 'TRUE' || req.query.buy_blue_dollars === '' || !req.query.buy_blue_dollars? true:false,
        useGoldDollars: false,
        isOnlinePayment: req.query.is_online_payment === 'TRUE' || req.query.is_online_payment === '' || !req.query.is_online_payment? true:false,
        headerToken: req.headers.authorization,
        otherServers: _this.otherServers,
        isResponseForV1: false   //-- FBE-1734: Deprecate GET Bill v1 and redirect the call to GET Bill v2; parse GET Bill v2 Response for v1
    };

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Controller.GetBillByOrderId received arguments', reqParams: reqParams });

    if (_this.dataGenerationHelper.isValidUUID(reqParams.orderId)) {
        if (!reqParams.userId || (reqParams.userId && _this.dataGenerationHelper.isValidUUID(reqParams.userId))) {
            if(_this.otherServers.oauth.TOKEN_OFF) {

                _this.orderAPI.getBillByOrderId(reqParams, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });

            } else {
                _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result) {
                    if (result) {
                        _this.orderAPI.getBillByOrderId(reqParams, function (error, result) {
                            if (error) {
                                error.res = res;
                                _this.logger.error(error);
                            }
                            _this.responseUtilsAPI.processResponse(error, result, res);
                        });
                    };
                });
            };
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: userId',
                data: reqParams.userId
            }, null, null, res);
        };
    } else {
        _this.httpHelper.sendFormattedResponse({
            message: 'invalid_format: orderId',
            data: reqParams.orderId
        }, null, null, res);
    };
};

//-- FBE-901: New v2 API to GET Restaurant Transactions
var GetRestaurantTransactions = function(req, res) {
    var _this = exports;

    var userId = req.query.user_id;
    var restaurantId = req.query.restaurant_id;
    var status = req.query.status;
    var orderId = req.query.order_id;
    var from = req.query.from;
    var pageSize = req.query.page_size;
    var dFrom = req.query.date_from;
    var dTo = req.query.date_to;
    var isOnlinePayment = req.query.is_online_payment;
    var onlinePaymentType = req.query.online_payment_type;
    var orderType = req.query.order_type;
    var comeFrom = req.query.come_from;
    var for_report = req.query.for_report !== undefined && req.query.for_report.toLowerCase() === 'true' ? true : false;
    var isActiveCity = req.query.is_active_city !== undefined && req.query.is_active_city.toLowerCase() === 'true' ? true : false;

    var reqParams = {
        userId: userId,
        restaurantId: restaurantId,
        status: status,
        orderId: orderId,
        from: from,
        pageSize: pageSize,
        dFrom: dFrom,
        dTo: dTo,
        isOnlinePayment: isOnlinePayment,
        onlinePaymentType: onlinePaymentType,
        orderType: orderType,
        comeFrom: comeFrom,
        forReport: for_report,
        isActiveCity: isActiveCity,
        otherServers: _this.otherServers,
        headerToken: req.headers.authorization
    };

    _this.logger.info('%j', { info: 'DEBUG-INFO: Order-Controller.GetRestaurantTransactions received arguments',
        reqParams: reqParams });

    if (_this.dataGenerationHelper.isValidUUID(reqParams.userId)) {
        if (_this.otherServers.oauth.TOKEN_OFF) {
            _this.orderAPI.getRestaurantTransactions(reqParams, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result) {
                if (result) {
                    _this.orderAPI.getRestaurantTransactions(reqParams, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                }
            });
        };
    } else {
        _this.httpHelper.sendFormattedResponse({
            message: 'invalid_format: userId',
            data: reqParams.userId
        }, null, null, res);
    };

};

var GetPastOrdersOnlyWithoutReview = function (req, res) {
    var _this = exports;
    var isTakeout;
    if(req.query.is_takeout){
        if(req.query.is_takeout.toLowerCase() ==='true'){
            isTakeout = true;
        }else if(req.query.is_takeout.toLowerCase() ==='false'){
            isTakeout = false;
        }
    }
    var reqParams = {
        userId: req.params.user_id || 0,
        from: req.query.from || 0,
        pageSize: req.query.page_size || 10,
        queryDateTime: req.query.query_date_time,
        osType: req.query.os_type,
        appVersion: req.query.app_version,
        deviceId: req.query.device_id,
        isTakeout : isTakeout,
        orderType: req.query.order_type,
        locale: req.query.locale,
        acceptEncoding: req.headers['accept-encoding']
    };

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.GetPastOrdersOnlyWithoutReview received arguments',
        reqParams: reqParams
    });

    var retrievePastOrdersOnlyWithoutReview = function () {
        _this.orderAPI.getPastOrdersOnlyWithoutReview(reqParams, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res, reqParams.acceptEncoding);
        });
    };

    if (_this.otherServers.oauth.TOKEN_OFF) {
        retrievePastOrdersOnlyWithoutReview();
    } else {
        //_this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function (error, result) {
        _this.oauthUtils.checkPermission(req, {},'sprint', _this.oauthUtils.ActionType.READ, res, function (error, result) {
            if (result) {
                retrievePastOrdersOnlyWithoutReview();
            }
        });
    }
};

var FixOldData = function (req, res) {
    var _this = exports;

    var headerToken = req.headers.authorization;

    var fixOldData = function () {
        _this.orderAPI.fixOldData(_this.otherServers ,headerToken, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    };

    if (_this.otherServers.oauth.TOKEN_OFF) {
        fixOldData();
    } else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function (error, result) {
            if (result) {
                fixOldData();
            }
        });
    }
};

var GetOrderItemsComments = function (req, res) {
    var _this = exports;

    var reqParams = {
        userId: req.params.user_id,
        orderId: req.params.order_id,
        locale: req.query.locale
    };

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.GetOrderItemsComments received arguments',
        reqParams: reqParams
    });

    var getOrderItems = function () {
        _this.orderAPI.getOrderItemsComments(reqParams, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    };

    if (_this.otherServers.oauth.TOKEN_OFF) {
        getOrderItems();
    } else {
        //_this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function (error, result) {
        _this.oauthUtils.checkPermission(req, {}, 'sprint', _this.oauthUtils.ActionType.READ, res, function (error, result) {
            if (result) {
                getOrderItems();
            }
        });
    }
};

var GetCurrentOrder = function (req, res) {
    var _this = exports;

    var userId = req.params.user_id;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.GetCurrentOrder received arguments',
        userId: userId
    });

    var GetCurrentOrder = function () {
        _this.orderAPI.getCurrentOrder(userId, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    };

    if (_this.otherServers.oauth.TOKEN_OFF) {
        GetCurrentOrder();
    } else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function (error, result) {
            if (result) {
                GetCurrentOrder();
            }
        });
    }
};

var CloseOrderAsPaid = function (req, res) {
    var _this = exports;

    var userId = req.params.user_id;
    var orderId = req.params.order_id;
    var headerToken = req.headers.authorization;

    _this.logger.info({
        function: 'CloseOrderAsPaid',
        userId: userId,
        orderId: orderId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {

            _this.orderAPI.closeOrderAsPaid(userId, orderId, headerToken, _this.otherServers, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    } else {

        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                    _this.orderAPI.closeOrderAsPaid(userId, orderId, headerToken, _this.otherServers, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var GetPrintedFlags = function(req, res) {
    var _this = exports;
    var orderId = req.params.order_id;
    var isIncludeAll = req.query.isIncludeAll;
    var searchPrintedFlags = function() {
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            _this.orderAPI.getPrintedFlags(orderId, isIncludeAll, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: orderId
            }, null, null, res);
        }
    }
    if(_this.otherServers.oauth.TOKEN_OFF) {
        searchPrintedFlags();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                searchPrintedFlags();
            }
        });
    }

};

var GetChitPrintedFlags = function(req, res) {
    var _this = exports;
    var orderItemIds = req.query.order_item_id;
    orderItemIds  = orderItemIds.split(',');

    var getPrintedFlags = function() {
        _this.orderAPI.getChitPrintedFlags(orderItemIds, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        getPrintedFlags();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                getPrintedFlags();
            }
        });
    }
};

var UpdateOrderPrintedFlag = function(req, res) {
    var _this = exports;
    var orderId = req.params.order_id;
    var printedFlag = req.params.printed_flag;

    var updateFlags = function() {
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            _this.orderAPI.updateReceiptPrintedFlag(orderId, printedFlag, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: order_id',
                data: orderId
            }, null, null, res);
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        updateFlags();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            if(result) {
                updateFlags();
            }
        });
    }
};

var UpdateOrderItemPrintedFlag = function(req, res) {
    var _this = exports;
    var orderItemId = req.params.order_item_id;
    var printedFlag = req.params.printed_flag;

    var updateFlag = function() {
        if (_this.dataGenerationHelper.isValidUUID(orderItemId)) {
            _this.orderAPI.updateChitPrintedFlag(orderItemId, printedFlag, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: order_item_id',
                data: order_item_id
            }, null, null, res);
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        updateFlag();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            if(result) {
                updateFlag();
            }
        });
    }

};

var UpdateOrderItemsPrintedFlag = function(req, res) {
    var _this = exports;
    var orderItemIds = req.query.order_item_id;
    orderItemIds  = orderItemIds.split(',');
    var printedFlag = req.params.printed_flag;

    var updateFlag = function() {
        _this.orderAPI.updateChitPrintedFlags(orderItemIds, printedFlag, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        updateFlag();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            if(result) {
                updateFlag();
            }
        });
    }

};

//-- FBE-1615 & FBE-1701: v2 Update Order - add order items - (per unit price or fix price)
var AddOrderItemsAnyTypeOfPrice = function(req, res) {
    var _this = exports;
    var arrayOfSchemas = [];

    var addOrderItemsAnyTypeOfPriceParams = {
        orderId: req.params.order_id,
        userId: req.params.user_id,
        isServer: (!req.query.is_server || req.query.is_server === 'FALSE') ? false : true,
        jsonBody: req.body
    };

    _this.logger.info('%j', { function: 'Order-Controller.AddOrderItemsPerUnitPrice received arguments',
        addOrderItemsAnyTypeOfPriceParams: addOrderItemsAnyTypeOfPriceParams });

    if (addOrderItemsAnyTypeOfPriceParams.jsonBody.is_unit_mandatory) {
        arrayOfSchemas.push(_this.Schema.AddOrderItemsPerUnitPrice);
    } else {
        arrayOfSchemas.push(_this.Schema.AddOrderItemsFixPrice);
    };
    arrayOfSchemas.push(_this.Schema.ChildrenItemV2);

    var addOrderItemsAnyTypeOfPrice = function() {
        _this.orderAPI.addOrderItemsAnyTypeOfPrice(addOrderItemsAnyTypeOfPriceParams, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    };

    if (_this.validators.validateRequestBody(addOrderItemsAnyTypeOfPriceParams.jsonBody, arrayOfSchemas, res)) {
        //-- Currently being skipped due to tight deadline but the array of Schemas are already defined
    }
        if(_this.otherServers.oauth.TOKEN_OFF){
            if (_this.dataGenerationHelper.isValidUUID(addOrderItemsAnyTypeOfPriceParams.orderId)) {
                addOrderItemsAnyTypeOfPrice();
            } else {
                _this.httpHelper.sendFormattedResponse({
                    message: 'invalid_format: orderId',
                    data: addOrderItemsAnyTypeOfPriceParams.orderId
                }, null, null, res);
            }
        } else {
            _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
                if(result){
                    if (_this.dataGenerationHelper.isValidUUID(addOrderItemsAnyTypeOfPriceParams.orderId)) {
                        addOrderItemsAnyTypeOfPrice();
                    } else {
                        _this.httpHelper.sendFormattedResponse({
                            message: 'invalid_format: orderId',
                            data: addOrderItemsAnyTypeOfPriceParams.orderId
                        }, null, null, res);
                    }
                }
            });
        }

};

var GetSingleOrderDetails = function(req, res) {
    var _this = exports;
    var arrayOfSchemas = [];

    var getSingleOrderDetailsParams = {
        orderId: req.params.order_id,
        isServer: (!req.query.is_server || req.query.is_server === 'FALSE') ? false : true
    };

    _this.logger.info('%j', { function: 'Order-Controller.GetSingleOrderDetails received arguments',
        getSingleOrderDetailsParams: getSingleOrderDetailsParams });

    var getSingleOrderDetails_fun = function() {
        _this.orderAPI.getSingleOrderDetails(getSingleOrderDetailsParams, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    };

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(getSingleOrderDetailsParams.orderId)) {
            getSingleOrderDetails_fun();
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: getSingleOrderDetailsParams.orderId
            }, null, null, res);
        }
    } else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(getSingleOrderDetailsParams.orderId)) {
                    getSingleOrderDetails_fun();
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: getSingleOrderDetailsParams.orderId
                    }, null, null, res);
                }
            }
        });
    }

};

var GetSimplifiedBillByOrderId = function(req, res) {
    var _this = exports;
    var reqParams = {
        orderId:  req.params.order_id,
        userId: req.query.user_id,
        isServer: req.query.is_server === 'TRUE' || req.query.is_server === '' || !req.query.is_server? true:false,
        useBlueDollars: req.query.use_blue_dollars === 'TRUE' || req.query.use_blue_dollars === '' || !req.query.use_blue_dollars? true:false,
        buyBlueDollars: req.query.buy_blue_dollars === 'TRUE' || req.query.buy_blue_dollars === '' || !req.query.buy_blue_dollars? true:false,
        useGoldDollars: req.query.use_gold_dollars === 'TRUE' || req.query.use_gold_dollars === '' || !req.query.use_gold_dollars? true:false,
        isOnlinePayment: req.query.is_online_payment === 'TRUE' || req.query.is_online_payment === 'true' || !req.query.is_online_payment? true:false,
        locale: req.query.locale === '' || req.query.locale === undefined || req.query.locale === null ? _this.enums.LocaleCode.EN_US : req.query.locale,
        headerToken: req.headers.authorization,
        otherServers: _this.otherServers,
        defaultTip: 0,                  // FBE-2111: in simple bill the default tips is 0
        isResponseForSimplifiedV2: true  //-- Edited by Richard 2015-09-21
    };
    if(reqParams.isOnlinePayment === true){
        reqParams.useBlueDollars = true;
        reqParams.buyBlueDollars = true;
        reqParams.useGoldDollars = false;
    }else{
        reqParams.useBlueDollars = false;
        reqParams.buyBlueDollars = false;
        reqParams.useGoldDollars = false;
    }
    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Controller.GetBillByOrderId_V3 received arguments', reqParams: reqParams });

    if (_this.dataGenerationHelper.isValidUUID(reqParams.orderId)) {
        if (!reqParams.userId || (reqParams.userId && _this.dataGenerationHelper.isValidUUID(reqParams.userId))) {
            if(_this.otherServers.oauth.TOKEN_OFF) {

                _this.orderAPI.getBillByOrderId(reqParams, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });

            } else {
                //_this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result) {
                _this.oauthUtils.checkPermission(req, {}, 'sprint', _this.oauthUtils.ActionType.READ, res, function(error, result) {
                    if (result) {
                        _this.orderAPI.getBillByOrderId(reqParams, function (error, result) {
                            if (error) {
                                error.res = res;
                                _this.logger.error(error);
                            }
                            _this.responseUtilsAPI.processResponse(error, result, res);
                        });
                    };
                });
            };
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: userId',
                data: reqParams.userId
            }, null, null, res);
        };
    } else {
        _this.httpHelper.sendFormattedResponse({
            message: 'invalid_format: orderId',
            data: reqParams.orderId
        }, null, null, res);
    };
};

var CloseOrder = function(req, res) {
    var _this = exports;
    var reqParams = {
        userId : req.params.user_id,
        orderId : req.params.order_id,
        isServer :req.query.is_server === 'TRUE' || req.query.is_server === '' || !req.query.is_server? true:false,
        isOnlinePayment : req.query.is_online_payment === 'TRUE' || req.query.is_online_payment === 'TRUE' || !req.query.is_online_payment? true:false,
        otherServers: _this.otherServers,
        headerToken : req.headers.authorization
    };
    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Controller.CloseOrder received arguments', reqParams: reqParams });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(reqParams.orderId)) {

            _this.orderAPI.closeOrder(reqParams, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: reqParams.orderId
            }, null, null, res);
        }
    } else {

        //_this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
        _this.oauthUtils.checkPermission(req, {}, 'sprint', _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(reqParams.orderId)) {
                    _this.orderAPI.closeOrder(reqParams, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: orderId',
                        data: reqParams.orderId
                    }, null, null, res);
                }
            }

        });
    }
};

var CancelOrder = function(req, res) {
    var _this = exports;

    var reqParams = {
        userId : req.params.user_id,
        orderId : req.params.order_id,
        isServer: !req.query.is_server ? false : req.query.is_server.toLowerCase() === 'true',
        reason: req.body.reason,
        headerToken : req.headers.authorization
    };

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Controller.CancelOrder received arguments', reqParams: reqParams});

    var cancelOrder = function () {

        if (!_this.dataGenerationHelper.isValidUUID(reqParams.userId)) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: userId',
                data: reqParams.userId
            }, null, null, res);
        } else if (!_this.dataGenerationHelper.isValidUUID(reqParams.orderId)) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: orderId',
                data: reqParams.orderId
            }, null, null, res);
        } else {
            _this.orderAPI.cancelOrder(reqParams, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }

    }

    if(_this.otherServers.oauth.TOKEN_OFF){
        cancelOrder();
    } else {

        _this.oauthUtils.checkPermission(req, {}, 'order', _this.oauthUtils.ActionType.UPDATE, res, function(error, result){
            if(result){
                cancelOrder();
            }
        });
    }
};

var RequestBill = function(req, res) {
    var _this = exports;
    var params = {
        user_id: req.params.user_id,
        order_id: req.params.order_id,
        otherServers: _this.otherServers,
        headerToken : req.headers.authorization
    }

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.RequestBill received arguments',
        params: params
    });

    var dealWithRequestBill = function() {
        var userIdValid = _this.dataGenerationHelper.isValidUUID(params.user_id);
        var orderIdValid = _this.dataGenerationHelper.isValidUUID(params.order_id);
        if(!userIdValid || !orderIdValid) {
            if(!userIdValid) {
                _this.httpHelper.sendFormattedResponse({
                    message: 'invalid_format: user_id',
                    data: req.params.user_id
                }, null, null, res);
            } else {
                _this.httpHelper.sendFormattedResponse({
                    message: 'invalid_format: order_id',
                    data: req.params.restaurant_id
                }, null, null, res);
            }
        } else {
            _this.orderAPI.requestBill(params, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }
    }

    if (_this.otherServers.oauth.TOKEN_OFF) {
        dealWithRequestBill();
    } else {
        _this.oauthUtils.checkPermission(req, {}, 'sprint', _this.oauthUtils.ActionType.READ, res, function(error, result) {
            if (result) {
                dealWithRequestBill();
            }
        });
    }

}

var CreateSimpleOrder = function (req, res) {
    var _this = exports;

    var reqParams = {
        userId: req.params.user_id,
        isServer: req.query.is_server === undefined ? false : req.query.is_server.toLowerCase() === 'true',
        isTakeout: req.query.is_takeout === undefined ? false : req.query.is_takeout.toLowerCase() === 'true',
        isAA: req.query.is_aa === undefined ? false : req.query.is_aa.toLowerCase() === 'true',
        orderType: req.query.order_type,
        restaurantId: req.body.restaurant_id,
        deviceId: req.body.device_id,
        deliveryAddressId: req.body.delivery_address_id,
        deliveryInterval: req.body.delivery_interval,
        orderItems: req.body.order_items,
        note: req.body.note,
        headerToken: req.headers.authorization
    }

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.CreateTakeoutOrder',
        reqParams: reqParams
    });

    var createSimpleOrder = function () {
        var validateSchema = [_this.Schema.SimpleOrderSchema,_this.Schema.SimpleOrderItemsSchema, _this.Schema.SimpleOrderItemsCombinationsSchema];

        if(_this.validateRequestBody(req.body, validateSchema, res)){
            if (!_this.dataGenerationHelper.isValidUUID(reqParams.userId)) {
                _this.httpHelper.sendFormattedResponse({
                    message: 'invalid_format: user_id',
                    data: reqParams.userId
                }, null, null, res);
            } else if (!_this.dataGenerationHelper.isValidUUID(reqParams.restaurantId)) {
                _this.httpHelper.sendFormattedResponse({
                    message: 'invalid_format: restaurantId',
                    data: reqParams.restaurantId
                }, null, null, res);
            } else {
                if (reqParams.isTakeout || reqParams.orderType === _this.enums.OrderType.PREORDER ||
                    reqParams.orderType === _this.enums.OrderType.DELIVERY || reqParams.orderType === _this.enums.OrderType.DINNER) {
                    _this.orderAPI.createSimpleOrder(reqParams, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    //_this.orderAPI.createOrder(orderBody, _this.otherServers, reqParams.headerToken, function (error, result) {
                    //    if (error) {
                    //        error.res = res;
                    //        _this.logger.error(error);
                    //    }
                    //    _this.responseUtilsAPI.processResponse(error, result, res);
                    //}, reqParams.isServer);

                    _this.responseUtilsAPI.processResponse(null, {status: 201, data: ''}, res);
                }
            }
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        createSimpleOrder();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.CREATE,res,function(error,result){
            if(result){
                createSimpleOrder();
            }

        });
    }
}

var UpdateOrderNotes = function (req, res) {
    var _this = exports;

    var reqParams = {
        orderId: req.params.order_id,
        note: req.body
    }

    var updateOrderNotes = function () {
        if(_this.validateRequestBody(req.body, [_this.Schema.OrderNoteSchema], res)) {
            if (!_this.dataGenerationHelper.isValidUUID(reqParams.orderId)) {
                _this.httpHelper.sendFormattedResponse({
                    message: 'invalid_format: order_id',
                    data: reqParams.orderId
                }, null, null, res);
            } else {
                _this.orderAPI.updateOrderNotes(reqParams, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            }
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        updateOrderNotes();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.UPDATE, res,function(error,result){
            if(result){
                updateOrderNotes();
            }

        });
    }
}

var UpdateOrderPickedUpTime = function (req, res) {
    var _this = exports;

    var reqParams = {
        orderId: req.params.order_id,
        pickedUpTimeChangeBody: req.body,
        headerToken: req.headers.authorization,
        otherServers: _this.otherServers
    };

    var updateOrderPickedUpTime = function () {
        if(_this.validateRequestBody(req.body, [_this.Schema.OrderPickedUpTimeSchema], res)) {
            if (!_this.dataGenerationHelper.isValidUUID(reqParams.orderId)) {
                _this.httpHelper.sendFormattedResponse({
                    message: 'invalid_format: order_id',
                    data: reqParams.orderId
                }, null, null, res);
            } else {
                _this.orderAPI.updateOrderPickedUpTime(reqParams, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            }
        }
    };

    if(_this.otherServers.oauth.TOKEN_OFF) {
        updateOrderPickedUpTime();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.UPDATE, res,function(error,result){
            if(result){
                updateOrderPickedUpTime();
            }

        });
    }
};

var GetRestaurantPastOrdersOnlyWithoutReview = function (req, res) {
    var _this = exports;
    var isTakeout;
    if(req.query.is_takeout){
        if(req.query.is_takeout.toLowerCase() ==='true'){
            isTakeout = true;
        }else if(req.query.is_takeout.toLowerCase() ==='false'){
            isTakeout = false;
        }
    }

    var includeCancelledOrder = false;
    if(req.query.include_cancelled_order && req.query.include_cancelled_order.toLowerCase() ==='true'){
        includeCancelledOrder = true;
    }
    var reqParams = {
        restaurantId: req.params.restaurant_id || 0,
        from: req.query.from || 0,
        pageSize: req.query.page_size || 10,
        queryDateTime: req.query.query_date_time,
        osType: req.query.os_type,
        appVersion: req.query.app_version,
        deviceId: req.query.device_id,
        isTakeout : isTakeout,
        includeCancelledOrder : includeCancelledOrder,
        orderType: req.query.order_type,
        acceptEncoding: req.headers['accept-encoding']
    };

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.GetRestaurantPastOrdersOnlyWithoutReview received arguments',
        reqParams: reqParams
    });

    var retrieveRestaurantPastOrdersOnlyWithoutReview = function () {
        _this.orderAPI.getRestaurantPastOrdersOnlyWithoutReview(reqParams, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res, reqParams.acceptEncoding);
        });
    };

    if (_this.otherServers.oauth.TOKEN_OFF) {
        retrieveRestaurantPastOrdersOnlyWithoutReview();
    } else {
        //_this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function (error, result) {
        _this.oauthUtils.checkPermission(req, {},'sprint', _this.oauthUtils.ActionType.READ, res, function (error, result) {
            if (result) {
                retrieveRestaurantPastOrdersOnlyWithoutReview();
            }
        });
    }
};

var UpdateOrderPrint = function (req, res) {
    var _this = exports;

    var reqParams = {
        orderId: req.params.order_id,
        action: req.params.action,
        headerToken: req.headers.authorization
    }

    var updateOrderPrint = function () {
        if (!_this.dataGenerationHelper.isValidUUID(reqParams.orderId)) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: order_id',
                data: reqParams.orderId
            }, null, null, res);
        } else {
            _this.orderAPI.updateOrderPrint(reqParams, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        updateOrderPrint();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.UPDATE, res,function(error,result){
            if(result){
                updateOrderPrint();
            }

        });
    }
}

var GetRestaurantOrderStat = function (req, res) {
    var _this = exports;

    var reqParams = {
        restaurantId: req.params.restaurant_id,
        startDate: req.query.start_date,
        endDate: req.query.end_date,
        headerToken: req.headers.authorization
    }

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.GetRestaurantOrderStat',
        reqParams: reqParams
    });

    var getRestaurantOrderStat = function () {
        if (!_this.dataGenerationHelper.isValidUUID(reqParams.restaurantId)) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: restaurant_id',
                data: reqParams.restaurantId
            }, null, null, res);
        }else {

            _this.orderAPI.getRestaurantOrderStat(reqParams, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        getRestaurantOrderStat();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.READ, res,function(error,result){
            if(result){
                getRestaurantOrderStat();
            }

        });
    }
}

var GetCurrencyOrderStat = function (req, res) {
    var _this = exports;

    var reqParams = {
        currency: req.params.currency,
        startDate: req.query.start_date,
        endDate: req.query.end_date,
        headerToken: req.headers.authorization
    }

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.GetCurrencyOrderStat',
        reqParams: reqParams
    });

    var getRestaurantOrderStat = function () {
        _this.orderAPI.getCurrencyOrderStat(reqParams, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        getRestaurantOrderStat();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.READ, res,function(error,result){
            if(result){
                getRestaurantOrderStat();
            }

        });
    }
}

var GetRestaurantSummary = function (req, res) {
    var _this = exports;

    var reqParams = {
        restaurantId: req.params.restaurant_id,
        isTakeout: req.query.is_takeout === undefined ? '' : req.query.is_takeout.toLowerCase() === 'true',
        startTime: req.query.query_start_time,
        endTime: req.query.query_end_time,
        headerToken: req.headers.authorization
    }

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.GetRestaurantSummary',
        reqParams: reqParams
    });

    var GetRestaurantSummary = function () {
        if (!_this.dataGenerationHelper.isValidUUID(reqParams.restaurantId)) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: restaurant_id',
                data: reqParams.restaurantId
            }, null, null, res);
        }else {

            _this.orderAPI.getRestaurantSummary(reqParams, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        GetRestaurantSummary();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.READ, res,function(error,result){
            if(result){
                GetRestaurantSummary();
            }

        });
    }
}

var EditOrderItems = function (req, res) {
    var _this = exports;

    var reqParams = {
        userId: req.params.user_id,
        orderId: req.params.order_id,
        batchNo: !req.query.batch_no ? '' : parseInt(req.query.batch_no),
        orderItems: req.body.order_items,
        headerToken: req.headers.authorization
    }

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.EditOrderItems',
        reqParams: reqParams
    });

    var editOrderItems = function () {
        if (!_this.dataGenerationHelper.isValidUUID(reqParams.userId)) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: user_id',
                data: reqParams.userId
            }, null, null, res);
        } else if (!_this.dataGenerationHelper.isValidUUID(reqParams.orderId)) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: order_id',
                data: reqParams.orderId
            }, null, null, res);
        } else {

            var validateSchema = [_this.Schema.EditOrderItemsSchema, _this.Schema.EditOrderItemSchema];

            if(_this.validateRequestBody(req.body, validateSchema, res)) {
                _this.orderAPI.editOrderItems(reqParams, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            }
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        editOrderItems();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.UPDATE, res,function(error,result){
            if(result){
                editOrderItems();
            }

        });
    }
}

var UpdateOrderPrinters = function (req, res) {
    var _this = exports;

    var reqParams = {
        orderId: req.params.order_id,
        printerId: req.params.printer_id,
        printerBody: req.body,
        headerToken: req.headers.authorization
    }

    var updateOrderPrints = function () {
        if (!_this.dataGenerationHelper.isValidUUID(reqParams.orderId)) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: order_id',
                data: reqParams.orderId
            }, null, null, res);
        } else if (!_this.dataGenerationHelper.isValidUUID(reqParams.printerId)) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: printer_id',
                data: reqParams.printerId
            }, null, null, res);
        } else {
            if(_this.validateRequestBody(req.body, [_this.Schema.OrderPrintedNumberSchema],res)){
                _this.orderAPI.updateOrderPrints(reqParams, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            }
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        updateOrderPrints();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.UPDATE, res,function(error,result){
            if(result){
                updateOrderPrints();
            }

        });
    }
}

var UpdateOrderItemPrintedNumber = function(req, res) {
    var _this = exports;
    var reqParams = {
        orderId: req.params.order_id,
        orderItemId: req.params.order_item_id,
        printerId: req.params.printer_id,
        document: req.body
    }

    var updatePrintedNumber =function() {
        if(!_this.dataGenerationHelper.isValidUUID(reqParams.orderId) || !_this.dataGenerationHelper.isValidUUID(reqParams.orderItemId)
            || !_this.dataGenerationHelper.isValidUUID(reqParams.printerId)) {
            if(!_this.dataGenerationHelper.isValidUUID(reqParams.orderId)) {
                _this.httpHelper.sendFormattedResponse({
                    message: 'invalid_format: order_id',
                    data: reqParams.orderId
                }, null, null, res);
            } else {
                if(!_this.dataGenerationHelper.isValidUUID(reqParams.orderItemId)) {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: order_item_id',
                        data: reqParams.orderItemId
                    }, null, null, res);
                } else {
                    _this.httpHelper.sendFormattedResponse({
                        message: 'invalid_format: printer_id',
                        data: reqParams.printerId
                    }, null, null, res);
                }
            }
        } else {
            if(_this.validateRequestBody(reqParams.document, [_this.Schema.OrderItemPrintedNumberSchema], res)) {
                _this.orderAPI.updateOrderItemPrinter(reqParams, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            }
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        updatePrintedNumber();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.UPDATE, res,function(error,result){
            if(result){
                updatePrintedNumber();
            }
        });
    }

}

/**
 * Update task printed number
 *
 * @param req
 * @param res
 * @constructor
 */
var UpdatePrintedNumber =  function(req, res) {
    var _this = exports;
    var reqParams = {
        taskId: req.params.task_id,
        document: req.body
    }
    var updateTaskPrintedNumber = function() {
        if(!_this.dataGenerationHelper.isValidUUID(reqParams.taskId)) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: task_id',
                data: reqParams.taskId
            }, null, null, res);
        } else {
            if(_this.validateRequestBody(reqParams.document, [_this.Schema.TaskPrintedNumberSchema], res)) {
                _this.orderAPI.updatePrintedNumber(reqParams, function (error, result) {
                    if (error) {
                        error.res = res;
                        _this.logger.error(error);
                    }
                    _this.responseUtilsAPI.processResponse(error, result, res);
                });
            }
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        updateTaskPrintedNumber();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.UPDATE, res,function(error,result){
            if(result){
                updateTaskPrintedNumber();
            }
        });
    }

}
var PreOrderPrintNotice =  function(req, res) {
    var _this = exports;
    var userId = req.params.userId;
    var orderId = req.params.orderId;

    _this.logger.info({
        function: 'PreOrderPrintNotice',
        userId: userId,
        orderId: userId
    });

    if(_this.otherServers.oauth.TOKEN_OFF){
        if (_this.dataGenerationHelper.isValidUUID(orderId)) {
            _this.orderAPI.getOrderByOrderId(userId, orderId, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        } else {
            if (result.length === 1) {
                var order = result[0];
                _this.orderAPI.createPreOrderNoticePrintTask(order._id, order, function(error){
                    if(error){
                        _this.httpHelper.sendFormattedResponse({
                            message: 'invalid_format: orderId',
                            data: orderId
                        }, null, null, res);
                    }
                    else{
                        _this.logger.info("FUNCTION:order-controller.PreOrderPrintNotice ok");
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    }
                });
            }
        }
    } else {

        _this.oauthUtils.checkPermission(req,{}, _this.oauthPermission, _this.oauthUtils.ActionType.READ,res,function(error,result){
            if(result){
                if (_this.dataGenerationHelper.isValidUUID(orderId)) {
                    _this.orderAPI.getOrderByOrderId(userId, orderId, function (error, result) {
                        if (error) {
                            error.res = res;
                            _this.logger.error(error);
                        }
                        _this.responseUtilsAPI.processResponse(error, result, res);
                    });
                } else {
                    if (result.length === 1) {
                        var order = result[0];
                        _this.orderAPI.createPreOrderNoticePrintTask(order._id, order, function(error){
                            if(error){
                                _this.httpHelper.sendFormattedResponse({
                                    message: 'invalid_format: orderId',
                                    data: orderId
                                }, null, null, res);
                            }
                            else{
                                _this.logger.info("FUNCTION:order-controller.PreOrderPrintNotice ok");
                                _this.responseUtilsAPI.processResponse(error, result, res);
                            }
                        });
                    }
                }
            }

        });
    }
}

var GetPrintTasks = function (req, res) {
    var _this = exports;

    var reqParams = {
        deviceId: req.params.device_id,
        orderId: req.query.order_id,
        printerId: req.query.printer_id,
        startTime: req.query.start_time,
        locale: req.query.locale
    }

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.GetPrintTasks',
        reqParams: reqParams
    });

    var GetPrintTasks = function () {
        if (reqParams.deviceId === undefined || reqParams.deviceId === null) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: device_id',
                data: reqParams.deviceId
            }, null, null, res);
        }else {

            _this.orderAPI.getPrintTasks(reqParams, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        GetPrintTasks();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.READ, res,function(error,result){
            if(result){
                GetPrintTasks();
            }

        });
    }
}

var GetOperations = function (req, res) {
    var _this = exports;

    var reqParams = {
        restaurantId: req.query.restaurant_id,
        userId: req.query.user_id,
        action: req.query.action,
        startTime: req.query.query_start_time,
        endTime: req.query.query_end_time,
        from: req.query.from,
        pageSize: req.query.page_size,
        osType: req.query.os_type,
        appVersion: req.query.app_version,
        deviceId: req.query.device_id
    }

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.GetOperations',
        reqParams: reqParams
    });

    var GetOperations = function () {
        _this.orderAPI.getOperations(reqParams, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        GetOperations();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.READ, res,function(error,result){
            if(result){
                GetOperations();
            }

        });
    }
}

var UpdateCustomerCheckin = function (req, res) {
    var _this = exports;
    var reqParam = req.params;
    var userId = reqParam.user_id;
    var orderId = reqParam.order_id;
    var isServer = req.query.isServer;
    var action = req.params.action;  //'picked_up'
    var userBody = req.body;
    var headerToken = req.headers.authorization;

    //XXX currently this is only invoked on checking in. The default val is
    //true. Later is may support cancel( checkin value being false )
    //In database, checkin flag may be undefined, 'ordered', 'checked_in',
    //'cancelled'

    if (_this.dataGenerationHelper.isValidUUID(orderId)) {

        _this.orderAPI.updateCustomerCheckin(reqParam, function(error, result){
            if (error) {
                _this.logger.error('%j', { function: 'DEBUG-ERROR: order-controller.UpdateCustomerCheckin CreatePrintTask returns error', error: error});
                _this.httpHelper.sendFormattedResponse({ message: error}, null, null, res);
                return;
            } else {
                if (result.length === 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: order-controller.UpdateCustomerCheckin CreatePrintTask returns empty'});
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: order-controller.UpdateCustomerCheckin CreatePrintTask returns right'});
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            }
        });

    } else {
        _this.httpHelper.sendFormattedResponse({
            message: 'invalid_format: order_id',
            data: orderId
        }, null, null, res);
    }
}

var CustomerChangeTip = function (req, res) {
    var _this = exports;
    var reqParams = req.body;
    var orderId = req.params.order_id;

    if (_this.dataGenerationHelper.isValidUUID(orderId)) {
        _this.orderAPI.customerChangeTip(reqParams, orderId, function(error, result){
            if (error) {
                _this.logger.error('%j', { function: 'DEBUG-ERROR: order-controller.CustomerChangeTip returns error', error: error});
            } else {
                _this.logger.info('%j', { function: 'DEBUG-INFO: order-controller.CustomerChangeTip returns right'});
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });

    } else {
        _this.httpHelper.sendFormattedResponse({
            message: 'invalid_format: order_id',
            data: orderId
        }, null, null, res);
    }
}

var GetOrderStat = function (req, res) {
    var _this = exports;

    var isOnline = req.query.is_online_payment;
    if (isOnline) {
        isOnline = isOnline.toLowerCase() === 'true';
    }

    var reqParams = {
        statType: req.query.stat_type === null || req.query.stat_type === undefined || req.query.stat_type === ''
            ? _this.enums.StatType.SEPARATION : req.query.stat_type,
        timeType: req.query.time_type === null || req.query.time_type === undefined || req.query.time_type === ''
            ? _this.enums.CityRestaurantsOrderTimeType.DAY : req.query.time_type,
        isOnline: isOnline,
        includeCancelledOrder: req.query.include_cancelled_order ? req.query.include_cancelled_order.toLowerCase() === 'true' : false,
        startDate: req.query.start_date,
        endDate: req.query.end_date,
        headerToken: req.headers.authorization
    }

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.GetOrderStat',
        reqParams: reqParams
    });

    var getOrderStat = function () {
        _this.orderAPI.getOrderStat(reqParams, function (error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        });
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        getOrderStat();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.READ, res,function(error,result){
            if(result){
                getOrderStat();
            }

        });
    }
}

var GetCityRestaurantsOrderCountStat = function (req, res) {
    var _this = exports;

    var isOnline = req.query.is_online_payment;
    if (isOnline) {
        isOnline = isOnline.toLowerCase() === 'true';
    }

    var reqParams = {
        cityId: req.params.city_id,
        statType: req.query.stat_type === null || req.query.stat_type === undefined || req.query.stat_type === ''
            ? _this.enums.StatType.SEPARATION : req.query.stat_type,
        timeType: req.query.time_type === null || req.query.time_type === undefined || req.query.time_type === ''
                    ? _this.enums.CityRestaurantsOrderTimeType.DAY : req.query.time_type,
        isOnline: isOnline,
        startDate: req.query.start_date,
        endDate: req.query.end_date,
        headerToken: req.headers.authorization
    }

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Controller.GetRestaurantsDayOrderCountStat',
        reqParams: reqParams
    });

    var getCityRestaurantsOrderCountStat = function () {
        if (!_this.dataGenerationHelper.isValidUUID(reqParams.cityId)) {
            _this.httpHelper.sendFormattedResponse({
                message: 'invalid_format: city_id',
                data: reqParams.cityId
            }, null, null, res);
        } else {
            _this.orderAPI.getCityRestaurantsOrderCountStat(reqParams, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        getCityRestaurantsOrderCountStat();
    } else {
        _this.oauthUtils.checkPermission(req,{},'order',_this.oauthUtils.ActionType.READ, res,function(error,result){
            if(result){
                getCityRestaurantsOrderCountStat();
            }

        });
    }
}

//-- NOTE to Developers: For READABILITY purpose, PLEASE help maintain a double-spacing between two Functions declarations.//-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
//-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions (below) in alphabetical order
//-- NOTE to Developers (2015-05-13): 3) For READABILITY, please help to maintain double-spaces between functions declarations (above)

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
    var locale = _this.enums.LocaleCode.EN_US;
    if (process.argv[2] && process.argv[2] !== _this.enums.RegionCode.NA) {
        country = _this.enums.RegionCode.CHINA;
        locale = _this.enums.LocaleCode.ZH_CN;
    }
    _this.otherServers.country = country;
    _this.otherServers.locale = locale;

    var orderAPI = require('./../lib/order-api')(_this.app, _this.config, _this.mongoConfig, _this.logger);
    _this.orderAPI = orderAPI.order;
    _this.httpHelper = _this.backendHelpers.httpHelper();
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.loggerName = 'order';
    _this.logger = _this.app.log4jsHelper.initialize(_this.loggerName);

    _this.oauthUtils = _this.backendHelpers.oauthUtils;
    _this.oauthPermission = 'order';

    _this.Schema = _this.backendHelpers.Schemas;
    _this.validators = _this.backendHelpers.SchemaValidator;
    _this.validateRequestBody = _this.validators.validateRequestBody;    //-- Helpers, Schemas, and Validators
    _this.responseUtilsAPI = _this.backendHelpers.responseUtilsAPI;
    _this.logger.info('order-controller: initialized');

    _this.getHealthCheck = GetHealthCheck;
    _this.createOrder = CreateOrder;
    _this.getOrdersByUserId = GetOrdersByUserId;
    _this.getPastOrdersWithRating = GetPastOrdersWithRating;
    _this.getPastOrdersOnlyWithoutReview = GetPastOrdersOnlyWithoutReview;
    _this.getOrderByOrderId = GetOrderByOrderId;
    _this.deleteOrderByOrderId = DeleteOrderByOrderId;
    _this.getUsersByOrderId = GetUsersByOrderId;
    _this.getOrderItemsByOrderId = GetOrderItemsByOrderId;
    _this.getServersByOrderId = GetServersByOrderId;
    _this.updateUsersByOrderId = UpdateUsersByOrderId;
    _this.updateDiscountsByOrderId = UpdateDiscountsByOrderId;
    _this.updateActionByOrderId = UpdateActionByOrderId;
    _this.updateServersByOrderId = UpdateServersByOrderId;
    _this.updateTablesByOrderId = UpdateTablesByOrderId;
    _this.updateOrderItemByOrderId = UpdateOrderItemByOrderId;
    _this.updateOrderItemPriceByOrderItemId = UpdateOrderItemPriceByOrderItemId;
    _this.updateOrderItemQuantityByOrderItemId = UpdateOrderItemQuantityByOrderItemId;
    _this.deleteUsersByOrderId = DeleteUsersByOrderId;
    _this.deleteOrderItemByOrderItemId = DeleteOrderItemByOrderItemId;
    _this.getOrders = GetOrders;
    _this.deleteOrdersByRestaurantId = DeleteOrdersByRestaurantId;
    _this.getHaveEatenRestaurantsByUserId = GetHaveeatenRestaurantsByUserId;
    _this.getLastOrderTimeByUserId = GetLastOrderTimeByUserId;

    _this.updateServerToTable = UpdateServerToTable;
    _this.updateBusserToTable = UpdateBusserToTable;
    _this.deleteServerFromTable = DeleteServerFromTable;
    _this.deleteBusserFromTable = DeleteBusserFromTable;
    _this.getServersByTableId = GetServersByTableId;
    _this.getBussersByTableId = GetBussersByTableId;
    _this.getTableByServerId = GetTableByServerId;
    _this.getTableByBusserId = GetTableByBusserId;
    _this.updateTableAssignment = UpdateTableAssignment;
    _this.getTableAssignments = GetTableAssignments;

    _this.setOrderTips = SetOrderTips;
    _this.setSettlement = SetSettlement;
    _this.getResumeOrders = GetResumeOrders;

    _this.batchUpdateUserInfo = BatchUpdateUserInfo;
    _this.getOrdersByUserIdV2 = GetOrdersByUserIdV2;

    //-- FF-2413
    _this.closeOrderAsPaid = CloseOrderAsPaid;

    //-- Due to FBE-963, getBillsByOrderId() and unlockBillsByOrderId() got DEPRECATION Notice Date: 2015-05-10
    _this.getBillsByOrderId = GetBillsByOrderId;
    _this.unlockBillsByOrderId = UnlockBillsByOrderId;
    _this.getTransactions = GetTransactions;

    //-- V2 APIs to replace soon-to-be-deprecated ones
    _this.getBillByOrderId = GetBillByOrderId;
    _this.unlockBillByOrderId = UnlockBillsByOrderId; //-- Method UnlockBillByOrderId not created yet

    //-- FBE-1078: [Orders] New v2 API to GET Restaurant Transactions
    _this.getRestaurantTransactions = GetRestaurantTransactions;

    _this.fixOldData = FixOldData;

    _this.getOrderItemsComments = GetOrderItemsComments;
    _this.getCurrentOrder = GetCurrentOrder;

    //-- FBE-1515
    _this.getPrintedFlags = GetPrintedFlags;
    _this.getChitPrintedFlags = GetChitPrintedFlags;
    _this.updateOrderPrintedFlag = UpdateOrderPrintedFlag;
    _this.updateOrderItemPrintedFlag = UpdateOrderItemPrintedFlag;
    _this.updateOrderItemsPrintedFlag = UpdateOrderItemsPrintedFlag;

    //-- FBE-1615): v2 Update Order - add order items - per unit price
    _this.addOrderItemsAnyTypeOfPrice = AddOrderItemsAnyTypeOfPrice;
    _this.getSingleOrderDetails = GetSingleOrderDetails;

    _this.getSimplifiedBillByOrderId = GetSimplifiedBillByOrderId;
    _this.closeOrder = CloseOrder;
    _this.cancelOrder = CancelOrder;
    _this.requestBill = RequestBill;

    // FBE-2183
    _this.createSimpleOrder = CreateSimpleOrder;
    // FBE-2193
    _this.updateOrderNotes = UpdateOrderNotes;
    _this.updateOrderPickedUpTime = UpdateOrderPickedUpTime;
    _this.getRestaurantPastOrdersOnlyWithoutReview = GetRestaurantPastOrdersOnlyWithoutReview;

    _this.updateOrderPrint = UpdateOrderPrint;

    _this.getRestaurantOrderStat = GetRestaurantOrderStat;
    _this.getCurrencyOrderStat = GetCurrencyOrderStat;
    _this.getRestaurantSummary = GetRestaurantSummary;
    _this.getOrderStat = GetOrderStat;
    _this.getCityRestaurantsOrderCountStat = GetCityRestaurantsOrderCountStat;

    _this.editOrderItems = EditOrderItems;
    _this.updateOrderPrinters = UpdateOrderPrinters;
    // FBE-2529
    _this.updateOrderItemPrintedNumber = UpdateOrderItemPrintedNumber;
    // FBE-2550
    _this.updatePrintedNumber = UpdatePrintedNumber;

    _this.getPrintTasks = GetPrintTasks;
    _this.getOperations = GetOperations;
    _this.updateCustomerCheckin = UpdateCustomerCheckin;
    _this.customerChangeTip = CustomerChangeTip;
    _this.preOrderPrintNotice = PreOrderPrintNotice;

    return _this;
    //-- NOTE to Developers: For READABILITY purpose, PLEASE help maintain a double-spacing between two Functions declarations.//-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
    //-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions (below) in alphabetical order
    //-- NOTE to Developers (2015-05-13): 3) For READABILITY, please help to maintain double-spaces between functions declarations (above)

};
