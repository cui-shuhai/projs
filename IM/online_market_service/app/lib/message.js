/**
 * Created by webber.wang on 2016-4-26.
 */
'use strict';

var async = require('async');
var http = require('http');
var crypto = require('crypto');

var RESERVATIONSTATUS = {
    CANCELLED: 'CANCELLED',
    SUBMITTED : 'SUBMITTED',
    CLOSED: 'CLOSED',
    INPROCESS:'INPROCESS'
}

var ORDERSTATUS = {
    CANCELLED: 'CANCELLED',
    SUBMITTED : 'SUBMITTED',
    CLOSED: 'CLOSED',
    INPROCESS:'INPROCESS',
    PAID : 'PAID'
};

var CreateMessage = function(messageBody,headerToken,callback){
    var _this = exports;
    var apiresult;
    _this.logger.info('%j', { function: 'DEBUG-INFO: Message.CreateMessage received arguments:',
        messageBody: messageBody
    });

    async.series([
        function(nextstep){
            var targetType = messageBody.target_type;
            var users =  messageBody.users;
            var city = messageBody.city;
            if(targetType === _this.enums.TargetStatus.MULTIPLE && !(Array.isArray(users) && users.length > 0) && (!city)){
                nextstep(new _this.httpExceptions.CommonHttpErrorException('MESSAGE_NEED_USER','user length should greater than 0 or the city should not be null',targetType));
            }else{
                nextstep();
            }
        },
        function(nextstep){
            if( messageBody.target_type === _this.enums.TargetStatus.MULTIPLE && messageBody.city){
                _this.logger.info('%j', { function: 'DEBUG-INFO: Message.CreateMessage step-2 query the users in the city:',
                    city: messageBody.city
                });
                getUserIdsByCity(messageBody.city,headerToken,function(error,result){
                    if(error){
                        nextstep(error);
                    }else{
                        messageBody.users = result;
                        nextstep();
                    }
                })
            }else {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Message.CreateMessage step-2 not pass city:'});
                nextstep();
            }

        },
        function (nextstep) {

            messageBody.status = false;
            messageBody.code = 'SYSTEM';

            var options = {};
            var helper = {collectionName: _this.enums.CollectionName.MESSAGE};
            var document = messageBody;
            _this.restaurantDataAPI.create(document,options,helper,function(error,result){
                if(error){
                    callback(error);
                }else{

                    apiresult = {status: 201, data: { 'id': messageBody._id}};

                    nextstep();
                }
            });
        },
        // step-notification: doSendNotification
        function (nextstep) {
            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Message.CreateMessage step-doSendNotification'
            });

            var postData = {};
            postData.host = _this.config.other_servers.notification.server_url;
            postData.port = _this.config.other_servers.notification.server_port;
            postData.path = '/messages/{message_id}'.replace('{message_id}', messageBody._id);


            postData.method = 'POST';
            _this.orderManager.sendToNotificationServer(postData, headerToken, null, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-ERROR: Message.CreateMessage step-doSendNotification returns an error',
                        error: error
                    });
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Message.CreateMessage step-doSendNotification returns right'});
                }
            });
            nextstep();
        }

    ],function(error){
        callback(error, apiresult);
    });
};


/**
 * Fetch messages (FBE-2666)
 *
 * @param reqParams
 * @param callback
 * @constructor
 */
