/**
 * Created by webber.wang on 2014-11-10.
 */
'use strict';

var http = require('http');
var async = require('async');
var pg = require('pg');
var Transaction = require('pg-transaction');

var ExecuteCloseOrder = function(order,headerToken,callback){
    var _this = exports;
    var schedule = {};
    var closeSchedule = {};
    var FMap = {
        grant_blue_dollar:_this.grantBlueDollars,
        consume_locked_blue_dollar: _this.consumeLockedBlueDollars,
        consume_gold_dollar: _this.consumeGoldDollars,
        grant_gold_dollar_to_server: _this.grantGoldDollarToServers,
        grant_for_up_comments:_this.grantBlueDollarForUpComments,
        rewards_credits :_this.rewardsCredits
    };
    var FNS = [];

    var nowTime = _this.dataGenerationHelper.getValidUTCDate();
    if (order.is_takeout === true) {
        order.picked_up_time = order.picked_up_time? order.picked_up_time : _this.dataGenerationHelper.getValidAfterMinuteUTCDate(nowTime, order.restaurant.picked_up_interval || 15);
    } else if (order.order_type === _this.enums.OrderType.DELIVERY) {
        order.picked_up_time = _this.dataGenerationHelper.getValidAfterMinuteUTCDate(nowTime, order.delivery_interval || 30);
    }

    async.series([
        //step-1 create print task
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-1'});
            if (order.is_takeout === true || order.order_type === _this.enums.OrderType.PREORDER|| order.order_type === _this.enums.OrderType.DELIVERY) {
                _this.createPrintTask(order._id, order, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-ERROR: Online-Close-Order.ExecuteCloseOrder step-1', error: error});
                    } else {
                        if (result.length === 0) {
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-1 returns empty'});
                        } else {
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-1 returns right'});
                        }
                    }
                })
            } else {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-1 returns empty'});
            }
            nextstep();
        },
        // step-2: doSendNotification
        function (nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-2 doSendNotification'});

            _this.sendNotification(order, headerToken, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-2 doSendNotification returns error', error: error});
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-2 doSendNotification returns right'});
                }
            });

            nextstep();
        },
        //step-1 init the execute functions
        function(nextstep){
            _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-1',
                schedule: order.close_schedule});
            if(order.close_schedule){
                schedule = order.close_schedule.schedule;
            }
            FNS = [];
            for(var key in schedule){
                if(schedule[key] === false){
                    FNS.push(FMap[key]);
                }
            }
            _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-1----finish step-1',
                FNS: FNS});
            nextstep()
        },
        //step-2 execute the close progress
        function(nextstep){
            _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-2 execute the close progress',
                FNS_length: FNS.length,FNS: FNS});
            var fns_length = FNS.length;
            if(fns_length > 0 ){
                runner(FNS, order, headerToken,function(result){
                    closeSchedule = result.close_schedule;
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-2 execute the close progress==result',
                        schedule_result: closeSchedule});
                    nextstep();
                });

            }else{
                _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-2 execute the close progress==no need to execute, skip=='
                });
                closeSchedule = order.close_schedule;
                nextstep();
            }
        },
        //step-3 update the close progress status
        function(nextstep){
            _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-3 update the order colse progress status',
                schedule_result: closeSchedule});
            var updateOrder = {};
            if(closeSchedule){
                closeSchedule.is_finished = true;
                for(var key in closeSchedule.schedule){
                    if(schedule[key] === false){
                        closeSchedule.is_finished = false;
                        break;
                    }
                }
                updateOrder.close_schedule = closeSchedule
            }

            if(order.status === _this.enums.OrderStatus.PAID){
                updateOrder.status = _this.enums.OrderStatus.CLOSED;
                updateOrder.close_time = nowTime;
                if (order.is_takeout || order.order_type === _this.enums.OrderType.DELIVERY) {
                    updateOrder.picked_up_time = order.picked_up_time;
                }
            }

            var document = { $set:updateOrder};
            var criteria = {_id:order._id};
            var options = {};
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                callerScript: 'File: online-close-order.js; Method: ExecuteCloseOrder()'
            };
            _this.restaurantDataAPI.update(criteria, document, options, helper, function (errors) {
                if (errors) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Online-Close-Order.ExecuteCloseOrder step-3 update the close progress status has error.',
                        errors: errors });
                    nextstep(errors);
                } else {

                    _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-3 update the close progress status return success.'});
                    nextstep();
                }
            });
        }/*,
         //step-4 send online close notification
         function (nextstep) {
         _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-4 send online close notification',
         status: order.status});
         if(order.status === _this.enums.OrderStatus.PAID){
         _this.sendNotification(order,headerToken,function(error,result){
         if(error){
         _this.logger.error('%j', { function: 'DEBUG-ERROR: Online-Close-Order.ExecuteCloseOrder step-4 send online close notification has errors.',
         errors: error });
         }else{
         _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.ExecuteCloseOrder step-4 send online close notification  return success.'});
         }
         });
         }
         nextstep();
         }*/
    ],function(error){
        callback(error,{is_finished:closeSchedule.is_finished});
    })
}

function runner (fns, order,headerToken, next) {
    var _this = exports;
    var last = fns.length - 1;

    (function run(pos) {
        fns[pos].call(fns[pos],order,headerToken, function (result) {
            order = result;
            _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.runner',
                pos:pos,
                last:last,
                close_schedule: order.close_schedule});
            if (pos === last) return next(order);
            run(++pos);
        });
    })(0);
}

var ConsumeLockedBlueDollars = function (order, headerToken, callback) {
    var _this = exports;
    var buyBlueDollarsAmount = 0,blueDollarsDueAfterFee = 0;
    var currencyCode,paymentFeeRate,sold_rate;
    async.series([
        //step-1 get the locked blue dollars
        function(nextstep){
            _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ConsumeLockedBlueDollars step-1 get the locked blue dollars',
                rewards: order.rewards, payment:order.payment});
            buyBlueDollarsAmount = order.rewards.blue_dollar_bought_total;
            paymentFeeRate = parseFloat(order.payment.online_transaction_charge_rate,10);
            sold_rate =  parseFloat(_this.config.other_servers.other_rates.ap_settlement_rate, 10);
            blueDollarsDueAfterFee =parseFloat(( buyBlueDollarsAmount * sold_rate * (1- paymentFeeRate)).toFixed(2),10);
            currencyCode = order.restaurant.currency || 'CNY';
            nextstep();
        },
        function(nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ConsumeLockedBlueDollars step-2',
                orderId: order._id, blueDollarsDueAfterFee: blueDollarsDueAfterFee, currencyCode: currencyCode});

            var postData = {};

            postData.host = _this.config.other_servers.reward.server_url;
            postData.port = _this.config.other_servers.reward.server_port;
            postData.path = '/v1/orders/{order_id}/lockBlueDollars'.replace('{order_id}',order._id );
            var body = { 'currency': currencyCode ,
                'blueDollarAmount': blueDollarsDueAfterFee};

            postData.method = 'POST';

            var reqParams = {
                order_id: order._id,
                headerToken: headerToken
            };

            var loggerInfos = {
                function : 'Online-Close-Order.ConsumeLockedBlueDollars step-2'
            };

            _this.orderManager.sendToReward(postData, headerToken, function (error, result) {
                if (error) {
                    if (error.fieldValue==='has no locked blue dollars') {
                        _this.logger.error('%j', {function: 'DEBUG-ERROR: Online-Close-Order.ConsumeLockedBlueDollars step-2 returns error',
                            error: 'has no locked blue dollars',consume_locked_blue_dollar:true});
                        order.close_schedule.schedule.consume_locked_blue_dollar = true;
                        nextstep();
                    } else {
                        _this.logger.error('%j', {function: 'DEBUG-ERROR: Online-Close-Order.ConsumeLockedBlueDollars step-2 returns error',
                            error: 'has error',consume_locked_blue_dollar:false});
                        order.close_schedule.schedule.consume_locked_blue_dollar = false;
                        nextstep();
                    }
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ConsumeLockedBlueDollars step-2 returns right',
                        consume_locked_blue_dollar:true,
                        result: JSON.stringify(result)});
                    order.close_schedule.schedule.consume_locked_blue_dollar = true;
                    nextstep();
                }
            }, body, reqParams, loggerInfos);
        }

    ],function(error) {
        if(error){
            order.close_schedule.schedule.consume_locked_blue_dollar = false;
        }
        callback(order);
    });
};

