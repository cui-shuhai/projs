/**
 * Created by webber.wang on 2014-11-10.
 */
'use strict';

var async = require('async');
var pg = require('pg');
var Transaction = require('pg-transaction');

function Points(restaurantId,userId,orderId,from){
    this.restaurantId = restaurantId;
    this.userId = userId;
    this.orderId = orderId;
    this.from = from;
}

Points.prototype.getUserPoints = function(callback){
    var _this = exports;
    _this.logger.info('%j', {function: 'DEBUG-INFO: restaurant-user-points.getPoints: query the user points in the restaurant',
        restaurantId: this.restaurantId , userId:this.userId});
    var selector = {user_id:this.userId,restaurant_id:this.restaurantId};
    var options = {fields :{points:1}};
    var helper = {collectionName:  _this.enums.CollectionName.RESTAURANT_USER_POINTS};
    var points_result={};
    _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
        if (error) {
            _this.logger.error('%j',{ function:'DEBUG-INFO: restaurant-user-points.getPoints: query the user points in the restaurant:has error',
                error: error});
            points_result={points:0,has_record:false};
        } else if (result === null || result === '' || result.length ===0) {
            _this.logger.info('DEBUG-INFO: restaurant-user-points.getPoints: query the user points in the restaurant:has no result');
            points_result={points:0,has_record:false};
        } else {
            _this.logger.info('DEBUG-INFO: restaurant-user-points.getPoints: query the user points in the restaurant:has result');
            points_result={points:result[0].points,has_record:true,id:result[0]._id};
        }
        callback(points_result);
    });
};

Points.prototype.createPoints = function(points,callback){
    var _this = exports;
    var self = this;
    _this.logger.info('%j', {function: 'DEBUG-INFO: restaurant-user-points.createPoints:',
        restaurantId: this.restaurantId , userId:this.userId,points:points});
    var pointsBody = {
        _id : _this.dataGenerationHelper.generateUUID(),
        user_id:self.userId,
        restaurant_id:self.restaurantId,
        points:points
    };
    var document = pointsBody;
    var options = {};
    var helper = {collectionName: _this.enums.CollectionName.RESTAURANT_USER_POINTS};

    _this.restaurantDataAPI.create(document, options, helper, function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-INFO: restaurant-user-points.createPoints: returns error', error: error});
           callback(error)
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: restaurant-user-points.createPoints: returns right==add history'});
            var history = {
                user_id:self.userId,
                restaurant_id:self.restaurantId,
                order_id:self.orderId,
                change_points:points,
                points:points,
                reason:'from online paid order'
            };
            self.savePointsHistroy(history);
            callback(null,{id:pointsBody._id});
        }
    });
};

Points.prototype.updatePoints = function(pointsId,changePoints,totalPoints,callback){
    var _this = exports;
    var self = this;
    _this.logger.info('%j', {function: 'DEBUG-INFO: restaurant-user-points.createPoints:',
        restaurantId: this.restaurantId , userId:this.userId,changePoints:changePoints,totalPoints:totalPoints,pointsId:pointsId});
    var nowTime = _this.dataGenerationHelper.getValidUTCDate();

    var criteria = {_id: pointsId};
    var document = {$inc: {points: changePoints}};
    var options = {};
    var helper = {collectionName: _this.enums.CollectionName.RESTAURANT_USER_POINTS};

    _this.restaurantDataAPI.update(criteria, document, options, helper, function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-INFO: restaurant-user-points.updatePoints: returns error', error: error});
            callback(error);
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: restaurant-user-points.updatePoints: returns right==add history'});
            var history = {
                user_id:self.userId,
                restaurant_id:self.restaurantId,
                order_id:self.orderId,
                change_points:changePoints,
                points:totalPoints,
                reason:'redeem to blue dollar '
            };
            if(changePoints > 0){
                history.reason = 'from online paid order';
            }
            self.savePointsHistroy(history);
            callback(null,'update success');
        }
    });

};