var GetMessages = function(reqParams, callback) {
    var _this = exports;
    var selector = { };
    var options = {fields: { v: 0, status: 0}, sort: {create_time: -1}};
    var helper = { collectionName: _this.enums.CollectionName.MESSAGE };
    _this.logger.info('%j', { function: 'DEBUG-INFO: Message.GetMessages received arguments:',
        reqParams: reqParams
    });

    if(reqParams.user_id) {
        selector.$or = [{target_type: _this.enums.TargetStatus.ALL}, {'users.user_id': reqParams.user_id}];
    } else {
       // selector.target_type = _this.enums.TargetStatus.ALL;
       // selector.$or = [{target_type: _this.enums.TargetStatus.ALL}, {city:{$exists:true}}];
        selector.manually_created = true;
    }

    if(!reqParams.isIncludeAll) {
        selector.status = true;
    }

    _this.orderManager.pagingFunction(options, reqParams.from, reqParams.page_size);

    _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
        if(error) {
            _this.logger.error('%j', { function: 'DEBUG-ERROR: Message.GetMessages step-1 doFindMessage returns an error', error: error});
            callback(new _this.httpExceptions.InvalidParameterException('FIND_MESSAGES_ERROR','error'));
        } else {
            var apiResult = {status: 200, data: result};
            _this.logger.info('%j', { function: 'DEBUG-INFO: Message.GetMessages step-2 doFindMessage returns right'});
            callback(null, apiResult);
        }
    })
}


var CheckWhetherHasNewMessages = function(reqParams, callback) {
    var _this = exports;
    var selector = { };
    var options = {fields: {target_type: 0, users: 0, v: 0, status: 0}, sort: {update_time: -1}};
    var helper = { collectionName: _this.enums.CollectionName.MESSAGE };
    _this.logger.info('%j', { function: 'DEBUG-INFO: Message.CheckWhetherHasNewMessages received arguments:',
        reqParams: reqParams
    });

    selector.$or = [{target_type: _this.enums.TargetStatus.ALL}, {'users.user_id': reqParams.user_id}];
    if(reqParams.date_from) {
        selector.create_time = {$gt:_this.dataGenerationHelper.getValidUTCDate(reqParams.date_from)};
    }

    selector.status = true;

    //_this.orderManager.pagingFunction(options, reqParams.from, reqParams.page_size);

    _this.restaurantDataAPI.count(selector, options, helper, function(error, result) {
        if(error) {
            _this.logger.error('%j', { function: 'DEBUG-ERROR: Message.GetMessages step-1 doFindMessage returns an error', error: error});
            callback(new _this.httpExceptions.InvalidParameterException('FIND_MESSAGES_ERROR','error'));
        } else {
            var return_data = false;
            if(result>0){
                return_data = true
            }
            var apiResult = {status: 200, data: {has_new_messages:return_data,num:result}};
            _this.logger.info('%j', { function: 'DEBUG-INFO: Message.GetMessages step-2 doFindMessage returns right'});
            callback(null, apiResult);
        }
    })
}

/**
 * Mark messages read.
 *
 * @param reqParams
 * @param callback
 * @constructor
 */