var ConsumeGoldDollars = function (order, headerToken, callback) {
    var _this = exports;

    var restaurantId,userId,currencyCode,goldDollars;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Online-Close-Order.ConsumeGoldDollars received arguments %j',
        rewards: order.rewards});

    async.series([
        function(nextstep){
            restaurantId = order.restaurant.restaurant_id;
            userId = order.user.user_id;
            currencyCode= order.restaurant.currency || 'CNY';
            goldDollars = order.rewards.gold_dollars;
            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Online-Close-Order.ConsumeGoldDollars step-1 %j',
                orderId: order._id, restaurantId: restaurantId, userId: userId, currencyCode: currencyCode, goldDollars: goldDollars });
            nextstep();
        },
        function(nextstep) {

            if (goldDollars > 0) {
                var postData = {};
                postData.host = _this.config.other_servers.reward.server_url;
                postData.port = _this.config.other_servers.reward.server_port;
                postData.path = '/v1/users/u-{user_id}/goldDollars'.replace('{user_id}',userId );
                var body = {
                    'currency': currencyCode,
                    'amount': -(goldDollars),
                    'restaurantId': restaurantId,
                    'orderId': orderId,
                    'code': _this.enums.DollarSourceCode.GD002      // use gold dollar in an order
                };

                postData.method = 'POST';

                var reqParams = {
                    userId: userId,
                    orderId: order._id,
                    headerToken: headerToken
                };

                var loggerInfos = {
                    function : 'Online-Close-Order.ConsumeGoldDollars step-1'
                };

                _this.orderManager.sendToReward(postData, headerToken, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', {function: 'DEBUG-ERROR: Online-Close-Order.ConsumeGoldDollars step-1 returns error',
                            error: 'has error',consume_gold_dollar:false});
                        order.close_schedule.schedule.consume_gold_dollar = false;
                        nextstep();
                    } else {
                        _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ConsumeGoldDollars step-1 returns right',
                            consume_gold_dollar:true,
                            result: JSON.stringify(result)});
                        order.close_schedule.schedule.consume_gold_dollar = true;
                        nextstep();
                    }
                }, body, reqParams, loggerInfos);
            } else {
                _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.ConsumeGoldDollars step-1 returns skip'});
                order.close_schedule.schedule.consume_gold_dollar = true;
                nextstep();
            }
        }

    ],function(error) {
        if(error){
            order.close_schedule.schedule.consume_gold_dollar = false;
        }
        callback(order);
    });
};

var GrantBlueDollars = function (order,headerToken, callback) {
    var _this = exports;
    var isFirstTimeVisit = false;
    // var subTotal,restaurantId;
    var recommender,restaurantId,userId,currencyCode,orderId;
    var fandine_bule_dollar,recommender_blue_dollar;
    var subsTotal_float=0;
    var bluedollar_debt=0;
    var should_grant_debt_to_fandine_bd = 0; // FBE-3260:The deducted credits should grant to FanDine for invite user debit gold dollar
    async.series([

        function(nextstep){
            if(order.restaurant.liked && !_this.config.other_servers.food_market.generate_fandine_credit){
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars is the FOOD MARKET shop and CANNOT use blue dollars,will return%j',
                    food_market_shop: order.restaurant.liked,
                    can_use_blue_dollars_in_food_market:_this.config.other_servers.food_market.generate_fandine_credit,
                    order_id:order._id
                });
                order.close_schedule.schedule.grant_blue_dollar = true;
                callback(order);
                return;
            }else{
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars is NOT the FOOD MARKET shop or CAN use blue dollars%j',
                    food_market_shop: order.restaurant.liked,
                    can_use_blue_dollars_in_food_market:_this.config.other_servers.food_market.generate_fandine_credit,
                    order_id:order._id
                });
                nextstep();
            }
        },

        function(nextstep) {
            orderId = order._id;
            restaurantId = order.restaurant.restaurant_id;
            userId = order.user.user_id;
            currencyCode= order.restaurant.currency || 'CNY';
            if(order.bill_status.is_first_time_online_payment === true || order.billStatus.isFirstTimeOnlinePayment === true ){
                isFirstTimeVisit = true;
            }else{
                isFirstTimeVisit = false;
            }
            nextstep();
        },
        function(nextstep) {

            subsTotal_float = parseFloat(order.payment.sub_total_after_discounts, 10);

            _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars', subsTotal_float: subsTotal_float});

            var fandineRate;
            if (isFirstTimeVisit) {

                fandineRate = _this.config.other_servers.other_rates.fandine_commission_rate_first_time + _this.config.other_servers.other_rates.fandine_commission_rate_not_first_time;
                fandineRate = parseFloat(fandineRate.toFixed(2),10);
                var recommenderRate;
                if (order.restaurant && order.restaurant.currency && (order.restaurant.currency === 'CAD'|| order.restaurant.currency === 'USD')) {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars use US or CA rule'});
                    recommenderRate =  _this.config.other_servers.other_rates.recommender_reward_rule_north_america;
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars use China rule'});
                    recommenderRate =  _this.config.other_servers.other_rates.recommender_reward_rule_china;
                }
                fandine_bule_dollar = (parseFloat(subsTotal_float, 10) * parseFloat(fandineRate, 10)).toFixed(2);

                recommender_blue_dollar = 0;
                var rate;
                for(var i=0;i<recommenderRate.length;i++) {
                    rate = recommenderRate[i];
                    if ((rate.min<= subsTotal_float && rate.max > subsTotal_float) ||
                        (rate.min<= subsTotal_float && (rate.max ===null || rate.max===undefined))) {
                        recommender_blue_dollar = rate.reward;
                    }
                }
                fandine_bule_dollar = (parseFloat(fandine_bule_dollar,10) - parseFloat(recommender_blue_dollar,10)).toFixed(2);
                fandine_bule_dollar = parseFloat(fandine_bule_dollar,10);
                nextstep();
            } else {
                //-- FBE-885 no 1% fandine blue dollars after user pay the bill modified by Webber.Wang 20150427
                fandineRate = _this.config.other_servers.other_rates.fandine_commission_rate_not_first_time;
                fandine_bule_dollar = (parseFloat(subsTotal_float,10)*parseFloat(fandineRate, 10)).toFixed(2);
                fandine_bule_dollar = parseFloat(fandine_bule_dollar,10);

                recommender_blue_dollar=0;
                nextstep();
            }
        },
        function (nextstep) {
            var postData = {};
            postData.host = _this.config.other_servers.oauth.server_url;
            postData.port = _this.config.other_servers.oauth.server_port;
            postData.path = '/v1/invitees/{user_id}/inviters'.replace('{user_id}',userId );

            postData.method = 'GET';
            _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars', userId:userId});

            var reqParams = {
                userId: userId,
                headerToken: headerToken
            };

            var loggerInfos = {
                function : 'Online-Close-Order.GrantBlueDollars'
            };

            _this.orderManager.sendToOauthServer(postData, headerToken, null, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function: 'DEBUG-ERROR: Online-Close-Order.GrantBlueDollars returns error', error: error});
                    nextstep();
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars returns right', result: JSON.stringify(result)});
                    if (result.inviterUserId !== null) {
                        recommender = result.inviterUserId;
                    }
                    if(result.bluedollar_debt){
                        bluedollar_debt = Number(result.bluedollar_debt);
                    }else{
                        bluedollar_debt = 0;
                    }
                    nextstep();
                }
            }, reqParams, loggerInfos);
        },
        function(nextstep){
            var still_bluedollar_debt = 0;
            var should_grant_bluedollar = 0;
            var should_update_user =false;
            _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantBlueDollars  update user bluedollar_debt:before',
                still_bluedollar_debt: still_bluedollar_debt,
                should_grant_bluedolalr:should_grant_bluedollar,
                should_update_user:should_update_user,
                recommender_blue_dollar:recommender_blue_dollar,
                bluedollar_debt:bluedollar_debt
            });

            if(bluedollar_debt>0 && bluedollar_debt >= recommender_blue_dollar && recommender){
                still_bluedollar_debt = bluedollar_debt - recommender_blue_dollar;
                should_grant_bluedollar = 0;
                should_update_user = true;
                should_grant_debt_to_fandine_bd = recommender_blue_dollar;
            }else if(bluedollar_debt>0 && bluedollar_debt < recommender_blue_dollar  && recommender){
                still_bluedollar_debt =0  ;
                should_grant_bluedollar = recommender_blue_dollar - bluedollar_debt;
                should_update_user = true;
                should_grant_debt_to_fandine_bd = bluedollar_debt;
            }else{
                should_update_user = false;
                should_grant_debt_to_fandine_bd = 0;
            }
            _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantBlueDollars  update user bluedollar_debt:',
                still_bluedollar_debt: still_bluedollar_debt,
                should_grant_bluedollar:should_grant_bluedollar,
                should_update_user:should_update_user,
                recommender_blue_dollar:recommender_blue_dollar,
                bluedollar_debt:bluedollar_debt,
                recommender:  recommender,
                should_grant_debt_to_fandine_bd:should_grant_debt_to_fandine_bd

            });
            if(should_update_user){
                recommender_blue_dollar = should_grant_bluedollar;
                _this.updateUserBluedollarDebt(recommender,still_bluedollar_debt,headerToken,function(error,result){
                    if (error) {
                        _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantBlueDollars  update user bluedollar_debt  : get error',
                            grant_blue_dollar:false,
                            error: error});
                        order.close_schedule.schedule.grant_blue_dollar = false;
                        nextstep(error);
                    } else {
                        _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantBlueDollars update user bluedollar_debt  : success',result:result});
                        nextstep();
                    }
                });
            }else{
                nextstep();
            }
        },
        function(nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars grant blue dollars === ',
                subsTotal_float: subsTotal_float, fandine_bule_dollar: fandine_bule_dollar, recommender_blue_dollar: recommender_blue_dollar,recommender:recommender });

            if (fandine_bule_dollar >0||(recommender_blue_dollar>0 && recommender)) {
                var postData = {};
                postData.host = _this.config.other_servers.reward.server_url;
                postData.port = _this.config.other_servers.reward.server_port;
                postData.path = '/v1/restaurants/d-' + restaurantId + '/blueDollars';
                var body = {}, grantBlueDollar = [];

                if (fandine_bule_dollar && fandine_bule_dollar>0) {
                    if( !recommender){
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars grant blue dollars === fandine====only fandine'});
                        grantBlueDollar.push({
                            'userId': 'fandine',
                            'amount': parseFloat((fandine_bule_dollar+recommender_blue_dollar).toFixed(2), 10),
                            'balanceType': 1,
                            'orderId': orderId,
                            'code': _this.enums.DollarSourceCode.BD103          // fandine get blue dollar
                        });
                    }else{
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars grant blue dollars === fandine====fandine and recommender'});
                        grantBlueDollar.push({
                            'userId': 'fandine',
                            'amount': parseFloat((fandine_bule_dollar).toFixed(2), 10),
                            'balanceType': 1,
                            'orderId': orderId,
                            'code': _this.enums.DollarSourceCode.BD103          // fandine get blue dollar
                        });
                    }
                };
                if (recommender && recommender_blue_dollar>0) {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars grant blue dollars === recommender====add recommender'});
                    grantBlueDollar.push({
                        'userId': 'u-' + recommender,
                        'amount': parseFloat(recommender_blue_dollar, 10),
                        'balanceType': 1,
                        'orderId': orderId,
                        'code': _this.enums.DollarSourceCode.BD102          // The invite user can get blue dollar once the invitee paid the order
                    });
                };
                // FBE-3260:The deducted credits should grant to FanDine for invite user debit gold dollar
                if(should_grant_debt_to_fandine_bd > 0){
                    grantBlueDollar.push({
                        'userId': 'fandine',
                        'amount': parseFloat(should_grant_debt_to_fandine_bd.toFixed(2), 10),
                        'balanceType': 1,
                        'orderId': orderId,
                        'code': _this.enums.DollarSourceCode.BD110         // fandine get blue dollar
                    });
                }
                if (grantBlueDollar.length>0) {
                    body = {
                        'grantBlueDollar': grantBlueDollar
                    };
                } else {
                    body = null;
                };

                if (body) {

                    _this.logger.info('%j', {
                        function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars before calling Rewards API with postData', postData: postData, body: body });

                    postData.method = 'POST';

                    var reqParams = {
                        userId: userId,
                        orderId: userId,
                        headerToken: headerToken
                    };
                    var loggerInfos = {
                        function : 'Online-Close-Order.GrantBlueDollars before calling Rewards API with postData'
                    };

                    _this.orderManager.sendToReward(postData, headerToken, function (error, result) {
                        if (error) {
                            _this.logger.error('%j', {function: 'DEBUG-ERROR: Online-Close-Order.GrantBlueDollars grant blue dollars has error',
                                grant_blue_dollar:false,
                                error:error});
                            order.close_schedule.schedule.grant_blue_dollar = false;
                            nextstep();
                        } else {
                            _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars grant blue dollars',
                                grant_blue_dollar:true,
                                result: JSON.stringify(result)});
                            order.close_schedule.schedule.grant_blue_dollar = true;
                            nextstep();
                        }
                    }, body, reqParams, loggerInfos);
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars skip',grant_blue_dollar:true});
                    order.close_schedule.schedule.grant_blue_dollar = true;
                    nextstep();
                }

            } else {
                _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars skip',grant_blue_dollar:true});
                order.close_schedule.schedule.grant_blue_dollar = true;
                nextstep();
            }
        }

    ],function(error) {
        if(error){
            order.close_schedule.schedule.grant_blue_dollar = false;
        }
        callback(order);
    });
};

