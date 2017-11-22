
/**
 * Created by webber.wang on 2016-4-26.
 */
'use strict';


var CreateMessage =  function(req,res){
    var _this = exports;
    var messageBody = req.body;
    var headerToken =  req.headers.authorization
    messageBody._id = _this.dataGenerationHelper.generateUUID();
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Message-Controller.CreateMessage',
        messageBody: messageBody
    });
    var createMessage = function(){
        var messageSchema = [_this.Schema.MessageSaveSchema,_this.Schema.messageItemInfo,_this.Schema.userInfo];
        if(_this.validateRequestBody(messageBody,messageSchema ,res)){
            _this.messageAPI.createMessage(messageBody, headerToken,function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }
    }
    if(_this.otherServers.oauth.TOKEN_OFF) {
        createMessage();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                createMessage();
            }
        });
    }
};


/**
 * Get messages (FBE-2666)
 *
 * @param req
 * @param res
 * @constructor
 */
var GetMessages = function(req, res) {
    var _this = exports;
    var reqParams = {
        user_id: req.query.user_id,
        from: req.query.from,
        page_size: req.query.page_size,
        isIncludeAll: (req.query.isIncludeAll && req.query.isIncludeAll.toLowerCase() === 'true') ? true : false
    };

    var fetchMessages = function() {
        _this.messageAPI.getMessages(reqParams, function(error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        })
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        fetchMessages();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                fetchMessages();
            }
        });
    }
}

var CheckWhetherHasNewMessages = function(req, res) {
    var _this = exports;
    var reqParams = {
        user_id: req.params.user_id,
        date_from: req.query.date_from
    };

    var checkMessages = function() {
        _this.messageAPI.checkWhetherHasNewMessages(reqParams, function(error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        })
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        checkMessages();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                checkMessages();
            }
        });
    }
}


/**
 * Marked the messages read
 *
 * @param req
 * @param res
 * @constructor
 */
var MarkMessagesRead = function(req, res) {
    var _this = exports;
    var reqParams = {
        user_id: req.params.user_id
    };

    var updateMessageRead = function() {
        _this.messageAPI.markMessagesRead(reqParams, function(error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        })
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        updateMessageRead();
    } else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                updateMessageRead();
            }
        });
    }
}


/**
 * Get promotions (FBE-2665)
 *
 * @param req
 * @param res
 * @constructor
 */
var GetPromotions = function(req, res) {
    var _this = exports;
    var reqParams = {
        category: req.query.category,
        from: req.query.from,
        page_size: req.query.page_size,
        isIncludeAll: (req.query.isIncludeAll && req.query.isIncludeAll.toLowerCase() === 'true') ? true : false
    };

    var fetchPromotions = function() {
        _this.messageAPI.getPromotions(reqParams, function(error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        })
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        fetchPromotions();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                fetchPromotions();
            }
        });
    }
}


/**
 * Create promotion (FBE-2669)
 *
 * @param req
 * @param res
 * @constructor
 */
var CreatePromotion = function(req, res) {
    var _this = exports;
    var promotionBody = req.body;
    var buildPromotion = function(){
        var promotionSchema = [_this.Schema.PromotionSaveSchema,_this.Schema.PromotionPageSchema,
            _this.Schema.PromotionShareContent, _this.Schema.PromotionImage,
            _this.Schema.ShareContent, _this.Schema.MessageItem];
        if(_this.validateRequestBody(promotionBody, promotionSchema, res)) {
            _this.messageAPI.createPromotion(promotionBody, function (error, result) {
                if (error) {
                    error.res = res;
                    _this.logger.error(error);
                }
                _this.responseUtilsAPI.processResponse(error, result, res);
            });
        }
    }
    if(_this.otherServers.oauth.TOKEN_OFF) {
        buildPromotion();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                buildPromotion();
            }
        });
    }
}


var GetUserPromotionResult = function (req, res) {
    var _this = exports;

    var reqParams = {
        userId: req.params.user_id,
        orderId: req.query.order_id
    };

    var getUserPromotionResult = function() {
        _this.messageAPI.getUserPromotionResult(reqParams, function(error, result) {
            if (error) {
                error.res = res;
                _this.logger.error(error);
            }
            _this.responseUtilsAPI.processResponse(error, result, res);
        })
    }

    if(_this.otherServers.oauth.TOKEN_OFF) {
        getUserPromotionResult();
    }else {
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(result) {
                getUserPromotionResult();
            }
        });
    }
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
    _this.messageAPI = orderAPI.message;
    _this.httpHelper = _this.backendHelpers.httpHelper();
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.loggerName = 'order';
    _this.logger = _this.app.log4jsHelper.initialize(_this.loggerName);


    _this.oauthUtils = _this.backendHelpers.oauthUtils;
    _this.Schema = _this.backendHelpers.Schemas;
    _this.validators = _this.backendHelpers.SchemaValidator;
    _this.validateRequestBody = _this.validators.validateRequestBody;    //-- Helpers, Schemas, and Validators
    _this.responseUtilsAPI = _this.backendHelpers.responseUtilsAPI;
    _this.logger.info('message-controller: initialized');

    _this.createMessage = CreateMessage;
    _this.getMessages = GetMessages;
    _this.markMessagesRead = MarkMessagesRead;
    _this.getPromotions  = GetPromotions;
    _this.getUserPromotionResult = GetUserPromotionResult;
    _this.createPromotion = CreatePromotion;

    _this.checkWhetherHasNewMessages = CheckWhetherHasNewMessages;


    return _this;
};