var MarkMessagesRead = function(reqParams, callback) {
    var _this = exports;
    var selector = {};
    var options = {};
    var helper = { collectionName: _this.enums.CollectionName.MESSAGE_READ_HISTORY };
    _this.logger.info('%j', { function: 'DEBUG-INFO: Message.MarkMessagesRead received arguments:',
        reqParams: reqParams
    });

    async.waterfall([
        function(nextstep) {
            var criteria = { user_id: reqParams.user_id };
            var options = {fields: {_id: 0, message_id: 1}};
            _this.restaurantDataAPI.find(criteria, options, helper, function(error, result) {
                if(error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Message.MarkMessagesRead step-1 doFindMarkedMessages returns an error', error: error});
                    callback(new _this.httpExceptions.InvalidParameterException('MARK_MESSAGE_READ_ERROR','error'));
                } else {
                    var messages = [];
                    if(result && Array.isArray(result) && result.length > 0) {
                        for(var i in result) {
                            messages.push(result[i].message_id);
                        }
                    }
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Message.MarkMessagesRead step-1 doFindMarkedMessages returns right'});
                    nextstep(null, messages);
                }
            });
        },
        function(messages, nextstep) {
            selector.$or = [{target_type: _this.enums.TargetStatus.ALL}, {'users.user_id': reqParams.user_id}];
            if(messages.length > 0) {
                selector._id = {$nin: messages};
            }
            var options = {fields: {_id: 1}};
            var helper = { collectionName: _this.enums.CollectionName.MESSAGE };
            _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
                if(error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Message.MarkMessagesRead step-2 doFindUnreadMessages returns an error', error: error});
                    callback(new _this.httpExceptions.InvalidParameterException('MARK_MESSAGE_READ_ERROR','error'));
                } else {
                    var unreadMessages = [];
                    if(result && Array.isArray(result) && result.length > 0) {
                        for(var i in result) {
                            unreadMessages.push(result[i]._id);
                        }
                    }
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Message.MarkMessagesRead step-2 doFindUnreadMessages returns right'});
                    nextstep(null, unreadMessages);
                }
            });
        },
        function(unreadMessages, nextstep) {
            var messageReadHistory = [];
            if(unreadMessages.length > 0) {
                for(var j in unreadMessages) {
                    var messageReadHistoryItem = {};
                    messageReadHistoryItem._id = _this.dataGenerationHelper.generateUUID();
                    messageReadHistoryItem.user_id = reqParams.user_id;
                    messageReadHistoryItem.message_id = unreadMessages[j];
                    messageReadHistoryItem.is_read = true;
                    messageReadHistory.push(messageReadHistoryItem);
                }
            }
            if(messageReadHistory.length > 0) {
                _this.restaurantDataAPI.bulkInsert(messageReadHistory, options, helper, function(error, result) {
                    if(error) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Message.MarkMessagesRead step-3 doAddReadMessages returns an error', error: error});
                        callback(new _this.httpExceptions.InvalidParameterException('Add_READ_MESSAGE_ERROR','error'));
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Message.MarkMessagesRead step-3 doAddReadMessages returns right'});
                        var apiResult = {status: 204};
                        callback(null, apiResult);
                    }
                });
            } else {
                nextstep();
                var apiResult = {status: 204};
                _this.logger.info('%j', { function: 'DEBUG-INFO: Message.MarkMessagesRead skip step-3 doAddReadMessages'});
                callback(null, apiResult);
            }
        }
    ], function(error, result) {
        callback(error, result);
    });

}


/**
 * Fetch Promotions (FBE-2665)
 *
 * @param reqParams
 * @param callback
 * @constructor
 */
var GetPromotions = function(reqParams, callback) {
    var _this = exports;
    var selector = { };
    var options = {fields: {name: 1, description: 1, enable: 1, category: 1, code: 1, start_time: 1, end_time: 1, promotion_page: 1}, sort: {create_time: -1}};
    var helper = { collectionName: _this.enums.CollectionName.PROMOTIONS };
    _this.logger.info('%j', { function: 'DEBUG-INFO: Message.GetPromotions received arguments:',
        reqParams: reqParams
    });

    selector.status = {$ne: _this.enums.PromotionStatus.DELETED};
    if(!reqParams.isIncludeAll) {
        selector.enable = true;
    }

    if(reqParams.category && _this.enums.PromotionCategory.hasOwnProperty(reqParams.category)) {
        selector.category = reqParams.category;
    }

    _this.orderManager.pagingFunction(options, reqParams.from, reqParams.page_size);


    _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
        if(error) {
            _this.logger.error('%j', { function: 'DEBUG-ERROR: Message.GetPromotions step-1 doFindPromotions returns an error', error: error});
            callback(new _this.httpExceptions.InvalidParameterException('FIND_PROMOTIONS_ERROR','error'));
        } else {
            if(result && Array.isArray(result) && result.length > 0) {
                for(var i in result) {
                    var promotion = result[i];
                    if(promotion.promotion_page && promotion.promotion_page.image && promotion.promotion_page.image.activity_center) {
                        promotion.promotion_page.image = promotion.promotion_page.image.activity_center;
                    } else {
                        promotion.promotion_page.image = promotion.promotion_page.image.home;
                    }

                    if (!promotion.code) {
                        var key = promotion.name + '-' + promotion.description + '-' + promotion.category;
                        promotion.code = crypto.createHash('md5').update(key, 'utf8').digest('hex');
                    }
                }
            }
            var apiResult = {status: 200, data: result};
            _this.logger.info('%j', { function: 'DEBUG-INFO: Message.GetPromotions step-2 doFindPromotions returns right'});
            callback(null, apiResult);
        }
    })


}