var GrantGoldDollarToServers = function (order, headerToken, callback) {
    var _this = exports;
    var selector = {};
    var options = {};
    var helper = {collectionName: 'dining-orders'};
    var first_online_pay = false;
    var inviterUserId,is_restaurant_server=false,bluedollar_debt= 0,grant_golddollars=0;
    var restaurantIds=[];
    var restaurantId,specialConfig,config_restaurant_id,grant_to_specify_user = false;
    var userId;
    async.series([
        function(nextstep){
            if(_this.config.other_servers.grant_goldDollars_to_servers){
                _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers step-0 check whether need do this step--need',
                    rant_goldDollars_to_servers: _this.config.other_servers.grant_goldDollars_to_servers});
                userId = order.user.user_id;
                restaurantId = order.restaurant.restaurant_id;
                nextstep()
            }else{
                _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers  step-0 check whether need do this step--no need',
                    grant_goldDollars_to_servers: _this.config.other_servers.grant_goldDollars_to_servers});
                restaurantId = order.restaurant.restaurant_id;
                order.close_schedule.schedule.grant_gold_dollar_to_server = true;
                callback(order);
            }
        },
        function(nextstep) {

            /**
             * NOTE: First-time visit discount apply only to those who haven't had any record of placing orders or paying orders in the restaurant
             */
            selector = {
                status: {$in: ['CLOSED', 'PAID']},
                $and: [ {$or: [{'billStatus.userId': userId}, {'bill_status.user_id': userId} ]},
                    {$or: [{'billStatus.isOnlinePayment': true}, {'bill_status.is_online_payment': true} ]}
                ]
            };
            options = { fields :{_id:1}};
            helper = {collectionName: 'dining-orders'};
            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j',{ function:'DEBUG-ERROR:GrantGoldDollarToServers step1 check whether the user is the first time on line pay:first time',
                        grant_gold_dollar_to_server:false,error: error});
                    order.close_schedule.schedule.grant_gold_dollar_to_server = false;
                    nextstep(error);
                } else if (result === null || result === '' || result.length ===1) {
                    first_online_pay = true;
                    _this.logger.info('GrantGoldDollarToServers step1 check whether the user is the first time on line pay:first time',
                        {userId:userId,first_online_pay:first_online_pay});
                    nextstep();

                } else {
                    first_online_pay = false;
                    _this.logger.info('GrantGoldDollarToServers step1 check whether the user is the first time on line pay:not first time',
                        {userId:userId,first_online_pay:first_online_pay});
                    nextstep();
                }
            });
        },
        function (nextstep) {
            var postData = {};
            postData.host = _this.config.other_servers.oauth.server_url;
            postData.port = _this.config.other_servers.oauth.server_port;
            postData.path = '/v1/invitees/' + userId + '/inviters?restaurant_id='+restaurantId;

            postData.method = 'GET';
            _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers step2 check the user\'s inviters  post data',postData: postData});

            var reqParams = {
                userId: userId,
                headerToken: headerToken
            };

            var loggerInfos = {
                function : 'Online-Close-Order.GrantGoldDollarToServers step2 check the user\'s inviters  post data'
            };

            _this.orderManager.sendToOauthServer(postData, headerToken, null, function (error, result) {
                if (error) {
                    _this.logger.error('%j',{ function:'DEBUG-ERROR: Online-Close-Order.GrantGoldDollarToServers step2 check the user\'s inviters : get error+ has no inviter',
                        grant_gold_dollar_to_server:false,error: error});
                    order.close_schedule.schedule.grant_gold_dollar_to_server = false;
                    is_restaurant_server = false;
                    nextstep();
                } else {
                    _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers step2 check the user\'s inviters :result',
                        result: result});
                    if (result.inviterUserId !== null) {
                        inviterUserId = result.inviterUserId;
                    }
                    if(result.is_restaurant_server && result.is_restaurant_server === true){
                        is_restaurant_server =true;
                    }
                    if(result.bluedollar_debt){
                        bluedollar_debt = Number(result.bluedollar_debt);
                    }else{
                        bluedollar_debt = 0;
                    }
                    if(result.restaurant_ids && result.restaurant_ids.length >0){
                        restaurantIds = result.restaurant_ids;
                    }else{
                        is_restaurant_server =false;
                    }
                    specialConfig = result.special_config;
                    bluedollar_debt = bluedollar_debt + _this.config.other_servers.consume_blueDollar_amount_from_server;
                    grant_golddollars =  _this.config.other_servers.grant_goldDollar_amount_to_server;

                    nextstep();
                }
            }, reqParams, loggerInfos);
        },
        function(nextstep){
            _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers  step3 check the server restaurant status: before',
                is_restaurant_server:is_restaurant_server,restaurantIds:restaurantIds,specialConfig:specialConfig});
            if(is_restaurant_server){
                /*selector = {_id:{$in:restaurantIds},  "status" : "published","active_status": {"$ne":"INACTIVE"},confirmed_inviter:{$exists:true} };
                 options = { fields :{_id:1}};
                 helper = {collectionName: 'restaurant'};
                 _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                 if (error) {
                 order.close_schedule.schedule.grant_gold_dollar_to_server = false;
                 nextstep(error);
                 } else if (result === null || result === '' || result.length ===0) {
                 is_restaurant_server = false;
                 _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers  step3 check the server restaurant status:no active restaurant'});
                 nextstep();

                 } else {
                 _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers  step3 check the server restaurant status:has active restaurant'});
                 nextstep();
                 }
                 });*/
                if(restaurantIds.indexOf(restaurantId) < 0){
                    is_restaurant_server = false;
                    _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers  step3 check the server restaurant status:no active restaurant'});
                    nextstep();
                }else{
                    if(specialConfig){

                        //for now all the gold dollar grant to the specify user
                        inviterUserId = specialConfig.user_id;
                        config_restaurant_id = specialConfig.restaurant_id;
                        bluedollar_debt = specialConfig.bluedollar_debt + _this.config.other_servers.consume_blueDollar_amount_from_server;
                        grant_golddollars =  _this.config.other_servers.grant_goldDollar_amount_to_server;
                        grant_to_specify_user = true;
                        _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers  step3 check if the special restaurant,grant gold dollar to the specify person',
                            inviterUserId:inviterUserId,config_restaurant_id:config_restaurant_id,bluedollar_debt:bluedollar_debt,grant_golddollars:grant_golddollars,grant_to_specify_user:grant_to_specify_user
                        });
                        nextstep();
                    }else{
                        _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers  step3 check if the special restaurant,grant gold dollar to the specify person ==not special restaurant'});
                        nextstep();
                    }
                }
            }else{
                nextstep();
            }
        },
        function(nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers step4 grant gold dollars and consume related blue dollars=== ',
                bluedollar_debt: bluedollar_debt, grant_golddollars: grant_golddollars, is_restaurant_server: is_restaurant_server,inviterUserId:inviterUserId ,first_online_pay:first_online_pay});

            if(is_restaurant_server && first_online_pay){
                var para = {
                    inviter_user_id:inviterUserId,
                    config_restaurant_id:config_restaurant_id,
                    blue_dollar_debt:bluedollar_debt,
                    grant_gold_dollars:grant_golddollars,
                    grant_to_specify_user:grant_to_specify_user,
                    order_id:order._id,
                    headerToken:headerToken
                }
                _this.grantGoldDollarsToServer(para,function(error,result){
                    if(error){
                        order.close_schedule.schedule.grant_gold_dollar_to_server = false;
                        nextstep(error);
                    }else{
                        order.close_schedule.schedule.grant_gold_dollar_to_server = true;
                        nextstep();
                    }
                });
            }else{
                _this.logger.info('%j',
                    { function: 'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers step4 grant gold dollars and consume related blue dollars=== not first time,skip',
                        grant_gold_dollar_to_server:true});
                order.close_schedule.schedule.grant_gold_dollar_to_server = true;
                nextstep()
            }
        }
    ],function(error) {
        if(error){
            order.close_schedule.schedule.grant_gold_dollar_to_server = false;
        }
        callback(order);
    });
};