Points.prototype.savePointsHistroy = function(historyBody){
    var _this = exports;
    var self = this;
    _this.logger.info('%j', {function: 'DEBUG-INFO: restaurant-user-points.createPoints:',
        historyBody: historyBody});
    historyBody._id= _this.dataGenerationHelper.generateUUID();
    var document = historyBody;
    var options = {};
    var helper = {collectionName: _this.enums.CollectionName.RESTAURANT_USER_POINTS_HISTORY};

    _this.restaurantDataAPI.create(document, options, helper, function (error) {
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-INFO: restaurant-user-points.savePointsHistroy: returns error', error: error});
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: restaurant-user-points.savePointsHistroy: returns right'});
        }
    });
};

Points.prototype.getBlueDollars = function(callback) {
    var _this = exports;
    var self = this;
    _this.logger.info('%j', {function: 'DEBUG-INFO: restaurant-user-points.getBlueDollars:',
        from: self.from});
    if(self.from === null){
        return {blue_dollar:0};
    }

    _this.getSpecifiedBlueDollars(self.from,self.restaurantId,function(error,result){
        if(error){
            _this.logger.info('%j', {function: 'DEBUG-INFO: restaurant-user-points.getBlueDollars: has error',error:error});
            callback({blue_dollar:0});
        }else{
            _this.logger.info('%j', {function: 'DEBUG-INFO: restaurant-user-points.getBlueDollars: has result',result:result});
            callback( {blue_dollar:result.amount});
        }
    })
};

Points.prototype.grantBlueDollar = function(amount){
    var _this = exports;
    var self = this;

    _this.grantSpecifiedBlueDollars(self.userId,self.from,self.restaurantId,amount,self.orderId,function(error,result){
       if(error){
           _this.logger.error('%j', {function: 'DEBUG-ERROR: restaurant-user-points.grantBlueDollar: has error',
               error: error});
       }else{
           _this.logger.info('%j', {function: 'DEBUG-INFO: restaurant-user-points.grantBlueDollar: has result',
               result: result});
       }
    });
};

Points.prototype.grantDeductBlueDollarToFandine = function(amount){
    var _this = exports;
    var self = this;
    var fandineId = 'fandine';
    var code =_this.enums.DollarSourceCode.BD110;
    _this.grantDeductBlueDollars(fandineId,self.restaurantId,amount,self.orderId,code,function(error,result){
        if(error){
            _this.logger.error('%j', {function: 'DEBUG-ERROR: restaurant-user-points.grantDeductBlueDollarToFandine: has error',
                error: error});
        }else{
            _this.logger.info('%j', {function: 'DEBUG-INFO: restaurant-user-points.grantDeductBlueDollarToFandine: has result',
                result: result});
        }
    });
};