/**
 * Create promotion (FBE-2669)
 *
 * @param promotionBody
 * @param callback
 * @constructor
 */
var CreatePromotion = function(promotionBody, callback) {
    var _this = exports;
    var options = {};
    var helper = { collectionName: _this.enums.CollectionName.PROMOTIONS };
    _this.logger.info('%j', { function: 'DEBUG-INFO: Message.CreatePromotion received arguments:',
        promotionBody: promotionBody
    });
    promotionBody._id = _this.dataGenerationHelper.generateUUID();
    promotionBody.enable = false;
    promotionBody.status = _this.enums.PromotionStatus.CREATED;

    var key = promotionBody.name + '-' + promotionBody.description + '-' + promotionBody.category;
    promotionBody.code = crypto.createHash('md5').update(key, 'utf8').digest('hex');

    _this.restaurantDataAPI.create(promotionBody, options, helper,function(error, result){
        if(error){
            _this.logger.error('%j', { function: 'DEBUG-ERROR: Message.CreatePromotion doCreatePromotion returns an error', error: error});
            callback(new _this.httpExceptions.InvalidParameterException('CREATE_PROMOTION_ERROR','error'));
        }else{
            var apiResult = {status: 201, data: { 'id': promotionBody._id}};
            _this.logger.info('%j', { function: 'DEBUG-INFO: Message.CreatePromotion doCreatePromotion returns right'});
            callback(null, apiResult);
        }
    });
}