var GrantGoldDollarsToServer = function(para,callback) {
    var _this = exports;
    var deduct_bluedollar_from ;
    var should_consume_amount= 0,still_remain_amount= 0,gold_dollars=0;
    var should_grant_debt_to_fandine_bd = 0; // FBE-3260:The deducted credits should grant to FanDine for invite user debit gold dollar
    _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantGoldDollarsToServer received arguments',
        para:para});
    _this.logger.info('%j', { function: 'DEBUG-INFO:  Online-Close-Order.GrantGoldDollarsToServer config files',
        connection_string: _this.config.other_servers.postgre_sql.connection_string });
    var client = new pg.Client(_this.config.other_servers.postgre_sql.connection_string) ;
    var tx = new Transaction(client);
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
            if(para.grant_to_specify_user){
                deduct_bluedollar_from = 'd-'+para.config_restaurant_id;
            }else{
                deduct_bluedollar_from = 'u-'+para.inviter_user_id;
            }
            var queryString = 'SELECT sum(balance_amount - locked_amount) remain_amount  from t_user_bluedollar_balance WHERE user_id = $1';
            var argArray=[deduct_bluedollar_from];
            var amount = parseInt(para.blue_dollar_debt * 100,10);
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

                        if(amount > remain_amount){
                            should_consume_amount = remain_amount;
                            still_remain_amount = parseInt(amount,10) - parseInt(remain_amount,10);
                        }else{
                            should_consume_amount = amount;
                            still_remain_amount = 0;
                        }
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantGoldDollarsToServer step1 query result',
                            remain_amount: remain_amount,amount:amount,should_consume_amount:should_consume_amount,still_remain_amount:still_remain_amount });
                    }else{
                        should_consume_amount = 0;
                        still_remain_amount = amount;
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantGoldDollarsToServer step1 query result: no result',
                            should_consume_amount:should_consume_amount,still_remain_amount:still_remain_amount });
                    }
                    nextstep();
                }
            });
        },
        function (nextstep) {
            _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServer step2 grant gold dollar to server'});
            gold_dollars = parseInt(para.grant_gold_dollars * 100,10);
            var functionName = 'grant_or_consume_gold_dollar';
            var argArray = [
                {type: 'VARCHAR', value: 'u-'+para.inviter_user_id},
                {type: 'VARCHAR', value: 'CNY'},
                {type: 'INTEGER', value: gold_dollars},
                {type: 'VARCHAR', value:  'd-'+para.config_restaurant_id},
                {type: 'VARCHAR', value: para.order_id},
                {type: 'VARCHAR', value: _this.enums.DollarSourceCode.GD102}        // Invite reward
            ];
            _this.restaurantDataAPI_PG.executeFunction(client, functionName, argArray, function (error, result) {
                if (error) {
                    nextstep(error);
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServer step2', result: JSON.stringify(result.rows)});
                    apiResult = {status: 201, data: {data: 'grant_or_consume_gold_dollar execute success'}};
                    nextstep();
                }
            });

        },
        function (nextstep) {
            _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServer step3 consume blue dollar from server',should_consume_amount:should_consume_amount});
            if(should_consume_amount>0){
                var functionName = 'consume_blue_dollar_self_server';
                var argArray = [
                    {type: 'VARCHAR', value:deduct_bluedollar_from},
                    {type: 'VARCHAR', value: 'd-'+para.config_restaurant_id},
                    {type: 'INTEGER', value: should_consume_amount},
                    {type: 'VARCHAR', value: para.order_id},
                    {type: 'VARCHAR', value: _this.enums.DollarSourceCode.BD003}
                ];
                _this.restaurantDataAPI_PG.executeFunction(client, functionName, argArray, function (error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServer step3', result: JSON.stringify(result.rows)});
                        apiResult = {status: 201, data: {data: 'consume_blue_dollar_self_server execute success'}};
                        nextstep();
                    }
                });
            }else{
                _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServer step3 consume blue dollar from server,should_consume_amount=0 skip'});
                nextstep();
            }
        },
        function (nextstep) {
            // FBE-3260:The deducted credits should grant to FanDine for invite user debit gold dollar
            //todo should grant blue dollar according to the restaurant from where it deducted
            _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServer step3.1 grant deducted blue dollar to fandine',should_consume_amount:should_consume_amount});
            if(should_consume_amount>0){
                var functionName = 'grant_blue_dollor';
                var argArray=[
                    {type:'VARCHAR',value:'fandine'},
                    {type:'VARCHAR',value:'d-'+para.config_restaurant_id},
                    {type:'INTEGER',value:should_consume_amount},
                    {type:'INTEGER',value:1},
                    {type:'VARCHAR',value:para.order_id},
                    {type:'VARCHAR',value:_this.enums.DollarSourceCode.BD110}
                ];
                _this.restaurantDataAPI_PG.executeFunction(client, functionName, argArray, function (error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServer  step3.1', result: JSON.stringify(result.rows)});
                        apiResult = {status: 201, data: {data: 'grant_blue_dollor execute success'}};
                        nextstep();
                    }
                });
            }else{
                _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServer step3.1 grant deducted blue dollar to fandine,should_consume_amount=0 skip'});
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
        },
        function(nextstep){
            still_remain_amount = parseFloat((still_remain_amount/100).toFixed(2),10);
            _this.updateUserBluedollarDebt(para.inviter_user_id,still_remain_amount,para.headerToken,function(error,result){
                if (error) {
                    _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers step4 update user bluedollar_debt  : get error',
                        error: error});
                    nextstep(error);
                } else {
                    _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.GrantGoldDollarToServers step4 update user bluedollar_debt  : success',result:result});
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

var UpdateUserBluedollarDebt = function(userId, amount, headerToken, callback){
    var _this = exports;
    var postData = {};
    postData.host =  _this.config.other_servers.oauth.server_url;
    postData.port =  _this.config.other_servers.oauth.server_port;
    postData.path = '/v1/users/' + userId + '/profile';

    var body = {bluedollar_debt:amount};
    postData.method = 'PUT';

    var reqParams = {
        userId: userId,
        headerToken: headerToken
    };

    var loggerInfos = {
        function : 'Online-Close-Order.UpdateUserBluedollarDebt UpdateUserBluedollarDebt'
    };

    _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.UpdateUserBluedollarDebt UpdateUserBluedollarDebt : post data',postData: postData,body:body});
    _this.orderManager.sendToOauthServer(postData, headerToken, body,function (error, result) {
        if (error) {
            _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.UpdateUserBluedollarDebt UpdateUserBluedollarDebt  : get error',
                error: error});
            callback(error,null);
        } else {
            _this.logger.info('%j',{ function:'DEBUG-INFO: Online-Close-Order.UpdateUserBluedollarDebt UpdateUserBluedollarDebt  : success'});
            callback(null,'update user bluedollar debt success');
        }
    }, reqParams, loggerInfos);

}