var GrantSpecifiedBlueDollars = function(userId,from,restaurantId,amount,orderId,callback) {
    var _this = exports;
    var changeAmount = Number(amount.toFixed(2).replace(".",""));
    _this.logger.info('%j', { function: 'DEBUG-INFO:restaurant-user-points.GrantSpecifiedBlueDollars received arguments',
        userId:userId,from: from,restaurantId:restaurantId,amount:amount,changeAmount:changeAmount});
    _this.logger.info('%j', { function: 'DEBUG-INFO:  restaurant-user-points.GrantSpecifiedBlueDollars config files',
        connection_string: _this.config.other_servers.postgre_sql.connection_string });
    var client = new pg.Client(_this.config.other_servers.postgre_sql.connection_string) ;
    var tx = new Transaction(client);
    if(from !=='fandine'){
        from = 'd-'+from;
    }
    var apiResult;

    async.series([
        function(nextstep){
            client.connect(function(error) {
                if(error) {
                    nextstep(error);
                }else {
                    nextstep();
                }
            })
        },
        function(nextstep){
            tx.begin(function(error) {
                if(error) {
                    nextstep(error);
                }else {
                    nextstep();
                }
            })
        },
        function(nextstep){

            var functionName='grant_blue_dollor';
            var argArray=[
                {type:'VARCHAR',value:'u-' + userId},
                {type:'VARCHAR',value:'d-' + restaurantId},
                {type:'INTEGER',value:changeAmount},
                {type:'INTEGER',value:1},
                {type:'VARCHAR',value:orderId},
                {type:'VARCHAR',value:_this.enums.DollarSourceCode.BD104}       // Order Reward Credit
            ];
            var amount = argArray[2].value;
            _this.logger.info('%j', {info: 'DEBUG-INFO: restaurant-user-points.GrantSpecifiedBlueDollars call function before', amount: amount});
            if(amount>0){
                _this.restaurantDataAPI_PG.executeFunction(client,functionName,argArray,function(error,result){
                    if(error){
                        nextstep(error);
                    }else{
                        _this.logger.info('%j', {info: 'DEBUG-INFO: restaurant-user-points.GrantSpecifiedBlueDollars success', result: result});
                        apiResult = { data:{row:'grant blue dollar success'}};
                        nextstep();
                    }
                });
            }else{
                apiResult = { data:{row:0}};
                nextstep();
            }
        },
        function(nextstep){

            var functionName='consume_blue_dollar_self';
            var argArray=[
                {type:'VARCHAR',value:from},
                {type:'VARCHAR',value:'d-'+restaurantId},
                {type:'INTEGER',value:changeAmount},
                {type:'VARCHAR',value:orderId},
                {type:'VARCHAR',value:_this.enums.DollarSourceCode.BD004}       // Consume the blue dollar about the source of Order Reward Credit, usually the user is fandine or restaurant.
            ];
            _this.restaurantDataAPI_PG.executeFunction(client,functionName,argArray,function(error,result){
                if(error){
                    _this.logger.error('%j', {function:'DEBUG-ERROR: restaurant-user-points.DeductBlueDollars execute function returns error',
                        error: error
                    });
                    nextstep(error);
                }else{
                    _this.logger.info('%j', {function:'DEBUG-INFO: restaurant-user-points.DeductBlueDollars',
                        rows: result.rows
                    });
                    apiResult = { status : 'success'};
                    nextstep();
                }
            });

        },
        function(nextstep){
            tx.commit(function(error) {
                if(error) {
                    nextstep(error);
                }else {
                    client.end();
                    nextstep();
                }
            });
        }
    ],function(error) {
        if(error){
            tx.rollback(function(error) {
                client.end();
            })
        }
        callback(error, apiResult);
    });
};

var GrantDeductBlueDollars = function(userId,restaurantId,amount,orderId,code,callback) {
    var _this = exports;
    var changeAmount = Number(amount.toFixed(2).replace(".",""));
    _this.logger.info('%j', { function: 'DEBUG-INFO:restaurant-user-points.GrantDeductBlueDollars received arguments',
        userId:userId,restaurantId:restaurantId,amount:amount,changeAmount:changeAmount});
    _this.logger.info('%j', { function: 'DEBUG-INFO:  restaurant-user-points.GrantDeductBlueDollars config files',
        connection_string: _this.config.other_servers.postgre_sql.connection_string });
    var client = new pg.Client(_this.config.other_servers.postgre_sql.connection_string) ;
    var tx = new Transaction(client);
    if(restaurantId !=='fandine'){
        restaurantId = 'd-'+restaurantId;
    }
    
    if(userId !=='fandine'){
        userId = 'u-'+userId;
    }
    var apiResult;

    async.series([
        function(nextstep){
            client.connect(function(error) {
                if(error) {
                    nextstep(error);
                }else {
                    nextstep();
                }
            })
        },
        function(nextstep){
            tx.begin(function(error) {
                if(error) {
                    nextstep(error);
                }else {
                    nextstep();
                }
            })
        },
        function(nextstep){

            var functionName='grant_blue_dollor';
            var argArray=[
                {type:'VARCHAR',value:userId},
                {type:'VARCHAR',value:restaurantId},
                {type:'INTEGER',value:changeAmount},
                {type:'INTEGER',value:1},
                {type:'VARCHAR',value:orderId},
                {type:'VARCHAR',value:code}       // Order Reward Credit
            ];
            var amount = argArray[2].value;
            _this.logger.info('%j', {info: 'DEBUG-INFO: restaurant-user-points.GrantDeductBlueDollars call function before', amount: amount});
            if(amount>0){
                _this.restaurantDataAPI_PG.executeFunction(client,functionName,argArray,function(error,result){
                    if(error){
                        nextstep(error);
                    }else{
                        _this.logger.info('%j', {info: 'DEBUG-INFO: restaurant-user-points.GrantDeductBlueDollars success', result: result});
                        apiResult = { data:{row:'grant blue dollar success'}};
                        nextstep();
                    }
                });
            }else{
                apiResult = { data:{row:0}};
                nextstep();
            }
        },
        function(nextstep){
            tx.commit(function(error) {
                if(error) {
                    nextstep(error);
                }else {
                    client.end();
                    nextstep();
                }
            });
        }
    ],function(error) {
        if(error){
            tx.rollback(function(error) {
                client.end();
            })
        }
        callback(error, apiResult);
    });
};