var GetUserPromotionResult = function (reqParams, callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Message.GetPromotions step-2 doFindPromotions received arguments', reqParams: reqParams});

    var userId = reqParams.userId;
    var orderId = reqParams.orderId;

    var apiResult = {}, order;

    var rewardCode = '';
    var allPromotionIds = [];
    var rewardPromotionIds = [];

    async.series([
        // step-1: doFindOrder
        function (nextstep) {

            if (orderId !== null && orderId !== undefined) {
                _this.logger.info('%j', { function:'DEBUG-INFO: Message.GetUserPromotionResult step-1 doFindOrder received arguments', orderId: orderId});

                var selector = {_id: orderId};
                var options = {};
                var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};

                _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function:'DEBUG-ERROR: Message.GetUserPromotionResult step-1 doFindOrder returns error', orderId: orderId});
                        nextstep(new _this.httpExceptions.DataConflictedException('find dining-orders', 'error'));
                    } else if (result === null || result === undefined || result === '' || result.length === 0) {
                        _this.logger.error('%j', { function:'DEBUG-ERROR: Message.GetUserPromotionResult step-1 doFindOrder returns empty', orderId: orderId});
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('orderId', orderId));
                    } else {
                        order = result[0];
                        var promotions = order.promotions;

                        if (promotions && promotions.length > 0) {
                            for (var i=0; i<promotions.length; i++) {
                                var promotion = promotions[i];

                                allPromotionIds.push(promotion.promotion_id);

                                if (promotion.is_reward === true) {
                                    rewardCode = promotion.reward_code;
                                    rewardPromotionIds.push(promotion.promotion_id);
                                }
                            }
                        }

                        _this.logger.info('%j', { function:'DEBUG-INFO: Message.GetUserPromotionResult step-1 doFindOrder returns right'});
                        nextstep();
                    }
                });
            } else {

                _this.logger.info('%j', { function:'DEBUG-INFO: Message.GetUserPromotionResult step-1 doFindOrder returns empty'});
                nextstep();
            }

        },
        // step-2: doFindRewards
        function (nextstep) {

            if (rewardCode !== '') {
                _this.logger.info('%j', { function:'DEBUG-INFO: Message.GetUserPromotionResult step-2 doFindRewards received arguments', reward_code: rewardCode});

                var selector = {reward_code: rewardCode};
                var options = {};
                var helper = {collectionName: _this.enums.CollectionName.REWARDS};

                _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function:'DEBUG-ERROR: Message.GetUserPromotionResult step-2 doFindRewards returns error', reward_code: rewardCode});
                        nextstep(new _this.httpExceptions.DataConflictedException('find rewards', 'error'));
                    } else if (result === null || result === undefined || result === '' || result.length === 0) {
                        _this.logger.info('%j', { function:'DEBUG-INFO: Order.CancelOrder step-2 doFindRewards returns empty', reward_code: rewardCode});
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('reward_code', reward_code));
                    } else {

                        _this.logger.info('%j', { function:'DEBUG-INFO: Order.CancelOrder step-2 doFindRewards returns right'});
                        nextstep();
                    }
                });

            } else {
                _this.logger.info('%j', { function:'DEBUG-INFO: Message.GetUserPromotionResult step-2 doFindRewards returns empty'});
                nextstep();
            }

        },
        // step-3: doFindPromotions
        function (nextstep) {
            if (rewardCode !== '') {
                _this.logger.info('%j', { function:'DEBUG-INFO: Message.GetUserPromotionResult step-3 doFindPromotions received arguments'});

                var selector = {_id: {$in: rewardPromotionIds}};
                var options = {};
                var helper = {collectionName: _this.enums.CollectionName.PROMOTIONS};

                _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function:'DEBUG-ERROR: Message.GetUserPromotionResult step-3 doFindPromotions returns error', error: error});
                        nextstep(new _this.httpExceptions.DataConflictedException('find promotions', 'error'));
                    } else if (result === null || result === undefined || result === '' || result.length === 0) {
                        _this.logger.info('%j', { function:'DEBUG-INFO: Message.GetUserPromotionResult step-3 doFindPromotions returns empty'});
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('promotion', rewardPromotionIds));
                    } else {
                        var motions = result;

                        var shareContents = [];

                        for (var i=0; i<motions.length; i++) {
                            var images = motions[i].share_content.success.images;
                            var contents = motions[i].share_content.success.contents;
                            var url = motions[i].share_content.success.url;

                            var shareContent = {
                                image: images[getRandomInt(images.length)],
                                content: contents[getRandomInt(images.length)],
                                url: url
                            }
                            // FBE-2803
                            if(shareContent.content) {
                                shareContent.content = shareContent.content.replace('{restaurant_name}', order.restaurant.restaurant_name);
                            }
                            shareContents.push(shareContent);
                        }

                        apiResult = {
                            status: 200,
                            data: {
                                winning: true,
                                reward_code: rewardCode,
                                share_contents: shareContents
                            }
                        };

                        _this.logger.info('%j', { function:'DEBUG-INFO: Message.GetUserPromotionResult step-3 doFindPromotionss returns right'});
                        nextstep();
                    }
                });
            } else {

                if (allPromotionIds.length > 0) {
                    _this.logger.info('%j', { function:'DEBUG-INFO: Message.GetUserPromotionResult step-3 doFindPromotions received arguments'});

                    var selector = {_id: {$in: allPromotionIds}};
                    var options = {};
                    var helper = {collectionName: _this.enums.CollectionName.PROMOTIONS};

                    _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                        if (error) {
                            _this.logger.error('%j', { function:'DEBUG-ERROR: Message.GetUserPromotionResult step-3 doFindPromotions returns error', error: error});
                            nextstep(new _this.httpExceptions.DataConflictedException('find promotions', 'error'));
                        } else if (result === null || result === undefined || result === '' || result.length === 0) {
                            _this.logger.info('%j', { function:'DEBUG-INFO: Message.GetUserPromotionResult step-3 doFindPromotions returns empty'});
                            nextstep(new _this.httpExceptions.ResourceNotFoundException('promotion', allPromotionIds));
                        } else {
                            var motions = result;

                            var shareContents = [];

                            for (var i=0; i<motions.length; i++) {
                                var images = motions[i].share_content.failure.images;
                                var contents = motions[i].share_content.failure.contents;
                                var url = motions[i].share_content.failure.url;

                                var shareContent = {
                                    image: images[getRandomInt(images.length)],
                                    content: contents[getRandomInt(images.length)],
                                    url: url
                                }

                                shareContents.push(shareContent);
                            }

                            apiResult = {
                                status: 200,
                                data: {
                                    winning: false,
                                    share_contents: shareContents
                                }
                            };

                            _this.logger.info('%j', { function:'DEBUG-INFO: Message.GetUserPromotionResult step-3 doFindPromotions returns right'});
                            nextstep();
                        }
                    });
                } else {
                    _this.logger.error('%j', { function:'DEBUG-ERROR: Message.GetUserPromotionResult step-3 doFindPromotions returns error'});
                    nextstep(new _this.httpExceptions.DataConflictedException('no rewards', 'error'));

                }
            }
        }
    ], function (error) {
        if (error) {
            _this.logger.error('%j', { function: 'DEBUG-ERROR: Message.GetUserPromotionResult step-(error) callback', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Message.GetUserPromotionResult step-(right) callback'});
        }

        callback(error, apiResult);
    });
}