var GrantBlueDollarForUpComments = function (passOrder,headerToken,callback){
    var _this = exports;
    var selector = {};
    var options = {};
    var filter = {};
    var helper = {};
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments received arguments %j',
        orderId: passOrder._id,headerToken:headerToken });
    var orderId = passOrder._id,userId;
    var order = {},menus=[],shouldCheckMenus=[],grantCommentUsers=[], actualGrantBlueDollars=[];
    var grantAmount=0;
    var restaurantId;
    var country,standardItemPrice= 0,grantAmountStandard=0;
    var should_grant_debt_to_fandine_bd = 0; // FBE-3260:The deducted credits should grant to FanDine for invite user debit gold dollar
    async.series([
        function(nextstep){
            if(passOrder.restaurant.liked && !_this.config.other_servers.food_market.generate_fandine_credit){
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments is the FOOD MARKET shop and CANNOT use blue dollars,will return%j',
                    food_market_shop: passOrder.restaurant.liked,
                    can_use_blue_dollars_in_food_market:_this.config.other_servers.food_market.generate_fandine_credit,
                    order_id:passOrder._id
                });
                passOrder.close_schedule.schedule.grant_for_up_comments = true;
                callback(passOrder);
                return;
            }else{
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments is NOT the FOOD MARKET shop or CAN use blue dollars%j',
                    food_market_shop: passOrder.restaurant.liked,
                    can_use_blue_dollars_in_food_market:_this.config.other_servers.food_market.generate_fandine_credit,
                    order_id:passOrder._id
                });
                nextstep();
            }
        },
        //prepare some initial data
        function(nextstep){
            orderId = passOrder._id;
            userId = passOrder.user.user_id;
            country = _this.config.other_servers.country;
            if (!country || (_this.config.other_servers.region.north_america.indexOf(country) >-1)) {
                country = _this.enums.RegionCode.NA;
                standardItemPrice = _this.config.other_servers.other_rates.standard_menu_item_price_NA;
                grantAmountStandard = _this.config.other_servers.other_rates.grant_amount_for_comments_NA;
            } else {
                country = _this.enums.RegionCode.CHINA;
                standardItemPrice = _this.config.other_servers.other_rates.standard_menu_item_price;
                grantAmountStandard = _this.config.other_servers.other_rates.grant_amount_for_comments;
            }
            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-prepare prepare some initial data',
                country:country,
                standardItemPrice: standardItemPrice,
                grantAmountStandard:grantAmountStandard });
            nextstep();
        },
        //step 1 find the menu which price is greater than 20
        function(nextstep) {
            selector = { '_id': orderId};
            options = { };
            filter = {_id: 1, order_items:1,bill_status:1,user:1,restaurant:1,tableId:1,tableNo:1};
            options.fields = filter;
            helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: Online-Close-Order.js; Method: GrantBlueDollarForUpComments()' };

            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-1 find the menu which price is greater than '+standardItemPrice+' find',country:country, selector: selector });

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-ERROR: Online-Close-Order.GrantBlueDollarForUpComments step 1 find the menu which price is greater than '+standardItemPrice+' ==query return error',country:country, error: error });
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-ERROR: Online-Close-Order.GrantBlueDollarForUpComments step 1 find the menu which price is greater than '+standardItemPrice+'==query returns empty',country:country});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('id', orderId));
                } else {
                    _this.logger.info('%j', {
                        function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step 1 find the menu which price is greater than '+standardItemPrice+' == has result', country:country,result: result });

                    order = result[0];

                    if (order.order_items && order.order_items.length > 0 ) {
                        for(var i=0;i<order.order_items.length;i++){
                            if(order.order_items[i].price && order.order_items[i].price.amount && order.order_items[i].price.amount > standardItemPrice && order.order_items[i].item_id ){
                                menus.push(order.order_items[i].item_id)
                            }
                        }
                    }

                    if(order.restaurant){
                        restaurantId = order.restaurant.restaurant_id;
                    }
                    _this.logger.info('%j', {
                        function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step 1 find the menu which price is greater than '+standardItemPrice,
                        country:country,
                        menus:menus,
                        order:order });

                    nextstep();
                }
            });
        },
        //step 2 check whether the meun in menus is the first time online payment
        function(nextstep) {
            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-2 online payment do some check and then grant',
                bill_status:order.bill_status,menus:menus });
            if(order.bill_status.is_online_payment === true && menus.length > 0){
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-2 online payment do some check and then grant',
                    bill_status:order.bill_status,menus:menus });

                var criteria = {
                    status: {$in: ['CLOSED', 'PAID']},
                    $and: [
                        {$or: [{'restaurant.restaurant_id': restaurantId}, {restaurantId: restaurantId} ]},
                        {$or: [{'customers.userId': userId}, {'customers.user_id': userId}, {'user.user_id': userId}, {'bill_status.user_id': userId} ]},
                        {$or: [{'billStatus.status': _this.enums.OrderStatus.PAID}, {'bill_status.status': _this.enums.OrderStatus.PAID}]},
                        {$or: [{'billStatus.isOnlinePayment': true}, {'bill_status.is_online_payment':true}]}
                    ]
                };
                var filter = {menu:'$order_items.item_id'};
                // var resultFilter = {};
                var unwind = '$menu';

                var group = {_id:'$menu', num:{ $sum : 1 }};
                var resultCriteria = {_id:{$in:menus}};

                var helper = {
                    collectionName: _this.enums.CollectionName.DINING_ORDERS,
                    callerScript: 'File: order.js; Method: GrantBlueDollarForUpComments()',
                    apiVersion: 1
                };
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-2 online payment do some check and then grant query',
                    criteria:criteria,
                    filter:filter,
                    unwind:unwind,
                    group:group,
                    resultCriteria:resultCriteria,
                    helper:helper
                });

                _this.restaurantDataAPI.aggregateWithResultCriteria(criteria, filter, unwind, group, resultCriteria, helper, 'one',function (error, result) {
                    if (error) {
                        _this.logger.error('%j', {
                            function: 'DEBUG-ERROR: Online-Close-Order.GrantBlueDollarForUpComments step-2 online payment do some check and then grant return ==query return error',
                            grant_for_up_comments:false,
                            error: error });
                        passOrder.close_schedule.schedule.grant_for_up_comments = false;
                        nextstep(error);
                    } else if (result === null || result.length === 0) {
                        _this.logger.info('%j', {
                            function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-2 online payment do some check and then grant return result empty'});
                        shouldCheckMenus=[];
                        nextstep();
                    } else {
                        _this.logger.info('%j', {
                            function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-2 online payment do some check and then grant return result',result:result});

                        shouldCheckMenus=[];
                        if (result && result.length > 0) {
                            for (var i = 0; i < result.length; i++) {
                                if(result[i].num === 1) {
                                    shouldCheckMenus.push(result[i]._id);
                                }
                            }
                        };
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-2 online payment do some check and then grant return result',
                            shouldCheckMenus: shouldCheckMenus });

                        nextstep();
                    }
                });

            }else{
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-2 offline payment skep grant',
                    bill_status:order.bill_status,menus:menus });
                nextstep();
            }
        },
        //step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment
        function(nextstep){
            if(shouldCheckMenus.length>0){
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment  gruant',
                    shouldCheckMenus:shouldCheckMenus });

                var criteria = {
                    thumb_ups:{$elemMatch:{user_id:userId}},
                    'restaurant.restaurant_id':restaurantId,
                    'menu_item.menu_item_id':{$in:shouldCheckMenus},
                    "user.user_id":{"$ne":userId}
                };
                var filter = {user_id:"$user.user_id",user_name:"$user.user_name",meun_id:"$menu_item.menu_item_id"};
                // var resultFilter = {};
                var unwind = null;

                var group = {_id:"$meun_id", users:{  $push:  {user_id:"$user_id",user_name:"$user_name"} }};
                var resultCriteria = {};

                var helper = {
                    collectionName: _this.enums.CollectionName.MENU_ITEM_COMMENT,
                    callerScript: 'File: order.js; Method: GrantBlueDollarForUpComments()',
                    apiVersion: 1
                };
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment query',
                    criteria:criteria,
                    filter:filter,
                    unwind:unwind,
                    group:group,
                    resultCriteria:resultCriteria,
                    helper:helper
                });
                _this.restaurantDataAPI.aggregateWithResultCriteria(criteria, filter, unwind, group, resultCriteria, helper,'two', function (error, result) {
                    if (error) {
                        _this.logger.error('%j', {
                            function: 'DEBUG-ERROR: Online-Close-Order.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment ==query return error',
                            grant_for_up_comments:false,
                            error: error });
                        passOrder.close_schedule.schedule.grant_for_up_comments = false;
                        nextstep(error);
                    } else if (result === null || result.length === 0) {
                        _this.logger.info('%j', {
                            function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment return result empty'});

                        grantCommentUsers = [];
                        nextstep();
                    } else {
                        _this.logger.info('%j', {
                            function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment return result',result:result});

                        var comments = result;
                        var comment = {};
                        var commentsLength = comments.length;
                        var randomIndex=0;

                        for (var i = 0; i < comments.length; i++) {
                            comment =comments[i];
                            randomIndex=0;
                            if(comment.users && comment.users.length > 0){
                                randomIndex= Math.floor(Math.random() * comment.users.length);
                                grantCommentUsers.push({menu_id:comment._id,user:comment.users[randomIndex]});
                            }
                        }

                        _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment',
                            grantCommentUsers: grantCommentUsers });
                        nextstep();
                    }
                });
            }else{
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment skip gruant',
                    shouldCheckMenus:shouldCheckMenus });
                nextstep();
            }
        },
        //step-4 get user debt and update debt
        function (nextstep) {
            if (grantCommentUsers.length > 0) {
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-4 get user debt and update debt'});

                var grantBlueDollars = [];
                grantBlueDollars.push({
                    userId: userId,
                    amount: grantCommentUsers.length * grantAmountStandard,
                    balanceType: 1,
                    orderId: orderId,
                    code: _this.enums.DollarSourceCode.BD106
                });

                grantCommentUsers.forEach(function (item) {
                    grantBlueDollars.push({
                        userId: item.user.user_id,
                        amount: grantAmountStandard,
                        balanceType: 1,
                        orderId: orderId,
                        code: _this.enums.DollarSourceCode.BD105
                    });
                });

                var grantBlueDollarsLength = grantBlueDollars.length;
                async.eachSeries(grantBlueDollars, function (grantBlueDollar, next) {

                    var grantUserId = grantBlueDollar.userId;
                    var grantAmount = grantBlueDollar.amount;

                    var blueDollarDebt = 0;
                    var actualGrantAmount = 0;

                    async.series([
                        // get user debt
                        function (nxt) {
                            var postData = {};
                            postData.host = _this.config.other_servers.oauth.server_url;
                            postData.port = _this.config.other_servers.oauth.server_port;
                            postData.path = '/v1/users/' + grantUserId;

                            postData.method = 'GET';

                            var reqParams = {
                                userId: grantUserId,
                                headerToken: headerToken
                            };

                            var loggerInfos = {
                                function: 'Online-Close-Order.GrantBlueDollarForUpComments step-4 getUserDebt'
                            };

                            _this.orderManager.sendToOauthServer(postData, headerToken, null, function (error, result) {
                                if (error) {
                                    _this.logger.error('%j', {
                                        function: 'DEBUG-ERROR: Online-Close-Order.GrantBlueDollarForUpComments step-4 getUserDebt returns error',
                                        error: error
                                    });
                                    nxt(error);
                                } else {
                                    if (result.bluedollar_debt) {
                                        blueDollarDebt = Number(result.bluedollar_debt);
                                    }

                                    _this.logger.info('%j', {
                                        function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-4 getUserDebt returns right',
                                        result: JSON.stringify(result)
                                    });
                                    nxt();
                                }
                            }, reqParams, loggerInfos);
                        },
                        // update user debt
                        function (nxt) {
                            should_grant_debt_to_fandine_bd = 0;
                            if (blueDollarDebt > 0) {
                                var currentBlueDollarDebt = blueDollarDebt;
                                if (blueDollarDebt > grantAmount) {
                                    actualGrantAmount = 0;
                                    currentBlueDollarDebt = blueDollarDebt - grantAmount;
                                    should_grant_debt_to_fandine_bd = grantAmount;
                                } else {
                                    actualGrantAmount = grantAmount - blueDollarDebt;
                                    currentBlueDollarDebt = 0;
                                    should_grant_debt_to_fandine_bd = blueDollarDebt;
                                }

                                _this.updateUserBluedollarDebt(grantUserId, currentBlueDollarDebt, headerToken, function (error, result) {
                                    if (error) {
                                        _this.logger.info('%j', {
                                            function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-4 updateUserDebt returns error',
                                            error: error
                                        });
                                        nxt(error);
                                    } else {
                                        _this.logger.info('%j', {
                                            function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-4 updateUserDebt returns right',
                                            result: result
                                        });

                                        if (actualGrantAmount > 0) {
                                            grantBlueDollar.amount = actualGrantAmount;
                                            actualGrantBlueDollars.push(grantBlueDollar);
                                            //FBE-3260:The deducted credits should grant to FanDine for invite user debit gold dollar
                                            actualGrantBlueDollars.push({
                                                    userId: 'fandine',
                                                    amount: should_grant_debt_to_fandine_bd,
                                                    balanceType: 1,
                                                    orderId: orderId,
                                                    code: _this.enums.DollarSourceCode.BD110
                                                })
                                        }

                                        nxt();
                                    }
                                });
                            } else {
                                _this.logger.info('%j', {
                                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-5 updateUserDebt returns empty',
                                    grantAmount: grantAmount
                                });

                                actualGrantBlueDollars.push(grantBlueDollar);

                                nxt();
                            }
                        }
                    ], function (err) {
                        if (err) {
                            next(err);
                        } else {
                            grantBlueDollarsLength--;
                            next();
                        }
                    })

                }, function (error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        if (grantBlueDollarsLength === 0) {
                            _this.logger.info('%j', {
                                function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-4 get user debt and update debt returns right'});
                            nextstep();
                        }
                    }
                });
            } else {
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-4 get user debt and update debt returns empty'});
                nextstep();
            }
        },
        //step-4 grant blue dollars to the user and menu comment users
        function(nextstep){
            if(actualGrantBlueDollars.length>0){
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-4 grant blue dollars to the user and menu comment users skip gruant',
                    actualGrantBlueDollars:actualGrantBlueDollars,grantAmountStandard:grantAmountStandard,country:country });

                var postData = {};
                postData.host = _this.config.other_servers.reward.server_url;
                postData.port = _this.config.other_servers.reward.server_port;
                postData.path = '/v1/restaurants/d-' + restaurantId + '/blueDollars';

                actualGrantBlueDollars.forEach(function (item) {
                    item.userId = 'u-' + item.userId;
                });
                var body = {
                    'grantBlueDollar': actualGrantBlueDollars
                };

                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments before calling Rewards API with postData',
                    postData: postData,
                    body: body
                });

                postData.method = 'POST';

                var reqParams = {
                    userId: userId,
                    orderId: orderId,
                    headerToken: headerToken
                };

                var loggerInfos = {
                    function : 'Online-Close-Order.GrantBlueDollarForUpComments before calling Rewards API with postData'
                };

                _this.orderManager.sendToReward(postData, headerToken, function (error, result) {
                    if (error) {
                        passOrder.close_schedule.schedule.grant_for_up_comments = false;
                        nextstep(error);
                    } else {
                        _this.logger.info('%j', {function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments grant blue dollars',
                            grant_for_up_comments:true,
                            result: JSON.stringify(result.rows)});
                        passOrder.close_schedule.schedule.grant_for_up_comments = true;
                        nextstep();
                    }
                }, body, reqParams, loggerInfos);
            }else{
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments step-4 grant blue dollars to the user and menu comment users skip gruant',
                    grant_for_up_comments:true,
                    grantCommentUsers:grantCommentUsers,grantAmountStandard:grantAmountStandard,country:country });
                passOrder.close_schedule.schedule.grant_for_up_comments = true;
                nextstep();
            }
        },

        //step-5 push notification
        function(nextstep){
            if(grantAmount>0){
                _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments do step-5 notification to oneself',grantAmount:grantAmount });
                var postData={};
                postData.host = _this.config.other_servers.notification.server_url;
                postData.port = _this.config.other_servers.notification.server_port;
                postData.path = '/notifications';
                var body = {
                    'command': _this.enums.PushMessageType.BROADCAST,
                    'user_id': userId,
                    'user_name': order.user.user_name ||'' ,
                    'restaurant_id': restaurantId,
                    'restaurant_name': order.restaurant.restaurant_name,
                    'table_id': order.tableId,
                    'table_no': order.tableNo,
                    'order_id': orderId,
                    "target_user_id":userId,
                    "target_user_name":order.user.user_name  ||'',
                    'grant_amount': grantAmount,
                    'code': _this.enums.PushMessageType.THUMBUP_GRANT_BLUEDOLLAR
                };
                _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments do step-5 notification to oneself: post body==',body:body});
                postData.method = 'POST';

                var reqParams = {
                    userId: userId,
                    orderId: orderId,
                    headerToken: headerToken
                };

                var loggerInfos = {
                    function : 'Online-Close-Order.GrantBlueDollarForUpComments do step-5 notification to oneself'
                };

                _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments do step-5 notification to oneself returns an error', error: error});
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments do step-5 notification to oneself returns right'});
                    }
                }, reqParams, loggerInfos);
                nextstep();
            }else{
                _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments do step-5 notification to oneself skip==',grantAmount:grantAmount });
                nextstep();
            }
        },
        //step-5.1 push notification
        function(nextstep){
            if(grantCommentUsers.length>0){
                _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments do step-5.1 notification to other users',grantCommentUsers:grantCommentUsers });
                var postData={};
                postData.host = _this.config.other_servers.notification.server_url;
                postData.port = _this.config.other_servers.notification.server_port;
                postData.path = '/notifications';
                var body = {};
                grantCommentUsers.forEach(function(item){
                    body = {
                        'command': _this.enums.PushMessageType.BROADCAST,
                        'user_id': userId,
                        'user_name': order.user.user_name||'' ,
                        'restaurant_id': restaurantId,
                        'restaurant_name': order.restaurant.restaurant_name,
                        'table_id': order.tableId,
                        'table_no': order.tableNo,
                        'order_id': orderId,
                        "target_user_id":item.user.user_id,
                        "target_user_name":item.user.user_name||'',
                        'grant_amount': parseFloat((grantAmountStandard).toFixed(2),10),
                        'code': _this.enums.PushMessageType.COMMENTS_GRANT_BLUEDOLLAR
                    };
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder do step-5.1 notification to other users: post body==',body:body});
                    postData.method = 'POST';

                    var reqParams = {
                        userId: userId,
                        orderId: orderId,
                        headerToken: headerToken
                    };

                    var loggerInfos = {
                        function : 'Order.CloseOrder do step-5.1 notification to other users'
                    };

                    _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                        if (error) {
                            _this.logger.error('%j', { function: 'DEBUG-INFO: Order.CloseOrder do step-5.1 notification to other users returns an error', error: error,target_user_id:item.user.user_id});
                        } else {
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder do step-5.1 notification to other users returns right',target_user_id:item.user.user_id});
                        }
                    }, reqParams, loggerInfos);
                });

                nextstep();
            }else{
                _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollarForUpComments do step-5.1 notification to other users skip==',grantCommentUsers:grantCommentUsers });
                nextstep();
            }
        }
    ],function(error) {
        if(error){
            passOrder.close_schedule.schedule.grant_for_up_comments = false;
        }
        callback(passOrder);
    });
};