var GetSpecifiedBlueDollars = function(userId,restaurantId,callback) {
    var _this = exports;

    _this.logger.info('%j', { function: 'DEBUG-INFO:restaurant-user-points.GetSpecifiedBlueDollars received arguments',
        userId: userId,restaurantId:restaurantId});
    _this.logger.info('%j', { function: 'DEBUG-INFO:  restaurant-user-points.GetSpecifiedBlueDollars config files',
        connection_string: _this.config.other_servers.postgre_sql.connection_string });
    var client = new pg.Client(_this.config.other_servers.postgre_sql.connection_string) ;
    var tx = new Transaction(client);
    var orderId;
    var apiResult;

    async.series([
        function(nextstep){
            client.connect(function(error) {
                if(error) {
                    nextstep(error);
                }else {
                    nextstep();
                }
            })
        },
        function(nextstep){
            var rest = 'd-'+restaurantId;
            var fromWho = 'fandine';
            if(userId !=='fandine'){
                fromWho = 'd-'+restaurantId;
            }
            var queryString = 'SELECT sum(balance_amount - locked_amount) remain_amount  from t_user_bluedollar_balance WHERE user_id = $1 and restaurant_id= $2';

            var argArray=[fromWho,'d-'+restaurantId];

            _this.restaurantDataAPI_PG.find(client,queryString,argArray,function(error,result){
                if(error){
                    nextstep(error);
                }else{

                    var restaurantDollars = result.rows;

                    if(restaurantDollars.length >0){
                        var remain_amount = 0 ;
                        if(restaurantDollars[0].remain_amount===null ||restaurantDollars[0].remain_amount===undefined ){
                            remain_amount = 0;
                        }else{
                            remain_amount = restaurantDollars[0].remain_amount;
                        }
                        remain_amount = parseFloat((remain_amount/100).toFixed(2),10)
                        apiResult = {amount:remain_amount};

                        _this.logger.info('%j', { function: 'DEBUG-INFO: DEBUG-INFO:  restaurant-user-points.GetSpecifiedBlueDollars query result',
                            remain_amount: remain_amount});
                    }else{
                        _this.logger.info('%j', { function: 'DEBUG-INFO: DEBUG-INFO:  restaurant-user-points.GetSpecifiedBlueDollars query result: no result'});
                        apiResult = {amount:0};

                    }
                    nextstep();
                }
            });
        }
    ],function(error) {
        client.end();
        callback(error, apiResult);
    });
};


module.exports = function init(app, config, mongoConfig, logger) {
    var _this = exports;

    _this.app = app;
    _this.config = config || {};
    _this.logger = logger || console;
    _this.mongoConfig = mongoConfig;
    _this.restaurantDataAPI = require(_this.app.dbApiPath)(_this.config, _this.mongoConfig, _this.logger);
    _this.backendHelpers = require(_this.app.utilsPath)(_this.config, _this.mongoConfig, _this.logger);
    _this.enums = _this.backendHelpers.enums;
    _this.httpExceptions =_this.backendHelpers.httpExceptions;
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.restaurantDataAPI_PG =_this.restaurantDataAPI.rewardPGAPI;

    _this.grantSpecifiedBlueDollars = GrantSpecifiedBlueDollars;
    _this.getSpecifiedBlueDollars = GetSpecifiedBlueDollars;
    _this.grantDeductBlueDollars = GrantDeductBlueDollars;
    _this.Points = Points;
    return _this;
};