var getRandomInt = function (value) {
    return Math.floor(Math.random()*value);
}


var getUserIdsByCity = function(city,headerToken,callback){
    var _this = exports;

    var postData = {};
    postData.host = _this.config.other_servers.oauth.server_url;
    postData.port = _this.config.other_servers.oauth.server_port;
    postData.path = '/v1/city/{city}/user_ids'.replace('{city}', encodeURI(city));


    postData.method = 'GET';
    _this.orderManager.sendToOauthServer(postData, headerToken, null, function (error, result) {
        if (error) {
            _this.logger.error('%j', {
                function: 'DEBUG-ERROR: Message.getUserIdsByCity returns an error',
                error: error
            });
            callback(error)
        } else {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Message.getUserIdsByCity returns right',result:result});
            var userIds = result;
            if(!(Array.isArray(userIds) && userIds.length > 0) ){
                callback(new _this.httpExceptions.CommonHttpErrorException('CITY_HAS_NO_USERS','there is no users in the city',city) )
            }else{
                callback(null,userIds)
            }

        }
    });

}


module.exports = function init(app, config, mongoConfig, logger) {
    var _this = exports;
    //-- NOTE to Developers: For READABILITY purpose, PLEASE help maintain a double-spacing between two Functions declarations.//-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
    //-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions (below) in alphabetical order
    //-- NOTE to Developers (2015-05-13): 3) For READABILITY, please help to maintain double-spaces between functions declarations (above)
    _this.app = app;
    _this.config = config;
    _this.logger = logger;
    _this.mongoConfig = mongoConfig;
    _this.restaurantDataAPI = require(_this.app.dbApiPath)(_this.config, _this.mongoConfig, _this.logger);
    _this.orderManager = require('./services/order-manager')(_this.app, config, mongoConfig, logger);
    _this.orderCalculate = require('./services/order-calculate')(_this.app, config, mongoConfig, logger);
    _this.backendHelpers = require(_this.app.utilsPath)(_this.config, _this.mongoConfig, _this.logger);
    _this.Schema = _this.backendHelpers.Schemas;
    _this.enums = _this.backendHelpers.enums;
    _this.httpExceptions =_this.backendHelpers.httpExceptions;
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();

    _this.createMessage = CreateMessage;
    _this.getMessages = GetMessages;
    _this.checkWhetherHasNewMessages = CheckWhetherHasNewMessages;
    _this.markMessagesRead = MarkMessagesRead;
    _this.getPromotions = GetPromotions;
    _this.createPromotion = CreatePromotion;
    _this.getUserPromotionResult = GetUserPromotionResult;

    return _this;
};