var SendNotification = function(order,headerToken,callback){
    var _this = exports;

    if (order.bill_status.is_online_payment) {

        _this.logger.info('%j', { function: 'DEBUG-INFO: Online-close-order.SendNotification do notification', orderId: order._id });

        var postData={};
        postData.host = _this.config.other_servers.notification.server_url;
        postData.port = _this.config.other_servers.notification.server_port;
        postData.path = '/notifications';

        if(!order.note){
            order.note={};
        }

        var body = {};
        if (order.is_takeout || order.order_type === _this.enums.OrderType.DELIVERY) {
            // takeout or delivery
            body = {
                'command': _this.enums.PushMessageType.BROADCAST,
                'user_id': order.user.user_id,
                'user_name': order.user.user_name || '',
                'restaurant_id': order.restaurant.restaurant_id,
                'restaurant_name': order.restaurant.restaurant_name || '',
                'restaurant_phone': order.restaurant.officialPhone || '',
                'consumer_phone': '',
                'table_id': order.tableId,
                'table_no': order.tableNo,
                'order_id': order._id,
                'deliver_type':'RELIABLE'
            };

            if (order.is_takeout) {
                body.consumer_phone = order.note?order.note.mobile:'';
            } else {
                body.consumer_phone = order.delivery_address.receiver.mobile;
            }

            //FBE-2629
            if(order.group_buy){
                body.code = _this.enums.PushMessageType.COUPON_PAID;
            }else{
                body.code =  order.is_takeout ? _this.enums.PushMessageType.ONLINE_PAID_TAKEOUT : _this.enums.PushMessageType.ONLINE_PAID_DELIVERY;
                body.pickup_time = _this.dataGenerationHelper.getValidUTCDateTimeFormat(order.picked_up_time);
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

                if( body.code === _this.enums.PushMessageType.ONLINE_PAID_TAKEOUT ){
                    body.time_zone = order.restaurant.time_zone || _this.config.other_servers.time_zone.default_time_zone;
                }
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
                'order_id': order._id,
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
                'order_id': order._id,
                'code': _this.enums.PushMessageType.ONLINEPAID
            }
        }

        postData.method = 'POST';

        var reqParams = {
            userId: order.user.user_id,
            orderId: order._id,
            headerToken: headerToken
        };

        var loggerInfos = {
            function : 'Online-close-order.SendNotification do notification'
        };

        _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
            if (error) {
                _this.logger.error('%j', { function: 'DEBUG-INFO: Online-close-order.SendNotification do notification returns an error', error: error});
                callback(error, order);
            } else {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Online-close-order.SendNotification do notification returns right'});
                callback(null, order);
            }
        }, reqParams, loggerInfos);
    }else{
        _this.logger.info('%j', { function: 'DEBUG-INFO: Online-close-order.SendNotification do notification,offline paid,do not send notification', orderId: order._id });
        callback(null, order);
    }
    //callback(order);
};

