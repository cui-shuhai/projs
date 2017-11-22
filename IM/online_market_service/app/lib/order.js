/**
 * Created by richardmaglaya on 2014-10-21.
 */
'use strict';
const os = require('os');
var moment = require('moment');

var async = require('async');
var http = require('http');
var moment = require('moment');
// accurately calculate payment
var accounting = require('accounting');
var xml2js = require('xml2js');
var co = require('co');
var momentzone = require('moment-timezone');
var fs = require("fs");

var PRINTEDFLAG = { TRUE: true, FALSE: false };

/*****************
 *
 * Local Function
 *
 *****************/

var unlockBill = function (orderId, callback) {
    var _this = exports;
    var criteria = {_id: orderId};
    var document = {$unset: {bill_status: 1}};
    var options = {};
    var helper = {
        collectionName: _this.enums.CollectionName.DINING_ORDERS,
        callerScript: 'File: order.js; Method: unlockBill()'
    };
    _this.restaurantDataAPI.update(criteria, document, options, helper, function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, result);
        }
    });
};

var isExpiryTime = function (lockTime, lockDurationMins) {
    var _this = exports;
    var isDue=false;
    var currentTime = _this.dataGenerationHelper.getValidUTCDate(),
    //-- This calculation needed polishing as it is not currently yielding similar result with the e2e test
        diffMins = Math.round((((currentTime - lockTime) % 86400000) % 3600000) / 60000);
    _this.logger.info('DEBUG-INFO: isExpiryTime : all time attributes %j', {
        lockTime: lockTime,
        currentTime: currentTime,
        lockDurationMins: lockDurationMins,
        diffMins: diffMins
    });

    if (diffMins > lockDurationMins) {
        isDue = true;
    } else {
        isDue = false;
    }
    return isDue;
}

var getCustomerInfo = function (userId, orderId, callback) {
    var _this = exports;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.getCustomerInfo received arguments', userId: userId, orderId: orderId});

    var selector = {'$and': [
        {_id: orderId },
        {'customers.user_id': userId}
    ]};
    var options = {fields: {'customers.$': 1}};
    var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

    _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
        if (error) {
            _this.logger.error('%j', {function: 'DEBUG-ERROR: Order.getCustomerInfo returns error', error: error});
            callback(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
        } else if (result === undefined || result === null || result === '' || result.length === 0) {
            _this.logger.error('%j', {function: 'DEBUG-ERROR: Order.getCustomerInfo returns empty'});
            callback(new _this.httpExceptions.ResourceNotFoundException('userId', userId));
        } else {
            var customer = result[0].customers[0];

            var customerInfo = {
                user_id: userId,
                user_name: customer.user_name,
                avatar_path: customer.avatar_path
            };

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.getCustomerInfo returns right'});
            callback(null, customerInfo);
        }
    });
};

var updateUser = function (userInfo, orderId, selectFlag, callback) {
    var _this = exports;
    var selector, criteria, document, apiresult, helper;
    if (selectFlag === 'users') {
        helper = {
            collectionName: _this.enums.CollectionName.DINING_ORDERS
        };
        selector = {_id:orderId, 'customers.userId': userInfo.userId};
    } else {
        helper = {
            collectionName: _this.enums.CollectionName.DINING_ORDERS
        };
        selector = {_id:orderId,'servers.userId': userInfo.userId};
    }
    var options = {};
    var flag = true;
    async.series([
        function (nextstep) {
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result !== null && result !== '' && result.length >0) {
                    flag = true;
                    nextstep();
                } else {
                    flag = false;
                    nextstep();
                }
            })
        },
        function (nextstep) {
            if (flag) {
                if (selectFlag === 'users') {
                    document = {$pull: { customers: {'userId':userInfo.userId}}};
                } else {
                    document = {$pull: { servers: {'userId':userInfo.userId}}};
                }
                _this.restaurantDataAPI.update(selector, document, options, helper, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        if (selectFlag === 'users') {
                            document = {$push: { customers: userInfo}};
                        } else {
                            document = {$push: { servers: userInfo}};
                        }
                        selector = {orderId:orderId};
                        _this.restaurantDataAPI.update(selector, document, options, helper, function (error) {
                            if (error) {
                                nextstep(error);
                            } else {
                                apiresult = {status:204};
                                nextstep();
                            }
                        });
                    }
                });
            } else {
                if (selectFlag === 'users') {
                    criteria = {orderId:orderId};
                    document = {$push: { customers: userInfo}};
                } else {
                    criteria = {_id:orderId};
                    document = {$push: { servers: userInfo}};
                }
                _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                    if (error) {
                        callback(error);
                    } else {
                        apiresult = {status:204};
                        nextstep();
                    }
                });
            }
        }
    ],function (error) {
        callback(error, apiresult);
    })
};

var recursiveUsersArray = function (usersArray, orderId, times, selectFlag, callback) {
    if (times >= usersArray.length) {

        callback(null,{status:204});
        return;
    }
    var userInfo = usersArray[times];
    updateUser(userInfo, orderId, selectFlag, function (error) {
        if (error) {
            callback(error);
        } else {
            times++;
            recursiveUsersArray(usersArray, orderId, times, selectFlag, callback);
        }
    });
}

var getUserInfo = function (userArray, otherServers, headerToken, callback) {
    var _this = exports;
    var userIds = [];
    var userInfoArray = [];
    userArray.forEach(function (user, index) {
        userIds.push(user.userId);
        if (index === userArray.length-1) {
            _this.getUserNameAndAvatar(userIds.join(','), otherServers, headerToken, true, function (error, resultRead) {
                for (var i=0; i<resultRead.length; i++) {
                    userInfoArray.push({
                        userId: resultRead[i]._id,
                        userName: resultRead[i].dispName,
                        avatarPath:resultRead[i].avatarPath
                    });
                }
                callback(null, userInfoArray);
            })
        }
    });
}

var isNotNull = function(value) {
    if (value !== null && value !== '' && value !== undefined) {
        return true;
    }

    return false;
}

var isNumber = function (value) {
    if (value == null || value === "" || value == undefined) {
        return false;
    }

    if (isNaN(value)) {
        return false;
    }

    return true;
}

var formatNumber = function(value) {
    if (value == null || value === "" || value == undefined) {
        return 0;
    }

    if (isNaN(value)) {
        return 0;
    }

    return value;
};

var deleteTablesServerArray = function (servesIdArray, deleteUserId, callback) {
    var userIdArray = [];
    if (Object.prototype.toString.call(servesIdArray) === '[object Array]') {
        servesIdArray.forEach(function (value,index) {
            if (value.userId !== deleteUserId) {
                var userId = { userId: value.userId};
                userIdArray.push(userId);
            }
            if (index >= servesIdArray.length - 1) {
                callback(null,userIdArray);
            }
        });
    } else {
        callback(null,userIdArray);
    }
};

var tablesFilter = function (tablesArray, filterField, filterValue, callback) {
    var tables = [];
    var index = 0;
    if (Object.prototype.toString.call(tablesArray) === '[object Array]') {
        tablesArray.forEach(function (table) {
            index++;
            if (filterField === 'servers') {
                var servers = table.servers;
                if (Object.prototype.toString.call(servers) === '[object Array]') {
                    servers.forEach(function (value) {
                        if (value.userId === filterValue) {
                            tables.push(table);
                        }
                    });
                }
            }
            else if (filterField === 'bussers') {
                var bussers = table.bussers;
                if (Object.prototype.toString.call(bussers) === '[object Array]') {
                    bussers.forEach(function (value) {
                        if (value.userId === filterValue) {
                            tables.push(table);
                        }
                    });
                }
            }
            if (index >= tablesArray.length) {
                callback(null,tables);
            }
        });
    }
};

var deleteOrder = function (ids, times, callback) {
    var _this = exports;
    if (times >= ids.length) {
        callback(null,'success');
        return;
    }
    var id = ids[times];
    var criteria = {_id:id};
    var document = {$set: {archived: true}};
    var options = {};
    var helper = {
        collectionName: _this.enums.CollectionName.DINING_ORDERS,
        apiVersion: 1
    };
    _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
        if (error) {
            callback(error);
        } else {
            times++;
            deleteOrder(ids,times,callback);
        }
    });
};

/**
 * calcaulate AP
 * online:  AP = (D*80% + F) * (1- x%) + E - S
 * offline: AP = D*80%*(1-x%) + E - S
 * toFixed 2
 *
 * @param d Blue dollar purchased from the restaurant account via the automatic exchange engine
 * @param f The remaining amount after deduction of (A+B+C+D+E) Note: The First Visit Discount (5%) deduction is done previously too
 * @param x In China for Alipay: x% = 1% and In USA or Canada : x% = (OPA * 2.9% + 0.3)/OPA
 * @param e Gold dollar owned by the user account (payer)
 * @param s Settlement Fee In Chain S = 0
 * @param isOnline online or offOnline
 */
var calculateAP = function(d, f, x, e, s, isOnline) {

    if (isOnline) {
        return parseFloat(((d * 0.8 + f) * (1 - x) + e -s).toFixed(2), 10);
    } else {
        return parseFloat((d * 0.8 * (1 - x) + e -s).toFixed(2), 10);
    }
};

/*****************
 *
 * Exposed Function
 *
 *****************/

var GetHealthCheck = function (callback) {
    var _this = exports;
    var selector = {};
    var options = {};
    var helper = {collectionName: 'healthcheck'};

    var serviceStatus={};
    var result={};
    var t_now=Date.now();
    var t_running=process.uptime()*1000;

    serviceStatus["country"]=process.argv[2] ? process.argv[2]:'NA';
    serviceStatus["env"]=process.argv[3] ? process.argv[3] : 'development';
    serviceStatus["service"]=_this.config.express.shared.server_name;
    serviceStatus["port"]=_this.config.express.shared.server_port;
    serviceStatus["uptime"]=moment(t_now-t_running).format("YYYY-MM-DD HH:mm:ss");
    serviceStatus["host"]=os.hostname();
    serviceStatus["status"]="OK";

    try {
        var data = fs.readFileSync('version.txt');
        serviceStatus["version"]=data.toString();
    } catch(e) {
        //文件不存在，或者权限错误
        throw e;
    }
    /**
     * FBE-842: [Performance] Remove direct MongoDB Connection from (all) GetHealthChecks
     * JUST test the connection. Not necessarily retrieve any data since collectionName 'healthcheck' actually does not exist
     *
     */

    _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
        if (error){
            //callback(error);
            serviceStatus["mongodb"]="no";
            result={status: 400, data: serviceStatus};
            callback(null, result);
        } else {
            _this.logger.info('DEBUG-INFO: result%j', result);
            //callback(null, { status : 200, data : { 'healthcheck' : 'Empty but able to connect' } });
            serviceStatus["mongodb"]="yes";
            result={status: 200, data: serviceStatus};
            callback(null, result);
        }
    });
};

var GetUserNameAndAvatar = function (userIds, otherServers, headerToken, usedByOtherServer, callback, reqParams, loggerInfos) {
    var _this = exports;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetUserNameAndAvatar received parameters', userIds: userIds});

    var path = '';
    if (usedByOtherServer) {
        path = '/v1/users/' + userIds + '?usedByOtherServer=true';
    } else {
        path = '/v1/users/' + userIds;
    }
    var options = {
        host: otherServers.oauth.server_url,
        port: otherServers.oauth.server_port,
        path: path,
        method: 'GET',
        headers:{
            'content-type': 'application/json'
        }
    }

    if(headerToken){
        options.headers.authorization = headerToken;
    }

    if (reqParams && loggerInfos) {
        options.reqParams = reqParams;
        options.loggerInfos = loggerInfos;
    }

    options.serviceName = _this.config.other_servers.oauth.server_name;;

    _this.orderManager.sendToOtherServer(options, function (error, result) {
        if (error) {
            _this.logger.error('%j', {
                function: 'DEBUG-ERROR: Order.GetUserNameAndAvatar returns error',
                error: error,
                options: options
            });
            callback(error, []);
        } else {

            if (result === null || result === undefined || result === '' || result.length === 0) {
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order.GetUserNameAndAvatar returns empty',
                    options: options
                });
                callback(null, []);
            } else {
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order.GetUserNameAndAvatar returns right',
                    result: JSON.stringify(result),
                    options: options
                });
                callback(null, result);
            }
        }
    });

};

var getInvitationCodeDiscountConfig = function(invitation_code,callback){
    var _this = exports;
    var selector = {'code': invitation_code,enable:true};
    var options = {};
    var helper = {collectionName: 'system-invitation-code-discount'};

    _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
        if (error) {
            callback(null);
        } else if (result === null || result === '' || result.length ===0) {
            callback(null);
        } else {
            var code_discount_config = {};
            code_discount_config.code = result[0].code;
            code_discount_config.discount_value = result[0].discount_value;
            code_discount_config.discount_value_type = result[0].discount_value_type;
            callback(code_discount_config);
        }
    });
}

//XXX CreateOrder covers dine-in order and pre-order creation. For Web order no
//table assigned
var CreateOrder = function (reqParams, callback) {
    var _this = exports;

    var userId = reqParams.userId;
    var isServer = reqParams.isServer;
    var tableId = reqParams.tableId;
    var restaurantId = reqParams.restaurantId;
    var userName = reqParams.userName;
    var deviceId = reqParams.deviceId;
    var headerToken = reqParams.headerToken;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateOrder received arguments', reqParams: reqParams});

    var apiResult = '';

    var order = {};
    var user = {};
    var restaurant = {};
    var table = {};
    var reservationBody = {};

    var isTableHasOrder = false;

    async.series([
        // step-1: doFindUser
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateOrder step-1 doFindUser', userId: userId});

            var loggerInfos = {
                function: 'Order.CreateOrder step-1 doFindUser'
            };

            _this.getUserNameAndAvatar(userId, _this.config.other_servers, headerToken, true, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateOrder step-1 doFindUser returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find useraccount', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateOrder step-1 doFindUser returns empty'});
                    nextstep(new _this.httpExceptions.CommonHttpErrorException('ACCOUNT_NOT_EXISTS', 'user_id', userId));
                } else {
                    var userResult = result[0];

                    user = {
                        user_id: userId,
                        user_name: userResult.dispName || '',
                        avatar_path: userResult.avatarPath || ''
                    };
                    if(userResult.inviter_info){
                        user.inviter_info = userResult.inviter_info;
                    }

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateOrder step-1 doFindUser returns right'});
                    nextstep();
                }
            }, reqParams, loggerInfos)
        },
        // step-2: doFindUserCurrentOrder
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.CreateOrder step-2 doFindUserCurrentOrder', userId: userId});

            var selector = {'$and': [
                {'$or': [{ 'user.user_id': userId }, { 'customers.userId': userId }]},
                {status: {'$in': [_this.enums.OrderStatus.INPROCESS, _this.enums.OrderStatus.SUBMITTED]}},
                {come_from: {$ne: 'WECHAT'}}
            ]};

            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function(error, result){
                if (error) {
                    _this.logger.error('%j', {function: 'DEBUG-ERROR: Order.CreateOrder step-2 doFindUserCurrentOrder returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                }else if (result !== null && result !== '' && result.length !==0) {
                    _this.logger.error('%j', {function: 'DEBUG-ERROR: Order.CreateOrder step-2 doFindUserCurrentOrder returns an error'});
                    nextstep(new _this.httpExceptions.CommonHttpErrorException('ORDER_STILL_OPEN', 'orderId', 'the order should be closed before user('+userId+') create new order'));
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.CreateOrder step-2 doFindUserCurrentOrder returns right'});
                    nextstep();
                }
            });
        },
        // step-3: doFindTableOrder
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.CreateOrder step-3 doFindTableOrder', tableId: tableId});

             if(tableId === _this.config.pre_order_checkin.wild_table_id)
             {
                 nextstep();
             }
             else {

                var selector = {'$and': [
                    {'$or': [{'table_id': tableId}, {'tableId': tableId}, {'base_table_id': tableId}]},
                    {status: {'$in': [_this.enums.OrderStatus.INPROCESS, _this.enums.OrderStatus.SUBMITTED]}}
                ]};
                var options = {};
                var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

                _this.restaurantDataAPI.find(selector, options, helper, function(error, result){
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.CreateOrder step-3 doFindTableOrder returns error', error: error});
                        nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                    }else if (result === null || result === '' || result.length ===0) {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateOrder step-3 doFindTableOrder returns empty'});
                        nextstep();
                    } else {
                        isTableHasOrder = true;

                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateOrder step-3 doFindTableOrder returns right'});
                        nextstep();
                    }
                });
            }
        },
        // step-4: doFindRestaurant
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateOrder step-4 doFindRestaurant', restaurantId: restaurantId});

            var selector = {_id : restaurantId};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.RESTAURANT};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function: 'DEBUG-ERROR: Order.CreateOrder step-4 doFindRestaurant returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find restaurant', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function: 'DEBUG-ERROR: Order.CreateOrder step-4 doFindRestaurant returns empty'});
                    nextstep(new _this.httpExceptions.CommonHttpErrorException('RESTAURANT_NOT_EXISTS', 'restaurantId', restaurantId));
                } else {

                    restaurant = result[0];

                    if(!restaurant.dine_in_status) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateOrder step-4 doFindRestaurant returns error'});
                        nextstep(new _this.httpExceptions.CommonHttpErrorException('DINEIN_DISABLED', 'the restaurant does not support dine-in', restaurantId));
                    } else {
                        var tables = restaurant.tables;
                        var hasTable = false;
                        if(tables && tables.length > 0){

                            var tableNo = 0;

                            for(var i=0;i< tables.length;i++){
                                if(tables[i].tableId === tableId){
                                    hasTable = true;
                                    tableNo = tables[i].tableNo;
                                    break;
                                }
                            }
                            if(hasTable){
                                if (restaurant.enable_customer_share_table === true) {
                                    table.table_id = tableId;
                                    table.table_no = tableNo;

                                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateOrder step-4 doFindRestaurant returns right'});
                                    nextstep();
                                } else {
                                    if (isTableHasOrder === true) {
                                        _this.logger.error('%j', { function: 'DEBUG-INFO: Order.CreateOrder step-4 doFindRestaurant returns an error', error: 'table has order'});
                                        nextstep(new _this.httpExceptions.CommonHttpErrorException('TABLE_OCCUPIED', 'the table has order', tableNo));
                                    } else {
                                        table.table_id = tableId;
                                        table.table_no = tableNo;

                                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateOrder step-4 doFindRestaurant returns right'});
                                        nextstep();
                                    }
                                }

                            } else {
                                _this.logger.error('%j', {function: 'DEBUG-ERROR: Order.CreateOrder step-4 doFindUserCurrentOrder returns an error', error: 'the table not belong to the restaurant'});
                                nextstep(new _this.httpExceptions.CommonHttpErrorException('TABLE_NOT_BELONG_RESTAURANT', 'the table not belong to the restaurant', tableNo));
                            }
                        } else {
                            _this.logger.error('%j', {function: 'DEBUG-ERROR: Order.CreateOrder step-4 doFindUserCurrentOrder returns an error', error: 'the restaurant has no tables'});
                            nextstep(new _this.httpExceptions.CommonHttpErrorException('RESTAURANT_HAS_NO_TABLES', 'the restaurant has no tables', restaurantId));
                        }
                    }
                }
            });
        },
        // step-5: doPopulateOrder
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.CreateOrder step-5 doPopulateOrder'});

            var nowTime = _this.dataGenerationHelper.getValidUTCDate();

            order._id = _this.dataGenerationHelper.generateUUID();
            order.order_no = 0;
            order.tableId = table.table_id;
            order.restaurantId = restaurantId;
            order.tableNo = table.table_no;
            order.device_id = deviceId;

            // restaurant
            order.restaurant_logo = {}
            order.restaurant = {};
            order.restaurant.restaurant_logo = {};
            order.restaurant.restaurant_id = restaurantId;
            order.restaurant_name = (restaurant.longNames && restaurant.longNames.length>0) ? restaurant.longNames[0].name : '';
            order.restaurant.restaurant_name = order.restaurant_name;
            order.restaurant_logo.filename = (restaurant.photos && restaurant.photos.length>0) ? restaurant.photos[0].filename : '';
            order.restaurant_logo.path = (restaurant.photos && restaurant.photos.length>0) ? restaurant.photos[0].path : '';
            order.restaurant.restaurant_logo.filename = order.restaurant_logo.filename;
            order.restaurant.restaurant_logo.path = order.restaurant_logo.path;
            order.restaurant.restaurant_rating = restaurant.rating || 0;
            order.restaurant.discount_percentage = restaurant.discount_percentage || 0;
            order.restaurant.blue_dollars = restaurant.blueDollars || [];
            order.restaurant.blue_dollars = restaurant.blueDollars || [];
            order.restaurant.discounts = restaurant.discounts || [];
            order.restaurant.applicable_taxes = restaurant.applicableTaxes || [];
            order.restaurant.currency = restaurant.currency || '';
            order.restaurant.is_online_payment = restaurant.isOnlinePayment || false;
            order.restaurant.cannot_use_bluedollar = restaurant.cannot_use_bluedollar || false;
            order.restaurant.can_use_gold_dollar = restaurant.can_use_gold_dollar || false;
            if (restaurant.stripetoken) {
                if (restaurant.currency === _this.enums.CurrencyCode.CHINA){
                    order.restaurant.is_stripe_payment = false;
                } else {
                    order.restaurant.is_stripe_payment = true;
                }
                order.restaurant.stripetoken = restaurant.stripetoken;
            }
            order.restaurant.addresses = restaurant.addresses || {};
            order.restaurant.officialPhone = restaurant.officialPhone || '';
            order.restaurant.online_payment_only_takeout = restaurant.online_payment_only_takeout || false;
            order.restaurant.picked_up_interval = restaurant.picked_up_interval || 15;
            if (restaurant.liked) {
                order.restaurant.liked = restaurant.liked;
                order.restaurant.delivery_info = restaurant.delivery_info;
            }
            //FBE-3347 the new created order should has restaurant time zone
            order.restaurant.time_zone = restaurant.time_zone || _this.config.other_servers.time_zone.default_time_zone;
            if (restaurant.commissionRatePercent) {
                order.restaurant.commissionRatePercent = restaurant.commissionRatePercent;
            }
            //tax number FBE-3524
            order.restaurant.tax_number = restaurant.tax_number;
            order.restaurant.default_tip_rate = 0;

            if (_this.serverHelper.isServerNA()) {
                order.restaurant.default_tip_rate = restaurant.tip_rate_dinein || _this.config.other_servers.other_rates.tip_rate_dinein;
            }

            // restaurant

            order.status = _this.enums.OrderStatus.INPROCESS;
            order.lastmodified = nowTime;

            if (isServer === 'TRUE') {
                order.isServer = isServer;
                order.serverUser = user;
            } else {
                order.isServer = 'FALSE';
                order.user = user;
                order.customers = [user];
            }

            order.batch_no = 0;
            order.receipt_printed = false;

            order.printers = [];
            if (restaurant.printers !== null && restaurant.printers !== undefined && restaurant.printers.length > 0) {
                var printers = [];
                for (var i=0; i<restaurant.printers.length; i++) {
                    var usages = restaurant.printers[i].usages;
                    var type = restaurant.printers[i].type;
                    if (usages !== null && usages !== undefined && usages.length > 0) {
                        for (var j=0; j<usages.length; j++) {
                            if ((usages[j].order_auto_print === true && usages[j].usage === _this.enums.PrinterUsage.PASS) || usages[j].usage === _this.enums.PrinterUsage.CASHIER
                               /* || (type === _this.enums.PrinterModule.FEIE && usages[j].usage === _this.enums.PrinterUsage.KITCHEN)*/) {
                                printers.push(restaurant.printers[i]);
                                break;
                            }
                        }
                    }
                }

                order.printers = printers;
            }

            order.come_from = _this.enums.OrderSource.APP;

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.CreateOrder step-5 doPopulateOrder'});
            nextstep();
        },
        // step-6: doGetOrderNo
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateOrder step-6 doGetOrderNo'});

            _this.getSequenceNo(_this.enums.CollectionName.ORDER_SEQUENCE, restaurantId, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateOrder step-6 doGetOrderNo returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find order-sequence', 'error'));
                } else {
                    order.order_no = result;

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateOrder step-6 doGetOrderNo returns right'});
                    nextstep();
                }
            });
        },
        //step-6.1 do Get specified invitation code discount config
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateOrder step-6.1 do Get specified invitation code discount config',
                user: user,
                is_invitation_code_discount_enabled:_this.config.other_servers.invitation_code_discount_config.enabled
            });
            if(_this.config.other_servers.invitation_code_discount_config.enabled && user.inviter_info && user.inviter_info.code){
                var invitationCode = user.inviter_info.code;
                getInvitationCodeDiscountConfig(invitationCode,function(result){
                    if(result){
                        order.invitation_code_discount = result;
                    }
                    nextstep();
                })
            }else{
                nextstep();
            }

        },
        // step-7: doCreateOrder
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateOrder step-7 doCreateOrder'});

            var document = order;
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.create(document, options, helper, function (error) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateOrder step-7 doCreateOrder returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('create dining-orders', 'error'));
                } else {
                    apiResult = {status: 201, data: {id: order._id}};

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateOrder step-7 doCreateOrder returns right'});
                    nextstep();
                }
            });
        },
        // step-8: doSendNotification
        function (nextstep) {
            if (isServer !== 'TRUE') {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateOrder step-8 doSendNotification', orderId: order._id });

                var postData={};
                postData.host = _this.config.other_servers.notification.server_url;
                postData.port = _this.config.other_servers.notification.server_port;
                postData.path = '/notifications';
                var body = {
                    'command': _this.enums.PushMessageType.BROADCAST,
                    'user_id': user.user_id,
                    'user_name': user.user_name,
                    'consumer_disp_name': user.user_name,
                    'consumer_avatar_path': user.avatar_path,
                    'restaurant_id': restaurantId,
                    'table_id': table.table_id,
                    'table_no': table.table_no,
                    'order_id': order._id,
                    'code': _this.enums.PushMessageType.CREATEORDER
                }
                postData.method = 'POST';

                var loggerInfos = {
                    function : 'Order.CreateOrder step-8 doSendNotification'
                };

                _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-INFO: Order.CreateOrder step-8 doSendNotification returns an error', error: error});
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateOrder step-8 doSendNotification returns right'});
                    }
                }, reqParams, loggerInfos);
            }

            nextstep();
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateOrder step-(error) callback', error: error});
            // FBE-3189 send email alert
            var message = {reqParams: reqParams};
            var emailBody = {
                subject: 'Create-DineIn-Order failed',
                text: {
                    order_type: _this.enums.OrderType.DINNER,
                    error: error,
                    data: message
                }
            };
            _this.orderManager.sendEmail(emailBody);
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateOrder step-(right) callback'});
        }
        callback (error, apiResult);
    })

};

var GetOrdersByUserId = function (userId, restaurantId, tableId, isServer, status, from, pageSize, allIncluded, includeEmptyTable, callback) {
    var _this = exports;
    if (allIncluded === null) { allIncluded = 'TRUE'; };
    var fields;
    var backBody=[], orderIds=[];
    async.waterfall([
        function (callback) {

            if (allIncluded=== 'FALSE') {
                fields = {tableId: 1, status: 1 , restaurantId: 1, customers: 1, 'order_items.order_item_id': 1, 'order_items.chit_printed': 1, receipt_printed: 1, _id: 1};
            } else {
                fields={};
            }
            callback();
        },
        function (callback) {
            var selector;
            var options = {};
            var helper;
            if (isServer === 'TRUE') {
                if (restaurantId === null || restaurantId === '') {
                    callback(new _this.httpExceptions.InvalidParameterException('restaurantId', 'If is_server is TRUE, then restaurant_id is required'), null);
                } else {
                    selector = {'$and': [{restaurantId: restaurantId}, {'$or':[{archived: false}, {archived: null}]}]};
                    helper = {
                        collectionName: _this.enums.CollectionName.DINING_ORDERS,
                        callerScript: 'File: order.js; Method: GetOrdersByUserId()',
                        apiVersion: 1
                    };

                    _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                        if (error) {
                            callback(error);
                        } else if (result === null || result === '' || result.length ===0) {
                            callback(new _this.httpExceptions.ResourceNotFoundException('restaurantId', restaurantId), null);
                        } else {
                            var ids = [];
                            if (result && result.length > 0) {
                                for (var i = 0; i < result.length; i++) {
                                    if (result[i]._id !== null && result[i]._id !== '' && result[i]._id !== undefined) {
                                        ids.push(result[i]._id);
                                    }
                                }
                            }
                            callback(null, ids);
                        }
                    });
                }
            } else {

                selector = {'customers.user_id': userId};
                helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

                _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                    if (error) {
                        callback(error);
                    } else if (result === null || result === '' || result.length ===0) {
                        callback(new _this.httpExceptions.ResourceNotFoundException('userId', userId), null);
                    } else {
                        var ids = [];
                        if (result && result.length > 0) {
                            for (var i = 0; i < result.length; i++) {
                                if (result[i].orderId !== null && result[i].orderId !== '' && result[i].orderId !== undefined) {
                                    ids.push(result[i].orderId);
                                }
                            }
                        }
                        callback(null, ids);
                    }
                });
            }
        },
        function (ids,callback) {
            var fliter = {};
            fliter._id = {$in: ids};
            if (restaurantId !== null && restaurantId !== '' && restaurantId !== undefined) {
                fliter.restaurantId = restaurantId;
            }
            if (tableId !== null && tableId !== '' && tableId !== undefined) {
                fliter.tableId = tableId;
            }
            if (status !== null && status !== '' && status !== undefined) {
                if (status === 'ACTIVE') {
                    fliter.status  = {'$in': [_this.enums.OrderStatus.INPROCESS, _this.enums.OrderStatus.SUBMITTED, _this.enums.OrderStatus.PAID]};
                } else {
                    fliter.status = status;
                }
            }
            callback(null,fliter);
        },
        function (fliter,callback) {
            if (allIncluded === 'FALSE') {
                callback(null,fliter);
            } else {

                _this.orderCalculate.calculateOrdersByUserId(userId, fliter,  function (error, result) {
                    if (error) {
                        callback(error);
                    } else if (result === null) {
                        callback(new _this.httpExceptions.ResourceNotFoundException('userId', userId));
                    } else {
                        callback(null, fliter);
                    }
                });
            }

        },
        function (fliter, callback) {

            var selector = { $query: fliter, $orderby: { createDate : -1, create_time : -1  } };
            var options = {'fields': fields};

            _this.orderManager.pagingFunction(options, from, pageSize, 'GetOrdersByUserId');

            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                callerScript: 'File: order.js; Method: GetOrdersByUserId()',
                apiVersion: 1
            };

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    callback(error, null);
                } else if (result[0] !== null && result[0] !== '') {
                    var j = 0;
                    if (includeEmptyTable === 'FALSE') {
                        for (var i = 0 ; i< result.length;i++) {
                            if (result[i].tableId !== null && result[i].tableId !== '' && result[i].tableId !== undefined ) {
                                backBody.push(result[i]);
                            }
                            j++;
                        }
                        if (j === result.length) {
                            callback(null, backBody);
                        }
                    } else {
                        backBody=result;
                        callback(null, backBody);
                    }
                } else {
                    callback(new _this.httpExceptions.ResourceNotFoundException('userId', userId), null);
                }
            });
        },
        function (backBody, callback) {
            orderIds = [];
            for (var i= 0;i<backBody.length;i++) {
                delete backBody[i].order_items;
                orderIds.push(backBody[i]._id);
            }
            callback();
        },
        function (callback) {

            for (var i=0; i<backBody.length; i++) {
                if (allIncluded !== 'FALSE') {
                    backBody[i].ownerId = backBody[i].user ? backBody[i].user.user_id : '';
                    backBody[i].lastmodified =  backBody[i].lastmodified;
                }
            }

            callback(null, {status: 200, data: backBody});

        }
    ], function (error, result) {
        callback(error, result);
    });
};

/**
 * Feature: @Me
 * @param userId
 * @param index
 * @param callback
 * @constructor
 */
var GetPastOrdersWithRating = function (reqParams, callback) {
    var _this = exports;
    var fields;
    var selector;
    var options = {};
    var helper = {};
    var restaurantIds = [], restaurants = [], menuItemIds = [], queryForComments = [], restaurantsWithOrderItemComment = [];

    var userId = reqParams.userId,
        index = reqParams.index,
        limitSize = reqParams.limitSize,
        acceptEncoding = reqParams.acceptEncoding;

    var apiResult;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetPastOrdersWithRating received arguments:', reqParams: reqParams });

    async.waterfall([

        //-- Step-1: doSetTheFields
        function (nextstep) {
            fields = {
                _id: 1,
                status: 1,
                restaurantId: 1,
                'orderItems.itemId': 1,
                'orderItems.itemName': 1,
                'orderItems.order_item_user_id': 1,
                'orderItems.price.amount': 1,
                createDate: 1,
                submitTime: 1,
                closeTime: 1,
                create_time: 1,
                close_time: 1,
                submit_time: 1
            };
            options = {'fields': fields};
            if (index>0) {
                options.skip = (parseInt(index - 1));
                options.limit = (parseInt(50));
            } else {
                options.skip = (parseInt(0));
                options.limit = (parseInt(50));
            }
            nextstep();
        },

        //-- Step-2: doGetOrderDetails
        function (nextstep) {

            //-- FBE-700, FBE-995, FF-2222
            var criteria = {
                $and: [
                    {$or: [{'customers.userId': userId}, {'customers.user_id': userId}, {'orderItems.order_item_user_id': userId}, {'order_items.order_item_user_id': userId} ]},
                    {$or: [{'billStatus.status': _this.enums.OrderStatus.PAID}, {'bill_status.status': _this.enums.OrderStatus.PAID}]}
                ]
            };
            var filter = {
                _id: 0,
                restaurantId: 1,
                submit_time: '$submitTime',
                close_time: '$closeTime',
                create_date: '$createDate',
                status: 1,
                orderId: '$_id',
                order_items: '$orderItems',
                menu_item_id: '$itemId',
                menu_item_name: '$itemName'
            };
            var resultFilter = {};

            var sort = {submitTime: -1, closeTime: -1, submit_time: -1, close_time: -1};
            var group = {};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                callerScript: 'File: order.js; Method: GetPastOrdersWithRating()',
                apiVersion: 1
            };

            _this.restaurantDataAPI.aggregate(criteria, filter, resultFilter, sort, group, helper, function (error, result) {
                if (error) {
                    callback(error);
                } else if (result === null || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException(helper.collectionName + '.user.userId', userId));
                } else {

                    // orderBody = result;
                    var orderItem = {};
                    var restaurant = {};
                    var orderItems = [];

                    if (result && result.length > 0) {
                        for (var i = 0; i < result.length; i++) {
                            restaurant.restaurantId = result[i].restaurantId;
                            restaurant.status = result[i].status;
                            restaurant.submit_time = result[i].submit_time;
                            restaurant.close_time = result[i].close_time;
                            restaurant.create_date = result[i].create_date;
                            restaurant.orderId = result[i].orderId;
                            restaurant.order_items = [];
                            //-- For each orderItem, retrieve the `order_item_user_id`, `menu_item_id`, and `order_item_id`
                            for (var y = 0; y < result[i].order_items.length; y++) {
                                orderItem.order_item_user_id    = result[i].order_items[y].order_item_user_id;
                                orderItem.menu_item_id          = result[i].order_items[y].itemId;
                                menuItemIds.push(result[i].order_items[y].itemId);
                                orderItem.menu_item_name        = result[i].order_items[y].itemName;
                                orderItem.menu_item_rating      = 0;
                                orderItem.price                 = result[i].order_items[y].price.amount;
                                orderItem.order_item_id         = result[i].order_items[y].order_item_id || '';
                                orderItem.chit_printed          = result[i].order_items[y].chit_printed || false;
                                orderItems.push(orderItem);
                                queryForComments.push({userId: orderItem.order_item_user_id, order_item_id : orderItem.order_item_id, menuItemId: orderItem.menu_item_id});
                                queryForComments.push({'user.userId': orderItem.order_item_user_id, order_item_id : orderItem.order_item_id, menuItemId: orderItem.menu_item_id});
                                orderItem = {};
                            }
                            restaurant.order_items = orderItems;
                            orderItems = [];

                            restaurants.push(restaurant);
                            restaurant = {};
                        }
                    };
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetPastOrdersWithRating - step-2: doGetOrderDetails - information about Orders',
                        restaurants: restaurants, queryForComments: queryForComments });

                    nextstep();
                }
            }, index, limitSize);
        },

        //-- Step-3: doGetMenuItemsDetails
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetPastOrdersWithRating - step-3: doGetMenuItemsDetails - preparing to query menu items',
                menuItemIds: menuItemIds
            });

            var uniqueMenuItemIds = menuItemIds.filter(function(elem, pos) {
                return menuItemIds.indexOf(elem) === pos;
            });

            selector = {_id: {$in: uniqueMenuItemIds}}
            options = {_id: 1, rating: 1, photos: 1};
            helper = {
                collectionName: 'menu',
                callerScript: 'File: order.js; Method: GetPastOrdersWithRating()',
                apiVersion: 1
            };

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException(helper.collectionName + '._id', uniqueMenuItemIds));
                } else {
                    var menuItems = result;
                    for (var i = 0; i < restaurants.length; i++) {
                        for (var x = 0; x < restaurants[i].order_items.length; x++) {
                            for (var y = 0; y < menuItems.length; y++) {
                                if (restaurants[i].order_items[x].menu_item_id === menuItems[y]._id) {
                                    restaurants[i].order_items[x].menu_item_rating = menuItems[y].rating;
                                    restaurants[i].order_items[x].photos = menuItems[y].photos;
                                }
                            }
                        }
                    };
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetPastOrdersWithRating restaurants with menu items',
                        restaurants: restaurants
                    });

                    nextstep();
                }
            });
        },

        //-- Step-4: doGetCommentsDetails
        function (nextstep) {
            var restaurantWithOrderItemComment = {}, orderItemWithComment = {};
            selector = {$or: queryForComments};
            options.fields = {_id: 1, restaurantId: 1, menuItemId: 1, rating: 1, 'commentAttachments.url': 1, comment_attachments: 1, commentContent: 1, userName: 1, userId: 1, 'user.userName': 1, 'user.userId': 1, orderId: 1, order_item_id: 1};
            helper = {
                collectionName: 'comment',
                callerScript: 'File: order.js; Method: GetPastOrdersWithRating()',
                apiVersion: 1
            };

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length ===0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: order.js. Async.series() - Information about Comments. result: has no comment!' });
                    restaurantsWithOrderItemComment = restaurants;
                    for (var i = 0; i < restaurants.length; i++) {
                        restaurantIds.push(restaurants[i].restaurantId);
                    }
                    nextstep();
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: order.js. Async.series() - Information about Comments result', result: result });

                    for (var i = 0; i < restaurants.length; i++) {
                        restaurantIds.push(restaurants[i].restaurantId);
                        restaurantWithOrderItemComment = {};
                        restaurantWithOrderItemComment = restaurants[i];
                        for (var x = 0; x < restaurants[i].order_items.length; x++) {
                            for (var y = 0; y < result.length; y++) {

                                var eachComment = result[y];

                                if (restaurants[i].restaurantId === eachComment.restaurantId &&
                                    restaurants[i].order_items[x].menu_item_id === eachComment.menuItemId &&
                                    restaurants[i].order_items[x].order_item_user_id === eachComment.user.userId &&
                                    restaurants[i].order_items[x].order_item_id === eachComment.order_item_id
                                ) {
                                    orderItemWithComment = restaurants[i].order_items[x];
                                    orderItemWithComment.comments = eachComment;
                                    orderItemWithComment.comments.order_item_user_id = eachComment.user.userId;
                                    orderItemWithComment.comments.menu_item_id = eachComment.menuItemId;
                                    //-- FBE-1031: comment_attachments was added
                                    orderItemWithComment.comments.comment_attachments = eachComment.comment_attachments;
                                    restaurantWithOrderItemComment.order_items.splice(x, 1, orderItemWithComment);

                                    orderItemWithComment = {};
                                }
                            }
                        }
                        restaurantsWithOrderItemComment.push(restaurantWithOrderItemComment);

                    };
                    _this.logger.info('%j', { function: 'DEBUG-INFO: order.js. Async.series() - Information about Comments. restaurantsWithOrderItemComment[]',
                        restaurantsWithOrderItemComment: restaurantsWithOrderItemComment });
                    nextstep();
                }
            });

        },

        //-- Step-5: doGetRestaurantsDetails. Note: As soon as FBE-624 is fully tested, this logic should be removed
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: order.js. Async.series() - Information about Restaurants. restaurantIds[]',
                restaurantIds: restaurantIds });

            selector = {_id: {$in: restaurantIds}};
            options.fields = {_id: 1, rating: 1, 'shortNames.name': 1, 'longNames.name': 1};
            helper = {
                collectionName: 'restaurant',
                callerScript: 'File: order.js; Method: GetPastOrdersWithRating()',
                apiVersion: 1
            };

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length ===0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException(helper.collectionName + '.restaurantId', restaurantIds));
                } else {
                    for (var i = 0; i < restaurantsWithOrderItemComment.length; i++) {
                        for (var y = 0; y < result.length; y++) {

                            var eachRestaurant = result[y];

                            if (restaurantsWithOrderItemComment[i].restaurantId === eachRestaurant._id) {
                                restaurantsWithOrderItemComment[i].restaurant_name = eachRestaurant.shortNames[0].name || eachRestaurant.longNames[0].name;
                                restaurantsWithOrderItemComment[i].restaurant_rating = eachRestaurant.rating;
                            }
                        }
                    };

                    _this.logger.info('%j', { function: 'DEBUG-INFO: order.js. Async.series() - Information about Restaurants. restaurantsWithOrderItemComment[]',
                        restaurantsWithOrderItemComment: restaurantsWithOrderItemComment });

                    nextstep();
                }
            });
        },

        function (nextstep) {
            apiResult = {status: 200, data: {restaurants: restaurantsWithOrderItemComment}};
            nextstep();
        }

    ], function (error) {
        callback(error, apiResult);
    });
};

var GetOrderByOrderId = function (userId, orderId, callback) {
    var _this = exports;

    var apiresult;
    var backBody;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetOrderByOrderId received arguments:',
        userId: userId,
        orderId: orderId
    });

    var selector = {_id: orderId, 'customers.user_id': userId};
    var options = {};
    var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

    _this.restaurantDataAPI.find(selector, options, helper, function(error, result){
        if (error) {
            _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetOrderByOrderId returns error', error: error});
            callback(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'), null);
        }else if (result === null || result === '' || result.length ===0) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetOrderByOrderId returns empty'});
            callback(new _this.httpExceptions.ResourceNotFoundException('order_id', orderId), null);
        } else {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetOrderByOrderId returns right'});
            callback(null, {status: 200, data: result[0]});
        }
    });

};

var DeleteOrderByOrderId = function (userId, orderId, isServer,action, callback) {
    var _this = exports;
    var apiresult;
    async.series([
        function (nextstep) {
            if (action !== 'delete' && action !== 'empty') {
                nextstep(new _this.httpExceptions.InvalidParameterException('action', 'url should be with ?action=delete or empty at the end'));
            } else {
                nextstep();
            }
        },
        function (nextstep) {
            if (isServer === 'TRUE') {
                nextstep();
            } else {
                getCustomerInfo(userId, orderId, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        nextstep();
                    }
                });
            }
        },
        function (nextstep) {
            var selector = {'$and':[{_id: orderId}, {'$or':[{archived: false},{archived: null}]}]};
            var options = {};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('_id', orderId));
                } else {
                    nextstep();
                }
            });
        },
        function (nextstep) {
            var selector = {'$and':[{_id: orderId},{status:{$ne:_this.enums.OrderStatus.CANCELLED}}]};
            var options = {};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has been canceled', orderId));
                } else {
                    nextstep();
                }
            });
        },
        function (nextstep) {
            var nowTime = _this.dataGenerationHelper.getValidUTCDate();
            var criteria,document,options,helper;
            if (action === 'delete') {
                criteria = {_id: orderId};
                document = {$set: {archived: true, lastmodified: nowTime}};
                options = {};
                helper = {
                    collectionName: _this.enums.CollectionName.DINING_ORDERS,
                    apiVersion: 1
                };
                _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        apiresult = {status: 204};
                        nextstep();
                    }
                });

            } else if (action === 'empty') {
                nowTime = _this.dataGenerationHelper.getValidUTCDate();
                criteria = {_id: orderId};
                document = {$set: {status: _this.enums.OrderStatus.CANCELLED, closeTime: nowTime,lastmodified: nowTime}};
                options = {};
                helper = {
                    collectionName: _this.enums.CollectionName.DINING_ORDERS,
                    apiVersion: 1
                };
                _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        apiresult = {status: 204};
                        nextstep();
                    }
                });
            }
        }
    ], function (error) {
        callback(error, apiresult);
    });
};

var GetParameterByOrderId = function (userId, orderId, selectFlag, option, isServer, callback) {
    var _this = exports;
    var apiresult;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetParameterByOrderId received arguments:',
        userId: userId, orderId: orderId, selectFlag: selectFlag, isServer: isServer });

    var order = {};

    async.series([
        function (nextstep) {
            if (isServer === 'TRUE') {
                nextstep();
            } else {
                getCustomerInfo(userId, orderId, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        nextstep();
                    }
                });
            }
        },

        function (nextstep) {
            var selector = {'$and':[{_id: orderId}, {'$or':[{archived: false}, {archived: null}]}]};
            var options = {};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                callerScript: 'File: order.js; Method: GetParameterByOrderId()' ,
                apiVersion: 1
            };
            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('_id', orderId));
                } else {
                    nextstep();
                }
            });
        },

        function (nextstep) {
            var selector = {'$and':[{_id: orderId}, {status: {$ne: _this.enums.OrderStatus.CANCELLED }}]};
            var options = {};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                callerScript: 'File: order.js; Method: GetParameterByOrderId()' ,
                apiVersion: 1
            };
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has been canceled', orderId));
                } else {
                    order = result[0];
                    nextstep();
                }
            });
        },

        function (nextstep) {
            var selector,helper;
            if (selectFlag === 'users') {
                var body = {};
                body._id = '';
                body.order_id = order._id;
                body.ownerId = order.user ? order.user.user_id : '';
                body.userName = order.user ? order.user.user_name : '';
                body.avatarPath = order.user ? order.user.avatar_path : '';
                body.customers = [];
                for (var i=0; i<order.customers.length; i++) {
                    var customer = order.customers[i];

                    var orderCustomer = {
                        userId: customer.user_id,
                        userName: customer.user_name,
                        avatarPath: customer.avatar_path
                    };

                    body.customers.push(orderCustomer);
                }
                body.v = 1;
                body.create_time = order.create_time;
                body.update_time = order.update_time;

                apiresult = {status: 200, data: [body]};

                nextstep();
            } else if (selectFlag === 'orderItems' || selectFlag === 'servers') {
                selector = {'$and':[{_id: orderId}, {'$or':[{archived: false},{archived: null}]}]};
                helper = {
                    collectionName: _this.enums.CollectionName.DINING_ORDERS,
                    callerScript: 'File: order.js; Method: GetParameterByOrderId()' ,
                    apiVersion: 1
                };
                _this.restaurantDataAPI.find(selector,option,helper,function (error,result) {
                    if (error) {
                        nextstep(error);
                    } else if (result === null || result === '' || result.length === 0) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('_id', orderId));
                    } else {
                        apiresult = {status: 200, data: result};
                        nextstep();
                    }
                });
            }
        }
    ], function (error) {
        callback(error, apiresult);
    });
};

var UpdateParameterByOrderId = function (userId, orderId, parameterBody, selectFlag, isServer, otherServers, headerToken, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateParameterByOrderId received arguments',
        userId: userId, orderId: orderId, parameterBody: parameterBody, selectFlag: selectFlag, isServer: isServer, otherServers: otherServers
    });

    var nowTime = _this.dataGenerationHelper.getValidUTCDate();
    var orderBatchNo, orderItemBatchNo;
    var apiresult, options = {}, order = {}, customerInfo = {}, serverWhoClosedTheOrder = {};
    var status,already_closed = false;
    var ownerId, subTotal;
    var usersArray = [];
    var serversArray = [];
    async.series([

        //-- FBE-1182: [Orders] Add the user_name and avatar_path of the user who PAID the Bill
        function (nextstep) {
            if (isServer === 'TRUE') {
                nextstep();
            } else {
                getCustomerInfo(userId, orderId, function (error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        customerInfo = result;
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateParameterByOrderId customer information', customerInfo: customerInfo });
                        nextstep();
                    }
                });
            }
        },

        function (nextstep) {
            if (selectFlag === 'users') {
                if (parameterBody && parameterBody.customers && parameterBody.customers.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('customers is required', parameterBody.customers));
                } else {
                    //-- NOTE: This was code-reviewed by Richard on 2015-09-22; this `getUserInfo() seems obsolete and it has to be replaced by _this.getUserInfo()
                    getUserInfo(parameterBody.customers, otherServers,headerToken, function (error, result) {
                        if (error) {
                            nextstep(error);
                        } else {
                            if (result.length === 0) {
                                nextstep(new _this.httpExceptions.ResourceNotFoundException('userId Not Exist', parameterBody.customers[0].userId));
                            } else {
                                usersArray = result;
                                nextstep();
                            }
                        }
                    });
                }
            } else if (selectFlag === 'close') {
                //-- FBE-1425: Close an Order API and v2 Transactions API should capture server's name
                _this.getUserInfo(userId, otherServers, headerToken, function (error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        if (result.length === 0) {
                            nextstep(new _this.httpExceptions.ResourceNotFoundException('userId Not Exist', userId));
                        } else {
                            serverWhoClosedTheOrder = {
                                user_id: userId,
                                user_name: result.dispName,
                                avatar_path: result.avatarPath
                            };
                            nextstep();
                        }
                    }
                });
            } else {
                nextstep();
            }
        },

        function (nextstep) {
            if (selectFlag === 'servers') {
                getUserInfo(parameterBody.servers, otherServers, headerToken, function (error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        serversArray = result;
                        nextstep();
                    }
                });
            } else {
                nextstep();
            }
        },

        function (nextstep) {
            var selector = {'$and': [{_id: orderId}, {'$or': [{archived: false}, {archived: null}]}]};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('_id', orderId));
                } else {
                    order = result[0];
                    status = order.status;
                    orderBatchNo = order.batch_no;

                    if (order.payment && order.payment.sub_total_after_discounts) {
                        //-- FBE-1151: [Order] Add a customized call to GET Bill v2 from GET Bill v1 for Stripe Payment
                        subTotal = order.payment.sub_total_after_discounts;
                    } else {
                        subTotal = order.subTotal;
                    };

                    if (status === _this.enums.OrderStatus.CANCELLED) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has been canceled', orderId));
                    } else if ( status === _this.enums.OrderStatus.CLOSED) {
                        already_closed = true;
                        nextstep();
                        // nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has been closed', orderId));
                    } else {
                        if (selectFlag === 'pay') {

                            //-- Note: the under_score format attributes are for those added by GET Bill V2
                            if ( (order.billStatus && order.billStatus.status === _this.enums.BillStatus.LOCKED)
                                || (order.bill_status && order.bill_status.status === _this.enums.BillStatus.LOCKED) ) {

                                if (order.bill_status && order.bill_status.user_id) { ownerId = order.bill_status.user_id; }
                                if (order.billStatus && order.billStatus.userId) { ownerId = order.billStatus.userId; }

                                nextstep();
                            } else if ((order.billStatus && order.billStatus.status === _this.enums.BillStatus.PAID)
                                || (order.bill_status && order.bill_status.status === _this.enums.BillStatus.PAID)) {
                                apiresult = {status: 204};
                                callback(null, apiresult);
                            } else {
                                nextstep(new _this.httpExceptions.InvalidParameterException('orderId', 'order has not been locked before,please get bill first'));
                            }
                        } else {
                            if (order.user != null || order.user != undefined) {
                                ownerId = order.user.user_id;
                            } else {
                                ownerId = '';
                            }
                            nextstep();
                        }
                    }
                }
            });
        },

        function (nextstep) {
            if (selectFlag === 'pay') {
                if (subTotal === null || subTotal === undefined || subTotal === '') {
                    var errmessage = 'Please generate order bill by invoke get order API before pay this order ';
                    nextstep(new _this.httpExceptions.InvalidParameterException(errmessage, orderId));
                } else {
                    nextstep();
                }
            } else {
                nextstep();
            }
        },

        // step-? : doInsertOrderOwner
        function (nextstep) {
            if (isServer === 'TRUE' && selectFlag === 'users') {

                if (order.user == null || order.user == undefined) {
                    var ownerUser = usersArray[0];

                    var user = {
                        user_id : ownerUser.userId,
                        user_name: ownerUser.userName || '',
                        avatar_path: ownerUser.avatarPath || ''
                    };

                    var selector = {_id: order._id};
                    var document = {$set: {user: user}};
                    var options = {};
                    var helper = {
                        collectionName: _this.enums.CollectionName.DINING_ORDERS,
                        apiVersion: 1
                    };
                    _this.restaurantDataAPI.update(selector, document, options, helper, function (error) {
                        if (error) {
                            nextstep(new _this.httpExceptions.InvalidParameterException('UPDATE_ORDER_ERROR', order._id));
                        } else {
                            nextstep();
                        }
                    });
                } else {
                    nextstep();
                }
            } else {
                nextstep();
            }
        },

        function (nextstep) {
            var selector, helper, criteria, document;
            if (isServer === 'TRUE' && selectFlag === 'users') {
                recursiveUsersArray(usersArray,orderId,0,selectFlag,function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        nextstep();
                    }
                })
            } else if ((isServer === 'FALSE' || isServer === '' || isServer === undefined) && selectFlag === 'users') {
                recursiveUsersArray(usersArray, orderId, 0, selectFlag, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        nextstep();
                    }
                });
            } else if (selectFlag === 'discounts' || selectFlag === 'tables' || selectFlag === 'pay' || selectFlag === 'submit') {
                if (selectFlag === 'discounts') {
                    document = {$set: {discount: parameterBody, lastmodified: nowTime, last_modified: nowTime}};
                } else if (selectFlag === 'tables') {
                    document = {$set: {tableId: parameterBody.tableId}};
                }  else if (selectFlag === 'pay') {

                    // FBE-1883
                    if (customerInfo.user_id) {
                        document = {
                            $set: {
                                status: _this.enums.OrderStatus.PAID,
                                'billStatus.status': _this.enums.BillStatus.PAID,
                                'billStatus.payment_time':nowTime,
                                closeTime: nowTime,
                                lastmodified: nowTime,
                                'bill_status.status': _this.enums.BillStatus.PAID,
                                'bill_status.user_id': customerInfo.user_id,
                                'bill_status.user_name': customerInfo.user_name,
                                'bill_status.avatar_path': customerInfo.avatar_path,
                                'bill_status.payment_time':nowTime,
                                'payment.is_transaction_completed': true,
                                last_modified: nowTime,
                                close_time: nowTime,
                                'payment.transaction_number': _this.dataGenerationHelper.generateShortUniqueID()
                            }
                        };
                    } else {
                        document = {
                            $set: {
                                status: _this.enums.OrderStatus.PAID,
                                'billStatus.status': _this.enums.BillStatus.PAID,
                                'billStatus.payment_time':nowTime,
                                closeTime: nowTime,
                                lastmodified: nowTime,
                                'bill_status.status': _this.enums.BillStatus.PAID,
                                'bill_status.payment_time':nowTime,
                                'payment.is_transaction_completed': true,
                                last_modified: nowTime,
                                close_time: nowTime,
                                'payment.transaction_number': _this.dataGenerationHelper.generateShortUniqueID()
                            }
                        };
                    }

                } else if (selectFlag === 'submit') {
                    orderBatchNo = orderBatchNo;
                    orderItemBatchNo = orderBatchNo;
                    document = { $set: {
                        status: _this.enums.OrderStatus.SUBMITTED,
                        submitTime: nowTime,
                        lastmodified: nowTime,
                        batch_no: orderBatchNo,
                        submit_time: nowTime,
                        last_modified: nowTime
                    }};
                }
                criteria = {'$and': [{_id: orderId}, {'$or': [{archived: false}, {archived: null}]}]};
                helper = {
                    collectionName: _this.enums.CollectionName.DINING_ORDERS,
                    callerScript: 'File: order.js; Method: UpdateParameterByOrderId()',
                    apiVersion: 1
                };

                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateParameterByOrderId order with(out) transactions data.',
                    criteria: criteria, document: document });

                _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        apiresult = {status: 204};

                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateParameterByOrderId order is updated.',
                            criteria: criteria, document: document, options: options, selectFlag: selectFlag });

                        nextstep();
                    }
                });
            } else if (selectFlag === 'servers') {
                recursiveUsersArray(serversArray, orderId, 0, selectFlag, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        nextstep();
                    }
                })
            }else if(selectFlag ==='close'){
                if(already_closed ===true){
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateParameterByOrderId order close order=====order already closed.',
                        already_closed: already_closed });
                    nextstep();
                }else{
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateParameterByOrderId order close order=====',
                        already_closed: already_closed });
                    var document = {$set: {status: _this.enums.OrderStatus.CLOSED, closeTime: nowTime, lastmodified: nowTime, last_modified: nowTime, server_who_closed_the_order: serverWhoClosedTheOrder}};
                    var criteria = {'$and': [{_id: orderId}, {'$or': [{archived: false}, {archived: null}]}]};
                    var helper = {
                        collectionName: _this.enums.CollectionName.DINING_ORDERS,
                        callerScript: 'File: order.js; Method: UpdateParameterByOrderId()',
                        apiVersion: 1
                    };

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateParameterByOrderId order with(out) transactions data.',
                        criteria: criteria, document: document });

                    _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                        if (error) {
                            nextstep(error);
                        } else {
                            apiresult = {status: 204};

                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateParameterByOrderId order is updated.',
                                criteria: criteria, document: document, options: options, selectFlag: selectFlag });

                            nextstep();
                        }
                    });
                }
            }
        },
        function (nextstep) {
            if (selectFlag ==='pay') {
                _this.orderManager.grantAndConsumeBlueDollars(ownerId, orderId, otherServers,headerToken, function (error, result) {
                    if (error) {
                        var  helper, criteria, document;
                        document = {
                            $set: {
                                status: status,
                                'billStatus.status': _this.enums.BillStatus.LOCKED,
                                'billStatus.payment_time':null,
                                closeTime: nowTime,
                                lastmodified: nowTime,
                                'bill_status.status': _this.enums.BillStatus.LOCKED,
                                'bill_status.user_id': customerInfo.user_id,
                                'bill_status.user_name': customerInfo.user_name,
                                'bill_status.avatar_path': customerInfo.avatar_path,
                                'bill_status.payment_time':null,
                                'payment.is_transaction_completed': false,
                                last_modified: nowTime,
                                close_time: nowTime
                            }
                        };
                        criteria = {'$and': [{_id: orderId}, {'$or': [{archived: false}, {archived: null}]}]};
                        helper = {
                            collectionName: _this.enums.CollectionName.DINING_ORDERS,
                            callerScript: 'File: order.js; Method: UpdateParameterByOrderId()',
                            apiVersion: 1
                        };

                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateParameterByOrderId order with grantAndConsumeBlueDollars has error.',
                            criteria: criteria, document: document });

                        _this.restaurantDataAPI.update(criteria, document, options, helper, function (errors) {
                            if (errors) {
                                nextstep(errors);
                            } else {
                                nextstep(error,result);
                            }
                        });
                        // nextstep(error,result);
                    } else {
                        var document = {};
                        if (order.is_takeout) {
                            order.picked_up_time = _this.dataGenerationHelper.getValidAfterMinuteUTCDate(nowTime, order.restaurant.picked_up_interval || 15);

                            document = {
                                $set: {
                                    status: _this.enums.OrderStatus.CLOSED,
                                    closeTime: nowTime,
                                    lastmodified: nowTime,
                                    last_modified: nowTime,
                                    server_who_closed_the_order: ownerId,
                                    picked_up_time: order.picked_up_time
                                }
                            };
                        } else {
                            document = {
                                $set: {
                                    status: _this.enums.OrderStatus.CLOSED,
                                    closeTime: nowTime,
                                    lastmodified: nowTime,
                                    last_modified: nowTime,
                                    server_who_closed_the_order: ownerId
                                }
                            };
                        }

                        var criteria = {'$and': [{_id: orderId}, {'$or': [{archived: false}, {archived: null}]}]};
                        var helper = {
                            collectionName: _this.enums.CollectionName.DINING_ORDERS,
                            callerScript: 'File: order.js; Method: UpdateParameterByOrderId()',
                            apiVersion: 1
                        };
                        _this.restaurantDataAPI.update(criteria, document, options, helper, function (errors) {
                            if (errors) {
                                nextstep(errors);
                            } else {
                                _this.orderManager.grantBlueDollarForUpComments(ownerId,orderId,otherServers,headerToken,function(error,result){
                                    if (errors) {
                                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.UpdateParameterByOrderId order with grantBlueDollarForUpComments has error.',
                                            error: error });
                                    } else{
                                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateParameterByOrderId order with grantBlueDollarForUpComments return success.',
                                            result: result});
                                    }
                                });
                                nextstep();
                            }
                        });
                    }
                });
            } else {
                apiresult = {status: 204};
                nextstep();
            }
        },

        function (nextstep) {
            if (selectFlag === 'users') {

                // customers
                var customers = order.customers;
                var document = {};
                if (isNotNull(customers)) {
                    var currentCustomerIds = {};
                    for (var i=0; i<customers.length; i++) {
                        var id = customers[i].userId || customers[i].user_id;
                        currentCustomerIds[id] = customers[i];
                    }

                    var differentCustomers = [];
                    for (var j=0; j<usersArray.length; j++) {
                        var id = usersArray[j].userId;

                        if (currentCustomerIds[id]) {
                            continue;
                        }

                        var differentCustomer = {};
                        differentCustomer.userId = id;
                        differentCustomer.userName = usersArray[j].userName || '';
                        differentCustomer.avatarPath = usersArray[j].avatarPath || '';

                        differentCustomers.push(differentCustomer);
                    }

                    if (differentCustomers.length > 0) {
                        document = {$set: {lastmodified: nowTime, last_modified: nowTime}, $push: { customers: {$each: differentCustomers}}};
                    } else {
                        document = {$set: {lastmodified: nowTime, last_modified: nowTime}};
                    }

                } else {
                    var customers = [];
                    for (var i=0; i<usersArray.length; i++) {
                        var customer = {};
                        customer.userId = usersArray[i].userId;
                        customer.userName = usersArray[i].userName || '';
                        customer.avatarPath = usersArray[i].avatarPath || '';
                        customers.push(customer);
                    }
                    document = {$set: {lastmodified: nowTime, last_modified: nowTime}, $push: { customers: {$each: customers}}};
                }

                var criteria = {_id: orderId};
                var options = {};
                var helper = {
                    collectionName: _this.enums.CollectionName.DINING_ORDERS,
                    callerScript: 'File: order.js; Method: UpdateParameterByOrderId()',
                    apiVersion: 1
                };
                _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        apiresult = {status: 204};
                        nextstep();
                    }
                });
            } else {
                apiresult = {status: 204};
                nextstep();
            }
        },

        // step- : doCreatePrintTask
        function (nextstep) {
            if (isServer !== 'TRUE' && selectFlag === 'pay' && order.bill_status.is_online_payment && order.is_takeout) {
                _this.createPrintTask(orderId, order, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.Pay doCreatePrintTask returns error', error: error});
                        nextstep(new _this.httpExceptions.DataConflictedException('create print-task', 'error'));
                    } else {
                        if (result.length === 0) {
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.Pay doCreatePrintTask returns empty'});
                            nextstep();
                        } else {
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.Pay doCreatePrintTask returns right'});
                            nextstep();
                        }
                    }
                })
            } else {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.Pay doCreatePrintTask returns empty'});
                nextstep();
            }
        },

        // step-notification
        function (nextstep) {

            // I think this 'updateParameter' is badly, I hope split them somedays.
            if (isServer !== 'TRUE' && selectFlag === 'pay' && order.bill_status.is_online_payment) {

                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.Pay do step-notification', orderId: orderId });

                var postData={};
                postData.host = otherServers.notification.server_url;
                postData.port = otherServers.notification.server_port;
                postData.path = '/notifications';

                var body = {};
                if (order.is_takeout) {
                    // takeout
                    body = {
                        'command': _this.enums.PushMessageType.BROADCAST,
                        'user_id': order.user.user_id,
                        'user_name': order.user.user_name || '',
                        'restaurant_id': order.restaurant.restaurant_id,
                        'restaurant_name': order.restaurant.restaurant_name || '',
                        'restaurant_phone': order.restaurant.officialPhone || '',
                        'consumer_phone': order.note.mobile || '',
                        'table_id': order.tableId,
                        'table_no': order.tableNo,
                        'order_id': orderId
                    };
                    //FBE-2629
                    if(order.group_buy){
                        body.code = _this.enums.PushMessageType.COUPON_PAID;
                    }else{
                        body.code =  _this.enums.PushMessageType.ONLINE_PAID_TAKEOUT;
                        body.pickup_time = _this.dataGenerationHelper.getValidUTCDateTimeFormat(order.picked_up_time);
                        body.time_zone = order.restaurant.time_zone || _this.config.other_servers.time_zone.default_time_zone;
                        body.table_id = order.tableId;
                        body.table_no = order.tableNo;
                        var orderItems = [];

                        for (var i=0; i<order.order_items.length; i++) {
                            var orderItem = order.order_items[i];

                            orderItems.push({
                                order_item_user_id: orderItem.order_item_user_id,
                                order_item_id: orderItem.order_item_id,
                                item_id: orderItem.item_id,
                                item_name: orderItem.item_name,
                                item_names: orderItem.item_names
                            })
                        }

                        body.order_items = orderItems;
                    }
                } else if (order.order_type === _this.enums.OrderType.PREORDER) {
                    // pre order
                    var pickUpTime = isNotNull(order.note) ? _this.dataGenerationHelper.getValidUTCDateTimeFormat(order.note.effective_date) :
                        _this.dataGenerationHelper.getValidUTCDateTimeFormat();

                    body = {
                        'command': _this.enums.PushMessageType.BROADCAST,
                        'user_id': order.user.user_id,
                        'user_name': order.user.user_name || '',
                        'consumer_avatar_path':order.user.avatar_path ||'',
                        'restaurant_id': order.restaurant.restaurant_id,
                        'restaurant_name': order.restaurant.restaurant_name || '',
                        'restaurant_phone': order.restaurant.officialPhone || '',
                        'consumer_phone': order.note.mobile || '',
                        'table_id': order.tableId,
                        'table_no': order.tableNo,
                        'order_id': orderId,
                        'time_zone':order.restaurant.time_zone || _this.config.other_servers.time_zone.default_time_zone,
                        'code': _this.enums.PushMessageType.ONLINE_PAID_PREORDER,
                        'pickup_time': pickUpTime
                    }

                }else {
                    // dinner
                    body = {
                        'command':_this.enums.PushMessageType.BROADCAST,
                        'user_id': order.user.user_id,
                        'user_name': order.user.user_name || '',
                        'consumer_disp_name':order.user.user_name ||'',
                        'consumer_avatar_path':order.user.avatar_path ||'',
                        'restaurant_id': order.restaurant.restaurant_id,
                        'table_id': order.tableId,
                        'table_no': order.tableNo,
                        'order_id': orderId,
                        'code': _this.enums.PushMessageType.ONLINEPAID
                    }
                }

                postData.method = 'POST';

                var reqParams = {
                    userId: userId,
                    orderId: orderId,
                    parameterBody: parameterBody,
                    selectFlag: selectFlag,
                    isServer: isServer,
                    headerToken: headerToken
                }

                var loggerInfos = {
                    function : 'Order.Pay do step-notification'
                };

                _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-INFO: Order.Pay do step-notification returns an error', error: error});
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.Pay do step-notification returns right'});
                    }
                }, reqParams, loggerInfos);
            }

            nextstep();
        }

    ], function (error) {
        callback(error, apiresult);
    });
};

var UpdateOrderItemByOrderId = function (userId, orderId, orderItemsMessage, isServer, headerToken, otherServers, callback) {
    var _this = exports;
    var orderItems = orderItemsMessage.orderItems;
    var restaurantId, servers, tableId, status, order = {}, customerInfo = {}, apiresult = {}, batchNo, menuItemIds = [];
    var nowTime = _this.dataGenerationHelper.getValidUTCDate();

    var menuMap = {};
    var restaurant = {};

    var newOrderItems = []; // order_items;

    _this.logger.info('%j', { function: 'Order.UpdateOrderItemByOrderId received arguments',
        userId: userId, orderId: orderId, orderItemsMessage: orderItemsMessage });

    async.waterfall([

        //-- Step-1: Validate all `order_item_id`
        function (nextstep) {

            for (var i in orderItems) {
                var orderItem = orderItems[i];
                if (orderItem.itemId && orderItem.itemId !== '') {
                    menuItemIds.push(orderItem.itemId);
                } else {
                    nextstep(new _this.httpExceptions.InvalidParameterException('order_item_id', orderItem.order_item_id));
                }

            }
            _this.orderManager.checkIdsAreValidUUIDs(menuItemIds, function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    nextstep();
                }
            });
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemByOrderId end-of-step-1: Validate all `order_item_id`' });
        },

        //-- Step-2: Get Customer Information
        function (nextstep) {
            if (isServer === 'TRUE') {
                nextstep();
            } else {
                getCustomerInfo( userId, orderId, function (error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        customerInfo = result;
                        nextstep();
                    }
                });
            }
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemByOrderId end-of-step-2: Get Customer Information ' });
        },

        //-- Step-3: Retrieve the `order`
        function (nextstep) {
            var selector = {'$and': [{_id: orderId}, {'$or': [{archived: false}, {archived: null}]}]};
            var options = {};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                callerScript: 'File: order.js; Method: UpdateOrderItemByOrderId()' ,
                apiVersion: 1
            };
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('orderId', orderId));
                } else {
                    order = result[0];
                    status = result[0].status;
                    if (status === _this.enums.OrderStatus.CANCELLED) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has already been canceled', orderId));
                    } else if (status === _this.enums.OrderStatus.CLOSED) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has already been closed', orderId));
                    } else {
                        restaurantId = order.restaurant.restaurant_id || order.restaurantId;
                        servers = result[0].servers;
                        tableId = result[0].tableId;
                        nextstep();
                    }
                }
            });
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemByOrderId end-of-step-3: Retrieve the `order` ' });
        },

        //-- Step-4: Validate Menu Item IDs
        function (nextstep) {
            var selector, options, helper, menu = {};

            selector = {_id: {$in: menuItemIds}, restaurantId: restaurantId };
            options = {};
            helper = {
                collectionName: 'menu',
                callerScript: 'File: order.js; Method: UpdateOrderItemByOrderId()' ,
                apiVersion: 1
            };

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('menuItemIds', menuItemIds));
                } else {

                    menu = result;

                    var unpublishedIds = [];

                    for (var i=0; i<menu.length; i++) {
                        menuMap[menu[i]._id] = menu[i];

                        if (menu[i].status !== 'published' || menu[i].approved_status !== _this.enums.ApprovedStatus.APPROVED) {
                            unpublishedIds.push(menu[i]._id);
                        }
                    }

                    if (unpublishedIds.length > 0) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderItemByOrderId step-4 doValidateOrderItems returns error', error: 'MENU_UNAVAILABLE'});
                        nextstep(new _this.httpExceptions.CommonHttpErrorException('MENU_UNAVAILABLE', 'menu/good(s) are not available: menuIds', unpublishedIds));
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemByOrderId end-of-step-4', menuMap: menuMap });
                        nextstep();
                    }
                }
            });
        },

        // step-5: doFindRestaurant
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderItemByOrderId step-5 doFindRestaurant'});

            var selector = {_id: order.restaurant.restaurant_id};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.RESTAURANT};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderItemByOrderId step-5 doFindRestaurant returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find restaurant', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderItemByOrderId step-5 doFindRestaurant returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('restaurantId', order.restaurant.restaurant_id));
                } else {
                    restaurant = result[0];

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-5 doFindRestaurant returns right'});
                    nextstep();
                }
            })
        },

        //-- Step-5: Append `order_item_id`, `submission_time`, `order_item_batch_no`
        function (nextstep) {

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemByOrderId orderItems to be saved', orderItems: orderItems });

            var orderItemSeparatePrinters = [];
            if (restaurant.printers !== null && restaurant.printers !== undefined && restaurant.printers.length > 0) {
                var printers = [];
                for (var i=0; i<restaurant.printers.length; i++) {
                    var usages = restaurant.printers[i].usages;
                    var type = restaurant.printers[i].type;

                    if (usages !== null && usages !== undefined && usages.length > 0) {
                        for (var j = 0; j < usages.length; j++) {
                            if ((usages[j].item_auto_print === true && usages[j].usage === _this.enums.PrinterUsage.PASS) /*||
                                (type === _this.enums.PrinterModule.FEIE && usages[j].usage === _this.enums.PrinterUsage.KITCHEN && usages[j].item_print_number > 0 )*/) {
                                orderItemSeparatePrinters.push(restaurant.printers[i]);
                                break;
                            }
                        }
                    }
                }
            }

            var orderItem = {}, modifiedOrderItems = [], saveOrderItemResult = [];
            batchNo = order.batch_no + 1;
            for (var j=0; j<orderItems.length; j++) {
                orderItem = _this.backendHelpers.jsonHelper().cloneDocument(orderItems[j]);
                orderItem.order_item_user_id = userId;
                orderItem.order_item_id = _this.dataGenerationHelper.generateUUID();
                //-- FBE-1180: [Orders] Fix the missing 'order_item_batch_no' and 'submission_time' implementation from FBE-292
                orderItem.submission_time = nowTime;
                orderItem.order_item_batch_no = batchNo;

                orderItem.order_item_user_name = customerInfo.user_name || '';
                orderItem.order_item_user_avatar_path = customerInfo.avatar_path || '';

                //-- FBE-1285: Forward-compatibility: Enhance Existing Add Order Item API to append new attributes
                orderItem.menu_item_rating = menuMap[orderItem.itemId].rating || 0;
                var photos = menuMap[orderItem.itemId].photos;
                if (isNotNull(photos)) {
                    for (var k=0; k<photos.length; k++) {
                        var photo = photos[k];
                        if (photo.size == _this.enums.SizeOfPhoto.SMALL) {
                            orderItem.menu_item_photo = photo.path || '';
                            break;
                        }
                    }
                } else {
                    orderItem.menu_item_photo = '';
                }
                //-- Add by webber.wang for FBE-1443 2015-08-12
                if(orderItem.itemName===null || orderItem.itemName === undefined || orderItem.itemName ===''){
                    if( menuMap[orderItem.itemId].shortNames && menuMap[orderItem.itemId].shortNames.length>0){
                        orderItem.itemName = menuMap[orderItem.itemId].shortNames[0].name;
                    }else if( menuMap[orderItem.itemId].shortNames && menuMap[orderItem.itemId].shortNames.length>0){
                        orderItem.itemName = menuMap[orderItem.itemId].longNames[0].name;
                    } else{
                        orderItem.itemName = "";
                    }
                }

                orderItem.itemNames = menuMap[orderItem.itemId].longNames;
                if (orderItem.catalogue === null || orderItem.catalogue === undefined) {
                    orderItem.catalogue_full = menuMap[orderItem.itemId].catalogue_full;
                }

                if(orderItem.category===null || orderItem.category === undefined || orderItem.category ===''){
                    orderItem.category = menuMap[orderItem.itemId].category
                }

                if(orderItem.photos===null || orderItem.photos === undefined || orderItem.photos ===''){
                    orderItem.photos = menuMap[orderItem.itemId].photos
                }

                orderItem.chit_printed = false;

                var printers = menuMap[orderItem.itemId].printers;
                orderItem.printers = isNotNull(printers) ? printers : [];

                for (var k=0; k<orderItemSeparatePrinters.length; k++) {
                    orderItem.printers.push(orderItemSeparatePrinters[k]);
                }

                orderItem.original_price = menuMap[orderItem.itemId].OriginalPrice ? menuMap[orderItem.itemId].OriginalPrice : menuMap[orderItem.itemId].BasePrice;
                orderItem.actual_original_price = {
                    amount: _this.dataGenerationHelper.getAccurateNumber(orderItem.original_price, 2),
                    currencyCode: restaurant.currency
                };

                modifiedOrderItems.push(orderItem);

                var newOrderItem = _this.backendHelpers.jsonHelper().cloneDocument(orderItem);
                newOrderItem.item_id = newOrderItem.itemId;
                newOrderItem.item_name = newOrderItem.itemName;
                newOrderItem.item_names = newOrderItem.itemNames;
                newOrderItem.price.currency_code = newOrderItem.price.currencyCode;

                var childrenItems = [];
                if (newOrderItem.childrenItems) {
                    for (var i=0; i< newOrderItem.childrenItems.length; i++) {
                        var childrenItem = newOrderItem.childrenItems[i];
                        childrenItem.child_item_id = childrenItem.childItemId;
                        childrenItem.child_item_name = childrenItem.childItemName;
                        childrenItem.price_diff = childrenItem.priceDiff;
                        if (childrenItem.price_diff) {
                            childrenItem.price_diff.currency_code = childrenItem.priceDiff.currencyCode;
                        }

                        delete childrenItem.childItemId;
                        delete childrenItem.childItemName;
                        delete childrenItem.priceDiff;
                        delete childrenItem.price_diff.currencyCode;

                        childrenItems.push(childrenItem);
                    }
                }

                newOrderItem.children_items = childrenItems;

                delete newOrderItem.childrenItems;
                delete newOrderItem.itemId;
                delete newOrderItem.itemName;
                delete newOrderItem.itemNames;
                delete newOrderItem.price.currencyCode;
                newOrderItems.push(newOrderItem);

                saveOrderItemResult.push( {
                    order_item_id: orderItem.order_item_id,
                    itemId: orderItem.itemId,
                    order_item_menu_item_id: orderItem.itemId
                });
            };
            var criteria = {_id: orderId},
                document = {
                    $push: { orderItems: {$each: modifiedOrderItems}, order_items: {$each: newOrderItems}},
                    $set: {batch_no: batchNo, batchNo: batchNo, lastmodified: nowTime, last_modified: nowTime, last_submission_time: nowTime}
                },
                options = {},
                helper = {
                    collectionName: _this.enums.CollectionName.DINING_ORDERS,
                    callerScript: 'File: order.js; Method: UpdateOrderItemByOrderId()' ,
                    apiVersion: 1
                };

            _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemByOrderId end-of-step-5: Append `order_item_id`, `submission_time`, `order_item_batch_no` ' });
                    apiresult = {status: 200, data : { result :  saveOrderItemResult } };
                    nextstep();
                }
            });

        },

        // step-6: doCreatePrintTask
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemByOrderId step-6 doCreatePrintTask'});

            // need reconstruction later
            if (order.is_takeout !== true) {

                order.order_items = newOrderItems;

                _this.createPrintTask(orderId, order, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.UpdateOrderItemByOrderId step-6 doCreatePrintTask returns error', error: error});
                        nextstep(new _this.httpExceptions.DataConflictedException('create print-task', 'error'));
                    } else {
                        if (result.length === 0) {
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemByOrderId step-6 doCreatePrintTask returns empty'});
                            nextstep();
                        } else {
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemByOrderId step-6 doCreatePrintTask returns right'});
                            nextstep();
                        }
                    }
                })

            } else {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemByOrderId step-6 doCreatePrintTask returns empty'});
                nextstep();
            }

        },

        // step-notification
        function (nextstep) {

            if (isServer != 'TRUE') {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemByOrderId do step-notification', orderId: orderId });

                var postData={};
                postData.host = otherServers.notification.server_url;
                postData.port = otherServers.notification.server_port;
                postData.path = '/notifications';
                var body = {
                    'command': _this.enums.PushMessageType.BROADCAST,
                    'user_id': order.user.user_id,
                    'user_name': order.user.user_name || '',
                    'consumer_disp_name':order.user.user_name ||'',
                    'consumer_avatar_path':order.user.avatar_path ||'',
                    'restaurant_id': restaurantId,
                    'table_id': order.tableId,
                    'table_no': order.tableNo,
                    'order_id': orderId,
                    'code': _this.enums.PushMessageType.SUBMITORDER,
                    'deliver_type':'RELIABLE'
                }
                postData.method = 'POST';

                var reqParams = {
                    userId: userId,
                    orderId: orderId,
                    orderItemsMessage: orderItemsMessage,
                    isServer: isServer,
                    headerToken: headerToken
                };

                var loggerInfos = {
                    function : 'Order.UpdateOrderItemByOrderId do step-notification'
                };

                _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-INFO: Order.CreateOrder do step-notification returns an error', error: error});
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateOrder do step-notification returns right'});
                    }
                }, reqParams, loggerInfos);
            }

            nextstep();
        }

    ], function (error) {
        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemByOrderId `error` callback ', error: error });
        callback(error, apiresult);
    });
};

var UpdateOrderItemParameterByOrderItemId = function (userId, orderId, orderItemId, parameterBody, isServer, callback, selectFlag) {
    var _this = exports;
    var apiresult;
    async.series([
        function (nextstep) {
            if (isServer === 'TRUE') {
                nextstep();
            } else {
                getCustomerInfo(userId, orderId, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        nextstep();
                    }
                });
            }
        },
        function (nextstep) {
            var selector = {'$and':[{_id: orderId}, {'orderItems.order_item_id': orderItemId}, {'$or':[{archived: false}, {archived: null}]}]};
            var options = {};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('orderId or orderItemId', 'orderId: '+orderId+' ,orderItemId: '+orderItemId));
                } else {
                    var status = result[0].status;
                    if (status === _this.enums.OrderStatus.CANCELLED) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has been canceled', orderId));
                    } else if ( status === _this.enums.OrderStatus.CLOSED) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has been closed', orderId));
                    } else {
                        nextstep();
                    }
                }
            });
        },
        function (nextstep) {
            var options, helper, criteria, document;
            var nowTime = _this.dataGenerationHelper.getValidUTCDate();
            if (selectFlag === 'price') {
                document = { $set: {'orderItems.$.price': parameterBody,lastmodified: nowTime}};
            } else if (selectFlag === 'quantity') {
                parameterBody = Number(parameterBody);
                document = { $set:{'orderItems.$.quantity': parameterBody,lastmodified:nowTime}};
            }
            criteria = {'$and':[{_id: orderId}, {'orderItems.order_item_id': orderItemId}]};
            helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };
            options = {};
            _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    apiresult = {status: 204};
                    nextstep();
                }
            });
        }
    ], function (error) {
        callback(error, apiresult);
    });
};

var DeleteUsersByOrderId = function (userId, orderId, userIds, isServer, callback) {
    var _this = exports;
    var apiresult = '';
    var ids = userIds.split(',');

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order.DeleteUsersByOrderId received parameters: ',
        userId:userId,
        orderId: orderId,
        userIds: userIds,
        isServer: isServer
    });

    var order = {};

    async.series([
        function (nextstep) {
            if (isServer === 'TRUE') {
                nextstep();
            } else {
                getCustomerInfo(userId, orderId, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        nextstep();
                    }
                });
            }
        },
        // step-2: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.DeleteUsersByOrderId step-2 doFindOrder', orderId: orderId});

            var selector = {'$and':[{_id: orderId}, {'$or':[{archived: false},{archived: null}]}]};
            var options = {};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.DeleteUsersByOrderId step-2 doFindOrder returns an error', error: error});
                    nextstep(new _this.httpExceptions.InvalidParameterException('orderId', orderId));
                } else if (result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.DeleteUsersByOrderId step-2 doFindOrder returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('orderId', orderId));
                } else {
                    order = result[0];

                    if (order.status == _this.enums.OrderStatus.CANCELLED) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.DeleteUsersByOrderId step-2 doFindOrder returns other error', error: 'This order has been canceled'});
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has been canceled', orderId));
                    } else {
                        if (!isNotNull(order.customers) || order.customers.length == 0) {
                            _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.DeleteUsersByOrderId step-2 doFindOrder returns other error', error: 'This order has no customers'});
                            nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has no customers', orderId));
                        } else {

                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.DeleteUsersByOrderId step-2 doFindOrder returns right', order: order});
                            nextstep();
                        }
                    }
                }
            });
        },
        // step-3: doValidatePermission
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.DeleteUsersByOrderId step-3 doValidatePermission', orderId: orderId});

            var selector,options,helper;
            if (isServer === 'TRUE') {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.DeleteUsersByOrderId step-3 doValidatePermission returns right'});
                nextstep();
            } else {

                if (order.user.user_id != userId) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.DeleteUsersByOrderId step-3 doValidatePermission returns other error', error: 'have no permission'});
                    nextstep(new _this.httpExceptions.OperationNotPermissionException(userId, 'user <' + userId + '> doesn\'t have the permission to remove users , only the owner of the table has the permission'));
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.DeleteUsersByOrderId step-3 doValidatePermission returns right'});
                    nextstep();
                }
            }
        },
        // step-4: doValidateSelf
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.DeleteUsersByOrderId step-4 doValidateSelf', orderId: orderId});

            var selector,options,helper;
            if (isServer === 'TRUE') {
                var flag = false;
                for (var i in ids) {
                    if (ids[i] == order.user.user_id) {
                        flag = true;
                        break;
                    }
                }

                if (flag) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.DeleteUsersByOrderId step-4 doValidateSelf returns other error', error: 'server can\'t delete owner'});
                    nextstep(new _this.httpExceptions.OperationNotPermissionException(ids[i], 'server can\'t delete owner'));
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.DeleteUsersByOrderId step-4 doValidateSelf returns right'});
                    nextstep();
                }

            } else {
                var flag = false;
                for (var i in ids) {
                    if (ids[i] == userId) {
                        flag = true;
                        break;
                    }
                }

                if (flag) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.DeleteUsersByOrderId step-4 doValidateSelf returns other error', error: 'user can\'t delete himself'});
                    nextstep(new _this.httpExceptions.OperationNotPermissionException(ids[i], 'user can\'t delete himself'));
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.DeleteUsersByOrderId step-4 doValidateSelf returns right'});
                    nextstep();
                }
            }
        },
        // step-5: doDeleteCustomer
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.DeleteUsersByOrderId step-5 doDeleteCustomer', orderId: orderId, ids: ids});

            var selector = {_id: orderId};
            var document = {$pull: {'customers': {userId: {$in: ids}}}};
            var options = {multi:true};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                callerScript: 'File: order.js; Method: DeleteUsersByOrderId()',
                apiVersion: 1
            };
            _this.restaurantDataAPI.update(selector, document, options, helper, function (error) {
                if (error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.DeleteUsersByOrderId step-5 doDeleteCustomer returns error', error: error});
                    nextstep(new _this.httpExceptions.InvalidParameterException('orderId', orderId));
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.DeleteUsersByOrderId step-5 doDeleteCustomer returns right'});
                    nextstep();
                }
            });
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.DeleteUsersByOrderId step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.DeleteUsersByOrderId step-(right) callback'});
        }
        callback(error, apiresult);
    });
};

var DeleteOrderItemByOrderItemId = function (userId, orderId, orderItemId, isServer, callback) {
    var _this = exports;
    var options = {};
    var apiresult;
    async.series([
        function (nextstep) {
            if (isServer === 'TRUE') {
                nextstep();
            } else {
                getCustomerInfo(userId, orderId, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        nextstep();
                    }
                });
            }
        },
        function (nextstep) {
            var selector = {'$and':[{_id: orderId},{'$or':[{archived: false},{archived: null}]}]};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };
            _this.restaurantDataAPI.find(selector, options, helper,function (error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has been canceled', orderId));
                } else {
                    var status = result[0].status;
                    if (status === _this.enums.OrderStatus.CANCELLED) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has been canceled', orderId));
                    } else if ( status === _this.enums.OrderStatus.CLOSED) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has been closed', orderId));
                    } else {
                        nextstep();
                    }
                }
            });
        },
        function (nextstep) {
            var selector = {'$and':[{_id: orderId},{'orderItems.order_item_id': orderItemId}, {'$or':[{archived: false},{archived: null}]}]};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('orderId or orderItemId', 'orderId: '+orderId+' ,orderItemId: '+orderItemId));
                } else {
                    nextstep();
                }
            });
        },
        function (nextstep) {
            var criteria = {_id: orderId};
            var document = {$pull: {orderItems: {order_item_id: orderItemId}, order_items: {order_item_id: orderItemId}}};
            var options = {};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };
            _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    nextstep();
                }
            });
        },
        function (nextstep) {
            var nowTime = _this.dataGenerationHelper.getValidUTCDate();
            var criteria = {_id: orderId};
            var document = {$set: {lastmodified: nowTime}};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };
            _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    apiresult = {status: 204};
                    nextstep();
                }
            });
        }
    ], function (error) {
        callback(error, apiresult);
    });
};

// need to optimize it
var GetOrders = function (userid, from, pageSize, callback) {
    var _this = exports;
    var apiresult;
    var query;
    var userIds = [];
    async.waterfall([
        function (callback) {
            var userId ;
            if (null !== userid && '' !== userid && userid !== undefined) {
                userId = userid.split(',');
                userIds = userid.split(',');
                callback(null, userId);
            } else {
                userId = [];
                callback(null, userId);
            }
        },

        function (userId,callback) {
            var orderQuery;
            var filter;
            if (userId.length !== 0) {

                query = {'customers.user_id': {'$in': userId}};

                filter = {};
                var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

                _this.restaurantDataAPI.find(query,filter,helper,function (error,result) {
                    if (error) {
                        callback(error);
                    } else if (result === null || result === '' || result.length === 0) {
                        callback(null,[]);
                    } else {
                        var orderId = [];
                        result.forEach(function (value,index) {
                            orderId.push(value._id);
                            if (index === result.length - 1) {
                                callback(null,orderId);
                            }
                        });
                    }
                });
            } else {
                orderQuery = [];
                callback(null,orderQuery);
            }
        },

        function (orderQuery,callback) {
            if (userIds.length !== 0) {

                var selector = {'$and': [{'servers.userId':{'$in':userIds}}, {'$or':[{archived: false},{archived: null}]},{status:{$ne: _this.enums.OrderStatus.CANCELLED}} ]};
                var options = {};
                var helper = {
                    collectionName: _this.enums.CollectionName.DINING_ORDERS,
                    apiVersion: 1
                };
                _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                    if (error) {
                        callback(error);
                    } else if (result === null || result === '' || result.length === 0) {
                        orderQuery = {_id :{'$in':orderQuery}};
                        callback(null,orderQuery);
                    } else {
                        result.forEach(function (value,index) {
                            orderQuery.push(value._id);
                            if (index === result.length - 1) {
                                orderQuery = {_id :{'$in':orderQuery}};
                                callback(null,orderQuery);
                            }
                        });
                    }
                });
            } else {
                orderQuery = {};
                callback(null,orderQuery);
            }

        },

        function (orderQuery,callback) {
            var options = {fields:{ user:1,servers:1,_id:1,restaurantResponse:1,restaurantId:1,'lastmodified':1,orderItems:1,'orderItems.itemId':1,
                'orderItems.itemName':1,'orderItems.type':1,'orderItems.quantity':1,'orderItems.childrenItems':1,
                'orderItems.childrenItems.childItemId':1,'orderItems.childrenItems.childItemName':1 }};
            _this.orderManager.pagingFunction(options,from,pageSize);
            options.sort = { 'lastmodified':-1,'_id':1 };
            var selector =  {'$and':[orderQuery,{'$or':[{archived: false},{archived: null}]},{status:{$ne: _this.enums.OrderStatus.CANCELLED}}]};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };
            _this.restaurantDataAPI.find(selector,options,helper,function (error,orderResult) {
                if (error) {
                    callback(error);
                } else if (orderResult === null || orderResult === '' || orderResult.length === 0) {
                    callback(new _this.httpExceptions.ResourceNotFoundException('userId', userid));
                } else {

                    orderResult.forEach(function (value,index) {
                        value.userId = value.user.user_id;
                        value.orderId = value._id;
                        delete value._id;
                    });

                    apiresult = {status: 200, data: orderResult};
                    callback();
                }
            });
        }
    ], function (error) {
        callback(error, apiresult);
    });
};

var DeleteOrdersByRestaurantId = function (restaurantId, callback) {
    var _this = exports;
    async.waterfall([
        function (callback) {
            var ids = [];
            var selector = {'$and':[{restaurantId:restaurantId},{'$or':[{archived: false},{archived: null}]}]};
            var options = {};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    callback(error);
                } else if (result === null || result === '' || result.length === 0) {
                    callback(new _this.httpExceptions.ResourceNotFoundException('restaurantId', restaurantId));
                } else {
                    if (result && result.length > 0) {
                        for (var i = 0; i < result.length; i++) {
                            if (result[i] !== null && result[i]._id !== null) {
                                ids[i] = result[i]._id;
                            }
                        }
                    }
                    callback(null, ids);
                }
            });
        },
        function (ids,callback) {
            deleteOrder(ids,0,function (error) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, {status: 204});
                }
            });
        }
    ], function (error,result) {
        callback(error, result);
    });
};

var GetHaveEatenRestaurantsByUserId = function (userId, key, from, pageSize, callback) {
    var _this = exports;
    var selector = {};
    var options = {};
    var helper = {};
    var orderIds = [],apiResult,allEatenRestaurantIds = [],
        keyRestaurantIds = [],keyMenuRestaurantIds = [],searchInRestaurantIds = [];
    async.series([
        function (nextstep) {

            selector = {'customers.user_id': userId};
            options = {fields: {_id: 1}};
            helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else {
                    if (null !== result && '' !== result && result.length !== 0) {
                        result.forEach(function (value,index) {
                            orderIds.push(value._id);
                            if (index === result.length - 1) {
                                nextstep();
                            }
                        });
                    } else {
                        nextstep();
                    }
                }
            });
        },
        function (nextstep) {
            if (orderIds.length !== 0) {
                var query = {'_id':{'$in': orderIds }};
                var filter = { restaurantId : 1, lastmodified : 1, _id : 0 };
                var group = { _id : '$restaurantId', restaurantId :{ $first: '$restaurantId' },lastmodified: { $max: '$lastmodified' }, count : { $sum : 1 } };
                var sort = { count : -1, lastmodified : -1, restaurantId : -1 };
                var resultFilter = { restaurantId : 1, _id : 0 };
                helper = {
                    collectionName: _this.enums.CollectionName.DINING_ORDERS,
                    callerScript: 'File: order.js; Method: GetHaveEatenRestaurantsByUserId()',
                    apiVersion: 1
                };
                _this.restaurantDataAPI.aggregate(query,filter,resultFilter,sort,group,helper,function (error,result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        allEatenRestaurantIds = result;
                        if (null !== result && '' !== result && result.length !== 0) {
                            result.forEach(function (value,index) {
                                searchInRestaurantIds.push(value.restaurantId);
                                if (index === result.length - 1) {
                                    nextstep();
                                }
                            });
                        } else {
                            nextstep();
                        }
                    }
                },from,pageSize);
            } else {
                nextstep();
            }
        },
        function (nextstep) {
            if (allEatenRestaurantIds.length !== 0 && key !== null && key !== '' && key !== undefined) {
                selector ={
                    '$and':
                        [
                            {'$or':
                                [
                                    { longNames : {'$elemMatch':{ name: { $regex : key,$options: 'i'} }}},
                                    { shortNames : {'$elemMatch':{ name: { $regex : key,$options: 'i'} }}}
                                ]
                            },
                            { _id : { '$in': searchInRestaurantIds} }
                        ]
                };
                options = { fields: { _id : 1}};
                helper = {
                    collectionName: 'restaurant',
                    callerScript: 'File: order.js; Method: GetHaveEatenRestaurantsByUserId()',
                    apiVersion: 1
                };
                _this.restaurantDataAPI.find(selector, options, helper,function (error, restaurantResult) {
                    if (error) {
                        nextstep(error);
                    } else if (restaurantResult === null || restaurantResult === '' || restaurantResult.length === 0) {
                        keyRestaurantIds = [];
                        nextstep();
                    } else {
                        keyRestaurantIds = restaurantResult;
                        nextstep();
                    }
                });
            } else {
                nextstep();
            }
        },
        function (nextstep) {
            if (allEatenRestaurantIds.length !== 0 && key !== null && key !== '' && key !== undefined) {
                selector ={'$and': [
                    {'$or': [
                        { longNames : {'$elemMatch':{ name:{ $regex : key,$options: 'i'} }}},
                        { shortNames : {'$elemMatch':{ name: { $regex : key,$options: 'i'} }}}
                    ]},
                    { restaurantId:{ '$in': searchInRestaurantIds}}
                ]};
                options = { fields:{restaurantId:1,_id:0}};
                helper = {
                    collectionName: 'menu',
                    callerScript: 'File: order.js; Method: GetHaveEatenRestaurantsByUserId()',
                    apiVersion: 1
                };
                _this.restaurantDataAPI.find(selector,options,helper,function (error,MenuResult) {
                    if (error) {
                        nextstep(error);
                    } else if (MenuResult === null || MenuResult === '' || MenuResult.length === 0) {
                        keyMenuRestaurantIds = [];
                        nextstep();
                    } else {
                        keyMenuRestaurantIds = MenuResult;
                        nextstep();
                    }
                });
            } else {
                nextstep();
            }
        },
        function (nextstep) {
            if (key === null ||  key === '' ||  key === undefined) {
                apiResult = {status: 200, data:allEatenRestaurantIds};
                nextstep();
            } else {
                if (keyRestaurantIds.length !== 0) {
                    var keyMenuRestaurantIdStr = keyMenuRestaurantIds.join(',');
                    keyRestaurantIds.forEach(function (value,index) {
                        var object = {};
                        if (keyMenuRestaurantIdStr.indexOf(value._id) === -1) {
                            object.restaurantId = value._id;
                            keyMenuRestaurantIds.push(object);
                        }
                        if (index === keyMenuRestaurantIds.length -1) {
                            apiResult = {status: 200, data:keyMenuRestaurantIds};
                            nextstep();
                        }
                    });
                } else {
                    apiResult = {status: 200, data:keyMenuRestaurantIds};
                    nextstep();
                }
            }
        }
    ], function (error) {
        callback(error, apiResult);
    });
};

var GetLastOrderTimeByUserId = function (userId, callback) {
    var _this = exports;

    _this.logger.info('%j', {function:'DEBUG-INFO: Order.SetOrderTips received parameters', userId: userId});

    var selector = {'customers.user_id': userId};
    var options = {fields: {lastmodified: 1}, sort: {'lastmodified': -1,'_id':-1}};
    var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

    _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.SetOrderTips returns error', error: error});
            callback(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
        } else if (result === null || result === '' || result.length === 0) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.SetOrderTips returns empty'});
            callback(new _this.httpExceptions.InvalidParameterException('userId','HAVE_NO_ORDERID'));
        } else {
            var date = _this.dataGenerationHelper.getValidUTCDate(result[0].lastmodified);
            var date_mill = date.getTime();

            _this.logger.info('%j', {function:'DEBUG-INFO: Order.SetOrderTips returns right'});
            callback(null, {status: 200, data:{ lastOrderTime:date_mill}});
        }
    });

};

var UpdateStaffToTable = function (restaurantId, tableId, userId, callback, operator, otherServers) {
    var _this = exports;
    var apiresult;
    async.waterfall([
        function (nextstep) {
            var selector = {_id:restaurantId};
            var options = {};
            var helper = {collectionName: 'restaurant'};
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('the restaurant id is not exist: restaurantId', restaurantId));
                } else {
                    nextstep();
                }
            });
        },

        function (nextstep) {
            var selector = {'tables.tableId': tableId,'tables.restaurantId':restaurantId};
            var options = {fields:{'tables': 1,'_id':0} };
            var helper = {collectionName: 'restaurant'};
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('tableId', tableId));
                } else {
                    nextstep();
                }
            });
        },
        function (nextstep) {
            var criteria = { 'tables.tableId': tableId,'tables.restaurantId': restaurantId };
            var helper = {collectionName: 'restaurant'};
            var options = {};
            var document;
            if (operator === 'server') {

                document = { $addToSet: {'tables.$.servers': { userId : userId} }};
            } else if (operator === 'busser') {

                document = { $addToSet: {'tables.$.bussers': { userId : userId} }};
            }
            _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    apiresult = {status: 204};
                    nextstep();
                }
            });
        }
    ], function (error) {
        callback(error, apiresult);
    });
};

var DeleteStaffFromTable = function (restaurantId, tableId, userId, callback, operator) {
    var _this = exports;
    var apiresult;
    async.waterfall([
        function (nextstep) {
            var selector = {_id:restaurantId};
            var options = {};
            var helper = {collectionName: 'restaurant'};
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('the restaurant id is not exist: restaurantId', restaurantId));
                } else {
                    nextstep();
                }
            });
        },

        function (nextstep) {
            var selector = {'tables.tableId': tableId,'tables.restaurantId':restaurantId};

            var options = {fields:{'tables.$': 1,'_id':0} };
            var helper = {collectionName: 'restaurant'};
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('tableId', tableId));
                } else {
                    if (operator === 'server') {
                        deleteTablesServerArray(result[0].tables[0].servers,userId,function (error,result) {
                            nextstep(null,result);
                        });
                    } else if (operator === 'busser') {
                        deleteTablesServerArray(result[0].tables[0].bussers,userId,function (error,result) {
                            nextstep(null,result);
                        });
                    }
                }
            });
        },
        function (staff,nextstep) {
            var criteria = { 'tables.tableId': tableId,'tables.restaurantId': restaurantId };
            var helper = {collectionName: 'restaurant'};
            var options = {};
            var document1,document2;
            if (operator === 'server') {
                document1 = { $unset: {'tables.$.servers': 1}};
                document2 = { $set: { 'tables.$.servers': staff}};
            } else if (operator === 'busser') {
                document1 = { $unset: {'tables.$.bussers': 1}};
                document2 = { $set: { 'tables.$.bussers': staff}};
            }
            _this.restaurantDataAPI.update(criteria, document1, options, helper, function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    _this.restaurantDataAPI.update(criteria, document2, options, helper, function (error) {
                        if (error) {
                            nextstep(error);
                        } else {
                            apiresult = {status: 204};
                            nextstep();
                        }
                    });
                }
            });
        }
    ], function (error) {
        callback(error, apiresult);
    });
};

var GetStaffByTableId = function (restaurantId, tableId, callback, operator) {
    var _this = exports;
    var apiresult;
    async.series([
        function (nextstep) {
            var selector = {_id:restaurantId};
            var options = {};
            var helper = {collectionName: 'restaurant'};
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('the restaurant id is not exist: restaurantId', restaurantId));
                } else {
                    nextstep();
                }
            });
        },
        function (nextstep) {
            var selector = { 'tables.tableId': tableId,'tables.restaurantId': restaurantId };
            var helper = {collectionName: 'restaurant'};

            var options = {fields:{'tables': 1,'_id':0 }};
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('table', tableId));
                } else {
                    nextstep();
                }
            });
        },
        function (nextstep) {
            var selector = { 'tables.tableId': tableId,'tables.restaurantId': restaurantId };
            var helper = {collectionName: 'restaurant'};
            var options;
            if (operator === 'server') {

                options = {fields:{'tables.$.servers': 1,'_id':0} };
                _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                    if (error) {
                        nextstep(error);
                    } else if (result === undefined || result === null || result === '' || result.length === 0) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('table', tableId));
                    } else {
                        var servers = { servers: result[0].tables[0].servers};
                        apiresult = { status: 200, data: servers };
                        nextstep();
                    }
                });
            } else if (operator === 'busser') {

                options = {fields:{'tables.$.bussers': 1,'_id':0 }};
                _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                    if (error) {
                        nextstep(error);
                    } else if (result === undefined || result === null || result === '' || result.length === 0) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('table', tableId));
                    } else {
                        var bussers = { bussers: result[0].tables[0].bussers};
                        apiresult = { status: 200, data: bussers };
                        nextstep();
                    }
                });
            }

        }
    ], function (error) {
        callback(error, apiresult);
    });
};

var GetTableByStaffId = function (restaurantId, userId, callback, operator) {
    var _this = exports;
    var apiresult;
    async.series([
        function (nextstep) {
            var selector = {_id:restaurantId};
            var options = {};
            var helper = {collectionName: 'restaurant'};
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('the restaurant id is not exist: restaurantId', restaurantId));
                } else {
                    nextstep();
                }
            });
        },
        function (nextstep) {
            var selector;
            var helper = {collectionName: 'restaurant'};

            var options = { fields:{'tables':1,'_id': 0 }};
            if (operator === 'server') {
                selector =  { 'tables':{ '$elemMatch':{'servers.userId':userId,restaurantId:restaurantId}}};
                _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                    if (error) {
                        nextstep(error);
                    } else if (result === undefined || result === null || result === '' || result.length === 0) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('userId', userId));
                    } else {
                        tablesFilter(result[0].tables,'servers',userId,function (error,result) {
                            if (error) {
                                callback(error, null);
                            } else {
                                apiresult = {status: 200, data: result};
                                callback(null,apiresult);
                            }
                        });
                    }
                });
            } else if (operator === 'busser') {
                selector =  { 'tables':{ '$elemMatch':{'bussers.userId':userId,restaurantId:restaurantId}}};
                _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                    if (error) {
                        nextstep(error);
                    } else if (result === undefined || result === null || result === '' || result.length === 0) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('userId', userId));
                    } else {
                        tablesFilter(result[0].tables,'bussers',userId,function (error,result) {
                            if (error) {
                                callback(error, null);
                            } else {
                                apiresult = {status: 200, data: result};
                                callback(null,apiresult);
                            }
                        });
                    }
                });
            }

        }
    ], function (error) {
        callback(error, apiresult);
    });
};

var UpdateTableAssignment = function (restaurantId, assignmentBody, callback) {
    var _this = exports;
    var apiresult;
    var tables = assignmentBody.tables;
    async.series([
        function (nextstep) {
            var selector = {_id:restaurantId};
            var options = {};
            var helper = {collectionName: 'restaurant'};
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('the restaurant id is not exist: restaurantId', restaurantId));
                } else {
                    nextstep();
                }
            });
        },
        function (nextstep) {
            tables.forEach(function (tableInfo,index) {
                var tableIdArry = [];
                tableIdArry.push(tableInfo.tableId);
                _this.orderManager.checkIdsAreValidUUIDs(tableIdArry, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        if (index >= tables.length - 1) {
                            nextstep();
                        }
                    }
                });
            });
        },
        function (nextstep) {
            var selector,options;
            var helper = {collectionName: 'restaurant'};
            tables.forEach(function (tableInfo,index) {
                selector = {'tables.tableId': tableInfo.tableId,'tables.restaurantId': restaurantId};
                options = {fields:{'tables.$': 1,'_id':0 }};
                _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                    if (error) {
                        nextstep(error);
                    } else if (result === undefined || result === null || result === '' || result.length === 0) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('tableId', tableInfo.tableId));
                    } else {
                        if (index >= tables.length - 1) {
                            nextstep();
                        }
                    }
                });
            });
        },
        function (nextstep) {
            tables.forEach(function (tableInfo,index) {
                var tableId = tableInfo.tableId;
                var servers = tableInfo.servers;
                var bussers = tableInfo.bussers;
                var criteria = { 'tables.tableId': tableId,'tables.restaurantId': restaurantId };
                var helper = {collectionName: 'restaurant'};
                var options = {};
                var document;
                if (servers && bussers) {
                    document = { $set: {'tables.$.servers': servers,'tables.$.bussers': bussers}};
                } else if (servers && (null === bussers || bussers === '' || bussers === undefined)) {
                    document = { $set: {'tables.$.servers': servers},'$unset':{'tables.$.bussers': 1}};
                } else if ((null === servers || servers === '' || servers === undefined) && bussers) {
                    document = { $unset: {'tables.$.servers': 1 },'$set':{'tables.$.bussers': bussers}};
                } else if ((null === servers || servers === '' || servers === undefined) && (null === bussers || bussers === '' || bussers === undefined)) {
                    document = { $unset: {'tables.$.servers': 1,'tables.$.bussers': 1}};
                }
                _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        if (index >= tables.length - 1) {
                            apiresult = {status: 204};
                            nextstep();
                        }
                    }
                });
            });
        }
    ], function (error) {
        callback(error, apiresult);
    });
};

var GetTableAssignments = function (restaurantId, callback) {
    var _this = exports;
    var apiresult;
    async.series([
        function (nextstep) {
            var selector = {_id:restaurantId};
            var options = {};
            var helper = {collectionName: 'restaurant'};
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('the restaurant id is not exist: restaurantId', restaurantId));
                } else {
                    nextstep();
                }
            });
        },
        function (nextstep) {
            var selector = {_id:restaurantId};
            var helper = {collectionName: 'restaurant'};

            var options = {fields:{ 'tables.servers' : 1,'tables.bussers' : 1,'tables.tableId':1, '_id': 0}};
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    nextstep(error);
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('this restaurant has no tables', restaurantId));
                } else {
                    apiresult = {status: 200, data: result[0]};
                    callback(null,apiresult);
                }
            });
        }
    ], function (error) {
        callback(error, apiresult);
    });
};

var SetOrderTips = function (orderId, tipsBody, callback) {
    var _this = exports;

    _this.logger.info('%j', {
        function:'DEBUG-INFO: Order.SetOrderTips received parameters',
        orderId: orderId,
        tipsBody: tipsBody
    });

    var apiresult, shouldUpdateV2Bill = false;

    var options = {}, selector = {}, document = {}, helper = {};

    var order = {};

    async.waterfall([
        // step-1: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.SetOrderTips step-1 doFindOrder', orderId: orderId});

            selector = {'$and':[{_id: orderId}, {'$or':[{archived: false}, {archived: null}]}]};
            options = {};
            helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};
            _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.SetOrderTips step-1 doFindOrder returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                } else if (result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.SetOrderTips step-1 doFindOrder returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('_id', orderId));
                } else {
                    order = result[0];

                    var status = order.status;
                    if (status !== 'INPROCESS' && status !== 'SUBMITTED') {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.SetOrderTips step-1 doFindOrder returns an error, order is paid or closed'});
                        nextstep(new _this.httpExceptions.InvalidParameterException('status', 'status not in INPROCESS or SUBMITTED! now order status is'+status));
                    } else {
                        if (order.rewards &&  order.payment) {
                            shouldUpdateV2Bill = true;
                        };

                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.SetOrderTips step-1 doFindOrder returns right'});
                        nextstep();
                    }
                }
            });
        },
        // step-2: doUpdateTip
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.SetOrderTips step-2 doFindOrder', tipsBody: tipsBody});

            selector = {_id:orderId};

            if (shouldUpdateV2Bill) {
                order.payment.tip = tipsBody.tip;

                order.rewards.pre_calculated_tip = order.payment.tip;

                order.payment.grand_total_to_pay
                    = order.payment.sub_total_after_discounts
                    + order.payment.total_tax
                    + order.payment.tip;

                order.payment.grand_total_to_pay = Math.round( order.payment.grand_total_to_pay * 100) /100;
                order.payment.grand_total_to_pay          = parseFloat(Number(order.payment.grand_total_to_pay).toFixed(2));

                var payment = _this.backendHelpers.jsonHelper().cloneDocument(_this.orderCalculate.calculateTransactions(order, _this.enums.PaymentTypeOther, _this.config.other_servers));
                var paymentInformationForAlipay = _this.backendHelpers.jsonHelper().cloneDocument(_this.orderCalculate.calculateForAlipay(order, _this.config.other_servers));

                order.payment = payment;

                if (order.restaurant.commissionRatePercent) {
                    let orderCommission = _this.orderCalculateV2.calculateCommissionRatePercent(order);
                    order.payment = orderCommission.payment;
                }

                document = {$set: {
                    'payment': order.payment,
                    'payment_information_for_alipay': paymentInformationForAlipay,
                    'before_round_data': order.before_round_data
                }};
            } else {
                document = {$set: tipsBody};
            };

            options = {};
            helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};
            _this.restaurantDataAPI.update(selector, document, options, helper, function (error) {
                if (error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.SetOrderTips step-2 doUpdateTip returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('update dining-orders', 'error'));
                } else {
                    if (shouldUpdateV2Bill) {
                        apiresult = {status: 201, data: {total_amount: payment.total_amount_to_pay_with_bd_and_gd}};
                    } else {
                        apiresult = {status: 201, data: {total_amount: 0}};
                    }

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetOrderTips step-2 doUpdateTip returns right'});
                    nextstep();
                }
            });
        }

    ],function (error) {
        if (error) {
            _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.SetOrderTips step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetOrderTips step-(right) callback'});
        }
        callback(error, apiresult);
    });
}

var BatchUpdateUserInfo = function (userId, userName, avatarPath, callback) {
    var _this = exports;
    var criteria,helper,options,document;
    var apiResult;
    async.series([
        function (nextstep) {
            criteria = {'user.user_id':userId};
            helper = {collectionName:_this.enums.CollectionName.DINING_ORDERS};
            document = {$set:{'user.user_name':userName,'user.avatar_path':avatarPath}};
            options = {multi:true};
            _this.restaurantDataAPI.update(criteria,document,options,helper,function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    nextstep();
                }
            })
        },
        function (nextstep) {
            criteria = {'servers.userId':userId};
            helper = {collectionName:_this.enums.CollectionName.DINING_ORDERS};
            document = {$set:{'servers.$':{userId:userId,userName:userName,avatarPath:avatarPath}}};
            options = {multi:true};
            _this.restaurantDataAPI.update(criteria,document,options,helper,function (error) {
                if (error) {
                    nextstep(error);
                } else {;
                    nextstep();
                }
            })
        },
        function (nextstep) {
            criteria = {userId:userId};
            helper = {collectionName:'comment'};
            document = {$set:{userName:userName,avatarPath:avatarPath}};
            options = {multi:true};
            _this.restaurantDataAPI.update(criteria,document,options,helper,function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    nextstep();
                }
            })
        },
        function (nextstep) {
            criteria = {userId:userId};
            helper = {collectionName:'newsfeed'};
            document = {$set:{userName:userName,avatarPath:avatarPath}};
            options = {multi:true};
            _this.restaurantDataAPI.update(criteria,document,options,helper,function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    nextstep();
                }
            })
        },
        function (nextstep) {
            criteria = {'followees.userId':userId};
            helper = {collectionName:'newsfeed'};
            document = {$set:{'followees.$':{userId:userId,userName:userName,avatarPath:avatarPath}}};
            options = {multi:true};
            _this.restaurantDataAPI.update(criteria,document,options,helper,function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    nextstep();
                }
            })
        },
        function (nextstep) {
            criteria = {'followers.userId':userId};
            helper = {collectionName:'newsfeed'};
            document = {$set:{'followers.$':{userId:userId,userName:userName,avatarPath:avatarPath}}};
            options = {multi:true};
            _this.restaurantDataAPI.update(criteria,document,options,helper,function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    apiResult = {status:204}
                    nextstep();
                }
            })
        }
    ],function (error) {
        callback(error,apiResult);
    })
}

var GetRestaurantNameById = function (restaurantId, otherServers, callback) {
    var _this = exports;
    var selector = {_id: restaurantId};
    var options = {};
    var helper = {collectionName: 'restaurant'};
    _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
        if (error) {
            callback(null,{});
        } else {
            if (result.length === 0 ||  result === null || result === undefined) {
                callback(null,{});
            } else {
                callback(null,result[0]);
            }
        }
    })
};

var GetOrdersByUserIdV2 = function (userId, restaurantId, tableId, isServer, status, from, pageSize, allIncluded, includeEmptyTable, beginDatetime, endDatetime, callback) {
    var _this = exports;
    if (allIncluded === null) {
        allIncluded = 'TRUE';
    }
    var fields;
    var backBody=[],orderIds=[];
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order.GetOrdersByUserIdV2 received parameters: ',
        userId:userId,
        restaurantId: restaurantId,
        tableId: tableId,
        isServer: isServer,
        status:status,
        allIncluded:allIncluded,
        includeEmptyTable:includeEmptyTable,
        beginDatetime:beginDatetime,
        endDatetime:endDatetime,
        from:from,
        pageSize:pageSize
    });
    async.waterfall([
        function (callback) {

            if (allIncluded=== 'FALSE') {
                fields={tableId:1, status:1 ,restaurantId:1 , customers:1, 'order_items.order_item_id': 1, 'order_items.chit_printed': 1, receipt_printed: 1, _id: 1};
            } else {
                fields={};
            }
            callback();
        },
        function (callback) {
            var selector;
            var options = {};
            var helper;
            if (isServer === 'TRUE') {
                if (restaurantId === null || restaurantId === '') {
                    callback(new _this.httpExceptions.InvalidParameterException('restaurantId', 'If is_server is TRUE, then restaurantId restaurantId is required'), null);
                } else {
                    selector = {'$and':[{restaurantId: restaurantId}, {'$or': [{archived: false}, {archived: null}]}]};
                    helper = {
                        collectionName: _this.enums.CollectionName.DINING_ORDERS,
                        callerScript: 'File: order.js; Method: GetOrdersByUserIdV2()',
                        apiVersion: 2
                    };
                    _this.logger.info('%j', {
                        function: 'DEBUG-INFO: Order.GetOrdersByUserIdV2 before query: ',
                        selector: selector,
                        options: options,
                        helper: helper
                    });
                    _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                        if (error) {
                            callback(error);
                        } else if (result === null || result === '' || result.length ===0) {
                            callback(new _this.httpExceptions.ResourceNotFoundException('restaurantId', restaurantId), null);
                        } else {
                            var ids = [];
                            if (result && result.length > 0) {
                                for (var i = 0; i < result.length; i++) {
                                    if (result[i]._id !== null && result[i]._id !== '' && result[i]._id !== undefined) {
                                        ids.push(result[i]._id);
                                    }
                                }
                            }
                            callback(null, ids);
                        }
                    });
                }
            } else {
                selector = {'customers.user_id': userId};
                helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order.GetOrdersByUserIdV2 before query',
                    selector: selector,
                    options: options,
                    helper: helper
                });
                _this.restaurantDataAPI.find(selector,options,helper,function (error,result) {
                    if (error) {
                        callback(error);
                    } else if (result === null || result === '' || result.length ===0) {
                        callback(new _this.httpExceptions.ResourceNotFoundException('userId', userId), null);
                    } else {
                        var ids = [];
                        if (result && result.length > 0) {
                            for (var i = 0; i < result.length; i++) {
                                ids.push(result[i]._id);
                            }
                        }
                        callback(null, ids);
                    }
                });
            }
        },
        function (ids,callback) {
            var fliter = {};
            fliter._id = {$in: ids};
            if (restaurantId !== null && restaurantId !== '' && restaurantId !== undefined) {
                fliter.restaurantId = restaurantId;
            }
            if (tableId !== null && tableId !== '' && tableId !== undefined) {
                fliter.tableId = tableId;
            }
            if (status !== null && status !== '' && status !== undefined) {
                if (status === 'ACTIVE') {
                    fliter.status  = {'$in': [_this.enums.OrderStatus.INPROCESS,_this.enums.OrderStatus.SUBMITTED,_this.enums.OrderStatus.PAID]};
                } else {
                    fliter.status = status;
                }
            }
            if (beginDatetime) {
                var beginDate = _this.dataGenerationHelper.getValidUTCDate(beginDatetime);
                fliter.createDate = {$gte:beginDate}
            }
            if (endDatetime) {
                var endDate = _this.dataGenerationHelper.getValidUTCDate(endDatetime);
                fliter.createDate = {$gte:endDate}
            }
            if (beginDatetime && endDatetime) {
                var beginDate = _this.dataGenerationHelper.getValidUTCDate(beginDatetime);
                var endDate = _this.dataGenerationHelper.getValidUTCDate(endDatetime);
                fliter.createDate = {$gte:beginDate,$lte:endDate}
            }
            callback(null,fliter);
        },
        function (fliter,callback) {
            if (allIncluded === 'FALSE') {
                callback(null,fliter);
            } else {

                _this.orderCalculate.calculateOrdersByUserId(userId, fliter,  function (error, result) {
                    if (error) {
                        callback(error);
                    } else if (result === null) {
                        callback(new _this.httpExceptions.ResourceNotFoundException('userId', userId));
                    } else {
                        callback(null,fliter);
                    }
                });
            }

        },
        function (fliter, callback) {
            var selector = fliter;
            var options = {'fields': fields};
            _this.orderManager.pagingFunction(options, from, pageSize, 'GetOrdersByUserId');
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                callerScript: 'File: order.js; Method: GetOrdersByUserIdV2()',
                apiVersion: 2
            };
            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order.GetOrdersByUserIdV2 before query',
                selector: selector,
                options: options,
                helper: helper
            });
            _this.restaurantDataAPI.find(selector, options, helper,function (error, result) {
                if (error) {
                    callback(error, null);
                } else if (result[0] !== null && result[0] !== '') {
                    var j = 0;
                    if (includeEmptyTable === 'FALSE') {
                        for (var i = 0 ; i< result.length;i++) {
                            if (result[i].tableId !== null && result[i].tableId !== '' && result[i].tableId !== undefined ) {
                                backBody.push(result[i]);
                            }
                            j++;
                        }
                        if (j === result.length) {
                            callback(null, backBody);
                        }
                    } else {
                        backBody=result;
                        callback(null, backBody);
                    }
                } else {
                    callback(new _this.httpExceptions.ResourceNotFoundException('userId', userId), null);
                }
            });
        },
        function (backBody,callback) {
            orderIds = [];
            for (var i=0; i<backBody.length; i++) {
                orderIds.push(backBody[i]._id);
            }
            callback();
        },
        function (callback) {

            for (var i=0; i<backBody.length; i++) {
                if (allIncluded !== 'FALSE') {
                    backBody[i].ownerId = backBody[i].user ? backBody[i].user.user_id : '';
                    backBody[i].lastmodified =  backBody[i].lastmodified;
                }
                backBody[i] = switchResponseFormat(backBody[i]);
            }

            callback(null,{status: 200, data: backBody});

        }
    ], function (error, result) {
        callback(error, result);
    });
};

var switchResponseFormat = function (backBody) {
    if (typeof backBody.tableId !== 'undefined') {
        backBody.table_id = backBody.tableId;
        delete backBody.tableId;
    }
    if (typeof backBody.restaurantId !== 'undefined') {
        backBody.restaurant_id = backBody.restaurantId;
        delete backBody.restaurantId;
    }
    if (backBody.restaurant_logo) {
        if (typeof backBody.restaurant_logo.filename !== 'undefined') {
            backBody.restaurant_logo.file_name = backBody.restaurant_logo.filename;
            delete backBody.restaurant_logo.filename;
        }
    }
    if (typeof backBody.isServer !== 'undefined') {
        backBody.is_server = backBody.isServer;
        delete backBody.isServer;
    }
    if (typeof backBody.lastmodified !== 'undefined') {
        backBody.last_modified = backBody.lastmodified;
        delete backBody.lastmodified;
    }
    if (typeof backBody.createDate !== 'undefined') {
        backBody.create_date = backBody.createDate;
        delete backBody.createDate;
    }
    if (typeof backBody.lastUpdateTime !== 'undefined') {
        backBody.last_update_time = backBody.lastUpdateTime;
        delete backBody.lastUpdateTime;
    }
    if (typeof backBody.createTime !== 'undefined') {
        backBody.create_time = backBody.createTime;
        delete backBody.createTime;
    }
    if (typeof backBody.updateTime !== 'undefined') {
        backBody.update_time = backBody.updateTime;
        delete backBody.updateTime;
    }
    if (backBody.orderItems && backBody.orderItems.length>0) {
        for (var i=0;i<backBody.orderItems.length;i++) {
            var orderItem = backBody.orderItems[i];
            if (typeof orderItem.itemId !== 'undefined') {
                orderItem.item_id = orderItem.itemId;
                delete orderItem.itemId;
            }
            if (typeof orderItem.itemName !== 'undefined') {
                orderItem.item_name = orderItem.itemName;
                delete orderItem.itemName;
            }
            if (orderItem.price && typeof orderItem.price.currencyCode !== 'undefined') {
                orderItem.price.currency_code = orderItem.price.currencyCode;
                delete orderItem.price.currencyCode;
            }
            if (orderItem.childrenItems && orderItem.childrenItems.length>0) {
                orderItem.children_items = orderItem.childrenItems;
                delete orderItem.childrenItems;
                for (var j = 0;j<orderItem.children_items.length;j++) {
                    var childrenItem = orderItem.children_items[j];
                    if (typeof childrenItem.childItemId !== 'undefined') {
                        childrenItem.child_item_id = childrenItem.childItemId;
                        delete childrenItem.childItemId;
                    }
                    if (typeof childrenItem.childItemName !== 'undefined') {
                        childrenItem.child_item_name = childrenItem.childItemName;
                        delete childrenItem.childItemName;
                    }
                    if (typeof childrenItem.priceDiff !== 'undefined') {
                        childrenItem.price_diff = childrenItem.priceDiff;
                        delete childrenItem.priceDiff;
                        if (typeof childrenItem.price_diff.currencyCode !== 'undefined') {
                            childrenItem.price_diff.currency_code = childrenItem.price_diff.currencyCode;
                            delete childrenItem.price_diff.currencyCode
                        }
                    }
                }
            }
        }
    }
    if (backBody.subTotal) {
        backBody.sub_total = backBody.subTotal;
        if (typeof backBody.sub_total.currencyCode !== 'undefined') {
            backBody.sub_total.currency_code = backBody.sub_total.currencyCode;
            delete backBody.sub_total.currencyCode;
        }
        delete backBody.subTotal;
    }
    if (backBody.total && typeof backBody.total.currencyCode !== 'undefined') {
        backBody.total.currency_code = backBody.total.currencyCode;
        delete backBody.total.currencyCode;
    }
    if (backBody.totalTax) {
        backBody.total_tax = backBody.totalTax;
        if (typeof backBody.total_tax.currencyCode !== 'undefined') {
            backBody.total_tax.currency_code = backBody.total_tax.currencyCode;
            delete backBody.total_tax.currencyCode;
        }
        delete backBody.totalTax;
    }
    if (backBody.totalTax_1) {
        backBody.total_tax_1 = backBody.totalTax_1;
        if (typeof backBody.total_tax_1.currencyCode !== 'undefined') {
            backBody.total_tax_1.currency_code = backBody.total_tax_1.currencyCode;
            delete backBody.total_tax_1.currencyCode;
        }
        delete backBody.totalTax_1;
    }
    if (backBody.totalTax_2) {
        backBody.total_tax_2 = backBody.totalTax_2;
        if (typeof backBody.total_tax_2.currencyCode !== 'undefined') {
            backBody.total_tax_2.currency_code = backBody.total_tax_2.currencyCode;
            delete backBody.total_tax_2.currencyCode;
        }
        delete backBody.totalTax_2;
    }
    if (backBody.serviceCharge) {
        backBody.service_charge = backBody.serviceCharge;
        if (typeof backBody.service_charge.currencyCode !== 'undefined') {
            backBody.service_charge.currency_code = backBody.service_charge.currencyCode;
            delete backBody.service_charge.currencyCode;
        }
        delete backBody.serviceCharge;
    }
    if (backBody.discount && typeof backBody.discount.currencyCode !== 'undefined') {
        backBody.discount.currency_code = backBody.discount.currencyCode;
        delete backBody.discount.currencyCode;
    }
    if (backBody.billStatus) {
        backBody.bill_status = backBody.billStatus;
        delete backBody.billStatus;
        if (typeof backBody.bill_status.userId !== 'undefined') {
            backBody.bill_status.user_id = backBody.bill_status.userId;
            delete backBody.bill_status.userId;
        }
        if (typeof backBody.bill_status.userName !== 'undefined') {
            backBody.bill_status.user_name = backBody.bill_status.userName;
            delete backBody.bill_status.userName;
        }

    }
    if (typeof backBody.ownerId !== 'undefined') {
        backBody.owner_id = backBody.ownerId;
        delete backBody.ownerId
    }
    if (typeof backBody.batchNo !== 'undefined') {
        backBody.batch_no = backBody.batchNo;
        delete backBody.batchNo
    }
    if (backBody.customers && backBody.customers.length>0) {
        for (var i = 0;i< backBody.customers.length; i++) {
            var customer = backBody.customers[i];
            if (typeof customer.userId !== 'undefined') {
                customer.user_id = customer.userId;
                delete customer.userId;
            }
            if (typeof customer.userName !== 'undefined') {
                customer.user_name = customer.userName;
                delete customer.userName;
            }
            if (typeof customer.avatarPath !== 'undefined') {
                customer.avatar_path = customer.avatarPath;
                delete customer.avatarPath;
            }
        }
    }
    if (backBody.servers && backBody.servers.length>0) {
        for (var i = 0;i< backBody.servers.length; i++) {
            var server = backBody.servers[i];
            if (typeof server.userId !== 'undefined') {
                server.user_id = server.userId;
                delete server.userId;
            }
            if (typeof server.userName !== 'undefined') {
                server.user_name = server.userName;
                delete server.userName;
            }
            if (typeof server.avatarPath !== 'undefined') {
                server.avatar_path = server.avatarPath;
                delete server.avatarPath;
            }
        }
    }
    if (typeof backBody.firstTimeDiscount !== 'undefined') {
        backBody.first_time_discount = backBody.firstTimeDiscount;
        delete backBody.firstTimeDiscount;
    }
    if (typeof backBody.firstTimeDiscountValue !== 'undefined') {
        backBody.first_time_discount_value = backBody.firstTimeDiscountValue;
        delete backBody.firstTimeDiscountValue;
    }
    if (typeof backBody.myBlueDollars !== 'undefined') {
        backBody.my_blue_dollars = backBody.myBlueDollars;
        delete backBody.myBlueDollars;
    }
    if (typeof backBody.myGoldDollars !== 'undefined') {
        backBody.my_gold_dollars = backBody.myGoldDollars;
        delete backBody.myGoldDollars;
    }
    if (typeof backBody.closeTime !== 'undefined') {
        backBody.close_time = backBody.closeTime;
        delete backBody.closeTime;
    }
    if (typeof backBody.submitTime !== 'undefined') {
        backBody.submit_time = backBody.submitTime;
        delete backBody.submitTime;
    }
    return backBody;
}

var UnlockBillByOrderId = function(orderId, userId, otherServers,headerToken, isServer,callback) {
    var _this = exports;
    var lockedUserId;

    async.waterfall([

        //-- Step-1: doCheckOrder
        function (nextstep) {

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UnlockBillByOrderId step-1 doCheckOrder', orderId: orderId, userId: userId });

            var selector = {_id: orderId};
            var options = { 'fields': {'_id':1, billStatus: 1, bill_status: 1, status: 1} };
            var helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: UnlockBillByOrderId()' };

            _this.restaurantDataAPI.find(selector, options, helper, function(error,result) {
                if (error) {

                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.UnlockBillByOrderId step-1 doCheckOrder returns an error' });
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UnlockBillByOrderId step-1 doCheckOrder returns empty' });
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('_id', orderId));

                } else {

                    if (((result[0].billStatus && result[0].billStatus.status === _this.enums.BillStatus.PAID) || result[0].status === _this.enums.BillStatus.PAID) ||
                        ((result[0].bill_status && result[0].bill_status.status === _this.enums.BillStatus.PAID) || result[0].status === _this.enums.BillStatus.PAID)) {

                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UnlockBillByOrderId step-1 doCheckOrder: order has been paid and can not be unlocked' });
                        nextstep (new _this.httpExceptions.InvalidParameterException('orderId', 'order has been paid and can not be unlocked'));

                    }
                    else if ((result[0].billStatus && result[0].billStatus.status === _this.enums.BillStatus.LOCKED) ||
                        (result[0].bill_status && result[0].bill_status.status === _this.enums.BillStatus.LOCKED)) {

                        if (result[0].billStatus && result[0].billStatus.userId)    { lockedUserId = result[0].billStatus.userId; }
                        if (result[0].bill_status && result[0].bill_status.user_id) { lockedUserId = result[0].bill_status.user_id; }

                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UnlockBillByOrderId step-1 doCheckOrder: bill is locked by userId ' + lockedUserId });

                        if ((result[0].billStatus.lock_time && result[0].billStatus.lock_duration_mins) ||
                            (result[0].bill_status.lock_time && result[0].bill_status.lock_duration_mins)) {

                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UnlockBillByOrderId step-1 doCheckOrder: `lock_duration_mins` is still valid, only lockedUserId can unlock the bill',
                                isServer:isServer,lockedUserId:lockedUserId,userId:userId});
                            if (lockedUserId === userId || isServer === true) {
                                nextstep();
                            } else {
                                nextstep(new _this.httpExceptions.InvalidParameterException('userId', 'this user ' + userId + ' cannot unlock the bill'));
                            }
                        } else {
                            nextstep();
                        };
                    } else {

                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UnlockBillByOrderId step-1 doCheckOrder: this order is not locked' });
                        nextstep(new _this.httpExceptions.InvalidParameterException('orderId', 'order is not currently locked'));
                    }
                }
            });
        },

        //-- Step-2: doUnlockBill
        function (nextstep) {
            var criteria = { _id: orderId };
            var document = {$unset: {billStatus: 1, bill_status: 1, tip: 1}};
            var options = {};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                callerScript: 'File: order.js; Method: UnlockBillByOrderId()',
                apiVersion: 1
            };

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UnlockBillByOrderId step-2 doUnlockBill ', lockedUserId: lockedUserId, criteria: criteria, document: document });
            _this.restaurantDataAPI.update(criteria, document, options, helper, function(error, result) {
                if (error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.UnlockBillByOrderId step-2 doUnlockBill returns an error', error: error });
                    nextstep(error);
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UnlockBillByOrderId step-2 doUnlockBill returns result', result: result });
                    nextstep();
                }
            });
        },

        //-- Step-3: doUnlockBlueDollarViaRewardsAPI
        function (nextstep) {

            var postData={};
            postData.host = otherServers.reward.server_url;
            postData.port = otherServers.reward.server_port;
            postData.path = '/v1/orders/'+orderId+'/lockBlueDollars';
            postData.method = 'PUT';

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UnlockBillByOrderId step-3 doUnlockBlueDollarViaRewardsAPI ', lockedUserId: lockedUserId, postData: postData });
            _this.orderManager.sendToReward(postData,headerToken, function (error, result) {
                if (error) {

                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.UnlockBillByOrderId step-3 doUnlockBlueDollarViaRewardsAPI returns an error', error: error });
                    nextstep(error);
                } else {

                    if (result.hasOwnProperty('errorMsg')) {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UnlockBillByOrderId step-3 doUnlockBlueDollarViaRewardsAPI returns an error', result: result });
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UnlockBillByOrderId step-3 doUnlockBlueDollarViaRewardsAPI returns result', result: result });
                    }
                    callback(null, { status: 204 });
                }

            });
        }

    ], function (error) {
        callback(error);
    });
};

var SetSettlement = function (orderId, callback) {
    var _this = exports;
    var apiresult;

    var options = {};
    var selector = {};
    var document = {};
    var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

    async.series([
        function (nextstep) {
            selector = {'$and':[{_id : orderId}, {status : _this.enums.OrderStatus.CLOSED}]};
            _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('_id', orderId));
                } else {
                    var order = result[0];

                    if (order.payment && !order.payment.is_transaction_completed) {
                        nextstep(new _this.httpExceptions.InvalidParameterException('orderId', 'This order (' + orderId + ') has transactions that have not been completed'));
                    } else if (order.payment && order.payment.is_transaction_settled) {
                        nextstep(new _this.httpExceptions.InvalidParameterException('orderId', 'This order (' + orderId + ') has already been settled'));
                    }

                    nextstep();
                }
            });
        },
        function (nextstep) {
            selector = {_id : orderId};
            //-- FBE-1171: [Orders] Enhance SetSettlement API to update 'payment.is_transaction_settled' to TRUE
            document = {$set : {'payment.is_transaction_settled': true, settlement_time : _this.dataGenerationHelper.getValidUTCDate()}};
            _this.restaurantDataAPI.update(selector, document, options, helper, function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    apiresult = {status: 200, data : "settlement success"};
                    nextstep();
                }
            });
        }

    ],function (error) {
        callback(error, apiresult);
    });
}

var GetResumeOrders = function (userId, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetResumeOrders received arguments:',
        userId: userId
    });

    var apiresult = '';

    var options = {};
    var selector = {};
    var document = {};
    var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

    async.series([
        // step-1: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetResumeOrders step-1 doFindOrder'});

            selector = {'$or': [{'customers.userId': userId }, {'customers.user_id': userId}], status: {$in: [_this.enums.OrderStatus.INPROCESS, _this.enums.OrderStatus.SUBMITTED]}};
            _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
                if (error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetResumeOrders step-1 doFindOrder returns an error', error: error});
                    nextstep(new _this.httpExceptions.InvalidParameterException('FIND_ORDER_ERROR','error'));
                } else if (result === null || result === '' || result.length === 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetResumeOrders step-1 doFindOrder returns empty'});
                    apiresult = {status: 200, data : []};
                    nextstep();
                } else {
                    var resumeOrders = [];

                    var orders = result;

                    for (var i=0; i<orders.length; i++) {
                        var order = orders[i];

                        var resumeOrder = {};
                        resumeOrder._id = order._id;
                        resumeOrder.restaurantId = order.restaurantId;
                        resumeOrder.tableId = order.tableId;
                        resumeOrder.orderItems = order.orderItems;

                        resumeOrders.push(resumeOrder);
                    }

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetResumeOrders step-1 doFindOrder returns right'});
                    apiresult = {status: 200, data : resumeOrders};
                    nextstep();
                }
            });
        }

    ],function (error) {
        if (error) {
            _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetResumeOrders step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetResumeOrders step-(right) callback'});
        }
        callback(error, apiresult);
    });
}

var GetTransactions = function (restaurantName, orderId, startTime, endTime, from, pageSize, callback) {
    var _this = exports;
    var apiresult;
    var bodies = [];
    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetTransactions received arguments:',
        restaurantName: restaurantName,
        orderId: orderId,
        startTime: startTime,
        endTime: endTime,
        from: from,
        pageSize: pageSize
    });

    var apiResult = '';

    var orders = [];

    async.series([
        // step-1: doFindOrderTransactions
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetTransactions step-1 doFindOrderTransactions'});

            var selector = {};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            // selector
            selector['bill_status.status'] = _this.enums.BillStatus.PAID;
            selector['bill_status.is_online_payment'] = true;
            selector['payment.is_transaction_settled'] = false;
            selector['settlement.status'] = {$nin: ['SUCCESS_SETTLED', 'IN_SETTLED']};

            if (isNotNull(restaurantName)) {
                selector['restaurant.restaurant_name'] = new RegExp(restaurantName);
            }

            if (isNotNull(startTime) && isNotNull(endTime)) {
                selector.close_time = {$gte:_this.dataGenerationHelper.getValidUTCDate(startTime), $lte:_this.dataGenerationHelper.getValidUTCDate(endTime)};
            } else if (isNotNull(startTime) && !isNotNull(endTime)) {
                selector.close_time = {$gte:_this.dataGenerationHelper.getValidUTCDate(startTime)};
            } else if (!isNotNull(startTime) && isNotNull(endTime)) {
                selector.close_time = {$lte:_this.dataGenerationHelper.getValidUTCDate(endTime)};
            }

            if (isNotNull(orderId)) {
                selector._id = orderId;
            }

            // options
            options.fields = {'_id':1, restaurant: 1, order_no: 1, payment: 1, status: 1, close_time: 1};
            options.sort = {'close_time': -1};

            _this.orderManager.pagingFunction(options, from, pageSize);

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetTransactions step-1 doFindOrderTransactions returns an error'});
                    nextstep(new _this.httpExceptions.DataConflictedException('find dinning-orders', 'error'));
                } else if (result == null || result == undefined || result.length == 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetTransactions step-1 doFindOrderTransactions returns empty'});
                    nextstep();
                } else {
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetTransactions step-1 doFindOrderTransactions returns right'});

                    orders = result;

                    nextstep();
                }
            });
        },
        // step-2: doPopulateOrders
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetTransactions step-2 doPopulateOrders'});

            var transactions = [];

            for (var i=0; i<orders.length; i++) {
                var order = orders[i];

                var transaction = {};
                transaction.order_id = order._id;
                if (order.order_no) {
                    transaction.order_no = order.order_no;
                }
                transaction.restaurant_id = order.restaurant.restaurant_id;
                transaction.restaurant_name = order.restaurant.restaurant_name;
                transaction.close_time = order.close_time;
                transaction.total_amount = order.payment.sub_total_before_first_visit_savings;
                transaction.first_time_discount_value = Number(order.payment.first_visit_customer_savings.toFixed(2));
                transaction.blue_dollar_amount_paid = order.payment.blue_dollar_amount_paid;
                transaction.gold_dollar_amount_paid = order.payment.gold_dollar_amount_paid;
                transaction.blue_dollar_bought_from_consumer = order.payment.blue_dollar_bought_from_consumer;
                transaction.blue_dollar_bought_from_restaurant = order.payment.blue_dollar_bought_from_restaurant;
                transaction.blue_dollar_bought_from_fandine = order.payment.blue_dollar_bought_from_fandine;
                transaction.total_amount_to_pay_with_bd_and_gd = order.payment.total_amount_to_pay_with_bd_and_gd;
                transaction.ap = order.payment.ap_to_restaurant_future_settlement;

                transactions.push(transaction);
            }

            apiResult = {status: 200, data: transactions};

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetTransactions step-2 doPopulateOrders returns right'});

            nextstep();
        }

    ], function (error) {
        if (error) {
            _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetTransactions step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetTransactions step-(right) callback'});
        }
        callback(error, apiResult);
    })

};

//-- FBE-963: [Orders] New v2 API to GET Bill by OrderID
var GetBillByOrderId = function(reqParams, callback) {
    var _this = exports;

    var orderId =  reqParams.orderId,
        userId =  reqParams.userId,
        isServer =  reqParams.isServer,
        useBlueDollars =  reqParams.useBlueDollars,
        buyBlueDollars =  reqParams.buyBlueDollars,
        useGoldDollars =  reqParams.useGoldDollars,
        isOnlinePayment =  reqParams.isOnlinePayment,
        locale = reqParams.locale,
        headerToken = reqParams.headerToken,
        otherServers =  reqParams.otherServers,
        defaultTip = reqParams.defaultTip,// default false, other true

    //-- FBE-1734: Deprecate GET Bill v1 and redirect the call to GET Bill v2; parse GET Bill v2 Response for v1
        isResponseForV1 = reqParams.isResponseForV1 || false,
        isResponseForSimplifiedV2 = reqParams.isResponseForSimplifiedV2 || false,

    //-- This `skipBillStatusCheck` is only temporary until we deprecate GET Bill v1
    //-- FBE-1151: [Order] Add a customized call to GET Bill v2 from GET Bill v1 for Stripe Payment
        skipBillStatusCheck = reqParams.skipBillStatusCheck || false;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId received arguments:', reqParams: reqParams });

    var isLocked = false, minimumBlueDollarToBuy;

    if (isOnlinePayment) {
        minimumBlueDollarToBuy = 0;
    }

    var country = _this.config.other_servers.country;
    if (!country || (_this.config.other_servers.region.north_america.indexOf(country) >-1)) {
        country = _this.enums.RegionCode.NA;
    } else {
        country = _this.enums.RegionCode.CHINA;
    }

    async.waterfall([
        //-- Step-1: doCheckOrder; make sure this orderId has orderItems
        function (nextstep) {
            var selector = {_id: orderId,
                'orderItems.order_item_id': {$exists: true},
                'orderItems.price.amount': {$gt: 0}
            };
            var options = {};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                callerScript: 'File: order.js; Method: GetBillByOrderId()',
                apiVersion: isResponseForV1? 1:2
            };

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-1 doCheckOrder', selector: selector, helper: helper });

            _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
                if (error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetBillByOrderId step-1 doCheckOrder returns an error', error: error });
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-1 doCheckOrder returns empty' });
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('This order_id has no menu items with price greater than zero', orderId), null);
                } else {

                    var order = result[0];

                    userId = order.user.user_id;
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-1 doCheckOrder returns result', order: order });

                    nextstep(null, order);
                }
            });
        },

        //-- step-2: doFindIsOnlinePaymentSupport
        function (order, nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetBillByOrderId step-2 doFindIsOnlinePaymentSupport', restaurant_id: order.restaurant.restaurant_id});

            var selector = {_id: order.restaurant.restaurant_id};
            var options = {fields: {isOnlinePayment: 1,cannot_use_bluedollar:1,has_no_discount:1}};
            var helper = {collectionName: _this.enums.CollectionName.RESTAURANT};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetBillByOrderId step-2 doFindIsOnlinePaymentSupport returns an error', error: error });
                    nextstep(new _this.httpExceptions.DataConflictedException('find restaurant', 'error'), null);
                } else if (result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetBillByOrderId step-2 doFindIsOnlinePaymentSupport returns empty' });
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('restaurant_id', order.restaurant.restaurant_id), null);
                } else {
                    var restaurant = result[0];

                    order.is_online_payment_supported = restaurant.isOnlinePayment ? true : false;

                    order.restaurant.cannot_use_bluedollar = restaurant.cannot_use_bluedollar ? true : false;
                    order.restaurant.has_no_discount = restaurant.has_no_discount ? true : false;

                    if(order.restaurant.cannot_use_bluedollar){
                        useBlueDollars = false;
                        buyBlueDollars = false;
                    }
                    if(order.restaurant.has_no_discount) {
                        if ( order.restaurant.discounts && order.restaurant.discounts.length > 0) {
                            for (var i = 0; i < order.restaurant.discounts.length; i++) {
                                order.restaurant.discounts[i].value = 0;
                            }
                        }else{
                            order.restaurant.discounts = [{
                                discount_type : 'PERCENT_OFF',
                                value : 0,
                                name : 'FIRST_TIME_VISIT'
                            }];
                        }
                    }

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-2 doFindIsOnlinePaymentSupport returns result', order: order });
                    nextstep(null, order);
                }
            });
        },

        //-- Step-3: doCheckIfNeedToUnlockBill
        function (order, nextstep) {

            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order.GetBillByOrderId step-3 doCheckIfNeedToUnlockBill',
                order: order,
                isLocked: isLocked
            });

            // do not unlock blue dollar once an order locked.
            if ((order.billStatus  && order.billStatus.status  && (order.billStatus.status  === _this.enums.BillStatus.PAID || order.billStatus.status === _this.enums.BillStatus.LOCKED)) ||
                (order.bill_status && order.bill_status.status && (order.bill_status.status === _this.enums.BillStatus.PAID || order.bill_status.status === _this.enums.BillStatus.LOCKED)) ) {

                //-- LOCKED or PAID orders need not go through calculations and other validations
                isLocked = true;
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-3 doCheckIfNeedToUnlockBill this order is already PAID or LOCKED' });

            }

            // canceled need directly return bill
            if (order.status === _this.enums.OrderStatus.CANCELLED) {
                isLocked = true;
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-3 doCheckIfNeedToUnlockBill this order is already CANCELLED' });
            }

            //-- Related to FBE-1151: [Order] Add a customized call to GET Bill v2 from GET Bill v1 for Stripe Payment
            //-- Removed by Jerry on 2015-09-07:
            //-- if (skipBillStatusCheck) { isLocked = false; }

            nextstep(null, order);

        },

        //-- Step-4: doSetBillStatus
        function (order, nextstep) {

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-4 doSetBillStatus', isLocked: isLocked });

            if (!isLocked) {

                /**
                 * NOTE:
                 *      We need to protect the order data by locking it
                 *      Attribute lock_duration_mins is temporarily in server configuration until finalized in Restaurant setting
                 */

                var billStatus = {
                    userId: userId,         // unlock bill need it
                    user_id:  userId,
                    status: _this.enums.BillStatus.LOCKED,
                    lock_time: _this.dataGenerationHelper.getValidUTCDate(),
                    lock_duration_mins: otherServers.lock_duration_mins,
                    is_online_payment : isOnlinePayment
                };

                // billStatus need to use at some API
                var billStatusV1 = {
                    userId :                    billStatus.userId,
                    //userName :                   '',
                    status :                    billStatus.status,
                    lock_time :                 billStatus.lock_time,
                    lock_duration_mins :       billStatus.lock_duration_mins,
                    //minimum_blueDollar_to_buy : null,
                    isOnlinePayment :          billStatus.is_online_payment
                }

                order.bill_status = billStatus;
                order.billStatus = billStatusV1;

            };

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-4 doSetBillStatus newly locked order', order: order });
            nextstep(null, order);

        },

        //-- Step-4.1: Check if first time to the restaurant.
        function(order,nextstep){
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-4 Check if first time to the restaurant', order: order });
            if(!isLocked){
                var isFirstTimeVisit = false;

                var selector_r = {
                    status: {$in: ['CLOSED', 'PAID']},
                    $and: [ {$or: [{'restaurant.restaurant_id': order.restaurant.restaurant_id}, {restaurantId: order.restaurant.restaurant_id} ]},
                        {$or: [{'user.user_id': userId}, {'orderItems.order_item_user_id': userId} ]},
                        {$or: [{'billStatus.status': 'PAID'}, {'bill_status.status': 'PAID'}]} ] };
                var options_r = {};
                var helper_r = { collectionName: 'dining-orders', callerScript: 'File: GetBillByOrderId;step-4.1  CheckIfFirstTime to the restaurant' };
                _this.restaurantDataAPI.find(selector_r, options_r, helper_r, function (error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        if (result.length > 0) {
                            isFirstTimeVisit = false;
                        } else {
                            isFirstTimeVisit = true;
                        }
                        //order.restaurant.is_first_time_visit_restaurant = isFirstTimeVisit;
                        order.bill_status.is_first_time_visit_restaurant = isFirstTimeVisit;
                        order.billStatus.isFirstTimeVisitRestaurant = isFirstTimeVisit;
                        nextstep(null, order);
                    }
                });

            }else{
                nextstep(null, order);
            }

        },
        //-- Step-4.2: Check if first time online payment in the restaurant.
        function(order,nextstep){
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-4 Check if first time online payment in the restaurant', order: order });
            if(!isLocked) {
                var isFirstTimeOnlinePayment = false;

                if (country == _this.enums.RegionCode.NA) {

                    order.bill_status.is_first_time_online_payment = isFirstTimeOnlinePayment;
                    order.billStatus.isFirstTimeOnlinePayment = isFirstTimeOnlinePayment;

                    nextstep(null, order);
                } else {
                    if(isOnlinePayment === true) {
                        var selector_r = {
                            status: {$in: ['CLOSED', 'PAID']},
                            $and: [{$or: [{'restaurant.restaurant_id': order.restaurant.restaurant_id}, {restaurantId: order.restaurant.restaurant_id}]},
                                {$or: [{'user.user_id': userId}, {'orderItems.order_item_user_id': userId}]},
                                {
                                    $or: [{
                                        'billStatus.status': 'PAID',
                                        'billStatus.isOnlinePayment': true
                                    }, {'bill_status.status': 'PAID', 'bill_status.is_online_payment': true}]
                                }]
                        };

                        var options_r = {};
                        var helper_r = {
                            collectionName: 'dining-orders',
                            callerScript: 'File: GetBillByOrderId;step-4.1  CheckIfFirstTime to the restaurant'
                        };
                        _this.restaurantDataAPI.find(selector_r, options_r, helper_r, function (error, result) {
                            if (error) {
                                nextstep(error);
                            } else {
                                if (result.length > 0) {
                                    isFirstTimeOnlinePayment = false;
                                } else {
                                    isFirstTimeOnlinePayment = true;
                                }
                                order.bill_status.is_first_time_online_payment = isFirstTimeOnlinePayment;
                                order.billStatus.isFirstTimeOnlinePayment = isFirstTimeOnlinePayment;
                                nextstep(null, order);
                            }
                        });
                    }else{
                        isFirstTimeOnlinePayment  =false;
                        order.bill_status.is_first_time_online_payment = isFirstTimeOnlinePayment;
                        order.billStatus.isFirstTimeOnlinePayment = isFirstTimeOnlinePayment;
                        nextstep(null, order);
                    }
                }

            }else{
                nextstep(null, order);
            }
        },
        //-- Step-5: doCalculateTheBill
        function (order, nextstep) {

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-5 doCalculateTheBill', isLocked: isLocked, orderId: orderId });

            if (!isLocked) {

                //-- Finalizing Bill schema v2
                order.table_id      = order.tableId;
                order.owner_id      = order.owner_id;
                order.batch_no      = order.batchNo || order.batch_no;
                order.status        = order.status;
                order.is_server     = order.isServer;
                order.payment_type  = _this.enums.PaymentTypeOther.OFFLINE;

                if (order.customers) {
                    //-- Append v2 formatted `customers`
                    var customers = _this.backendHelpers.jsonHelper().cloneDocument(order.customers);

                    // FF-2079:After Get bill, under the Patrons tab, "No-name" is displayed.
                    order.customers = [];
                    var diffrentCustomerMap = {};
                    for (var x = 0; x < customers.length; x++) {
                        var id = customers[x].userId;
                        var userName = customers[x].userName;
                        var avatarPath = customers[x].avatarPath

                        if (id == null || id == undefined || id == '') {
                            id = customers[x].user_id;
                        }
                        if (userName == null || userName == undefined || userName == '') {
                            userName = customers[x].user_name || '';
                        }
                        if (avatarPath == null || avatarPath == undefined || avatarPath == '') {
                            avatarPath = customers[x].avatar_path || '';
                        }

                        if (id == null || id == undefined || customers[x].userId == '') {
                            continue;
                        }

                        if (diffrentCustomerMap[id]) {
                            continue;
                        }

                        var customer = {
                            user_id: id,
                            user_name: userName,
                            avatar_path: avatarPath,
                            userId: id,
                            userName: userName,
                            avatarPath: avatarPath
                        }

                        diffrentCustomerMap[id] = customer;
                    };

                    for (var key in diffrentCustomerMap) {
                        var customer = diffrentCustomerMap[key];
                        order.customers.push(customer);
                    }
                } else {
                    order.remarks.push({order_id: order._id, message: _this.enums.Remarks.ORDER_ID_HAS_NO_OTHER_CUSTOMERS});
                };

                //-- Initialize `rewards` object before the calculation of total_tax and sub_totals
                order.rewards = {
                    first_time_discount_rate:               0,
                    first_time_discount_value:              0,
                    other_discount_value:                   0,
                    blue_dollars:                           0,
                    blue_dollar_user_owned:                 0,
                    blue_dollar_user_need_to_pay:           0,
                    blue_dollar_bought_from_consumers:      0,
                    blue_dollar_bought_from_fandine:        0,
                    blue_dollar_bought_from_restaurant:     0,
                    blue_dollar_bought_total:               0,
                    pre_calculated_tip:                     order.tip,
                    gold_dollars:                           0,
                    blue_dollar_discount:                   0,
                    blue_dollar_amount_to_buy:              0,
                    total_to_pay_with_blue_gold_dollars:    0
                };

                //-- Initialize `payment` object before calculation of total_tax and sub_totals
                order.payment = {
                    transaction_number: null
                    , is_transaction_completed: false
                    , is_transaction_settled: false
                    , sub_total_before_first_visit_savings: 0     //-- I: CalculateOrder()
                    , fandine_commission_rate_first_time:       otherServers.other_rates.fandine_commission_rate_first_time
                    , fandine_commission_rate_not_first_time:   otherServers.other_rates.fandine_commission_rate_not_first_time
                    , first_visit_customer_savings: 0           //-- J: doGetFirstTimeAndOtherDiscounts
                    , other_discounts: 0                        //--    doGetFirstTimeAndOtherDiscounts
                    , total_discounts: 0                        //-- doGetFirstTimeAndOtherDiscounts
                    , sub_total_after_discounts: 0              //-- K: sub_total_before_first_visit_savings - total_discounts
                    , discounts: []                             //-- CalculateOrder()
                    , taxes: []                                 //-- CalculateOrder()
                    , total_tax: 0                              //-- L: CalculateOrder()
                    , tip_rate: 0                               //-- CalculateOrder()
                    , tip: order.tip                            //-- M: CalculateOrder()
                    , grand_total_to_pay: 0                     //-- N: doGetFirstTimeAndOtherDiscounts: sub_total_after_discounts + total_tax + tip
                    , blue_dollar_amount_paid: 0                //-- O (A): doGetBlueAndGoldDollars
                    , gold_dollar_amount_paid: 0                //-- P (E): doGetBlueAndGoldDollars
                    , blue_dollar_bought_from_consumer: 0      //-- T (B): PostgreSQL
                    , blue_dollar_bought_from_fandine: 0        //-- U (C): PostgreSQL
                    , blue_dollar_bought_from_restaurant: 0     //-- V (D): PostgreSQL
                    , blue_dollar_savings: null                 //-- FBE-1648
                    , total_blue_dollar_bought: null            //-- R: T + U + V
                    , amount_to_buy_blue_dollar: null           //-- Q: R * 0.9
                    , total_amount_to_pay_with_bd_and_gd: null  //-- S: N + Q - R - O- P
                    , consumers_where_bd_bought_from: []        //-- NEEDED an ARRAY to display all consumers where this SUM derived from
                    , amount_to_pay_restaurant_offline: null    //-- W: K + L + M - O - P - R ; grand_total_to_pay - blue_dollar_amount_paid

                    , amount_to_pay_fandine_transaction: null   //-- X: (T + U + V) * .9
                    , online_payment_amount: null               //-- Y: X + W
                    , total_consumer_gd_to_restaurant_gd: null  //-- Z: P
                    , online_transaction_charge_rate: null      //-- H: (Y * 0.029 + 0.3) / Y (FBE-1047)
                    , total_consumer_bd_to_restaurant_bd: null  //-- AA: R + O
                    , credit_service_charge: null               //-- AB: Y * H
                    , split_payment_going_to_restaurant: null   //-- AC: W - AB + X * AB / Y
                    , split_payment_going_to_fandine: null      //-- AD: X - AB * X / Y
                    , fandine_general_bd_gain: null             //-- AE (FGBDG): Subtotal * 1%
                    , fandine_additional_bd_gain_first_visit: null //-- AF (FBDGFV): K * J
                    , blue_dollar_issued_to_fandine: null       //-- AG: AE + AF
                    , blue_dollar_paid_to_inviter: null         //-- ???
                    , ap_to_restaurant_future_settlement: null  //--    AI: (V * 0.8 + 0) * (1 - H) + P
                                                                //-- or AI: (V * 0.8 + W) * (1 - H) + P

                    , balance_change_restaurant_bd_account: null//-- AJ (BCRBD): D * -1
                    , payer_bd_account_balance_change: null     //-- AK: A * -1
                    , payer_gd_account_balance_change: null     //-- AL: E * -1
                    , fandine_revenue_selling_bd: null          //-- AM (FBDSR): C * 90% * (1-x%)
                    , fandine_revenue_bd_exchange_service: null //-- AN (FBDER): (B+D) * 10% * (1-x%)
                    , fandine_bd_account_balance_change: null   //-- AP (FBDABC): FGBDG (or AE) + FBDGFV (or AF) - C

                };

                order.payment_charge_body_for_stripe = {};

                order.payment_information_for_alipay = {
                    pre_settlement_amount: null,            //-- Money collected by Fandanfanli
                    split_amount_going_to_restaurant: null, //-- Money sent to restaurant
                    split_amount_going_to_fandine: null     //-- The 0.5% settlement fee collected by Alipay (see server.js
                };

                _this.orderCalculate.calculateOrder(order, otherServers, function (error, result) {
                    if (error) {
                        nextstep(error, result);
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-5 doCalculateTheBill calculated result', calculatedOrder: result });

                        nextstep(null, result);
                    }
                });

            } else {
                nextstep(null, order);
            };
        },

        //-- Step-6: doGetBlueAndGoldDollars
        function (calculatedOrder, nextstep) {

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-6: doGetBlueAndGoldDollars received arguments', isLocked: isLocked, calculatedOrder: calculatedOrder });

            /**
             * From REWARDS API
             *      A: backBody.blue_dollar_owned_by_user = results[j].my_blue_dollar;
             *      B: backBody.blue_dollar_purchased_from_other_user = results[j].other_user_blue_dollar;
             *      C: backBody.blue_dollar_purchased_from_fandine = results[j].fandine_blue_dollar;
             *      D: backBody.blue_dollar_purchased_from_restaurant = results[j].restaurant_blue_dollar;
             *      E: backBody.gold_dollar_owned_by_user = body.my_gold_dollar;
             *      F: backBody.remaining_amount = (backBody.total_amount - backBody.blue_dollar_owned_by_user
             *
             **/

            if (!isLocked) {

                if (!isNaN(defaultTip)) {
                    calculatedOrder.tip = defaultTip;
                }

                var sendParamsForCheckIfFirstTime = {
                    restaurantId: calculatedOrder.restaurant.restaurant_id,
                    userId: userId,
                    minimumBlueDollarToBuy: minimumBlueDollarToBuy,
                    orderId: orderId,
                    subTotal: calculatedOrder.payment.sub_total_after_discounts,
                    useBlueDollars: useBlueDollars,
                    buyBlueDollars: buyBlueDollars,
                    lockBlueDollars: true,
                    useGoldDollars: useGoldDollars,
                    flag: 'getBillV2',
                    otherServers: otherServers,
                    order: calculatedOrder
                };

                _this.orderManager.checkIfFirstTimeAndGetOthersV2(sendParamsForCheckIfFirstTime, headerToken,function (error, result) {
                    if (error) {
                        nextstep(new _this.httpExceptions.DataConflictedException('send to reward', error));
                    } else {

                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-6 orderManager.checkIfFirstTimeAndGetOthers() returns result',
                            sendParamsForCheckIfFirstTime: sendParamsForCheckIfFirstTime, result: result
                        });

                        //-- Note: rewards.pre_calculated_tip is a pre-calculated amount based from server.js  `tip_rate_north_america` or `tip_rate_china`
                        calculatedOrder.rewards = {
                            first_time_discount_rate:               parseFloat(result.firstTimeDiscount),
                            first_time_discount_value:              parseFloat(result.firstTimeDiscountValue),
                            other_discount_value:                   parseFloat(result.otherDiscountValue),
                            blue_dollars:                           parseFloat(result.blueDollars),
                            blue_dollar_user_owned:                 parseFloat(result.blueDollars_self),
                            blue_dollar_user_need_to_pay:           parseFloat(result.blueDollars_due),
                            blue_dollar_bought_from_consumers:      parseFloat(result.lockedBlueDollars_others_consumers),
                            blue_dollar_bought_from_fandine:        parseFloat(result.lockedBlueDollars_others_fandine),
                            blue_dollar_bought_from_restaurant:     parseFloat(result.lockedBlueDollars_others_restaurant),
                            blue_dollar_bought_total:               parseFloat(result.lockedBlueDollars_others_consumers + result.lockedBlueDollars_others_fandine + result.lockedBlueDollars_others_restaurant),
                            pre_calculated_tip:                     parseFloat(Number(result.tip).toFixed(2)),
                            gold_dollars:                           parseFloat(result.goldDollars),
                            blue_dollar_discount:       0,
                            blue_dollar_amount_to_buy:  0,
                            total_to_pay_with_blue_gold_dollars: 0
                        };

                        /**
                         * NOTE: FBE-1187. This is only for V1 GEt Bill
                         *      - This `if` block is only temporary to overwrite the wrong BD data in GET Bill v1.
                         *      - We can remove this block of code as soon as we deprecate GET Bill v1.
                         **/
                        if (skipBillStatusCheck) {
                            calculatedOrder.blue_dollar_others  = calculatedOrder.rewards.blue_dollar_bought_total;
                            calculatedOrder.blue_dollar_due     = calculatedOrder.rewards.blue_dollar_user_need_to_pay;
                        };

                        calculatedOrder.payment.discounts                           = result.discounts;
                        calculatedOrder.payment.first_visit_customer_savings        = parseFloat(result.firstTimeDiscountValue);

                        //-- The tip amount set by the customer overrides the pre_calculated_tip
                        if(calculatedOrder.tip ===null || calculatedOrder.tip === undefined||(!calculatedOrder.tip)){
                            calculatedOrder.payment.tip = 0;
                        } else {
                            calculatedOrder.payment.tip                                 = calculatedOrder.tip;
                        }
                        //calculatedOrder.payment.tip                                 = calculatedOrder.tip;
                        calculatedOrder.payment.other_discounts                     = parseFloat(result.otherDiscountValue);
                        calculatedOrder.payment.total_discounts
                            = calculatedOrder.payment.first_visit_customer_savings
                            + calculatedOrder.payment.other_discounts;

                        calculatedOrder.payment.sub_total_after_discounts            //-- K
                            = calculatedOrder.payment.sub_total_before_first_visit_savings
                            - calculatedOrder.payment.total_discounts;

                        calculatedOrder.payment.tip                         = parseFloat(Number(result.tip).toFixed(2));

                        //-- Spreadsheet columns: N
                        calculatedOrder.payment.grand_total_to_pay
                            = calculatedOrder.payment.sub_total_after_discounts
                            + calculatedOrder.payment.total_tax
                            + calculatedOrder.payment.tip;

                        //-- Spreadsheet columns: N - O - P - R
                        calculatedOrder.payment.blue_dollar_amount_paid             = parseFloat(Number(result.blueDollars_self).toFixed(2));
                        calculatedOrder.payment.gold_dollar_amount_paid             = parseFloat(Number(result.goldDollars).toFixed(2));
                        calculatedOrder.payment.blue_dollar_bought_from_consumer    = parseFloat(result.lockedBlueDollars_others_consumers); //-- T (B): PostgreSQL
                        calculatedOrder.payment.blue_dollar_savings                 = parseFloat(Number(calculatedOrder.rewards.blue_dollar_bought_total - calculatedOrder.rewards.blue_dollar_user_need_to_pay).toFixed(2)); //-- FBE-1648
                        calculatedOrder.payment.blue_dollar_bought_from_fandine     = parseFloat(result.lockedBlueDollars_others_fandine); //-- U (C): PostgreSQL mapping is not identified YET
                        calculatedOrder.payment.blue_dollar_bought_from_restaurant  = parseFloat(result.lockedBlueDollars_others_restaurant); //-- V (D): PostgreSQL mapping is not identified YET

                        calculatedOrder.payment.grand_total_to_pay = Math.round( calculatedOrder.payment.grand_total_to_pay * 100) /100;
                        calculatedOrder.rewards.first_time_discount_rate    = parseFloat(Number(calculatedOrder.rewards.first_time_discount_rate).toFixed(2));
                        calculatedOrder.payment.tip_rate = result.tipRate;
                        calculatedOrder.payment.grand_total_to_pay          = parseFloat(Number(calculatedOrder.payment.grand_total_to_pay).toFixed(2));

                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-6 orderManager.checkIfFirstTimeAndGetOthers() mapped the result',
                            sendParamsForCheckIfFirstTime: sendParamsForCheckIfFirstTime, calculatedOrder: calculatedOrder
                        });

                        nextstep(null, calculatedOrder);
                    }
                });

            } else {
                nextstep(null, calculatedOrder);
            };

        },
        //-- Step-7: calculateTransactions
        function (calculatedOrder,nextstep){
            if(!isLocked) {
                //-- FBE-1106: [Orders] Pre-Calculate `transactions` but add a boolean attribute `is_transaction_completed`
                var payment = _this.backendHelpers.jsonHelper().cloneDocument(_this.orderCalculate.calculateTransactions(calculatedOrder, _this.enums.PaymentTypeOther, otherServers));
                delete calculatedOrder.payment;
                calculatedOrder.payment = payment;
            }
            nextstep(null,calculatedOrder);
        },
        //-- Step-8: getRemainingGoldDollars
        function (calculatedOrder,nextstep){
            var goldDollarConfig = otherServers.stripe_gold_dollar;
            /**
             * Important: This block of code will make sure given list of restaurants can use gold dollars to pay
             * within given time intervel. Other time frames or any other restaurants will automatcially set payment_gold_dollar_amount to 0
             */
            var include_restaurant_ids=[
                '87368cc1-121b-42ab-9042-d055969e82df',
                'de3d2446-f5b5-4a81-92b6-8b41f7bb4ab9',
                'c34101d1-1b65-4841-ad48-f5cc9cdd4dee',
                'a71aa0c4-6dfc-4c25-8483-6b299aa200c9',
                '2f1945cd-fffa-487b-a8d3-220e9a6fa181',
                'cae7e15e-a676-43c5-8dd1-9ba040825b06',
                'e31f0460-3322-469d-9a75-b83a509990b3',
                '13b9cb5f-f0ce-4231-9d72-1dcb46b7a291',
                '2a339ead-3ac5-4dd3-a30c-1ddcb8851a26',
                'e1982aca-48d8-4d07-99af-993ff77828f0',
                'ad67e6dc-7e6c-4226-bff3-538914856aac',
                '7ee70dd3-4c56-49a9-862e-80c37756512b',
                '2cef2214-a324-4f17-b622-d83951a47bff',
                'dd82a66f-f888-44e0-a6d5-e49060e7c389',
                '2cdc58fa-e6d9-4dfe-82cc-5d5f92faa161'
            ];
            var now=new Date();
            var date_from=new Date("Mon Jul 25 2016 00:00:00 GMT-0700 (PDT)");
            var date_to=new Date("Fri Sep 09 2016 00:00:00 GMT-0700 (PDT)");
            var goldDollarEnable=false;
            if(goldDollarConfig!=undefined){
                goldDollarEnable=goldDollarConfig.enable;
            }

            if(include_restaurant_ids.indexOf(calculatedOrder.restaurant.restaurant_id)<0||
                now<date_from||now>date_to){
                goldDollarEnable=false;
            }

            if(calculatedOrder.payment&&goldDollarConfig&&goldDollarEnable) {
                var currency = calculatedOrder.restaurant.currency;
                _this.orderManager.getGoldDollars(userId, currency, headerToken, otherServers,function (err, result) {
                    if (err) {
                        nextstep(err);
                    } else {
                        var amount=Math.round(calculatedOrder.payment.total_amount_to_pay_with_bd_and_gd*100);
                        var canUseGoldDollar=Math.round(result.amount*100);
                        var temp_goldDollar = parseInt(amount * goldDollarConfig.use_gold_dollar_percent,10);
                        var pay_to_fandine=Math.round( calculatedOrder.payment.split_payment_going_to_fandine *100);
                        var min_to_pay=Math.round(goldDollarConfig.min_amount_to_stripe*100);

                        // if(canUseGoldDollar > temp_goldDollar){
                        //     canUseGoldDollar = temp_goldDollar;
                        // }
                        // if((amount - canUseGoldDollar) < pay_to_fandine + min_to_pay){
                        //     canUseGoldDollar = amount - pay_to_fandine - min_to_pay;
                        // }

                        var group_discount = 0;
                        if (order.invitation_code_discount){
                            group_discount = Math.round(order.invitation_code_discount.group_discount* 100)||0;
                        }
                        amount = amount - group_discount;

                        var deliveryFee = 0;
                        if(order.delivery_payment && order.delivery_payment.delivery_fee  ){
                            deliveryFee = Math.round(order.delivery_payment.delivery_fee*100);
                        }

                        var totalTax = 0;
                        if(order.payment.total_tax){
                            totalTax =  Math.round(order.payment.total_tax*100);
                        }

                        var tip = 0;
                        if(order.payment.tip){
                            tip = Math.round(order.payment.tip * 100) ;
                        }

                        var payByCard = tip + deliveryFee + totalTax;
                        if(payByCard < min_to_pay){
                            payByCard = min_to_pay;
                        }

                        if(canUseGoldDollar  > amount - payByCard){
                            canUseGoldDollar  = amount - payByCard
                        }

                        if(canUseGoldDollar<0){
                            canUseGoldDollar=0;
                        }
                        calculatedOrder.can_use_golddollar = parseFloat(Number(canUseGoldDollar /100).toFixed(2));

                        nextstep(null,calculatedOrder);
                    }
                });
            }else{
                nextstep(null,calculatedOrder);
            }
        },
        //-- Step-9: doUpdateOrder
        function (updatedOrder, nextstep) {

            var formattedOrder = {};

            if (!isLocked) {
                updatedOrder.out_trade_no = _this.dataGenerationHelper.generateUUID().replace(/-/g, '');
                var paymentInformationForAlipay = _this.backendHelpers.jsonHelper().cloneDocument(_this.orderCalculate.calculateForAlipay(updatedOrder,otherServers));
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId calculated payment_information_for_alipay ', paymentInformationForAlipay: paymentInformationForAlipay });
                updatedOrder.payment_information_for_alipay = paymentInformationForAlipay;
                var updatedOrderForsimple = _this.backendHelpers.jsonHelper().cloneDocument(updatedOrder);
                /**
                 *
                 * NOTE: Use the hard-coded ID below to temporarily bypass the MongoDB update for until QA approved the JSON response
                 *      - var criteria = {_id: '8915032f-d791-4f51-95cf-8f1fa8f61e38' };
                 *      - var criteria = {_id: orderId};
                 */

                var criteria = {_id: orderId};
                delete updatedOrder._id;
                delete updatedOrder.create_time;
                delete updatedOrder.last_modified;
                delete updatedOrder.last_submission_time;
                delete updatedOrder.closeTime;
                delete updatedOrder.close_time;
                delete updatedOrder.submitTime;
                delete updatedOrder.submit_time;

                var document = {$set: updatedOrder};
                var options = {};
                var helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: GetBillByOrderId()' };

                _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetBillByOrderId step-9 update `order` returns an error', error: error });
                        nextstep(error);
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-9 update `order` returns result', updatedOrder: updatedOrder });

                        if (isResponseForV1) {
                            formattedOrder = _this.orderManager.reformatBillResponseToV1(updatedOrder);
                            callback(null, { status: 200, data: [formattedOrder] });
                        } else if (isResponseForSimplifiedV2) {
                            updatedOrderForsimple.locale = locale;
                            formattedOrder = _this.orderManager.reformatBillResponseToV2Simplified(updatedOrderForsimple);
                            callback(null, { status: 200, data: formattedOrder});
                        }  else {
                            formattedOrder = _this.orderManager.reformatBillResponseToV2(updatedOrder);
                            callback(null, { status: 200, data: formattedOrder });
                        };
                    }
                });
            } else {
                if (isResponseForV1) {
                    formattedOrder = _this.orderManager.reformatBillResponseToV1(updatedOrder);
                    callback(null, { status: 200, data: [formattedOrder] });
                } else if (isResponseForSimplifiedV2) {
                    updatedOrder.locale = locale;
                    formattedOrder = _this.orderManager.reformatBillResponseToV2Simplified(updatedOrder);
                    callback(null, { status: 200, data: formattedOrder});
                } else {
                    formattedOrder = _this.orderManager.reformatBillResponseToV2(updatedOrder);
                    callback(null, { status: 200, data: formattedOrder });
                };

            };
        }

    ], function (error) {
        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetBillByOrderId step-(error) callback'});
        callback (error,null);
    });
};

//-- FBE-1078: [Orders] New v2 API to GET Restaurant Transactions
var GetRestaurantTransactions = function(reqParams, callback) {
    var _this = exports;
    var userId = reqParams.userId,
        restaurantId = reqParams.restaurantId,
        status = reqParams.status,
        orderId = reqParams.orderId,
        from = reqParams.from,
        pageSize = reqParams.pageSize,
        dateFrom = _this.dataGenerationHelper.getUtcToLocalDate(reqParams.dFrom),
        dateTo = _this.dataGenerationHelper.getUtcToLocalDate(reqParams.dTo),
        isOnlinePayment = reqParams.isOnlinePayment,
        onlinePaymentType = reqParams.onlinePaymentType,
        isResponseForV1 = false,
        orderStatus = ['CLOSED', 'PAID'],
        billStatus = _this.enums.BillStatus.PAID,
        orderType = reqParams.orderType,
        comeFrom = reqParams.comeFrom,
        forReport = reqParams.forReport,
        isActiveCity = reqParams.isActiveCity,
        otherServers = reqParams.otherServers,
        headerToken = reqParams.headerToken;

    var isServerNA = _this.serverHelper.isServerNA();
    var isServerCN = _this.serverHelper.isServerCN();

    var restaurantIds = [];
    var activeCities = [];

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetRestaurantTransactions received arguments:', reqParams: reqParams });

    async.waterfall([
        // step-1: doFindUser
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetRestaurantTransactions step-1 doFindUser', userId: userId});

            var loggerInfos = {
                function : 'Order.GetRestaurantTransactions step-1 doFindUser'
            };

            _this.getUserInfo(userId, otherServers, headerToken, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantTransactions step-1 doFindUser returns an error', userId: userId});
                    nextstep(new _this.httpExceptions.DataConflictedException('get user', error));
                } else if (result === null || result === undefined || result.length === 0){
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantTransactions step-1 doFindUser returns empty user', userId: userId});
                    callback(new _this.httpExceptions.ResourceNotFoundException('The given User ID does not exist', userId));
                } else {
                    var user = result;

                    if (_this.isFandineAdmin(user.roles)) {
                        _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantTransactions step-1 doFindUser returns user Fandine admin'});
                        nextstep();
                    } else {
                        restaurantIds = _this.populateRestaurantIds(user.roles);
                        //-- restaurantIds is an array of Strings pertaining to Restaurant IDs from `user.roles`
                        if (restaurantIds.length > 0) {
                            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantTransactions step-1 doFindUser returns right'});
                            nextstep();
                        } else {
                            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantTransactions step-1 doFindUser returns empty user restaurant'});
                            callback(new _this.httpExceptions.ResourceNotFoundException('The given Restaurant ID has no users with the [RESTAURANT_OWNER] privilege', restaurantId));
                        }
                    }
                }
            }, reqParams, loggerInfos);
        },

        // step-2: doFindCity
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantTransactions step-2 doFindCity'});

            if (isActiveCity === true) {
                var selector = {};
                var options = {fields: {city: 1}};
                var helper = {collectionName: _this.enums.CollectionName.CITY_LOCATION};

                _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantTransactions step-2 doFindCity returns an error', error: error});
                        nextstep(new _this.httpExceptions.DataConflictedException('find city-location', 'error'));
                    } else if (result === undefined || result === null || result === '' || result.length === 0) {
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetRestaurantTransactions step-2 doFindCity returns empty'});
                        nextstep();
                    } else {
                        var cities = result;

                        for (var i=0; i<cities.length; i++) {
                            var city = cities[i].city;
                            activeCities.push(city);
                        }

                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetRestaurantTransactions step-2 doFindCity returns right'});
                        nextstep();
                    }
                });
            } else {
                nextstep();
            }
        },

        //-- Step-2: doCheckOrder; make sure this orderId has orderItems
        function (nextstep) {

            // FBE-1157:[Orders] Additional features or options for GET Transactions v2
            var selector = {};

            selector.status = {$in: [_this.enums.OrderStatus.CLOSED, _this.enums.OrderStatus.PAID]};
            selector['bill_status.status'] = billStatus;
            selector.create_time = {$gte: dateFrom, $lte: dateTo};

            if (restaurantIds.length > 0) {
                selector['restaurant.restaurant_id'] = {$in: restaurantIds};
            }

            if (isNotNull(restaurantId)) {
                selector['restaurant.restaurant_id'] = restaurantId;
            }

            if (activeCities.length > 0) {
                selector['restaurant.addresses.city'] = {$in: activeCities};
            }

            if (isNotNull(orderId)) {
                selector._id = orderId;
            }

            if (isNotNull(status)) {
                if (_this.enums.SettlementStatus.UNSETTLED === status.toLowerCase()) {
                    selector['payment.is_transaction_settled'] = false;
                } else if (_this.enums.SettlementStatus.SETTLED === status.toLowerCase()) {
                    selector['payment.is_transaction_settled'] = true;
                }
            }

            if (isNotNull(isOnlinePayment)) {
                if (isOnlinePayment === 'TRUE' ) {
                    selector['bill_status.is_online_payment'] = true;
                } else {
                    selector['bill_status.is_online_payment'] = false;
                }
            }

            if('TRUE' === isOnlinePayment && isNotNull(onlinePaymentType)) {
                var onlinePaymentTypeUpperCase = onlinePaymentType.toUpperCase();
                if((isServerCN  && onlinePaymentTypeUpperCase === _this.enums.OnlinePaymentType.ALIPAY) ||
                    (isServerNA  && onlinePaymentTypeUpperCase === _this.enums.OnlinePaymentType.STRIPE)) {
                    selector.$or = [{'bill_status.online_payment_type': {$exists: false}}, {'bill_status.online_payment_type': onlinePaymentTypeUpperCase}];
                } else {
                    selector['bill_status.online_payment_type'] = onlinePaymentType.toUpperCase();
                }
            }

            if(isNotNull(orderType)) {
                if(_this.enums.OrderType.hasOwnProperty(orderType.toUpperCase())) {
                    if(orderType.toUpperCase() === _this.enums.OrderType.PREORDER) {
                        selector['order_type'] = _this.enums.OrderType.PREORDER;
                    } else if (orderType.toUpperCase() === _this.enums.OrderType.DELIVERY) {
                        selector['order_type'] = _this.enums.OrderType.DELIVERY;
                    }else if(orderType.toUpperCase() === _this.enums.OrderType.TAKEOUT) {
                        selector['is_takeout'] = true;
                    } else {
                        selector['order_type'] = {$exists: 0};
                        selector['is_takeout'] = {$ne: true};
                    }
                }
            }

            if (isNotNull(comeFrom)) {
                selector['come_from'] = comeFrom;
                if (comeFrom === 'APP') {
                    selector['come_from'] = {$ne: 'WECHAT'};
                }
            }

            var options = {
                sort: {
                    create_time: 1
                }
            }; //-- options.limit = 10; options.skip = 0
            // FBE-2819
            if(!forReport) {
                _this.orderManager.pagingFunction(options, from, pageSize);
            }
            var helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: GetRestaurantTransactions()' };

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetRestaurantTransactions step-2 doCheckOrder', selector: selector, helper: helper });

            _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
                if (error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetRestaurantTransactions step-2 doCheckOrder returns an error', error: error });
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetRestaurantTransactions step-2 doCheckOrder returns empty' });
                    callback(null, { status: 200, data: [] });
                } else {

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetRestaurantTransactions step-2 doCheckOrder returns result', result: result });

                    var formattedOrder = [];

                    if (isResponseForV1) {
                        for (var i=0; i<result.length; i++) {
                            formattedOrder.push(_this.orderManager.reformatBillResponseToV1(result[i]));
                        };
                    } else {
                        for (var i=0; i<result.length; i++) {
                            if (result[i].bill_status && result[i].bill_status.is_online_payment) {

                                if(result[i].bill_status.online_payment_type) {
                                    result[i].online_payment_type = result[i].bill_status.online_payment_type;
                                }

                                var payment = result[i].payment;

                                if (payment && payment.total_amount_to_pay_with_bd_and_gd >= 0 && payment.split_payment_going_to_restaurant >= 0 && payment.credit_service_charge >= 0) {

                                    // FDC = total amount - restaurant payment - service charge��accounting toFixed is accurate
                                    if (isServerNA) {
                                        payment.amount_to_buy_restaurant_credits = _this.dataGenerationHelper.getAccurateNumber(payment.blue_dollar_bought_from_restaurant * 0.8, 2);
                                        payment.FDC = _this.dataGenerationHelper.getAccurateNumber(payment.total_blue_dollar_bought + payment.blue_dollar_amount_paid, 2);
                                        payment.application_fee = _this.dataGenerationHelper.getAccurateNumber(payment.amount_to_buy_blue_dollar + payment.amount_to_buy_restaurant_credits + payment.service_charge_shared_by_fd, 2);
                                    } else {
                                        payment.FDC = parseFloat(accounting.toFixed((payment.total_amount_to_pay_with_bd_and_gd * 100 - payment.split_payment_going_to_restaurant * 100
                                            - payment.real_alipaty_service_charge * 100)/100, 2), 10);
                                    }
                                }

                                if (isServerCN) {
                                    if (payment.real_alipaty_service_charge !== null && payment.real_alipaty_service_charge !== undefined) {
                                        payment.credit_service_charge = payment.real_alipaty_service_charge
                                    }
                                }

                                for(var key in payment){
                                    payment[key] = _this.dataGenerationHelper.getAccurateNumber(payment[key], 2);
                                }

                            }
                            var order = {};
                            order._id = result[i]._id;
                            order.order_no = result[i].order_no;
                            order.create_time = result[i].create_time;
                            order.last_submission_time = result[i].last_submission_time;
                            order.submit_time = result[i].submit_time;
                            order.bdrr = result[i].restaurant.blue_dollars ? result[i].restaurant.blue_dollars[0].bdrr : 0;
                            order.online_payment_type = result[i].online_payment_type;
                            order.payment = result[i].payment;
                            order.delivery_payment = result[i].delivery_payment;  // FBE-3095
                            // FBE-2699: add new attributes: order_type and settlement_status for v2 transaction report
                            order.order_type = _this.orderManager.getOrderType(result[i]);
                            order.come_from = result[i].come_from ? result[i].come_from : 'APP';
                            order.settlement_status = _this.enums.SettlementStatus.UNSETTLED;
                            if(result[i].payment && (true === result[i].payment.is_transaction_settled)) {
                                order.settlement_status = _this.enums.SettlementStatus.SETTLED;
                            }
                            if (activeCities.length > 0) {
                                order.restaurant_name = result[i].restaurant.restaurant_name;
                                order.restaurant_city = result[i].restaurant.addresses.city;
                            }
                            formattedOrder.push(order);
                            //formattedOrder.push(_this.orderManager.reformatBillResponseToV2(result[i]));
                        };
                    };
                    callback(null, { status: 200, data: formattedOrder });
                }
            });
        }

    ], function (error) {
        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetRestaurantTransactions step-(error) callback'});
        callback(error);
    });
};

/**
 * Feature: @Me
 * @param userId
 * @param index
 * @param callback
 * @constructor
 * @note FBE-1265: [Orders] New v2 API to GET Past Orders (only; no reviews or comments)
 */
var GetPastOrdersOnlyWithoutReview = function (reqParams, callback) {
    var _this = exports;

    var fields;
    var selector;
    var options = {};
    var helper = {};
    var restaurants = [], orderIds = [];

    var apiResult = '';

    var userId = reqParams.userId,
        index = reqParams.index,
        from = reqParams.from,
        pageSize = reqParams.pageSize,
        isTakeout = reqParams.isTakeout,
        orderType = reqParams.orderType,
        locale = reqParams.locale,
        acceptEncoding = reqParams.acceptEncoding;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetPastOrdersOnlyWithoutReview received arguments:', reqParams: reqParams });

    async.waterfall([

        //-- Step-1: doSetTheFields
        function (nextstep) {
            nextstep();
        },

        //-- Step-2: doGetOrderDetails
        function (nextstep) {

            //-- FBE-700, FBE-995,  FF-2222
            var fields = {
                _id: 1,
                restaurantId: 1,
                restaurant_name: '$restaurant_name',
                restaurant_logo: '$restaurant_logo',
                restaurant: '$restaurant',
                createDate: '$createDate',
                submitTime: '$submitTime',
                updateTime: '$updateTime',
                create_time: '$create_time',
                submit_time: '$last_submission_time',
                update_time: '$update_time',
                status: 1,
                orderId: '$_id',
                order_items: 1,
                menu_item_id: '$itemId',
                menu_item_name: '$itemName',
                last_submission_time: 1,
                is_takeout:1,
                tableId:1,
                tableNo:1,
                note:1,
                order_type: 1,
                is_expired: 1,
                delivery_status: 1,
                consumer_delivery_status: 1,
                liked: 1,
                picked_up:1,
                payment_status:1,
                is_aa: 1
            };
            var resultFilter = {};

            var queryDateTime = reqParams.queryDateTime;

            var selector = {$or: [{'customers.userId': userId}, {'customers.user_id': userId}]};
            selector['order_items'] = {$exists: 1};
            selector['status'] = {$in: [_this.enums.OrderStatus.PAID, _this.enums.OrderStatus.CLOSED]};

            if (isNotNull(queryDateTime)) {
                selector['last_submission_time'] = {$gt : _this.dataGenerationHelper.getValidUTCDate(queryDateTime)};
            }

            if (isTakeout === true) {
                selector['is_takeout'] = isTakeout;
            } else if (isTakeout === false) {
                selector['is_takeout'] = {$ne: true};
            }

            if (isNotNull(orderType)) {
                selector['order_type'] = orderType;
                selector['picked_up'] = {$ne: true};

                if (orderType === _this.enums.OrderType.PREORDER) {
                    selector['status'] = {$in: [_this.enums.OrderStatus.PAID, _this.enums.OrderStatus.CLOSED,
                        _this.enums.OrderStatus.PENDING, _this.enums.OrderStatus.FAILED]};

                    selector['$or'] = [
                        // not aa order
                        {$and: [{is_aa: {$ne: true}}, {'customers.user_id': userId}]},
                        // aa paid order
                        {
                            $and: [{is_aa: true}, {customers: {$elemMatch:{'user_id':userId, payment_status: 'PAID'}}}]
                        }
                    ];
                }

            } else {
                var newSelector = {$and: [
                    selector,
                    {$or: [
                        {
                            order_type: {$ne: _this.enums.OrderType.PREORDER}
                        },
                        {
                            $and: [
                                {order_type: _this.enums.OrderType.PREORDER},
                                {picked_up: true}
                            ]
                        }
                    ]}
                ]};

                selector = newSelector;
            }

            _this.orderManager.pagingFunction(options,from,pageSize);
            options.fields = fields;
            options.sort = {'last_submission_time': -1,'submitTime':-1, 'updateTime': -1};

            var helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: GetPastOrdersOnlyWithoutReview()' };

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetPastOrdersOnlyWithoutReview - step-2: doGetOrderDetails returns an error', error: error});
                    callback(error);
                } else if (result === null || result.length === 0) {
                    apiResult = {status: 200, data: []};

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetPastOrdersOnlyWithoutReview - step-2: doGetOrderDetails returns empty'});
                    nextstep();
                } else {

                    for (var i = 0; i < result.length; i++) {

                        if (isNotNull(result[i].archived)) {
                            if (result[i].archived) {
                                continue;
                            }
                        }

                        var resultRestaurant = result[i].restaurant;

                        var restaurant = {};
                        restaurant.order_id = result[i]._id;
                        restaurant.restaurant_id = isNotNull(resultRestaurant) ? resultRestaurant.restaurant_id|| result[i].restaurantId ||'' : result[i].restaurantId || '';
                        restaurant.restaurant_name = isNotNull(resultRestaurant) ? resultRestaurant.restaurant_name|| result[i].restaurant_name ||'' : result[i].restaurant_name || '';
                        restaurant.restaurant_logo = isNotNull(resultRestaurant) ? (isNotNull(resultRestaurant.restaurant_logo) ? resultRestaurant.restaurant_logo.path|| result[i].restaurant_logo.path || '' : '') : result[i].restaurant_logo.path || '';
                        restaurant.submit_time = result[i].last_submission_time || result[i].create_time || result[i].createDate || '';
                        restaurant.order_items = [];
                        restaurant.is_takeout = result[i].is_takeout;
                        restaurant.table_id = result[i].tableId;
                        restaurant.table_no = result[i].tableNo;
                        restaurant.order_type = _this.orderManager.getOrderType(result[i]);
                        restaurant.status = result[i].status;

                        if(result[i].note){
                            restaurant.mobile = result[i].note.mobile;
                            if (result[i].note.effective_date) {
                                restaurant.note = result[i].note;
                            }

                        }
                        if (result[i].is_expired) {
                            restaurant.is_expired = result[i].is_expired;
                        }
                        if (result[i].delivery_status) {
                            restaurant.delivery_status = result[i].delivery_status;
                        }
                        if (result[i].consumer_delivery_status) {
                            restaurant.consumer_delivery_status = result[i].consumer_delivery_status;
                        }

                        if (resultRestaurant.liked) {
                            restaurant.liked = resultRestaurant.liked;
                        }

                        if (result[i].is_aa) {
                            restaurant.is_aa = result[i].is_aa;
                        }

                        if(result[i] === undefined || result[i].picked_up == false){
                            restaurant.is_checked_in = false;
                        }
                        else{
                            restaurant.is_checked_in = true;
                        }
                        if(result[i].payment_status) {
                            restaurant.payment_status = result[i].payment_status;
                        }

                        var orderItems = [];
                        //-- For each orderItem, retrieve the `order_item_user_id`, `menu_item_id`, and `order_item_id`
                        for (var y = 0; y < result[i].order_items.length; y++) {

                            var item = result[i].order_items[y];

                            var orderItem = {};
                            orderItem.menu_item_name   = _this.orderManager.getMenuItemNameByLocale(item.item_names, item.item_name, locale);

                            orderItems.push(orderItem);
                        }

                        if (orderItems.length == 0) {
                            continue;
                        }

                        restaurant.order_items = orderItems;

                        restaurants.push(restaurant);
                    }

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetPastOrdersOnlyWithoutReview - step-2: doGetOrderDetails - information about Orders',
                        restaurants: restaurants});
                    apiResult = {status: 200, data: restaurants};

                    nextstep();
                }
            });
        }

    ], function (error) {
        callback(error, apiResult);
    });
};

var GetRestaurantPastOrdersOnlyWithoutReview = function (reqParams, callback) {
    var _this = exports;

    var fields;
    var selector;
    var options = {};
    var helper = {};
    var restaurants = [], orderIds = [];

    var apiResult = '';

    var restaurantId = reqParams.restaurantId,
        index = reqParams.index,
        from = reqParams.from,
        pageSize = reqParams.pageSize,
        queryDateTime = reqParams.queryDateTime,
        isTakeout = reqParams.isTakeout,
        includeCancelledOrder = reqParams.includeCancelledOrder,
        orderType = reqParams.orderType,
        acceptEncoding = reqParams.acceptEncoding;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetRestaurantPastOrdersOnlyWithoutReview received arguments:', reqParams: reqParams });

    async.waterfall([

        //-- Step-1: doSetTheFields
        function (nextstep) {
            nextstep();
        },

        //-- Step-2: doGetOrderDetails
        function (nextstep) {

            //-- FBE-700, FBE-995,  FF-2222
            var fields = {
                _id: 1,
                restaurantId: 1,
                restaurant_name: '$restaurant_name',
                restaurant_logo: '$restaurant_logo',
                restaurant: '$restaurant',
                createDate: '$createDate',
                submitTime: '$submitTime',
                updateTime: '$updateTime',
                create_time: '$create_time',
                submit_time: '$last_submission_time',
                update_time: '$update_time',
                status: 1,
                orderId: '$_id',
                order_items: 1,
                menu_item_id: '$itemId',
                menu_item_name: '$itemName',
                last_submission_time: 1,
                is_takeout:1,
                tableId:1,
                tableNo:1,
                note:1,
                order_type: 1,
                is_aa: 1
            };

            var selector = {'restaurant.restaurant_id': restaurantId, 'order_items': {$exists: 1}};
            if (isNotNull(queryDateTime)) {
                selector['last_submission_time'] = {$gt : _this.dataGenerationHelper.getValidUTCDate(queryDateTime)};
            }

            if (!isNotNull(isTakeout) && !isNotNull(orderType)) {
                // all order (paid/closed dinner order, paid/closed takeout order and redeemed pre order)
                selector['$or'] = [
                    // paid/closed dinner/takeout order
                    {$and: [{status: {$in: [_this.enums.OrderStatus.PAID, _this.enums.OrderStatus.CLOSED]}}, {order_type: {$ne: _this.enums.OrderType.PREORDER}}]},
                    // redeemed pre order
                    {$and: [{picked_up: true}, {order_type: _this.enums.OrderType.PREORDER}]}
                ]
            }

            if (isTakeout === true) {
                // takeout order
                selector['is_takeout'] = isTakeout;
            } else if (isTakeout === false) {
                // dinner order and redeemed pre order
                selector['is_takeout'] = {$ne: true};
                selector['$or'] = [
                    // dinner order
                    {$and: [{status: {$in: [_this.enums.OrderStatus.PAID, _this.enums.OrderStatus.CLOSED]}}, {order_type: {$ne: _this.enums.OrderType.PREORDER}}]},
                    // redeemed pre order
                    {$and: [{picked_up: true}, {order_type: _this.enums.OrderType.PREORDER}]}
                ];
            }

            if (isNotNull(orderType)) {
                selector['order_type'] = orderType;

                if (orderType === _this.enums.OrderType.PREORDER) {
                    // pre order
                    selector['picked_up'] = true;
                }
            }

            if (includeCancelledOrder === true) {
                if (isNotNull(selector['$or'])) {
                    selector['$or'].push(
                        // cancelled dine in order by consumer or employee
                        {$and: [{'operations.user_role': {$ne: _this.enums.UserRole.SYSTEM}}, {'operations.action': _this.enums.ActionStatus.CANCEL},
                            {'status': _this.enums.OrderStatus.CANCELLED}, {'is_takeout': {$ne: true}}, {'order_type': {$ne: _this.enums.OrderType.PREORDER}}]}
                    )
                } else {
                    selector['$or'] = [
                        // paid/closed order
                        {$and: [{status: {$in: [_this.enums.OrderStatus.PAID, _this.enums.OrderStatus.CLOSED]}}]},
                        // cancelled dine in order by consumer or employee
                        {$and: [{'operations.user_role': {$ne: _this.enums.UserRole.SYSTEM}}, {'operations.action': _this.enums.ActionStatus.CANCEL},
                            {'status': _this.enums.OrderStatus.CANCELLED}, {'is_takeout': {$ne: true}}, {'order_type': {$exists: 0}}]}
                    ];
                }
            } else {
                selector['status'] = {$in: [_this.enums.OrderStatus.PAID, _this.enums.OrderStatus.CLOSED]};
            }

            _this.orderManager.pagingFunction(options,from,pageSize);
            options.fields = fields;
            options.sort = {'last_submission_time': -1,'submitTime':-1, 'updateTime': -1};

            var helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: GetRestaurantPastOrdersOnlyWithoutReview()' };

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetRestaurantPastOrdersOnlyWithoutReview - step-2: doGetOrderDetails returns an error', error: error});
                    callback(error);
                } else if (result === null || result.length === 0) {
                    apiResult = {status: 200, data: []};

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetRestaurantPastOrdersOnlyWithoutReview - step-2: doGetOrderDetails returns empty'});
                    nextstep();
                } else {

                    for (var i = 0; i < result.length; i++) {

                        if (isNotNull(result[i].archived)) {
                            if (result[i].archived) {
                                continue;
                            }
                        }

                        var resultRestaurant = result[i].restaurant;

                        var restaurant = {};
                        restaurant.order_id = result[i]._id;
                        restaurant.restaurant_name = isNotNull(resultRestaurant) ? resultRestaurant.restaurant_name|| result[i].restaurant_name ||'' : result[i].restaurant_name || '';
                        restaurant.restaurant_logo = isNotNull(resultRestaurant) ? (isNotNull(resultRestaurant.restaurant_logo) ? resultRestaurant.restaurant_logo.path|| result[i].restaurant_logo.path || '' : '') : result[i].restaurant_logo.path || '';
                        restaurant.submit_time = result[i].last_submission_time || result[i].create_time || result[i].createDate || '';
                        restaurant.order_items = [];
                        restaurant.is_takeout = result[i].is_takeout;
                        restaurant.table_id = result[i].tableId;
                        restaurant.table_no = result[i].tableNo;
                        if(result[i].note){
                            restaurant.mobile = result[i].note.mobile;
                        }
                        restaurant.order_status = result[i].status;

                        if (result[i].order_type) {
                            restaurant.order_type = result[i].order_type;
                        }

                        if (result[i].is_aa) {
                            restaurant.is_aa = result[i].is_aa;
                        }

                        var orderItems = [];
                        //-- For each orderItem, retrieve the `order_item_user_id`, `menu_item_id`, and `order_item_id`
                        for (var y = 0; y < result[i].order_items.length; y++) {

                            var item = result[i].order_items[y];

                            if (isNotNull(queryDateTime)) {
                                if (!isNotNull(item.submission_time)) {
                                    continue;
                                } else {
                                    if (_this.dataGenerationHelper.getValidUTCDate(queryDateTime).getTime() > _this.dataGenerationHelper.getValidUTCDate(item.submission_time).getTime()) {
                                        continue;
                                    }
                                }
                            }

                            var orderItem = {};
                            orderItem.menu_item_name = item.item_name || item.itemName || '';
                            orderItems.push(orderItem);
                        }

                        if (orderItems.length == 0) {
                            continue;
                        }

                        restaurant.order_items = orderItems;

                        //var operations = [];
                        //restaurant.operations = [];
                        //
                        ////                   if((result[i].operations) && result[i].operations.length > 0 ) {
                        //for(var j = 0; j < result[i].operations.length; j++) {
                        //
                        //
                        //    if (isNotNull(queryDateTime)) {
                        //        if (!isNotNull(result[i].operations[j].operation_time)) {
                        //            continue;
                        //        } else {
                        //            if (_this.dataGenerationHelper.getValidUTCDate(queryDateTime).getTime() > _this.dataGenerationHelper.getValidUTCDate(result[i].operations[j].operation_time).getTime()) {
                        //                continue;
                        //            }
                        //        }
                        //    }
                        //
                        //    var operation = {};
                        //    operation._id = isNotNull(result[i].operations[j]._id) ? result[i].operations[j]._id || '';
                        //    operation.user_id = isNotNull(result[i].operations[j].user_id) ? result[i].operations[j].user_id ||'';
                        //    operation.user_role =  isNotNull(result[i].operations[j].user_role) ? result[i].operations[j].user_role ||'';
                        //    operation.action =  isNotNull(result[i].operations[j].action) ? result[i].operations[j].action  ||'';
                        //    operation.operation_time =  isNotNull(result[i].operations[j].operation_time) ? result[i].operations[j].operation_time  ||'';
                        //    operation.operation_memo =  isNotNull(result[i].operations[j].operation_memo) ? result[i].operations[j].operation_memo ||'';
                        //
                        //    operations.push(operation);
                        //
                        //}
                        //
                        //
                        ////                   }
                        //
                        //if(operations.length == 0) {
                        //    continue;
                        //}
                        //
                        //restaurant.operations = opeartions;

                        restaurants.push(restaurant);

                    }

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetRestaurantPastOrdersOnlyWithoutReview - step-2: doGetOrderDetails - information about Orders',
                        restaurants: restaurants});
                    apiResult = {status: 200, data: restaurants};

                    nextstep();
                }
            });
        }

    ], function (error) {
        callback(error, apiResult);
    });
};

var FixOldData = function (otherServers, headerToken, callback) {
    var _this = exports;

    var apiResult = '';

    var orders = [];

    // all use need to get name and avatar
    var userMap = {};
    // all menu need to get rating and photo
    var menuMap = {};

    var customerMap = {};
    var itemMap = {};

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData received arguments:'});

    async.series([
        // step-1: doFindOrderCustomer
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-1 doFindOrderCustomer:'});

            var selector = {orderId: {$ne: null}};
            var options = {orderId: 1, customers: 1};
            var helper = {collectionName: 'order-customers'};
            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-1 doFindOrderCustomer returns an error', error: error});
                    nextstep(new _this.httpExceptions.InvalidParameterException('error',error));
                } else if (result == null || result == undefined || result.length == 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-1 doFindOrderCustomer returns empty'});
                    //nextstep(new _this.httpExceptions.ResourceNotFoundException(helper.collectionName, 'empty'));
                    nextstep();
                } else {
                    var orderCustomers = result;
                    for (var i=0; i<orderCustomers.length; i++) {
                        var orderCustomer = orderCustomers[i];

                        if (!isNotNull(orderCustomer.customers) || orderCustomer.customers.length == 0) {
                            continue;
                        } else {
                            customerMap[orderCustomer.orderId] = orderCustomer.customers;
                        }
                    }

                    nextstep();
                }
            });
        },
        // step-2: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-2 doFindOrder:'});

            var selector = {}
            var options = {orderItems: 1, create_time: 1, createDate: 1, last_submission_time: 1};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};
            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-2 doFindOrder returns an error', error: error});
                    nextstep(new _this.httpExceptions.InvalidParameterException('error',error));
                } else if (result == null || result == undefined || result.length == 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-2 doFindOrder returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException(helper.collectionName, 'empty'));
                } else {
                    orders = result;
                    for (var i=0; i< orders.length; i++) {
                        var order = orders[i];

                        if (!isNotNull(order.orderItems) || order.orderItems.length == 0) {
                            continue;
                        } else {
                            for (var j=0; j< order.orderItems.length; j++) {
                                var orderItem = order.orderItems[j];

                                var itemId = orderItem.itemId;
                                if (isNotNull(itemId) && menuMap[itemId] != '') {
                                    menuMap[itemId] = itemId;
                                }

                                var userId = orderItem.order_item_user_id;
                                if (isNotNull(userId) && userMap[userId] != '') {
                                    userMap[userId] = userId;
                                }
                            }
                        }
                    }

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-2 doFindOrder returns right'});
                    nextstep();
                }
            });
        },
        // step-3: doFindMenu
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-3 doFindMenu:'});

            var menuIds = [];
            for (var key in menuMap) {
                menuIds.push(key);
            }

            var selector = {_id: {$in : menuIds}};
            var options = {};
            var helper = {collectionName: 'menu'};
            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-2 doFindMenu returns an error', error: error});
                    nextstep(new _this.httpExceptions.InvalidParameterException('error',error));
                } else if (result == null || result == undefined || result.length == 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-2 doFindMenu returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException(helper.collectionName, 'empty'));
                } else {
                    var menus = result;
                    for (var i=0; i< menus.length; i++) {
                        var menu = menus[i];

                        var smallPhoto = '';
                        if (isNotNull(menu.photos) && menu.photos.length > 0) {
                            for (var j=0; j<menu.photos.length; j++) {
                                if (menu.photos[j].size == _this.enums.SizeOfPhoto.SMALL) {
                                    smallPhoto = menu.photos[j].path;
                                }
                            }
                        }

                        var menuItem = {};
                        menuItem.id = menu._id;
                        menuItem.photo = smallPhoto;
                        menuItem.rating = menu.rating || 0;

                        menuMap[menu._id] = menuItem;
                    }

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-2 doFindMenu returns right'});
                    nextstep();
                }
            })

        },
        // step-4: doFindUser
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-4 doFindUser:'});

            var userIds = [];
            for (var key in userMap) {
                userIds.push(key);
            }

            _this.getUserNameAndAvatar(userIds.join(','), otherServers, headerToken, true, function (error, result) {
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-4 doFindUser returns an error', error: error});
                    nextstep(new _this.httpExceptions.InvalidParameterException('error',error));
                } else {
                    if (result.length === 0) {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-4 doFindUser returns empty'});
                        nextstep();
                    } else {
                        var users = result;
                        for (var i=0; i<users.length; i++) {
                            var user = users[i];

                            userMap[user._id] = {
                                userId: user._id,
                                userName: user.dispName || '',
                                avatarPath: user.avatarPath || ''
                            };
                        }

                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-4 doFindUser returns right'});
                        nextstep();
                    }
                }
            })

        },
        // step-5: doUpdateCustomer
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-5 doUpdateCustomer:'});

            var length = orders.length;
            async.eachSeries(orders, function(order, next){

                if (customerMap[order._id]) {
                    var customers = customerMap[order._id];

                    var selector = {_id: order._id};

                    var updateCustomers = [];
                    for (var i=0; i<customers.length; i++) {
                        var updateConstomer = {};
                        updateConstomer.userId = customers[i].userId || customers[i].user_id;
                        updateConstomer.userName = customers[i].userName || customers[i].user_name || '';
                        updateConstomer.avatarPath = customers[i].avatarPath || customers[i].avatar_path || '';
                        updateCustomers.push(updateConstomer);
                    }
                    var document = {$set: {customers: updateCustomers}};

                    var options = {};
                    var helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS};

                    _this.restaurantDataAPI.update(selector, document, options, helper, function (error){
                        if(error){
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-5 doUpdateCustomer returns an error', error: error});
                            nextstep(new _this.httpExceptions.InvalidParameterException('error',error));
                        } else {
                            length--;
                            next();
                        }
                    });
                } else {
                    length--;
                    next();
                }
            }, function(error){
                if (error) {
                    nextstep(new _this.httpExceptions.InvalidParameterException('update dining-orders error', 'error'));
                } else {
                    if (length == 0) {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-5 doUpdateCustomer returns right'});
                        nextstep();
                    }
                }
            });
        },
        // step-6: doUpdateMenuAndUser
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-6 doUpdateMenuAndUser:'});

            var length = orders.length;
            async.eachSeries(orders, function(order, next){

                if (!isNotNull(order.orderItems) || order.orderItems.length == 0) {
                    length--;
                    next();
                } else {
                    var submissionTime = order.createDate || order.create_time

                    var selector = {_id: order._id};

                    var document = {};
                    var orderItems = [];
                    var ids = [];
                    for (var i=0; i<order.orderItems.length;i++) {
                        var orderItem = order.orderItems[i];

                        var menu = menuMap[orderItem.itemId];
                        if (isNotNull(menu.id)) {
                            orderItem.menu_item_rating = menu.rating;
                            orderItem.menu_item_photo = menu.photo;
                        } else {
                            orderItem.menu_item_rating = 0;
                            orderItem.menu_item_photo = '';
                        }

                        var user = userMap[orderItem.order_item_user_id];
                        if (isNotNull(user) && isNotNull(user.userId)) {
                            orderItem.order_item_user_name = user.userName;
                            orderItem.order_item_user_avatar_path = user.avatarPath;
                        } else {
                            orderItem.order_item_user_name = '';
                            orderItem.order_item_user_avatar_path = '';
                        }

                        if (!isNotNull(orderItem.submission_time)) {
                            orderItem.submission_time = submissionTime;
                        }

                        ids.push(orderItem.order_item_id);
                        orderItems.push(orderItem);
                    }

                    if (isNotNull(order.last_submission_time)) {
                        if (typeof order.last_submission_time == 'string') {
                            document = {$set: { orderItems: orderItems, last_submission_time: _this.dataGenerationHelper.getValidUTCDate(order.last_submission_time)}};
                        } else {
                            document = {$set: { orderItems: orderItems}};
                        }
                    } else {
                        if (typeof submissionTime == 'string') {
                            document = {$set: {last_submission_time: _this.dataGenerationHelper.getValidUTCDate(submissionTime), orderItems: orderItems}};
                        } else {
                            document = {$set: {last_submission_time: submissionTime, orderItems: orderItems}};
                        }
                    }

                    var options = {multi: true};
                    var helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS};

                    _this.restaurantDataAPI.update(selector, document, options, helper, function (error){
                        if(error){
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-6 doUpdateMenuAndUser returns an error', error: error});
                            nextstep(new _this.httpExceptions.InvalidParameterException('error',error));
                        } else {
                            length--;
                            next();
                        }
                    });
                }

            }, function(error){
                if (error) {
                    nextstep(new _this.httpExceptions.InvalidParameterException('update dining-orders error', 'error'));
                } else {
                    if (length == 0) {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-6 doUpdateMenuAndUser returns right'});
                        nextstep();
                    }
                }
            });
        }
    ], function(error){
        if (!error) {
            apiResult = {status: 200, data: 'success'};
        }
        callback(error, apiResult);
    });
}

var GetOrderItemsComments = function (reqParams, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetOrderItemsComments received arguments:', reqParams: reqParams });

    var userId = reqParams.userId,
        orderId = reqParams.orderId,
        locale = reqParams.locale;

    var order = {};
    var commentMap = {};
    var address = {};

    var apiResult = '';

    async.series([
        // step-1: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetOrderItemsComments step-1 doFindOrder,', userId: userId, orderId: orderId});

            var selector = {$and: [{_id: orderId}, {'$or': [{'customers.userId': userId }, {'customers.user_id': userId}]}, {status: {$ne: _this.enums.OrderStatus.CANCELLED}},
                {archived: {$ne: true}}, {status: {$in: [_this.enums.OrderStatus.PAID, _this.enums.OrderStatus.CLOSED, _this.enums.OrderStatus.PENDING, _this.enums.OrderStatus.FAILED]}}]};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetOrderItemsComments step-1 doFindOrder returns an error'});
                    nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                } else if (result == null || result == undefined || result.length == 0) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetOrderItemsComments step-1 doFindOrder returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('order_id', orderId));
                } else {
                    order = result[0];

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetOrderItemsComments step-1 doFindOrder returns right'});
                    nextstep();
                }
            });
        },
        // step-2: doFindComment
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetOrderItemsComments step-2 doFindComment,', userId: userId, orderId: orderId});

            var selector = {order_id: orderId, 'user.user_id': userId};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.MENU_ITEM_COMMENT};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetOrderItemsComments step-2 doFindComment returns an error'});
                    nextstep(new _this.httpExceptions.DataConflictedException('find menu-item-comment', 'error'));
                } else if (result == null || result == undefined || result.length == 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetOrderItemsComments step-2 doFindOrder use empty'});
                    nextstep();
                } else {
                    var comments = result;

                    for (var i=0; i< comments.length; i++) {
                        var comment = comments[i];
                        var menuItemId = comment.menu_item.menu_item_id;

                        commentMap[menuItemId] = comment;
                    }

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetOrderItemsComments step-2 doFindOrder returns right'});
                    nextstep();
                }
            });
        },
        // step-3: doFindRestaurant
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetOrderItemsComments step-3 doFindRestaurant,', orderId: orderId});

            var restaurantId = order.restaurantId || order.restaurant.restaurant_id;

            var selector = {_id: restaurantId};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.RESTAURANT};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetOrderItemsComments step-3 doFindRestaurant returns an error'});
                    nextstep(new _this.httpExceptions.DataConflictedException('find restaurant', 'error'));
                } else if (result == null || result == undefined || result.length == 0) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetOrderItemsComments step-3 doFindRestaurant returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('restaurant_id', restaurantId));
                } else {
                    var restaurant = result[0];

                    address = restaurant.addresses || {};

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetOrderItemsComments step-3 doFindRestaurant returns right'});
                    nextstep();
                }
            });
        },
        // step-4: doPopulateData
        function (nextstep) {
            var returnBody = {};

            var resultRestaurant = order.restaurant;

            returnBody.order_id = order._id;
            returnBody.restaurant_name = isNotNull(resultRestaurant) ? resultRestaurant.restaurant_name||'' : order.restaurant_name || '';
            returnBody.restaurant_logo = isNotNull(resultRestaurant) ? (isNotNull(resultRestaurant.restaurant_logo) ? resultRestaurant.restaurant_logo.path|| '' : '') : order.restaurant_logo.path || '';
            returnBody.restaurant_address = address;

            returnBody.order_type = _this.orderManager.getOrderType(order);
            if (resultRestaurant && resultRestaurant.liked === true) {
                returnBody.liked = true;
            }

            returnBody.submit_time = order.last_submission_time || returnBody.create_time ||'';
            if (order.is_expired) {
                returnBody.is_expired = order.is_expired;
            }
            returnBody.status = order.status;
            returnBody.order_items = [];

            var distinctOrderItemMap = {};
            if (isNotNull(order.order_items)) {

                var countMap = {};
                for (var j = 0; j < order.order_items.length; j++) {
                    var item = order.order_items[j];
                    var quantity = item.quantity;
                    if (!countMap[item.item_id]) {
                        countMap[item.item_id] = 1 * quantity;
                    } else {
                        countMap[item.item_id] += 1 * quantity;
                    }
                }

                for (var i = 0; i < order.order_items.length; i++) {
                    var item = order.order_items[i];

                    if (distinctOrderItemMap[item.item_id]) {
                        continue;
                    }

                    var orderItem = {};
                    orderItem.menu_item_id          = item.item_id || '';
                    orderItem.menu_item_name   = _this.orderManager.getMenuItemNameByLocale(item.item_names, item.item_name, locale);
                    if(item.combinations && item.combinations.length > 0){
                        orderItem.combinations = formatCombinationsByLocale(item.combinations, locale);
                    }
                    orderItem.menu_item_photo        = _this.getMenuPhoto(item.photos);
                    var photos = new Array();
                    if(item.photos){
                        for(var j=0; j<  item.photos.length; j++){
                            if( item.photos[j] &&  item.photos[j].size == "webp_large"){
                                photos.push(item.photos[j]);
                            }
                        }
                    }
                    orderItem.photos        = photos;
                    orderItem.submission_time = item.submission_time || '';
                    orderItem.count = countMap[item.item_id];

                    orderItem.comment = {};
                    if (commentMap[orderItem.menu_item_id]) {
                        var comment = commentMap[orderItem.menu_item_id];

                        delete comment.order_id;
                        delete comment.restaurant;
                        delete comment.user;
                        delete comment.menu_item;
                        delete comment.followers;
                        delete comment.sub_comments;
                        delete comment.thumb_ups;
                        delete comment.thumb_downs;
                        delete comment.v;
                        delete comment.create_time;
                        delete comment.update_time;

                        orderItem.comment = comment;
                    }

                    returnBody.order_items.push(orderItem);

                    distinctOrderItemMap[item.item_id] = item.item_id;
                }
            }

            if (order.order_type === _this.enums.OrderType.PREORDER && order.is_aa) {
                returnBody.is_aa = order.is_aa;
                returnBody.tableNo = order.tableNo;
                returnBody.payment_aa = order.payment_aas.find(paymentAA => {
                    return paymentAA.user_id === userId;
                });
                returnBody.payment_aa_remain = order.payment_aa_remain;
                returnBody.close_time = order.close_time;
                returnBody.note = order.note;
                if (userId === order.user.user_id) {
                    returnBody.payment_aa_reward_amount = order.payment_aa_reward ? order.payment_aa_reward.initiator_amount : 0;
                } else {
                    returnBody.payment_aa_reward_amount = order.payment_aa_reward ? order.payment_aa_reward.invitee_amount : 0;
                }

                returnBody.customers = order.customers;

                let unpaidNumber = 0;
                order.customers.forEach(customer => {
                    if (customer.payment_status === 'UNPAID') {
                        unpaidNumber++;
                    }
                });

                returnBody.payment_aa_unpaid_num = unpaidNumber;

                if (order.picked_up) {
                    returnBody.picked_up = order.picked_up;
                    returnBody.picked_up_time = order.picked_up_time;
                    returnBody.redeemed_time = order.redeemed_time;
                }
            }

            apiResult = {status: 200, data: returnBody};
            nextstep();
        }
    ], function (error) {
        if (error) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Comment.GetOrderItemsComments step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Comment.GetOrderItemsComments step-(right) callback'});
        }

        callback(error, apiResult);
    });
}

var GetCurrentOrder = function (userId, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetCurrentOrder received arguments:', userId: userId });

    var apiResult = '';

    var order = {};
    var orderItemsRecord = 0;

    async.series([
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetCurrentOrder step-1 doFindOrder,', userId: userId});

            var selector = {$and: [
                {'$or': [{'customers.userId': userId }, {'customers.user_id': userId}]},
                {archived: {$ne: true}},
                {"come_from":{$ne:'WECHAT'}},
                {status: {$in: [_this.enums.OrderStatus.INPROCESS, _this.enums.OrderStatus.SUBMITTED]}}
            ]};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetCurrentOrder step-1 doFindOrder returns an error'});
                    nextstep(new _this.httpExceptions.InvalidParameterException('user_id', userId));
                } else if (result == null || result == undefined || result.length == 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetCurrentOrder step-1 doFindOrder returns empty'});
                    callback(null, {status: 200, data: {}});
                } else {
                    order = result[0];

                    if (order.order_items) {
                        for (var i=0; i<order.order_items.length; i++) {
                            var orderItem = order.order_items[i];
                            orderItemsRecord += orderItem.quantity ? orderItem.quantity : 1;
                        }
                    }

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetCurrentOrder step-1 doFindOrder returns right'});
                    nextstep();
                }
            })
        },
        // step-2: doFindTable
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetCurrentOrder step-2 doFindTable,', userId: userId});

            var selector = {_id: order.restaurantId};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.RESTAURANT};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetCurrentOrder step-2 doFindTable returns an error'});
                    nextstep(new _this.httpExceptions.InvalidParameterException('user_id', userId));
                } else if (result == null || result == undefined || result.length == 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetCurrentOrder step-2 doFindTable returns empty'});
                    callback(null, {status: 200, data: {}});
                } else {
                    var restaurant = result[0];

                    var orderTable = {};

                    for (var i=0; i<restaurant.tables.length; i++) {
                        var table = restaurant.tables[i];

                        if (table.tableId == order.tableId) {
                            orderTable = table;
                            break;
                        }
                    }

                    var returnBody = {};
                    returnBody.order_id = order._id;
                    returnBody.status = order.status;
                    returnBody.restaurant = {restaurant_id: order.restaurant.restaurant_id, restaurant_name: order.restaurant.restaurant_name};
                    returnBody.table = {table_id: order.tableId, table_no: orderTable.tableNo};
                    returnBody.order_items_record = orderItemsRecord;

                    returnBody.order_type = _this.orderManager.getOrderType(order);

                    apiResult = {status: 200, data: returnBody};

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetCurrentOrder step-2 doFindTable returns right'});
                    nextstep();
                }
            })
        }
    ], function (error) {
        if (error) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Comment.GetCurrentOrder step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Comment.GetCurrentOrder step-(right) callback'});
        }

        callback(error, apiResult);
    });
}

var CloseOrderAsPaid = function (userId, orderId, headerToken, otherServer, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrderAsPaid received arguments:', userId: userId, orderId: orderId});

    var apiResult = '';

    var user = {};
    var order = {};

    async.series([
        // step-1: doFindUser
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-1 doFindUser', userId: userId});

            var loggerInfos = {
                function : 'Order.CloseOrderAsPaid step-1 doFindUser'
            };

            _this.getUserInfo(userId, otherServer, headerToken, function (error, result) {
                if(error){
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-1 doFindUser returns an error', userId: userId});
                    nextstep(new _this.httpExceptions.InvalidParameterException( 'userId', userId));
                }else if(result == null || result == undefined || result.length == 0){
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-1 doFindUser returns empty', userId: userId});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException( 'userId', userId));
                } else {
                    user = result;

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-1 doFindUser returns right'});
                    nextstep();
                }
            }, reqParams, loggerInfos);
        },
        // step-2: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrderAsPaid step-2 doFindOrder,', orderId: orderId});

            var selector = {_id: orderId};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if(error){
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-2 doFindOrder returns an error', orderId: orderId});
                    nextstep(new _this.httpExceptions.InvalidParameterException( 'orderId', orderId));
                }else if(result == null || result == undefined || result.length == 0){
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-2 doFindOrder returns empty', orderId: orderId});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException( 'orderId', orderId));
                } else {

                    order = result[0];

                    if (order.status == _this.enums.OrderStatus.PAID || order.status == _this.enums.OrderStatus.CLOSED || order.status == _this.enums.OrderStatus.CANCELLED) {
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-2 doFindOrder returns error', orderId: orderId});
                        nextstep(new _this.httpExceptions.DataConflictedException('ORDER_COMPLETED', orderId));
                    } else {
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-2 doFindOrder returns right'});
                        nextstep();
                    }

                }
            });
        },
        // step-3: dpFindRestaurant
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrderAsPaid step-3 dpFindRestaurant,'});

            var restaurantId = order.restaurant.restaurant_id || order.restaurantId || '';

            var selector = {_id: restaurantId};
            var options = {};
            var helper = {collectionName: 'restaurant'};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if(error){
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-3 dpFindRestaurant returns an error', restaurantId: restaurantId});
                    nextstep(new _this.httpExceptions.InvalidParameterException( 'restaurantId', restaurantId));
                }else if(result == null || result == undefined || result.length == 0){
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-3 dpFindRestaurant returns empty', restaurantId: restaurantId});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException( 'restaurantId', restaurantId));
                } else {

                    var restaurant = result[0];

                    if (!restaurant.sharedServerMode) {
                        var isServerRight = false;

                        var tableId = order.tableId;
                        for (var i=0; i<restaurant.tables.length; i++) {
                            var table = restaurant.tables[i];

                            if (tableId == table.tableId) {

                                var servers = table.servers;
                                if (isNotNull(servers)) {
                                    for (var j=0; i< servers.length; j++) {
                                        var server = servers[j];
                                        if (userId == server.userId) {
                                            isServerRight = true;
                                            break;
                                        }
                                    }

                                    if (isServerRight) {
                                        break;
                                    }
                                }
                            }
                        }

                        if (!isServerRight) {
                            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-3 dpFindRestaurant returns error'});
                            nextstep(new _this.httpExceptions.InvalidParameterException( 'SERVER_NOT_IN_RESTAURANT', userId) );
                        } else {
                            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-3 dpFindRestaurant returns right'});
                            nextstep();
                        }
                    } else {
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-3 dpFindRestaurant returns right'});
                        nextstep();
                    }

                }
            });
        },
        // step-4: doValidateUser
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrderAsPaid step-4 doValidateUser,', userId: userId});

            var restaurantId = order.restaurant.restaurant_id || order.restaurantId || '';

            var restaurant = 'D-' + restaurantId;

            if (isNotNull(user.roles) && isNotNull(user.roles[restaurant])) {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-4 doValidateUser returns right', userId: userId});
                nextstep();
            } else {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-4 doValidateUser returns error', userId: userId});
                nextstep(new _this.httpExceptions.DataConflictedException('SERVER_NOT_IN_RESTAURANT', userId));
                nextstep();
            }
        },
        // step-5: doGetBill
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrderAsPaid step-5 doGetBill,', orderId: orderId, userId: userId});

            var reqParams = {
                orderId: orderId,
                userId: userId,
                isServer: true,
                useBlueDollars: false,
                buyBlueDollars: false,
                useGoldDollars: false,
                isOnlinePayment: false,
                headerToken: headerToken,
                otherServers: otherServers,
                isResponseForV1: true
            };

            _this.getBillByOrderId(reqParams, function (error, result) {
                if (error) {
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-4 doGetBill returns error', error: error});
                    nextstep(new _this.httpExceptions.InvalidParameterException('ORDER_GET_BILL_ERROR', orderId));
                } else {
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrderAsPaid step-4 doGetBill returns right', orderId: orderId});
                    nextstep();
                }
            })
        },
        // step-6: doUpdateStatus
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrderAsPaid step-6 doUpdateStatus,', orderId: orderId});

            var selector = {_id: orderId};

            var document = {};
            document = {$set: {status: _this.enums.OrderStatus.CLOSED, 'billStatus.status': _this.enums.OrderStatus.PAID, 'bill_status.status': _this.enums.OrderStatus.PAID}};

            var options = {};
            var helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS };

            _this.restaurantDataAPI.update(selector, document, options, helper, function (error) {
                if(error){
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrderAsPaid step-6 doUpdateStatus returns an error', error: error});
                    nextstep(new _this.httpExceptions.InvalidParameterException('orderId',orderId));
                } else {
                    apiResult = {status: 204};

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrderAsPaid step-6 doUpdateStatus returns right'});
                    nextstep();
                }
            });
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-INFO: Comment.CloseOrderAsPaid step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Comment.CloseOrderAsPaid step-(right) callback'});
        }

        callback(error, apiResult);
    });
};

var GetUserInfo = function (userIds, otherServers, headerToken, callback, reqParams, loggerInfos) {
    var _this = exports;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetUserInfo received parameters', userIds: userIds});

    var options = {
        host: otherServers.oauth.server_url,
        port: otherServers.oauth.server_port,
        path: '/v1/users/' + userIds,
        method: 'GET',
        headers:{
            'content-type': 'application/json'
        }

    }

    if(headerToken){
        options.headers.authorization = headerToken;
    }

    if (reqParams && loggerInfos) {
        options.reqParams = reqParams;
        options.loggerInfos = loggerInfos;
    }

    options.serviceName = _this.config.other_servers.oauth.server_name;

    _this.orderManager.sendToOtherServer(options, function (error, result) {
        if (error) {
            _this.logger.error('%j', {
                function: 'DEBUG-ERROR: Order.GetUserInfo returns error',
                error: error,
                options: options
            });
            callback(error, []);
        } else {

            if (result === null || result === undefined || result === '' || result.length === 0) {
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order.GetUserInfo returns empty',
                    options: options
                });
                callback(null, []);
            } else {
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order.GetUserInfo returns right',
                    result: JSON.stringify(result),
                    options: options
                });
                callback(null, result);
            }
        }
    });

};

var GetPrintedFlags = function(orderId, isIncludeAll, callback) {
    var _this = exports;
    var selector = { _id: orderId };
    var options = {};
    var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: GetPrintedFlags()' };

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order.GetPrintedFlags received arguments:',
        orderId: orderId,
        isIncludeAll: isIncludeAll
    });

    options.fields = isIncludeAll ? { 'order_items.order_item_id': 1, 'order_items.chit_printed': 1, receipt_printed: 1 } : { receipt_printed: 1 };
    _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
        if(error) {
            _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetPrintedFlags query order error', selector: selector, options: options, helper: helper, error: error});
            callback(new _this.httpExceptions.InvalidParameterException('orderId',orderId));
        }else if(!result || !Array.isArray(result) || result.length === 0) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetPrintedFlags the order not found', orderId: orderId});
            callback(new _this.httpExceptions.ResourceNotFoundException( 'orderId', orderId));
        } else {
            var order = result[0];
            delete order._id;
            var api_result = {status: 200, data: order};
            _this.logger.info('%j', {
                function:'DEBUG-INFO: Comment.GetPrintedFlags success',
                apiresult: api_result
            });
            callback(null, api_result);
        }
    })
}

var GetChitPrintedFlags = function(orderItemIds, callback) {
    var _this = exports;
    var selector = { 'order_items.order_item_id': {$in: orderItemIds} };
    var options = {};
    var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: GetChitPrintedFlags()' };

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order.GetChitPrintedFlags received arguments:',
        orderItemIds: orderItemIds
    });

    options.fields = {'order_items.order_item_id': 1, 'order_items.chit_printed': 1, _id: 0};

    var orderItemIdMap = {};
    async.waterfall([
        function(nextstep) {
            if(orderItemIds.length !== 0) {
                _this.orderManager.checkIdsAreValidUUIDs(orderItemIds, function (error) {
                    if (error) {
                        callback(error);
                    } else {
                        orderItemIds.forEach(function(item) {
                            orderItemIdMap[item] = item;
                        })
                        nextstep();
                    }
                });
            } else {
                callback(new _this.httpExceptions.InvalidParameterException('The parameter `order_item_id` is empty', orderItemIds));
            }
        },
        function(nextstep) {
            _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
                if(error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetChitPrintedFlags query order error', selector: selector, options: options, helper: helper, error: error});
                    callback(new _this.httpExceptions.InvalidParameterException('order_item_id',orderItemIds));
                }else if(!result || !Array.isArray(result) || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetChitPrintedFlags the order items not found', order_item_id: orderItemIds});
                    callback(new _this.httpExceptions.ResourceNotFoundException( 'order_item_id', orderItemIds));
                } else {
                    var orders = result;
                    var orderItems = [];
                    orders.forEach(function(order) {
                        var order_items = order.order_items;
                        if(order_items && order_items.length > 0) {
                            order_items.forEach(function(order_item){
                                if(orderItemIdMap[order_item.order_item_id]) {
                                    orderItems.push(order_item);
                                }
                            })
                        }
                    })
                    var api_result = { status: 200, data: orderItems };
                    _this.logger.info('%j', {
                        function:'DEBUG-INFO: Comment.GetChitPrintedFlags success',
                        apiresult: api_result
                    });
                    callback(null, api_result);
                }
            })
        }
    ], function(error, result) {
        callback(error, result);
    })

}

var UpdateReceiptPrintedFlag = function(orderId, printedFlag, callback) {
    var _this = exports;
    var selector = { _id: orderId };
    var options = {};
    var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: UpdateReceiptPrintedFlag()' };

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order.UpdateReceiptPrintedFlag received arguments: ',
        orderId: orderId,
        printedFlag: printedFlag
    });

    if(printedFlag === undefined ||  !PRINTEDFLAG.hasOwnProperty(printedFlag.toUpperCase())) {
        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.UpdateChitPrintedFlag invalid printed flag ', printedFlag: printedFlag});
        callback(new _this.httpExceptions.InvalidParameterException('printed_flag is invalid', printedFlag));
    } else {
        async.waterfall([
            function(nextstep) {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateReceiptPrintedFlag step-1 doQueryOrder', orderId: orderId});
                var options = {fields: { receipt_printed: 1 }};
                _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
                    if(error) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.UpdateReceiptPrintedFlag query order error', selector: selector, options: options, helper: helper, error: error});
                        callback(new _this.httpExceptions.InvalidParameterException('orderId',orderId));
                    }else if(!result || !Array.isArray(result) || result.length === 0) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateReceiptPrintedFlag the order not found', orderId: orderId});
                        callback(new _this.httpExceptions.ResourceNotFoundException( 'orderId', orderId));
                    } else {
                        var order = result[0];
                        if(order.receipt_printed === true) {
                            _this.logger.error('%j', {
                                function: 'DEBUG-ERROR: Order.UpdateReceiptPrintedFlag can\'t update printed flags since the receipt in the order has been printed',
                                printedFlag: printedFlag,
                                orderId: orderId
                            });
                            callback(new _this.httpExceptions.DataConflictedException( 'Can\'t update printed flags since the receipt in the order has been printed', orderId));
                        } else {
                            nextstep();
                        }
                    }
                })
            },
            function(nextstep) {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateReceiptPrintedFlag step-2 doUpdatePrintedFlag', orderId: orderId});
                var document = { $set: {'receipt_printed': PRINTEDFLAG[printedFlag.toUpperCase()]}};
                _this.restaurantDataAPI.update(selector, document, options, helper, function(error, result) {
                    if(error){
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateReceiptPrintedFlag step-2 doUpdatePrintedFlag returns an error', document: document, error: error});
                        callback(new _this.httpExceptions.InvalidParameterException('orderId', orderId));
                    } else {
                        var apiResult = {status: 204};
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateReceiptPrintedFlag step-2 doUpdatePrintedFlag returns right'});
                        callback(null, apiResult);
                    }
                });
            }
        ], function(error, result) {
            callback(error, result);
        })
    }
}

var UpdateChitPrintedFlag = function(orderItemId, printedFlag, callback) {
    var _this = exports;
    var selector = { 'order_items.order_item_id': orderItemId };
    var options = {};
    var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: UpdateChitPrintedFlag()' };

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order.UpdateChitPrintedFlag received arguments:',
        orderItemId: orderItemId,
        printedFlag: printedFlag
    });

    if(printedFlag === undefined ||  !PRINTEDFLAG.hasOwnProperty(printedFlag.toUpperCase())) {
        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.UpdateChitPrintedFlag invalid printed flag ', printedFlag: printedFlag});
        callback(new _this.httpExceptions.InvalidParameterException('printed_flag is invalid', printedFlag));
    } else {
        async.waterfall([
            function(nextstep) {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateChitPrintedFlag step-1 doQueryOrder', orderItemId: orderItemId});
                var options = { fields: { 'order_items.order_item_id': 1, 'order_items.chit_printed': 1, 'orderItems.order_item_id' : 1} };
                _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
                    if(error) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.UpdateChitPrintedFlag query order item error', selector: selector, options: options, helper: helper, error: error});
                        callback(new _this.httpExceptions.InvalidParameterException('orderItemId',orderItemId));
                    }else if(!result || !Array.isArray(result) || result.length === 0) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateChitPrintedFlag the order item not found', orderItemId: orderItemId });
                        callback(new _this.httpExceptions.ResourceNotFoundException( 'orderItemId', orderItemId));
                    } else {
                        var order = result[0];
                        var order_items = order.order_items;
                        var old_order_item;
                        for(var i = 0;i < order_items.length; i++) {
                            var item  = order_items[i];
                            if(item.order_item_id === orderItemId) {
                                old_order_item = item;
                                break;;
                            }
                        }
                        if(old_order_item && old_order_item.chit_printed === true) {
                            _this.logger.error('%j', {
                                function: 'DEBUG-ERROR: Order.UpdateChitPrintedFlags can\'t update printed flags since the chit in the order item has been printed',
                                orderItemId: orderItemId
                            });
                            callback(new _this.httpExceptions.DataConflictedException( 'Can\'t update printed flags since the chit in the order item has been printed', orderItemId));
                        } else {
                            nextstep();
                        }
                    }
                })
            },
            function(nextstep) {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateChitPrintedFlag step-2 doUpdateChitPrintedFlag', orderItemId: orderItemId });
                var document = { '$set': { 'order_items.$.chit_printed':PRINTEDFLAG[printedFlag.toUpperCase()], 'orderItems.$.chit_printed':PRINTEDFLAG[printedFlag.toUpperCase()] }};
                _this.restaurantDataAPI.update(selector, document, options, helper, function(error, result) {
                    if(error) {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateChitPrintedFlag step-2 doUpdateChitPrintedFlag returns an error', document: document, error: error});
                        callback(new _this.httpExceptions.InvalidParameterException('orderItemId', orderItemId));
                    } else {
                        var apiResult = { status: 204 };
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateChitPrintedFlag step-2 doUpdateChitPrintedFlag returns right'});
                        callback(null, apiResult);
                    }
                });
            }
        ], function(error, result) {
            callback(error, result);
        })
    }
}

var UpdateChitPrintedFlags = function(orderItemIds, printedFlag, callback) {
    var _this = exports;
    var selector = { 'order_items.order_item_id': {$in: orderItemIds } };
    var options = {};
    var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: UpdateChitPrintedFlags()' };

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order.UpdateChitPrintedFlags received arguments:',
        orderItemIds: orderItemIds,
        printedFlag: printedFlag
    });

    var orderItemIdMap = {};
    if(printedFlag === undefined ||  !PRINTEDFLAG.hasOwnProperty(printedFlag.toUpperCase())) {
        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.UpdateChitPrintedFlags invalid printed flag ', printedFlag: printedFlag});
        callback(new _this.httpExceptions.InvalidParameterException('printed_flag is invalid', printedFlag));
    } else {
        async.waterfall([
            function(nextstep) {
                if(orderItemIds.length !== 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateChitPrintedFlags step-1: Validate all `order_item_id`' });
                    _this.orderManager.checkIdsAreValidUUIDs(orderItemIds, function (error) {
                        if (error) {
                            callback(error);
                        } else {
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateChitPrintedFlags end-of-step-1: Validate all `order_item_id`' });
                            orderItemIds.forEach(function(item) {
                                orderItemIdMap[item] = item;
                            })
                            nextstep();
                        }
                    });
                } else {
                    callback(new _this.httpExceptions.InvalidParameterException('The parameter `order_item_id` is empty', orderItemIds));
                }
            },
            function(nextstep) {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateChitPrintedFlags step-2 doQueryOrder', orderItemIds: orderItemIds});
                var options = { fields: { 'order_items': 1 , 'orderItems': 1} };
                _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
                    if(error) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.UpdateChitPrintedFlags query order item error', selector: selector, options: options, helper: helper, error: error});
                        callback(new _this.httpExceptions.InvalidParameterException('orderItemIds',orderItemIds));
                    }else if(!result || !Array.isArray(result) || result.length === 0) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateChitPrintedFlags the order item not found', orderItemIds: orderItemIds });
                        callback(new _this.httpExceptions.ResourceNotFoundException( 'orderItemIds', orderItemIds));
                    } else {
                        nextstep(null, result);
                    }
                })
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateChitPrintedFlags step-2 doQueryOrder success', orderItemIds: orderItemIds});
            },
            function(orders, nextstep) {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateChitPrintedFlags step-3 doUpdateChitPrintedFlags', orderItemIds: orderItemIds });
                if(orders.length > 0 ) {
                    var chitPrintedFlag = PRINTEDFLAG[printedFlag.toUpperCase()];
                    async.each(orders, function(order, cb) {
                        var orderItems = order.orderItems;
                        var order_items = order.order_items;
                        orderItems.forEach(function(item) {
                            if(orderItemIdMap[item.order_item_id]) {
                                item.chit_printed = chitPrintedFlag;
                            }
                        });
                        order_items.forEach(function(item) {
                            if(orderItemIdMap[item.order_item_id]) {
                                item.chit_printed = chitPrintedFlag;
                            }
                        });
                        var criteria = { _id: order._id }
                        var document = { '$set': { 'order_items':order_items, 'orderItems': orderItems}};
                        _this.restaurantDataAPI.update(criteria, document, options, helper, function(error, result) {
                            if(error) {
                                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateChitPrintedFlags step-3 doUpdateChitPrintedFlags returns an error', document: document, error: error});
                                cb(error);
                            } else {
                                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateChitPrintedFlags step-3 doUpdateChitPrintedFlags returns right'});
                                cb();
                            }
                        });
                    }, function(error) {
                        if (error) {
                            _this.logger.info('%j', {
                                function: 'DEBUG-INFO: Order.UpdateChitPrintedFlags `async.each` update flag error in order',
                                orders: orders
                            });
                            callback(error);
                        } else {
                            var apiResult = {status: 204};
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateChitPrintedFlags async step-3: doUpdateChitPrintedFlags completed', apiResult: apiResult });
                            callback(null, apiResult);
                        }
                    });
                }
            }
        ], function(error, result) {
            callback(error, result);
        })
    }
}

var GetReservation = function (reservationId, otherServers, headerToken, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation received arguments:', reservationId: reservationId});

    var orderBody = {};

    var apiResult = '';

    var reservation = {};
    var preOrder = {};
    var restaurant= {};
    var user = {};

    async.series([
        // step-1: doFindReservation
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-1 doFindReservation,', reservationId: reservationId});

            var selector = {_id: reservationId};
            var options = {};
            var helper = {collectionName: 'reservation'};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-1 doFindReservation returns an error'});
                    nextstep(new _this.httpExceptions.InvalidParameterException('reservation_id', reservationId));
                } else if (result == null || result == undefined || result.length == 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-1 doFindReservation returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('reservation_id', reservationId));
                } else {
                    reservation = result[0];

                    if (reservation.isReservation) {
                        if (reservation.status && (_this.enums.OrderStatus.INPROCESS == reservation.status || _this.enums.OrderStatus.SUBMITTED == reservation.status)) {
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-1 doFindReservation returns right'});
                            nextstep();
                        } else {
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-1 doFindReservation returns error'});
                            nextstep(new _this.httpExceptions.DataConflictedException('reservation_id', 'the reservation has been canceld or closed'));
                        }
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-1 doFindReservation returns error'});
                        nextstep(new _this.httpExceptions.DataConflictedException('reservation_id', 'the reservation has not been confirmed'));
                    }

                }
            });
        },
        // step-2: doFindPreOrder
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-2 doFindPreOrder,', reservation_id: reservationId});

            var selector = {reservation_id: reservationId};
            var options = {};
            var helper = {collectionName: 'pre-orders'};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-2 doFindPreOrder returns an error'});
                    nextstep(new _this.httpExceptions.InvalidParameterException('reservation_id', reservationId));
                } else if (result == null || result == undefined || result.length == 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-2 doFindPreOrder returns empty'});
                    nextstep();
                } else {
                    preOrder = result[0];

                    if (_this.enums.OrderStatus.SUBMITTED != preOrder.status) {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-2 doFindPreOrder returns error'});
                        nextstep(new _this.httpExceptions.DataConflictedException('status', 'the pre-order has not been submitted'));
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-2 doFindPreOrder returns right'});
                        nextstep();
                    }

                }
            });
        },
        // step-4: doFindOwner
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-4 doFindOwner,', userId: reservation.userId});

            _this.getUserNameAndAvatar(reservation.userId, otherServers, headerToken, true, function (error, userResult) {
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-4 doFindOwner returns an error'});
                    nextstep(new _this.httpExceptions.DataConflictedException('useraccount', 'error'));
                } else if (userResult && userResult.length >0) {
                    user.user_id = reservation.userId;
                    user.user_name = userResult[0].dispName;
                    user.avatar_path = userResult[0].avatarPath?userResult[0].avatarPath:'';

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-4 doFindOwner returns right'});
                    nextstep();
                } else {

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-4 doFindOwner returns error'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('user_id', reservation.userId));
                }
            })
        },
        // setp-5: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-5 doFindOrder,', userId: reservation.userId});

            var selector = {'$and': [
                {'$or': [{ 'user.user_id': reservation.userId }, { 'customers.userId': reservation.userId }]},
                {status: {'$in': [_this.enums.OrderStatus.INPROCESS, _this.enums.OrderStatus.SUBMITTED]}}
            ]};

            var options = {};
            var helper = {collectionName: 'dining-orders'};

            _this.restaurantDataAPI.find(selector, options, helper,function(error, result){
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-5 doFindOrder returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('dining-orders', 'error'));
                }else if (result !== null && result !== '' && result.length !==0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-5 doFindOrder returns not empty'});
                    nextstep(new _this.httpExceptions.CommonHttpErrorException('ORDER_STILL_OPEN', 'orderId', 'the order should be closed before user(' + reservation.userId + ') create new order'));
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-5 doFindOrder returns right'});
                    nextstep();
                }
            });
        },
        // step-7: doDeleteReservation
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-7 doDeleteReservation,' });

            var selector = {_id: reservationId};
            var document = {$set : {status: _this.enums.OrderStatus.CLOSED}};
            var options = {};
            var helper = {collectionName: 'reservation'};

            _this.restaurantDataAPI.update(selector, document, options, helper, function (error) {
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-7 doDeleteReservation returns an error'});
                    nextstep(new _this.httpExceptions.DataConflictedException('reservation', 'error'));
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-7 doDeleteReservation returns right'});
                    nextstep();
                }
            })
        },
        // step-8: doDeletePreOrder
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-8 doDeletePreOrder,' });

            var selector = {_id: preOrder._id};
            var document = {$set: {status: _this.enums.OrderStatus.CLOSED}};
            var options = {};
            var helper = {collectionName: 'pre-orders'};

            _this.restaurantDataAPI.update(selector, document, options, helper, function (error) {
                if (error) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-8 doDeletePreOrder returns an error'});
                    nextstep(new _this.httpExceptions.DataConflictedException('pre-orders', 'error'));
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Reservation.CompleteReservation step-8 doDeletePreOrder returns right'});
                    nextstep();
                }
            })
        },
        // step-9: doPopulateData
        function (nextstep) {

            var backBody = {};
            backBody.user = user;
            backBody.order_items = preOrder.order_items;

            apiResult = backBody;

            nextstep();
        }
    ], function (error) {
        if (error) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Reservation.CompleteReservation step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Reservation.CompleteReservation step-(right) callback'});
        }

        callback(error, apiResult);
    });

}

//-- FBE-1615: v2 Update Order - add order items - per unit price
var AddOrderItemsAnyTypeOfPrice = function(addOrderItemsPerUnitPriceParams, callback) {
    var _this = exports;
    var orderId = addOrderItemsPerUnitPriceParams.orderId,
        userId = addOrderItemsPerUnitPriceParams.userId,
        isServer = addOrderItemsPerUnitPriceParams.isServer,
        jsonBody = addOrderItemsPerUnitPriceParams.jsonBody,
        currentTime = _this.dataGenerationHelper.getValidUTCDate(),
        restaurantId, tableId, currentBatchNo, orderStatus,
        servers = [], menuItemIds = [], orderItems = jsonBody.order_items,
        order = {}, customer = {}, apiResult = {}, menuMap = {}, selector = {}, options = {}, helper = {};

    _this.logger.info('%j', { function: 'Order.AddOrderItemsAnyTypeOfPrice received arguments',
        orderId: orderId, jsonBody: jsonBody });

    async.waterfall([

        //-- Step-01: Validate all `menu_item_id`
        function (nextstep) {

            for (var i in orderItems) {
                var orderItem = orderItems[i];
                if (orderItem.menu_item_id && orderItem.menu_item_id !== '') {
                    menuItemIds.push(orderItem.menu_item_id);
                } else {
                    nextstep(new _this.httpExceptions.InvalidParameterException('menu_item_id', orderItem.menu_item_id));
                }
            }
            _this.orderManager.checkIdsAreValidUUIDs(menuItemIds, function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    nextstep();
                }
            });
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemByOrderId end-of-step-01: Validate all `order_item_id`' });
        },

        //-- Step-02: Get Customer Information
        function (nextstep) {

            if (isServer) {
                nextstep();
            } else {
                getCustomerInfo( userId, orderId, function (error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        customer = result;
                        nextstep();
                    }
                });
            }
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.AddOrderItemsAnyTypeOfPrice end-of-step-02: Get Customer Information ' });
        },

        //-- Step-03: Retrieve the `order`
        function (nextstep) {

            selector = {_id: orderId};
            options = {};
            helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: AddOrderItemsAnyTypeOfPrice()' };

            _this.restaurantDataAPI.find(selector, options, helper,function (error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException(_this.enums.CollectionName.DINING_ORDERS + '_id', orderId));
                } else {
                    order = result[0];
                    orderStatus = result[0].order_status;
                    if (orderStatus === _this.enums.OrderStatus.CANCELLED) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has already been canceled', orderId));
                    } else if (status === _this.enums.OrderStatus.CLOSED) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has already been closed', orderId));
                    } else {
                        restaurantId = order.restaurant.restaurant_id;
                        servers = result[0].servers;
                        tableId = result[0].table_id;
                        nextstep();
                    }
                }
            });
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.AddOrderItemsAnyTypeOfPrice end-of-step-03: Retrieve the `order` ' });
        },

        //-- Step-04: Validate Menu Item IDs
        function (nextstep) {

            var menu = {};

            selector = {_id: {$in: menuItemIds}, 'restaurant.restaurant_id': restaurantId};
            options = {};
            helper = { collectionName: _this.enums.CollectionName.MENU, callerScript: 'File: order.js; Method: AddOrderItemsAnyTypeOfPrice()' };

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('menuItemIds', menuItemIds));
                } else {

                    menu = result;

                    for (var i=0; i<menu.length; i++) {
                        menuMap[menu[i]._id] = menu[i];
                    }

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.AddOrderItemsAnyTypeOfPrice end-of-step-04 ' });
                    nextstep();
                }
            });
        },

        //-- Step-05: Append `order_item_id`, `submission_time`, `order_item_batch_no`
        function (nextstep) {

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.AddOrderItemsAnyTypeOfPrice orderItems to be saved', orderItems: orderItems });

            var orderItem = {}, modifiedOrderItems = [], saveOrderItemResult = [];
            currentBatchNo = order.current_batch_number + 1;
            for (var j=0; j<orderItems.length; j++) {
                orderItem = _this.backendHelpers.jsonHelper().cloneDocument(orderItems[j]);

                orderItem.order_item_id = _this.dataGenerationHelper.generateUUID();
                orderItem.order_item_user_id = userId;

                //-- FBE-1180: [Orders] Fix the missing 'order_item_batch_no' and 'submission_time' implementation from FBE-292
                orderItem.submission_time = currentTime;
                orderItem.order_item_batch_number = currentBatchNo;

                orderItem.order_item_user_name = customer.user_name || '';
                orderItem.order_item_user_avatar_path = customer.avatar_path || '';

                //-- FBE-1285: Forward-compatibility: Enhance Existing Add Order Item API to append new attributes
                orderItem.menu_item_rating = menuMap[orderItem.menu_item_id].rating || 0;
                var photos = menuMap[orderItem.menu_item_id].photos;
                if (isNotNull(photos)) {
                    for (var k=0; k<photos.length; k++) {
                        var photo = photos[k];
                        if (photo.size == 'large') {
                            orderItem.menu_item_photo = photo.path || '';
                            break;
                        }
                    }
                } else {
                    orderItem.menu_item_photo = '';
                }
                //-- Added by Webber.Wang for FBE-1443 on 2015-08-12
                if(orderItem.menu_item_name === null || orderItem.menu_item_name === undefined || orderItem.menu_item_name ===''){
                    if( menuMap[orderItem.menu_item_id].short_names && menuMap[orderItem.menu_item_id].short_names.length>0){
                        orderItem.menu_item_name = menuMap[orderItem.menu_item_id].short_names[0].name;
                    } else if ( menuMap[orderItem.menu_item_id].short_names && menuMap[orderItem.menu_item_id].short_names.length>0){
                        orderItem.menu_item_name = menuMap[orderItem.menu_item_id].long_names[0].name;
                    } else{
                        orderItem.menu_item_name = '';
                    }
                }

                if(orderItem.category ===null || orderItem.category === undefined || orderItem.category === ''){
                    orderItem.category = menuMap[orderItem.menu_item_id].category
                }

                orderItem.chit_printed = false;

                modifiedOrderItems.push(orderItem);
                saveOrderItemResult.push( {
                    order_item_id: orderItem.order_item_id,
                    menu_item_id: orderItem.menu_item_id
                });
            };
            var criteria = {_id: orderId},
                document = {
                    $push: { order_items: {$each: modifiedOrderItems}},
                    $set: {current_batch_number: currentBatchNo, update_time: currentTime, last_submission_time: currentTime}
                },
                options = {},
                helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: AddOrderItemsAnyTypeOfPrice()' };

            _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                if (error) {
                    nextstep(error);
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.AddOrderItemsAnyTypeOfPrice end-of-step-05: Append `order_item_id`, `submission_time`, `order_item_batch_no` ' });
                    apiResult = {status: 204, data : { result :  saveOrderItemResult } };
                    callback(null, apiResult);
                }
            });

        }

    ], function (error) {
        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.AddOrderItemsAnyTypeOfPrice `error` callback ', error: error });
        callback(error, null);
    });

};

var GetSingleOrderDetails = function(getSingleOrderDetailsParams, callback) {
    var _this = exports;
    var orderId = getSingleOrderDetailsParams.orderId,
        isServer = getSingleOrderDetailsParams.isServer,
        currentTime = _this.dataGenerationHelper.getValidUTCDate(),
        restaurantId, tableId, currentBatchNo, orderStatus,
        servers = [], menuItemIds = [],order_items=[],
        order = {}, customer = {}, apiResult = {}, menuMap = {}, selector = {}, options = {}, helper = {};

    _this.logger.info('%j', { function: 'Order.GetSingleOrderDetails received arguments',
        orderId: orderId, isServer: isServer });

    async.series([
        //--Step-01:query the order by orderId
        function(nextstep){
            selector = {_id: orderId};
            options = {};
            helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: GetSingleOrderDetails()' };

            _this.restaurantDataAPI.find(selector, options, helper,function (error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException(_this.enums.CollectionName.DINING_ORDERS + '_id', orderId));
                } else {
                    order.restaurant_id = result[0].restaurant.restaurant_id;
                    order.restaurant_name = result[0].restaurant.restaurant_name;
                    order.restaurant_logo = result[0].restaurant.restaurant_logo;
                    order.restaurant_rating = result[0].restaurant.restaurant_rating;
                    order.create_time = result[0].create_time;
                    order.submit_time = result[0].submit_time;
                    order.update_time = result[0].update_time;
                    order.orderId = result[0]._id;
                    order.order_items=[];
                    order_items = result[0].order_items;
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetSingleOrderDetails end-of-step-01: Retrieve the `order` ',new_order:order,order_items:order_items });
                    nextstep();
                }
            });

        },
        //-- Step-02: retrieve all menu-item-comments
        function (nextstep) {

            for (var i=0;i< order_items.length;i++) {
                var orderItem = order_items[i];
                if (orderItem.item_id && orderItem.item_id !== '') {
                    menuItemIds.push(orderItem.item_id);
                }
                if(orderItem.itemId && orderItem.itemId !== ''){
                    menuItemIds.push(orderItem.itemId);
                }
            }
            selector = {'menu_item.menu_item_id': {$in: menuItemIds},order_id:orderId, 'restaurant.restaurant_id': order.restaurant_id};
            options = {};
            helper = { collectionName: _this.enums.CollectionName.MENU_COMMENT, callerScript: 'File: order.js; Method: GetSingleOrderDetails()' };

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('menuItemIds', menuItemIds));
                } else {

                    var comments= result;
                    var order_item={};
                    for (var j=0; j< order_items.length;j++) {
                        order_item={};
                        order_item.order_item_id = order_items[j].order_item_id;
                        order_item.order_item_user_id = order_items[j].order_item_user_id;
                        order_item.order_item_user_name = order_items[j].order_item_user_name;
                        order_item.order_item_user_avatar_path = order_items[j].order_item_user_avatar_path;
                        if (orderItem.item_id && orderItem.item_id !== '') {
                            order_item.menu_item_id = order_items[j].item_id;
                            order_item.menu_item_name = order_items[j].item_name;
                        } else {
                            order_item.menu_item_id = order_items[j].itemId;
                            order_item.menu_item_name = order_items[j].itemName;
                        }
                        order_item.menu_item_photo = '';
                        order_item.menu_item_average_rating = order_items[j].menu_item_rating;
                        order_item.submission_time = order_items[j].submission_time;
                        order_item.comment  ={};
                        for( var i=0; i<comments.length; i++){
                            if(comments[i].menu_item.menu_item_id === order_items[j].item_id ||
                                comments[i].menu_item.menu_item_id === order_items[j].itemId){
                                order_item.comment.comment_id = comments[i]._id;
                                order_item.comment.comment_content = comments[i].comment_content;
                                order_item.comment.comment_rating = comments[i].rating;
                                order_item.comment.comment_attachments = comments[i].comment_attachments;
                                order_item.comment.followers = comments[i].followers;
                                order_item.comment.sub_comments = comments[i].sub_comments;
                                order_item.comment.thumb_ups = comments[i].thumb_ups;
                                order_item.comment.thumb_downs = comments[i].thumb_downs;
                                break;
                            }
                        }
                        order.order_items.push(order_item);
                    }
                    apiResult = {status: 200, data : order };
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.GetSingleOrderDetails end-of-step-02 ',back_order:order });
                    nextstep();
                }
            });
        }
    ], function (error) {
        callback(error, apiResult);
    });

};

var IsFandineAdmin = function (roles) {

    if (roles == null || roles == undefined || roles == '' || roles.length == 0) {
        return false;
    }

    var isAdmin = false;
    for (var key in roles) {
        if (key == 'FANDINE') {
            var role = roles[key];

            if (isNotNull(role)) {
                for (var i=0; i<role.length; i++) {
                    if (role[i] == 'FANDINE_ADMIN' || role[i] == 'FANDINE_SUPERVISOR') {
                        isAdmin = true;
                        break;
                    }
                }

            }
        }

        if (isAdmin) {
            break;
        }
    }

    return isAdmin;
};

var PopulateRestaurantIds = function (roles){
    var restaurantIds = [];

    for (var key in roles) {
        var restaurantPrefix = key.substr(0, 2);
        if (restaurantPrefix == 'D-') {
            var role = roles[key];

            if (isNotNull(role)) {
                for (var i=0; i<role.length; i++) {
                    if (role[i] == 'RESTAURANT_OWNER') {
                        restaurantIds.push(key.substr(2));
                        break;
                    }
                }
            }
        }
    }

    return restaurantIds;
}

//-- FBE-1887: Refactor UpdateParameterByOrderId as it is causing more bugs
var UpdateUsersByOrderId = function (reqParams, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'Order.UpdateUsersByOrderId received arguments',
        reqParams: reqParams });

    callback();

};

//-- FBE-1887: Refactor UpdateParameterByOrderId as it is causing more bugs
var UpdateDiscountsByOrderId = function (reqParams, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'Order.UpdateDiscountsByOrderId received arguments',
        reqParams: reqParams });

    callback();

};

//-- FBE-1887: Refactor UpdateParameterByOrderId as it is causing more bugs
var UpdateActionByOrderId = function (reqParams, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'Order.UpdateActionByOrderId received arguments',
        reqParams: reqParams });

    callback();

};

//-- FBE-1887: Refactor UpdateParameterByOrderId as it is causing more bugs
var UpdateTablesByOrderId = function (reqParams, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'Order.UpdateTablesByOrderId received arguments',
        reqParams: reqParams });

    callback();

};

//-- FBE-1887: Refactor UpdateParameterByOrderId as it is causing more bugs
var UpdateServersByOrderId = function (reqParams, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'Order.UpdateServersByOrderId received arguments',
        reqParams: reqParams });

    callback();

};

//-- FBE-1887: Refactor UpdateParameterByOrderId as it is causing more bugs
var UpdateStatusByOrderId = function (reqParams, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'Order.UpdateStatusByOrderId received arguments',
        reqParams: reqParams });

    callback();

};

var CloseOrder = function (reqParams, callback) {
    var _this = exports;
    var orderId =  reqParams.orderId,
        userId =  reqParams.userId,
        isServer =  reqParams.isServer,
        isOnlinePayment =  reqParams.isOnlinePayment,
        headerToken = reqParams.headerToken,
        otherServers =  reqParams.otherServers;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder received arguments:', reqParams: reqParams});

    var nowTime = _this.dataGenerationHelper.getValidUTCDate();

    var status,billStatus;
    var apiResult = '';

    var user = {};
    var order = {};

    async.series([
        // step-1: doFindUser
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrder step-1 doFindUser', userId: userId});

            var loggerInfos = {
                function : 'Order.CloseOrder step-1 doFindUser'
            }

            _this.getUserInfo(userId, otherServers, headerToken, function (error, result) {
                if(error){
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CloseOrder step-1 doFindUser returns an error', userId: userId});
                    nextstep(new _this.httpExceptions.InvalidParameterException( 'userId', userId));
                }else if(result == null || result == undefined || result.length == 0){
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrder step-1 doFindUser returns empty', userId: userId});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException( 'userId', userId));
                } else {
                    user = result;

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrder step-1 doFindUser returns right'});
                    nextstep();
                }
            }, reqParams, loggerInfos);
        },
        // step-2: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-2 doFindOrder,', orderId: orderId});

            var selector = {_id: orderId};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if(error){
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CloseOrder step-2 doFindOrder returns an error', orderId: orderId});
                    nextstep(new _this.httpExceptions.InvalidParameterException( 'orderId', orderId));
                }else if(result == null || result == undefined || result.length == 0){
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrder step-2 doFindOrder returns empty', orderId: orderId});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException( 'orderId', orderId));
                } else {

                    order = result[0];
                    status = order.status;
                    if(order.billStatus){
                        billStatus = order.billStatus.status;
                    }else if(order.bill_status){
                        billStatus =  order.bill_status.status;
                    }
                    if(status === _this.enums.OrderStatus.CLOSED || status === _this.enums.OrderStatus.CANCELLED ){
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrder step-2 doFindOrder returns result: closed already'});
                        apiResult = {status: 204};
                        callback(null, apiResult);
                    }else{
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrder step-2 doFindOrder returns right'});
                        nextstep();
                    }

                }
            });
        },
        // step-3: doValidateUser
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-3 doValidateUser,', userId: userId,isServer:isServer});
            if(isServer){
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-3 doValidateUser,', userId: userId});

                var restaurantId = order.restaurant.restaurant_id || order.restaurantId || '';

                var restaurant = 'D-' + restaurantId;

                if (isNotNull(user.roles) && isNotNull(user.roles[restaurant])) {
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrder step-3 doValidateUser returns right', userId: userId});
                    nextstep();
                } else {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.CloseOrder step-3 doValidateUser returns error', userId: userId});
                    nextstep(new _this.httpExceptions.DataConflictedException('SERVER_NOT_IN_RESTAURANT', userId));

                }
            }else{
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-3 doValidateUser,not server skip ==='});
                nextstep();
            }

        },
        // step-4: unlock the bill for offline payment
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-4 unlock the bill for offline payment,',
                status: status,billStatus:billStatus,isOnlinePayment:isOnlinePayment});
            if(status !== _this.enums.OrderStatus.INPROCESS && status !== _this.enums.OrderStatus.PAID && billStatus === _this.enums.BillStatus.LOCKED && isOnlinePayment === false){
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-4 unlock the bill for offline payment: order is been locked,shoud be unlock first'});
                _this.unlockBillByOrderId(orderId, userId, otherServers,headerToken,isServer, function (error) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.CloseOrder step-4 unlock the bill for offline payment: order is been locked,shoud be unlock first ==unlock has error'});
                        nextstep(error);
                    }else{
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-4 unlock the bill for offline payment: order is been locked,shoud be unlock first ==unlock success'});
                        nextstep();
                    }
                });
            }else{
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-4 unlock the bill for offline payment: order is not been locked or online payment'});
                nextstep();
            }
        },
        // step-5: doGetBill for offline payment
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-5 get bill for offline payment,',
                status: status,orderId:orderId,userId:userId,isOnlinePayment:isOnlinePayment});
            if(status !== _this.enums.OrderStatus.INPROCESS && status !== _this.enums.OrderStatus.PAID &&
                isOnlinePayment === false && order.orderItems !== undefined && billStatus !== _this.enums.BillStatus.UNLOCKED){
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-5 get bill for offline payment: get bill',
                    status: status,orderId:orderId,userId:userId,isOnlinePayment:isOnlinePayment});
                var orderUser = userId;
                if(isServer === true){
                    if(order.user){
                        orderUser = order.user.user_id;
                    }else if(order.customers){
                        orderUser = order.customers[0].user_id;
                    }
                }
                var reqParam = {
                    orderId: orderId,
                    userId: orderUser,
                    isServer: isServer,
                    useBlueDollars: false,
                    buyBlueDollars: false,
                    useGoldDollars: false,
                    isOnlinePayment: isOnlinePayment,
                    headerToken: headerToken,
                    otherServers: otherServers,
                    isResponseForV1: false
                };

                _this.getBillByOrderId(reqParam, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CloseOrder step-5 get bill for offline payment: get bill returns error', error: error});
                        nextstep(new _this.httpExceptions.InvalidParameterException('ORDER_GET_BILL_ERROR', orderId));
                    } else {
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrder step-5 get bill for offline payment returns right', orderId: orderId});
                        nextstep();
                    }
                })
            }else{
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-5 get bill for offline payment: order status is INPROCESS or is onlinepayment skip get bill',
                    status: status,orderId:orderId,userId:userId,isOnlinePayment:isOnlinePayment});
                nextstep();
            }

        },
        // step-6: pay and close the order.
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-6 pay and close the order,',
                status: status,orderId:orderId,userId:userId,isOnlinePayment:isOnlinePayment});
            if(status !== _this.enums.OrderStatus.INPROCESS && status !== _this.enums.OrderStatus.PAID && order.orderItems !== undefined ){
                var server = 'FALSE';
                if(isServer ===true){
                    server = 'TRUE'
                }
                _this.updateParameterByOrderId(userId, orderId, {}, 'pay', server, otherServers,headerToken, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CloseOrder step-6 pay and close the order: has error', error: error});
                        nextstep(new _this.httpExceptions.InvalidParameterException('ORDER_GET_BILL_ERROR', orderId));
                    } else {
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrder step-6 pay and close the order returns right', orderId: orderId});
                        apiResult = {status: 204};
                        nextstep();
                    }
                });
            }else{
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-6 pay and close the order: bill status is INPROCESS,just close it.',
                    status: status,orderId:orderId,userId:userId,isOnlinePayment:isOnlinePayment});
                var selector = {_id: orderId};

                var obj = {
                    status: _this.enums.OrderStatus.CLOSED,
                    'billStatus.isOnlinePayment': isOnlinePayment,
                    'bill_status.is_online_payment': isOnlinePayment
                };
                if (isOnlinePayment === false && billStatus === _this.enums.BillStatus.UNLOCKED) {
                    obj['bill_status.status'] = _this.enums.BillStatus.PAID;
                    obj['payment.credit_service_charge'] = 0.0;
                    obj['payment.real_alipaty_service_charge'] = 0.0;
                    obj['payment.split_payment_going_to_restaurant'] = order.payment.total_amount_to_pay_with_bd_and_gd;
                    obj['payment.ap_to_restaurant_future_settlement'] = order.payment.total_amount_to_pay_with_bd_and_gd;
                }

                var document = {$set: obj};

                var options = {};
                var helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS };

                _this.restaurantDataAPI.update(selector, document, options, helper, function (error) {
                    if(error){
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.CloseOrder step-6 pay and close the order: bill status is INPROCESS,just close it: returns an error', error: error});
                        nextstep(new _this.httpExceptions.InvalidParameterException('orderId',orderId));
                    } else {
                        apiResult = {status: 204};

                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-6 pay and close the order: bill status is INPROCESS,just close it: returns right'});
                        nextstep();
                    }
                });
            }
        },
        // step-7: doFindOrderPickUpTime
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder step-7 doFindOrderPickUpTime', orderId: orderId });

            var selector = {_id: orderId};
            var options = {fields: {picked_up_time: 1}};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CloseOrder step-7 doFindOrderPickUpTime returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CloseOrder step-7 doFindOrderPickUpTime returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('orderId', orderId));
                } else {
                    var orderResult = result[0];
                    order.picked_up_time = orderResult.picked_up_time;

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CloseOrder step-7 doFindOrderPickUpTime returns right'});
                    nextstep();
                }
            });
        },
        // step-8: notification.
        function(nextstep){
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder do step-8 notification', status:status,orderId: orderId });
            // add  && isOnlinePayment !==true just for FBE-2433,I think this can be optimized by the way both alipay and stripe online payment call CloseOrder api and remove updateParameterByOrderId's notification
            if(status !==_this.enums.OrderStatus.CLOSED  && isOnlinePayment !==true ){
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder do step-8 notification--new close, need notification', status:status});

                var postData={};
                postData.host = otherServers.notification.server_url;
                postData.port = otherServers.notification.server_port;
                postData.path = '/notifications';
                var body = {
                    'command': _this.enums.PushMessageType.BROADCAST,
                    'user_id': order.user.user_id,
                    'user_name': order.user.user_name || '',
                    'restaurant_id': order.restaurant.restaurant_id,
                    'table_id': order.tableId || order.table_id,
                    'table_no': order.tableNo,
                    'order_id': orderId
                };

                if(isOnlinePayment ===true){
                    body.code=_this.enums.PushMessageType.ONLINEPAID;

                    if (order.is_takeout === true) {
                        body.code=_this.enums.PushMessageType.ONLINE_PAID_TAKEOUT;

                        var orderItems = [];

                        for (var i=0; i<order.order_items.length; i++) {
                            var orderItem = order.order_items[i];

                            orderItems.push({
                                order_item_user_id: orderItem.order_item_user_id,
                                order_item_id: orderItem.order_item_id,
                                item_id: orderItem.item_id,
                                item_name: orderItem.item_name,
                                item_names: orderItem.item_names
                            })
                        }

                        body.order_items = orderItems;
                        body.pickup_time = _this.dataGenerationHelper.getValidUTCDateTimeFormat(order.picked_up_time);
                        body.restaurant_name = order.restaurant.restaurant_name || '';
                        body.restaurant_phone = order.restaurant.officialPhone || '';
                        body.consumer_phone = order.note.mobile || '';
                        body.time_zone = order.restaurant.time_zone || _this.config.other_servers.time_zone.default_time_zone;

                    }else{
                        body.consumer_disp_name = order.user.user_name ||'';
                        body.consumer_avatar_path = order.user.avatar_path ||'';
                    }

                } else {
                    body.code = _this.enums.PushMessageType.OFFLINEPAID;

                    if (order.is_takeout === true) {
                        body.code = _this.enums.PushMessageType.OFFLINE_PAID_TAKEOUT;

                        var orderItems = [];

                        for (var i=0; i<order.order_items.length; i++) {
                            var orderItem = order.order_items[i];

                            orderItems.push({
                                order_item_user_id: orderItem.order_item_user_id,
                                order_item_id: orderItem.order_item_id,
                                item_id: orderItem.item_id,
                                item_name: orderItem.item_name,
                                item_names: orderItem.item_names
                            })
                        }

                        body.order_items = orderItems;
                        body.pickup_time = _this.dataGenerationHelper.getValidUTCDateTimeFormat(order.picked_up_time);
                        body.restaurant_name = order.restaurant.restaurant_name || '';
                        body.restaurant_phone = order.restaurant.officialPhone || '';
                        body.consumer_phone = order.note.mobile || '';
                    }else{
                        body.consumer_disp_name = order.user.user_name ||'';
                        body.consumer_avatar_path = order.user.avatar_path ||'';
                    }
                }

                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder do step-notification: post body==',body:body});
                postData.method = 'POST';

                var loggerInfos = {
                    function : 'Order.CloseOrder do step-notification'
                };

                _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-INFO: Order.CloseOrder do step-notification returns an error', error: error});
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder do step-notification returns right'});
                    }
                }, reqParams, loggerInfos);
            }
            nextstep();
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', { function: 'DEBUG-ERROR: Comment.CloseOrder step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Comment.CloseOrder step-(right) callback'});
        }

        callback(error, apiResult);
    });
};

var CancelOrder = function (reqParams, callback) {
    var _this = exports;

    var orderId =  reqParams.orderId;
    var userId =  reqParams.userId;
    var isServer =  reqParams.isServer;
    var reason = reqParams.reason;
    var headerToken = reqParams.headerToken;
};

var UpdateRequestBillTime=function(orderId,updateBody,callback){
    var _this = exports;
    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateRequestBillTime received arguments:', orderId: orderId,updateBody:updateBody });
    var selector = {_id: orderId};
    var document = {$set: updateBody};
    var options = {};
    var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

    _this.restaurantDataAPI.update(selector, document, options, helper, function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateRequestBillTime update: has error', error: error});
            callback(new _this.httpExceptions.DataConflictedException('update dining-orders error', orderId));
        } else {

            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateRequestBillTime update returns right', orderId: orderId});
            callback(null,'update success');
        }
    });

}
var RequestBill = function(reqParams, callback) {
    var _this = exports;
    var selector = { };
    var options = { };
    var helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order.js; Method: RequestBill()' };

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.RequestBill received arguments:', reqParams: reqParams });

    var user_id = reqParams.user_id;
    var order_id = reqParams.order_id;
    var otherServers = reqParams.otherServers;
    var headerToken = reqParams.headerToken;

    var apiResult;
    async.waterfall([
        function(nextstep) {

            var loggerInfos = {
                function : 'Order.RequestBill step-1 doFindUser'
            };

            _this.getUserNameAndAvatar(user_id, otherServers, headerToken, true, function (error, userResult) {
                if (error) {
                    callback(error);
                } else if (userResult && userResult.length >0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.RequestBill step-1 getUserNameAndAvatar returns result', userResult: userResult });
                    nextstep(null, userResult[0]);
                } else {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.RequestBill step-1 getUserNameAndAvatar: the user not found',user_id: user_id });
                    callback(new _this.httpExceptions.ResourceNotFoundException('user_id', user_id));
                }
            }, reqParams, loggerInfos)
        },
        function(user, nextstep) {
            selector = { _id: order_id };
            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if(error){
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.RequestBill step-2 doFindOrder returns an error', order_id: order_id});
                    nextstep(new _this.httpExceptions.InvalidParameterException( 'order_id', order_id));
                }else if(result == null || result == undefined || result.length == 0){
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.RequestBill step-2 doFindOrder returns empty', order_id: order_id});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException( 'order_id', order_id));
                } else {
                    var order = result[0];

                    if (order.is_takeout === true || order.order_type === _this.enums.OrderType.PREORDER) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.RequestBill step-2 doFindOrder: only support dinner order', order_id: order_id });
                        nextstep(new _this.httpExceptions.CommonHttpErrorException('ORDER_SUPPORT_DINNER', 'orderId', 'only support dinner order'));
                        return;
                    }

                    var nowTime = _this.dataGenerationHelper.getValidUTCDate();
                    var diff;
                    var updateBody;
                    if(order.request_bill_time){
                        var now = moment(nowTime);
                        var last = moment(order.request_bill_time);
                        diff = now.diff(last);
                        if(diff < 60 * 1000){
                            callback(new _this.httpExceptions.CommonHttpErrorException( 'FREQUENT_OPERATION','request bill too frequently', order_id));
                        }else{
                            updateBody = {request_bill_time:nowTime};
                            _this.updateRequestBillTime(order_id,updateBody,function(error,result){
                                if(error){
                                    callback(error,null);
                                }else{
                                    nextstep(null,order);
                                }
                            });
                        }
                    }else{
                        updateBody = {request_bill_time:nowTime};
                        _this.updateRequestBillTime(order_id,updateBody,function(error,result){
                            if(error){
                                callback(error,null);
                            }else{
                                nextstep(null,order);
                            }
                        });
                    }
                }
            });
        },
        function(order,nextstep){

            if(order.user && order.user.user_id && order.user.user_id === user_id ) {
                if(order.status && (order.status === _this.enums.OrderStatus.SUBMITTED || order.status === _this.enums.OrderStatus.PAID || order.status === _this.enums.OrderStatus.CLOSED)) {
                    apiResult = {status: 200, data: {'order_status': order.status}};
                    if(order.status !== _this.enums.OrderStatus.CLOSED) {
                        var postData={};
                        postData.host = otherServers.notification.server_url;
                        postData.port = otherServers.notification.server_port;
                        postData.path = '/notifications';

                        var body = {};
                        if (order.is_takeout && order.is_takeout === true) {
                            body = {
                                'command': _this.enums.PushMessageType.BROADCAST,
                                'user_id': order.user.user_id,
                                'user_name': order.user.user_name || '',
                                'restaurant_id': order.restaurant.restaurant_id,
                                'restaurant_name': order.restaurant.restaurant_name || '',
                                'restaurant_phone': order.restaurant.officialPhone || '',
                                'consumer_phone': order.note.mobile || '',
                                'table_id': order.tableId,
                                'table_no': order.tableNo,
                                'order_id': order_id,
                                'time_zone':order.restaurant.time_zone || _this.config.other_servers.time_zone.default_time_zone,
                                'code': _this.enums.PushMessageType.REQUEST_BILL_TAKEOUT,
                                'pickup_time': ''
                            };

                            var orderItems = [];

                            for (var i=0; i<order.order_items.length; i++) {
                                var orderItem = order.order_items[i];

                                orderItems.push({
                                    order_item_user_id: orderItem.order_item_user_id,
                                    order_item_id: orderItem.order_item_id,
                                    item_id: orderItem.item_id,
                                    item_name: orderItem.item_name,
                                    item_names: orderItem.item_names
                                })
                            }

                            body.order_items = orderItems;
                        } else {
                            body = {
                                'command': _this.enums.PushMessageType.BROADCAST,
                                'user_id': order.user.user_id,
                                'user_name': order.user.user_name || '',
                                'consumer_disp_name':order.user.user_name || '',
                                'consumer_avatar_path':order.user.avatar_path ||'',
                                'restaurant_id': order.restaurant.restaurant_id,
                                'table_id': order.tableId,
                                'table_no': order.tableNo,
                                'order_id': order_id,
                                'code': _this.enums.PushMessageType.REQUEST_BILL
                            };
                        }

                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.RequestBill do step-notification: post body==',body:body});
                        postData.method = 'POST';

                        var loggerInfos = {
                            function : 'Order.RequestBill do step-notification'
                        };

                        _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                            if (error) {
                                _this.logger.error('%j', { function: 'DEBUG-INFO: Order.RequestBill do step-notification returns an error', error: error});
                            } else {
                                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.RequestBill do step-notification returns right'});
                            }
                        }, reqParams, loggerInfos);
                    }
                    callback(null, apiResult);
                } else {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.RequestBill step-2 doFindOrder: the order should be submitted', order_id: order_id});
                    callback(new _this.httpExceptions.DataConflictedException( 'the order should be submitted', order_id));
                }
            } else {
                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.RequestBill step-2 doFindOrder: the order belongs to other person', order_id: order_id});
                callback(new _this.httpExceptions.DataConflictedException( 'the order belongs to other person', order_id));
            }
        }
    ], function(error, result) {
        callback(error, result);
    });

}

var CreateSimpleOrder = function (reqParams, callback) {
    var _this = exports;

    var isTakeout = reqParams.isTakeout;
    var isAA = reqParams.isAA;
    var orderType = reqParams.orderType;
    var userId = reqParams.userId;
    var restaurantId = reqParams.restaurantId;
    var deviceId = reqParams.deviceId;
    var deliveryAddressId = reqParams.deliveryAddressId;
    var deliveryInterval = reqParams.deliveryInterval;
    var orderItems = reqParams.orderItems;
    var note = reqParams.note;
    var headerToken = reqParams.headerToken;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateSimpleOrder received arguments', reqParams: reqParams});

    var apiResult = '';
    var order = {};

    var user = {};
    var restaurant = {};
    var itemIds = [];
    var menuMap = {};
    var availableQuantitiesMap = {};       // _id: quanity
    var orderSubtotalAmount = 0;

    async.series([
        // step-1: doFindUser
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-1 doFindUser', userId: userId});

            var loggerInfos = {
                function: 'Order.CreateSimpleOrder step-1 doFindUser'
            };

            _this.getUserNameAndAvatar(userId, _this.config.other_servers, headerToken, true, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-1 doFindUser returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find useraccount', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-1 doFindUser returns empty'});
                    nextstep(new _this.httpExceptions.CommonHttpErrorException('ACCOUNT_NOT_EXISTS', 'user_id', userId));
                } else {
                    var userResult = result[0];

                    user = {
                        user_id: userId,
                        user_name: userResult.dispName || '',
                        avatar_path: userResult.avatarPath || ''
                    };
                    if(userResult.inviter_info){
                        user.inviter_info = userResult.inviter_info;
                    }

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-1 doFindUser returns right'});
                    nextstep();
                }
            }, reqParams, loggerInfos)
        },
        // step-2: doFindUserCurrentOrder
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-2 doFindUserCurrentOrder', userId: userId});

            var selector = {'$and': [
                {'$or': [{ 'user.user_id': userId }, { 'customers.userId': userId }]},
                {status: {'$in': [_this.enums.OrderStatus.INPROCESS, _this.enums.OrderStatus.SUBMITTED]}},
                {come_from: {$ne: 'WECHAT'}}
            ]};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-2 doFindUserCurrentOrder returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-2 doFindUserCurrentOrder returns empty'});
                    nextstep();
                } else {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-2 doFindUserCurrentOrder returns an error', error: 'you have reviewed'});
                    nextstep(new _this.httpExceptions.CommonHttpErrorException('ORDER_STILL_OPEN', 'orderId', 'the order should be closed before user('+userId+')  create new order'));
                }
            });
        },
        // step-3: doFindRestaurant
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-3 doFindRestaurant', restaurantId: restaurantId});

            var selector = {_id : restaurantId};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.RESTAURANT};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-3 doFindRestaurant returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find restaurant', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-3 doFindRestaurant returns empty'});
                    nextstep(new _this.httpExceptions.CommonHttpErrorException('RESTAURANT_NOT_EXISTS', 'the restaurant id is not exist: restaurantId', restaurantId));
                } else {
                    var restaurantResult = result[0];

                    if (restaurantResult.active_status.toUpperCase() !== _this.enums.ActiveStatus.ACTIVE) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-3 doFindRestaurant returns error'});
                        nextstep(new _this.httpExceptions.CommonHttpErrorException('RESTAURANT_OFFLINE', 'the restaurant is offline', restaurantId));
                    } else {
                        if (isTakeout) {
                            if (restaurantResult.takeout_status) {
                                restaurant = restaurantResult;

                                _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-3 doFindRestaurant returns right'});
                                nextstep();
                            } else {
                                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-3 doFindRestaurant returns error'});
                                nextstep(new _this.httpExceptions.CommonHttpErrorException('TAKEOUT_DISABLED', 'the restaurant does not support takeout', restaurantId));
                            }
                        } else if (orderType === _this.enums.OrderType.DELIVERY) {
                            restaurant = restaurantResult;
                            if (restaurant.delivery_status) {
                                _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-3 doFindRestaurant returns right'});
                                nextstep();
                            } else {
                                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-3 doFindRestaurant returns error'});
                                nextstep(new _this.httpExceptions.CommonHttpErrorException('DELIVERY_DISABLED', 'the restaurant does not support delivery', restaurantId));
                            }
                        } else if (orderType === _this.enums.OrderType.PREORDER) {
                            if(restaurantResult.pre_order_status) {
                                restaurant = restaurantResult;
                                _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-3 doFindRestaurant returns right'});
                                nextstep();
                            } else {
                                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-3 doFindRestaurant returns error'});
                                nextstep(new _this.httpExceptions.CommonHttpErrorException('PREORDER_DISABLED', 'the restaurant does not support pre-order', restaurantId));
                            }
                        } else {
                            if(restaurantResult.dine_in_status) {
                                restaurant = restaurantResult;
                                _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-3 doFindRestaurant returns right'});
                                nextstep();
                            } else {
                                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-3 doFindRestaurant returns error'});
                                nextstep(new _this.httpExceptions.CommonHttpErrorException('DINEIN_DISABLED', 'the restaurant does not support dine-in', restaurantId));
                            }
                        }
                    }
                }
            });
        },
        // step-4: doFindMenus
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-4 doFindMenus'});

            for (var i=0; i<orderItems.length; i++) {
                var orderItem = orderItems[i];
                itemIds.push(orderItem.item_id);
            }

            var selector = {_id: {$in: itemIds}, restaurantId: restaurantId};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.MENU};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-4 doFindMenus returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find menu', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-4 doFindMenus returns empty'});
                    nextstep(new _this.httpExceptions.CommonHttpErrorException('MENU_NOT_EXISTS', 'itemId', itemIds));
                } else {
                    var menus = result;

                    var unavailableIds = [];
                    var unpublishedIds = [];

                    for (var i=0; i<menus.length; i++) {
                        var menu = menus[i];
                        if ((menu && menu.approved_status ===  _this.enums.ApprovedStatus.REJECTED ) || ( (isTakeout || orderType === _this.enums.OrderType.DELIVERY) && menu.takeout_available <= 0)) {
                            unavailableIds.push(menu._id);
                        }

                        if (menu.status !== 'published' || menu.approved_status !== _this.enums.ApprovedStatus.APPROVED) {
                            unpublishedIds.push(menu._id);
                        }

                        menuMap[menu._id] = menu;
                    }

                    if (unpublishedIds.length > 0) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-4 doFindMenus returns error', error: 'MENU_UNAVAILABLE'});
                        nextstep(new _this.httpExceptions.CommonHttpErrorException('MENU_UNAVAILABLE', 'menu/good(s) are not available: menuIds', unpublishedIds));
                    } else if (unavailableIds.length > 0) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-4 doFindMenus returns error', error: 'OUT_OF_AVAILABLE_QUOTA'});
                        nextstep(new _this.httpExceptions.CommonHttpErrorException('OUT_OF_AVAILABLE_QUOTA', 'item_id has been out of takeout available', unavailableIds));
                    } else {
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-4 doFindMenus returns right'});
                        nextstep();
                    }
                }
            })
        },
        //step-4.5 check menu delivery_restriction_quota for food market
        function(nextstep){
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-4.5 check menu delivery_restriction_quota for food market',
                is_food_Market:restaurant.liked,
                orderType:orderType
            });
            if(restaurant.liked ===true && orderType === _this.enums.OrderType.DELIVERY){
                var parameter = {
                    userId :userId,
                    restaurantId:restaurantId,
                    orderItems:orderItems,
                    menuMap:menuMap,
                    timezone :restaurant.time_zone || _this.config.other_servers.time_zone.default_time_zone
                }
                _this.orderManager.checkDeliveryRestriction(parameter,function(error){
                    if(error){
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-4.5 check menu delivery_restriction_quota for food market===has error',
                            error:error});
                        nextstep(error);
                    }else{
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-4.5 check menu delivery_restriction_quota for food market===success'});
                        nextstep();
                    }
                });
            }else{
                nextstep();
            }
        },
        // step-5: doPopulateOrder
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-5 doPopulateOrder'});

            var isCombinationRight = true;

            var unavailableIds = [];

            var nowTime = _this.dataGenerationHelper.getValidUTCDate();

            order._id = _this.dataGenerationHelper.generateUUID();
            order.order_no =  _this.dataGenerationHelper.generateShortUniqueID();
            order.tableId = _this.dataGenerationHelper.generateUUID();
            order.restaurantId = restaurantId;
            order.tableNo = 0;      // temporary
            order.device_id = deviceId;

            // restaurant
            order.restaurant_logo = {}
            order.restaurant = {};
            order.restaurant.restaurant_logo = {};
            order.restaurant.restaurant_id = restaurantId;
            order.restaurant_name = (restaurant.longNames && restaurant.longNames.length>0) ? restaurant.longNames[0].name : '';
            order.restaurant.restaurant_name = order.restaurant_name;
            order.restaurant_logo.filename = (restaurant.photos && restaurant.photos.length>0) ? restaurant.photos[0].filename : '';
            order.restaurant_logo.path = (restaurant.photos && restaurant.photos.length>0) ? restaurant.photos[0].path : '';
            order.restaurant.restaurant_logo.filename = order.restaurant_logo.filename;
            order.restaurant.restaurant_logo.path = order.restaurant_logo.path;
            order.restaurant.restaurant_rating = restaurant.rating || 0;
            order.restaurant.discount_percentage = restaurant.discount_percentage || 0;
            order.restaurant.blue_dollars = restaurant.blueDollars || [];
            order.restaurant.blue_dollars = restaurant.blueDollars || [];
            order.restaurant.discounts = restaurant.discounts || [];
            order.restaurant.applicable_taxes = restaurant.applicableTaxes || [];
            order.restaurant.currency = restaurant.currency || '';
            order.restaurant.is_online_payment = restaurant.isOnlinePayment || false;
            order.restaurant.cannot_use_bluedollar = restaurant.cannot_use_bluedollar || false;
            order.restaurant.can_use_gold_dollar = restaurant.can_use_gold_dollar || false;
            //FBE-3575 create order allow to set restaurant email to order detail
            order.restaurant.email = restaurant.email;
            if (restaurant.stripetoken) {
                if (restaurant.currency === _this.enums.CurrencyCode.CHINA){
                    order.restaurant.is_stripe_payment = false;
                } else {
                    order.restaurant.is_stripe_payment = true;
                }
                order.restaurant.stripetoken = restaurant.stripetoken;
            }
            order.restaurant.addresses = restaurant.addresses || {};
            order.restaurant.officialPhone = restaurant.officialPhone || '';
            order.restaurant.online_payment_only_takeout = restaurant.online_payment_only_takeout || false;
            order.restaurant.picked_up_interval = restaurant.picked_up_interval || 15;
            if (restaurant.liked) {
                order.restaurant.liked = restaurant.liked;
                order.restaurant.delivery_info = restaurant.delivery_info;
            }
            if (isTakeout) {
                order.restaurant.pack_fee = restaurant.pack_fee ? restaurant.pack_fee : 0;
            }
            //FBE-3347 the new created order should has restaurant time zone
            order.restaurant.time_zone = restaurant.time_zone || _this.config.other_servers.time_zone.default_time_zone;
            order.restaurant.regular_hours = Array.isArray(restaurant.regular_hours)? restaurant.regular_hours : [] ;
            if (restaurant.commissionRatePercent) {
                order.restaurant.commissionRatePercent = restaurant.commissionRatePercent;
            }
            //tax number FBE-3524
            order.restaurant.tax_number = restaurant.tax_number;
            order.restaurant.default_tip_rate = 0;
            // restaurant

            order.status = _this.enums.OrderStatus.SUBMITTED;
            order.lastmodified = nowTime;
            order.isServer = 'FALSE';

            //FBE-2629
            if(restaurant.group_buy){
                order.group_buy = true;
            }

            // user
            order.user = user;
            order.customers = [{
                user_id: user.user_id,
                user_name: user.user_name,
                avatar_path: user.avatar_path,
                mobile: note ? note.mobile : '',
                create_time: nowTime
            }];
            // user

            order.batch_no =1; //-- NOTE: This is should contain the total batches in the order
            order.receipt_printed = false;

            var orderItemSeparatePrinters = [];

            order.printers = [];
            if (restaurant.printers !== null && restaurant.printers !== undefined && restaurant.printers.length > 0) {
                var printers = [];
                for (var i=0; i<restaurant.printers.length; i++) {
                    var usages = restaurant.printers[i].usages;
                    var type = restaurant.printers[i].type;

                    if (usages !== null && usages !== undefined && usages.length > 0) {
                        for (var j=0; j<usages.length; j++) {
                            if ((usages[j].order_auto_print === true && usages[j].usage === _this.enums.PrinterUsage.PASS) || usages[j].usage === _this.enums.PrinterUsage.CASHIER
                            /*|| (type === _this.enums.PrinterModule.FEIE && usages[j].usage === _this.enums.PrinterUsage.KITCHEN)*/) {
                                printers.push(restaurant.printers[i]);
                                break;
                            }
                        }

                        for (var j=0; j<usages.length; j++) {
                            if ((usages[j].item_auto_print === true && usages[j].usage === _this.enums.PrinterUsage.PASS) /*||
                             (type === _this.enums.PrinterModule.FEIE && usages[j].usage === _this.enums.PrinterUsage.KITCHEN && usages[j].item_print_number > 0 )*/ ) {
                                orderItemSeparatePrinters.push(restaurant.printers[i]);
                                break;
                            }
                        }
                    }
                }

                order.printers = printers;
            }

            // orderItems
            var country = _this.config.other_servers.country;
            var locale = '';
            if (!country || (_this.config.other_servers.region.north_america.indexOf(country) >-1)) {
                locale = _this.enums.LocaleCode.EN_US;
            } else {
                locale = _this.enums.LocaleCode.ZH_CN;
            }

            // quantity map
            for (var i=0; i<orderItems.length; i++) {
                var orderItem = orderItems[i];
                var itemId = orderItem.item_id;

                if (availableQuantitiesMap[itemId]) {
                    availableQuantitiesMap[itemId] += orderItem.quantity;
                } else {
                    availableQuantitiesMap[itemId] = orderItem.quantity;
                }
            }

            // orderItems
            var modifiedOrderItems = [];
            // order_items
            var newOrderItems = [];

            for (var i=0; i<orderItems.length; i++) {
                var orderItem = orderItems[i];
                var itemId = orderItem.item_id;
                var quantity = orderItem.quantity;
                var combinations = orderItem.combinations ? orderItem.combinations : [];    // item combinations

                var menu = menuMap[itemId];
                var menuCombinations = menu.combinations ? menu.combinations : [];    // menu combinations

                if (availableQuantitiesMap[itemId] > menu.takeout_available || quantity <= 0) {
                    unavailableIds.push(itemId);
                }

                var modifiedOrderItem = {};
                modifiedOrderItem.itemId = itemId;

                if (menu.longNames && menu.longNames.length > 0) {

                    for (var j=0; j<menu.longNames.length; j++) {
                        var longName = menu.longNames[j];

                        if (locale === longName.locale) {
                            modifiedOrderItem.itemName = longName.name;
                            break;
                        }
                    }

                    if (modifiedOrderItem.itemName === undefined) {
                        modifiedOrderItem.itemName = menu.longNames[0].name;
                    }

                } else {
                    modifiedOrderItem.itemName = '';
                }

                modifiedOrderItem.itemNames = menu.longNames;
                modifiedOrderItem.catalogue_full = menu.catalogue_full;
                modifiedOrderItem.quantity = quantity;
                modifiedOrderItem.type = '';
                modifiedOrderItem.seat = 1;
                modifiedOrderItem.category = menu.category;

                if (menuCombinations.length > 0 && combinations.length > 0) {
                    var priceAndCombination = calcuateCombinationsPrice(menuCombinations, combinations, locale);

                    if (priceAndCombination === false) {
                        isCombinationRight = false;
                        break;
                    } else {
                        var price = priceAndCombination.price;
                        var originalPrice = priceAndCombination.originalPrice;
                        var combinations = priceAndCombination.combinations;

                        if (!isNumber(price)) {
                            isCombinationRight = false;
                            break;
                        }

                        modifiedOrderItem.price = {
                            amount: menu.BasePrice,
                            currencyCode: restaurant.currency
                        };
                        modifiedOrderItem.actual_price = {
                            amount: _this.dataGenerationHelper.getAccurateNumber(menu.BasePrice + price, 2),
                            currencyCode: restaurant.currency
                        };

                        var originalBasePrice = menu.OriginalPrice ? menu.OriginalPrice : menu.BasePrice;
                        modifiedOrderItem.actual_original_price = {
                            amount: _this.dataGenerationHelper.getAccurateNumber(originalBasePrice + originalPrice, 2),
                            currencyCode: restaurant.currency
                        };
                        modifiedOrderItem.combinations = combinations;

                    }

                } else {
                    modifiedOrderItem.price = {
                        amount: menu.BasePrice,
                        currencyCode: restaurant.currency
                    };
                    var oPrice = menu.OriginalPrice ? menu.OriginalPrice : menu.BasePrice;;
                    modifiedOrderItem.actual_original_price = {
                        amount: _this.dataGenerationHelper.getAccurateNumber(oPrice, 2),
                        currencyCode: restaurant.currency
                    };
                }

                if (modifiedOrderItem.actual_price) {
                    orderSubtotalAmount += modifiedOrderItem.actual_price.amount * modifiedOrderItem.quantity;
                } else {
                    orderSubtotalAmount += modifiedOrderItem.price.amount * modifiedOrderItem.quantity;
                }

                modifiedOrderItem.original_price = menu.OriginalPrice ? menu.OriginalPrice : menu.BasePrice;

                modifiedOrderItem.photos = menu.photos;
                modifiedOrderItem.chit_printed = false;

                modifiedOrderItem.order_item_user_id = userId;
                modifiedOrderItem.order_item_id = _this.dataGenerationHelper.generateUUID();
                modifiedOrderItem.submission_time = nowTime;
                modifiedOrderItem.order_item_batch_no = order.batch_no;
                modifiedOrderItem.order_item_user_name = user.user_name;
                modifiedOrderItem.order_item_user_avatar_path = user.avatar_path;
                modifiedOrderItem.menu_item_rating = menu.rating || 0;

                var photos = menu.photos;
                if (isNotNull(photos)) {
                    for (var k=0; k<photos.length; k++) {
                        var photo = photos[k];
                        if (photo.size === _this.enums.SizeOfPhoto.SMALL) {
                            modifiedOrderItem.menu_item_photo = photo.path || '';
                            break;
                        }
                    }
                } else {
                    modifiedOrderItem.menu_item_photo = '';
                }

                var printers = _this.backendHelpers.jsonHelper().cloneDocument(menu.printers);
                modifiedOrderItem.printers = isNotNull(printers) ? printers : [];

                for (var j=0; j<orderItemSeparatePrinters.length; j++) {
                    modifiedOrderItem.printers.push(orderItemSeparatePrinters[j]);
                }

                modifiedOrderItem.childrenItems = [];

                modifiedOrderItems.push(modifiedOrderItem);

                var newOrderItem = _this.backendHelpers.jsonHelper().cloneDocument(modifiedOrderItem);
                newOrderItem.item_id = newOrderItem.itemId;
                newOrderItem.item_name = newOrderItem.itemName;
                newOrderItem.item_names = newOrderItem.itemNames;
                newOrderItem.price.currency_code = newOrderItem.price.currencyCode;
                newOrderItem.children_items = newOrderItem.childrenItems;

                delete newOrderItem.itemId;
                delete newOrderItem.itemName;
                delete newOrderItem.itemNames;
                delete newOrderItem.price.currencyCode;
                delete newOrderItem.childrenItems;

                newOrderItems.push(newOrderItem);

            }

            order.orderItems = modifiedOrderItems;
            order.order_items = newOrderItems;
            // orderItems

            order.note = note;

            order.batchNo = order.batch_no;
            order.last_modified = nowTime;
            order.last_submission_time = nowTime;

            order.come_from = _this.enums.OrderSource.APP;

            if (isTakeout) {
                order.is_takeout = true;
                order.picked_up = false;
                if(note && note.is_now ===true){
                    order.picked_up_time = _this.dataGenerationHelper.getValidAfterMinuteLocalDate(null,order.restaurant.picked_up_interval || 15);
                } else if(note && note.effective_date){
                    order.picked_up_time = _this.dataGenerationHelper.getValidAfterMinuteLocalDate(note.effective_date,0);
                }
            } else if (orderType === _this.enums.OrderType.PREORDER || orderType === _this.enums.OrderType.DELIVERY){
                order.order_type = orderType;
                order.picked_up = false;

                if (isAA) {
                    order.is_aa = isAA;
                }
            }

            if (_this.serverHelper.isServerNA()) {
                var type = _this.orderManager.getOrderType(order);
                if (type === _this.enums.OrderType.DINNER) {
                    order.restaurant.default_tip_rate = restaurant.tip_rate_dinein || _this.config.other_servers.other_rates.tip_rate_dinein;
                } else if (type === _this.enums.OrderType.TAKEOUT) {
                    order.restaurant.default_tip_rate = restaurant.tip_rate_takeout || _this.config.other_servers.other_rates.tip_rate_takeout;
                } else if (type === _this.enums.OrderType.DELIVERY) {
                    order.restaurant.default_tip_rate = restaurant.tip_rate_delivery || _this.config.other_servers.other_rates.tip_rate_delivery;
                } else {
                    order.restaurant.default_tip_rate = restaurant.tip_rate_preorder || _this.config.other_servers.other_rates.tip_rate_preorder;
                }
            }

            var isInRegularHours  = true;
            if(orderType === _this.enums.OrderType.PREORDER){
                isInRegularHours = _this.orderManager.isInRegularHours(order.note,order.restaurant.regular_hours,order.restaurant.time_zone);
            }

            if(!isInRegularHours){
                nextstep(new _this.httpExceptions.CommonHttpErrorException('INVALID_PICKUP_TIME', 'effective date not in regular hours range'));
            }else if ((isTakeout || orderType === _this.enums.OrderType.DELIVERY) && unavailableIds.length > 0) {
                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-5 doPopulateOrder returns error'});
                nextstep(new _this.httpExceptions.CommonHttpErrorException('OUT_OF_AVAILABLE_QUOTA', 'item_id quantity has been more than or less than available', unavailableIds));
            } else if ((isTakeout || orderType === _this.enums.OrderType.DELIVERY) && isCombinationRight === false) {
                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-5 doPopulateOrder returns error'});
                nextstep(new _this.httpExceptions.CommonHttpErrorException('OUT_OF_COMBINATION_QUOTA', 'combination quantity has been more than maximum_value'));
            }else {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-5 doPopulateOrder returns right'});
                nextstep();
            }
        },
        // step-6: doFindDeliveryAddress
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-6 doFindDeliveryAddress received parameters', deliveryAddressId: deliveryAddressId});

            if (orderType === _this.enums.OrderType.DELIVERY && (!deliveryAddressId || !deliveryInterval)) {
                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-6 doFindDeliveryAddress returns an error', error: 'deliveryAddressId or deliveryInterval empty'});
                callback(new _this.httpExceptions.InvalidParameterException('deliveryAddressId or deliveryInterval', deliveryAddressId), null);
                return;
            }

            if (deliveryAddressId && deliveryInterval) {
                var selector = {_id: deliveryAddressId};
                var options = {};
                var helper = {collectionName: _this.enums.CollectionName.DELIVERY_ADDRESS};

                _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-6 doFindDeliveryAddress returns an error', error: error});
                        nextstep(new _this.httpExceptions.DataConflictedException('find delivery_address', error));
                    } else if (result === undefined || result === null || result === '' || result.length === 0) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-6 doFindDeliveryAddress returns empty'});
                        nextstep(new _this.httpExceptions.CommonHttpErrorException('DELIVERY_ADDRESS_NOT_EXISTS', '_id', deliveryAddressId));
                    } else {
                        var delivery = result[0];

                        order.delivery_address = {
                            _id: delivery._id,
                            address: delivery.address,
                            receiver: delivery.receiver
                        };
                        order.delivery_interval = deliveryInterval;
                        order.delivery_status = _this.enums.DeliveryStatus.PREPARING;
                        order.consumer_delivery_status = order.delivery_status;

                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-6 doFindDeliveryAddress returns right'});
                        nextstep();
                    }
                });
            } else {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-6 doFindDeliveryAddress returns empty'});
                nextstep();
            }
        },
        // step-7: doCalculateDelivery
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-7 doCalculateDelivery'});

            if (order.delivery_address) {

                if (restaurant.liked) {
                    // express

                    var deliveryFee = 0;

                    if (orderSubtotalAmount < order.restaurant.delivery_info.minimum_amount_for_delivery) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-7 doCalculateDelivery returns error'});
                        nextstep(new _this.httpExceptions.CommonHttpErrorException('NOT_UP_TO_DELIVERY_STANDARD', 'minimum_amount_for_delivery',
                            'total order amount is less than minimum amount for delivery'));
                    } else {
                        var deliveryFeeSaving = 0;
                        if (orderSubtotalAmount >= order.restaurant.delivery_info.amount_of_free_delivery) {
                            deliveryFeeSaving = order.restaurant.delivery_info.delivery_fee;
                        }

                        order.delivery_payment = {
                            delivery_distance: 0,
                            delivery_fee: order.restaurant.delivery_info.delivery_fee,
                            delivery_fee_saving: deliveryFeeSaving
                        };

                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-7 doCalculateDelivery returns right', deliveryFee: deliveryFee});
                        nextstep();
                    }
                } else {
                    // delivery

                    var selector = {};
                    var options = {};
                    var helper = {collectionName: _this.enums.CollectionName.SYSTEM_PARAMETERS};

                    _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                        if (error) {
                            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-7 doCalculateDelivery returns an error', error: error});
                            nextstep(new _this.httpExceptions.DataConflictedException('find system-parameters', error));
                        } else if (result === undefined || result === null || result === '' || result.length === 0) {
                            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-7 doCalculateDelivery returns empty'});
                            nextstep(new _this.httpExceptions.ResourceNotFoundException('delivery', 'delivery'));
                        } else {
                            var deliveryConfig = result[0].delivery;

                            order.restaurant.delivery_config = deliveryConfig;

                            if (deliveryConfig.min_unit_order_amount_for_delivery > orderSubtotalAmount) {
                                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-7 doCalculateDelivery returns error'});
                                nextstep(new _this.httpExceptions.CommonHttpErrorException('NOT_UP_TO_DELIVERY_STANDARD', 'delivery min order amount',
                                    'total order amount is less than delivery min order amount'));
                            } else {
                                var deliveryResult = _this.orderCalculate.calculateDeliveryFee(order.delivery_address.address, order.restaurant.addresses, deliveryConfig);

                                if (deliveryResult.enable) {
                                    order.delivery_payment = {
                                        delivery_distance: deliveryResult.delivery_distance,
                                        delivery_fee: deliveryResult.delivery_fee,
                                        delivery_fee_saving: deliveryResult.delivery_fee_saving
                                    };

                                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-7 doCalculateDelivery returns right', deliveryResult: deliveryResult});
                                    nextstep();
                                } else {
                                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-7 doCalculateDelivery returns error'});
                                    nextstep(new _this.httpExceptions.DataConflictedException('delivery error', deliveryResult.error));
                                }
                            }
                        }
                    });
                }
            } else {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-7 doCalculateDelivery returns empty'});
                nextstep();
            }
        },
        // step-6: doGetVirtualTableNo
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-6 doGetVirtualTableNo'});

            var tableKey = '';
            var localTimeFormat = '';
            if (isTakeout) {
                tableKey = 'T';
                localTimeFormat = _this.dataGenerationHelper.getValidLocaleDateTimeFormat();
            } else if (orderType === _this.enums.OrderType.PREORDER) {
                tableKey = 'P';
            } else if (orderType === _this.enums.OrderType.DELIVERY) {
                tableKey = 'D';
            } else if (orderType === _this.enums.OrderType.DINNER) {
                tableKey = 'I';
            }

            _this.getVirtualTableNo(order.restaurantId, tableKey, localTimeFormat, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-6 doGetVirtualTableNo returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find table-sequence', 'error'));
                } else {
                    order.tableNo = result;

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-6 doGetVirtualTableNo returns right'});
                    nextstep();
                }
            });
        },
        // step-7: doGetOrderNo
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-7 doGetOrderNo'});

            _this.getSequenceNo(_this.enums.CollectionName.ORDER_SEQUENCE, order.restaurantId, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-7 doGetOrderNo returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find order-sequence', 'error'));
                } else {
                    order.order_no = result;

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-7 doGetOrderNo returns right'});
                    nextstep();
                }
            });
        },

        //step-7.1 do Get specified invitation code discount config
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-7.1 do Get specified invitation code discount config',
                user: user,
                is_invitation_code_discount_enabled:_this.config.other_servers.invitation_code_discount_config.enabled
            });
            if(_this.config.other_servers.invitation_code_discount_config.enabled && user.inviter_info && user.inviter_info.code){
                var invitationCode = user.inviter_info.code;
                getInvitationCodeDiscountConfig(invitationCode,function(result){
                    if(result){
                        order.invitation_code_discount = result;
                    }
                    nextstep();
                })
            }else{
                nextstep();
            }

        },
        // step-7.2: doFindPromotion
        function (nextstep) {
            if (orderType === _this.enums.OrderType.PREORDER && isAA) {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-7.2 doFindPromotion', promotion_id: 'b3d13cc5-c27c-4769-8132-306ff1102415'});

                var selector = {_id: 'b3d13cc5-c27c-4769-8132-306ff1102415', enable: true};
                var options = {};
                var helper = {collectionName: _this.enums.CollectionName.PROMOTIONS};

                _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-7.2 doFindPromotion returns an error', error: error});
                        nextstep();
                    } else if (result === undefined || result === null || result === '' || result.length === 0) {
                        _this.logger.info('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-7.2 doFindPromotion returns empty'});
                        nextstep();
                    } else {
                        var promotion = result[0];

                        order.promotion_aa = promotion;

                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-7.2 doFindPromotion returns right'});
                        nextstep();
                    }
                });

            } else {
                nextstep();
            }
        },
        // step-8: doCreateSimpleOrder
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-8 doCreateSimpleOrder'});

            var document = order;
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.create(document, options, helper, function (error) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-8 doCreateSimpleOrder returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('create dining-orders', 'error'));
                } else {
                    apiResult = {status: 201, data: {id: order._id}};

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-8 doCreateSimpleOrder returns right'});
                    nextstep();
                }
            });
        },
        // step-9: doUpdateMenuTakeoutAvailable
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-9 doUpdateMenuTakeoutAvailable'});

            if (isTakeout || orderType === _this.enums.OrderType.DELIVERY) {
                for (var key in availableQuantitiesMap) {
                    var itemId = key;
                    var quantity = availableQuantitiesMap[key];

                    var selector = {_id: itemId};
                    var document = {$inc: {takeout_available: -quantity}};
                    var options = {};
                    var helper = {collectionName: _this.enums.CollectionName.MENU};

                    _this.restaurantDataAPI.update(selector, document, options, helper, function (error) {
                        if (error) {
                            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-9 doUpdateMenuTakeoutAvailable returns error', error: error});
                        }
                    });
                }

            }

            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-9 doUpdateMenuTakeoutAvailable returns right'});
            nextstep();
        },
        // step-10: doCreatePrintTask
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateSimpleOrder step-10 doCreatePrintTask'});
            if (orderType === _this.enums.OrderType.DINNER) {

                _this.createPrintTask(order._id, order, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.CreateSimpleOrder step-10 doCreatePrintTask returns error', error: error});
                    } else {
                        if (result.length === 0) {
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateSimpleOrder step-10 doCreatePrintTask returns empty'});
                        } else {
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateSimpleOrder step-10 doCreatePrintTask returns right'});
                        }
                    }
                })

            }

            nextstep();

        },
        // step-11: doSendNotification
        function (nextstep) {

            if (orderType === _this.enums.OrderType.DINNER) {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateSimpleOrder step-11 doSendNotification', orderId: order._id});

                var postData={};
                postData.host = _this.config.other_servers.notification.server_url;
                postData.port = _this.config.other_servers.notification.server_port;
                postData.path = '/notifications';
                var body = {
                    'command': _this.enums.PushMessageType.BROADCAST,
                    'user_id': order.user.user_id,
                    'user_name': order.user.user_name || '',
                    'consumer_disp_name':order.user.user_name ||'',
                    'consumer_avatar_path':order.user.avatar_path ||'',
                    'restaurant_id': restaurantId,
                    'table_id': order.tableId,
                    'table_no': order.tableNo,
                    'order_id': order._id,
                    'code': _this.enums.PushMessageType.SUBMITORDER,
                    'deliver_type':'RELIABLE'
                }
                postData.method = 'POST';

                var loggerInfos = {
                    function : 'Order.CreateSimpleOrder step-11 doSendNotification'
                };

                _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-INFO: Order.CreateSimpleOrder step-11 doSendNotification returns an error', error: error});
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CreateSimpleOrder step-11 doSendNotification returns right'});
                    }
                }, reqParams, loggerInfos);
            }

            nextstep();
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreateSimpleOrder step-(error) callback', error: error});
            // FBE-3189 send email alert
            var message = {reqParams: reqParams};
            var emailBody = {
                subject: 'Create-Simple-Order failed',
                text: {
                    order_type: isTakeout === true ? _this.enums.OrderType.TAKEOUT : orderType,
                    error: error,
                    data: message
                }
            };
            _this.orderManager.sendEmail(emailBody);
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreateSimpleOrder step-(right) callback'});
        }
        callback (error, apiResult);

    });

}

var UpdateCustomerCheckin = function (reqParams, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateCustomerCheckin received arguments',
        reqParams: reqParams});
    var userId = reqParams.user_id;
    var orderId =  reqParams.order_id;
    var action =  reqParams.action;
    var isServer =  reqParams.isServer;
    var otherServers = _this.otherServers;
    var body = reqParams.body;
    var headerToken = reqParams.headerToken;

    var nowTime = _this.dataGenerationHelper.getValidUTCDate();

    var apiresult = {}, options = {}, order = {}, customerInfo = {};
    var status,already_closed = false;
    var tableNo = '';
    var  checkTableOccupied = false;

    var check_user = function (nextstep) {
        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateCustomerCheckin step-1 check users.', userId: userId,orderId:orderId });

        getCustomerInfo(userId, orderId, function (error, result) {
            if (error) {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateCustomerCheckin step-1 getCustomerInfo error'});
                nextstep(error);
            } else {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateCustomerCheckin step-1 check users', customerInfo: result});
                nextstep();
            }
        });
    };

    var lookup_order = function(nextstep){
        if(reqParams.checkin_flag === undefined || reqParams.checkin_flag){
            var selector = {_id: orderId};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: order.UpdateCustomerCheckin lookup order returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length !== 1) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: order-controller.UpdateCustomerCheckin lookup order return empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('order', orderId));

                } else {

                    order = result[0];
                    let checkinTime = order.note.effective_date;

                    if( nowTime - checkinTime > _this.config.pre_order_checkin.late_minutes ){
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order is expried now'));
                    }
                    else if(checkinTime - nowTime > _this.config.pre_order_checkin.ahead_minutes ){
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('It\'s too early to check in now', orderId));
                    }
                    else if(order.order_type !== _this.enums.OrderType.PREORDER){
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order is not a pre order', orderId));
                    }
                    else if(order.payment_status !== _this.enums.PreOrderPaymentStatus.HELD){
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order payment is not held', orderId));
                    }
                    else {
                        if(order.picked_up ===true){
                            callback(null,{status: 204});
                        }else{
                            nextstep();
                        }
                    }
                }
            });
        }
        else{
            nextstep(new _this.httpExceptions.ResourceNotFoundException('This order already redeemed', orderId));
        }
    };

    var update_pickup_status = function(nextstep){
        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateCustomerCheckin step-5 update the picked_up status.',
            userId: userId,orderId:orderId });
        var  helper, criteria, document;

        document = {
            $set: {
                picked_up: true,
                checkin_time: nowTime,
                lastmodified: nowTime,
                last_modified: nowTime,
                redeemed_time: nowTime
            }
        };

        criteria = {'$and': [{_id: orderId}, {'$or': [{archived: false}, {archived: null}]}]};
        helper = {
            collectionName: _this.enums.CollectionName.DINING_ORDERS,
            callerScript: 'File: order.js; Method: UpdateCustomerCheckin()',
            apiVersion: 1
        };
        _this.restaurantDataAPI.update(criteria, document, options, helper, function (errors) {
            if (errors) {
                nextstep(errors);
            } else {
                apiresult = {status: 204};
                nextstep();
            }
        });
    };

    var do_notification = function (nextstep) {

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateCustomerCheckin do step-notification', orderId: orderId});

            var postData = {};
            postData.host = otherServers.notification.server_url;
            postData.port = otherServers.notification.server_port;
            postData.path = '/notifications';
            var mobile = '';
            if(order.note){
                mobile = order.note.mobile;
            }

            var body = {};

            var pickUpTime = isNotNull(order.note) ? _this.dataGenerationHelper.getValidUTCDateTimeFormat(order.note.effective_date) :
                _this.dataGenerationHelper.getValidUTCDateTimeFormat();

            body = {
                'command': _this.enums.PushMessageType.BROADCAST,
                'user_id': order.user.user_id,
                'user_name': order.user.user_name || '',
                'consumer_avatar_path': order.user.avatar_path ||'',
                'restaurant_id': order.restaurant.restaurant_id,
                'restaurant_name': order.restaurant.restaurant_name|| '',
                'restaurant_phone': order.restaurant.officialPhone|| '',
                'consumer_phone':mobile,
                'pickup_time':pickUpTime,
                'redeemed_time': _this.dataGenerationHelper.getValidUTCDateTimeFormat(nowTime),
                'table_id': order.table_id,
                'table_no': order.tableNo,
                'order_id': orderId,
                'code': _this.enums.PushMessageType.REDEEMED_PREORDER,
                'deliver_type':'RELIABLE'
            };

            postData.method = 'POST';
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateCustomerCheckin  do step-notification', postData: postData});

            var loggerInfos = {
                function : 'Order.UpdateCustomerCheckin  do step-notification'
            };

            _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-INFO: Order.UpdateCustomerCheckin  do step-notification returns an error',
                        error: error
                    });
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateCustomerCheckin  do step-notification returns right'});
                }
            }, reqParams, loggerInfos);

            nextstep();
        };

    var create_print_task = function (nextstep) {

        _this.createPrintTask(orderId, order, function (error, result) {
            if (error) {
                _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.UpdateCustomerCheckin doCreatePrintTask returns error', error: error});
                nextstep(new _this.httpExceptions.DataConflictedException('create print-task', 'error'));
            } else {
                if (result.length === 0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateCustomerCheckin doCreatePrintTask returns empty'});
                    nextstep();
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateCustomerCheckin doCreatePrintTask returns right'});
                apiresult = {status: 204};
                    nextstep();
                }
            }
        })
    };

    async.series([
        check_user, // step-1 verify user
        lookup_order,
        update_pickup_status, //step-3
        do_notification,
        create_print_task // step-doCreatePrintTask
    ], function (error) {
        callback(error, apiresult);
    });
};

var SetPickedUp = function (reqParams, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetPickedUp received arguments',
        reqParams: reqParams});
    var userId = reqParams.userId;
    var orderId =  reqParams.orderId;
    var action =  reqParams.action;
    var isServer =  reqParams.isServer;
    var otherServers = reqParams.otherServers;
    var body = reqParams.body;
    var headerToken = reqParams.headerToken;

    var nowTime = _this.dataGenerationHelper.getValidUTCDate();

    var apiresult, options = {}, order = {}, customerInfo = {};
    var status,already_closed = false;

    var tableNo = '';
    var isExpired = false, checkTableOccupied = false;

    async.series([

        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetPickedUp step-1 check users.',
                isServer: isServer, userId: userId,orderId:orderId });
            if (isServer === 'TRUE') {
                nextstep();
            } else {
                getCustomerInfo(userId, orderId, function (error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        customerInfo = result;
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetPickedUp step-1 check users', customerInfo: customerInfo });
                        nextstep();
                    }
                });
            }
        },

        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetPickedUp step-2 check order.',
                userId: userId,orderId:orderId });

            var selector = {'$and': [{_id: orderId}, {'$or': [{archived: false}, {archived: null}]}]};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };
            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('_id', orderId));
                } else {
                    order = result[0];
                    status = order.status;

                    if (order.is_expired && order.is_expired === true) {
                        isExpired = true;
                    }

                    checkTableOccupied = (order.order_type === _this.enums.OrderType.PREORDER) && isNotNull(body) && isNotNull(body.table_id);
                    if (status !== _this.enums.OrderStatus.CLOSED ) {
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order has not been closed yet', orderId));
                    } else if(order.is_takeout !== true && order.order_type !== _this.enums.OrderType.PREORDER){
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order is not a takeout order or pre order', orderId));
                    } else {
                        if(order.picked_up ===true){
                            callback(null,{status: 204});
                        }else{
                            nextstep();
                        }
                    }
                }
            });
        },

        function (nextstep) {
            if (isExpired === false && isNotNull(body) && isNotNull(body.table_id)) {
                var tableId = body.table_id;

                var selector = {_id: order.restaurantId, 'tables.tableId': tableId};
                var options = {fields: {'tables.$': 1, enable_customer_share_table: 1}};
                var helper = {collectionName: _this.enums.CollectionName.RESTAURANT};

                _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.SetPickedUp step-3 doFindRestaurant returns an error', error: error});
                        nextstep(new _this.httpExceptions.DataConflictedException('find restaurant', 'error'));
                    } else if (result === undefined || result === null || result === '' || result.length === 0) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.SetPickedUp step-3 doFindRestaurant returns empty'});
                        // nextstep(new _this.httpExceptions.ResourceNotFoundException('tableId', tableId));
                        nextstep(new _this.httpExceptions.CommonHttpErrorException('INVALID_REDEEM_RESTAURANT_TABLE', 'tableId', tableId));
                    } else {
                        checkTableOccupied = checkTableOccupied && (true !== result[0].enable_customer_share_table);
                        tableNo = result[0].tables[0].tableNo;
                        order.tableNo = tableNo;

                        _this.logger.info('%j', {function:'DEBUG-INFO: OOrder.SetPickedUp step-3 doFindRestaurant returns right'});
                        nextstep();
                    }
                });
            } else {
                nextstep();
            }
        },

        function (nextstep) {
            if(checkTableOccupied) {
                _this.logger.info('%j', {function: 'DEBUG-INFO: Order.SetPickedUp step-4 doFindTableOrder', tableId: body.table_id});

                var selector = {'$and': [
                    {'$or': [{'table_id': body.table_id}, {'tableId': body.table_id}, {'base_table_id': body.table_id}]},
                    {status: {'$in': [_this.enums.OrderStatus.INPROCESS, _this.enums.OrderStatus.SUBMITTED]}}
                ]};
                var options = {};
                var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

                _this.restaurantDataAPI.find(selector, options, helper, function(error, result){
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.SetPickedUp step-4 doFindTableOrder returns error', error: error});
                        nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                    }else if (result === null || result === '' || result.length ===0) {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetPickedUp step-4 doFindTableOrder returns empty'});
                        nextstep();
                    } else {
                        _this.logger.error('%j', { function: 'DEBUG-INFO: Order.SetPickedUp step-4 doFindTableOrder returns an error', error: 'table has order'});
                        nextstep(new _this.httpExceptions.CommonHttpErrorException('TABLE_OCCUPIED', 'the table has order', tableNo));
                    }
                });
            } else {
                nextstep();
            }
        },

        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetPickedUp step-5 update the picked_up status.',
                userId: userId,orderId:orderId });
            var  helper, criteria, document;

            if (isExpired === true) {
                apiresult = {status: 204};
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetPickedUp update the picked_up status returns preorder expired'});
                nextstep();
            } else {
                if (isNotNull(body) && isNotNull(body.table_id)) {
                    order.table_id = body.table_id;
                    order.tableId = body.table_id;
                    document = {
                        $set: {
                            picked_up: true,
                            lastmodified: nowTime,
                            last_modified: nowTime,
                            last_submission_time: nowTime,
                            redeemed_time: nowTime,
                            tableId: body.table_id,
                            table_id: body.table_id,
                            tableNo: tableNo
                        }
                    };
                } else {
                    document = {
                        $set: {
                            picked_up: true,
                            lastmodified: nowTime,
                            last_modified: nowTime,
                            redeemed_time: nowTime,
                        }
                    };
                }

                criteria = {'$and': [{_id: orderId}, {'$or': [{archived: false}, {archived: null}]}]};
                helper = {
                    collectionName: _this.enums.CollectionName.DINING_ORDERS,
                    callerScript: 'File: order.js; Method: SetPickedUp()',
                    apiVersion: 1
                };
                _this.restaurantDataAPI.update(criteria, document, options, helper, function (errors) {
                    if (errors) {
                        nextstep(errors);
                    } else {
                        apiresult = {status: 204};
                        nextstep();
                    }
                });
            }
        },
        // step-notification
        function (nextstep) {

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.SetPickedUp do step-notification', orderId: orderId});

            if (isExpired === true) {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetPickedUp do step-notification returns preorder expired'});
                nextstep();
            } else {
                var postData = {};
                postData.host = otherServers.notification.server_url;
                postData.port = otherServers.notification.server_port;
                postData.path = '/notifications';
                var mobile = '';
                if(order.note){
                    mobile = order.note.mobile;
                }
                var body = {};

                if (order.is_takeout) {
                    body = {
                        'command': _this.enums.PushMessageType.BROADCAST,
                        'user_id': order.user.user_id,
                        'user_name': order.user.user_name || '',
                        'restaurant_id': order.restaurant.restaurant_id,
                        'restaurant_name': order.restaurant.restaurant_name|| '',
                        'restaurant_phone': order.restaurant.officialPhone|| '',
                        'consumer_phone':mobile,
                        "pickup_time":order.picked_up_time||'',
                        'table_id': order.tableId,
                        'table_no': order.tableNo,
                        'order_id': orderId,
                        'code': _this.enums.PushMessageType.PICKED_UP_TAKEOUT
                    };
                } else {
                    var pickUpTime = isNotNull(order.note) ? _this.dataGenerationHelper.getValidUTCDateTimeFormat(order.note.effective_date) :
                        _this.dataGenerationHelper.getValidUTCDateTimeFormat();

                    body = {
                        'command': _this.enums.PushMessageType.BROADCAST,
                        'user_id': order.user.user_id,
                        'user_name': order.user.user_name || '',
                        'consumer_avatar_path': order.user.avatar_path ||'',
                        'restaurant_id': order.restaurant.restaurant_id,
                        'restaurant_name': order.restaurant.restaurant_name|| '',
                        'restaurant_phone': order.restaurant.officialPhone|| '',
                        'consumer_phone':mobile,
                        'pickup_time':pickUpTime,
                        'redeemed_time': _this.dataGenerationHelper.getValidUTCDateTimeFormat(nowTime),
                        'table_id': order.table_id,
                        'table_no': order.tableNo,
                        'order_id': orderId,
                        'code': _this.enums.PushMessageType.REDEEMED_PREORDER,
                        'deliver_type':'RELIABLE'
                    };
                }

                postData.method = 'POST';
                _this.logger.info('%j', {function: 'DEBUG-INFO: Order.SetPickedUp do step-notification', postData: postData});

                var loggerInfos = {
                    function : 'Order.SetPickedUp do step-notification'
                };

                _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', {
                            function: 'DEBUG-INFO: Order.SetPickedUp do step-notification returns an error',
                            error: error
                        });
                    } else {
                        _this.logger.info('%j', {function: 'DEBUG-INFO: Order.SetPickedUp do step-notification returns right'});
                    }
                }, reqParams, loggerInfos);
            }

            nextstep();
        },

        //step-doSendAaOrderSms
        function(nextstep){
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.SetPickedUp do step-doSendAaOrderSms', orderId: orderId,is_aa:order.is_aa});
            if(order.order_type === _this.enums.OrderType.PREORDER && order.is_aa){
                _this.logger.info('%j', {function: 'DEBUG-INFO: Order.SetPickedUp do step-doSendAaOrderSms is aa order, do send sms'});
                var parameters ={
                    order:order,
                    code:'AA_PICKED_UP',
                    otherServers:_this.config.other_servers,
                    picked_up_user:customerInfo,
                    headerToken:headerToken
                };
                _this.backendHelpers.aaOrderSms.sendAaOrderSms(parameters,function(error,result){
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.SetPickedUp do step-doSendAaOrderSms return result', result: result,error:error});
                })
            }else{
                _this.logger.info('%j', {function: 'DEBUG-INFO: Order.SetPickedUp do step-doSendAaOrderSms== is not aa order, do not send sms'});
            }
            nextstep();
        },

        // step-doCreatePrintTask
        function (nextstep) {
            if (order.order_type === _this.enums.OrderType.PREORDER) {
                // FBE-3046: if pre order expired, don't create print task
                if (isExpired === true) {
                    // send expired notification
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetPickedUp doCreatePrintTask returns preorder expired'});
                    nextstep();
                } else {
                    _this.createPrintTask(orderId, order, function (error, result) {
                        if (error) {
                            _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.SetPickedUp doCreatePrintTask returns error', error: error});
                            nextstep(new _this.httpExceptions.DataConflictedException('create print-task', 'error'));
                        } else {
                            if (result.length === 0) {
                                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetPickedUp doCreatePrintTask returns empty'});
                                nextstep();
                            } else {
                                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetPickedUp doCreatePrintTask returns right'});
                                nextstep();
                            }
                        }
                    })
                }
            } else {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetPickedUp doCreatePrintTask returns empty'});
                nextstep();
            }
        }

    ], function (error) {
        callback(error, apiresult);
    });
};

var GetVirtualTableNo = function (restaurantId, tableKey, localTimeFormat, callback) {
    var _this = exports;

    _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetVirtualTableNo received parameters', restaurantId: restaurantId});

    var selector = '';
    if (localTimeFormat !== '') {
        selector = {_id: restaurantId + '-' + tableKey + '-' + localTimeFormat};
    } else {
        selector = {_id: restaurantId + '-' + tableKey};
    }

    var document = {$inc: {sequence_number: 1}};
    var options = {new: true, upsert: true};
    var helper = {collectionName: _this.enums.CollectionName.TABLE_SEQUENCE};

    _this.restaurantDataAPI.findAndModify(selector, document, options, helper, function (error, result) {
        if (error) {
            _this.logger.error('%j', {
                function: 'DEBUG-ERROR: Order.GetVirtualTableNo query sequence number returns error',
                selector: selector,
                document: document,
                error: error
            });
            callback(error);
        } else {
            var tableSequence = result.value;

            var tableNo = tableKey + tableSequence.sequence_number

            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order.GetVirtualTableNo success',
                tableSequence: tableSequence
            });
            callback(null, tableNo);
        }
    })
}

var UpdateOrderNotes = function (reqParams, callback) {
    var _this = exports;

    var orderId = reqParams.orderId;
    var note = reqParams.note;
    if (isNotNull(note.effective_date)) {
        note.effective_date = _this.dataGenerationHelper.getValidUTCDate(note.effective_date);
    }

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderNotes received arguments', reqParams: reqParams});

    var apiResult = '';

    async.series([
        // step-1: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderNotes step-1 doFindOrder', orderId: orderId});

            var selector = {_id: orderId};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderNotes step-1 doFindOrder returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderNotes step-1 doFindOrder returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('order_id', orderId));
                } else {
                    var order = result[0];

                    var regularHours = order.restaurant.regular_hours;
                    var timezone = order.restaurant.time_zone;

                    var isInRegularHours =true;
                    if(order.order_type === _this.enums.OrderType.PREORDER){
                        isInRegularHours = _this.orderManager.isInRegularHours(note,regularHours,timezone);
                    }

                    if(!isInRegularHours){
                        nextstep(new _this.httpExceptions.CommonHttpErrorException('INVALID_PICKUP_TIME', 'effective date not in regular hours range'));
                    }else if (order.status === _this.enums.OrderStatus.PAID || order.status === _this.enums.OrderStatus.CLOSED) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderNotes step-1 doFindOrder returns an error', error: 'order has been paid or closed'});
                        nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'order has been paid or closed'));
                    } else {
                        if (order.orderItems && order.orderItems.length > 0) {
                            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderNotes step-1 doFindOrder returns right'});
                            nextstep();
                        } else {
                            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderNotes step-1 doFindOrder returns an error', error: 'order item is null'});
                            nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'order item is null'));
                        }
                    }
                }
            });
        },
        // step-2: doUpdateOrderNote
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderNotes step-2 doUpdateOrderNote', orderId: orderId});

            var selector = {_id: orderId};
            var document = {$set: {note: note}};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.update(selector, document, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderNotes step-2 doUpdateOrderNote returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('update dining-orders', 'error'));
                } else {
                    apiResult = {status: 204};

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderNotes step-2 doUpdateOrderNote returns right'});
                    nextstep();
                }
            });
        }

    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderNotes step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderNotes step-(right) callback'});
        }
        callback (error, apiResult);
    });
}

var UpdateOrderPickedUpTime = function (reqParams, callback) {
    var _this = exports;

    var orderId = reqParams.orderId;
    var pickedUpTimeChangeBody = reqParams.pickedUpTimeChangeBody;
    var otherServers = reqParams.otherServers;
    var headerToken = reqParams.headerToken;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderPickedUpTime received arguments', reqParams: reqParams});

    var apiResult = '';
    var order ={};
    var pickedUpTime ='';
    async.series([
        // step-1: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPickedUpTime step-1 doFindOrder', orderId: orderId});

            var selector = {_id: orderId, status: _this.enums.OrderStatus.CLOSED};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-ERROR: Order.UpdateOrderPickedUpTime step-1 doFindOrder returns an error',
                        error: error
                    });
                    nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function: 'DEBUG-ERROR: Order.UpdateOrderPickedUpTime step-1 doFindOrder returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('order_id', orderId));
                } else {
                    order = result[0];
                    pickedUpTime = order.picked_up_time;
                    if(!pickedUpTime){
                        pickedUpTime = _this.dataGenerationHelper.getValidUTCDate();
                    }
                    if (order.picked_up === true) {
                        _this.logger.error('%j', {
                            function: 'DEBUG-ERROR: Order.UpdateOrderPickedUpTime step-1 doFindOrder returns an error',
                            error: 'order has been picked up already'
                        });
                        nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'order has been picked up already'));
                    } else if (order.add_minutes) {
                        _this.logger.error('%j', {
                            function: 'DEBUG-ERROR: Order.UpdateOrderPickedUpTime step-1 doFindOrder returns an error',
                            error: 'order has been added ' + order.add_minutes + ' minutes already'
                        });
                        nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'order has been added ' + order.add_minutes + ' minutes already'));
                    } else {
                        _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateOrderPickedUpTime step-1 doFindOrder returns right'});
                        nextstep();
                    }
                }
            });
        },
        // step-2: doUpdateOrderNote
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPickedUpTime step-2 doUpdateOrderNote', orderId: orderId});

            var selector = {_id: orderId};
            pickedUpTime =  _this.dataGenerationHelper.getValidAfterMinuteUTCDate(pickedUpTime, pickedUpTimeChangeBody.add_minutes);
            var document = {$set: {add_minutes: pickedUpTimeChangeBody.add_minutes,picked_up_time:pickedUpTime}};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.update(selector, document, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPickedUpTime step-2 doUpdateOrderNote returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('update dining-orders', 'error'));
                } else {
                    apiResult = {status: 204};

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPickedUpTime step-2 doUpdateOrderNote returns right'});
                    nextstep();
                }
            });
        },

        // step-notification
        function (nextstep) {

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateOrderPickedUpTime do step-notification', orderId: orderId});

            var postData = {};
            postData.host = otherServers.notification.server_url;
            postData.port = otherServers.notification.server_port;
            postData.path = '/notifications';
            var mobile = '';
            if(order.note){
                mobile = order.note.mobile;
            }
            var orderItems = [];

            for (var i=0; i<order.order_items.length; i++) {
                var orderItem = order.order_items[i];

                orderItems.push({
                    order_item_user_id: orderItem.order_item_user_id,
                    order_item_id: orderItem.order_item_id,
                    item_id: orderItem.item_id,
                    item_name: orderItem.item_name,
                    item_names: orderItem.item_names
                })
            }

            var body = {
                'command': _this.enums.PushMessageType.BROADCAST,
                'user_id': order.user.user_id,
                'user_name': order.user.user_name || '',
                'restaurant_id': order.restaurant.restaurant_id,
                'restaurant_name': order.restaurant.restaurant_name|| '',
                'restaurant_phone': order.restaurant.officialPhone|| '',
                'wait_minutes':pickedUpTimeChangeBody.add_minutes,
                'consumer_phone':mobile,
                "pickup_time":pickedUpTime,
                'table_id': order.tableId,
                'table_no': order.tableNo,
                'order_id': orderId,
                'time_zone':order.restaurant.time_zone || _this.config.other_servers.time_zone.default_time_zone,
                'code': _this.enums.PushMessageType.MORE_WAITETIME_TAKEOUT,
                'order_items':orderItems
            };

            if (order.order_type === _this.enums.OrderType.DELIVERY) {
                body.consumer_phone = order.delivery_address.receiver.mobile;
                body.code = _this.enums.PushMessageType.MORE_WAITETIME_DELIVERY;
            }

            postData.method = 'POST';
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateOrderPickedUpTime do step-notification', postData: postData,body:body});

            var loggerInfos = {
                function : 'Order.UpdateOrderPickedUpTime do step-notification'
            };

            _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-INFO: Order.UpdateOrderPickedUpTime do step-notification returns an error',
                        error: error
                    });
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateOrderPickedUpTime do step-notification returns right'});
                }
            }, reqParams, loggerInfos);

            nextstep();
        }

    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPickedUpTime step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPickedUpTime step-(right) callback'});
        }
        callback (error, apiResult);
    });
}

var UpdateOrderDeliveryTime = function (reqParams, callback) {
    var _this = exports;

    var orderId = reqParams.orderId;
    var addMinutes = reqParams.body.add_minutes;
    var headerToken = reqParams.headerToken;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderDeliveryTime received arguments', reqParams: reqParams});

    var apiResult = '';
    var order ={};
    var deliveryTime ='';
    async.series([
        // step-1: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderDeliveryTime step-1 doFindOrder', orderId: orderId});

            var selector = {_id: orderId, status: _this.enums.OrderStatus.CLOSED,
                delivery_status: {$in: [_this.enums.DeliveryStatus.PREPARING, _this.enums.DeliveryStatus.READY]}};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-ERROR: Order.UpdateOrderDeliveryTime step-1 doFindOrder returns an error',
                        error: error
                    });
                    nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function: 'DEBUG-ERROR: Order.UpdateOrderDeliveryTime step-1 doFindOrder returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('order_id', orderId));
                } else {
                    order = result[0];
                    deliveryTime = order.picked_up_time;
                    if(!deliveryTime){
                        deliveryTime = _this.dataGenerationHelper.getValidUTCDate();
                    }
                    if (addMinutes <= 0) {
                        _this.logger.error('%j', {
                            function: 'DEBUG-ERROR: Order.UpdateOrderDeliveryTime step-1 doFindOrder returns an error',
                            error: 'add minutes is wrong'
                        });
                        nextstep(new _this.httpExceptions.InvalidParameterException('add_minutes', 'add minutes is wrong'));
                    } else {
                        _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateOrderDeliveryTime step-1 doFindOrder returns right'});
                        nextstep();
                    }
                }
            });
        },
        // step-2: doUpdateOrderNote
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPickedUpTime step-2 doUpdateOrderNote', orderId: orderId});

            var selector = {_id: orderId};
            deliveryTime =  _this.dataGenerationHelper.getValidAfterMinuteUTCDate(deliveryTime, addMinutes);
            var document = {$set: {add_minutes: addMinutes, delivery_time: deliveryTime}};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.update(selector, document, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPickedUpTime step-2 doUpdateOrderNote returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('update dining-orders', 'error'));
                } else {
                    apiResult = {status: 204};

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPickedUpTime step-2 doUpdateOrderNote returns right'});
                    nextstep();
                }
            });
        },

        // step-notification
        function (nextstep) {

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateOrderPickedUpTime do step-notification', orderId: orderId});

            var postData = {};
            postData.host = otherServers.notification.server_url;
            postData.port = otherServers.notification.server_port;
            postData.path = '/notifications';
            var mobile = '';
            if(order.note){
                mobile = order.note.mobile;
            }
            var orderItems = [];

            for (var i=0; i<order.order_items.length; i++) {
                var orderItem = order.order_items[i];

                orderItems.push({
                    order_item_user_id: orderItem.order_item_user_id,
                    order_item_id: orderItem.order_item_id,
                    item_id: orderItem.item_id,
                    item_name: orderItem.item_name,
                    item_names: orderItem.item_names
                })
            }

            var body = {
                'command': _this.enums.PushMessageType.BROADCAST,
                'user_id': order.user.user_id,
                'user_name': order.user.user_name || '',
                'restaurant_id': order.restaurant.restaurant_id,
                'restaurant_name': order.restaurant.restaurant_name|| '',
                'restaurant_phone': order.restaurant.officialPhone|| '',
                'wait_minutes':pickedUpTimeChangeBody.add_minutes,
                'consumer_phone':mobile,
                "pickup_time":pickedUpTime,
                'table_id': order.tableId,
                'table_no': order.tableNo,
                'order_id': orderId,
                'time_zone':order.restaurant.time_zone || _this.config.other_servers.time_zone.default_time_zone,
                'code': _this.enums.PushMessageType.MORE_WAITETIME_TAKEOUT,
                'order_items':orderItems
            };
            postData.method = 'POST';
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateOrderPickedUpTime do step-notification', postData: postData,body:body});

            var loggerInfos = {
                function : 'Order.UpdateOrderPickedUpTime do step-notification'
            };

            _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-INFO: Order.UpdateOrderPickedUpTime do step-notification returns an error',
                        error: error
                    });
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateOrderPickedUpTime do step-notification returns right'});
                }
            }, reqParams, loggerInfos);

            nextstep();
        }

    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPickedUpTime step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPickedUpTime step-(right) callback'});
        }
        callback (error, apiResult);
    });
}

var GetSequenceNo = function (collectionName, id, callback) {
    var _this = exports;

    _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetSequenceNo received parameters', collectionName: collectionName, id: id});

    var selector = {_id: id};
    var document = {$inc: {sequence_number: 1}};
    var options = {new: true, upsert: true};
    var helper = {collectionName: collectionName};

    _this.restaurantDataAPI.findAndModify(selector, document, options, helper, function (error, result) {
        if (error) {
            _this.logger.error('%j', {
                function: 'DEBUG-ERROR: Order.GetSequenceNo query sequence number returns error',
                selector: selector,
                document: document,
                error: error
            });
            callback(error);
        } else {
            var sequenceNo = result.value.sequence_number;

            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order.GetSequenceNo success',
                sequenceNo: sequenceNo
            });
            callback(null, sequenceNo);
        }
    });
}

var UpdateOrderPrint = function (reqParams, callback) {
    var _this = exports;

    var orderId = reqParams.orderId;
    var action = reqParams.action;
    var headerToken = reqParams.headerToken;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderPrint received arguments', reqParams: reqParams});

    var apiResult = '';

    var order = {};
    var printCount = 1;

    async.series([
        // step-1: doValidateAction
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPrint step-1 doValidateAction', action: action});

            if (action === _this.enums.PrintType.KITCHEN) {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPrint step-1 doValidateAction returns right'});
                nextstep();
            } else {
                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPrint step-1 doValidateAction returns error'});
                nextstep(new _this.httpExceptions.InvalidParameterException('action', action));
            }

        },
        // step-2: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPrint step-2 doFindOrder', orderId: orderId});

            var selector = {_id: orderId};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPrint step-2 doFindOrder returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPrint step-2 doFindOrder returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('order_id', orderId));
                } else {
                    order = result[0];

                    if (order.orderItems && order.orderItems.length > 0) {
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPrint step-2 doFindOrder returns right'});
                        nextstep();
                    } else {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPrint step-2 doFindOrder returns an error', error: 'order item is null'});
                        nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'order is not submitted'));
                    }
                }
            });
        },
        // step-3: doUpdateOrderPrint
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPrint step-3 doUpdateOrderPrint', orderId: orderId});

            var selector = {_id: orderId};

            var document = {};
            if (action === _this.enums.PrintType.KITCHEN) {
                if (order.is_takeout) {
                    document = {$inc: {slip_number_printed_takeout_in_kitchen: 1}};
                } else {
                    document = {$inc: {slip_number_printed_dine_in_kitchen: 1}};
                }
            }

            var options = {new: true, upsert: true};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.findAndModify(selector, document, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPrint step-3 doUpdateOrderPrint returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('update dining-orders', 'error'));
                } else {

                    if (action === _this.enums.PrintType.KITCHEN) {
                        if (order.is_takeout) {
                            printCount = result.value.slip_number_printed_takeout_in_kitchen;
                        } else {
                            printCount = result.value.slip_number_printed_dine_in_kitchen;
                        }
                    }

                    apiResult = {status: 204};

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPrint step-3 doUpdateOrderPrint returns right'});
                    nextstep();
                }
            });
        },
        // step-notification
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateOrderPrint do step-notification', orderId: orderId});

            var postData = {};
            postData.host = _this.config.other_servers.notification.server_url;
            postData.port = _this.config.other_servers.notification.server_port;
            postData.path = '/notifications';

            var body = {
                'command': _this.enums.PushMessageType.UPDATE,
                'order_id': orderId,
                'slip_number_printed_kitchen': printCount
            };

            if (action === _this.enums.PrintType.KITCHEN) {
                if (order.is_takeout) {
                    body['code'] = _this.enums.PushMessageType.PRINTED_TAKEOUT;
                } else {
                    body['code'] = _this.enums.PushMessageType.PRINTED_DINE_IN;
                }
            }

            postData.method = 'POST';
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateOrderPrint do step-notification', postData: postData,body:body});

            var loggerInfos = {
                function : 'Order.UpdateOrderPrint do step-notification'
            };

            _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-INFO: Order.UpdateOrderPrint do step-notification returns an error',
                        error: error
                    });
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.UpdateOrderPrint do step-notification returns right'});
                }
            }, reqParams, loggerInfos);

            nextstep();
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPrint step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPrint step-(right) callback'});
        }
        callback (error, apiResult);
    })
}

// first webp, second large, else ''
var GetMenuPhoto = function (photos) {
    var _this = exports;

    var menuPhoto = '';

    if (photos && photos.length>0) {

        var photoMap = {};

        for (var i=0; i<photos.length; i++) {
            var photo = photos[i];
            photoMap[photo.size] = photo.path;
        }

        if (photoMap[_this.enums.SizeOfPhoto.WEBP_LARGE]) {
            menuPhoto = photoMap[_this.enums.SizeOfPhoto.WEBP_LARGE];
        } else if (photoMap[_this.enums.SizeOfPhoto.LARGE]) {
            menuPhoto = photoMap[_this.enums.SizeOfPhoto.LARGE];
        }
    }

    return menuPhoto;

}

var GetRestaurantOrderStat = function (reqParams, callback) {
    var _this = exports;

    var restaurantId = reqParams.restaurantId;
    var startDate = reqParams.startDate;
    var endDate = reqParams.endDate;
    var timezone,startDate_utc,endDate_utc;
    var offset;
    var offset_milliseconds;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat', reqParams: reqParams});

    var apiResult = '';

    var currency = '';
    var orderAmounts = [];

    async.series([
        // step-1: doFindRestaurant
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-1 doFindRestaurant', restaurantId: restaurantId});

            var selector = {_id: restaurantId};
            var options = {fields: {currency: 1,time_zone:1}};
            var helper = {collectionName: _this.enums.CollectionName.RESTAURANT};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantOrderStat step-1 doFindRestaurant returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find restaurant', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantOrderStat step-1 doFindRestaurant returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('restaurantId', restaurantId));
                } else {
                    var restaurant = result[0];

                    currency = restaurant.currency;
                    timezone = restaurant.time_zone || _this.config.other_servers.time_zone.default_time_zone;

                    _this.logger.info('%j', {function:'DEBUG-INFO: OOrder.GetRestaurantOrderStat step-1 doFindRestaurant returns right'});
                    nextstep();
                }
            });
        },

        // step-2: doValidateDate
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-2 doValidateDate', startDate: startDate, endDate: endDate});

            var defaultStatDay = _this.config.other_servers.default_stat_day;

            // calculate the query date
            // the default query time is from 90 days ago to today
            // if startDate or endDate exists, we will use them, but the max range is 90 days ago from endDate, else startDate is 90 days ago from today and endDate is today
            /*if (!isNotNull(startDate) && !isNotNull(endDate)) {
             startDate = momentzone.tz(timezone).add( -defaultStatDay + 1,'day').hours(0).minutes(0).seconds(0).milliseconds(0);
             endDate = momentzone.tz(timezone).add(1,'day').hours(0).minutes(0).seconds(0).milliseconds(0);
             } else if (!isNotNull(startDate) && isNotNull(endDate)) {
             endDate = momentzone.tz(endDate,timezone).add( 1 ,'day').hours(0).minutes(0).seconds(0).milliseconds(0);
             startDate = momentzone.tz(endDate,timezone).add( -defaultStatDay ,'day').hours(0).minutes(0).seconds(0).milliseconds(0);
             } else if (isNotNull(startDate) && isNotNull(endDate)) {
             startDate = momentzone.tz(startDate,timezone).hours(0).minutes(0).seconds(0).milliseconds(0);
             endDate = momentzone.tz(endDate,timezone).add( 1 ,'day').hours(0).minutes(0).seconds(0).milliseconds(0);
             if (endDate.toDate().getTime() - startDate.toDate().getTime() > defaultStatDay * 24 * 60 * 60 * 1000) {
             startDate = momentzone.tz(endDate,timezone).add( -defaultStatDay ,'day').hours(0).minutes(0).seconds(0).milliseconds(0);
             }
             } else {
             startDate = momentzone.tz(startDate,timezone).hours(0).minutes(0).seconds(0).milliseconds(0);
             endDate = momentzone.tz(timezone).add(1,'day').hours(0).minutes(0).seconds(0).milliseconds(0);
             if (endDate.toDate().getTime() - startDate.toDate().getTime() > defaultStatDay * 24 * 60 * 60 * 1000) {
             startDate = momentzone.tz(timezone).add( -defaultStatDay ,'day').hours(0).minutes(0).seconds(0).milliseconds(0);
             }
             }*/
            if(isNotNull(startDate) && isNotNull(endDate)){
                startDate_utc = moment.utc(startDate);
                endDate_utc = moment.utc(endDate).add( 1 ,'day');
                if (endDate_utc.toDate().getTime() - startDate_utc.toDate().getTime() > defaultStatDay * 24 * 60 * 60 * 1000) {
                    startDate_utc = moment.utc(endDate).add('day', -defaultStatDay + 1);
                }

                startDate_utc = startDate_utc.clone().toDate();
                endDate_utc = endDate_utc.clone().toDate();

                startDate = momentzone.tz(startDate_utc,timezone);
                endDate = momentzone.tz(endDate_utc,timezone);

                offset = momentzone.tz.zone(timezone).parse(endDate.toDate().getTime());
                offset_milliseconds  = offset * 60 * 1000;

                _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-2 doValidateDate returns right=====',
                    startDate:startDate,
                    endDate:endDate,
                    startDate_timezone:startDate_utc,
                    endDate_timezone:endDate_utc,
                    timezone:timezone,
                    offset:offset
                });

                nextstep();
            }else{
                nextstep(new _this.httpExceptions.InvalidParameterException('please pass start date and end date', null))
            }

        },

        // step-3: doFindRestaurantOrderStat
        function (nextstep) {
            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-3 doFindRestaurantOrderStat',
                startDate: startDate,
                endDate: endDate,
                startDate_utc:startDate_utc,
                endDate_utc:endDate_utc,
                offset:offset,
                offset_milliseconds:offset_milliseconds
            });
            var aggregate_array = [];
            var selector = {
                'restaurant.restaurant_id': restaurantId,
                status: {$in: [_this.enums.OrderStatus.PAID, _this.enums.OrderStatus.CLOSED, _this.enums.OrderStatus.CANCELLED]},
                update_time: {$gte: startDate_utc, $lt: endDate_utc}
            };

            selector['$or'] = [
                // dinner order
                {$and: [{order_type: {$exists: 0}}, {is_takeout: {$ne: true}}, {payment: {$exists: 1}}]},
                // takeout order
                {$and: [{is_takeout: true}, {payment: {$exists: 1}}]},
                // redeemed pre order
                {$and: [{picked_up: true}, {order_type: _this.enums.OrderType.PREORDER}, {payment: {$exists: 1}}]},
                // delivery order
                {$and: [{order_type: _this.enums.OrderType.DELIVERY}, {payment: {$exists: 1}}]},
                // unpaid all order
                {$and: [{status: _this.enums.OrderStatus.CANCELLED}]}
            ];

            var match = {$match:selector};
            aggregate_array.push(match);
            var first_project = {
                $project:{
                    time:"$update_time",
                    local_time:{$subtract:["$update_time",offset * 60 * 1000]},
                    status:"$status",
                    order_type:"$order_type",
                    is_takeout:"$is_takeout",
                    isOnlinePayment:"$bill_status.is_online_payment",
                    split_payment_going_to_restaurant:"$payment.split_payment_going_to_restaurant",
                    sub_total_before_first_visit_savings:"$payment.sub_total_before_first_visit_savings",
                    delivery_fee:"$delivery_payment.delivery_fee",
                    delivery_fee_saving:"$delivery_payment.delivery_fee_saving"
                }};
            aggregate_array.push(first_project);
            var second_project = {
                $project:{
                    time:"$time", time_for_group: { $dateToString: { format: "%Y-%m-%d", date: "$local_time" } },
                    local_time:"$local_time",status:"$status",order_type:"$order_type",is_takeout:"$is_takeout",
                    preorder_order_count_unpaid:{ $cond: { if: {$and:[ {$eq: [ "$status", 'CANCELLED' ]},{$eq:["$order_type",'PREORDER']} ] }, then: 1, else: 0 }},
                    takeout_order_count_unpaid: { $cond: { if: {$and:[ {$eq: [ "$status", 'CANCELLED' ]},{$ne:["$order_type",'PREORDER']},{$eq:["$is_takeout",true]}]}, then: 1, else: 0 }},
                    dine_in_order_count_unpaid: { $cond: { if: {$and:[ {$eq: [ "$status", 'CANCELLED' ]},{$ne:["$order_type",'PREORDER']},{$ne:["$is_takeout",true]}]}, then: 1, else: 0 }},
                    delivery_order_count_unpaid:{ $cond: { if: {$eq:["1","1"]},then: 0 ,else: 0 }},

                    preorder_order_count: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$eq:["$order_type",'PREORDER']}]}, then: 1, else: 0 }},
                    online_preorder_payment_count: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$eq:["$order_type",'PREORDER']},{$eq:["$isOnlinePayment",true]}]}, then: 1, else: 0 }},
                    online_preorder_payment_amount: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$eq:["$order_type",'PREORDER']},{$eq:["$isOnlinePayment",true]}]}, then: "$split_payment_going_to_restaurant", else: 0 }},
                    offline_preorder_payment_count: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$eq:["$order_type",'PREORDER']},{$ne:["$isOnlinePayment",true]}]}, then: 1, else: 0 }},
                    offline_preorder_payment_amount: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$eq:["$order_type",'PREORDER']},{$ne:["$isOnlinePayment",true]}]}, then: "$sub_total_before_first_visit_savings", else: 0 }},

                    delivery_order_count: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$eq:["$order_type",'DELIVERY']}]}, then: 1, else: 0 }},
                    online_delivery_payment_count: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$eq:["$order_type",'DELIVERY']},{$eq:["$isOnlinePayment",true]}]}, then: 1, else: 0 }},
                    online_delivery_payment_amount: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$eq:["$order_type",'DELIVERY']},{$eq:["$isOnlinePayment",true]}]}, then:  {$subtract:[{$add: [ "$split_payment_going_to_restaurant", "$delivery_fee"]} ,"$delivery_fee_saving"]} , else: 0 }},
                    offline_delivery_payment_count: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$eq:["$order_type",'DELIVERY']},{$ne:["$isOnlinePayment",true]}]}, then: 1, else: 0 }},
                    offline_delivery_payment_amount: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$eq:["$order_type",'DELIVERY']},{$ne:["$isOnlinePayment",true]}]}, then: "$sub_total_before_first_visit_savings", else: 0 }},

                    takeout_order_count: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$ne:["$order_type",'PREORDER']},{$ne:["$order_type",'DELIVERY']},{$eq:["$is_takeout",true]}]}, then: 1, else: 0 }},
                    online_takeout_payment_count: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$ne:["$order_type",'PREORDER']},{$ne:["$order_type",'DELIVERY']},{$eq:["$isOnlinePayment",true]},{$eq:["$is_takeout",true]}]}, then: 1, else: 0 }},
                    online_takeout_payment_amount: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$ne:["$order_type",'PREORDER']},{$ne:["$order_type",'DELIVERY']},{$eq:["$isOnlinePayment",true]},{$eq:["$is_takeout",true]}]}, then: "$split_payment_going_to_restaurant", else: 0 }},
                    offline_takeout_payment_count: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$ne:["$order_type",'PREORDER']},{$ne:["$order_type",'DELIVERY']},{$ne:["$isOnlinePayment",true]},{$eq:["$is_takeout",true]}]}, then: 1, else: 0 }},
                    offline_takeout_payment_amount: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$ne:["$order_type",'PREORDER']},{$ne:["$order_type",'DELIVERY']},{$ne:["$isOnlinePayment",true]},{$eq:["$is_takeout",true]}]}, then: "$sub_total_before_first_visit_savings", else: 0 }},

                    dine_in_order_count: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$ne:["$order_type",'PREORDER']},{$ne:["$order_type",'DELIVERY']},{$ne:["$is_takeout",true]}]}, then: 1, else: 0 }},
                    online_dine_in_payment_count: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$ne:["$order_type",'PREORDER']},{$ne:["$order_type",'DELIVERY']},{$eq:["$isOnlinePayment",true]},{$ne:["$is_takeout",true]}]}, then: 1, else: 0 }},
                    online_dine_in_payment_amount: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$ne:["$order_type",'PREORDER']},{$ne:["$order_type",'DELIVERY']},{$eq:["$isOnlinePayment",true]},{$ne:["$is_takeout",true]}]}, then: "$split_payment_going_to_restaurant", else: 0 }},
                    offline_dine_in_payment_count: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$ne:["$order_type",'PREORDER']},{$ne:["$order_type",'DELIVERY']},{$ne:["$isOnlinePayment",true]},{$ne:["$is_takeout",true]}]}, then: 1, else: 0 }},
                    offline_dine_in_payment_amount: { $cond: { if: {$and:[ {$ne: [ "$status", 'CANCELLED' ]},{$ne:["$order_type",'PREORDER']},{$ne:["$order_type",'DELIVERY']},{$ne:["$isOnlinePayment",true]},{$ne:["$is_takeout",true]}]}, then: "$sub_total_before_first_visit_savings", else: 0 }}
                }
            };
            aggregate_array.push(second_project);

            var group = {
                $group:{
                    _id:"$time_for_group",
                    preorder_order_count_unpaid:{$sum:"$preorder_order_count_unpaid"},
                    takeout_order_count_unpaid:{$sum:"$takeout_order_count_unpaid"},
                    dine_in_order_count_unpaid:{$sum:"$dine_in_order_count_unpaid"},
                    delivery_order_count_unpaid:{$sum:"delivery_order_count_unpaid"},

                    preorder_order_count:{$sum:"$preorder_order_count"},
                    online_preorder_payment_count:{$sum:"$online_preorder_payment_count"},
                    online_preorder_payment_amount:{$sum:"$online_preorder_payment_amount"},
                    offline_preorder_payment_count:{$sum:"$offline_preorder_payment_count"},
                    offline_preorder_payment_amount:{$sum:"$offline_preorder_payment_amount"},

                    delivery_order_count:{$sum:"$delivery_order_count"},
                    online_delivery_payment_count:{$sum:"$online_delivery_payment_count"},
                    online_delivery_payment_amount:{$sum:"$online_delivery_payment_amount"},
                    offline_delivery_payment_count:{$sum:"$offline_delivery_payment_count"},
                    offline_delivery_payment_amount:{$sum:"$offline_delivery_payment_amount"},

                    takeout_order_count:{$sum:"$takeout_order_count"},
                    online_takeout_payment_count:{$sum:"$online_takeout_payment_count"},
                    online_takeout_payment_amount:{$sum:"$online_takeout_payment_amount"},
                    offline_takeout_payment_count:{$sum:"$offline_takeout_payment_count"},
                    offline_takeout_payment_amount:{$sum:"$offline_takeout_payment_amount"},

                    dine_in_order_count:{$sum:"$dine_in_order_count"},
                    online_dine_in_payment_count:{$sum:"$online_dine_in_payment_count"},
                    online_dine_in_payment_amount:{$sum:"$online_dine_in_payment_amount"},
                    offline_dine_in_payment_count:{$sum:"$offline_dine_in_payment_count"},
                    offline_dine_in_payment_amount:{$sum:"$offline_dine_in_payment_amount"}
                }
            };
            aggregate_array.push(group);

            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.aggregateWithArray(aggregate_array, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-ERROR: Order.GetRestaurantOrderStat step-3 doFindRestaurantOrderStat returns error',
                        error: error
                    });
                    nextstep(new _this.httpExceptions.DataConflictedException('group dinning-orders', 'error'));
                } else {
                    orderAmounts = result;

                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-3 doFindRestaurantOrderStat returns right'});
                    nextstep();
                }
            });

        },
        // step-4: doPopulateResult
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-4 doPopulateResult'});
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-4 doPopulateResult ====orderAmounts',
                orderAmounts:orderAmounts});
            var totalTransaction = {
                count: {
                    dine_in: {
                        order_count: 0,
                        order_count_unpaid: 0
                    },
                    takeout: {
                        order_count: 0,
                        order_count_unpaid: 0
                    },
                    preorder: {
                        order_count: 0,
                        order_count_unpaid: 0
                    },
                    delivery: {
                        order_count: 0,
                        order_count_unpaid: 0
                    }
                },
                online_payment: {
                    dine_in: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    takeout: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    preorder: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    delivery: {
                        order_count: 0,
                        transaction_amount: 0
                    }
                },
                offline_payment: {
                    dine_in: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    takeout: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    preorder: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    delivery: {
                        order_count: 0,
                        transaction_amount: 0
                    }
                }
            };

            var orderAmountMap = {};
            for (var i = 0; i < orderAmounts.length; i++) {
                var orderAmount = orderAmounts[i];

                for (var key in orderAmount) {
                    var value = orderAmount[key];
                    orderAmount[key] = _this.dataGenerationHelper.getAccurateNumber(value, 2);
                }

                //var date = _this.dataGenerationHelper.getValidUTCDateTimeFormat(orderAmount._id);
                var date = orderAmount._id;
                var orderStat = {
                    date: date,
                    count: {
                        dine_in: {
                            order_count: orderAmount.dine_in_order_count,
                            order_count_unpaid: orderAmount.dine_in_order_count_unpaid
                        },
                        takeout: {
                            order_count: orderAmount.takeout_order_count,
                            order_count_unpaid: orderAmount.takeout_order_count_unpaid
                        },
                        preorder: {
                            order_count: orderAmount.preorder_order_count,
                            order_count_unpaid: orderAmount.preorder_order_count_unpaid
                        },
                        delivery: {
                            order_count: orderAmount.delivery_order_count,
                            order_count_unpaid: orderAmount.delivery_order_count_unpaid
                        }
                    },
                    online_payment: {
                        dine_in: {
                            order_count: orderAmount.online_dine_in_payment_count,
                            transaction_amount: orderAmount.online_dine_in_payment_amount
                        },
                        takeout: {
                            order_count: orderAmount.online_takeout_payment_count,
                            transaction_amount: orderAmount.online_takeout_payment_amount
                        },
                        preorder: {
                            order_count: orderAmount.online_preorder_payment_count,
                            transaction_amount: orderAmount.online_preorder_payment_amount
                        },
                        delivery: {
                            order_count: orderAmount.online_delivery_payment_count,
                            transaction_amount: orderAmount.online_delivery_payment_amount
                        }
                    },
                    offline_payment: {
                        dine_in: {
                            order_count: orderAmount.offline_dine_in_payment_count,
                            transaction_amount: orderAmount.offline_dine_in_payment_amount
                        },
                        takeout: {
                            order_count: orderAmount.offline_takeout_payment_count,
                            transaction_amount: orderAmount.offline_takeout_payment_amount
                        },
                        preorder: {
                            order_count: orderAmount.offline_preorder_payment_count,
                            transaction_amount: orderAmount.offline_preorder_payment_amount
                        },
                        delivery: {
                            order_count: orderAmount.offline_delivery_payment_count,
                            transaction_amount: orderAmount.offline_delivery_payment_amount
                        }
                    }
                };
                orderAmountMap[date] = orderStat;

                totalTransaction.count.dine_in.order_count += orderAmount.dine_in_order_count;
                totalTransaction.count.dine_in.order_count_unpaid += orderAmount.dine_in_order_count_unpaid;
                totalTransaction.count.takeout.order_count += orderAmount.takeout_order_count;
                totalTransaction.count.takeout.order_count_unpaid += orderAmount.takeout_order_count_unpaid;
                totalTransaction.count.preorder.order_count += orderAmount.preorder_order_count;
                totalTransaction.count.preorder.order_count_unpaid += orderAmount.preorder_order_count_unpaid;
                totalTransaction.count.delivery.order_count += orderAmount.delivery_order_count;
                totalTransaction.count.delivery.order_count_unpaid += orderAmount.delivery_order_count_unpaid;
                totalTransaction.online_payment.dine_in.order_count += orderAmount.online_dine_in_payment_count;
                totalTransaction.online_payment.dine_in.transaction_amount += orderAmount.online_dine_in_payment_amount;
                totalTransaction.online_payment.takeout.order_count += orderAmount.online_takeout_payment_count;
                totalTransaction.online_payment.takeout.transaction_amount += orderAmount.online_takeout_payment_amount;
                totalTransaction.online_payment.preorder.order_count += orderAmount.online_preorder_payment_count;
                totalTransaction.online_payment.preorder.transaction_amount += orderAmount.online_preorder_payment_amount;
                totalTransaction.online_payment.delivery.order_count += orderAmount.online_delivery_payment_count;
                totalTransaction.online_payment.delivery.transaction_amount += orderAmount.online_delivery_payment_amount;
                totalTransaction.offline_payment.dine_in.order_count += orderAmount.offline_dine_in_payment_count;
                totalTransaction.offline_payment.dine_in.transaction_amount += orderAmount.offline_dine_in_payment_amount;
                totalTransaction.offline_payment.takeout.order_count += orderAmount.offline_takeout_payment_count;
                totalTransaction.offline_payment.takeout.transaction_amount += orderAmount.offline_takeout_payment_amount;
                totalTransaction.offline_payment.preorder.order_count += orderAmount.offline_preorder_payment_count;
                totalTransaction.offline_payment.preorder.transaction_amount += orderAmount.offline_preorder_payment_amount;
                totalTransaction.offline_payment.delivery.order_count += orderAmount.offline_delivery_payment_count;
                totalTransaction.offline_payment.delivery.transaction_amount += orderAmount.offline_delivery_payment_amount;
            }

            var orderStats = [];

            while (startDate.toDate().getTime() < endDate.toDate().getTime()) {
                var orderStat = {};

                // var date = _this.dataGenerationHelper.getValidUTCDateTimeFormat(startDate.getTime());
                var date = startDate.clone().format('YYYY-MM-DD');

                if (orderAmountMap[date]) {
                    orderStat = orderAmountMap[date];
                } else {
                    orderStat = {
                        date:date,
                        online_payment: {
                            dine_in: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            takeout: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            preorder: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            delivery: {
                                order_count: 0,
                                transaction_amount: 0
                            }
                        },
                        offline_payment: {
                            dine_in: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            takeout: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            preorder: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            delivery: {
                                order_count: 0,
                                transaction_amount: 0
                            }
                        }
                    };
                }

                startDate = startDate.add( 24 * 60,'minutes') ;

                orderStats.push(orderStat);
            }

            totalTransaction = _this.dataGenerationHelper.formatNumberByRecursion(totalTransaction, 2);

            var result = {
                currency: currency,
                total_transaction: totalTransaction,
                order_stat: orderStats
            }

            apiResult = {status: 200, data: result};

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-4 doPopulateResult returns right'});
            nextstep();
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantOrderStat step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetRestaurantOrderStat step-(right) callback'});
        }

        callback(error, apiResult);
    });

};

var GetRestaurantOrderStat_old = function (reqParams, callback) {
    var _this = exports;

    var restaurantId = reqParams.restaurantId;
    var startDate = reqParams.startDate;
    var endDate = reqParams.endDate;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat', reqParams: reqParams});

    var apiResult = '';

    var currency = '';
    var orderAmounts = [];

    async.series([
        // step-1: doValidateDate
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-1 doValidateDate', startDate: startDate, endDate: endDate});

            var defaultStatDay = _this.config.other_servers.default_stat_day;

            // calculate the query date
            // the default query time is from 90 days ago to today
            // if startDate or endDate exists, we will use them, but the max range is 90 days ago from endDate, else startDate is 90 days ago from today and endDate is today
            if (!isNotNull(startDate) && !isNotNull(endDate)) {
                startDate = moment().local().add('day', -defaultStatDay + 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                endDate = moment().local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
            } else if (!isNotNull(startDate) && isNotNull(endDate)) {
                endDate = moment(endDate).local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                startDate = moment(endDate).local().add('day', -defaultStatDay).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
            } else if (isNotNull(startDate) && isNotNull(endDate)) {
                startDate = moment(startDate).local().hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                endDate = moment(endDate).local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                if (endDate.getTime() - startDate.getTime() > defaultStatDay * 24 * 60 * 60 * 1000) {
                    startDate = moment(endDate).local().add('day', -defaultStatDay).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                }
            } else {
                startDate = moment(startDate).local().hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                endDate = moment().local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                if (endDate.getTime() - startDate.getTime() > defaultStatDay * 24 * 60 * 60 * 1000) {
                    startDate = moment().local().add('day', -defaultStatDay + 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                }
            }

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-1 doValidateDate returns right'});
            nextstep();
        },
        // step-2: doFindRestaurant
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-2 doFindRestaurant', restaurantId: restaurantId});

            var selector = {_id: restaurantId};
            var options = {fields: {currency: 1}};
            var helper = {collectionName: _this.enums.CollectionName.RESTAURANT};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantOrderStat step-2 doFindRestaurant returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find restaurant', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantOrderStat step-2 doFindRestaurant returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('restaurantId', restaurantId));
                } else {
                    var restaurant = result[0];

                    currency = restaurant.currency;

                    _this.logger.info('%j', {function:'DEBUG-INFO: OOrder.GetRestaurantOrderStat step-2 doFindRestaurant returns right'});
                    nextstep();
                }
            });
        },
        // step-3: doFindRestaurantOrderStat
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-3 doFindRestaurantOrderStat', startDate: startDate, endDate: endDate});

            var selector = {'restaurant.restaurant_id': restaurantId, status: {$in: [_this.enums.OrderStatus.PAID, _this.enums.OrderStatus.CLOSED, _this.enums.OrderStatus.CANCELLED]},
                update_time: {$gte:  startDate, $lt: endDate}};

            selector['$or'] = [
                // dinner order
                {$and: [{order_type: {$exists: 0}}, {is_takeout: {$ne: true}}, {payment: {$exists: 1}}]},
                // takeout order
                {$and: [{is_takeout: true}, {payment: {$exists: 1}}]},
                // redeemed pre order
                {$and: [{picked_up: true}, {order_type: _this.enums.OrderType.PREORDER}, {payment: {$exists: 1}}]},
                // delivery order
                {$and: [{order_type: _this.enums.OrderType.DELIVERY}, {payment: {$exists: 1}}]},
                // unpaid all order
                {$and: [{status: _this.enums.OrderStatus.CANCELLED}]}
            ];

            var keys = function(doc) {
                var date = new Date(doc.update_time);
                var dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                return {day:dateKey};
            };
            var condition = selector;
            var initial = {dine_in_order_count: 0, dine_in_order_count_unpaid: 0, takeout_order_count: 0, takeout_order_count_unpaid: 0,
                preorder_order_count: 0, preorder_order_count_unpaid: 0, delivery_order_count: 0, delivery_order_count_unpaid: 0,
                online_dine_in_payment_count: 0, online_dine_in_payment_amount: 0, online_takeout_payment_count: 0, online_takeout_payment_amount: 0,
                online_preorder_payment_count: 0, online_preorder_payment_amount: 0, offline_preorder_payment_count: 0, offline_preorder_payment_amount: 0,
                offline_dine_in_payment_count: 0, offline_dine_in_payment_amount: 0, offline_takeout_payment_count: 0, offline_takeout_payment_amount: 0,
                online_delivery_payment_count: 0, online_delivery_payment_amount: 0, offline_delivery_payment_count: 0, offline_delivery_payment_amount: 0};
            var reduce = function(obj, out) {

                var status = obj.status;
                if (status === 'CANCELLED') {
                    if (obj.order_type === 'PREORDER') {
                        out.preorder_order_count_unpaid++;
                    } else if (obj.is_takeout === true) {
                        out.takeout_order_count_unpaid++;
                    } else {
                        out.dine_in_order_count_unpaid++;
                    }
                } else {
                    var isOnlinePayment = obj.bill_status.is_online_payment;

                    if (obj.order_type === 'PREORDER') {
                        out.preorder_order_count++;

                        if (isOnlinePayment === true) {
                            out.online_preorder_payment_count++;
                            out.online_preorder_payment_amount += obj.payment.split_payment_going_to_restaurant;
                        } else {
                            out.offline_preorder_payment_count++;
                            out.offline_preorder_payment_amount += obj.payment.sub_total_before_first_visit_savings;
                        }

                    } else if (obj.order_type === 'DELIVERY') {
                        out.delivery_order_count++;

                        if (isOnlinePayment === true) {
                            out.online_delivery_payment_count++;
                            out.online_delivery_payment_amount += obj.payment.split_payment_going_to_restaurant +
                                obj.delivery_payment.delivery_fee - obj.delivery_payment.delivery_fee_saving;
                        } else {
                            out.offline_delivery_payment_count++;
                            out.offline_delivery_payment_amount += obj.payment.sub_total_before_first_visit_savings;
                        }
                    }else if (obj.is_takeout === true) {
                        out.takeout_order_count++;

                        if (isOnlinePayment === true) {
                            out.online_takeout_payment_count++;
                            out.online_takeout_payment_amount += obj.payment.split_payment_going_to_restaurant;
                        } else {
                            out.offline_takeout_payment_count++;
                            out.offline_takeout_payment_amount += obj.payment.sub_total_before_first_visit_savings;
                        }
                    } else {
                        out.dine_in_order_count++;

                        if (isOnlinePayment === true) {
                            out.online_dine_in_payment_count++;
                            out.online_dine_in_payment_amount += obj.payment.split_payment_going_to_restaurant;
                        } else {
                            out.offline_dine_in_payment_count++;
                            out.offline_dine_in_payment_amount += obj.payment.sub_total_before_first_visit_savings;
                        }
                    }
                }

                //var isOnlinePayment = obj.bill_status.is_online_payment;
                //if (isOnlinePayment === true) {
                //    if (obj.is_takeout === true) {
                //        out.online_takeout_payment_count++;
                //        out.online_takeout_payment_amount += obj.payment.split_payment_going_to_restaurant;
                //    } else {
                //        out.online_dine_in_payment_count++;
                //        out.online_dine_in_payment_amount += obj.payment.split_payment_going_to_restaurant;
                //    }
                //} else {
                //    if (obj.is_takeout === true) {
                //        out.offline_takeout_payment_count++;
                //        out.offline_takeout_payment_amount += obj.payment.sub_total_before_first_visit_savings;
                //    } else {
                //        out.offline_dine_in_payment_count++;
                //        out.offline_dine_in_payment_amount += obj.payment.sub_total_before_first_visit_savings;
                //    }
                //}
            };
            var finalize = null;
            var command = null;
            var options = null;
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.group(keys, condition, initial, reduce, finalize,command, options, helper, function(error, res) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantOrderStat step-3 doFindRestaurantOrderStat returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('group dinning-orders', 'error'));
                } else {
                    orderAmounts = res;

                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-3 doFindRestaurantOrderStat returns right'});
                    nextstep();
                }
            });
        },
        // step-4: doPopulateResult
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-4 doPopulateResult'});

            var totalTransaction = {
                count: {
                    dine_in: {
                        order_count: 0,
                        order_count_unpaid: 0
                    },
                    takeout: {
                        order_count: 0,
                        order_count_unpaid: 0
                    },
                    preorder: {
                        order_count: 0,
                        order_count_unpaid: 0
                    },
                    delivery: {
                        order_count: 0,
                        order_count_unpaid: 0
                    }
                },
                online_payment: {
                    dine_in: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    takeout: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    preorder: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    delivery: {
                        order_count: 0,
                        transaction_amount: 0
                    }
                },
                offline_payment: {
                    dine_in: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    takeout: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    preorder: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    delivery: {
                        order_count: 0,
                        transaction_amount: 0
                    }
                }
            };

            var orderAmountMap = {};
            for (var i=0; i<orderAmounts.length; i++) {
                var orderAmount = orderAmounts[i];

                for (var key in orderAmount) {
                    var value = orderAmount[key];
                    orderAmount[key] = _this.dataGenerationHelper.getAccurateNumber(value, 2);
                }

                var date = _this.dataGenerationHelper.getValidUTCDateTimeFormat(orderAmount.day)
                var orderStat = {
                    date: date,
                    count: {
                        dine_in: {
                            order_count: orderAmount.dine_in_order_count,
                            order_count_unpaid: orderAmount.dine_in_order_count_unpaid
                        },
                        takeout: {
                            order_count: orderAmount.takeout_order_count,
                            order_count_unpaid: orderAmount.takeout_order_count_unpaid
                        },
                        preorder: {
                            order_count: orderAmount.preorder_order_count,
                            order_count_unpaid: orderAmount.preorder_order_count_unpaid
                        },
                        delivery: {
                            order_count: orderAmount.delivery_order_count,
                            order_count_unpaid: orderAmount.delivery_order_count_unpaid
                        }
                    },
                    online_payment: {
                        dine_in: {
                            order_count: orderAmount.online_dine_in_payment_count,
                            transaction_amount: orderAmount.online_dine_in_payment_amount
                        },
                        takeout: {
                            order_count: orderAmount.online_takeout_payment_count,
                            transaction_amount: orderAmount.online_takeout_payment_amount
                        },
                        preorder: {
                            order_count: orderAmount.online_preorder_payment_count,
                            transaction_amount: orderAmount.online_preorder_payment_amount
                        },
                        delivery: {
                            order_count: orderAmount.online_delivery_payment_count,
                            transaction_amount: orderAmount.online_delivery_payment_amount
                        }
                    },
                    offline_payment: {
                        dine_in: {
                            order_count: orderAmount.offline_dine_in_payment_count,
                            transaction_amount: orderAmount.offline_dine_in_payment_amount
                        },
                        takeout: {
                            order_count: orderAmount.offline_takeout_payment_count,
                            transaction_amount: orderAmount.offline_takeout_payment_amount
                        },
                        preorder: {
                            order_count: orderAmount.offline_preorder_payment_count,
                            transaction_amount: orderAmount.offline_preorder_payment_amount
                        },
                        delivery: {
                            order_count: orderAmount.offline_delivery_payment_count,
                            transaction_amount: orderAmount.offline_delivery_payment_amount
                        }
                    }
                };
                orderAmountMap[date] = orderStat;

                totalTransaction.count.dine_in.order_count += orderAmount.dine_in_order_count;
                totalTransaction.count.dine_in.order_count_unpaid += orderAmount.dine_in_order_count_unpaid;
                totalTransaction.count.takeout.order_count += orderAmount.takeout_order_count;
                totalTransaction.count.takeout.order_count_unpaid += orderAmount.takeout_order_count_unpaid;
                totalTransaction.count.preorder.order_count += orderAmount.preorder_order_count;
                totalTransaction.count.preorder.order_count_unpaid += orderAmount.preorder_order_count_unpaid;
                totalTransaction.count.delivery.order_count += orderAmount.delivery_order_count;
                totalTransaction.count.delivery.order_count_unpaid += orderAmount.delivery_order_count_unpaid;
                totalTransaction.online_payment.dine_in.order_count += orderAmount.online_dine_in_payment_count;
                totalTransaction.online_payment.dine_in.transaction_amount += orderAmount.online_dine_in_payment_amount;
                totalTransaction.online_payment.takeout.order_count += orderAmount.online_takeout_payment_count;
                totalTransaction.online_payment.takeout.transaction_amount += orderAmount.online_takeout_payment_amount;
                totalTransaction.online_payment.preorder.order_count += orderAmount.online_preorder_payment_count;
                totalTransaction.online_payment.preorder.transaction_amount += orderAmount.online_preorder_payment_amount;
                totalTransaction.online_payment.delivery.order_count += orderAmount.online_delivery_payment_count;
                totalTransaction.online_payment.delivery.transaction_amount += orderAmount.online_delivery_payment_amount;
                totalTransaction.offline_payment.dine_in.order_count += orderAmount.offline_dine_in_payment_count;
                totalTransaction.offline_payment.dine_in.transaction_amount += orderAmount.offline_dine_in_payment_amount;
                totalTransaction.offline_payment.takeout.order_count += orderAmount.offline_takeout_payment_count;
                totalTransaction.offline_payment.takeout.transaction_amount += orderAmount.offline_takeout_payment_amount;
                totalTransaction.offline_payment.preorder.order_count += orderAmount.offline_preorder_payment_count;
                totalTransaction.offline_payment.preorder.transaction_amount += orderAmount.offline_preorder_payment_amount;
                totalTransaction.offline_payment.delivery.order_count += orderAmount.offline_delivery_payment_count;
                totalTransaction.offline_payment.delivery.transaction_amount += orderAmount.offline_delivery_payment_amount;
            }

            var orderStats = [];
            while(startDate.getTime() < endDate.getTime()) {
                var orderStat = {};

                var date = _this.dataGenerationHelper.getValidUTCDateTimeFormat(startDate.getTime());
                if (orderAmountMap[date]) {
                    orderStat = orderAmountMap[date];
                } else {
                    orderStat = {
                        date: _this.dataGenerationHelper.getValidUTCDateTimeFormat(startDate.getTime()),
                        online_payment: {
                            dine_in: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            takeout: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            preorder: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            delivery: {
                                order_count: 0,
                                transaction_amount: 0
                            }
                        },
                        offline_payment: {
                            dine_in: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            takeout: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            preorder: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            delivery: {
                                order_count: 0,
                                transaction_amount: 0
                            }
                        }
                    };
                }

                startDate = _this.dataGenerationHelper.getValidAfterMinuteUTCDate(startDate.getTime(), 24 * 60);

                orderStats.push(orderStat);
            }

            totalTransaction = _this.dataGenerationHelper.formatNumberByRecursion(totalTransaction, 2);

            var result = {
                currency: currency,
                total_transaction: totalTransaction,
                order_stat: orderStats
            }

            apiResult = {status: 200, data: result};

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantOrderStat step-4 doPopulateResult returns right'});
            nextstep();
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantOrderStat step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetRestaurantOrderStat step-(right) callback'});
        }

        callback(error, apiResult);
    });

}

var GetCurrencyOrderStat = function (reqParams, callback) {
    var _this = exports;

    var currency = reqParams.currency;
    var startDate = reqParams.startDate;
    var endDate = reqParams.endDate;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCurrencyOrderStat', reqParams: reqParams});

    var apiResult = '';

    var orderAmounts = [];

    async.series([
        // step-1: doValidateDate
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCurrencyOrderStat step-1 doValidateDate', startDate: startDate, endDate: endDate});

            var defaultStatDay = _this.config.other_servers.default_stat_day;

            // calculate the query date
            // the default query time is from 90 days ago to today
            // if startDate or endDate exists, we will use them, but the max range is 90 days ago from endDate, else startDate is 90 days ago from today and endDate is today
            if (!isNotNull(startDate) && !isNotNull(endDate)) {
                startDate = moment().local().add('day', -defaultStatDay + 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                endDate = moment().local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
            } else if (!isNotNull(startDate) && isNotNull(endDate)) {
                endDate = moment(endDate).local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                startDate = moment(endDate).local().add('day', -defaultStatDay).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
            } else if (isNotNull(startDate) && isNotNull(endDate)) {
                startDate = moment(startDate).local().hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                endDate = moment(endDate).local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                if (endDate.getTime() - startDate.getTime() > defaultStatDay * 24 * 60 * 60 * 1000) {
                    startDate = moment(endDate).local().add('day', -defaultStatDay).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                }
            } else {
                startDate = moment(startDate).local().hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                endDate = moment().local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                if (endDate.getTime() - startDate.getTime() > defaultStatDay * 24 * 60 * 60 * 1000) {
                    startDate = moment().local().add('day', -defaultStatDay + 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                }
            }

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCurrencyOrderStat step-1 doValidateDate returns right'});
            nextstep();
        },
        // step-2: doValidateCurrency
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCurrencyOrderStat step-2 doValidateCurrency', currency: currency});

            var isInCurrency = false;

            var currencies = _this.enums.CurrencyType;
            for (var i=0; i<currencies.length; i++) {
                if (currency === currencies[i]) {
                    isInCurrency = true;
                    break;
                }
            }

            if (isInCurrency === true) {
                _this.logger.info('%j', {function:'DEBUG-INFO: OOrder.GetCurrencyOrderStat step-2 doValidateCurrency returns right'});
                nextstep();
            } else {
                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetCurrencyOrderStat step-2 doValidateCurrency returns an error'});
                nextstep(new _this.httpExceptions.InvalidParameterException('currency', currency));
            }

        },
        // step-3: doFindCurrencyOrderStat
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCurrencyOrderStat step-3 doFindCurrencyOrderStat', startDate: startDate, endDate: endDate});

            var selector = {'restaurant.currency': currency, status: {$in: [_this.enums.OrderStatus.PAID, _this.enums.OrderStatus.CLOSED, _this.enums.OrderStatus.CANCELLED]},
                update_time: {$gte:  startDate, $lt: endDate}};

            selector['$or'] = [
                // dinner order
                {$and: [{order_type: {$exists: 0}}, {is_takeout: {$ne: true}}, {payment: {$exists: 1}}]},
                // takeout order
                {$and: [{is_takeout: true}, {payment: {$exists: 1}}]},
                // redeemed pre order
                {$and: [{picked_up: true}, {order_type: _this.enums.OrderType.PREORDER}, {payment: {$exists: 1}}]},
                // delivery order
                {$and: [{order_type: _this.enums.OrderType.DELIVERY}, {payment: {$exists: 1}}]},
                // unpaid all order
                {$and: [{status: _this.enums.OrderStatus.CANCELLED}]}
            ];

            var keys = function(doc) {
                var date = new Date(doc.update_time);
                var dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                return {day:dateKey};
            };
            var condition = selector;
            var initial = {dine_in_order_count: 0, dine_in_order_count_unpaid: 0, takeout_order_count: 0, takeout_order_count_unpaid: 0,
                preorder_order_count: 0, preorder_order_count_unpaid: 0, delivery_order_count: 0, delivery_order_count_unpaid: 0,
                online_dine_in_payment_count: 0, online_dine_in_payment_amount: 0, online_takeout_payment_count: 0, online_takeout_payment_amount: 0,
                online_preorder_payment_count: 0, online_preorder_payment_amount: 0, online_delivery_payment_count: 0, online_delivery_payment_amount: 0,
                offline_preorder_payment_count: 0, offline_preorder_payment_amount: 0, offline_delivery_payment_count: 0, offline_delivery_payment_amount: 0,
                offline_dine_in_payment_count: 0, offline_dine_in_payment_amount: 0, offline_takeout_payment_count: 0, offline_takeout_payment_amount: 0};
            var reduce = function(obj, out) {

                var status = obj.status;
                if (status === 'CANCELLED') {
                    if (obj.order_type === 'PREORDER') {
                        out.preorder_order_count_unpaid++;
                    } else if (obj.is_takeout === true) {
                        out.takeout_order_count_unpaid++;
                    } else {
                        out.dine_in_order_count_unpaid++;
                    }
                } else {
                    var isOnlinePayment = obj.bill_status.is_online_payment;

                    if (obj.order_type === 'PREORDER') {
                        out.preorder_order_count++;

                        if (isOnlinePayment === true) {
                            out.online_preorder_payment_count++;
                            out.online_preorder_payment_amount += obj.payment.split_payment_going_to_restaurant;
                        } else {
                            out.offline_preorder_payment_count++;
                            out.offline_preorder_payment_amount += obj.payment.sub_total_before_first_visit_savings;
                        }
                    } else if (obj.order_type === 'DELIVERY') {
                        out.delivery_order_count++;

                        if (isOnlinePayment === true) {
                            out.online_delivery_payment_count++;
                            out.online_delivery_payment_amount += obj.payment.split_payment_going_to_restaurant +
                                obj.delivery_payment.delivery_fee - obj.delivery_payment.delivery_fee_saving;
                        } else {
                            out.offline_delivery_payment_count++;
                            out.offline_delivery_payment_amount += obj.payment.sub_total_before_first_visit_savings;
                        }
                    } else if (obj.is_takeout === true) {
                        out.takeout_order_count++;

                        if (isOnlinePayment === true) {
                            out.online_takeout_payment_count++;
                            out.online_takeout_payment_amount += obj.payment.split_payment_going_to_restaurant;
                        } else {
                            out.offline_takeout_payment_count++;
                            out.offline_takeout_payment_amount += obj.payment.sub_total_before_first_visit_savings;
                        }
                    } else {
                        out.dine_in_order_count++;

                        if (isOnlinePayment === true) {
                            out.online_dine_in_payment_count++;
                            out.online_dine_in_payment_amount += obj.payment.split_payment_going_to_restaurant;
                        } else {
                            out.offline_dine_in_payment_count++;
                            out.offline_dine_in_payment_amount += obj.payment.sub_total_before_first_visit_savings;
                        }
                    }
                }

            };
            var finalize = null;
            var command = null;
            var options = null;
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.group(keys, condition, initial, reduce, finalize,command, options, helper, function(error, res) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetCurrencyOrderStat step-3 doFindCurrencyOrderStat returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('group dinning-orders', 'error'));
                } else {
                    orderAmounts = res;

                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCurrencyOrderStat step-3 doFindCurrencyOrderStat returns right'});
                    nextstep();
                }
            });
        },
        // step-4: doPopulateResult
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCurrencyOrderStat step-4 doPopulateResult'});

            var totalTransaction = {
                count: {
                    dine_in: {
                        order_count: 0,
                        order_count_unpaid: 0
                    },
                    takeout: {
                        order_count: 0,
                        order_count_unpaid: 0
                    },
                    preorder: {
                        order_count: 0,
                        order_count_unpaid: 0
                    },
                    delivery: {
                        order_count: 0,
                        order_count_unpaid: 0
                    }
                },
                online_payment: {
                    dine_in: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    takeout: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    preorder: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    delivery: {
                        order_count: 0,
                        transaction_amount: 0
                    }
                },
                offline_payment: {
                    dine_in: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    takeout: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    preorder: {
                        order_count: 0,
                        transaction_amount: 0
                    },
                    delivery: {
                        order_count: 0,
                        transaction_amount: 0
                    }
                }
            };

            var orderAmountMap = {};
            for (var i=0; i<orderAmounts.length; i++) {
                var orderAmount = orderAmounts[i];

                for (var key in orderAmount) {
                    var value = orderAmount[key];
                    orderAmount[key] = _this.dataGenerationHelper.getAccurateNumber(value, 2);
                }

                var date = _this.dataGenerationHelper.getValidUTCDateTimeFormat(orderAmount.day)
                var orderStat = {
                    date: date,
                    count: {
                        dine_in: {
                            order_count: orderAmount.dine_in_order_count,
                            order_count_unpaid: orderAmount.dine_in_order_count_unpaid
                        },
                        takeout: {
                            order_count: orderAmount.takeout_order_count,
                            order_count_unpaid: orderAmount.takeout_order_count_unpaid
                        },
                        preorder: {
                            order_count: orderAmount.preorder_order_count,
                            order_count_unpaid: orderAmount.preorder_order_count_unpaid
                        },
                        delivery: {
                            order_count: orderAmount.delivery_order_count,
                            order_count_unpaid: orderAmount.delivery_order_count_unpaid
                        }
                    },
                    online_payment: {
                        dine_in: {
                            order_count: orderAmount.online_dine_in_payment_count,
                            transaction_amount: orderAmount.online_dine_in_payment_amount
                        },
                        takeout: {
                            order_count: orderAmount.online_takeout_payment_count,
                            transaction_amount: orderAmount.online_takeout_payment_amount
                        },
                        preorder: {
                            order_count: orderAmount.online_preorder_payment_count,
                            transaction_amount: orderAmount.online_preorder_payment_amount
                        },
                        delivery: {
                            order_count: orderAmount.online_delivery_payment_count,
                            transaction_amount: orderAmount.online_delivery_payment_amount
                        }
                    },
                    offline_payment: {
                        dine_in: {
                            order_count: orderAmount.offline_dine_in_payment_count,
                            transaction_amount: orderAmount.offline_dine_in_payment_amount
                        },
                        takeout: {
                            order_count: orderAmount.offline_takeout_payment_count,
                            transaction_amount: orderAmount.offline_takeout_payment_amount
                        },
                        preorder: {
                            order_count: orderAmount.offline_preorder_payment_count,
                            transaction_amount: orderAmount.offline_preorder_payment_amount
                        },
                        delivery: {
                            order_count: orderAmount.offline_delivery_payment_count,
                            transaction_amount: orderAmount.offline_delivery_payment_amount
                        }
                    }
                };
                orderAmountMap[date] = orderStat;

                totalTransaction.count.dine_in.order_count += orderAmount.dine_in_order_count;
                totalTransaction.count.dine_in.order_count_unpaid += orderAmount.dine_in_order_count_unpaid;
                totalTransaction.count.takeout.order_count += orderAmount.takeout_order_count;
                totalTransaction.count.takeout.order_count_unpaid += orderAmount.takeout_order_count_unpaid;
                totalTransaction.count.preorder.order_count += orderAmount.preorder_order_count;
                totalTransaction.count.preorder.order_count_unpaid += orderAmount.preorder_order_count_unpaid;
                totalTransaction.count.delivery.order_count += orderAmount.delivery_order_count;
                totalTransaction.count.delivery.order_count_unpaid += orderAmount.delivery_order_count_unpaid;
                totalTransaction.online_payment.dine_in.order_count += orderAmount.online_dine_in_payment_count;
                totalTransaction.online_payment.dine_in.transaction_amount += orderAmount.online_dine_in_payment_amount;
                totalTransaction.online_payment.takeout.order_count += orderAmount.online_takeout_payment_count;
                totalTransaction.online_payment.takeout.transaction_amount += orderAmount.online_takeout_payment_amount;
                totalTransaction.online_payment.preorder.order_count += orderAmount.online_preorder_payment_count;
                totalTransaction.online_payment.preorder.transaction_amount += orderAmount.online_preorder_payment_amount;
                totalTransaction.online_payment.delivery.order_count += orderAmount.online_delivery_payment_count;
                totalTransaction.online_payment.delivery.transaction_amount += orderAmount.online_delivery_payment_amount;
                totalTransaction.offline_payment.dine_in.order_count += orderAmount.offline_dine_in_payment_count;
                totalTransaction.offline_payment.dine_in.transaction_amount += orderAmount.offline_dine_in_payment_amount;
                totalTransaction.offline_payment.takeout.order_count += orderAmount.offline_takeout_payment_count;
                totalTransaction.offline_payment.takeout.transaction_amount += orderAmount.offline_takeout_payment_amount;
                totalTransaction.offline_payment.preorder.order_count += orderAmount.offline_preorder_payment_count;
                totalTransaction.offline_payment.preorder.transaction_amount += orderAmount.offline_preorder_payment_amount;
                totalTransaction.offline_payment.delivery.order_count += orderAmount.offline_delivery_payment_count;
                totalTransaction.offline_payment.delivery.transaction_amount += orderAmount.offline_delivery_payment_amount;
            }

            var orderStats = [];
            while(startDate.getTime() < endDate.getTime()) {
                var orderStat = {};

                var date = _this.dataGenerationHelper.getValidUTCDateTimeFormat(startDate.getTime());
                if (orderAmountMap[date]) {
                    orderStat = orderAmountMap[date];
                } else {
                    orderStat = {
                        date: _this.dataGenerationHelper.getValidUTCDateTimeFormat(startDate.getTime()),
                        online_payment: {
                            dine_in: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            takeout: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            preorder: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            delivery: {
                                order_count: 0,
                                transaction_amount: 0
                            }
                        },
                        offline_payment: {
                            dine_in: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            takeout: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            preorder: {
                                order_count: 0,
                                transaction_amount: 0
                            },
                            delivery: {
                                order_count: 0,
                                transaction_amount: 0
                            }
                        }
                    };
                }

                startDate = _this.dataGenerationHelper.getValidAfterMinuteUTCDate(startDate.getTime(), 24 * 60);

                orderStats.push(orderStat);
            }

            totalTransaction = _this.dataGenerationHelper.formatNumberByRecursion(totalTransaction, 2);

            var result = {
                currency: currency,
                total_transaction: totalTransaction,
                order_stat: orderStats
            }

            apiResult = {status: 200, data: result};

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCurrencyOrderStat step-4 doPopulateResult returns right'});
            nextstep();
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetCurrencyOrderStat step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetCurrencyOrderStat step-(right) callback'});
        }

        callback(error, apiResult);
    });

}

var GetOrderStat = function (reqParams, callback) {
    var _this = exports;

    var statType = reqParams.statType;
    var timeType = reqParams.timeType;
    var isOnline = reqParams.isOnline;
    var includeCancelledOrder = reqParams.includeCancelledOrder;
    var startDate = reqParams.startDate;
    var endDate = reqParams.endDate;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetOrderStat', reqParams: reqParams});

    var apiResult = '';

    var stat = {};              // return object

    var dayCountMap = {};       // day order count map like: {1: 20, 30: 524, all: 1999}
    var cityMap = {};           // city map like: {suzhou: {}}
    var allCities = [];
    var orderAmounts = [];

    async.series([
        // step-1: doValidateDate
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetOrderStat step-1 doValidateDate', startDate: startDate, endDate: endDate});

            if (timeType === _this.enums.CityRestaurantsOrderTimeType.MONTH) {
                if (startDate) {
                    startDate = moment(startDate).local().startOf('month').toDate();
                } else {
                    var defaultStatMonth = _this.config.other_servers.default_stat_month;
                    startDate = moment().local().add(-defaultStatMonth, 'month').startOf('month').toDate();
                }

                if (endDate) {
                    endDate = moment(endDate).local().endOf('month').toDate();
                } else {
                    endDate = moment().local().endOf('month').toDate();
                }

            } else if (timeType === _this.enums.CityRestaurantsOrderTimeType.HOUR) {
                var defaultStatDay = _this.config.other_servers.default_stat_hour/24;
                var queryDate = getCustomQueryDate(startDate, endDate, defaultStatDay);
                startDate = queryDate.startDate;
                endDate = queryDate.endDate;
            } else if (timeType === _this.enums.CityRestaurantsOrderTimeType.WEEK) {
                var defaultStatDay = _this.config.other_servers.default_stat_week * 7;
                var queryDate = getCustomQueryDate(startDate, endDate, defaultStatDay);
                startDate = queryDate.startDate;
                endDate = queryDate.endDate;
            } else {
                var defaultStatDay = _this.config.other_servers.default_stat_day;
                var queryDate = getCustomQueryDate(startDate, endDate, defaultStatDay);
                startDate = queryDate.startDate;
                endDate = queryDate.endDate;
            }

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetOrderStat step-1 doValidateDate returns right'});
            nextstep();
        },
        // step-2: doFindCity
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCityRestaurantsOrderCountStat step-2 doFindCity'});

            var selector = {};
            var options = {fields: {city: 1}};
            var helper = {collectionName: _this.enums.CollectionName.CITY_LOCATION};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetCityRestaurantsOrderCountStat step-2 doFindCity returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find city-location', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetCityRestaurantsOrderCountStat step-2 doFindCity returns empty'});
                    nextstep();
                } else {
                    var cities = result;

                    for (var i=0; i<cities.length; i++) {
                        var city = cities[i].city;
                        cityMap[city] = {};
                    }

                    _this.logger.info('%j', {function:'DEBUG-INFO: OOrder.GetCityRestaurantsOrderCountStat step-2 doFindCity returns right'});
                    nextstep();
                }
            });
        },
        // step-3: doFindOrderCount
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetOrderStat step-3 doFindOrderCount'});

            for (var key in cityMap) {
                allCities.push(key);
            }

            // 1 30 all
            _this.getOrderCount([1, 30, -1], isOnline, includeCancelledOrder, allCities, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetOrderStat step-3 doFindOrderCount returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('get dining-orders', 'error'));
                } else {
                    stat.count = result;

                    _this.logger.info('%j', {function:'DEBUG-INFO:Order.GetOrderStat step-3 doFindOrderCount returns right'});
                    nextstep();
                }
            });

        },
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetOrderStat step-3 doGetOrderSource'});

            _this.getCustomerOrderCountSource(startDate, endDate, isOnline, includeCancelledOrder, statType, timeType, cityMap, allCities, [], function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetOrderStat step-3 doGetOrderSource returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('group dining-orders', 'error'));
                } else {
                    stat.source = result;

                    apiResult = {status: 200, data: stat};

                    _this.logger.info('%j', {function:'DEBUG-INFO:Order.GetOrderStat step-3 doGetOrderSource returns right'});
                    nextstep();
                }
            });
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetOrderStat step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetOrderStat step-(right) callback'});
        }

        callback(error, apiResult);
    });

}

var GetCityRestaurantsOrderCountStat = function (reqParams, callback) {
    var _this = exports;

    var cityId = reqParams.cityId;
    var statType = reqParams.statType;
    var timeType = reqParams.timeType;
    var isOnline = reqParams.isOnline;
    var startDate = reqParams.startDate;
    var endDate = reqParams.endDate;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCityRestaurantsOrderCountStat', reqParams: reqParams});

    var apiResult = '';

    var cityName = '';
    var restaurants = [];
    var restaurantMap = {};
    var orderAmounts = [];

    async.series([
        // step-1: doValidateDate
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCityRestaurantsOrderCountStat step-1 doValidateDate', startDate: startDate, endDate: endDate});

            if (timeType === _this.enums.CityRestaurantsOrderTimeType.MONTH) {
                if (startDate) {
                    startDate = moment(startDate).local().startOf('month').toDate();
                } else {
                    var defaultStatMonth = _this.config.other_servers.default_stat_month;
                    startDate = moment().local().add(-defaultStatMonth, 'month').startOf('month').toDate();
                }
                if (endDate) {
                    endDate = moment(endDate).local().endOf('month').toDate();
                } else {
                    endDate = moment().local().endOf('month').toDate();
                }
            } else if (timeType === _this.enums.CityRestaurantsOrderTimeType.HOUR) {
                var defaultStatDay = _this.config.other_servers.default_stat_hour/24;
                var queryDate = getCustomQueryDate(startDate, endDate, defaultStatDay);
                startDate = queryDate.startDate;
                endDate = queryDate.endDate;
            } else if (timeType === _this.enums.CityRestaurantsOrderTimeType.WEEK) {
                var defaultStatDay = _this.config.other_servers.default_stat_week * 7;
                var queryDate = getCustomQueryDate(startDate, endDate, defaultStatDay);
                startDate = queryDate.startDate;
                endDate = queryDate.endDate;
            } else {
                var defaultStatDay = _this.config.other_servers.default_stat_day;
                var queryDate = getCustomQueryDate(startDate, endDate, defaultStatDay);
                startDate = queryDate.startDate;
                endDate = queryDate.endDate;
            }

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCityRestaurantsOrderCountStat step-1 doValidateDate returns right'});
            nextstep();
        },
        // step-2: doFindCity
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCityRestaurantsOrderCountStat step-2 doFindCity', cityId: cityId});

            var selector = {_id: cityId};
            var options = {fields: {city: 1}};
            var helper = {collectionName: _this.enums.CollectionName.CITY_LOCATION};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetCityRestaurantsOrderCountStat step-2 doFindCity returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find city-location', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetCityRestaurantsOrderCountStat step-2 doFindCity returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('city_id', cityId));
                } else {
                    cityName = result[0].city;

                    _this.logger.info('%j', {function:'DEBUG-INFO: OOrder.GetCityRestaurantsOrderCountStat step-2 doFindCity returns right'});
                    nextstep();
                }
            });
        },
        // step-3: doFindRestaurant
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCityRestaurantsOrderCountStat step-3 doFindOrderRestaurant'});

            var selector = {'addresses.city': new RegExp(cityName),
                'status': _this.enums.restaurantStatusSpecific.PUBLISHED.toLowerCase(),
                'active_status':{$in:[_this.enums.ActiveStatus.ACTIVE, _this.enums.ActiveStatus.BETA, _this.enums.ActiveStatus.INTERNAL]},
                'shortNames.name':{'$not':/demo/i },
                'confirmed_inviter.inviter_user_id':{$exists:true}};
            var options = {fields: {longNames: 1}};
            var helper = {collectionName: _this.enums.CollectionName.RESTAURANT};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetCityRestaurantsOrderCountStat step-3 doFindRestaurant returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find restaurant', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetCityRestaurantsOrderCountStat step-3 doFindRestaurant returns empty'});
                    nextstep();
                } else {
                    for (var i=0; i<result.length; i++) {
                        var restaurant = result[i];

                        _this.dataGenerationHelper.deleteArrayUnuseFields(restaurant.longNames, ['suggest']);

                        restaurantMap[restaurant._id] = restaurant;
                        restaurants.push(restaurant._id);
                    }

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetCityRestaurantsOrderCountStat step-3 doFindRestaurant returns right'});
                    nextstep();
                }
            });
        },
        // step-4: doGetOrderSource
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCityRestaurantsOrderCountStat step-4 doGetOrderSource'});

            _this.getCustomerOrderCountSource(startDate, endDate, isOnline, false, statType, timeType, restaurantMap, [], restaurants, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetCityRestaurantsOrderCountStat step-4 doGetOrderSource returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('group dining-orders', 'error'));
                } else {
                    apiResult = {status: 200, data: result};

                    _this.logger.info('%j', {function:'DEBUG-INFO:Order.GetCityRestaurantsOrderCountStat step-4 doGetOrderSource returns right'});
                    nextstep();
                }
            });
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetCityRestaurantsOrderCountStat step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetCityRestaurantsOrderCountStat step-(right) callback'});
        }

        callback(error, apiResult);
    });

}

var EditOrderItems = function (reqParams, callback) {
    var _this = exports;

    var userId = reqParams.userId;
    var orderId = reqParams.orderId;
    var batchNo = reqParams.batchNo;
    var orderItems = reqParams.orderItems;
    var headerToken = reqParams.headerToken;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.EditOrderItems', reqParams: reqParams});

    var apiResult = '';

    var user = {};
    var roles = {};
    var order = {};
    var restaurant = {};
    var newModifyOrderItems = [];        // order_times
    var newOrderItems = [];             // orderItems
    var newOrderItemIds = [];           // the add order item ids
    var menuMap = {};
    var newBatchNo = 0;

    var nowTime = _this.dataGenerationHelper.getValidUTCDate();

    async.series([
        // step-1: doFindUser
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-1 doFindUser', userId: userId});

            var loggerInfos = {
                function : 'Order.EditOrderItems step-1 doFindUser'
            };

            _this.getUserInfo(userId, _this.config.other_servers, headerToken, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-1 doFindUser returns an error', userId: userId});
                    nextstep(new _this.httpExceptions.DataConflictedException('get user', error));
                } else if (result === null || result === undefined || result.length === 0){
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-1 doFindUser returns empty user', userId: userId});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('userId', userId));
                } else {
                    user = {
                        user_id: userId,
                        user_name: result.dispName || '',
                        avatar_path: result.avatarPath || ''
                    }

                    roles = result.roles;

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-1 doFindUser returns right'});
                    nextstep();
                }
            }, reqParams, loggerInfos);
        },
        // step-2: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.EditOrderItems step-2 doFindOrder', orderId: orderId});

            var selector = {};
            if (isNotNull(batchNo)) {
                selector = {_id: orderId, batch_no: batchNo, status: {$in: [_this.enums.OrderStatus.INPROCESS, _this.enums.OrderStatus.SUBMITTED]}};
            } else {
                selector = {_id: orderId, status: {$in: [_this.enums.OrderStatus.INPROCESS, _this.enums.OrderStatus.SUBMITTED]}};
            }

            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if(error){
                    _this.logger.error('%j', { function:'DEBUG-ERROR: Order.EditOrderItems step-2 doFindOrder returns error', orderId: orderId});
                    nextstep(new _this.httpExceptions.InvalidParameterException('orderId', orderId));
                }else if(result == null || result == undefined || result.length == 0){
                    _this.logger.info('%j', { function:'DEBUG-INFO: Order.EditOrderItems step-2 doFindOrder returns empty', orderId: orderId});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('orderId', orderId));
                } else {
                    order = result[0];

                    if (order.come_from === 'WECHAT') {
                        _this.logger.error('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-2 doFindOrder returns not support edit wechat order', orderId: orderId});
                        nextstep(new _this.httpExceptions.CommonHttpErrorException('EDIT_ORDER_ITEMS_NOT_SUPPORT_WECHAT', 'orderId', orderId));
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-2 doFindOrder returns right'});
                        nextstep();
                    }
                }
            });
        },
        // step-3: doValidateUser
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-3 doValidateUser', userId: userId});

            // restaurant and customer
            var isCustomer = false;
            for (var i=0; i<order.customers.length; i++) {
                var customer = order.customers[i];
                if (userId === customer.user_id) {
                    isCustomer = true;
                    break;
                }
            }

            if (isCustomer === true) {
                _this.logger.info('%j', { function:'DEBUG-INFO: Order.EditOrderItems step-3 doValidateUser returns right', userId: userId});
                nextstep();
            } else {
                var restaurantId = order.restaurant.restaurant_id || order.restaurantId || '';
                var restaurant = 'D-' + restaurantId;

                if (isNotNull(roles) && isNotNull(roles[restaurant])) {
                    _this.logger.info('%j', { function:'DEBUG-INFO: Order.EditOrderItems step-3 doValidateUser returns right', userId: userId});
                    nextstep();
                } else {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.EditOrderItems step-3 doValidateUser returns an error'});
                    nextstep(new _this.httpExceptions.DataConflictedException('user_id', 'not the server'));
                }
            }

        },
        // step-4: doGetTransaction
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-4 doGetTransaction'});

            var country = _this.config.other_servers.country;
            if (!country || (_this.config.other_servers.region.north_america.indexOf(country) >-1)) {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-4 doGetTransaction returns US empty'});
                nextstep();
            } else {
                if (order.out_trade_no !== null && order.out_trade_no !== undefined) {
                    _this.getOuterTransaction(order.out_trade_no, function (error, result) {
                        if (error) {
                            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-4 doGetTransaction returns error', error: error});
                            nextstep(new _this.httpExceptions.DataConflictedException('alipay service', 'error'));
                        } else {
                            if (result === null || result === undefined || result === '') {
                                _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-4 doGetTransaction returns right'});
                                nextstep();
                            } else {
                                if (isNotNull(result.alipay) && isNotNull(result.alipay.response) && isNotNull(result.alipay.response.trade) &&
                                    (result.alipay.response.trade.trade_status === _this.enums.AlipayTradeStatus.WAIT_BUYER_PAY ||
                                    result.alipay.response.trade.trade_status === _this.enums.AlipayTradeStatus.TRADE_SUCCESS)) {
                                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-4 doGetTransaction returns error order is in paying or paid'});
                                    nextstep(new _this.httpExceptions.DataConflictedException('order', 'in paying or paid'));
                                } else {
                                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-4 doGetTransaction returns right'});
                                    nextstep();
                                }
                            }
                        }
                    });
                } else {
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-4 doGetTransaction returns empty'});
                    nextstep();
                }
            }

        },
        // step-5: doValidateOrderItems
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-5 doValidateOrderItems'});

            var orderItemsMap = {};

            for (var i=0; i<orderItems.length; i++) {
                var orderItem = orderItems[i];
                orderItemsMap[orderItem.item_id] = orderItem;
            }

            var oldModifyOrderItems = order.order_items;
            var oldOrderItems = order.orderItems;

            // recalcualte the order items
            if (oldModifyOrderItems !== null && oldModifyOrderItems !== undefined && oldModifyOrderItems.length > 0) {
                for (var j=0; j<oldModifyOrderItems.length; j++) {
                    var oldModifyOrderItem = oldModifyOrderItems[j];
                    var oldOrderItem = oldOrderItems[j];

                    if (orderItemsMap[oldModifyOrderItem.item_id]) {
                        var orderItem = orderItemsMap[oldModifyOrderItem.item_id];

                        var actualQuantity = oldModifyOrderItem.quantity + orderItem.quantity
                        if (actualQuantity > 0) {
                            oldModifyOrderItem.quantity = actualQuantity;
                            oldOrderItem.quantity = actualQuantity;

                            newModifyOrderItems.push(oldModifyOrderItem);
                            newOrderItems.push(oldOrderItem);
                        }

                        delete orderItemsMap[oldModifyOrderItem.item_id];
                    } else {
                        newModifyOrderItems.push(oldModifyOrderItem);
                        newOrderItems.push(oldOrderItem);
                    }
                }

                for (var key in orderItemsMap) {
                    newOrderItemIds.push(key);
                }
            } else {
                for (var key in orderItemsMap) {
                    newOrderItemIds.push(key);
                }
            }

            if (newModifyOrderItems.length === 0 && newOrderItemIds.length === 0) {
                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-5 doValidateOrderItems returns order items empty'});
                nextstep(new _this.httpExceptions.DataConflictedException('order item empty', 'error'));
            } else {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-5 doValidateOrderItems returns right'});
                nextstep();
            }
        },
        // step-6: doFindRestaurant
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-6 doFindRestaurant'});

            var selector = {_id: order.restaurant.restaurant_id};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.RESTAURANT};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-6 doFindRestaurant returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find restaurant', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-6 doFindRestaurant returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('restaurantId', order.restaurant.restaurant_id));
                } else {
                    restaurant = result[0];

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-6 doFindRestaurant returns right'});
                    nextstep();
                }
            })
        },
        // step-7: doFindMenus
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-7 doFindMenus'});

            if (newOrderItemIds.length > 0) {
                var selector = {_id: {$in: newOrderItemIds}, restaurantId: order.restaurant.restaurant_id};
                var options = {};
                var helper = {collectionName: _this.enums.CollectionName.MENU};

                _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-7 doFindMenus returns error', error: error});
                        nextstep(new _this.httpExceptions.DataConflictedException('find menu', 'error'));
                    } else if (result === undefined || result === null || result === '' || result.length === 0) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-7 doFindMenus returns empty'});
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('itemId', newOrderItemIds));
                    } else {
                        var menus = result;

                        if (menus.length !== newOrderItemIds.length) {
                            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-7 doFindMenus returns an error'});
                            nextstep(new _this.httpExceptions.ResourceNotFoundException('item_id not in the restaurant', newOrderItemIds));
                        } else {
                            for (var i=0; i<menus.length; i++) {
                                var menu = menus[i];
                                menuMap[menu._id] = menu;
                            }

                            _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-7 doFindMenus returns right'});
                            nextstep();
                        }
                    }
                })
            } else {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-7 doFindMenus returns empty right'});
                nextstep();
            }

        },
        // step-8: doUnlockBill
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-7 unlockBill'});

            var billStatus = '';
            var unlockUserId = '';
            if(order.billStatus){
                billStatus = order.billStatus.status;
                unlockUserId = order.billStatus.userId;
            }else if(order.bill_status){
                billStatus =  order.bill_status.status;
                unlockUserId = order.bill_status.user_id;
            }

            if (billStatus === _this.enums.BillStatus.LOCKED) {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-8 unlockBill: order is been locked,shoud be unlock first'});

                _this.unlockBillByOrderId(orderId, unlockUserId, _this.config.other_servers, headerToken, false, function (error) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.EditOrderItems step-8 unlockBill: order is been locked,shoud be unlock first ==unlock has error'});
                        nextstep(new _this.httpExceptions.DataConflictedException('unlockBill error', orderId));
                    }else{
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-8 unlockBill: order is been locked,shoud be unlock first ==unlock success'});
                        nextstep();
                    }
                });
            } else {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-8 unlockBill: order is not been locked'});
                nextstep();
            }
        },
        // step-9: doEditOrderItems
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.EditOrderItems step-9 doEditOrderItems', orderId: orderId});

            var isCombinationRight = true;

            newBatchNo = order.batch_no + 1;

            if (newOrderItemIds.length > 0) {

                var orderItemSeparatePrinters = [];
                if (restaurant.printers !== null && restaurant.printers !== undefined && restaurant.printers.length > 0) {
                    var printers = [];
                    for (var i=0; i<restaurant.printers.length; i++) {
                        var usages = restaurant.printers[i].usages;
                        var type = restaurant.printers[i].type;
                        if (usages !== null && usages !== undefined && usages.length > 0) {
                            for (var j=0; j<usages.length; j++) {
                                if ((usages[j].item_auto_print === true && usages[j].usage === _this.enums.PrinterUsage.PASS) /*||
                                 (type === _this.enums.PrinterModule.FEIE && usages[j].usage === _this.enums.PrinterUsage.KITCHEN && usages[j].item_print_number > 0)*/ ) {
                                    orderItemSeparatePrinters.push(restaurant.printers[i]);
                                    break;
                                }
                            }
                        }
                    }
                }

                var country = _this.config.other_servers.country;
                var locale = '';
                if (!country || (_this.config.other_servers.region.north_america.indexOf(country) >-1)) {
                    locale = _this.enums.LocaleCode.EN_US;
                } else {
                    locale = _this.enums.LocaleCode.ZH_CN;
                }

                for (var i=0; i<orderItems.length; i++) {
                    var itemId = orderItems[i].item_id;
                    var quantity = orderItems[i].quantity;

                    if (quantity < 1) {
                        continue;
                    }

                    var menu = menuMap[itemId];

                    if (menu) {

                        var modifiedOrderItem = {};
                        modifiedOrderItem.itemId = itemId;

                        if (menu.longNames && menu.longNames.length > 0) {

                            for (var j=0; j<menu.longNames.length; j++) {
                                var longName = menu.longNames[j];

                                if (locale === longName.locale) {
                                    modifiedOrderItem.itemName = longName.name;
                                    break;
                                }
                            }

                            if (modifiedOrderItem.itemName === undefined) {
                                modifiedOrderItem.itemName = menu.longNames[0].name;
                            }

                        } else {
                            modifiedOrderItem.itemName = '';
                        }

                        modifiedOrderItem.itemNames = menu.longNames;
                        modifiedOrderItem.catalogue_full = menu.catalogue_full;
                        modifiedOrderItem.quantity = quantity;
                        modifiedOrderItem.type = '';
                        modifiedOrderItem.seat = 1;
                        modifiedOrderItem.category = menu.category;
                        modifiedOrderItem.price = {
                            amount: menu.BasePrice,
                            currencyCode: restaurant.currency
                        };
                        modifiedOrderItem.original_price = menu.OriginalPrice ? menu.OriginalPrice : menu.BasePrice;
                        modifiedOrderItem.actual_original_price = {
                            amount: _this.dataGenerationHelper.getAccurateNumber(modifiedOrderItem.original_price, 2),
                            currencyCode: restaurant.currency
                        };
                        modifiedOrderItem.photos = menu.photos;
                        modifiedOrderItem.chit_printed = false;

                        modifiedOrderItem.order_item_user_id = userId;
                        modifiedOrderItem.order_item_id = _this.dataGenerationHelper.generateUUID();
                        modifiedOrderItem.submission_time = nowTime;
                        modifiedOrderItem.order_item_batch_no = newBatchNo;
                        modifiedOrderItem.order_item_user_name = user.user_name;
                        modifiedOrderItem.order_item_user_avatar_path = user.avatar_path;
                        modifiedOrderItem.menu_item_rating = menu.rating || 0;

                        var photos = menu.photos;
                        if (isNotNull(photos)) {
                            for (var k=0; k<photos.length; k++) {
                                var photo = photos[k];
                                if (photo.size === _this.enums.SizeOfPhoto.SMALL) {
                                    modifiedOrderItem.menu_item_photo = photo.path || '';
                                    break;
                                }
                            }
                        } else {
                            modifiedOrderItem.menu_item_photo = '';
                        }

                        var printers = menu.printers;
                        modifiedOrderItem.printers = isNotNull(printers) ? printers : [];

                        for (var j=0; j<orderItemSeparatePrinters.length; j++) {
                            modifiedOrderItem.printers.push(orderItemSeparatePrinters[j]);
                        }

                        modifiedOrderItem.childrenItems = [];

                        newOrderItems.push(modifiedOrderItem);

                        var newOrderItem = _this.backendHelpers.jsonHelper().cloneDocument(modifiedOrderItem);
                        newOrderItem.item_id = newOrderItem.itemId;
                        newOrderItem.item_name = newOrderItem.itemName;
                        newOrderItem.item_names = newOrderItem.itemNames;
                        newOrderItem.price.currency_code = newOrderItem.price.currencyCode;
                        newOrderItem.children_items = newOrderItem.childrenItems;

                        delete newOrderItem.itemId;
                        delete newOrderItem.itemName;
                        delete newOrderItem.itemNames;
                        delete newOrderItem.price.currencyCode;
                        delete newOrderItem.childrenItems;

                        newModifyOrderItems.push(newOrderItem);
                    }
                }
            }

            if (isCombinationRight === false) {
                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-9 doEditOrderItems returns error'});
                nextstep(new _this.httpExceptions.InvalidParameterException('combination quantity has been more than maximum_value'));
            } else {
                var criteria = {};
                if (isNotNull(batchNo)) {
                    criteria = {_id: orderId, batch_no: batchNo};
                } else {
                    criteria = {_id: orderId};
                }

                var editOrderItem = {
                    user_id: userId,
                    order_items: orderItems,
                    create_time: nowTime
                }

                var document = {
                    $set: {orderItems: newOrderItems, order_items: newModifyOrderItems, batch_no: newBatchNo, batchNo: newBatchNo,
                        lastmodified: nowTime, last_modified: nowTime, last_submission_time: nowTime},
                    $push: {sub_order_items: editOrderItem}
                };

                var options = {};
                var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

                _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
                    if (error) {
                        _this.logger.error('%j', {function: 'DEBUG-ERROR: Order.EditOrderItems step-9 doEditOrderItems returns error', orderId: orderId});
                        nextstep(new _this.httpExceptions.DataConflictedException('update dining-orders', 'error'));
                    } else {
                        _this.logger.info('%j', {function: 'DEBUG-INFO: Order.EditOrderItems step-9 doEditOrderItems returns right', orderId: orderId});
                        nextstep();
                    }
                });
            }

        },
        // step-10: doLockBill
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-10 doLockBill'});

            var reqParams = {
                orderId:  orderId,
                userId: userId,
                isServer: false,
                useBlueDollars: true,
                buyBlueDollars: true,
                useGoldDollars: false,
                isOnlinePayment: true,
                headerToken: headerToken,
                otherServers: _this.config.other_servers,
                defaultTip: 0,
                isResponseForSimplifiedV2: true
            };

            // temporary resolve method
            co(function* () {
                try {
                    let result = yield _this.orderV2.getSimpleBill(reqParams);

                    var printNumber = order.slip_number_printed_dine_in_kitchen;
                    if (!isNotNull(printNumber)) {
                        printNumber = 0;
                    }

                    apiResult = {status: 201, data: {batch_no: newBatchNo, slip_number_printed_dine_in_kitchen: printNumber}};

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-9 doLockBill returns right'});
                    nextstep();
                } catch (error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.EditOrderItems step-10 doLockBill returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('lockbill error', orderId));
                }
            })
        },
        // step-11: doCreatePrintTask
        function (nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-11 doCreatePrintTask'});

            var currentTime = _this.dataGenerationHelper.getValidUTCDate();

            var printTasks = [];

            var printOrderItems = [];
            for (var i=0; i<orderItems.length; i++) {
                var orderItem = orderItems[i];

                if (orderItem.quantity < 1) {
                    continue;
                }
                for (var j=0; j<newModifyOrderItems.length; j++) {
                    var newOrderItem = newModifyOrderItems[j];

                    if (orderItem.item_id === newOrderItem.item_id) {

                        orderItem.order_item_id = newOrderItem.order_item_id;
                        orderItem.item_name = newOrderItem.item_name;
                        orderItem.item_names = newOrderItem.item_names;
                        orderItem.printers = newOrderItem.printers;
                        printOrderItems.push(orderItem);
                        break;
                    }
                }
            }

            order.order_items = printOrderItems;

            _this.createPrintTask(orderId, order, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-11 doCreatePrintTask returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('create print-task', 'error'));
                } else {
                    if (result.length === 0) {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-11 doCreatePrintTask  returns empty'});
                        nextstep();
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-11 doCreatePrintTask  returns right'});
                        nextstep();
                    }
                }
            })

            /*for (var i=0; i<orderItems.length; i++) {
             var orderItem = orderItems[i];

             if (orderItem.quantity < 1) {
             continue;
             }

             for (var j=0; j<newModifyOrderItems.length; j++) {
             var newOrderItem = newModifyOrderItems[j];

             if (orderItem.item_id === newOrderItem.item_id) {

             orderItem.order_item_id = newOrderItem.order_item_id;
             orderItem.item_name = newOrderItem.item_name;
             orderItem.item_names = newOrderItem.item_names;
             printOrderItems.push(orderItem);

             if (isValidLength(newOrderItem.printers)) {
             for (var k=0; k<newOrderItem.printers.length; k++) {
             var orderItemsPrinter = newOrderItem.printers[k];

             var printUsage = '';
             var isAllowPrint = false;
             if (isValidLength(orderItemsPrinter.usages)) {
             for (var m=0; m<orderItemsPrinter.usages.length; m++) {
             var usage = orderItemsPrinter.usages[m];

             var itemsPrinter = {};
             itemsPrinter._id = _this.dataGenerationHelper.generateUUID();
             itemsPrinter.device_id = orderItemsPrinter.device_id;
             itemsPrinter.order_id = orderId;
             itemsPrinter.order_no = order.order_no;
             itemsPrinter.table_id = order.tableId;
             itemsPrinter.table_no = order.tableNo;
             itemsPrinter.user = order.user;
             itemsPrinter.restaurant = order.restaurant;
             itemsPrinter.is_takeout = order.is_takeout === true;
             if (itemsPrinter.is_takeout) {
             itemsPrinter.note = order.note;
             }
             itemsPrinter.order_items = [orderItem];
             itemsPrinter.printer_id = orderItemsPrinter._id;
             itemsPrinter.printer_mac_address = orderItemsPrinter.mac_address;
             itemsPrinter.printer_size = orderItemsPrinter.size;
             itemsPrinter.printer_size_type = orderItemsPrinter.size_type;
             itemsPrinter.print_type = 'ITEM';
             itemsPrinter.print_usage = usage.usage;
             itemsPrinter.print_number = 1;
             itemsPrinter.printed_number = 0;
             itemsPrinter.ttl_time = currentTime;

             if (usage.usage === _this.enums.PrinterUsage.PASS && usage.item_auto_print === true) {
             printTasks.push(itemsPrinter);
             } else if (usage.usage === _this.enums.PrinterUsage.KITCHEN) {
             printTasks.push(itemsPrinter);
             }
             }
             }

             }
             }

             break;
             }

             }
             }

             if (isValidLength(order.printers) && printOrderItems.length > 0) {
             for (var i=0; i<order.printers.length; i++) {
             var orderPrinter = order.printers[i];

             var isAllowPrint = false;
             var printNumber = 0;

             if (isValidLength(orderPrinter.usages)) {
             for (var j=0; j<orderPrinter.usages.length; j++) {
             var usage = orderPrinter.usages[j];

             if (usage.usage === _this.enums.PrinterUsage.PASS && usage.order_auto_print === true) {

             printNumber = usage.order_print_number;

             isAllowPrint = true;
             break;
             }
             }
             }

             if (isAllowPrint) {
             var printTask = {};
             printTask._id = _this.dataGenerationHelper.generateUUID();
             printTask.order_id = orderId;
             printTask.device_id = orderPrinter.device_id;
             printTask.order_no = order.order_no;
             printTask.table_id = order.tableId;
             printTask.table_no = order.tableNo;
             printTask.user = order.user;
             printTask.restaurant = order.restaurant;
             printTask.is_takeout = order.is_takeout === true;
             if (printTask.is_takeout) {
             printTask.note = order.note;
             }
             printTask.order_items = printOrderItems;
             printTask.printer_id = orderPrinter._id;
             printTask.printer_mac_address = orderPrinter.mac_address;
             printTask.printer_size = orderPrinter.size;
             printTask.printer_size_type = orderPrinter.size_type;
             printTask.print_type = 'ORDER';
             printTask.print_usage = _this.enums.PrinterUsage.PASS;
             printTask.print_number = printNumber;
             printTask.printed_number = 0;
             printTask.ttl_time = currentTime;

             printTasks.push(printTask);
             }
             }
             }

             if (printTasks.length > 0) {
             var document = printTasks;
             var options = {};
             var helper = {collectionName: _this.enums.CollectionName.PRINT_TASKS};

             _this.restaurantDataAPI.bulkInsert(document, options, helper, function (error) {
             if (error) {
             _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-11 doCreatePrintTask returns error', error: error});
             nextstep(new _this.httpExceptions.DataConflictedException('create print-task', 'error'));
             } else {
             _this.logger.info('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-11 doCreatePrintTask returns right'});
             nextstep();
             }
             });
             } else {
             _this.logger.info('%j', { function: 'DEBUG-INFO: Order.EditOrderItems step-11 doCreatePrintTask returns empty'});
             nextstep();
             }*/
        },
        // step-12: doSendNotification
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.EditOrderItems do step-12 notification', orderId: orderId});

            var postData = {};
            postData.host = _this.config.other_servers.notification.server_url;
            postData.port = _this.config.other_servers.notification.server_port;
            postData.path = '/notifications';

            var body = {
                'command': _this.enums.PushMessageType.BROADCAST,
                'user_id': order.user.user_id,
                'user_name': order.user.user_name || '',
                'consumer_disp_name':order.user.user_name ||'',
                'consumer_avatar_path':order.user.avatar_path ||'',
                'restaurant_id': order.restaurant.restaurant_id,
                'table_id': order.tableId,
                'table_no': order.tableNo,
                'order_id': orderId,
                'code': _this.enums.PushMessageType.UPDATE_ORDER,
                'deliver_type':'RELIABLE'
            };

            postData.method = 'POST';
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.EditOrderItems do step-12 notification', postData: postData,body:body});

            var loggerInfos = {
                function : 'Order.EditOrderItems do step-12 notification'
            };

            _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-ERROR: Order.EditOrderItems do step-12 notification returns an error',
                        error: error
                    });
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.EditOrderItems do step-12 notification returns right'});
                }
                nextstep();
            }, reqParams, loggerInfos);

        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.EditOrderItems step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.EditOrderItems step-(right) callback'});
        }
        callback (error, apiResult);
    })
}

var GetOuterTransaction = function (outTradeNo, callback) {
    var _this = exports;

    var alipayConfig = {
        service: _this.config.other_servers.alipay.single_trade_query,
        partner: _this.config.other_servers.alipay.partner,
        key: _this.config.other_servers.alipay.key,
        signType: _this.config.other_servers.alipay.sign_type,
        gateway: _this.config.other_servers.alipay.alipay_gateway
    };

    _this.payHelper.queryAlipayTradeSingleByOutTrade(alipayConfig, outTradeNo, function (error, result) {
        if (error) {
            callback(error, null);
        } else {
            // translate xml to json
            xml2js.parseString(result, { explicitArray : false, ignoreAttrs : true }, function (error, result) {
                callback(error, result);
            });
        }
    });

}

var GetRestaurantSummary = function (reqParams, callback) {
    var _this = exports;

    var restaurantId = reqParams.restaurantId;
    var isTakeout = reqParams.isTakeout;
    var startTime = reqParams.startTime;
    var endTime = reqParams.endTime;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantSummary', reqParams: reqParams});

    var apiResult = '';

    var restaurantSummary = {};

    async.series([
        // step-1: doValidateTime
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantSummary step-1 doValidateTime', startTime: startTime, endTime: endTime});

            // calculate the query time
            // the default query time is from today 00:00:00 to today 24:00:00
            // if startTime or endTime exists, we will use them, else statTime use today 00:00:00 and endTime use startTime 24:00:00
            if (!isNotNull(startTime) && !isNotNull(endTime)) {
                startTime = moment().local().hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                endTime = moment().local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
            } else if (isNotNull(startTime) && !isNotNull(endTime)) {
                startTime = moment(startTime).local().toDate();
                endTime = moment(startTime).local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
            } else if (isNotNull(startTime) && isNotNull(endTime)) {
                startTime = moment(startTime).local().toDate();
                endTime = moment(endTime).local().toDate();
            } else {
                startTime = moment().local().hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
                endTime = moment(endTime).local().toDate();
            }
            restaurantSummary.query_time_start = startTime;
            restaurantSummary.query_time_to = endTime;
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantSummary step-1 doValidateTime returns right'});
            nextstep();
        },
        // step-2: doFindRestaurant
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetRestaurantSummary step-2 doFindRestaurant', restaurantId: restaurantId});

            var selector = {_id: restaurantId};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.RESTAURANT};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantSummary step-1 doFindRestaurant returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find restaurant', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantSummary step-2 doFindRestaurant returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('restaurantId', restaurantId));
                } else {
                    var restaurant = result[0];
                    restaurantSummary.restaurant = {};
                    restaurantSummary.restaurant.currency = restaurant.currency;
                    restaurantSummary.restaurant.restaurant_id = restaurant._id;
                    restaurantSummary.restaurant.restaurant_name = restaurant.longNames[0].name;
                    restaurantSummary.restaurant.addresses = restaurant.addresses;
                    restaurantSummary.restaurant.officialPhone = restaurant.officialPhone;
                    _this.logger.info('%j', {function:'DEBUG-INFO: OOrder.GetRestaurantSummary step-3 doFindRestaurant returns right'});
                    nextstep();
                }
            });
        },
        //step3: find out dinner orders and redeemed pre order
        function(nextstep){
            var selector = {
                'restaurant.restaurant_id': restaurantId,
                'status': {$in: [_this.enums.OrderStatus.PAID, _this.enums.OrderStatus.CLOSED]},
                'payment': {
                    $exists: 1
                },
                'create_time': {$gte:  startTime, $lt: endTime},
                'bill_status.status': _this.enums.OrderStatus.PAID,
                'bill_status.is_online_payment': true
            };
            if (isTakeout === true) {
                selector['is_takeout'] = true;
            } else if (isTakeout === false) {
                selector['is_takeout'] = {$ne: true};
                selector['$or'] = [
                    // dinner order
                    {$and: [{order_type: {$exists: 0}}]},
                    // redeemed pre order
                    {$and: [{picked_up: true}, {order_type: _this.enums.OrderType.PREORDER}]},
                    // delivery order
                    {$and: [{order_type: _this.enums.OrderType.DELIVERY}]}
                ];
            } else {
                selector['$or'] = [
                    // dinner order
                    {$and: [{order_type: {$exists: 0}}, {is_takeout: {$ne: true}}]},
                    // takeout order
                    {$and: [{is_takeout: true}]},
                    // redeemed pre order
                    {$and: [{picked_up: true}, {order_type: _this.enums.OrderType.PREORDER}]},
                    // delivery order
                    {$and: [{order_type: _this.enums.OrderType.DELIVERY}]}
                ];
            }
            var options = {fields: {'_id': 1,'order_no': 1,'create_time': 1, 'payment.tip': 1,
                'payment.split_payment_going_to_restaurant': 1,'is_takeout':1,delivery_payment: 1,order_type: 1}};
            options.sort = { 'order_no':1};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            restaurantSummary.tips = 0;
            restaurantSummary.split_to_restaurant = 0;
            var orderDetailsDineIn = new Array();
            var tipsDineIn = 0;
            var splitToRestaurantDineIn = 0;
            var orderDetailsTakeout = new Array();
            var tipsTakeout = 0;
            var splitToRestaurantTakeout = 0;
            var tips= 0;
            var splitToRestaurant = 0;
            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantSummary step-2 doFindRestaurant returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find restaurant', 'error'));
                } else {

                    for (var i=0; i<result.length; i++) {
                        var order = {};
                        order.tip = _this.dataGenerationHelper.getAccurateNumber( result[i].payment.tip, 2);
                        order.split_payment_going_to_restaurant = _this.dataGenerationHelper.getAccurateNumber( result[i].payment.split_payment_going_to_restaurant, 2);
                        order.create_time = result[i].create_time;
                        order.order_id = result[i]._id;
                        order.order_no= result[i].order_no;
                        tips = tips +    order.tip;

                        if(result[i].is_takeout)
                        {
                            tipsTakeout = tipsTakeout +  order.tip;
                            splitToRestaurantTakeout = splitToRestaurantTakeout +  order.split_payment_going_to_restaurant;
                            orderDetailsTakeout.push(order);
                        } else if (result[i].order_type === _this.enums.OrderType.DELIVERY) {
                            tipsTakeout = tipsTakeout +  order.tip;
                            var actualAmount = order.split_payment_going_to_restaurant +
                                result[i].delivery_payment.delivery_fee - result[i].delivery_payment.delivery_fee_saving;
                            splitToRestaurantTakeout = splitToRestaurantTakeout +  actualAmount;

                            order.split_payment_going_to_restaurant = _this.dataGenerationHelper.getAccurateNumber(actualAmount, 2);
                            orderDetailsTakeout.push(order);
                        }
                        else
                        {
                            tipsDineIn = tipsDineIn +  order.tip;
                            splitToRestaurantDineIn = splitToRestaurantDineIn +  order.split_payment_going_to_restaurant;
                            orderDetailsDineIn.push(order);
                        }

                        splitToRestaurant = splitToRestaurant +  order.split_payment_going_to_restaurant;
                    }
                }
                restaurantSummary.tips =  _this.dataGenerationHelper.getAccurateNumber(tips, 2);
                restaurantSummary.split_to_restaurant = _this.dataGenerationHelper.getAccurateNumber(splitToRestaurant, 2);
                restaurantSummary.dine_in = {};
                restaurantSummary.dine_in.tips =  _this.dataGenerationHelper.getAccurateNumber(tipsDineIn, 2);
                restaurantSummary.dine_in.split_to_restaurant = _this.dataGenerationHelper.getAccurateNumber(splitToRestaurantDineIn, 2);
                restaurantSummary.dine_in.order_details = orderDetailsDineIn;
                restaurantSummary.takeout = {};
                restaurantSummary.takeout.tips = _this.dataGenerationHelper.getAccurateNumber(tipsTakeout, 2);
                restaurantSummary.takeout.split_to_restaurant = _this.dataGenerationHelper.getAccurateNumber(splitToRestaurantTakeout, 2);
                restaurantSummary.takeout.order_details = orderDetailsTakeout;
                apiResult = {status: 200, data: restaurantSummary};
                nextstep();
            });
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetRestaurantSummary step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetRestaurantSummary step-(right) callback'});
        }

        callback(error, apiResult);
    })

}

var UpdateOrderPrints = function (reqParams, callback) {
    var _this = exports;

    var orderId = reqParams.orderId;
    var printerId = reqParams.printerId;
    var printedNumber = reqParams.printerBody.order_printed_number;
    var usageType = reqParams.printerBody.usage_type;
    var headerToken = reqParams.headerToken;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderPrint received arguments', reqParams: reqParams});

    var apiResult = '';

    var order = {};
    var newUsages = [];

    async.series([
        // step-1: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPrint step-1 doFindOrder', orderId: orderId});

            var selector = {_id: orderId, status: {$in: [_this.enums.OrderStatus.INPROCESS, _this.enums.OrderStatus.SUBMITTED]}};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPrints step-1 doFindOrder returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPrints step-1 doFindOrder returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('order_id', orderId));
                } else {
                    order = result[0];

                    var printers = order.printers;

                    if (printers === null || printers === undefined || printers.length === 0) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPrints step-1 doFindOrder returns an error', error: 'printers empty'});
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('printers', 'printerId'));
                    } else {
                        var printerRight = true;
                        var printerExist = false;
                        for (var i=0; i<printers.length; i++) {
                            if (printers[i]._id === printerId) {

                                var usages = printers[i].usages;
                                for (var j=0; j<usages.length; j++) {
                                    var usage = usages[j];
                                    if (usageType === usage.usage) {
                                        if (printedNumber < 1 || printedNumber > usage.order_print_number) {
                                            printerRight = false;
                                        } else {
                                            if (isNotNull(usage.order_printed_number) && printedNumber > (usage.order_print_number - usage.order_printed_number)) {
                                                printerRight = false;
                                            }

                                            if (isNotNull(usage.order_printed_number)) {
                                                usage.order_printed_number = usage.order_printed_number + printedNumber;
                                            } else {
                                                usage.order_printed_number = printedNumber;
                                            }
                                        }

                                    }
                                    newUsages.push(usage);
                                }

                                printerExist = true;
                                break;
                            }
                        }

                        if (!printerRight) {
                            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPrints step-1 doFindOrder returns an error', error: 'order_printed_number error'});
                            nextstep(new _this.httpExceptions.DataConflictedException('order_printed_number', 'order_printed_number less than 0 or more than print number'));
                        } else if (printerExist) {
                            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPrints step-1 doFindOrder returns right'});
                            nextstep();
                        } else {
                            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPrints step-1 doFindOrder returns an error', error: 'printers empty'});
                            nextstep(new _this.httpExceptions.ResourceNotFoundException('printers', 'printerId'));
                        }
                    }

                }
            });
        },
        // step-2: doUpdateOrderPrint
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPrints step-2 doUpdateOrderPrint', orderId: orderId});

            var selector = {_id: orderId, 'printers._id': printerId};

            var document = {$set: {'printers.$.usages': newUsages}};

            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.update(selector, document, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPrints step-2 doUpdateOrderPrint returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('update dining-orders', 'error'));
                } else {

                    apiResult = {status: 204};

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPrints step-2 doUpdateOrderPrint returns right'});
                    nextstep();
                }
            });
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderPrints step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderPrints step-(right) callback'});
        }
        callback (error, apiResult);
    })
}

/**
 * Update order item printer (FBE-2529)
 *
 * @param reqParams
 * @param callback
 * @constructor
 */
var UpdateOrderItemPrinter = function(reqParams, callback) {
    var _this = exports;
    var selector = {};
    var options = {};
    var helper = {  collectionName: _this.enums.CollectionName.DINING_ORDERS };
    var orderId = reqParams.orderId;
    var orderItemId = reqParams.orderItemId;
    var printerId = reqParams.printerId;
    var printedNumber = reqParams.document.item_printed_number;
    var usageType = reqParams.document.usage_type;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdateOrderItemPrinter received arguments', reqParams: reqParams});

    var order, updatedPrinters, apiResult;

    async.waterfall([
        function(nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderItemPrinter step-1 doFindOrder', orderId: orderId});
            selector = {_id: orderId, status: {$in: [_this.enums.OrderStatus.INPROCESS, _this.enums.OrderStatus.SUBMITTED]}};
            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderItemPrinter step-1 doFindOrder returns an error', error: error});
                    callback(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderItemPrinter step-1 doFindOrder returns empty'});
                    callback(new _this.httpExceptions.ResourceNotFoundException('order_id', orderId));
                } else {
                    order = result[0];
                    var itemExist = false, printerExist = false, usageExist = false, notExceedQuota = false;
                    var orderItems = order.order_items;
                    for(var i in orderItems) {
                        var item = orderItems[i];
                        if(item.order_item_id === orderItemId) {
                            itemExist = true;
                            var printers = item.printers;
                            if(printers && Array.isArray(printers) && printers.length > 0) {
                                for(var j in printers) {
                                    var p = printers[j];
                                    if(p._id === printerId) {
                                        printerExist = true;
                                        var usages = p.usages;
                                        if(usages && Array.isArray(usages) && usages.length > 0) {
                                            for(var k in usages) {
                                                var usage = usages[k];
                                                if(usage.usage === usageType) {
                                                    usageExist = true;
                                                    var oldPrintedNumber = usage.item_printed_number ? usage.item_printed_number : 0;
                                                    notExceedQuota = (oldPrintedNumber + printedNumber <= usage.item_print_number);
                                                    if(notExceedQuota) {
                                                        usage.item_printed_number = oldPrintedNumber + printedNumber;
                                                        updatedPrinters = printers;
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                        break;
                                    }
                                }
                            }
                            break;
                        }
                    }
                    if(!itemExist) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderItemPrinter step-1 doFindOrder: order item not found'});
                        callback(new _this.httpExceptions.ResourceNotFoundException('order_item_id', orderItemId));
                    } else {
                        if(!printerExist) {
                            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderItemPrinter step-1 doFindOrder: printer not found'});
                            callback(new _this.httpExceptions.ResourceNotFoundException('printer_id', printerId));
                        } else {
                            if(!usageExist) {
                                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderItemPrinter step-1 doFindOrder: printer usage not found'});
                                callback(new _this.httpExceptions.ResourceNotFoundException('printer usage not found', usageType));
                            } else {
                                if(!notExceedQuota) {
                                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderItemPrinter step-1 doFindOrder: printed number exceed quota(item_print_number)'});
                                    callback(new _this.httpExceptions.DataConflictedException('item_printed_number exceed quota', printedNumber));
                                } else {
                                    nextstep();
                                }
                            }
                        }
                    }
                }
            });
        },
        function(nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderItemPrinter step-2 doUpdateOrderItemPrint', orderId: orderId, orderItemId: orderItemId});
            var criteria = {_id: orderId, 'order_items.order_item_id': orderItemId};
            var setBody = {$set: {'order_items.$.printers': updatedPrinters}};
            _this.restaurantDataAPI.update(criteria, setBody, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdateOrderItemPrinter step-2 doUpdateOrderItemPrint returns error', error: error});
                    callback(new _this.httpExceptions.DataConflictedException('update dining-orders', 'error'));
                } else {
                    apiResult = {status: 204};
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdateOrderItemPrinter step-2 doUpdateOrderItemPrint returns right'});
                    callback(null, apiResult);
                }
            });
        }
    ], function(error, result) {
        callback(error, result);
    })
}

/**
 * Update Printed Number (FBE-2550)
 *
 * @param reqParams
 * @param callback
 * @constructor
 */
var UpdatePrintedNumber = function(reqParams, callback) {
    var _this = exports;
    var taskId = reqParams.taskId;
    var printedNumber = reqParams.document.printed_number;
    var code = reqParams.document.code;
    if(!isNotNull(code))
    {
        code = '';
    }
    var message = reqParams.document.message;
    if(!isNotNull(message))
    {
        message = '';
    }
    var history = {code:code, message:message, create_time:new Date()};

    var selector = {_id: taskId};
    var options = {};
    var helper = {  collectionName: _this.enums.CollectionName.PRINT_TASKS };

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.UpdatePrintedNumber received arguments', reqParams: reqParams});

    var printedNumberAmount, taskDone=false, apiResult;

    async.waterfall([
        function(nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdatePrintedNumber step-1 doFindPrintTask', taskId: taskId});
            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if(error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdatePrintedNumber step-1 doFindPrintTask returns an error', error: error});
                    callback(new _this.httpExceptions.DataConflictedException('find print-tasks', 'db error'));
                } else {
                    if(!result || !Array.isArray(result) || result.length === 0) {
                        _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdatePrintedNumber step-1 doFindPrintTask returns empty'});
                        callback(new _this.httpExceptions.ResourceNotFoundException('task_id', taskId));
                    } else {
                        var task = result[0];
                        var printedNo = task.printed_number ? task.printed_number:0;
                        printedNumberAmount = printedNo + printedNumber;
                        var exceedQuota = printedNumberAmount > task.print_number;
                        if(exceedQuota) {
                            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdatePrintedNumber step-1 doFindPrintTask printed_number exceed quota(print_number)'});
                            callback(new _this.httpExceptions.DataConflictedException('printed_number exceed quota(print_number)', printedNumber));
                        } else {
                            taskDone = (printedNumberAmount === task.print_number);
                            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdatePrintedNumber step-1 doFindPrintTask completed', taskId: taskId});
                            nextstep();
                        }
                    }
                }
            })
        },
        function(nextstep) {
            var setBody = taskDone ? {$set: {printed_number: printedNumberAmount, task_status: 'DONE'}, $push: { history: history}} : {$set: {printed_number: printedNumberAmount}, $push: { history: history}};
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdatePrintedNumber step-2 doUpdatePrintTask', setBody: setBody});
            _this.restaurantDataAPI.update(selector, setBody, options, helper, function(error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.UpdatePrintedNumber step-2 doUpdatePrintTask returns error', error: error});
                    callback(new _this.httpExceptions.DataConflictedException('update print-tasks', 'db error'));
                } else {
                    apiResult = {status: 204};
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.UpdatePrintedNumber step-2 doUpdatePrintTask returns right'});
                    callback(null, apiResult);
                }
            })
        }
    ], function(error, result) {
        callback(error, result);
    })

}

var GetPrintTasks = function (reqParams, callback) {
    var _this = exports;

    var deviceId = reqParams.deviceId;
    var orderId = reqParams.orderId;
    var printerId = reqParams.printerId;
    var startTime = reqParams.startTime;
    var locale = reqParams.locale;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetPrintTasks', reqParams: reqParams});

    var selector = {device_id: deviceId, task_status: {$ne: 'DONE'}, is_expired :{$ne :true}};
    if (isNotNull(orderId)) {
        selector['order_id'] = orderId;
    }
    if (isNotNull(printerId)) {
        selector['printer_id'] = printerId;
    }
    if (isNotNull(startTime)) {
        selector['create_time'] = {$gte: _this.dataGenerationHelper.getValidUTCDate(startTime)};
    }
    var options = {sort: {create_time: 1}};
    var helper = {collectionName: _this.enums.CollectionName.PRINT_TASKS};

    _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetPrintTasks returns error', error: error});
            callback(new _this.httpExceptions.DataConflictedException('get print-tasks', 'error'));
        } else {

            if (result && result.length > 0) {
                for (var i=0; i<result.length; i++) {
                    var task = result[i];

                    if (task.order_items && task.order_items.length > 0) {
                        for (var j=0; j<task.order_items.length; j++) {
                            var orderItem = task.order_items[j];

                            orderItem.item_name = _this.orderManager.getMenuItemNameByLocale(orderItem.item_names, orderItem.item_name, locale);
                            if(orderItem.combinations && orderItem.combinations.length > 0){
                                orderItem.combinations = formatCombinationsByLocale(orderItem.combinations, locale);
                            }

                        }
                    }
                }
            }

            _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetPrintTasks returns right'});
            callback(null, {status: 200, data: {'print_tasks': result}});
        }
    });
}

var GetOperations = function (reqParams, callback) {
    var _this = exports;

    var restaurantId = reqParams.restaurantId;
    var userId = reqParams.userId;
    var action = reqParams.action;
    var startTime = reqParams.startTime;
    var endTime = reqParams.endTime;
    var from = reqParams.from;
    var pageSize = reqParams.pageSize;
    var osType = reqParams.osType;
    var appVersion = reqParams.appVersion;
    var deviceId = reqParams.deviceId;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetOperations', reqParams: reqParams});

    var selector = [];

    if (isNotNull(restaurantId)) {
        selector.push({
            $match: {
                'restaurant.restaurant_id': restaurantId
            }
        });
    }

    selector.push({
        $unwind: '$operations'
    });

    if (isNotNull(userId) || isNotNull(action) || isNotNull(startTime) || isNotNull(endTime)) {
        var match = {};

        if (isNotNull(userId)) {
            match['operations.user_id'] = userId;
        }

        if (isNotNull(action)) {
            match['operations.action'] = action;
        }

        if (isNotNull(startTime) && isNotNull(endTime)) {
            match['operations.operation_time'] = {$gte: _this.dataGenerationHelper.getValidUTCDate(startTime), $lt: _this.dataGenerationHelper.getValidUTCDate(endTime)};
        } else if (isNotNull(startTime) && !isNotNull(endTime)) {
            match['operations.operation_time'] = {$gte: _this.dataGenerationHelper.getValidUTCDate(startTime)};
        } else if (!isNotNull(startTime) && isNotNull(endTime)) {
            match['operations.operation_time'] = {$lt: _this.dataGenerationHelper.getValidUTCDate(endTime)};
        }

        selector.push({
            $match: match
        });
    }

    selector.push({
        $group: {
            _id: {
                _id: '$_id',
                order_no: '$order_no',
                create_time: '$create_time'
            },
            operations:{'$push': '$operations'}
        }
    });

    selector.push({
        $project: {
            _id: '$_id._id',
            order_no: '$_id.order_no',
            create_time: '$_id.create_time',
            operations: '$operations'
        }
    });

    var options = {};
    _this.orderManager.pagingFunction(options, from, pageSize);

    selector.push({
        $skip: options.skip
    });

    selector.push({
        $limit: options.limit
    });

    selector.push({
        $sort: {
            create_time: -1
        }
    });

    var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

    _this.restaurantDataAPI.aggregateWithArray(selector, helper, function (error, result) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetOperations returns error', error: error});
            callback(new _this.httpExceptions.DataConflictedException('get operations', 'error'));
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetOperations returns right'});
            callback(null, {status: 200, data: {'orders': result}});
        }
    });

}

var CreatePreOrder = function (reqParams, callback) {
    var _this = exports;

}

/**
 * not null and length > 0
 *
 * @param value
 */
var isValidLength = function (value) {
    return value !== null && value !== undefined && value.length > 0;
}

var CreatePreOrderNoticePrintTask=function(orderId,order,callback){
    var _this  = exports;

    order.printerUsage = 'PREORDER_NOTICE';
    createPrintTask_old(orderId, order, callback);
    delete order.printerUsage;
}

var CreatePrintTask=function(orderId,order,callback){
    var _this  = exports;
    var printTasks = [];
    async.series([
        function(nextstep){
            if(!order.order_items || !Array.isArray(order.order_items) || order.order_items.length < 1){
                return callback(null,[])
            }else{
                nextstep();
            }
        },
        function(nextstep){
            createPrintTask_old(orderId,order,function(error,result){
                if(error){
                    nextstep(error);
                }else{
                    if(result.length > 0){
                        printTasks.concat(result);
                    }
                    nextstep();
                }
            })
        },
        function(nextstep){
            _this.orderPrintTask.createAndPrintKitchenPrintTask(order,function(error,result){
                if(error){
                    nextstep(error);
                }else{
                    if(result.length > 0){
                        printTasks.concat(result);
                    }
                    nextstep();
                }
            })
        }
    ],function(error){
        callback(error,printTasks);
    })

}

var createPrintTask_old = function (orderId, order, callback) {
    var _this = exports;
    var printTasks = [];

}

/**
 * Get order count by days
 * day < 1 return all, if day = 1 return the count in one day before current day
 * isOnline: empty, true, false
 * includeCancelledOrder: true, false
 *
 * @param days
 * @param isOnline
 * @param includeCancelledOrder
 * @param cities
 * @constructor
 */
var GetOrderCount = function (days, isOnline, includeCancelledOrder, cities, callback) {
    var _this = exports;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetOrderCount received parameters', days: days, isOnline: isOnline});

    var dayCountMap = {};

    var length = days.length;     // the num of loop
    async.eachSeries(days, function(day, next) {
        var selector = {
            status: {$in: [_this.enums.OrderStatus.PAID, _this.enums.OrderStatus.CLOSED]},
            bill_status: {$exists: 1},
            'restaurant.addresses.city': {$in: cities}
        };

        if (isOnline === true || isOnline === false) {
            selector['bill_status.is_online_payment'] = isOnline;
        }

        if (includeCancelledOrder === true) {
            selector = {
                $or: [
                    selector,
                    {
                        $and: [
                            {'operations.user_role': {$ne: _this.enums.UserRole.SYSTEM}}, {'operations.action': _this.enums.ActionStatus.CANCEL},
                            {'status': _this.enums.OrderStatus.CANCELLED}, {'is_takeout': {$ne: true}}, {'order_type': {$exists: 0}},
                            {'restaurant.addresses.city': {$in: cities}}
                        ]
                    }
                ]
            };
        }

        if (day > 0) {
            var currentTime = _this.dataGenerationHelper.getValidAfterDayUTCDate(null, -day);
            currentTime.setHours(0);
            currentTime.setMinutes(0);
            currentTime.setSeconds(0);
            currentTime.setMilliseconds(0);

            selector['create_time'] = {$gte: currentTime}
        }

        var options = {};
        var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

        _this.restaurantDataAPI.count(selector, options, helper, function(error, result){
            if (error) {
                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetOrderCount', error: error});
                callback(new _this.httpExceptions.DataConflictedException('find dinning-orders', 'error'), null);
            } else {
                length--;
                dayCountMap[day] = result;

                _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetOrderCount returns right'});
                next();
            }
        });
    }, function (error) {
        if (error) {
            _this.logger.error('%j', { function: 'DEBUG-ERROR: Order.GetOrderCount returns error', error: error});
            callback(new _this.httpExceptions.DataConflictedException('find dinning-orders error', 'error'), null);
        } else {
            if (length == 0) {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order.FixOldData step-6 doUpdateMenuAndUser returns right'});
                callback(null, dayCountMap);
            }
        }
    });

}

/**
 * Group the order count
 *
 * @param startDate
 * @param endDate
 * @param isOnline  true/false/''
 * @param includeCancelledOrder true/false
 * @param statType separate/combination
 * @param timeType day/hour/week/month
 * @param cityMap city/restaurant map
 * @param allCities
 * @param restaurants
 * @param callback
 * @constructor
 */
var GetCustomerOrderCountSource = function (startDate, endDate, isOnline, includeCancelledOrder, statType, timeType, cityMap, allCities, restaurants, callback) {
    var _this = exports;

    var orginStartDate = _this.backendHelpers.jsonHelper().cloneDocument(startDate);

    var source = {};
    var orderAmounts = [];

    async.series([
        // step-1: doFindOrderStat
        function (nextstep) {
            var selector = {status: {$in: [_this.enums.OrderStatus.PAID, _this.enums.OrderStatus.CLOSED]},
                bill_status: {$exists: 1},
                'restaurant.addresses.city': {$exists: 1},
                create_time: {$gte:  startDate, $lt: endDate}};

            if (isOnline === true || isOnline === false) {
                selector['bill_status.is_online_payment'] = isOnline;
            }

            if (includeCancelledOrder === true) {
                selector = {
                    $or: [
                        selector,
                        {
                            $and: [
                                {'status': _this.enums.OrderStatus.CANCELLED},
                                {'restaurant.addresses.city': {$exists: 1}},
                                {create_time: {$gte:  startDate, $lt: endDate}}
                            ]
                        }
                    ]
                };
            }

            if (allCities.length > 0) {
                selector['restaurant.addresses.city'] = {$in: allCities};
            }

            if (restaurants.length > 0) {
                selector['restaurant.restaurant_id'] = {$in: restaurants};
            }

            var keys = {};

            if (timeType === _this.enums.CityRestaurantsOrderTimeType.DAY) {
                if (statType === _this.enums.StatType.SEPARATION) {
                    keys = function(doc) {
                        var date = new Date(doc.create_time);
                        var dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        return {day:dateKey};
                    };
                } else {
                    keys = function(doc) {
                        var date = new Date(doc.create_time);
                        var dateKey = date.getDate();
                        return {day:dateKey};
                    };
                }
            } else if (timeType === _this.enums.CityRestaurantsOrderTimeType.HOUR){
                if (statType === _this.enums.StatType.SEPARATION) {
                    keys = function(doc) {
                        var date = new Date(doc.create_time);
                        var dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
                        return {day:dateKey};
                    };
                } else {
                    keys = function(doc) {
                        var date = new Date(doc.create_time);
                        var dateKey = date.getHours();
                        return {day:dateKey};
                    };
                }
            } else if (timeType === _this.enums.CityRestaurantsOrderTimeType.WEEK) {
                if (statType === _this.enums.StatType.SEPARATION) {
                    keys = function(doc) {
                        var date = new Date(doc.create_time);
                        var dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        return {day:dateKey};
                    };
                } else {
                    keys = function(doc) {
                        var date = new Date(doc.create_time);
                        var dateKey = date.getDay();
                        return {day:dateKey};
                    };
                }
            } else {
                if (statType === _this.enums.StatType.SEPARATION) {
                    keys = function(doc) {
                        var date = new Date(doc.create_time);
                        var dateKey = new Date(date.getFullYear(), date.getMonth());
                        return {day:dateKey};
                    };
                } else {
                    keys = function(doc) {
                        var date = new Date(doc.create_time);
                        var dateKey = date.getMonth();
                        return {day:dateKey};
                    };
                }
            }

            var condition = selector;
            var initial = {city_count_map: {}};

            var reduce = {};

            if (restaurants.length > 0) {
                reduce = function(obj, out) {

                    var status = obj.status;
                    var restaurantId = obj.restaurant.restaurant_id;

                    var restaurantCountMap = out.city_count_map;

                    if (restaurantCountMap[restaurantId]) {
                        if (status === 'CANCELLED') {
                            restaurantCountMap[restaurantId].cancelled_count++;
                        } else {
                            restaurantCountMap[restaurantId].count++;
                        }
                    } else {
                        restaurantCountMap[restaurantId] = {
                            count: 0,
                            cancelled_count: 0
                        };
                        if (status === 'CANCELLED') {
                            restaurantCountMap[restaurantId].cancelled_count = 1;
                        } else {
                            restaurantCountMap[restaurantId].count = 1;
                        }
                    }

                };
            } else {
                reduce = function(obj, out) {

                    var status = obj.status;
                    var city = obj.restaurant.addresses.city;

                    var cityCountMap = out.city_count_map;

                    if (cityCountMap[city]) {
                        if (status === 'CANCELLED') {
                            cityCountMap[city].cancelled_count++;
                        } else {
                            cityCountMap[city].count++;
                        }
                    } else {
                        cityCountMap[city] = {
                            count: 0,
                            cancelled_count: 0
                        };

                        if (status === 'CANCELLED') {
                            cityCountMap[city].cancelled_count = 1;
                        } else {
                            cityCountMap[city].count = 1;
                        }
                    }

                };
            }

            var finalize = null;
            var command = null;
            var options = null;
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.group(keys, condition, initial, reduce, finalize,command, options, helper, function(error, res) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetCustomerOrderCountSource step-1 doFindOrderStat returns error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('group dinning-orders', 'error'));
                } else {
                    orderAmounts = res;

                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCustomerOrderCountSource step-1 doFindOrderStat returns right'});
                    nextstep();
                }
            });
        },
        // step-2: doPopulateResult
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCustomerOrderCountSource step-2 doPopulateResult'});

            var totalCount = 0;
            var totalCanceledCount = 0;

            var orderAmountMap = {};
            for (var i=0; i<orderAmounts.length; i++) {
                var orderAmount = orderAmounts[i];

                var cityCountMap = orderAmount.city_count_map;

                var date = _this.dataGenerationHelper.getValidUTCDateTimeFormat(orderAmount.day);
                if (statType === _this.enums.StatType.COMBINATION) {
                    date = orderAmount.day;
                }

                var allCount = 0;
                var cancelledAllCount = 0;
                for (var key in cityCountMap) {
                    var cityCount = cityCountMap[key].count;
                    var cancelledCount = cityCountMap[key].cancelled_count;

                    if (cityMap[key]) {
                        allCount += cityCount;
                        cancelledAllCount += cancelledCount;

                        var cityDate = cityMap[key];
                        cityDate.count = cityDate.count ? cityDate.count + cityCount : cityCount;
                        cityDate.cancelled_count = cityDate.cancelled_count ? cityDate.cancelled_count + cancelledCount : cancelledCount
                        cityDate[date] = {
                            date: date,
                            count: cityCount,
                            cancelled_count: cancelledCount
                        };
                    }
                }

                var totalDate = {
                    date: date,
                    count: allCount,
                    cancelled_count: cancelledAllCount
                };

                orderAmountMap[date] = totalDate;

                totalCount += allCount;
                totalCanceledCount += cancelledAllCount;

            }

            var orderStat = {
                total: {
                    count: totalCount,
                    cancelled_count: totalCanceledCount,
                    days: []
                }
            };
            for (var key in cityMap) {
                orderStat[key] = {
                    count: cityMap[key].count ? cityMap[key].count : 0,
                    cancelled_count: cityMap[key].cancelled_count ? cityMap[key].cancelled_count : 0,
                    days: []
                }

                if (restaurants.length > 0) {
                    orderStat[key].names = cityMap[key].longNames;
                }
            }

            if (statType === _this.enums.StatType.SEPARATION) {
                var weekCount = 1;
                while(startDate.getTime() < endDate.getTime()) {

                    var date = _this.dataGenerationHelper.getValidUTCDateTimeFormat(startDate.getTime());

                    var totalStat = {};
                    if (orderAmountMap[date]) {
                        totalStat = orderAmountMap[date];
                    } else {
                        totalStat = {
                            date: _this.dataGenerationHelper.getValidUTCDateTimeFormat(startDate.getTime()),
                            count: 0,
                            cancelled_count: 0
                        };
                    }
                    orderStat.total.days.push(totalStat);

                    for (var key in cityMap) {
                        var cityStat = {};
                        if (cityMap[key][date]) {
                            cityStat = cityMap[key][date];
                        } else {
                            cityStat = {
                                date: _this.dataGenerationHelper.getValidUTCDateTimeFormat(startDate.getTime()),
                                count: 0,
                                cancelled_count: 0
                            };
                        }
                        orderStat[key].days.push(cityStat);
                    }

                    if (timeType === _this.enums.CityRestaurantsOrderTimeType.DAY) {
                        startDate = _this.dataGenerationHelper.getValidAfterMinuteUTCDate(startDate.getTime(), 24 * 60);
                    } else if (timeType === _this.enums.CityRestaurantsOrderTimeType.WEEK) {
                        startDate = _this.dataGenerationHelper.getValidAfterMinuteUTCDate(startDate.getTime(), 24 * 60);
                    } else if (timeType === _this.enums.CityRestaurantsOrderTimeType.HOUR){
                        startDate = _this.dataGenerationHelper.getValidAfterMinuteUTCDate(startDate.getTime(), 60);
                    } else {
                        startDate = moment(startDate).local().add(1, 'month').toDate();;
                    }
                }
            } else {
                var beginValue = 0;
                var loopCount = 0;

                if (timeType === _this.enums.CityRestaurantsOrderTimeType.DAY) {
                    // DAY 1-31
                    beginValue = 1;
                    loopCount = 31;
                } else if (timeType === _this.enums.CityRestaurantsOrderTimeType.WEEK) {
                    // WEEK 0-6
                    loopCount = 6
                } else if (timeType === _this.enums.CityRestaurantsOrderTimeType.HOUR) {
                    // HOUR 0-23
                    loopCount = 23;
                } else {
                    // MONTH 0-11
                    loopCount = 11;
                }

                for (var i=beginValue; i<=loopCount; i++) {
                    var date = i;

                    var totalStat = {};
                    if (orderAmountMap[date]) {
                        totalStat = orderAmountMap[date];
                    } else {
                        totalStat = {
                            date: date,
                            count: 0,
                            cancelled_count: 0
                        };
                    }

                    if (timeType === _this.enums.CityRestaurantsOrderTimeType.HOUR) {
                        totalStat.min_date = i;
                        totalStat.max_date = i + 1;
                    }

                    orderStat.total.days.push(totalStat);

                    for (var key in cityMap) {
                        var cityStat = {};
                        if (cityMap[key][date]) {
                            cityStat = cityMap[key][date];
                        } else {
                            cityStat = {
                                date: date,
                                count: 0,
                                cancelled_count: 0
                            };
                        }

                        if (timeType === _this.enums.CityRestaurantsOrderTimeType.HOUR) {
                            cityStat.min_date = i;
                            cityStat.max_date = i + 1;
                        }

                        orderStat[key].days.push(cityStat);
                    }
                }
            }

            // repopulate
            if (statType === _this.enums.StatType.SEPARATION && timeType === _this.enums.CityRestaurantsOrderTimeType.WEEK) {

                var cities = [];    // ['total', 'suzhou']
                var weeks = [];     // ['2016-1', '2016-2']
                var weekOrderStatMap = {};
                var orderStatLoop = 1;  // for weeks, we only need one
                for (var key in orderStat) {
                    var cityOrderStat = orderStat[key];

                    weekOrderStatMap[key] = {};
                    var totalWeekCount = 1;
                    for (var i=0; i<cityOrderStat.days.length; i++) {
                        var totalDay = cityOrderStat.days[i];
                        var date = totalDay.date;

                        var totalDate = moment(date).local().toDate();
                        var fullYear = moment(date).local().year();
                        var dayInWeek = moment(date).local().day();

                        if (i > 0 && dayInWeek === 1) {
                            totalWeekCount++;
                        }

                        var dayKey = fullYear + '-' + totalWeekCount;

                        if (weekOrderStatMap[key][dayKey]) {
                            weekOrderStatMap[key][dayKey].count += totalDay.count;
                            weekOrderStatMap[key][dayKey].cancelled_count += totalDay.cancelled_count;
                        } else {
                            if (orderStatLoop === 1) {
                                weeks.push(dayKey);
                            }

                            // Monday
                            var minDate = moment(_this.backendHelpers.jsonHelper().cloneDocument(totalDate)).local().day('Monday').toDate();
                            if (i === 0) {
                                minDate = moment(orginStartDate).local().toDate();
                            }
                            // Sunday
                            var maxDate = moment(_this.backendHelpers.jsonHelper().cloneDocument(minDate)).local().toDate();
                            if (dayInWeek > 0) {
                                maxDate = moment(_this.backendHelpers.jsonHelper().cloneDocument(minDate)).local().add(7 - dayInWeek, 'day').toDate();
                            }

                            weekOrderStatMap[key][dayKey] = {
                                count: totalDay.count,
                                cancelled_count: totalDay.cancelled_count,
                                min_date: _this.dataGenerationHelper.getValidUTCDateTimeFormat(minDate.getTime()),
                                max_date: _this.dataGenerationHelper.getValidUTCDateTimeFormat(maxDate.getTime())
                            }
                        }

                        if (cityOrderStat.days.length - 1 === i) {
                            totalWeekCount = 1;
                            weekOrderStatMap[key][dayKey].max_date = _this.dataGenerationHelper.getValidUTCDateTimeFormat(endDate.getTime() - 24 * 60 * 60 * 1000);
                        }
                    }

                    orderStatLoop++;
                }

                var repopulateOrderStat = {
                    total: {
                        count: totalCount,
                        cancelled_count: totalCanceledCount,
                        days: []
                    }
                };

                cities.push('total');

                for (var key in cityMap) {
                    repopulateOrderStat[key] = {
                        count: cityMap[key].count,
                        cancelled_count: cityMap[key].cancelled_count,
                        days: []
                    }

                    if (restaurants.length > 0) {
                        repopulateOrderStat[key].names = cityMap[key].longNames;
                    }

                    cities.push(key);
                }

                for (var i=0; i<cities.length; i++) {
                    var city = cities[i];

                    var weekOrderStat = weekOrderStatMap[city];

                    for (var j=0; j<weeks.length; j++) {
                        var week = weeks[j];

                        var stat = weekOrderStat[week];
                        stat.week = week;
                        repopulateOrderStat[city].days.push(weekOrderStat[week]);
                    }
                }

                orderStat = repopulateOrderStat;
            }

            source = orderStat;

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.GetCustomerOrderCountSource step-2 doPopulateResult returns right'});
            nextstep();
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.GetCustomerOrderCountSource step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.GetCustomerOrderCountSource step-(right) callback'});
        }

        callback(error, source);
    })
}

var SetDeliveryStatus = function (reqParams, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.SetDeliveryStatus received arguments',
        reqParams: reqParams});
    var userId = reqParams.userId;
    var orderId =  reqParams.orderId;
    var action =  reqParams.action;
    var headerToken = reqParams.headerToken;

    if (action === 'ready') {
        action = _this.enums.DeliveryStatus.READY;
    } else {
        action = _this.enums.DeliveryStatus.DELIVERED;
    }

    var apiResult = '';

    var nowTime = _this.dataGenerationHelper.getValidUTCDate();
    var order = {};

    async.series([
        // step-1: doFindOrder
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.SetDeliveryStatus step-1 doFindOrder', orderId: orderId});

            var selector = {_id: orderId, order_type: _this.enums.OrderType.DELIVERY, status: _this.enums.OrderStatus.CLOSED};
            if (action === _this.enums.DeliveryStatus.READY) {
                selector['delivery_status'] = {$in: [_this.enums.DeliveryStatus.PREPARING, _this.enums.DeliveryStatus.READY]};
            } else {
                selector['delivery_status'] = {$in: [_this.enums.DeliveryStatus.READY, _this.enums.DeliveryStatus.DELIVERED]};
            }
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.SetDeliveryStatus step-1 doFindOrder returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', error));
                } else if (result === undefined || result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.SetDeliveryStatus step-1 doFindOrder returns empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('orderId', orderId));
                } else {
                    order = result[0];

                    if (action === order.delivery_status) {
                        apiResult = {status: 204};
                        callback(null, apiResult);
                        return;
                    }

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.SetDeliveryStatus step-1 doFindOrder returns right'});
                    nextstep();
                }
            });
        },
        // step-2: doUpdateOrder
        function (nextstep) {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.SetDeliveryStatus step-2 doUpdateOrder', orderId: orderId, action: action});

            var selector = {_id: orderId};
            var document = {};
            if (action === _this.enums.DeliveryStatus.DELIVERED) {
                document = {$set: {
                    delivery_status: action,
                    consumer_delivery_status: action,
                    picked_up: true,
                    last_submission_time: nowTime,
                    lastmodified: nowTime,
                    last_modified: nowTime,
                    redeemed_time: nowTime
                }};
            } else {
                document = {$set: {delivery_status: action}};
            }
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.update(selector, document, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order.SetDeliveryStatus step-2 doUpdateOrder returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('update dining-orders', error));
                } else {
                    apiResult = {status: 204};

                    _this.logger.info('%j', {function:'DEBUG-INFO: Order.SetDeliveryStatus step-2 doUpdateOrder returns right'});
                    nextstep();
                }
            });
        },
        // step-3: doSendNotification
        function (nextstep) {

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.SetDeliveryStatus do step-notification', orderId: orderId});

            var postData = {};
            postData.host = _this.config.other_servers.notification.server_url;
            postData.port = _this.config.other_servers.notification.server_port;
            postData.path = '/notifications';
            var mobile = order.delivery_address.receiver.mobile;

            var body = {
                'command': _this.enums.PushMessageType.BROADCAST,
                'user_id': order.user.user_id,
                'user_name': order.user.user_name || '',
                'restaurant_id': order.restaurant.restaurant_id,
                'restaurant_name': order.restaurant.restaurant_name|| '',
                'restaurant_phone': order.restaurant.officialPhone|| '',
                'consumer_phone':mobile,
                "pickup_time":order.picked_up_time||'',
                'table_id': order.tableId,
                'table_no': order.tableNo,
                'order_id': orderId,
                'code': _this.enums.PushMessageType.READY_FOR_DELIVERY
            };

            if (action === _this.enums.DeliveryStatus.DELIVERED) {
                body.code = _this.enums.PushMessageType.ORDER_DELIVERED;
            }

            postData.method = 'POST';
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order.SetDeliveryStatus do step-notification', postData: postData});

            var loggerInfos = {
                function : 'Order.SetDeliveryStatus do step-notification'
            };

            _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-INFO: Order.SetDeliveryStatus do step-notification returns an error',
                        error: error
                    });
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order.SetDeliveryStatus do step-notification returns right'});
                }
            }, reqParams, loggerInfos);

            nextstep();
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order.SetDeliveryStatus step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order.SetDeliveryStatus step-(right) callback'});
        }

        callback(error, apiResult);
    });
}

/**
 *
 * @param menuCombinations
 * @param combinations
 * @param locale
 * @returns {*}
 */
var calcuateCombinationsPrice = function (menuCombinations, combinations, locale) {
    var _this = exports;

    var menuCombinationsCopy = _this.backendHelpers.jsonHelper().cloneDocument(menuCombinations);

    // new combinations
    var newCombinations = populdateNewItems(combinations);
    // new combinations id map
    var itemIdQuantityMap = populdateItemIdQuantityMap(newCombinations);
    // compare the quantity
    var itemMap = populdateItemMap(menuCombinationsCopy, itemIdQuantityMap, locale);

    if (itemMap === false) {
        return false;
    } else {
        // calculate price
        return calculateItemsPrice(newCombinations, itemMap);
    }
}

var populdateNewItems = function (items) {

    var newItems = [];

    for (var i=0; i<items.length; i++) {
        var item = items[i];

        if (item.quantity === 0) {
            continue;
        }

        item.quantity = isNumber(item.quantity) ? item.quantity : 1;

        var newItem = JSON.parse(JSON.stringify(item));
        delete newItem.items;
        if (isValidLength(item.items)) {
            var itemItems = populdateNewItems(item.items);
            if (itemItems.length === 0) {
                continue;
            }
            newItem.items = itemItems;
        }

        newItems.push(newItem);

    }

    return newItems;
}

/**
 * return all the item id map
 *
 * @param items
 * @returns {{}}
 */
var populdateItemIdQuantityMap = function (items) {

    var map = {};

    for (var i=0; i<items.length; i++) {
        var item = items[i];

        if (isValidLength(item.items)) {
            var itemMap = populdateItemIdQuantityMap(item.items);
            for (var key in itemMap) {
                map[key] = itemMap[key];
            }

            map[item._id] = item._id;
        } else {
            map[item._id] = item.quantity;
        }
    }

    return map;
}

/**
 * return all item menu info map
 * if quantity is more than menu maximum_value, then return false
 *
 * @param items                 menu items
 * @param itemIdQuantityMap
 * @param locale                use locale item name
 * @returns {*}
 */
var populdateItemMap = function (items, itemIdQuantityMap, locale) {

    var isRight = true;

    for (var i=0; i<items.length; i++) {
        var item = items[i];

        item.name = getNameByLocale(item.longNames, locale);
        delete item.longNames;

        var id = item._id;

        if (isValidLength(item.items)) {
            var value = populdateItemMap(item.items, itemIdQuantityMap, locale);

            if (value === false) {
                isRight = false;
                break;
            }

            if (itemIdQuantityMap[id]) {
                itemIdQuantityMap[id] = item;
                delete itemIdQuantityMap[id].items;
            }
        } else {
            if (itemIdQuantityMap[id]) {
                var quantity = itemIdQuantityMap[id];

                itemIdQuantityMap[id] = item;

                if (item.maximum_value && quantity > item.maximum_value) {
                    isRight = false;
                    break;
                }
            }
        }
    }

    if (isRight == false) {
        return false;
    }

    return itemIdQuantityMap;
}

var getNameByLocale = function (names, locale) {

    var name = '';

    if (isValidLength(names)) {
        name = names[0].name;

        for (var i=0; i<names.length; i++) {
            var longName = names[i];

            if (locale === longName.locale) {
                name = longName.name;
                break;
            }
        }
    }

    return name;
}

/**
 * return the total price and items info
 *
 * @param items
 * @param itemIdQuantityMap
 * @returns {{price: number, combinations: *}}
 */
var calculateItemsPrice = function (items, itemIdQuantityMap) {
    var _this = exports;

    var price = 0.0;
    var originalPrice = 0.0;

    for (var i=0; i<items.length; i++) {
        var item = items[i];

        var id = item._id;

        if (isValidLength(item.items)) {
            if (itemIdQuantityMap[id]) {
                for (var key in itemIdQuantityMap[id]) {
                    item[key] = itemIdQuantityMap[id][key];
                }

                var priceAndCombinations = calculateItemsPrice(item.items, itemIdQuantityMap);

                var quantity = isNumber(item.quantity) ? item.quantity : 1;

                if (item.price) {
                    price = _this.dataGenerationHelper.getAccurateNumber(price + priceAndCombinations.price + item.price * quantity, 2);

                    // 原始价格
                    var oPrice = item.OriginalPrice ? item.OriginalPrice : item.price;
                    originalPrice = _this.dataGenerationHelper.getAccurateNumber(originalPrice + priceAndCombinations.originalPrice + oPrice * quantity, 2);
                } else {
                    price = _this.dataGenerationHelper.getAccurateNumber(price + priceAndCombinations.price, 2);
                    originalPrice = _this.dataGenerationHelper.getAccurateNumber(originalPrice + priceAndCombinations.originalPrice, 2);
                }

            }

        } else {
            if (itemIdQuantityMap[id]) {
                for (var key in itemIdQuantityMap[id]) {
                    item[key] = itemIdQuantityMap[id][key];
                }

                if( item.price) {
                    price = _this.dataGenerationHelper.getAccurateNumber(price + item.price * item.quantity, 2);
                    // 原始价格
                    var oPrice = item.OriginalPrice ? item.OriginalPrice : item.price;
                    originalPrice = _this.dataGenerationHelper.getAccurateNumber(originalPrice + oPrice * item.quantity, 2);
                }
            }
        }
    }

    return {
        price: price,
        combinations: items,
        originalPrice: originalPrice
    };
}

var populatePrinterCombinations = function (items) {

    for (var i=0; i<items.length; i++) {
        var item = items[i];

        delete item.maximum_value;
        delete item.minimum_value;

        if (isValidLength(item.items)) {
            populatePrinterCombinations(item.items);
        }
    }

    return items;
}

// calculate the query date
// the default query time is from 90 days ago to today
// if startDate or endDate exists, we will use them, but the max range is 90 days ago from endDate, else startDate is 90 days ago from today and endDate is today
var getCustomQueryDate = function (startDate, endDate, defaultStatDay) {

    if (!isNotNull(startDate) && !isNotNull(endDate)) {
        startDate = moment().local().add('day', -defaultStatDay + 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
        endDate = moment().local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
    } else if (!isNotNull(startDate) && isNotNull(endDate)) {
        endDate = moment(endDate).local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
        startDate = moment(endDate).local().add('day', -defaultStatDay).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
    } else if (isNotNull(startDate) && isNotNull(endDate)) {
        startDate = moment(startDate).local().hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
        endDate = moment(endDate).local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
        if (endDate.getTime() - startDate.getTime() > defaultStatDay * 24 * 60 * 60 * 1000) {
            startDate = moment(endDate).local().add('day', -defaultStatDay).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
        }
    } else {
        startDate = moment(startDate).local().hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
        endDate = moment().local().add('day', 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
        if (endDate.getTime() - startDate.getTime() > defaultStatDay * 24 * 60 * 60 * 1000) {
            startDate = moment().local().add('day', -defaultStatDay + 1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
        }
    }

    return {startDate: startDate, endDate: endDate};
}

var formatCombinationsByLocale = function (combinations, locale) {

    if (!isNotNull(locale)) {
        return combinations;
    }

    if (combinations && combinations.length > 0) {
        for (var i = 0; i<combinations.length; i++) {
            var item = combinations[i];

            if (item && item.longNames && item.longNames.length > 0) {

                for (var j=0; j<item.longNames.length; j++) {
                    var longName = item.longNames[j];

                    if (longName.locale === locale) {
                        item.name = longName.name;
                        break;
                    }
                }

            }

            if (item.items && item.items.length > 0) {
                item.items = formatCombinationsByLocale(item.items, locale);
            }
        }
    }

    return combinations;
}

var CustomerChangeTip=function(params, orderId,  callback){
    var _this = exports;
    var tip_rate = params.tip_rate;
    var order = {};
    var apiResult = {};
    var shouldUpdateV2Bill = false;

    async.series([
        function (nextstep) {

            if(!tip_rate){
                nextstep(new _this.httpExceptions.ResourceNotFoundException('tip rate have not been set', orderId));
            }

            var selector = {_id: orderId};
            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: order.CustomerChangeTip lookup order returns an error', error: error});
                    nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                } else if (result === undefined || result === null || result === '' || result.length !== 1) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: order-controller.CustomerChangeTip lookup order return empty'});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('order', orderId));

                } else {

                    order = result[0];
                    if(!order.default_capture_tip_rate){
                        _this.logger.error('%j', {function:'DEBUG-ERROR:no capture tip, can not change tip after payment'}, {tip_rate:tip_rate, order_id:orderId});
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('No capture tip, can not change tip after payment', orderId));

                    }else if(tip_rate > order.default_capture_tip_rate ){
                        _this.logger.error('%j', {function:'DEBUG-ERROR: tip rate should less then hold rate'}, {tip_rate:tip_rate, order_id:orderId});
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('This order tip it not updatable', orderId));
                    }else
                    {
                        if(order.picked_up !== true &&  ( order.payment_status !== undefined &&  order.payment_status !== _this.enums.PreOrderPaymentStatus.HELD))
                        {
                            _this.logger.error('%j', {function:'DEBUG-ERROR: order.change tip , tip already changed'});
                            nextstep(new _this.httpExceptions.ResourceNotFoundException('This order tip it not updatable', orderId));
                        }
                        else{
                            if (order.rewards &&  order.payment) {
                                shouldUpdateV2Bill = true;
                            };
                            nextstep();
                        }
                    }
                }
            });
        },
        function (nextstep) {

            var holdPayment = order.payment;

            if(holdPayment.tip_rate !== undefined && holdPayment.tip_rate === tip_rate ){
                apiResult = {status: 201, data: {tranasction_id: order.payment.transaction_number, amount:holdPayment.grand_total_to_pay}};
                nextstep();
            }
            else if (shouldUpdateV2Bill) {
                var tipAmount = Math.round(holdPayment.sub_total_before_first_visit_savings * tip_rate * 100) / 100;
                order.rewards.pre_calculated_tip = order.payment.tip = tipAmount;
                order.payment.tip_rate = tip_rate;
                order.payment.grand_total_to_pay
                    = order.payment.sub_total_after_discounts
                    + order.payment.total_tax
                    + order.payment.tip;

                order.payment.grand_total_to_pay = Math.round(order.payment.grand_total_to_pay * 100) / 100;
                order.payment.grand_total_to_pay = parseFloat(Number(order.payment.grand_total_to_pay).toFixed(2));
                order =  _this.orderCalculateV2.calculateTransactions(order);

                var payment = _this.backendHelpers.jsonHelper().cloneDocument(_this.orderCalculate.calculateTransactions(order, _this.enums.PaymentTypeOther, _this.config.other_servers));

                var paymentInformationForStripe = _this.backendHelpers.jsonHelper().cloneDocument(_this.orderCalculate.calculateForAlipay(order, _this.config.other_servers));

                order.payment = payment;

                if (order.restaurant.commissionRatePercent) {
                    let orderCommission = _this.orderCalculateV2.calculateCommissionRatePercent(order);
                    order.payment = orderCommission.payment;
                }

                var criteria = {_id: orderId};
                var documentUpdate;
                var options = {};
                var helper = {collectionName: 'dining-orders'};

                documentUpdate = {
                    $set: {
                        'tip':tipAmount,
                        'payment': order.payment,
                        'paymentInformationForStripe': paymentInformationForStripe,
                        'before_round_data': order.before_round_data
                    }
                };
            }
            else{
                documentUpdate = {$set: params};
            }
            _this.restaurantDataAPI.update(criteria, documentUpdate, options, helper, function (error) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: order.CustomerChangeTip save charge result',error:error});
                    nextstep(error);
                } else {
                    _this.logger.info('%j', {function:'DEBUG-INFO: order.CustomerChangeTip add charge result status success'});
                    apiResult = {status: 201, data: {tranasction_id: order.payment.transaction_number, amount:order.payment.grand_total_to_pay}};
                    nextstep();
                }
            });

        }
    ], function(error){
        if(error){
            _this.logger.error('%j', { function: 'DEBUG-ERROR: ordercontroller.CustomerChangeTip returns error', error: error});
        }
        callback(error, apiResult);
    });

}

//-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
//-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions (below) in alphabetical order
//-- NOTE to Developers (2015-05-13): 3) For READABILITY, please help to maintain double-spaces between functions declarations
module.exports = function init(app, config, mongoConfig, logger) {
    var _this = exports;

    _this.app = app;
    _this.config = config;
    _this.otherServers = _this.config.other_servers;
    _this.logger = logger || console;
    _this.mongoConfig = mongoConfig;

    _this.restaurantDataAPI = require(_this.app.dbApiPath)(_this.config, _this.mongoConfig, _this.logger);
    _this.orderManager = require('./services/order-manager')(_this.app,_this.config, _this.mongoConfig, _this.logger);
    _this.orderCalculate = require('./services/order-calculate')(_this.app, _this.config, _this.mongoConfig, _this.logger);
    _this.backendHelpers = require(_this.app.utilsPath)(_this.config, {}, _this.logger);
    _this.enums = _this.backendHelpers.enums;
    _this.httpExceptions =_this.backendHelpers.httpExceptions;
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.payHelper = _this.backendHelpers.payHelper;
    _this.serverHelper = _this.backendHelpers.serverHelper;

    _this.messageAPI = require('./message')(_this.app, _this.config, _this.mongoConfig, _this.logger);
    _this.orderPrintTask = require('./services/order-print-task')(_this.app, _this.config, _this.mongoConfig, _this.logger);


    _this.getHealthCheck = GetHealthCheck;

    _this.batchUpdateUserInfo = BatchUpdateUserInfo;
    //-- FBE-2413
    _this.closeOrderAsPaid = CloseOrderAsPaid;
    _this.createOrder = CreateOrder;
    _this.deleteUsersByOrderId = DeleteUsersByOrderId;
    _this.deleteOrderItemByOrderItemId = DeleteOrderItemByOrderItemId;
    _this.deleteOrderByOrderId = DeleteOrderByOrderId;
    _this.deleteOrdersByRestaurantId = DeleteOrdersByRestaurantId;
    _this.deleteStaffFromTable = DeleteStaffFromTable;
    _this.getOrdersByUserId = GetOrdersByUserId;
    _this.getPastOrdersWithRating = GetPastOrdersWithRating;
    _this.getPastOrdersOnlyWithoutReview = GetPastOrdersOnlyWithoutReview;
    _this.getOrderByOrderId = GetOrderByOrderId;
    _this.getParameterByOrderId = GetParameterByOrderId;
    _this.getOrders = GetOrders;
    _this.getHaveEatenRestaurantsByUserId = GetHaveEatenRestaurantsByUserId;
    _this.getLastOrderTimeByUserId = GetLastOrderTimeByUserId;
    _this.getStaffByTableId = GetStaffByTableId;
    _this.getTableByStaffId = GetTableByStaffId;
    _this.getTableAssignments = GetTableAssignments;
    _this.getUserInfo = GetUserInfo;
    _this.getUserNameAndAvatar = GetUserNameAndAvatar;
    _this.getRestaurantNameById = GetRestaurantNameById;
    _this.getTransactions = GetTransactions;
    _this.getResumeOrders = GetResumeOrders;
    _this.isFandineAdmin = IsFandineAdmin;
    _this.updateStaffToTable = UpdateStaffToTable;

    //-- Due to FBE-963, GetBillsByOrderId() and unlockBillsByOrderId() got DEPRECATION Notice Date: 2015-05-10
    _this.updateParameterByOrderId = UpdateParameterByOrderId;
    _this.updateOrderItemByOrderId = UpdateOrderItemByOrderId;
    _this.updateOrderItemParameterByOrderItemId = UpdateOrderItemParameterByOrderItemId;
    _this.updateTableAssignment = UpdateTableAssignment;
    _this.setOrderTips = SetOrderTips;
    _this.setSettlement = SetSettlement;

    _this.populateRestaurantIds = PopulateRestaurantIds;

    //-- FBE-1887: Refactor UpdateParameterByOrderId as it is causing more bugs
    _this.updateUsersByOrderId = UpdateUsersByOrderId;
    _this.updateDiscountsByOrderId = UpdateDiscountsByOrderId;
    _this.updateActionByOrderId = UpdateActionByOrderId;
    _this.updateTablesByOrderId = UpdateTablesByOrderId;
    _this.updateServersByOrderId = UpdateServersByOrderId;
    _this.updateStatusByOrderId = UpdateStatusByOrderId;

    /**
     * V2 APIs to replace soon-to-be-deprecated ones
     */
    _this.getOrdersByUserIdV2 = GetOrdersByUserIdV2;
    _this.getBillByOrderId = GetBillByOrderId;
    _this.unlockBillByOrderId = UnlockBillByOrderId;
    _this.getRestaurantTransactions = GetRestaurantTransactions;

    _this.fixOldData = FixOldData;
    _this.getOrderItemsComments = GetOrderItemsComments;
    _this.getCurrentOrder = GetCurrentOrder;

    _this.getPrintedFlags = GetPrintedFlags;
    _this.getChitPrintedFlags = GetChitPrintedFlags;
    _this.updateReceiptPrintedFlag = UpdateReceiptPrintedFlag;
    _this.updateChitPrintedFlag = UpdateChitPrintedFlag;
    _this.updateChitPrintedFlags = UpdateChitPrintedFlags;

    //-- FBE-1615: v2 Update Order - add order items - per unit price
    _this.addOrderItemsAnyTypeOfPrice = AddOrderItemsAnyTypeOfPrice;
    _this.getSingleOrderDetails = GetSingleOrderDetails;
    _this.closeOrder= CloseOrder;
    _this.cancelOrder = CancelOrder;
    _this.requestBill = RequestBill;
    _this.updateRequestBillTime= UpdateRequestBillTime;

    // FBE-2183
    _this.createSimpleOrder = CreateSimpleOrder;
    _this.getVirtualTableNo = GetVirtualTableNo;

    // FBE-2193
    _this.updateOrderNotes = UpdateOrderNotes;

    _this.setPickedUp =SetPickedUp;
    _this.updateOrderPickedUpTime = UpdateOrderPickedUpTime;
    _this.updateOrderDeliveryTime = UpdateOrderDeliveryTime;
    _this.getRestaurantPastOrdersOnlyWithoutReview = GetRestaurantPastOrdersOnlyWithoutReview;

    //-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
    //-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions (below) in alphabetical order
    //-- NOTE to Developers (2015-05-13): 3) For READABILITY, please help to maintain double-spaces between functions declarations

    _this.getSequenceNo = GetSequenceNo;

    _this.updateOrderPrint = UpdateOrderPrint;

    _this.getRestaurantOrderStat = GetRestaurantOrderStat;
    _this.getCurrencyOrderStat = GetCurrencyOrderStat;
    _this.getRestaurantSummary = GetRestaurantSummary;
    _this.getOrderStat = GetOrderStat;
    _this.getCityRestaurantsOrderCountStat = GetCityRestaurantsOrderCountStat;

    _this.editOrderItems = EditOrderItems;
    _this.updateOrderPrints = UpdateOrderPrints;
    _this.updateOrderItemPrinter = UpdateOrderItemPrinter;
    _this.updatePrintedNumber = UpdatePrintedNumber;
    _this.getPrintTasks = GetPrintTasks;
    _this.getOperations = GetOperations;

    _this.createPreOrder = CreatePreOrder;

    _this.setDeliveryStatus = SetDeliveryStatus;

    // self function
    _this.getMenuPhoto = GetMenuPhoto;
    _this.getOuterTransaction = GetOuterTransaction;
    _this.createPrintTask = CreatePrintTask;
    _this.createPreOrderNoticePrintTask = CreatePreOrderNoticePrintTask;
    _this.getOrderCount = GetOrderCount;
    _this.getCustomerOrderCountSource = GetCustomerOrderCountSource;
    _this.updateCustomerCheckin = UpdateCustomerCheckin;
    _this.customerChangeTip = CustomerChangeTip;

    return _this;
};