var isNotNull = function(value) {
    if (value !== null && value !== '' && value !== undefined) {
        return true;
    }

    return false;
}

/**
 * not null and length > 0
 *
 * @param value
 */
var isValidLength = function (value) {
    return value !== null && value !== undefined && value.length > 0;
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

var hexToChar = function(hex_val) {
    return String.fromCharCode(hex_val)
}

var CreatePrintTask = function (orderId,order,callback){
    var _this  = exports;
    var printTasks = [];
    async.series([
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

var RewardsCredits = function (order, headerToken, callback) {
    var _this = exports;

    var restaurantId,userId,subTotalAfterDiscounts;
    var points;
    var totalPoints = 0;
    var rewardsCredits = {};
    var from,pointId,changeAmount = 0,finalAmount = 0,grantAmount = 0,shouldGrantAmount = 0;
    var blueDollarDebt = 0, actualChangeAmount = 0;
    var should_grant_debt_to_fandine_bd = 0; // FBE-3260:The deducted credits should grant to FanDine for invite user debit gold dollar
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits received arguments %j',
        payment: order.payment});

    async.series([
        function(nextstep){
            if(order.restaurant.liked && !_this.config.other_servers.food_market.generate_fandine_credit){
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits is the FOOD MARKET shop and CANNOT use blue dollars,will return%j',
                    food_market_shop: order.restaurant.liked,
                    can_use_blue_dollars_in_food_market:_this.config.other_servers.food_market.generate_fandine_credit,
                    order_id:order._id
                });
                order.close_schedule.schedule.rewards_credits = true;
                callback(order);
                return;
            }else{
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits is NOT the FOOD MARKET shop or CAN use blue dollars%j',
                    food_market_shop: order.restaurant.liked,
                    can_use_blue_dollars_in_food_market:_this.config.other_servers.food_market.generate_fandine_credit,
                    order_id:order._id
                });
                nextstep();
            }
        },
        function(nextstep){
            if(order.bill_status.is_online_payment === true || order.billStatus.isOnlinePayment === true ){
                restaurantId = order.restaurant.restaurant_id;
                userId = order.user.user_id;
                subTotalAfterDiscounts = order.payment.sub_total_after_discounts;
                //points = new Points(restaurantId,userId,order._id,headerToken);

                rewardsCredits = _this.config.other_servers.rewards_credit;
                if(rewardsCredits.from_fandine_account){
                    from = 'fandine'
                }else{
                    from = 'd-'+restaurantId;
                }
                points = new _this.userPoints.Points(restaurantId,userId,order._id,from);
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-1 online payment%j',
                    orderId: order._id, restaurantId: restaurantId, userId: userId, subTotalAfterDiscounts: subTotalAfterDiscounts,rewardsCredits:rewardsCredits });
                nextstep();
            }else{
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-1 not online payment %j' });
                nextstep(new _this.httpExceptions.ResourceNotFoundException( 'order_id', order._id))
            }

        },
        //step-2 get the user points
        function(nextstep) {
            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-2 get the user points%j' });
            points.getUserPoints(function(result){
                //={points:0,has_record:false}
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-2 get the user points%j',
                    result:result});
                var originalPoints = result.points;
                var hasRecord = result.has_record;
                pointId = result.id;
                if(hasRecord){
                    _this.logger.info('%j', {
                        function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-2 get the user points==has points, update%j'});
                    totalPoints = parseFloat(((originalPoints*100 + subTotalAfterDiscounts*100)/100).toFixed(2),10);
                    points.updatePoints(pointId,subTotalAfterDiscounts,totalPoints,function(error,resu){
                        if(error){
                            nextstep(error);
                        }else{
                            nextstep();
                        }
                    })
                }else{
                    _this.logger.info('%j', {
                        function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-2 get the user points==has no points, create%j'});
                    totalPoints = subTotalAfterDiscounts;
                    points.createPoints(subTotalAfterDiscounts,function(error,res){
                        if(error){
                            nextstep(error);
                        }else{
                            pointId = res.id;
                            nextstep();
                        }
                    });
                }
            })
        },
        //step-3 calcaulate the credits
        function(nextstep){
            var multipleNum = Math.floor((totalPoints * 100)/(rewardsCredits.pre_consumed_amount*100));
            shouldGrantAmount = parseFloat(((multipleNum *  (rewardsCredits.grant_credit_amount *100)) /100).toFixed(2),10);
            changeAmount = parseFloat((( multipleNum * (rewardsCredits.pre_consumed_amount*100)) /100).toFixed(2),10);
            finalAmount =  parseFloat((((totalPoints * 100) - (changeAmount *100))/100 ).toFixed(2),10);

            if(rewardsCredits.from_fandine_account){
                from = 'fandine'
            }else{
                from = 'd-'+restaurantId;
            }

            points.getBlueDollars(function(result){
                if(rewardsCredits.rewards_all ){
                    if(result.blue_dollar >= shouldGrantAmount){
                        grantAmount = shouldGrantAmount;
                        multipleNum = multipleNum;
                    }else{
                        grantAmount = 0;
                        multipleNum = 0;
                    }
                }else{
                    if(result.blue_dollar >= shouldGrantAmount){
                        grantAmount = shouldGrantAmount;
                        multipleNum = multipleNum;
                    }else if(result.blue_dollar < rewardsCredits.grant_credit_amount){
                        grantAmount = 0;
                        multipleNum = 0;
                    }else{
                        multipleNum = Math.floor((result.blue_dollar*100) / (rewardsCredits.grant_credit_amount *100));
                        grantAmount = multipleNum * (rewardsCredits.grant_credit_amount *100)/100;
                        grantAmount = parseFloat(grantAmount.toFixed(2));
                    }
                }

                changeAmount = parseFloat((( multipleNum * (rewardsCredits.pre_consumed_amount*100)) /100).toFixed(2),10);
                finalAmount =  parseFloat((((totalPoints * 100) - (changeAmount *100))/100 ).toFixed(2),10);

                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-3 calcaulate the credits==result%j',
                    multipleNum:multipleNum,
                    grantAmount:grantAmount,
                    changeAmount:changeAmount,
                    finalAmount:finalAmount,
                    rewardsCredits:rewardsCredits
                });
                nextstep();
            });

        },
        //step-4 get user debt
        function (nextstep) {
            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-4 getUserDebt',
                userId: userId
            });

            var postData = {};
            postData.host = _this.config.other_servers.oauth.server_url;
            postData.port = _this.config.other_servers.oauth.server_port;
            postData.path = '/v1/users/' + userId;

            postData.method = 'GET';

            var reqParams = {
                userId: userId,
                headerToken: headerToken
            };

            var loggerInfos = {
                function: 'Online-Close-Order.RewardsCredits step-4 getUserDebt'
            };

            _this.orderManager.sendToOauthServer(postData, headerToken, null, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-ERROR: Online-Close-Order.RewardsCredits step-4 getUserDebt returns error',
                        error: error
                    });
                    nextstep(error);
                } else {
                    if (result.bluedollar_debt) {
                        blueDollarDebt = Number(result.bluedollar_debt);
                    }

                    _this.logger.info('%j', {
                        function: 'DEBUG-INFO: Online-Close-Order.GrantBlueDollars step-4 getUserDebt returns right',
                        result: JSON.stringify(result)
                    });
                    nextstep();
                }
            }, reqParams, loggerInfos);
        },
        //ste-5 update user debt
        function (nextstep) {
            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-5 updateUserDebt',
                userId: userId,
                blueDollarDebt: blueDollarDebt
            });

            if (blueDollarDebt > 0) {
                var currentBlueDollarDebt = blueDollarDebt;
                if (blueDollarDebt > grantAmount) {
                    actualChangeAmount = 0;
                    currentBlueDollarDebt = blueDollarDebt - grantAmount;
                    should_grant_debt_to_fandine_bd = grantAmount;
                } else {
                    actualChangeAmount = grantAmount - blueDollarDebt;
                    currentBlueDollarDebt = 0;
                    should_grant_debt_to_fandine_bd =  blueDollarDebt;
                }

                _this.updateUserBluedollarDebt(userId, currentBlueDollarDebt, headerToken, function (error, result) {
                    if (error) {
                        _this.logger.info('%j', {
                            function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-5 updateUserDebt returns error',
                            error: error
                        });
                        nextstep(error);
                    } else {
                        _this.logger.info('%j', {
                            function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-5 updateUserDebt returns right',
                            result: result
                        });
                        nextstep();
                    }
                });
            } else {
                actualChangeAmount = grantAmount;

                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-5 updateUserDebt returns empty',
                    grantAmount: grantAmount
                });
                nextstep();
            }
        },
        // FBE-3260:The deducted credits should grant to FanDine for invite user debit gold dollar
        function(nextstep){
            if(should_grant_debt_to_fandine_bd > 0){
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-3.1 grant the deduct blue dollar to fandine, update and grant %j',
                    should_grant_debt_to_fandine_bd:should_grant_debt_to_fandine_bd
                });
                points.grantDeductBlueDollarToFandine(should_grant_debt_to_fandine_bd );
                nextstep();
            }else{
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-3.1 grant the deduct blue dollar to fandine, skip update and grant %j',
                    grantAmount:grantAmount
                });
                nextstep();
            }
        },
        //step-4 update and grant the blue dollar
        function(nextstep){
            if(grantAmount > 0){
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-4 update and grant the blue dollar, update and grant %j',
                    grantAmount:grantAmount,
                    changeAmount:changeAmount,
                    finalAmount:finalAmount
                });
                points.updatePoints(pointId,-changeAmount,finalAmount,function(error,result){
                    if(error){
                        nextstep(error);
                    }else{
                        if (actualChangeAmount > 0) {
                            points.grantBlueDollar(actualChangeAmount);
                        }
                        nextstep();

                    }
                })
            }else{
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits step-4 update and grant the blue dollar, skip update and grant %j',
                    grantAmount:grantAmount
                });
                nextstep();
            }

        },
        function(nextsetp){
            if(actualChangeAmount > 0) {
                _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits do step-5.1 notification to other users'});
                var postData = {};
                postData.host = _this.config.other_servers.notification.server_url;
                postData.port = _this.config.other_servers.notification.server_port;
                postData.path = '/notifications';
                var  body = {
                    'command': _this.enums.PushMessageType.BROADCAST,
                    'user_id': userId,
                    'user_name': order.user.user_name || '',
                    'restaurant_id': restaurantId,
                    'restaurant_name': order.restaurant.restaurant_name,
                    'table_id': order.tableId,
                    'table_no': order.tableNo,
                    'order_id': order._id,
                    "target_user_id": order.user.user_id,
                    "target_user_name": order.user.user_name || '',
                    'amount_consumed':subTotalAfterDiscounts,
                    'currency':order.restaurant.currency,
                    'amount_credits_rewarded':actualChangeAmount,
                    'code': _this.enums.PushMessageType.CREDIT_REWARD
                };
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits do step-5.1 notification to other users: post body==',
                    body: body
                });
                postData.method = 'POST';

                var reqParams = {
                    userId: userId,
                    orderId: order._id,
                    headerToken: headerToken
                };

                var loggerInfos = {
                    function : 'Online-Close-Order.RewardsCredits do step-5.1 notification to other users'
                };

                _this.orderManager.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', {
                            function: 'DEBUG-INFO: Order.CloseOrder do step-5.1 notification to other users returns an error',
                            error: error,
                            target_user_id: order.user.user_id
                        });
                    } else {
                        _this.logger.info('%j', {
                            function: 'DEBUG-INFO: Order.CloseOrder do step-5.1 notification to other users returns right',
                            target_user_id: order.user.user_id
                        });
                    }
                }, reqParams, loggerInfos);
            }else{
                _this.logger.info('%j', { function: 'DEBUG-INFO: Online-Close-Order.RewardsCredits do step-5 notification to the users == skip'});
            }

            nextsetp();
        }
    ],function(error) {
        if(error){
            order.close_schedule.schedule.rewards_credits = false;
        }else{
            order.close_schedule.schedule.rewards_credits = true;
        }
        callback(order);
    });
};

module.exports = function init(app, config, mongoConfig, logger) {
    var _this = exports;

    //-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
    //-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions (below) in alphabetical order
    //-- NOTE to Developers (2015-05-13): 3) For READABILITY, please help to maintain double-spaces between functions declarations
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
    _this.userPoints = require('./restaurant-user-points')(_this.app, _this.config, _this.mongoConfig, _this.logger);
    _this.orderManager = require('./order-manager')(_this.app, _this.config, _this.mongoConfig, _this.logger);
    _this.orderPrintTask = require('./order-print-task')(_this.app, _this.config, _this.mongoConfig, _this.logger);

    _this.executeCloseOrder = ExecuteCloseOrder;
    _this.consumeLockedBlueDollars = ConsumeLockedBlueDollars;
    _this.consumeGoldDollars = ConsumeGoldDollars;

    _this.grantBlueDollars = GrantBlueDollars;
    _this.grantGoldDollarToServers = GrantGoldDollarToServers;
    _this.grantGoldDollarsToServer = GrantGoldDollarsToServer;
    _this.updateUserBluedollarDebt = UpdateUserBluedollarDebt;
    _this.grantBlueDollarForUpComments = GrantBlueDollarForUpComments;

    _this.createPrintTask = CreatePrintTask;

    _this.sendNotification = SendNotification;

    _this.rewardsCredits = RewardsCredits;

    //-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
    //-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions (below) in alphabetical order
    //-- NOTE to Developers (2015-05-13): 3) For READABILITY, please help to maintain double-spaces between functions declarations
    return _this;
};
