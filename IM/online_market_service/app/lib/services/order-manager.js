/**
 * Created by richardmaglaya on 2014-11-10.
 */
'use strict';

var http = require('http');
var async = require('async');
var pg = require('pg');
var Transaction = require('pg-transaction');
var accounting = require('accounting');

var defaultPageSize = 50;

var momentzone = require('moment-timezone');


var DISCOUNT_TYPE = {
    PERCENT_OFF: 'PERCENT_OFF',
    DOLLAR_OFF: 'DOLLAR_OFF'
};


var CheckIdsAreValidUUIDs = function (idsArray, callback) {
    var _this = exports;
    var _err='';
    for (var i in idsArray) {
        if(!(_this.dataGenerationHelper.isValidUUID(idsArray[i]))){
            _err = new _this.httpExceptions.InvalidParameterException('id', idsArray[i]);
        }
        if(_err!==''){
            break;
        }
    }
    callback(_err);
};


// var CheckIfFirstTimeAndGetOthers = function(receivedParams, headerToken, callback) {
//     var _this = exports;
//
//     var restaurantId = receivedParams.restaurantId,
//         userId = receivedParams.userId,
//         minimumBlueDollarToBuy = receivedParams.minimumBlueDollarToBuy,
//         orderId = receivedParams.orderId,
//         subTotal = receivedParams.subTotal,
//         useBlueDollars = receivedParams.useBlueDollars,
//         buyBlueDollars = receivedParams.buyBlueDollars,
//         lockBlueDollars = receivedParams.lockBlueDollars,
//         useGoldDollars = receivedParams.useGoldDollars,
//         flag = receivedParams.flag,
//         otherServers = receivedParams.otherServers,
//         order = receivedParams.order;
//
//     _this.logger.info('%j', {
//         function: 'DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers received arguments', receivedParams: receivedParams });
//
//     var selector, options, helper;
//     var discounts = [], firstTimeDiscount = 0, firstTimeDiscountValue = 0, otherDiscount = 0, otherDiscountValue = 0, blueDollars;
//     var lockedBlueDollars_others_consumers, lockedBlueDollars_others_restaurant , lockedBlueDollars_others_fandine;
//     var blueDollarsSelf = 0, blueDollarsOthers, blueDollarsDue;
//     var gst, tip = 0, tipRate = 0, blueDollarRate = 0, amount = 0, subTotalAfterDiscounts = 0;
//     var currencyCode, tax, goldDollars, canUseGoldDollars;
//     var isFirstTimeVisit = false;
//     var apiResult;
//
//     var country = _this.config.other_servers.country;
//     if (!country || (otherServers.region.north_america.indexOf(country) >-1)) {
//         country = _this.enums.RegionCode.NA;
//     } else {
//         country = _this.enums.RegionCode.CHINA;
//     }
//
//     async.series([
//
//         //-- Step 1: Verify if the userId is entitled to FirstTimeVisit discount
//         function(nextstep) {
//
//             /**
//              * NOTE: First-time visit discount apply only to those who haven't had any record of placing orders or paying orders in the restaurant
//              */
//             var selector = {
//                 status: {$in: ['CLOSED', 'PAID']},
//                 $and: [ {$or: [{'restaurant.restaurant_id': restaurantId}, {restaurantId: restaurantId} ]},
//                     {$or: [{'user.user_id': userId}, {'orderItems.order_item_user_id': userId} ]},
//                     {$or: [{'billStatus.status': 'PAID'}, {'bill_status.status': 'PAID'}]} ] };
//             var options = {};
//             var helper = { collectionName: 'dining-orders', callerScript: 'File: order-manager.js; Method: CheckIfFirstTimeAndGetOthers() step-1' };
//             _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
//                 if (error) {
//                     nextstep(error);
//                 } else {
//                     if (result.length > 0) {
//                         //todo hardcoding,need query from restaurant
//                         firstTimeDiscount = otherServers.other_rates.fandine_commission_rate_not_first_time;
//                         isFirstTimeVisit = false;
//                     } else {
//                         //todo hardcoding,need query from restaurant
//                         firstTimeDiscount = otherServers.other_rates.fandine_commission_rate_first_time;
//                         isFirstTimeVisit = true;
//                     }
//                     nextstep();
//                 }
//             });
//         },
//
//         //-- FBE-879: Step 2: Get the tipRate
//         function(nextstep) {
//
//             if (flag === 'getBillV2') {
//
//                 subTotalAfterDiscounts = subTotal;
//                 //-- Default is NA
//                 if (country && country === _this.enums.RegionCode.NA) {
//                     tipRate     = otherServers.other_rates.tip_rate_north_america;
//                 } else {
//                     tipRate     = otherServers.other_rates.tip_rate_china;
//                 };
//
//                 //-- For v2, this else-block is not needed anymore
//                 nextstep();
//
//             } else {
//                 _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers', userId: userId});
//
//                 selector = {'_id':orderId};
//                 options = {};
//                 helper = {collectionName: 'dining-orders'};
//                 _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
//                     if (error) {
//                         nextstep(error);
//                     } else if (result === null || result === '' || result.length === 0) {
//                         nextstep(new _this.httpExceptions.ResourceNotFoundException('_id', orderId));
//                     } else {
//                         if (result[0].hasOwnProperty('tip')) {
//                             tip = result[0].tip;
//                         } else {
//                             _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers order has no tip and then calculate it'});
//
//                             if (otherServers.region.north_america.indexOf(country) >- 1) {
//                                 tipRate = parseFloat(otherServers.other_rates.tip_rate_north_america, 10);
//                             } else {
//                                 tipRate = parseFloat(otherServers.other_rates.tip_rate_china, 10);
//                             }
//
//                             tip = parseFloat((parseFloat(subTotal.amount, 10) * tipRate).toFixed(2), 10);
//
//                         }
//
//                         if (subTotal.hasOwnProperty('currencyCode')) {
//                             currencyCode = subTotal.currencyCode;
//                         } else {
//                             currencyCode = 'USD';
//                         }
//
//                         if (result[0].hasOwnProperty('totalTax')) {
//                             tax = result[0].totalTax.amount;
//                         } else {
//                             _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers order has no tax'});
//                             tax = 0;
//                         }
//                         _this.logger.info('%j', {
//                             function: 'DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers tipRate,tip and tax %j',
//                             country: country, tipRate: tipRate, tip: tip,tax:tax });
//                         nextstep();
//                     }
//                 });
//             };
//
//         },
//
//         //-- FBE-879: Step 3: Get the Restaurant configuration regarding discounts
//         function(nextstep) {
//
//             if (flag === 'getBillV2') {
//                 //add  && country !== _this.enums.RegionCode.NA for FBE-2636,FBE-2632 and FBE-2574
//                 if (order && order.restaurant && order.restaurant.discounts && order.restaurant.discounts.length > 0  && country !== _this.enums.RegionCode.NA) {
//                     //-- NOTE: Refer to FBE-994 'discounts' object as well as MongoDB's 'discounts' collection
//                     var discountValue = 0;
//                     for (var i=0; i<order.restaurant.discounts.length; i++) {
//                         if (isFirstTimeVisit && order.restaurant.discounts[i]
//                             && order.restaurant.discounts[i].name === _this.enums.FirstTimeDiscountType.FIRST_TIME_VISIT
//                             && order.restaurant.discounts[i].value && order.restaurant.discounts[i].value > 0) {
//
//                             if (order.restaurant.discounts[i].discount_type === DISCOUNT_TYPE.PERCENT_OFF) {
//                                 firstTimeDiscount       = order.restaurant.discounts[i].value / 100;
//                                 discountValue           = subTotal * firstTimeDiscount;
//                                 firstTimeDiscountValue  += (subTotal * firstTimeDiscount);
//                                 isFirstTimeVisit        = false; //-- To avoid duplicate
//                                 discounts.push({ name: order.restaurant.discounts[i].name, value: discountValue });
//                             };
//                             if (order.restaurant.discounts[i].discount_type === DISCOUNT_TYPE.DOLLAR_OFF) {
//                                 firstTimeDiscount       = order.restaurant.discounts[i].value;
//                                 discountValue           = firstTimeDiscount;
//                                 firstTimeDiscountValue  += discountValue;
//                                 isFirstTimeVisit        = false; //-- To avoid duplicate
//                                 discounts.push({ name: order.restaurant.discounts[i].name, value: discountValue });
//                             };
//
//                         } else {
//                             firstTimeDiscount = 0;
//                             firstTimeDiscountValue = 0;
//                             if (order.restaurant.discounts[i].discount_type === DISCOUNT_TYPE.PERCENT_OFF
//                                 && order.restaurant.discounts[i].value > 0
//                                 && order.restaurant.discounts[i].name !== _this.enums.FirstTimeDiscountType.FIRST_TIME_VISIT) {
//                                 otherDiscount           = order.restaurant.discounts[i].value / 100;
//                                 discountValue           = subTotal * otherDiscount;
//                                 otherDiscountValue      += (subTotal * otherDiscount);
//                                 discounts.push({ name: order.restaurant.discounts[i].name, value: discountValue });
//                             };
//                             if (order.restaurant.discounts[i].discount_type === DISCOUNT_TYPE.DOLLAR_OFF
//                                 && order.restaurant.discounts[i].name !== _this.enums.FirstTimeDiscountType.FIRST_TIME_VISIT) {
//                                 otherDiscount           = order.restaurant.discounts[i].value;
//                                 discountValue           = otherDiscount;
//                                 otherDiscountValue      += discountValue;
//                                 discounts.push({ name: order.restaurant.discounts[i].name, value: discountValue });
//                             };
//
//                         };
//
//                     };
//
//                     subTotalAfterDiscounts = subTotalAfterDiscounts - (firstTimeDiscountValue + otherDiscountValue);
//
//                 };
//
//                 if (order && order.restaurant && order.restaurant.blue_dollars && order.restaurant.blue_dollars.length > 0) {
//                     for (var i=0; i<order.restaurant.blue_dollars.length; i++) {
//                         if (order.restaurant.blue_dollars[i].bdrr && order.restaurant.blue_dollars[i].bdrr > 0) {
//                             blueDollarRate = order.restaurant.blue_dollars[i].bdrr;
//                         };
//                     };
//                 };
//
//                 if (order.tip) {
//                     tip = order.tip;
//                 } else {
//                     tip = parseFloat(Number(subTotalAfterDiscounts * tipRate).toFixed(2));
//                 }
//                 amount = parseFloat(subTotalAfterDiscounts) * blueDollarRate / 100;
//
//                 _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers after step-3',
//                     subTotalAfterDiscounts: subTotalAfterDiscounts,
//                     firstTimeDiscount: firstTimeDiscount,
//                     firstTimeDiscountValue: firstTimeDiscountValue,
//                     otherDiscountValue: otherDiscountValue,
//                     blueDollarRate: blueDollarRate,
//                     tipRate: tipRate,
//                     tip: tip,
//                     amount: amount
//                 });
//
//                 //-- For v2, this else-block is not needed anymore
//                 nextstep();
//
//             } else {
//
//                 //-- For v1
//
//                 selector = {'_id':restaurantId};
//                 options = {};
//                 helper = {collectionName: 'restaurant'};
//
//                 _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers select restaurant',
//                     userId: userId });
//                 _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
//                     if (error) {
//                         nextstep(error);
//                     } else if (result === null || result === '' || result.length === 0) {
//                         nextstep(new _this.httpExceptions.ResourceNotFoundException('_id', restaurantId));
//                     } else {
//                         if (result[0].hasOwnProperty('discounts') && isFirstTimeVisit) {
//                             if (result[0].discounts[0] && result[0].discounts[0].value) {
//                                 firstTimeDiscount = result[0].discounts[0].value;
//                             } else {
//                                 firstTimeDiscount = 0;
//                             }
//                         } else {
//                             firstTimeDiscount = 0;
//                         }
//                         if (result[0].hasOwnProperty('blueDollars')) {
//                             if (result[0].blueDollars[0].bdrr) {
//                                 blueDollarRate = result[0].blueDollars[0].bdrr;
//                             } else {
//                                 blueDollarRate = 0;
//                             }
//                         } else {
//                             blueDollarRate = 0;
//                         }
//
//                         firstTimeDiscountValue = subTotal.amount * firstTimeDiscount/100;
//                         firstTimeDiscountValue = firstTimeDiscountValue.toFixed(2);
//                         firstTimeDiscountValue = parseFloat(firstTimeDiscountValue,10);
//                         firstTimeDiscount = parseFloat(parseInt(firstTimeDiscount,10)/100,10).toFixed(2);
//                         firstTimeDiscount = parseFloat(firstTimeDiscount,10);
//                         var subTotalAfterDis = subTotal.amount- firstTimeDiscountValue + tip + tax;
//                         amount = parseFloat(subTotalAfterDis*blueDollarRate/100);
//                         amount = parseFloat(amount.toFixed(2),10);
//                         nextstep();
//                     }
//                 });
//             };
//
//         },
//
//         //-- FBE-879: Step 4: Retrieve Blue Dollar from PostgreSQL
//         function(nextstep) {
//
//             if (useBlueDollars) {
//
//                 var blueDollarsParams = {
//                     restaurantId: restaurantId,
//                     userId: userId,
//                     orderId: orderId,
//                     amount: amount,
//                     buyBlueDollars: buyBlueDollars,
//                     lockBlueDollars: lockBlueDollars,
//                     currencyCode: order.restaurant.currency,
//                     minimumBlueDollarToBuy: minimumBlueDollarToBuy,
//                     flag: flag,
//                     otherServers: otherServers
//                 };
//
//                 _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers step-4 before getBlueDollars()', blueDollarsParams: blueDollarsParams });
//
//                 _this.getBlueDollars(blueDollarsParams,headerToken, function(error, result) {
//                     if (error) {
//                         nextstep(error);
//                     } else {
//                         if (result) {
//                             _this.logger.info('DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers GetBlueDollars result: %j', result);
//                             //-- Ratio of blueDollars to goldDollars is 10:9
//                             var blueDollarsRate = parseFloat(otherServers.other_rates.blue_dollar_rate, 10);
//
//                             blueDollars = result.lockedBlueDollars;
//                             blueDollars = parseFloat(blueDollars, 10);
//                             blueDollarsSelf = result.lockedBlueDollars_self;
//                             blueDollarsOthers = result.lockedBlueDollars_others;
//                             blueDollarsSelf = parseFloat(blueDollarsSelf, 10);
//                             blueDollarsOthers = parseFloat(blueDollarsOthers, 10);
//                             //todo blueDollar:cash = 10:9 now hard coding
//                             blueDollarsDue = parseFloat((blueDollarsOthers * blueDollarsRate).toFixed(2), 10);
//                             goldDollars = result.goldDollars;
//                             goldDollars = parseFloat(goldDollars, 10);
//
//                             lockedBlueDollars_others_consumers= parseFloat(result.lockedBlueDollars_others_consumers,10);
//                             lockedBlueDollars_others_restaurant= parseFloat(result.lockedBlueDollars_others_restaurant,10);
//                             lockedBlueDollars_others_fandine= parseFloat(result.lockedBlueDollars_others_fandine,10);
//
//                             if (useGoldDollars) {
//
//                                 if (country && country === _this.enums.RegionCode.NA ) {
//                                     canUseGoldDollars = 0;
//                                 } else {
//                                     if (flag === 'getBillV2') {
//                                         if((!order.payment.total_tax) || order.payment.total_tax===null || order.payment.total_tax===undefined){
//                                             order.payment.total_tax= 0;
//                                         }
//                                         if((!order.payment.tip) || order.payment.tip===null || order.payment.tip===undefined){
//                                             order.payment.tip= 0;
//                                         }
//                                         canUseGoldDollars = subTotal + order.payment.total_tax + order.payment.tip - firstTimeDiscountValue - blueDollarsSelf - blueDollarsOthers;
//                                     } else {
//                                         canUseGoldDollars = parseFloat(parseFloat(subTotal.amount, 10) + parseFloat(tax, 10) + parseFloat(tip, 10) - firstTimeDiscountValue - blueDollarsSelf - blueDollarsOthers, 10);
//                                     };
//
//                                     if (canUseGoldDollars > goldDollars) {
//                                         canUseGoldDollars = goldDollars;
//                                     };
//
//                                     canUseGoldDollars = parseFloat(canUseGoldDollars.toFixed(2),10);
//                                 }
//
//                                 _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers GetBlueDollars', goldDollars: goldDollars, canUseGoldDollars: canUseGoldDollars });
//
//                             } else {
//                                 canUseGoldDollars = 0;
//                             }
//
//                         } else {
//                             blueDollars = 0;
//                             blueDollarsSelf = 0;
//                             blueDollarsOthers = 0;
//                             blueDollarsDue = 0;
//                             goldDollars = 0;
//                             canUseGoldDollars = 0;
//                             lockedBlueDollars_others_consumers=0;
//                             lockedBlueDollars_others_restaurant= 0;
//                             lockedBlueDollars_others_fandine= 0;
//                         }
//                         nextstep();
//                     }
//                 });
//             } else {
//                 blueDollars = 0;
//                 blueDollarsSelf = 0;
//                 blueDollarsOthers = 0;
//                 blueDollarsDue = 0;
//                 goldDollars = 0;
//                 canUseGoldDollars = 0;
//                 lockedBlueDollars_others_consumers=0;
//                 lockedBlueDollars_others_restaurant= 0;
//                 lockedBlueDollars_others_fandine= 0;
//                 nextstep();
//             }
//
//         },
//         function(nextstep) {
//             //todo how to set gst and tip?
//             gst = 5;
//             apiResult = {
//                 firstTimeDiscount: firstTimeDiscount,
//                 blueDollars: blueDollars,
//                 blueDollars_self: blueDollarsSelf,
//                 blueDollars_others: blueDollarsOthers,
//                 blueDollars_due: blueDollarsDue,
//                 firstTimeDiscountValue: firstTimeDiscountValue,
//                 tipRate: tipRate,
//                 tip: tip,
//                 goldDollars: canUseGoldDollars,
//                 discounts: discounts,
//                 otherDiscountValue: otherDiscountValue,
//                 lockedBlueDollars_others_consumers:lockedBlueDollars_others_consumers,
//                 lockedBlueDollars_others_restaurant:lockedBlueDollars_others_restaurant,
//                 lockedBlueDollars_others_fandine:lockedBlueDollars_others_fandine
//             };
//             nextstep();
//         }
//     ], function(error) {
//         callback(error, apiResult);
//     });
// };


var CheckIfFirstTimeAndGetOthersV2 = function(receivedParams, headerToken, callback) {
    var _this = exports;

    var restaurantId = receivedParams.restaurantId,
        userId = receivedParams.userId,
        minimumBlueDollarToBuy = receivedParams.minimumBlueDollarToBuy,
        orderId = receivedParams.orderId,
        subTotal = receivedParams.subTotal,
        useBlueDollars = receivedParams.useBlueDollars,
        buyBlueDollars = receivedParams.buyBlueDollars,
        lockBlueDollars = receivedParams.lockBlueDollars,
        useGoldDollars = receivedParams.useGoldDollars,
        flag = receivedParams.flag,
        otherServers = receivedParams.otherServers,
        order = receivedParams.order;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers received arguments', receivedParams: receivedParams });

    var selector, options, helper;
    var discounts = [], firstTimeDiscount = 0, firstTimeDiscountValue = 0, otherDiscount = 0, otherDiscountValue = 0, blueDollars;
    var lockedBlueDollars_others_consumers, lockedBlueDollars_others_restaurant , lockedBlueDollars_others_fandine;
    var blueDollarsSelf = 0, blueDollarsOthers, blueDollarsDue;
    var gst, tip = 0, tipRate = 0, blueDollarRate = 0, amount = 0, subTotalAfterDiscounts = 0;
    var currencyCode, tax, goldDollars, canUseGoldDollars;
    var isFirstTimeOnlinePaymentVisit = false;
    var apiResult;

    var country = _this.config.other_servers.country;
    if (!country || (otherServers.region.north_america.indexOf(country) >-1)) {
        country = _this.enums.RegionCode.NA ;
    } else {
        country = _this.enums.RegionCode.CHINA;
    }

    async.series([

        //-- Step 1: Verify if the userId is entitled to FirstTimeVisit discount
        function(nextstep) {
            if(order && order.bill_status &&order.bill_status.is_first_time_online_payment ===true){
                isFirstTimeOnlinePaymentVisit = true;
            }else{
                if(order && order.billStatus &&order.billStatus.isFirstTimeOnlinePayment ===true){
                    isFirstTimeOnlinePaymentVisit = true;
                }else{
                    isFirstTimeOnlinePaymentVisit = false;
                }
            }
            nextstep();
        },

        //-- FBE-879: Step 2: Get the tipRate
        function (nextstep) {
            subTotalAfterDiscounts = subTotal;
            //-- Default is NA
            if (country && country === _this.enums.RegionCode.NA) {
                tipRate = otherServers.other_rates.tip_rate_north_america;
            } else {
                tipRate = otherServers.other_rates.tip_rate_china;
            }
            nextstep();

        },

        //-- FBE-879: Step 3: Get the Restaurant configuration regarding discounts
        function (nextstep) {
            //add  && country !== _this.enums.RegionCode.NA for FBE-2636,FBE-2632 and FBE-2574
            // if(isFirstTimeOnlinePaymentVisit ===true && country !== _this.enums.RegionCode.NA) {
            //     if (order && order.restaurant && order.restaurant.discounts && order.restaurant.discounts.length > 0) {
            //         //-- NOTE: Refer to FBE-994 'discounts' object as well as MongoDB's 'discounts' collection
            //         var discountValue = 0;
            //         for (var i = 0; i < order.restaurant.discounts.length; i++) {
            //             if (isFirstTimeOnlinePaymentVisit && order.restaurant.discounts[i]
            //                 && order.restaurant.discounts[i].name === _this.enums.FirstTimeDiscountType.FIRST_TIME_VISIT
            //                 && order.restaurant.discounts[i].value && order.restaurant.discounts[i].value > 0) {
            //
            //                 if (order.restaurant.discounts[i].discount_type === DISCOUNT_TYPE.PERCENT_OFF) {
            //                     firstTimeDiscount = order.restaurant.discounts[i].value / 100;
            //                     discountValue = subTotal * firstTimeDiscount;
            //                     firstTimeDiscountValue += (subTotal * firstTimeDiscount);
            //                     isFirstTimeOnlinePaymentVisit = false; //-- To avoid duplicate
            //                     discounts.push({name: order.restaurant.discounts[i].name, value: discountValue});
            //                 }
            //
            //                 if (order.restaurant.discounts[i].discount_type === DISCOUNT_TYPE.DOLLAR_OFF) {
            //                     firstTimeDiscount = order.restaurant.discounts[i].value;
            //                     discountValue = firstTimeDiscount;
            //                     firstTimeDiscountValue += discountValue;
            //                     isFirstTimeOnlinePaymentVisit = false; //-- To avoid duplicate
            //                     discounts.push({name: order.restaurant.discounts[i].name, value: discountValue});
            //                 }
            //             } else {
            //                 firstTimeDiscount = 0;
            //                 firstTimeDiscountValue = 0;
            //                 if (order.restaurant.discounts[i].discount_type === DISCOUNT_TYPE.PERCENT_OFF
            //                     && order.restaurant.discounts[i].value > 0
            //                     && order.restaurant.discounts[i].name !== _this.enums.FirstTimeDiscountType.FIRST_TIME_VISIT) {
            //                     otherDiscount = order.restaurant.discounts[i].value / 100;
            //                     discountValue = subTotal * otherDiscount;
            //                     otherDiscountValue += (subTotal * otherDiscount);
            //                     discounts.push({name: order.restaurant.discounts[i].name, value: discountValue});
            //                 }
            //
            //                 if (order.restaurant.discounts[i].discount_type === DISCOUNT_TYPE.DOLLAR_OFF
            //                     && order.restaurant.discounts[i].name !== _this.enums.FirstTimeDiscountType.FIRST_TIME_VISIT) {
            //                     otherDiscount = order.restaurant.discounts[i].value;
            //                     discountValue = otherDiscount;
            //                     otherDiscountValue += discountValue;
            //                     discounts.push({name: order.restaurant.discounts[i].name, value: discountValue});
            //                 }
            //             }
            //         }
            //         subTotalAfterDiscounts = subTotalAfterDiscounts - (firstTimeDiscountValue + otherDiscountValue);
            //     }
            // }else{
            //     firstTimeDiscount = 0;
            //     firstTimeDiscountValue = 0;
            // }

            firstTimeDiscount = 0;
            firstTimeDiscountValue = 0;

            if (order && order.restaurant && order.restaurant.blue_dollars && order.restaurant.blue_dollars.length > 0) {
                for (var i = 0; i < order.restaurant.blue_dollars.length; i++) {
                    if (order.restaurant.blue_dollars[i].bdrr && order.restaurant.blue_dollars[i].bdrr > 0) {
                        blueDollarRate = order.restaurant.blue_dollars[i].bdrr;
                    }
                }
            }
            if (!isNaN(order.tip)) {
                tip = order.tip;
            } else {
                tip = parseFloat(Number(subTotalAfterDiscounts * tipRate).toFixed(2));
            }
            amount = parseFloat(subTotalAfterDiscounts) * blueDollarRate / 100;

            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers after step-3',
                subTotalAfterDiscounts: subTotalAfterDiscounts,
                firstTimeDiscount: firstTimeDiscount,
                firstTimeDiscountValue: firstTimeDiscountValue,
                otherDiscountValue: otherDiscountValue,
                blueDollarRate: blueDollarRate,
                tipRate: tipRate,
                tip: tip,
                amount: amount
            });

            //-- For v2, this else-block is not needed anymore
            nextstep();

        },

        //-- FBE-879: Step 4: Retrieve Blue Dollar from PostgreSQL
        function(nextstep) {

            if (useBlueDollars) {
                var blueDollarsParams = {
                    restaurantId: restaurantId,
                    userId: userId,
                    orderId: orderId,
                    amount: amount,
                    buyBlueDollars: buyBlueDollars,
                    lockBlueDollars: lockBlueDollars,
                    currencyCode: order.restaurant.currency,
                    minimumBlueDollarToBuy: minimumBlueDollarToBuy,
                    flag: flag,
                    otherServers: otherServers
                };

                _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers step-4 before getBlueDollars()', blueDollarsParams: blueDollarsParams });

                _this.getBlueDollars(blueDollarsParams,headerToken, function(error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        if (result) {
                            _this.logger.info('DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers GetBlueDollars result: %j', result);
                            //-- Ratio of blueDollars to goldDollars is 10:9
                            var blueDollarsRate = parseFloat(otherServers.other_rates.blue_dollar_rate, 10);

                            blueDollars = result.lockedBlueDollars;
                            blueDollars = parseFloat(blueDollars, 10);
                            blueDollarsSelf = result.lockedBlueDollars_self;
                            blueDollarsOthers = result.lockedBlueDollars_others;
                            blueDollarsSelf = parseFloat(blueDollarsSelf, 10);
                            blueDollarsOthers = parseFloat(blueDollarsOthers, 10);
                            //todo blueDollar:cash = 10:9 now hard coding
                            blueDollarsDue = parseFloat((blueDollarsOthers * blueDollarsRate).toFixed(2), 10);
                            goldDollars = result.goldDollars;
                            goldDollars = parseFloat(goldDollars, 10);

                            lockedBlueDollars_others_consumers= parseFloat(result.lockedBlueDollars_others_consumers,10);
                            lockedBlueDollars_others_restaurant= parseFloat(result.lockedBlueDollars_others_restaurant,10);
                            lockedBlueDollars_others_fandine= parseFloat(result.lockedBlueDollars_others_fandine,10);

                            if (useGoldDollars) {

                                if (country && country === _this.enums.RegionCode.NA) {
                                    canUseGoldDollars = 0;
                                } else {
                                    if (flag === 'getBillV2') {
                                        if((!order.payment.total_tax) || order.payment.total_tax===null || order.payment.total_tax===undefined){
                                            order.payment.total_tax= 0;
                                        }
                                        if((!order.payment.tip) || order.payment.tip===null || order.payment.tip===undefined){
                                            order.payment.tip= 0;
                                        }
                                        canUseGoldDollars = subTotal + order.payment.total_tax + order.payment.tip - firstTimeDiscountValue - blueDollarsSelf - blueDollarsOthers;
                                    } else {
                                        canUseGoldDollars = parseFloat(parseFloat(subTotal.amount, 10) + parseFloat(tax, 10) + parseFloat(tip, 10) - firstTimeDiscountValue - blueDollarsSelf - blueDollarsOthers, 10);
                                    };

                                    if (canUseGoldDollars > goldDollars) {
                                        canUseGoldDollars = goldDollars;
                                    };

                                    canUseGoldDollars = parseFloat(canUseGoldDollars.toFixed(2),10);
                                }

                                _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.CheckIfFirstTimeAndGetOthers GetBlueDollars', goldDollars: goldDollars, canUseGoldDollars: canUseGoldDollars });

                            } else {
                                canUseGoldDollars = 0;
                            }

                        } else {
                            blueDollars = 0;
                            blueDollarsSelf = 0;
                            blueDollarsOthers = 0;
                            blueDollarsDue = 0;
                            goldDollars = 0;
                            canUseGoldDollars = 0;
                            lockedBlueDollars_others_consumers=0;
                            lockedBlueDollars_others_restaurant= 0;
                            lockedBlueDollars_others_fandine= 0;
                        }
                        nextstep();
                    }
                });
            } else {
                blueDollars = 0;
                blueDollarsSelf = 0;
                blueDollarsOthers = 0;
                blueDollarsDue = 0;
                goldDollars = 0;
                canUseGoldDollars = 0;
                lockedBlueDollars_others_consumers=0;
                lockedBlueDollars_others_restaurant= 0;
                lockedBlueDollars_others_fandine= 0;
                nextstep();
            }

        },
        function(nextstep) {
            //todo how to set gst and tip?
            gst = 5;
            apiResult = {
                firstTimeDiscount: firstTimeDiscount,
                blueDollars: blueDollars,
                blueDollars_self: blueDollarsSelf,
                blueDollars_others: blueDollarsOthers,
                blueDollars_due: blueDollarsDue,
                firstTimeDiscountValue: firstTimeDiscountValue,
                tipRate: tipRate,
                tip: tip,
                goldDollars: canUseGoldDollars,
                discounts: discounts,
                otherDiscountValue: otherDiscountValue,
                lockedBlueDollars_others_consumers:lockedBlueDollars_others_consumers,
                lockedBlueDollars_others_restaurant:lockedBlueDollars_others_restaurant,
                lockedBlueDollars_others_fandine:lockedBlueDollars_others_fandine
            };
            nextstep();
        }
    ], function(error) {
        callback(error, apiResult);
    });
};


var ConsumeLockedBlueDollars = function(orderId, blueDollars_due, currencyCode, otherServers, headerToken, callback) {
    var _this = exports;
    async.series([
        function(nextstep) {
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.ConsumeLockedBlueDollars step-1',
                orderId: orderId, blueDollars_due: blueDollars_due, currencyCode: currencyCode});

            var postData = {};

            postData.host = otherServers.reward.server_url;
            postData.port = otherServers.reward.server_port;
            postData.path = '/v1/orders/' + orderId + '/lockBlueDollars';
            var body = { 'currency': currencyCode ,
                'blueDollarAmount': blueDollars_due};

            postData.method = 'POST';
            _this.sendToReward(postData,headerToken, function (error, result) {
                if (error) {
                    if (error.fieldValue==='has no locked blue dollars') {
                        _this.logger.error('%j', {function: 'DEBUG-ERROR: Order-Manager.ConsumeLockedBlueDollars step-1 returns error',
                            error: 'has no locked blue dollars'});
                        nextstep();
                    } else {
                        _this.logger.error('%j', {function: 'DEBUG-ERROR: Order-Manager.ConsumeLockedBlueDollars step-1 returns error',
                            error: 'has error'});
                        nextstep(error);
                    }
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.ConsumeLockedBlueDollars step-1 returns right',
                        result: JSON.stringify(result)});
                    if (result.data !== null) {
                        nextstep();
                    } else {
                        nextstep();
                    }
                }
            }, body);
        }

    ],function(error) {
        callback(error, 'consume blue dollars success');
    });
};


var ConsumeGoldDollars = function(orderId, restaurantId, userId, currencyCode, consumeGoldDollars, otherServers, headerToken, callback) {
    var _this = exports;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Manager.ConsumeGoldDollars received arguments %j',
        orderId: orderId, restaurantId: restaurantId, userId: userId, currencyCode: currencyCode, consumeGoldDollars: consumeGoldDollars, otherServers: otherServers });

    async.series([
        function(nextstep) {

            if (consumeGoldDollars > 0) {
                var postData = {};
                postData.host = otherServers.reward.server_url;
                postData.port = otherServers.reward.server_port;
                postData.path = '/v1/users/u-' + userId + '/goldDollars';
                var body = {
                    'currency': currencyCode,
                    'amount': -(consumeGoldDollars),
                    'restaurantId': restaurantId,
                    'orderId': orderId,
                    'code': _this.enums.DollarSourceCode.GD002      // use gold dollar in an order
                };

                postData.method = 'POST';
                _this.sendToReward(postData,headerToken, function (error, result) {
                    if (error) {
                        if (error.fieldValue === 'has no locked blue dollars') {
                            _this.logger.error('%j', {function: 'DEBUG-ERROR: Order-Manager.ConsumeGoldDollars step-1 returns error',
                                error: 'has no locked blue dollars'});
                            nextstep();
                        } else {
                            _this.logger.error('%j', {function: 'DEBUG-ERROR: Order-Manager.ConsumeGoldDollars step-1 returns error',
                                error: 'has error'});
                            nextstep(error);
                        }
                    } else {
                        _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.ConsumeGoldDollars step-1 returns right',
                            result: JSON.stringify(result)});
                        if (result.data !== null) {
                            nextstep();
                        } else {
                            nextstep();
                        }
                    }
                }, body);
            } else {
                _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.ConsumeGoldDollars step-1 returns skip'});
                nextstep();
            }
        }

    ],function(error) {
        callback(error,'consume gold dollars success');
    });
};


var SendToChat = function(data, flag, otherServers, callback) {
    var _this = exports;

    var postData = {};
    postData.userId=data.userId;
    postData.orderId=data.orderId;
    postData.flag=flag;
    postData.restaurantId=data.restaurantId;
    postData.tableId = data.tableId;

    var opt = {
        method: 'POST',
        host: otherServers.chat.server_url,
        port: otherServers.chat.server_port
    };
    if (flag==='create') {
        _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.SendToChat in create tag'});

        postData = JSON.stringify(postData);
        opt.path= '/v1/room/'+data.restaurantId+'/order/'+data.orderId;
        opt.headers= { 'Content-Type': 'application/json'
        };
    }else if (flag==='addItem') {
        _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.SendToChat in flag tag'});

        postData.itemIds=data.itemIds;
        postData.servers=data.servers;
        postData.customers = data.customers;
        postData = JSON.stringify(postData);
        opt.path='/v1/room/'+data.restaurantId+'/order/'+data.orderId+'/item/'+data.itemIds[0];
        opt.headers= { 'Content-Type': 'application/json'
        };
    }
    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.SendToChat', opt: opt});

    var req = http.request(opt, function (res) {
        res.setEncoding('utf8');
        res.on('data',function(data) {
            var dataObj=JSON.parse(data);
            if (dataObj.errorCode) {
                callback(dataObj.errorCode,null);
            } else {
                callback(null,dataObj);
            }
        });

    });
    req.on('error', function(e) {
        _this.logger.error('%j', {function: 'DEBUG-ERROR: Order-Manager.SendToChat returns error', opt: JSON.stringify(opt), postData: JSON.stringify(postData)});
    });
    req.write(postData + '\n');
    req.end();


};


var GetGoldDollars = function(userId,currency,headerToken,otherServers,callback){
    var _this = exports;
    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager..GetGoldDollars'});
    var amount = 0;
    var postData = {};
    postData.host = otherServers.reward.server_url;
    postData.port = otherServers.reward.server_port;
    postData.path = '/v1/users/u-' + userId + '/goldDollars';
    postData.method = 'GET';
    _this.sendToReward(postData, headerToken, function(error, back_result){
        if (error) {
            _this.logger.error('%j', {function:'DEBUG-ERROR: Order-Manager..GetGoldDollars returns an error', error: error});
            callback(error);
        } else {
            _this.logger.info('%j', {function:'DEBUG-INFO: Order-Manager..GetGoldDollars returns right',currency:currency,back_result:back_result});
            for(var i = 0;i< back_result.length;i++){
                if(currency === back_result[i].currency){
                    amount = back_result[i].amount;
                }
            }
            callback(null, {amount:amount});
        }
    });
}

var GetBlueDollars = function(blueDollarsParams, headerToken, callback) {
    var _this = exports;
    var restaurantId = blueDollarsParams.restaurantId,
        userId = blueDollarsParams.userId,
        orderId = blueDollarsParams.orderId,
        amount = blueDollarsParams.amount,
        buyBlueDollars = blueDollarsParams.buyBlueDollars,
        lockBlueDollars = blueDollarsParams.lockBlueDollars,
        currencyCode = blueDollarsParams.currencyCode,
        minimumBlueDollarToBuy = blueDollarsParams.minimumBlueDollarToBuy,
        flag = blueDollarsParams.flag,
        otherServers = blueDollarsParams.otherServers;

    //-- Note for improvement: These parameters are unused: minimumBlueDollarToBuy,
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Manager.GetBlueDollars received arguments %j', blueDollarsParams: blueDollarsParams });

    var lockedBlueDollars,lockedBlueDollars_self,lockedBlueDollars_others,goldDollars;
    var lockedBlueDollars_others_consumers, lockedBlueDollars_others_restaurant , lockedBlueDollars_others_fandine;
    var apiResult;

    async.series([
        function(nextstep) {

            var postData={};
            postData.host = otherServers.reward.server_url;
            postData.port = otherServers.reward.server_port;
            postData.path = '/v1/orders/' + orderId + '/blueDollars';

            var body = {
                'amount': parseFloat(amount, 10),
                'userId': 'u-'+userId,
                'restaurantId': 'd-'+restaurantId,
                'buyBlueDollars': buyBlueDollars,
                'lockBlueDollars': lockBlueDollars,
                'goldDollarCurrency': currencyCode,
                'minimum_blueDollar_to_buy': otherServers.other_rates.blue_dollar_minimum_to_buy,
                'flag': flag
            };
            postData.method = 'PUT';

            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order-Manager.GetBlueDollars JSON body for \'/v1/orders/\' + orderId + \'/blueDollars\'', postData: postData });

            if (parseFloat(amount, 10) > 0) {
                _this.sendToReward(postData, headerToken, function(error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        _this.logger.info('%j', {
                            function: 'DEBUG-INFO: Order-Manager.GetBlueDollars Rewards API returns result %j', result: result });
                        if (result.hasOwnProperty('errorMsg')) {
                            lockedBlueDollars = 0;
                            lockedBlueDollars_self = 0;
                            lockedBlueDollars_others = 0;
                            lockedBlueDollars_others_consumers = 0;
                            lockedBlueDollars_others_restaurant = 0;
                            lockedBlueDollars_others_fandine = 0;
                            goldDollars = 0;
                            nextstep();
                        } else if (result[0].hasOwnProperty('lockedBlueDollars')) {
                            lockedBlueDollars = result[0].lockedBlueDollars;
                            lockedBlueDollars_self = result[0].lockedBlueDollars_self;
                            lockedBlueDollars_others = result[0].lockedBlueDollars_others;
                            lockedBlueDollars_others_consumers = result[0].lockedBlueDollars_others_consumers;
                            lockedBlueDollars_others_restaurant = result[0].lockedBlueDollars_others_restaurant;
                            lockedBlueDollars_others_fandine = result[0].lockedBlueDollars_others_fandine;

                            goldDollars = result[0].goldDollars;
                            nextstep();
                        } else {
                            lockedBlueDollars = 0;
                            lockedBlueDollars_self = 0;
                            lockedBlueDollars_others = 0;
                            lockedBlueDollars_others_consumers = 0;
                            lockedBlueDollars_others_restaurant = 0;
                            lockedBlueDollars_others_fandine = 0;
                            goldDollars = 0;
                            nextstep();
                        }

                    }

                }, body);
            } else {
                _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GetBlueDollars amount=0'});

                lockedBlueDollars = 0;
                lockedBlueDollars_self = 0;
                lockedBlueDollars_others = 0;
                lockedBlueDollars_others_consumers = 0;
                lockedBlueDollars_others_restaurant = 0;
                lockedBlueDollars_others_fandine = 0;
                goldDollars = 0;
                nextstep();
            }

        }

    ],function(error) {
        apiResult = {lockedBlueDollars:lockedBlueDollars,
            lockedBlueDollars_self:lockedBlueDollars_self,
            lockedBlueDollars_others:lockedBlueDollars_others,
            lockedBlueDollars_others_consumers:lockedBlueDollars_others_consumers,
            lockedBlueDollars_others_restaurant:lockedBlueDollars_others_restaurant,
            lockedBlueDollars_others_fandine:lockedBlueDollars_others_fandine,
            goldDollars:goldDollars};
        callback(error,apiResult);
    });
};


var GrantAndConsumeBlueDollars = function(userId, orderId, otherServers, headerToken, callback) {
    var _this = exports;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Manager.GrantAndConsumeBlueDollars received arguments %j', userId: userId, orderId: orderId, otherServers: otherServers });

    var order = {}, subTotal, restaurantId, blueDollars_due, currencyCode;
    var myBlueDollars_others, paymentFeeRate, paymentFee, blueDollarsDueAfterFee;
    var consume_goldDollars=0;
    var UseBDInFoodMarket = true;
    async.series([
        function(nextstep) {
            var selector = { '_id': orderId, $or: [{'customers.user_id': userId}, {'customers.userId': userId} ] };
            var options = { };
            var helper = { collectionName: 'dining-orders', callerScript: 'File: order-manager.js; Method: GrantAndConsumeBlueDollars()' };

            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order-Manager.GrantAndConsumeBlueDollars before restaurantDataAPI.find %j', selector: selector });

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('id', orderId));
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GetBlueDollars', result: JSON.stringify(result)});

                    order = result[0];

                    if (order.payment && order.payment.sub_total_after_discounts) {
                        //-- FBE-1151: [Order] Add a customized call to GET Bill v2 from GET Bill v1 for Stripe Payment
                        subTotal = order.payment.sub_total_after_discounts;
                        restaurantId = order.restaurant.restaurant_id;
                    } else {
                        subTotal = order.subTotal.amount - order.firstTimeDiscountValue;
                        restaurantId = order.restaurantId;
                    };

                    if (order.rewards && order.rewards.blue_dollar_user_need_to_pay) {
                        //-- FBE-1151: [Order] Add a customized call to GET Bill v2 from GET Bill v1 for Stripe Payment
                        blueDollars_due = order.rewards.blue_dollar_user_need_to_pay;
                        myBlueDollars_others = order.rewards.blue_dollar_bought_total;
                    } else {
                        //-- For V1
                        if (order.hasOwnProperty('myBlueDollars_due')) {
                            blueDollars_due = order.myBlueDollars_due;
                        }else if (order.hasOwnProperty('blue_dollar_due')) {
                            blueDollars_due = order.blue_dollar_due;
                        } else {
                            blueDollars_due = 0;
                        };
                        if (order.hasOwnProperty('myBlueDollars_others')) {
                            myBlueDollars_others = parseFloat(order.myBlueDollars_others, 10);
                        } else {
                            myBlueDollars_others = 0;
                        }
                    };


                    //paymentFeeRate = parseFloat(otherServers.other_rates.alipay_fee_rate,10);
                    paymentFeeRate = parseFloat(order.payment.online_transaction_charge_rate,10);
                    //modified by webber.wang 2015-06-02 for FBE-1076 begin
                    //paymentFee = parseFloat((paymentFeeRate * myBlueDollars_others).toFixed(2),10);
                    //blueDollarsDueAfterFee = parseFloat((blueDollars_due - paymentFee).toFixed(2),10);

                    var sold_rate =  parseFloat(otherServers.other_rates.ap_settlement_rate, 10);
                    blueDollarsDueAfterFee =parseFloat(( myBlueDollars_others * sold_rate * (1- paymentFeeRate)).toFixed(2),10);

                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GrantAndConsumeBlueDollars', alipayFee: paymentFee,
                        blueDollars_due: blueDollars_due, blueDollarsDueAfterFee: blueDollarsDueAfterFee});

                    _this.logger.info('%j', {
                        function: 'DEBUG-INFO: Order-Manager.GrantAndConsumeBlueDollars  calculate blueDollarsDueAfterFee %j',
                        paymentFee:paymentFee,
                        myBlueDollars_others:myBlueDollars_others,
                        sold_rate:sold_rate,
                        paymentFeeRate:paymentFeeRate,
                        formula1:'parseFloat(( myBlueDollars_others * sold_rate * (1- paymentFeeRate)).toFixed(2),10)',
                        formula2:'parseFloat(( '+myBlueDollars_others+' *'+ sold_rate+' * (1-'+ paymentFeeRate+')).toFixed(2),10)',
                        blueDollarsDueAfterFee:blueDollarsDueAfterFee });
                    //modified by webber.wang 2015-06-02 for FBE-1076 end

                    if (order.restaurant && order.restaurant.currency) {
                        currencyCode = order.restaurant.currency;
                    } else {
                        if (subTotal.hasOwnProperty('currencyCode')) {
                            currencyCode = subTotal.currencyCode;
                        } else {
                            currencyCode = 'CNY';
                        }
                    };

                    if (!blueDollarsDueAfterFee||parseFloat(blueDollarsDueAfterFee,10)< 0 ) {
                        blueDollarsDueAfterFee = 0;
                    }
                    //todo this gold_dollars is wrong sometimes.need to check.I think the root reason is related userId
                    if (order.rewards && order.rewards.gold_dollars) {
                        consume_goldDollars = order.rewards.gold_dollars;
                    } else {
                        if (order.hasOwnProperty('myGoldDollars')) {
                            consume_goldDollars = parseFloat(order.myGoldDollars, 10);
                        } else {
                            consume_goldDollars = 0;
                        }
                    };

                    nextstep();
                }
            });
        },
        function(nextstep){
            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order-Manager.GrantAndConsumeBlueDollars  grantBlueDollars online payment grant %j',
                food_market_shop:order.restaurant.liked,
                can_use_blue_dollars_in_food_market:_this.config.other_servers.food_market.generate_fandine_credit,
                order_id:orderId
            });
            if(order.restaurant.liked && _this.config.other_servers.food_market.generate_fandine_credit){
                UseBDInFoodMarket = false;
            }
            nextstep();
        },
        function(nextstep) {
            if((order.bill_status.is_online_payment === true || order.billStatus.isOnlinePayment === true)&& UseBDInFoodMarket ){
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order-Manager.GrantAndConsumeBlueDollars  grantBlueDollars online payment grant %j',
                    is_online_payment:order.bill_status.is_online_payment,
                    isOnlinePayment:order.billStatus.isOnlinePayment ,
                    can_use_blue_dollars_in_food_market:UseBDInFoodMarket});
                _this.grantBlueDollars(userId, orderId, restaurantId, subTotal,order, otherServers, headerToken,function(error) {
                    if (error) {
                        nextstep(error);
                    } else {
                        nextstep();
                    }
                });
            }else{
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order-Manager.GrantAndConsumeBlueDollars  grantBlueDollars offline payment not grant %j',
                    is_online_payment:order.bill_status.is_online_payment,
                    isOnlinePayment:order.billStatus.isOnlinePayment ,
                    can_use_blue_dollars_in_food_market:UseBDInFoodMarket});
                nextstep();
            }

        },
        function(nextstep) {
            _this.consumeLockedBlueDollars(orderId, blueDollarsDueAfterFee, currencyCode, otherServers, headerToken,function(error) {
                if (error) {
                    nextstep(error);
                } else {
                    nextstep();
                }
            });
        },
        function(nextstep) {
            _this.consumeGoldDollars(orderId, restaurantId, userId, currencyCode, consume_goldDollars, otherServers, headerToken,function(error) {
                if (error) {
                    nextstep(error);
                } else {
                    nextstep();
                }
            });
        },
        //FBE-1262 add by webber.wang 20150714
        function(nextstep){
            _this.logger.info('%j',{ function:'===33333333===DEBUG-INFO: Order-Manager',
                otherServers:otherServers
            });
            _this.logger.info('%j',{ function:'===33333333===DEBUG-INFO: Order-Manager',
                config: _this.config
            });
            if(otherServers.grant_goldDollars_to_servers){
                _this.grantGoldDollarToServers(userId,orderId,restaurantId,otherServers,headerToken,function(error){
                    if(error){
                        nextstep(error);
                    }else{
                        nextstep();
                    }
                })
            }else{
                nextstep();
            }
        }
    ],function(error) {
        callback(error,'success');
    });
};


var GrantBlueDollars = function(userId, orderId, restaurantId, subTotal, order, otherServers, headerToken, callback) {
    var _this = exports;
    var selector = {};
    var options = {};
    var helper = {collectionName: 'dining-orders'};
    var isFirstTimeVisit = false;
    // var subTotal,restaurantId;
    var recommender;
    var fandine_bule_dollar,recommender_blue_dollar;
    var subsTotal_float=0;
    var bluedollar_debt=0;
    async.series([

        function(nextstep) {

            if(order.bill_status.is_first_time_online_payment === true || order.billStatus.isFirstTimeOnlinePayment === true ){
                isFirstTimeVisit = true;
            }else{
                isFirstTimeVisit = false;
            }
            nextstep();
        },
        function(nextstep) {

            subsTotal_float = parseFloat(subTotal, 10);

            _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars', subsTotal_float: subsTotal_float});

            var fandineRate;
            if (isFirstTimeVisit) {
                //modified by webber.wang 2015-06-02 for FBE-1074 begin
                fandineRate = otherServers.other_rates.fandine_commission_rate_first_time + otherServers.other_rates.fandine_commission_rate_not_first_time;
                fandineRate = parseFloat(fandineRate.toFixed(2),10);
                //modified by webber.wang 2015-06-02 for FBE-1074 end
                var recommenderRate;
                if ((order.restaurant && order.restaurant.currency && (order.restaurant.currency === 'CAD'|| order.restaurant.currency === 'USD')) || (subTotal.currencyCode === 'CAD' || subTotal.currencyCode === 'USD')) {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars use US or CA rule'});
                    recommenderRate =  otherServers.other_rates.recommender_reward_rule_north_america;
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars use China rule'});
                    recommenderRate =  otherServers.other_rates.recommender_reward_rule_china;
                }
                fandine_bule_dollar = (parseFloat(subsTotal_float, 10) * parseFloat(fandineRate, 10)).toFixed(2);

                var temp1 = parseFloat(subsTotal_float, 10) * parseFloat(fandineRate, 10),
                    temp2 = parseFloat(subsTotal_float, 10) * parseFloat(fandineRate, 10);

                _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars calculating fandine commission and recommender`s reward',
                    subsTotal_float: subsTotal_float,
                    subTotalRate: temp1, subTotalRateRounded: temp2 });

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
                fandineRate = otherServers.other_rates.fandine_commission_rate_not_first_time;
                fandine_bule_dollar = (parseFloat(subsTotal_float,10)*parseFloat(fandineRate, 10)).toFixed(2);
                fandine_bule_dollar = parseFloat(fandine_bule_dollar,10);

                recommender_blue_dollar=0;
                nextstep();
            }
        },
        function (nextstep) {
            var postData = {};
            postData.host = otherServers.oauth.server_url;
            postData.port = otherServers.oauth.server_port;
            postData.path = '/v1/invitees/' + userId + '/inviters';

            postData.method = 'GET';
            _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars', userId:userId});
            _this.sendToOauthServer(postData, headerToken, null, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function: 'DEBUG-ERROR: Order-Manager.GrantBlueDollars returns error', error: error});
                    nextstep();
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars returns right', result: JSON.stringify(result)});
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
            });
        },
        function(nextstep){
            var still_bluedollar_debt = 0;
            var should_grant_bluedolalr = 0;
            var should_update_user =false;
            _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantBlueDollars  update user bluedollar_debt:before',
                still_bluedollar_debt: still_bluedollar_debt,
                should_grant_bluedolalr:should_grant_bluedolalr,
                should_update_user:should_update_user,
                recommender_blue_dollar:recommender_blue_dollar,
                bluedollar_debt:bluedollar_debt
            });

            if(bluedollar_debt>0 && bluedollar_debt >= recommender_blue_dollar && recommender){
                still_bluedollar_debt = bluedollar_debt - recommender_blue_dollar;
                should_grant_bluedolalr = 0;
                should_update_user = true;
            }else if(bluedollar_debt>0 && bluedollar_debt < recommender_blue_dollar  && recommender){
                still_bluedollar_debt =0  ;
                should_grant_bluedolalr = recommender_blue_dollar - bluedollar_debt;
                should_update_user = true;
            }else{
                should_update_user = false;
            }
            _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantBlueDollars  update user bluedollar_debt:',
                still_bluedollar_debt: still_bluedollar_debt,
                should_grant_bluedolalr:should_grant_bluedolalr,
                should_update_user:should_update_user,
                recommender_blue_dollar:recommender_blue_dollar,
                bluedollar_debt:bluedollar_debt,
                recommender:  recommender
            });
            if(should_update_user){
                recommender_blue_dollar = should_grant_bluedolalr;
                _this.updateUserBluedollarDebt(recommender,still_bluedollar_debt,otherServers,headerToken,function(error,result){
                    if (error) {
                        _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantBlueDollars  update user bluedollar_debt  : get error',
                            error: error});
                        nextstep(error);
                    } else {
                        _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantBlueDollars update user bluedollar_debt  : success',result:result});
                        nextstep();
                    }
                });
            }else{
                nextstep();
            }
        },
        function(nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars grant blue dollars === ',
                subsTotal_float: subsTotal_float, fandine_bule_dollar: fandine_bule_dollar, recommender_blue_dollar: recommender_blue_dollar,recommender:recommender });

            if (fandine_bule_dollar >0||(recommender_blue_dollar>0 && recommender)) {
                var postData = {};
                postData.host = otherServers.reward.server_url;
                postData.port = otherServers.reward.server_port;
                postData.path = '/v1/restaurants/d-' + restaurantId + '/blueDollars';
                var body = {}, grantBlueDollar = [];

                if (fandine_bule_dollar && fandine_bule_dollar>0) {
                    if( !recommender){
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars grant blue dollars === fandine====only fandine'});
                        grantBlueDollar.push({
                            'userId': 'fandine',
                            'amount': parseFloat((fandine_bule_dollar+recommender_blue_dollar).toFixed(2), 10),
                            'balanceType': 1,
                            'orderId': orderId,
                            'code': _this.enums.DollarSourceCode.BD103          // fandine get blue dollar
                        });
                    }else{
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars grant blue dollars === fandine====fandine and recommender'});
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
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars grant blue dollars === recommender====add recommender'});
                    grantBlueDollar.push({
                        'userId': 'u-' + recommender,
                        'amount': parseFloat(recommender_blue_dollar, 10),
                        'balanceType': 1,
                        'orderId': orderId,
                        'code': _this.enums.DollarSourceCode.BD102          // The invite user can get blue dollar once the invitee paid the order
                    });
                };

                if (grantBlueDollar.length>0) {
                    body = {
                        'grantBlueDollar': grantBlueDollar
                    };
                } else {
                    body = null;
                };

                if (body) {

                    _this.logger.info('%j', {
                        function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars before calling Rewards API with postData', postData: postData, body: body });

                    postData.method = 'POST';

                    _this.sendToReward(postData,headerToken, function (error, result) {
                        if (error) {
                            nextstep(error);
                        } else {
                            _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars grant blue dollars', result: JSON.stringify(result)});
                            if (result.data !== null) {
                                nextstep();
                            } else {
                                nextstep();
                            }
                        }
                    }, body);
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars skip'});
                    nextstep();
                }

            } else {
                _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GrantBlueDollars skip'});
                nextstep();
            }
        }

    ],function(error) {
        callback(error,'success');
    });
};


var GrantGoldDollarToServers = function(userId, orderId, restaurantId, otherServers, headerToken, callback) {
    var _this = exports;
    var selector = {};
    var options = {}, order = {};
    var helper = {collectionName: 'dining-orders'};
    var first_online_pay = false;
    var inviterUserId,is_restaurant_server=false,bluedollar_debt= 0,grant_golddollars=0;
    var restaurantIds=[];
    async.series([

        function(nextstep) {

            /**
             * NOTE: First-time visit discount apply only to those who haven't had any record of placing orders or paying orders in the restaurant
             */
            selector = {
                status: {$in: ['CLOSED', 'PAID']},
                $and: [ {$or: [{'billStatus.userId': userId}, {'bill_status.user_id': userId} ]},
                    {$or: [{'billStatus.isOnlinePayment': true}, {'bill_status.isOnlinePayment': true} ]}
                ]
            };
            options = { fields :{_id:1}};
            helper = {collectionName: 'dining-orders'};
            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
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
            postData.host = otherServers.oauth.server_url;
            postData.port = otherServers.oauth.server_port;
            postData.path = '/v1/invitees/' + userId + '/inviters';

            postData.method = 'GET';
            _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServers step2 check the user\'s inviters  post data',postData: postData});
            _this.sendToOauthServer(postData, headerToken, null, function (error, result) {
                if (error) {
                    _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServers step2 check the user\'s inviters : get error+ has no inviter',
                        error: error});
                    is_restaurant_server = false;
                    nextstep();
                } else {
                    _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServers step2 check the user\'s inviters :result',
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
                    if(result.restaurant_ids || result.restaurant_ids.length >0){
                        restaurantIds = result.restaurant_ids;
                    }else{
                        is_restaurant_server =false;
                    }
                    bluedollar_debt = bluedollar_debt + otherServers.consume_blueDollar_amount_from_server;
                    grant_golddollars =  otherServers.grant_goldDollar_amount_to_server;

                    nextstep();
                }
            });
        },
        function(nextstep){
            _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServers  step3 check the server restaurant status: before',
                is_restaurant_server:is_restaurant_server,restaurantIds:restaurantIds});
            if(is_restaurant_server){
                selector = {_id:{$in:restaurantIds},  "status" : "published","active_status": {"$ne":"INACTIVE"},confirmed_inviter:{$exists:true} };
                options = { fields :{_id:1}};
                helper = {collectionName: 'restaurant'};
                _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                    if (error) {
                        nextstep(error);
                    } else if (result === null || result === '' || result.length ===0) {
                        is_restaurant_server = false;
                        _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServers  step3 check the server restaurant status:no active restaurant'});
                        nextstep();

                    } else {
                        _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServers  step3 check the server restaurant status:has active restaurant'});
                        nextstep();
                    }
                });
            }else{
                nextstep();
            }
        },
        function(nextstep) {
            _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantGoldDollarToServers step4 grant gold dollars and consume related blue dollars=== ',
                bluedollar_debt: bluedollar_debt, grant_golddollars: grant_golddollars, is_restaurant_server: is_restaurant_server,inviterUserId:inviterUserId ,first_online_pay:first_online_pay});

            if(is_restaurant_server && first_online_pay){
                _this.grantGoldDollarsToServer(inviterUserId,grant_golddollars,bluedollar_debt, otherServers,headerToken,function(error,result){
                    if(error){
                        nextstep(error);
                    }else{
                        nextstep();
                    }
                });
            }else{
                _this.logger.info('%j',
                    { function: 'DEBUG-INFO: Order-Manager.GrantGoldDollarToServers step4 grant gold dollars and consume related blue dollars=== not first time,skip'});
                nextstep()
            }
        }
    ],function(error) {
        callback(error,'GrantGoldDollarToServers success');
    });
};


var GrantGoldDollarsToServer = function(userId, grant_gold_dollars, blue_dollar_debt, otherServers, headerToken, callback) {
    var _this = exports;
    var userId,inviteeUserId;
    var should_consume_amount= 0,still_remain_amount= 0,gold_dollars=0;
    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantGoldDollarsToServer received arguments',
        userId: userId,grant_gold_dollars:grant_gold_dollars,blue_dollar_debt:blue_dollar_debt,otherServers:otherServers, headerToken:headerToken});
    _this.logger.info('%j', { function: 'DEBUG-INFO:  Order-Manager.GrantGoldDollarsToServer config files',
        connection_string: otherServers.postgre_sql.connection_string });
    var client = new pg.Client(otherServers.postgre_sql.connection_string) ;
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
            tx.begin(function(error) {
                if(error) {
                    nextstep(error);
                }else {
                    nextstep();
                }
            })
        },
        function(nextstep){

            var queryString = 'SELECT sum(balance_amount - locked_amount) remain_amount  from t_user_bluedollar_balance WHERE user_id = $1';
            var argArray=['u-'+userId];
            var amount = parseInt(blue_dollar_debt * 100,10);
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
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantGoldDollarsToServer step1 query result',
                            remain_amount: remain_amount,amount:amount,should_consume_amount:should_consume_amount,still_remain_amount:still_remain_amount });
                    }else{
                        should_consume_amount = 0;
                        still_remain_amount = amount;
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantGoldDollarsToServer step1 query result: no result',
                            should_consume_amount:should_consume_amount,still_remain_amount:still_remain_amount });
                    }
                    nextstep();
                }
            });
        },
        function (nextstep) {
            _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServer step2 grant gold dollar to server'});
            gold_dollars = parseInt(grant_gold_dollars * 100,10);
            var functionName = 'grant_or_consume_gold_dollar';
            var argArray = [
                {type: 'VARCHAR', value: 'u-'+userId},
                {type: 'VARCHAR', value: 'CNY'},
                {type: 'INTEGER', value: gold_dollars},
                {type: 'VARCHAR', value: 'fandine'},
                {type: 'VARCHAR', value: 'orderId'},
                {type: 'VARCHAR', value: _this.enums.DollarSourceCode.GD102}        // Invite reward
            ];
            _this.restaurantDataAPI_PG.executeFunction(client, functionName, argArray, function (error, result) {
                if (error) {
                    nextstep(error);
                } else {
                    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GrantGoldDollarToServer step2', result: JSON.stringify(result.rows)});
                    apiResult = {status: 201, data: {data: 'grant_or_consume_gold_dollar execute success'}};
                    nextstep();
                }
            });

        },
        function (nextstep) {
            _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServer step3 consume blue dollar from server',should_consume_amount:should_consume_amount});
            if(should_consume_amount>0){
                var functionName = 'consume_blue_dollar_self_server';
                var argArray = [
                    {type: 'VARCHAR', value: 'u-'+userId},
                    {type: 'VARCHAR', value: 'fandine'},
                    {type: 'INTEGER', value: should_consume_amount},
                    {type: 'VARCHAR', value: 'orderId'},
                    {type: 'VARCHAR', value: _this.enums.DollarSourceCode.BD003}
                ];
                _this.restaurantDataAPI_PG.executeFunction(client, functionName, argArray, function (error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GrantGoldDollarToServer step3', result: JSON.stringify(result.rows)});
                        apiResult = {status: 201, data: {data: 'consume_blue_dollar_self_server execute success'}};
                        nextstep();
                    }
                });
            }else{
                _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServer step3 consume blue dollar from server,should_consume_amount=0 skip'});
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
            _this.updateUserBluedollarDebt(userId,still_remain_amount,otherServers,headerToken,function(error,result){
                if (error) {
                    _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServers step4 update user bluedollar_debt  : get error',
                        error: error});
                    nextstep(error);
                } else {
                    _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServers step4 update user bluedollar_debt  : success',result:result});
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


var PagingFunction = function(options, from, pageSize, methodName){
    if(methodName === 'GetOrdersByUserId'){
        if(undefined === from || '' === from || 0 >= parseInt(from) || isNaN(from)){
            from = 1;
        }
    } else {
        if(undefined === pageSize || '' === pageSize || isNaN(pageSize)){
            pageSize = defaultPageSize;
        }
        if(undefined === from || '' === from || 0 >= parseInt(from) || isNaN(from)){
            from = 1;
        }
    }

    options.skip = (parseInt((from - 1) * pageSize));
    options.limit =(parseInt(pageSize));

};


var UpdateUserBluedollarDebt = function(userId, amount, otherServers, headerToken, callback){
    var _this = exports;
    var postData = {};
    postData.host = otherServers.oauth.server_url;
    postData.port = otherServers.oauth.server_port;
    postData.path = '/v1/users/' + userId + '/profile';

    var body = {bluedollar_debt:amount};
    postData.method = 'PUT';
    _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServer step4 update user bluedollar_debt : post data',postData: postData,body:body});
    _this.sendToReward(postData, headerToken,function (error, result) {
        if (error) {
            _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServers step4 update user bluedollar_debt  : get error',
                error: error});
            callback(error,null);
        } else {
            _this.logger.info('%j',{ function:'DEBUG-INFO: Order-Manager.GrantGoldDollarToServers step4 update user bluedollar_debt  : success'});
            callback(null,'update user bluedollar debt success');
        }
    },body);

}


//-- FBE-1734: Deprecate GET Bill v1, redirect the call to GET Bill v2; then reformat GET Bill v2 Response for v1
var ReformatBillResponseToV1 = function (order) {

    var formattedOrder = {};

    if (!order.ownerId && order.owner_id) {
        formattedOrder.ownerId = order.owner_id;
    } else {
        formattedOrder.ownerId = order.ownerId;
    };
    if (order.user) { formattedOrder.user = order.user; };
    if (!order.status && order.order_status) {
        formattedOrder.status = order.order_status;
    } else {
        formattedOrder.status = order.status;
    };
    if (!order.restaurantId && order.restaurant && order.restaurant.restaurant_id) {
        formattedOrder.restaurantId = order.restaurant.restaurant_id;
    } else {
        formattedOrder.restaurantId = order.restaurantId;
    };
    if (!order.restaurant_name && order.restaurant && order.restaurant.restaurant_name) {
        formattedOrder.restaurant_name = order.restaurant.restaurant_name;
    } else {
        formattedOrder.restaurant_name = order.restaurant_name;
    };
    if (!order.restaurant_official_phone && order.restaurant && order.restaurant.officialPhone) {
        formattedOrder.restaurant_official_phone = order.restaurant.officialPhone;
    } else {
        formattedOrder.restaurant_official_phone = '';
    }
    if (!order.restaurant_logo && order.restaurant && order.restaurant.restaurant_logo) {
        formattedOrder.restaurant_logo = {
            filename: '',
            path: order.restaurant.restaurant_logo
        };
    } else {
        formattedOrder.restaurant_logo = order.restaurant_logo;
    };

    //-- Common Attributes
    if (order.receipt_printed) { formattedOrder.receipt_printed = order.receipt_printed; }
    //-- remarks
    if (order.remarks) { formattedOrder.remarks = order.remarks } else { formattedOrder.remarks = []; };
    //-- billStatus
    if (order.bill_status) {
        formattedOrder.billStatus = {
            userId :                    order.bill_status.user_id,
            userName :                  order.bill_status.user_name,
            status :                    order.bill_status.status,
            lock_time :                 order.bill_status.lock_time,
            lock_duration_mins :        order.bill_status.lock_duration_mins,
            minimum_blueDollar_to_buy : null,
            isOnlinePayment :           order.bill_status.is_online_payment || false
        };
    } else {
        formattedOrder.remarks.push({
            v1_attribute: 'billStatus',
            message: 'Does not exists: v2.order.bill_status'
        });
    };
    //-- tip
    if (order.payment && order.payment.tip) {
        formattedOrder.tip = order.payment.tip;
    } else {
        formattedOrder.tip = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'tip',
            message: 'Does not exists: v2.order.payment.tip'
        });
    };
    //-- subTotal
    if (order.payment && order.payment.sub_total_before_first_visit_savings) {
        formattedOrder.subTotal = {
            amount: order.payment.sub_total_before_first_visit_savings,
            currencyCode: order.restaurant.currency
        };
    } else {
        formattedOrder.subTotal = {
            amount: 0,
            currencyCode: order.restaurant.currency
        };
        formattedOrder.remarks.push({
            v1_attribute: 'subTotal',
            message: 'Does not exists: v2.order.payment.sub_total_before_first_visit_savings'
        });
    };
    //-- total
    if (order.payment && order.payment.grand_total_to_pay) {
        formattedOrder.total = {
            amount: order.payment.grand_total_to_pay,
            currencyCode: order.restaurant.currency
        };
    } else {
        formattedOrder.total = {
            amount: 0,
            currencyCode: order.restaurant.currency
        };
        formattedOrder.remarks.push({
            v1_attribute: 'total',
            message: 'Does not exists: v2.order.payment.grand_total_to_pay'
        });
    };
    //-- totalTax
    if (order.payment && order.payment.total_tax) {
        formattedOrder.totalTax = {
            amount:         order.payment.total_tax,
            currencyCode:   order.restaurant.currency
        };
    } else {
        formattedOrder.totalTax = {
            amount:         0,
            currencyCode: order.restaurant.currency
        };
        formattedOrder.remarks.push({
            v1_attribute: 'totalTax',
            message: 'Does not exists: v2.order.payment.total_tax'
        });
    };
    if (!order.isServer && order.is_server) { formattedOrder.isServer = order.is_server; } else { formattedOrder.isServer = order.isServer; };
    if (!order.batchNo && order.current_batch_number) { formattedOrder.batchNo = order.current_batch_number; } else { formattedOrder.batchNo = order.batchNo; };
    if (!order.tableId && order.table_id) { formattedOrder.tableId = order.table_id; } else { formattedOrder.tableId = order.tableId };
    //-- discount
    if (order.payment && order.payment.total_discounts) {
        formattedOrder.discount = {
            amount : order.payment.total_discounts,
            currencyCode: order.restaurant.currency
        };
    } else {
        formattedOrder.discount = {
            amount:         0,
            currencyCode: order.restaurant.currency
        };
        formattedOrder.remarks.push({
            v1_attribute: 'discount',
            message: 'Does not exists: v2.order.payment.discount'
        });
    };
    //-- serviceCharge
    if (order.payment && order.payment.credit_service_charge) {
        formattedOrder.serviceCharge = {
            amount : order.payment.credit_service_charge,
            currencyCode: order.restaurant.currency
        };
    } else {
        formattedOrder.serviceCharge = {
            amount:         0,
            currencyCode: order.restaurant.currency
        };
        formattedOrder.remarks.push({
            v1_attribute: 'serviceCharge',
            message: 'Does not exists: v2.order.payment.credit_service_charge'
        });
    };

    //-- Rewards Attributes
    //-- firstTimeDiscount
    if (order.rewards && order.rewards.first_time_discount_rate !== 'undefined') {
        formattedOrder.firstTimeDiscount = order.rewards.first_time_discount_rate;
    } else {
        formattedOrder.firstTimeDiscount = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'firstTimeDiscount',
            message: 'Does not exists: v2.order.rewards.first_time_discount_rate'
        });
    };
    //-- firstTimeDiscountValue
    if (order.rewards && order.rewards.first_time_discount_value !== 'undefined') {
        formattedOrder.firstTimeDiscountValue = order.rewards.first_time_discount_value;
    } else {
        formattedOrder.firstTimeDiscountValue = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'firstTimeDiscountValue',
            message: 'Does not exists: v2.order.rewards.first_time_discount_value'
        });
    };
    //-- myBlueDollars
    if (order.rewards && order.rewards.blue_dollars !== 'undefined') {
        formattedOrder.myBlueDollars = order.rewards.blue_dollars;
    } else {
        formattedOrder.myBlueDollars = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'myBlueDollars',
            message: 'Does not exists: v2.order.rewards.blue_dollars'
        });
    };
    //-- myBlueDollars_self
    if (order.rewards && order.rewards.blue_dollar_user_owned !== 'undefined') {
        formattedOrder.myBlueDollars_self = order.rewards.blue_dollar_user_owned;
    } else {
        formattedOrder.myBlueDollars_self = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'myBlueDollars_self',
            message: 'Does not exists: v2.order.rewards.blue_dollar_user_owned'
        });
    };
    //-- myBlueDollars_others
    if (order.rewards && order.rewards.blue_dollar_bought_total !== 'undefined') {
        formattedOrder.myBlueDollars_others = order.rewards.blue_dollar_bought_total;
    } else {
        formattedOrder.myBlueDollars_others = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'myBlueDollars_others',
            message: 'Does not exists: v2.order.rewards.blue_dollar_bought_total'
        });
    };
    //-- myBlueDollars_due
    if (order.rewards && order.rewards.blue_dollar_user_need_to_pay !== 'undefined') {
        formattedOrder.myBlueDollars_due = order.rewards.blue_dollar_user_need_to_pay;
    } else {
        formattedOrder.myBlueDollars_due = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'myBlueDollars_due',
            message: 'Does not exists: v2.order.rewards.blue_dollar_user_need_to_pay'
        });
    };
    //-- myGoldDollars
    if (order.payment && order.payment.gold_dollar_amount_paid !== 'undefined') {
        formattedOrder.myGoldDollars = order.payment.gold_dollar_amount_paid;
    } else {
        formattedOrder.myGoldDollars = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'myGoldDollars',
            message: 'Does not exists: v2.order.payment.gold_dollar_amount_paid'
        });
    };

    //-- TimeStamps
    if (!order.lastmodified && order.update_time) {
        formattedOrder.lastmodified = order.update_time;
    } else {
        formattedOrder.lastmodified = order.lastmodified
    };
    if (!order.submitTime && order.submit_time) {
        formattedOrder.submitTime = order.submit_time;
    } else {
        formattedOrder.submitTime = order.submitTime;
    };
    if (!order.closeTime && order.close_time) {
        formattedOrder.closeTime = order.close_time;
    } else {
        formattedOrder.closeTime = order.closeTime;
    };
    if (!order.createDate && order.create_time) {
        formattedOrder.createDate = order.create_time;
    } else {
        formattedOrder.createDate = order.createDate;
    };
    if (!order.lastUpdateTime && order.update_time) {
        formattedOrder.lastUpdateTime = order.update_time;
    } else {
        formattedOrder.lastUpdateTime = order.lastUpdateTime;
    };

    if (!order.cancelTime && order.cancel_time) {
        formattedOrder.cancelTime = order.cancel_time;
    } else {
        formattedOrder.cancelTime = order.cancelTime;
    };
    if (!order.startTime && order.start_time) {
        formattedOrder.startTime = order.start_time;
    } else {
        formattedOrder.startTime = order.startTime;
    };

    //-- Arrays
    if (order.order_items && order.order_items.length>0) {
        formattedOrder.orderItems = [];
        var amount = 0;
        for (var o = 0; o < order.order_items.length; o++) {
            if (order.orderItems[o].itemName && order.orderItems[o].price && order.orderItems[o].price.amount) {
                //-- FBE-1862: Missing order Item's itemName attribute in GET Bill
                //-- Means this Order object is based from v1 Order Schema
                formattedOrder.orderItems.push({
                    order_item_id:      order.orderItems[o].order_item_id,
                    order_item_user_id: order.orderItems[o].order_item_user_id,
                    itemId:             order.orderItems[o].itemId,
                    itemName:           order.orderItems[o].itemName,
                    type:               order.orderItems[o].type,
                    quantity:           order.orderItems[o].quantity,
                    seat:               order.orderItems[o].seat,
                    category:           order.orderItems[o].category,
                    price:  {
                        amount:         order.orderItems[o].price.amount,
                        currencyCode:   order.restaurant.currency
                    },
                    submission_time:    order.orderItems[o].submission_time,
                    order_item_batch_no:order.orderItems[o].order_item_batch_no
                });
            } else {
                //-- Means this Order object is based from v2 Order Schema
                if (order.order_items[o].price.amount) { amount = order.order_items[o].price.amount; }
                else if (order.order_items[o].per_unit_regular_price) { amount = order.order_items[o].per_unit_regular_price; }
                else if (order.order_items[o].per_unit_personalized_price) { amount = order.order_items[o].per_unit_personalized_price; }
                else if (order.order_items[o].fix_regular_price) { amount = order.order_items[o].fix_regular_price; }
                else if (order.order_items[o].fix_personalized_price) { amount = order.order_items[o].fix_personalized_price; }
                formattedOrder.orderItems.push({
                    order_item_id:      order.order_items[o].order_item_id,
                    order_item_user_id: order.order_items[o].order_item_user_id,
                    itemId:             order.order_items[o].menu_item_id,
                    itemName:           order.order_items[o].menu_item_name,
                    type:               order.order_items[o].menu_item_type,
                    quantity:           order.order_items[o].quantity,
                    seat:               order.order_items[o].seat_number,
                    category:           order.order_items[o].category,
                    price:  {
                        amount:         amount,
                        currencyCode:   order.restaurant.currency
                    },
                    submission_time:    order.order_items[o].submission_time,
                    order_item_batch_no:order.order_items[o].order_item_batch_number
                });
            }

        }
    };
    if (order.customers && order.customers.length > 0) {
        formattedOrder.customers = [];
        for (var c = 0; c < order.customers.length; c++) {
            if (order.customers[c].user_id) {
                //-- The order is based on v2 schema
                formattedOrder.customers.push({
                    userId:     order.customers[c].user_id,
                    userName:   order.customers[c].user_name,
                    avatarPath: order.customers[c].avatar_path
                });
            } else if (order.customers[c].userId) {
                //-- The order is either based on v1 schema or hybrid of v1 and v2
                formattedOrder.customers.push(order.customers[c]);
            };
        };
    };
    if (order.servers && order.servers.length > 0) {
        formattedOrder.servers = [];
        for (var s = 0; s < order.servers.length; s++) {
            if (order.servers[s].user_id) {
                //-- The order is based on v2 schema
                formattedOrder.servers.push({
                    userId:     order.servers[s].user_id,
                    userName:   order.servers[s].user_name,
                    avatarPath: order.servers[s].avatar_path
                });
            } else if (order.servers[s].userId) {
                //-- The order is either based on v1 schema or hybrid of v1 and v2
                formattedOrder.servers.push(order.servers[s]);
            };
        };
    };
    formattedOrder.v = order.v;

    return formattedOrder;
};


var ReformatBillResponseToV2 = function (orderToBeFormatted) {
    var _this = exports;
    var formattedOrder = {}

    if (orderToBeFormatted.payment) {
        var payment = orderToBeFormatted.payment;
        for(var key in payment){
            var value = payment[key];
            if (typeof value === 'number' && isNaN(value) === false) {
                payment[key] = parseFloat(accounting.toFixed(value, 2), 10);
            }
        }
    }

    /**
     * NOTE: the business rule for this has not been finalized yet as of 2015-09-14
     */

    return orderToBeFormatted;
};


var ReformatBillResponseToV2Simplified = function (order) {
    var _this = exports;
    var formattedOrder = {};

    if (order.order_no) {
        formattedOrder.order_no =  order.order_no;
    }

     if (order.batch_no) {
         formattedOrder.batch_no = order.batch_no;
     }

    formattedOrder.table_id =  order.tableId;
    formattedOrder.table_no =  order.tableNo;

    if (!order.ownerId && order.owner_id) {
        formattedOrder.owner_id = order.owner_id;
    } else {
        formattedOrder.owner_id = order.ownerId;
    };

    if (order.user) {
        formattedOrder.user = order.user;
    };

    if (order.note) {
        formattedOrder.note = order.note;
    }

    if (!order.restaurantId && order.restaurant && order.restaurant.restaurant_id) {
        formattedOrder.restaurant_id = order.restaurant.restaurant_id;
    } else {
        formattedOrder.restaurant_id = order.restaurantId;
    };
    if (!order.restaurant_name && order.restaurant && order.restaurant.restaurant_name) {
        formattedOrder.restaurant_name = order.restaurant.restaurant_name;
    } else {
        formattedOrder.restaurant_name = order.restaurant_name;
    };
    if (!order.restaurant_official_phone && order.restaurant && order.restaurant.officialPhone) {
        formattedOrder.restaurant_official_phone = order.restaurant.officialPhone;
    } else {
        formattedOrder.restaurant_official_phone = '';
    }
    if (!order.restaurant_logo && order.restaurant && order.restaurant.restaurant_logo) {
        formattedOrder.restaurant_logo = {
            filename: '',
            path: order.restaurant.restaurant_logo
        };
    } else {
        formattedOrder.restaurant_logo = order.restaurant_logo;
    };
    formattedOrder.restaurant_addresses = order.restaurant.addresses;
    formattedOrder.restaurant_officalPhone = order.restaurant.officalPhone;
    if(order.customers){
        formattedOrder.customers_count = order.customers.length;
    } else {
        formattedOrder.customers_count = 1;
    };
    formattedOrder.remarks = [];
    //-- Arrays
    if (order.order_items && order.order_items.length>0) {
        formattedOrder.order_items = [];
        var amount = 0,photo;
        for (var o = 0; o < order.order_items.length; o++) {
            if (order.order_items[o].price.amount) { amount = order.order_items[o].price.amount; }
            else if (order.order_items[o].per_unit_regular_price) { amount = order.order_items[o].per_unit_regular_price; }
            else if (order.order_items[o].per_unit_personalized_price) { amount = order.order_items[o].per_unit_personalized_price; }
            else if (order.order_items[o].fix_regular_price) { amount = order.order_items[o].fix_regular_price; }
            else if (order.order_items[o].fix_personalized_price) { amount = order.order_items[o].fix_personalized_price; }
            photo = '';
            if(order.order_items[o].menu_item_photo){
                photo = order.order_items[o].menu_item_photo
            }else{
                if(order.order_items[o].photos && order.order_items[o].photos.length >0 ){
                    for(var i=0;i< photo.length;i++){
                        var photo = photo[i];
                        if (photo[i].size == 'small') {
                            photo = photo[i].path || '';
                            break;
                        }
                    }
                    if(photo === ''){
                        photo = order.order_items[o].photos[0].path;
                    }
                }else{
                    photo = '';
                }
            }

            if (order.order_items[o].item_names && order.order_items[o].item_names.length > 0) {
                for (var i=0; i<order.order_items[o].item_names.length; i++) {
                    var orderItemName = order.order_items[o].item_names[i];
                    if (order.locale === orderItemName.locale) {
                        order.order_items[o].item_name_locale = orderItemName.name;
                        break;
                    }
                }

                if (!order.order_items[o].item_name_locale) {
                    order.order_items[o].item_name_locale = order.order_items[o].item_names[0].name;
                }
            }

            if (order.order_items[o].catalogue_full && order.order_items[o].catalogue_full.catalogue_names.length > 0) {
                for (var j=0; j<order.order_items[o].catalogue_full.catalogue_names.length; j++) {
                    var catalogueName = order.order_items[o].catalogue_full.catalogue_names[j];
                    if (order.locale === catalogueName.locale) {
                        order.order_items[o].catalogue = catalogueName.name;
                        break;
                    }
                }

                if (!order.order_items[o].catalogue) {
                    order.order_items[o].catalogue = order.order_items[o].catalogue_full.catalogue_names[0].name;
                }
            }

            var orderItem = {
                item_id:             order.order_items[o].item_id,
                item_name:           order.order_items[o].item_name,
                item_name_locale:   order.order_items[o].item_name_locale,
                catalogue:           order.order_items[o].catalogue,
                catalogue_full:     order.order_items[o].catalogue_full,
                quantity:            order.order_items[o].quantity,
                price:  {
                    amount:          amount,
                    currencyCode:   order.restaurant.currency
                },
                photo:               photo,
                photos:              order.order_items[o].photos,
                original_price:       order.order_items[o].original_price ? order.order_items[o].original_price : amount
            }

            if (order.order_items[o].actual_price) {
                orderItem['actual_price'] = order.order_items[o].actual_price;
            }

            if (order.order_items[o].combinations) {
                orderItem.combinations = order.order_items[o].combinations;
            }

            formattedOrder.order_items.push(orderItem);
        }
    };

    if (order.payment && order.payment.sub_total_before_first_visit_savings) {
        formattedOrder.sub_total_before_first_visit_savings = order.payment.sub_total_before_first_visit_savings;
    } else {
        formattedOrder.sub_total_before_first_visit_savings = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'sub_total_before_first_visit_savings',
            message: 'Does not exists: v3.order.payment.sub_total_before_first_visit_savings'
        });
    };
    if (order.payment && order.payment.first_visit_customer_savings) {
        formattedOrder.first_visit_customer_savings = order.payment.first_visit_customer_savings;
    } else {
        formattedOrder.first_visit_customer_savings = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'first_visit_customer_savings',
            message: 'Does not exists: v3.order.payment.first_visit_customer_savings'
        });
    };

    if (order.payment && order.payment.sub_total_after_discounts) {
        formattedOrder.sub_total_after_discounts = order.payment.sub_total_after_discounts;
    } else {
        formattedOrder.sub_total_after_discounts = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'sub_total_after_discounts',
            message: 'Does not exists: v3.order.payment.sub_total_after_discounts'
        });
    };
    if (order.payment && order.payment.total_tax) {
        formattedOrder.total_tax =order.payment.total_tax;
    } else {
        formattedOrder.total_tax = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'total_tax',
            message: 'Does not exists: v3.order.payment.total_tax'
        });
    };

    if (order.payment && order.payment.taxes) {
        formattedOrder.taxes = order.payment.taxes;
    } else {
        formattedOrder.remarks.push({
            v1_attribute: 'taxes',
            message: 'Does not exists: v3.order.payment.taxes'
        });
    };
    if (order.payment && order.payment.tip) {
        formattedOrder.tip = order.payment.tip;
    } else {
        formattedOrder.remarks.push({
            v1_attribute: 'taxes',
            message: 'Does not exists: v3.order.payment.tip'
        });
    };
    if (order.payment && order.payment.total_amount_to_pay_with_bd_and_gd) {
        formattedOrder.total_amount_to_pay_with_bd_and_gd = order.payment.total_amount_to_pay_with_bd_and_gd;
    } else {
        formattedOrder.total_amount_to_pay_with_bd_and_gd = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'total_amount_to_pay_with_bd_and_gd',
            message: 'Does not exists: v3.order.payment.total_amount_to_pay_with_bd_and_gd'
        });
    };

    if (order.bill_status && order.bill_status.is_online_payment) {
        if (order.payment && order.payment.split_payment_going_to_restaurant) {
            formattedOrder.split_payment_going_to_restaurant = order.payment.split_payment_going_to_restaurant;
        } else {
            formattedOrder.split_payment_going_to_restaurant = 0;
        }
        if (order.payment && order.payment.split_payment_going_to_fandine) {
            formattedOrder.split_payment_going_to_fandine = order.payment.split_payment_going_to_fandine;
        } else {
            formattedOrder.split_payment_going_to_fandine = 0;
        }
        if (order.payment && order.payment.credit_service_charge) {
            formattedOrder.credit_service_charge = order.payment.credit_service_charge;
        } else {
            formattedOrder.credit_service_charge = 0;
        }

        var country = _this.config.other_servers.country;
        if (country && (_this.config.other_servers.region.china.indexOf(country) >-1)) {
            if (order.payment && order.payment.real_alipaty_service_charge) {
                formattedOrder.credit_service_charge = order.payment.real_alipaty_service_charge;
            } else {
                formattedOrder.credit_service_charge = 0;
            }
        }

        formattedOrder.FDC = parseFloat(accounting.toFixed((formattedOrder.total_amount_to_pay_with_bd_and_gd * 100 - formattedOrder.split_payment_going_to_restaurant * 100
                            - formattedOrder.credit_service_charge * 100)/100, 2), 10);
    }

    if (order.payment && order.payment.blue_dollar_savings) {
        formattedOrder.blue_dollar_savings = order.payment.blue_dollar_savings;
    } else {
        formattedOrder.blue_dollar_savings = 0;
        formattedOrder.remarks.push({
            v1_attribute: 'blue_dollar_savings',
            message: 'Does not exists: v3.order.payment.blue_dollar_savings'
        });
    };

    formattedOrder.blue_dollar_amount_paid = order.payment && order.payment.blue_dollar_amount_paid ? order.payment.blue_dollar_amount_paid : 0;
    formattedOrder.total_blue_dollar_bought = order.payment && order.payment.total_blue_dollar_bought ? order.payment.total_blue_dollar_bought : 0;

    formattedOrder.amount_to_buy_blue_dollar = order.payment && order.payment.amount_to_buy_blue_dollar ? order.payment.amount_to_buy_blue_dollar : 0;
    formattedOrder.amount_to_buy_restaurant_credits = order.payment && order.payment.blue_dollar_bought_from_restaurant ? order.payment.blue_dollar_bought_from_restaurant * 0.8 : 0;
    formattedOrder.service_charge_shared_by_fd = order.payment && order.payment.service_charge_shared_by_fd ? order.payment.service_charge_shared_by_fd : 0;

    if (order.servers && order.servers.length > 0) {
        formattedOrder.servers = [];
        for (var s = 0; s < order.servers.length; s++) {
            if (order.servers[s].userId) {
                //-- The order is based on v2 schema
                formattedOrder.servers.push({
                    user_id:     order.servers[s].userId,
                    user_name:   order.servers[s].userName,
                    avatar_path: order.servers[s].avatarPath
                });
            } else if (order.servers[s].user_id) {
                //-- The order is either based on v1 schema or hybrid of v1 and v2
                formattedOrder.servers.push(order.servers[s]);
            };
        };
    };

    if (order.payment && order.payment.taxes) {
        formattedOrder.taxes = order.payment.taxes;
    }

    if (order.restaurant && order.restaurant.applicable_taxes) {
        var subTotal = 0;
        var taxableLiquor = 0;

        for (var i=0; i<order.orderItems.length; i++ ) {

            var quantity = 1;
            if (order.orderItems[i].quantity && order.orderItems[i].quantity > 0) {
                quantity = order.orderItems[i].quantity;
            }

            if (isCombinations(order.orderItems[i])) {
                subTotal += order.orderItems[i].actual_price.amount * quantity;
            } else {
                subTotal += order.orderItems[i].price.amount * quantity;
            }

            if (order.orderItems[i].category) {
                if (order.orderItems[i].category === _this.enums.MenuCategoryType.LIQUOR) {
                    if (isCombinations(order.orderItems[i])) {
                        taxableLiquor += order.orderItems[i].actual_price.amount * quantity;
                    } else {
                        taxableLiquor += order.orderItems[i].price.amount * quantity;
                    }
                }
            }

        };

        var totalTax = 0;
        var liquor_re = /^LIQUOR$/i;

        var tax;
        for (var t=0; t<order.restaurant.applicable_taxes.length; t++) {
            tax = 0;
            if (liquor_re.test(order.restaurant.applicable_taxes[t].name)) {
                tax = taxableLiquor * (order.restaurant.applicable_taxes[t].rate / 100);
            }else{
                tax += (subTotal-taxableLiquor) * (order.restaurant.applicable_taxes[t].rate / 100);
            }

            totalTax += tax;
        };

        formattedOrder.offline_payment_amount = formattedOrder.sub_total_before_first_visit_savings + Number(totalTax.toFixed(2));
        formattedOrder.offline_payment_amount = Number(formattedOrder.offline_payment_amount.toFixed(2));
    }

    if(order.come_from === 'WECHAT'){
        if(order.bill_status && order.bill_status.is_online_payment ===true){
            formattedOrder.offline_payment_amount = 0;
        }else{
            formattedOrder.offline_payment_amount = formattedOrder.offline_payment_amount > 0 ? formattedOrder.offline_payment_amount : formattedOrder.sub_total_before_first_visit_savings;
            formattedOrder.offline_payment_amount = Number(formattedOrder.offline_payment_amount.toFixed(2));
        }
    }

    if (order.payment && order.payment.transaction_number) {
        formattedOrder.transaction_number = order.payment.transaction_number;
    }

    formattedOrder.after_tax = formattedOrder.sub_total_after_discounts + formattedOrder.total_tax;
    formattedOrder.after_savings = formattedOrder.after_tax - formattedOrder.blue_dollar_savings - formattedOrder.blue_dollar_amount_paid;

    formattedOrder.tip = (order.payment && order.payment.tip) ? order.payment.tip : 0;

    formattedOrder.out_trade_no = order.out_trade_no;

    formattedOrder.create_time = order.create_time;
    formattedOrder.update_time = order.update_time;
    formattedOrder.order_id = order._id;
    formattedOrder.v = order.v;
    formattedOrder.billStatus = order.billStatus;
    formattedOrder.bill_status = order.bill_status;
    formattedOrder.status = order.status;

    formattedOrder.is_online_payment_supported = order.is_online_payment_supported;

    formattedOrder.is_takeout = order.is_takeout;
    formattedOrder.picked_up = order.picked_up;
    formattedOrder.add_minutes = order.add_minutes;
    formattedOrder.picked_up_time = order.picked_up_time;

    formattedOrder.group_buy = order.group_buy;

    if (formattedOrder.is_takeout) {
        formattedOrder.online_payment_only_takeout = order.restaurant.online_payment_only_takeout || false;
    }

    formattedOrder.order_type = _this.getOrderType(order);

    if (order.delivery_address) {
        formattedOrder.delivery_address = order.delivery_address;
    }
    if (order.delivery_interval) {
        formattedOrder.delivery_interval = order.delivery_interval;
    }
    if (order.delivery_payment) {
        formattedOrder.delivery_payment = order.delivery_payment;
    }
    if (order.delivery_status) {
        formattedOrder.delivery_status = order.delivery_status;
    }
    if (order.consumer_delivery_status) {
        formattedOrder.consumer_delivery_status = order.consumer_delivery_status;
    }

    if (order.redeemed_time) {
        formattedOrder.redeemed_time = order.redeemed_time;
    }

    if (order.status === _this.enums.OrderStatus.CANCELLED) {

        if (order.operations !== null && order.operations !== undefined) {
            for (var i=0; i<order.operations.length; i++) {
                var operation = order.operations[i];
                if (operation.action === _this.enums.ActionStatus.CANCEL) {
                    formattedOrder.reason = operation.operation_memo;
                    formattedOrder.canceled_by = operation.user_name;

                    delete formattedOrder.remarks;
                    delete formattedOrder.sub_total_before_first_visit_savings;
                    delete formattedOrder.first_visit_customer_savings;
                    delete formattedOrder.total_tax;
                    delete formattedOrder.total_amount_to_pay_with_bd_and_gd;
                    delete formattedOrder.amount_to_buy_restaurant_credits;
                    delete formattedOrder.blue_dollar_savings;
                    delete formattedOrder.offline_payment_amount;
                    delete formattedOrder.after_tax;
                    delete formattedOrder.after_savings;
                    delete formattedOrder.tip;

                    break;
                }
            }
        }

    }

    if (order.promotions) {
        var rewardCode = '';
        var isRedeemed = false;
        var isExpired = false;
        for (var i=0; i<order.promotions.length; i++) {
            var promotion = order.promotions[i];
            if (promotion.is_reward === true) {
                rewardCode = promotion.reward_code;
            }
            if (promotion.is_redeemed === true) {
                isRedeemed = true;
            } else if (promotion.is_redeemed === false) {
                isExpired = true;
            }

        }

        if (rewardCode !== '') {
            formattedOrder.promotion_result = {
                is_reward: true,
                is_redeemed: isRedeemed,
                is_expired: isExpired,
                reward_code: rewardCode
            };
        } else {
            formattedOrder.promotion_result = {
                is_reward: false
            };
        }
    }

    if (order.fandine_payment) {
        formattedOrder.fandine_payment = order.fandine_payment;
    }

    if (order.is_expired) {
        formattedOrder.is_expired = order.is_expired;
    }

    if (formattedOrder.order_type === _this.enums.OrderType.DELIVERY) {
        formattedOrder.total_amount_to_pay_with_bd_and_gd = order.payment.total_amount_to_pay_with_bd_and_gd +
            formattedOrder.delivery_payment.delivery_fee - formattedOrder.delivery_payment.delivery_fee_saving;;
        formattedOrder.split_payment_going_to_restaurant = formattedOrder.split_payment_going_to_restaurant +
            formattedOrder.delivery_payment.delivery_fee - formattedOrder.delivery_payment.delivery_fee_saving;
    }

    for(var key in formattedOrder){
        var value = formattedOrder[key];
        if (typeof value === 'number' && isNaN(value) === false) {
            formattedOrder[key] = parseFloat(accounting.toFixed(value, 2), 10);
        }
    }
    
    formattedOrder.can_use_golddollar=order.can_use_golddollar;

    return formattedOrder;
};


var SwitchResponseFormat = function (backBody) {
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
};


var GrantBlueDollarForUpComments = function(userId,orderId,otherServers,headerToken,callback){
    var _this = exports;
    var selector = {};
    var options = {};
    var filter = {};
    var helper = {};
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments received arguments %j',
        userId: userId, orderId: orderId, otherServers: otherServers,headerToken:headerToken });

    var order = {},menus=[],shouldCheckMenus=[],grantCommentUsers=[];
    var grantAmount=0;
    var restaurantId;
    var country,standardItemPrice= 0,grantAmountStandard=0;
    var UseBDInFoodMarket = true;
    async.series([
        //prepare some initial data
        function(nextstep){
            var country = _this.config.other_servers.country;
            if (!country || (otherServers.region.north_america.indexOf(country) >-1)) {
                country = _this.enums.RegionCode.NA;
                standardItemPrice = otherServers.other_rates.standard_menu_item_price_NA;
                grantAmountStandard = otherServers.other_rates.grant_amount_for_comments_NA;
            } else {
                country = _this.enums.RegionCode.CHINA;
                standardItemPrice = otherServers.other_rates.standard_menu_item_price;
                grantAmountStandard = otherServers.other_rates.grant_amount_for_comments;
            }
            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-prepare prepare some initial data',
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
            helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order-manager.js; Method: GrantBlueDollarForUpComments()' };

            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-1 find the menu which price is greater than '+standardItemPrice+' find',country:country, selector: selector });

            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-ERROR: Order-Manager.GrantBlueDollarForUpComments step 1 find the menu which price is greater than '+standardItemPrice+' ==query return error',country:country, error: error });
                    nextstep(error);
                } else if (result === null || result === '' || result.length === 0) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-ERROR: Order-Manager.GrantBlueDollarForUpComments step 1 find the menu which price is greater than '+standardItemPrice+'==query returns empty',country:country});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('id', orderId));
                } else {
                    _this.logger.info('%j', {
                        function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step 1 find the menu which price is greater than '+standardItemPrice+' == has result', country:country,result: result });

                    order = result[0];

                    if (order.order_items && order.order_items.length > 0 ) {
                        for(var i=0;i<order.order_items.length;i++){

                            var actualPrice = 0;
                            if (isCombinations(order.order_items[i])) {
                                actualPrice = order.order_items[i].actual_price;
                            } else {
                                actualPrice = order.order_items[i].price;
                            }

                            if(actualPrice && actualPrice.amount && actualPrice.amount > standardItemPrice && order.order_items[i].item_id ){
                                menus.push(order.order_items[i].item_id)
                            }
                        }
                    }

                    if(order.restaurant){
                        restaurantId = order.restaurant.restaurant_id;
                    }

                    if(order.restaurant.liked  && _this.config.other_servers.food_market.generate_fandine_credit){
                        UseBDInFoodMarket = false;
                    }

                    _this.logger.info('%j', {
                        function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step 1 find the menu which price is greater than '+standardItemPrice,
                        country:country,
                        menus:menus,
                        food_market_shop:order.restaurant.liked,
                        can_use_blue_dollars_in_food_market:_this.config.other_servers.food_market.generate_fandine_credit,
                        order:order });

                    nextstep();
                }
            });
        },
        //step 2 check whether the meun in menus is the first time online payment
        function(nextstep) {
            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-2 online payment do some check and then grant',
                bill_status:order.bill_status,menus:menus,UseBDInFoodMarket:UseBDInFoodMarket });
            if(order.bill_status.is_online_payment === true && menus.length > 0 && UseBDInFoodMarket){
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-2 online payment do some check and then grant',
                    bill_status:order.bill_status,menus:menus ,UseBDInFoodMarket:UseBDInFoodMarket});

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
                    function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-2 online payment do some check and then grant query',
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
                            function: 'DEBUG-ERROR: Order-Manager.GrantBlueDollarForUpComments step-2 online payment do some check and then grant return ==query return error', error: error });
                        callback(error);
                    } else if (result === null || result.length === 0) {
                        _this.logger.info('%j', {
                            function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-2 online payment do some check and then grant return result empty'});
                        shouldCheckMenus=[];
                        nextstep();
                    } else {
                        _this.logger.info('%j', {
                            function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-2 online payment do some check and then grant return result',result:result});

                        shouldCheckMenus=[];
                        if (result && result.length > 0) {
                            for (var i = 0; i < result.length; i++) {
                                if(result[i].num === 1) {
                                    shouldCheckMenus.push(result[i]._id);
                                }
                            }
                        };
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-2 online payment do some check and then grant return result',
                            shouldCheckMenus: shouldCheckMenus });

                        nextstep();
                    }
                });

            }else{
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-2 offline payment skep grant',
                    bill_status:order.bill_status,menus:menus,UseBDInFoodMarket:UseBDInFoodMarket });
                nextstep();
            }
        },
        //step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment
        function(nextstep){
            if(shouldCheckMenus.length>0){
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment  gruant',
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
                    function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment query',
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
                            function: 'DEBUG-ERROR: Order-Manager.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment ==query return error', error: error });
                        callback(error);
                    } else if (result === null || result.length === 0) {
                        _this.logger.info('%j', {
                            function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment return result empty'});

                        grantCommentUsers = [];
                        nextstep();
                    } else {
                        _this.logger.info('%j', {
                            function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment return result',result:result});

                        var comments = result;
                        var comment = {};
                        var commentsLength = comments.length;
                        var randomIndex=0;

                        //grantAmount = parseInt(commentsLength * otherServers.other_rates.grant_amount_for_comments,10);
                        for (var i = 0; i < comments.length; i++) {
                            comment =comments[i];
                            randomIndex=0;
                            if(comment.users && comment.users.length > 0){
                                randomIndex= Math.floor(Math.random() * comment.users.length);
                                grantCommentUsers.push({menu_id:comment._id,user:comment.users[randomIndex]});
                            }
                        }

                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment',
                            grantCommentUsers: grantCommentUsers });
                        nextstep();
                    }
                });
            }else{
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-3 check the menu id of shouldCheckMenus in the collection menu-item-comment skip gruant',
                    shouldCheckMenus:shouldCheckMenus });
                nextstep();
            }
        },
        //step-4 grant blue dollars to the user and menu comment users
        function(nextstep){
            if(grantCommentUsers.length>0){
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-4 grant blue dollars to the user and menu comment users skip gruant',
                    grantCommentUsers:grantCommentUsers,grantAmountStandard:grantAmountStandard,country:country });

                grantAmount = parseFloat((grantCommentUsers.length * grantAmountStandard).toFixed(2),10);
                var postData = {};
                postData.host = otherServers.reward.server_url;
                postData.port = otherServers.reward.server_port;
                postData.path = '/v1/restaurants/d-' + restaurantId + '/blueDollars';
                var body = {}, grantBlueDollar = [];

                grantBlueDollar.push({
                    'userId': 'u-'+userId,
                    'amount': grantAmount,
                    'balanceType': 1,
                    'orderId': orderId,
                    'code': _this.enums.DollarSourceCode.BD106          // Comment Reward

                });
                grantCommentUsers.forEach(function (item) {
                    grantBlueDollar.push({
                        'userId': 'u-' + item.user.user_id,
                        'amount': parseFloat((1 * grantAmountStandard).toFixed(2), 10),
                        'balanceType': 1,
                        'orderId': orderId,
                        'code': _this.enums.DollarSourceCode.BD105          // Thumb up Reward
                    });
                });
                if (grantBlueDollar.length>0) {
                    body = {
                        'grantBlueDollar': grantBlueDollar
                    };
                } else {
                    body = null;
                };

                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments before calling Rewards API with postData',
                    postData: postData,
                    body: body
                });

                postData.method = 'POST';

                _this.sendToReward(postData, headerToken, function (error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments grant blue dollars', result: JSON.stringify(result.rows)});
                        if (result.data !== null) {
                            nextstep();
                        } else {
                            nextstep();
                        }
                    }
                }, body);
            }else{
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-4 grant blue dollars to the user and menu comment users skip gruant',
                    grantCommentUsers:grantCommentUsers,grantAmountStandard:grantAmountStandard,country:country });
                nextstep();
            }
        },
       /* //step-4.1 modify the comments thumbs_ups
        function(nextstep){
          if(grantCommentUsers.length > 0){
              _this.logger.info('%j', {
                  function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-4.1 modify the comments thumbs_ups',
                  grantCommentUsers:grantCommentUsers ,restuarantId:restaurantId,userId:userId});
              async.each(grantCommentUsers,function(item,callback){
                  var menuId = item.menu_id;
                  var commentUserId = item.user.user_id;

                  var selector = {'thumb_ups.user_id':userId,
                                  'restaurant.restaurant_id':restaurantId,
                                  'menu_item.menu_item_id':menuId,
                                  "user.user_id":commentUserId};
                  var document = {$set: { "thumb_ups.$.is_granted_for_ups" : true} };
                  var options = {};
                  var helper = {collectionName: _this.enums.CollectionName.MENU_COMMENT};

                  _this.restaurantDataAPI.update(selector, document, options, helper, function (error) {
                      if (error) {
                          _this.logger.info('%j', {function:'DEBUG-INFO: Comment.UpdateCommentThumbUps step-4 doUpdateThumbUps returns an error',
                              selector:selector,document:document,error: error});
                          callback(error);
                      } else {
                          _this.logger.info('%j', {function:'DEBUG-INFO: Comment.UpdateCommentThumbUps step-4 doUpdateThumbUps returns right'});
                          callback();
                      }
                  });
              },function(error){
                  if(error){
                      nextstep(error);
                  }else{
                      nextstep();
                  }
              });

          }  else{
              _this.logger.info('%j', {
                  function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments step-4.1 modify the comments thumbs_ups skip',
                  grantCommentUsers:grantCommentUsers });
              nextstep();
          }
        },*/
        //step-5 push notification
        function(nextstep){
            if(grantAmount>0){
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments do step-5 notification to oneself',grantAmount:grantAmount });
                var postData={};
                postData.host = otherServers.notification.server_url;
                postData.port = otherServers.notification.server_port;
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
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments do step-5 notification to oneself: post body==',body:body});
                postData.method = 'POST';
                _this.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                    if (error) {
                        _this.logger.error('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments do step-5 notification to oneself returns an error', error: error});
                    } else {
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments do step-5 notification to oneself returns right'});
                    }
                });
                nextstep();
            }else{
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments do step-5 notification to oneself skip==',grantAmount:grantAmount });
                nextstep();
            }
        },
        //step-5.1 push notification
        function(nextstep){
            if(grantCommentUsers.length>0){
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments do step-5.1 notification to other users',grantCommentUsers:grantCommentUsers });
                var postData={};
                postData.host = otherServers.notification.server_url;
                postData.port = otherServers.notification.server_port;
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
                    _this.sendToNotificationServer(postData, headerToken, body, function (error, result) {
                        if (error) {
                            _this.logger.error('%j', { function: 'DEBUG-INFO: Order.CloseOrder do step-5.1 notification to other users returns an error', error: error,target_user_id:item.user.user_id});
                        } else {
                            _this.logger.info('%j', { function: 'DEBUG-INFO: Order.CloseOrder do step-5.1 notification to other users returns right',target_user_id:item.user.user_id});
                        }
                    });
                });

                nextstep();
            }else{
                _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.GrantBlueDollarForUpComments do step-5.1 notification to other users skip==',grantCommentUsers:grantCommentUsers });
                nextstep();
            }
        }
    ],function(error) {
        callback(error,'success');
    });
};


var SendToReward = function(data, headerToken, callback, body, reqParams, loggerInfos) {
    var _this = exports;

    var options = {
        host: data.host,
        port: data.port,
        path: data.path,
        method:data.method,
        headers:{
            'content-type': 'application/json'
        }
    };

    if (body) {
        options.body = body;
    }

    if(headerToken){
        options.headers.authorization = headerToken;
    }

    if (reqParams && loggerInfos) {
        options.reqParams = reqParams;
        options.loggerInfos = loggerInfos;
    }

    options.serviceName = _this.config.other_servers.reward.server_name;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.SendToReward', options: JSON.stringify(options), body: JSON.stringify(body)});

    _this.sendToOtherServer(options, function (error, result) {
        if (error) {
            _this.logger.error('%j', {
                function: 'DEBUG-ERROR: Order-Manager.SendToReward returns error',
                error: error,
                options: options
            });
            callback(error, []);
        } else {
            if (result && result.errorCode) {
                _this.logger.error('%j', {
                    function: 'DEBUG-ERROR: Order-Manager.SendToReward returns error',
                    error: result,
                    options: options
                });

                if(result.errorCode ==='PERMISSION_NOT_ALLOWED'){
                    callback( new _this.httpExceptions.PermissionNotAllowedException(result.errorCode, result.errorField),null);
                }else{
                    callback(new _this.httpExceptions.InvalidParameterException('reward server', result.fieldValue), null);
                }
                return;
            }

            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order-Manager.SendToReward returns right',
                result: result,
                options: options
            });
            callback(null, result);

        }
    });

};


var SendToNotificationServer = function (data, headerToken, body, callback, reqParams, loggerInfos) {
    var _this = exports;

    var options = {
        host: data.host,
        port: data.port,
        path: data.path,
        method:data.method,
        headers:{
            'content-type': 'application/json'
        },
        body: body
    };

    if(headerToken){
        options.headers.authorization = headerToken;
    }

    if (reqParams && loggerInfos) {
        options.reqParams = reqParams;
        options.loggerInfos = loggerInfos;
    }

    options.serviceName = _this.config.other_servers.notification.server_name;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Manager.SendToNotificationServer ', options: options });


    _this.sendToOtherServer(options, function (error, result) {
        if (error) {
            _this.logger.error('%j', {
                function: 'DEBUG-ERROR: Order-Manager.SendToNotificationServer returns error',
                error: error,
                options: options
            });
            callback(error, []);
        } else {

            if (result === 'OK' || result.result === 'OK') {
                _this.logger.info('%j', {
                    function: 'DEBUG-INFO: Order-Manager.SendToNotificationServer returns right',
                    result: result,
                    options: options
                });
                callback(null, '');
            } else {
                _this.logger.error('%j', {
                    function: 'DEBUG-ERROR: Order-Manager.SendToNotificationServer returns error',
                    error: result,
                    options: options
                });
                callback(result, null);
            }

        }
    });
};


var SendToOauthServer = function (data, headerToken, body, callback, reqParams, loggerInfos) {
    var _this = exports;

    var options = {
        host: data.host,
        port: data.port,
        path: data.path,
        method:data.method,
        headers:{
            'content-type': 'application/json'
        }
    };
    if (body) {
        options.body = body;
    }
    if (headerToken){
        options.headers.authorization = headerToken;
    }

    if (reqParams && loggerInfos) {
        options.reqParams = reqParams;
        options.loggerInfos = loggerInfos;
    }

    options.serviceName = _this.config.other_servers.oauth.server_name;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.SendToOauthServer', options: JSON.stringify(options), body: body});

    _this.sendToOtherServer(options, function (error, result) {
        if (error) {
            _this.logger.error('%j', {
                function: 'DEBUG-ERROR: Order-Manager.SendToOauthServer returns error',
                error: error,
                options: options
            });
            callback(error, []);
        } else {
            if (result && result.errorCode) {
                _this.logger.error('%j', {
                    function: 'DEBUG-ERROR: Order-Manager.SendToOauthServer returns error',
                    error: result,
                    options: options
                });

                if(result.errorCode ==='PERMISSION_NOT_ALLOWED'){
                    callback( new _this.httpExceptions.PermissionNotAllowedException(result.errorCode, result.errorField),null);
                }else{
                    callback(new _this.httpExceptions.InvalidParameterException('oauth server', result.fieldValue), null);
                }
                return;
            }

            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order-Manager.SendToOauthServer returns right',
                result: result,
                options: options
            });
            callback(null, result);

        }
    });
}


var SendToOtherServer = function (options, callback) {
    var _this = exports;

    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-Manager.SendToOtherServer received parameters', options: options});

    _this.serviceLocator.Locator.sendToOtherServer(options.serviceName, options, function (error, result) {
        if (error) {
            var reqParams = options.reqParams;
            var loggerInfos = options.loggerInfos;

            if (reqParams && loggerInfos) {
                var emailBody = {
                    subject: loggerInfos.function + ' returns an error',
                    text: {
                        reqParams: reqParams,
                        data: options,
                        error: error
                    }
                };

                delete emailBody.text.data.reqParams;
                delete emailBody.text.data.loggerInfos;

                _this.sendEmail(emailBody);
            }

            _this.logger.error('%j', {
                function: 'DEBUG-ERROR: Order-Manager.SendToOtherServer returns error',
                error: error,
                options: options
            });
            callback(error, []);
        } else {
            if (result && result.errorCode) {
                _this.logger.error('%j', {
                    function: 'DEBUG-ERROR: Order-Manager.SendToOtherServer returns error',
                    error: result,
                    options: options
                });
                callback(result, []);
                return;
            }

            _this.logger.info('%j', {
                function: 'DEBUG-INFO: Order-Manager.SendToOtherServer returns right',
                result: result,
                options: options
            });
            callback(null, result);

        }
    })

}


var SendEmail = function (emailBody) {
    var _this = exports;

    if (_this.config.other_servers.email_config.enabled === true) {
        var country = process.argv[2]? process.argv[2]: 'NA';  // NA or CN
        var env = process.argv[3] ? process.argv[3] : 'development';
        emailBody.subject = '[' + country + '][' + env + '][order]' + emailBody.subject;
        emailBody.text = JSON.stringify(emailBody.text, null, 4);

        _this.backendHelpers.mailHelper.email(emailBody, function (error, result) {
            if (error) {
                _this.logger.error('%j', {function:'DEBUG-ERROR: Order-Manager.SendEmail send email error', error: error});
            } else {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order-Manager.SendEmail send email right', result: result});
            }
        });
    } else {
        _this.logger.info('%j', {function:'DEBUG-INFO: Order-Manager.SendEmail send email stop', emailBody: emailBody});
    }
}


var isCombinations = function (orderItem) {

    return orderItem.combinations && orderItem.length > 0;
}


/**
 * Get Menu Item Name By Locale
 * If empty, return ''
 * If not found, return orderItems[0].name
 *
 * @param orderItems    array
 * @param itemName      default item name
 * @param locale        'en_US','zh_CN'
 * @constructor
 */
var GetMenuItemNameByLocale = function (orderItems, itemName, locale) {

    if (orderItems === null || orderItems === undefined || orderItems === '' || orderItems.length === 0) {
        return itemName || '';
    }

    if (locale === null || locale === undefined || locale === '') {
        return itemName || '';
    }

    for (var i = 0; i < orderItems.length; i++) {
        var orderItem = orderItems[i];

        if (orderItem.locale === locale) {
            return orderItem.name;
        }
    }

    if (orderItems.length > 0) {
        return orderItems[0].name;
    }

}


/**
 * Get Order Type
 * PREORDER: order_type exists
 * DELIVERY: order_type exists
 * TAKEOUT: order_type empty and is_takeout === true
 * DINNER: other
 *
 * @param order
 * @constructor
 */
var GetOrderType = function (order) {
    var _this = exports;

    if (order.order_type) {
        return order.order_type;
    }

    if (order.is_takeout === true) {
        return _this.enums.OrderType.TAKEOUT;
    }

    return _this.enums.OrderType.DINNER;
}

var IsInRegularHours = function(note,regularHours,timezone){
    var _this = exports;
    var regularHoursLength = regularHours.length;
    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-manager.IsInRegularHours received parameters =====',
        note:note,
        regularHours:regularHours,
        regularHoursLength : regularHoursLength,
        timezone:timezone
    });
    var weekWords = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if(!note || !note.effective_date){
        _this.logger.info('%j', {function: 'DEBUG-INFO: Order-manager.IsInRegularHours has no note, skip check,return true ====='});
        return true;
    }

    if(!regularHours || regularHoursLength ==0){
        _this.logger.info('%j', {function: 'DEBUG-INFO: Order-manager.IsInRegularHours has no regularHours, skip check,return true ====='});
        return true;
    }

    if(regularHoursLength == 1 && regularHours[0] =='00:00-00:00'){
        _this.logger.info('%j', {function: 'DEBUG-INFO: Order-manager.IsInRegularHours: regularHours is 00:00-00:00 , skip check,return true ====='});
        return true;
    }

    var effectiveDate = momentzone(note.effective_date).tz(timezone);
    var effectiveHour = effectiveDate.clone().hours();
    var effectiveMinutes = effectiveDate.clone().minutes();
    var effectiveWeekDay = effectiveDate.clone().weekday();
    var effectiveTime = effectiveDate.clone().toDate().getTime();
    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-manager.IsInRegularHours step-2 doValidateDate returns right=====',
        effectiveDate:note.effective_date,
        effectiveDate_timezone:effectiveDate.format(),
        effectiveHour:effectiveHour,
        effectiveMinutes:effectiveMinutes,
        effectiveWeekDay:effectiveWeekDay,
        timezone:timezone,
        effectiveTime:effectiveTime
    });

    var isInRegularHour = false;
    //"regular_hours" : ["Sunday 11:30-15:30 16:30-21:00", "Monday 11:30-15:30 16:30-21:00", "Tuesday 11:30-15:30 16:30-21:00", "Wednesday 11:30-15:30 16:30-21:00", "Thursday 11:30-15:30 16:30-21:00", "Friday 11:30-15:30 16:30-21:00", "Saturday 11:30-15:30 16:30-21:00"]
    //"regular_hours" : ["Sunday 00:00-23:59", "Monday 00:00-23:59", "Tuesday 00:00-23:59", "Wednesday 00:00-23:59", "Thursday 00:00-23:59", "Friday 00:00-23:59", "Saturday 00:00-23:59"]
    //"regular_hours" : ["10:00-22:00"]

    var formatHours = formatRegularHours(regularHours);
    regularHours = formatHours;
    for(var i = 0;i< regularHours.length; i++){
        var regularHour =regularHours[i].trim();
        var weekAndHours =  regularHour.split(' ');
        var weekDay,hours;
        var beginHour,beginMinutes,endHour,endMinutes;
        if(weekAndHours.length > 1){
            weekDay = weekAndHours[0];
            hours = weekAndHours.slice(1);
        }else{
            weekDay = null;
            hours = weekAndHours;
        }
        var currentWeek = weekWords[effectiveWeekDay];

        if(weekDay !=null && currentWeek !=weekDay){
            continue;
        }

        for(var j = 0; j< hours.length; j++){
            var itemHours = hours[j];
            if(itemHours =='') continue;
            if(itemHours =='00:00-00:00'|| itemHours =='00:00-24:00'|| itemHours =='00:00-23:59'){
                isInRegularHour  =true;
                break;
            }

            var times = itemHours.trim().split('-');
            beginHour = times[0].split(':')[0];
            beginMinutes = times[0].split(':')[1] ? times[0].split(':')[1] : '00';
            endHour = times[1].split(':')[0];
            endMinutes = times[1].split(':')[1] ?  times[1].split(':')[1] : '00';

            var beginTime = effectiveDate.clone().hours(beginHour).minutes(beginMinutes).toDate().getTime();
            var endTime = effectiveDate.clone().hours(endHour).minutes(endMinutes).toDate().getTime();

            if( beginTime <= effectiveTime && effectiveTime <= endTime){
                isInRegularHour  =true;
                break;
            }
        }

        if( isInRegularHour){
            break;
        }

    }

    return isInRegularHour;

}
//"regular_hours" : ["Sunday 11:30-15:30 16:30-21:00", "Monday 11:30-15:30 16:30-21:00", "Tuesday 11:30-15:30 16:30-21:00", "Wednesday 11:30-15:30 16:30-21:00", "Thursday 11:30-15:30 16:30-21:00", "Friday 11:30-15:30 16:30-21:00", "Saturday 11:30-15:30 16:30-21:00"]
//"regular_hours" : ["Sunday 00:00-23:59", "Monday 00:00-23:59", "Tuesday 00:00-23:59", "Wednesday 00:00-23:59", "Thursday 00:00-23:59", "Friday 00:00-23:59", "Saturday 00:00-23:59"]
//"regular_hours" : ["10:00-22:00"]
//"regular_hours" : ["Sunday 17-2", "Monday 17-2", "Tuesday 17-2", "Wednesday 17-2", "Thursday 17-2", "Friday 17-2", "Saturday 17-2"]
var formatRegularHours = function(regularHours){

    var formatHours = [];
    var tempHours = {Sunday:[],Monday:[],Tuesday:[],Wednesday:[],Thursday:[],Friday:[],Saturday:[]};
    var regularHoursLength  = regularHours.length;
    if(regularHoursLength == 1 ){
        var regularHourItem = regularHours[0].trim();
        var weekAndHours =  regularHourItem.split(' ');
        if(weekAndHours.length ==1) return regularHours;//"regular_hours" : ["10:00-22:00"]
    }

    for(var i = 0; i< regularHoursLength; i++){
        var regularHourItem = regularHours[i].trim();
        var weekAndHours =  regularHourItem.split(' ');
        var weekDay,hours,beginHour,beginMinutes,endHour,endMinutes;
        if(weekAndHours.length > 1){
            weekDay = weekAndHours[0];
            hours = weekAndHours.slice(1);
        }else{
            weekDay = null;
            hours = weekAndHours;
        }
        for(var j = 0; j< hours.length; j++){
            var itemHours = hours[j];
            if(itemHours =='') continue;
            var times = itemHours.trim().split('-');
            beginHour = times[0].split(':')[0];
            beginMinutes = times[0].split(':')[1] ? times[0].split(':')[1] : '00';
            endHour = times[1].split(':')[0];
            endMinutes = times[1].split(':')[1] ?  times[1].split(':')[1] : '00';
            if(parseInt(beginHour) > parseInt(endHour)){
              tempHours[weekDay].push( beginHour+":"+beginMinutes +'-23:59');
              var nextDay = getNextWeekDay(weekDay);
              tempHours[nextDay].push('00:00-'+endHour+":"+endMinutes);
            }else{
                tempHours[weekDay].push(beginHour+':'+beginMinutes+'-'+endHour+":"+endMinutes);
            }
        }
    }

    for(var item in tempHours){
        var itemString = item;
        if(tempHours[item].length < 1) continue;
        for(var i =0; i< tempHours[item].length;i++){
            if(tempHours[item][i]!=null){
                itemString+= ' '+tempHours[item][i];
            }
        }
       // console.log('===================1================'+itemString);
        formatHours.push(itemString);
    }


    return formatHours;

}

var getNextWeekDay = function(currentWeekDay){
    var weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var nextDay;
    var currentDayIndex = 0;
    var nextDayIndex = 0;
    for(var i=0;i<weekDays.length;i++){
        if(currentWeekDay == weekDays[i]){
            currentDayIndex = i;
            break;
        }
    }
    if(currentDayIndex +1 >= weekDays.length){
        nextDayIndex = 0;
    }else{
        nextDayIndex = currentDayIndex +1;
    }

    return weekDays[nextDayIndex];

}

var CheckDeliveryRestriction = function(parameter,callback){
    var _this = exports;
    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-manager.CheckDeliveryRestriction received parameters =====',
        parameter:parameter
    });
    var userId = parameter.userId;
    var restaurantId = parameter.restaurantId;
    var orderItems = parameter.orderItems;
    var menuMap = parameter.menuMap;
    var timezone = parameter.timezone;

    var boughtMenus=[];
    var overrangeMenus=[];
    var localTime = momentzone().tz(timezone);
    var startLocalTime = localTime.clone().startOf('day');
    var utcTime = startLocalTime.clone().utc();
    _this.logger.info('%j', {function: 'DEBUG-INFO: Order-manager.CheckDeliveryRestriction format times=====',
        timezone:timezone,
        localTime:localTime.format(),
        startLocalTime:startLocalTime.format(),
        utcTime:utcTime.format()
    });

    async.series([
        function(nextstep){
            _this.logger.info('%j', {function:'DEBUG-INFO:Order-manager.js; Method: CheckDeliveryRestriction()step-1: query all food market delivery ordered menus of the user in the day'});

            var query = {
                'user.user_id':userId,
                'restaurant.restaurant_id':restaurantId,
                'restaurant.liked':true,
                status:{$in:['PAID','CLOSED']},
                order_type:'DELIVERY',
                create_time:{$gte:utcTime.toDate()}
            };
            var project_first = {order_items:'$order_items'};
            var unwind = {$unwind:'$order_items'};
            var project_second = {orderId:"$_id",menu_id:'$order_items.item_id',quantity:'$order_items.quantity'};
            var group = {_id:'$menu_id',quantity:{$sum:'$quantity'}};
            var selector_array = [
                {$match:query},
                {$project:project_first},
                unwind,
                {$project:project_second},
                {$group:group}
            ];
           var helper = {collectionName: _this.enums.CollectionName.DINING_ORDERS};
            _this.logger.info('%j', {function:'DEBUG-INFO:Order-manager.js; Method: CheckDeliveryRestriction()step-1: query all food market delivery ordered menus of the user in the day,query parameter',
                selector_array:selector_array,
                helper:helper
            });
            _this.restaurantDataAPI.aggregateWithArray(selector_array, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order-manager.js; Method: CheckDeliveryRestriction()step-query:query all food market delivery ordered menus of the user in the day==returns error', error: error});
                    callback(new _this.httpExceptions.DataConflictedException('get operations', 'error'));
                } else {
                    _this.logger.info('%j', {function:'DEBUG-INFO:Order-manager.js; Method: CheckDeliveryRestriction()step-query:query all food market delivery ordered menus of the user in the day==returns right',result:result});
                    boughtMenus = result;
                    nextstep();
                }
            });
        },
        function(nextstep){
            _this.logger.info('%j', {function:'DEBUG-INFO:Order-manager.js; Method: CheckDeliveryRestriction()step-2: check menu delivery restriction quota'});
            var cn_names = [];
            var en_names = [];
            var names = {cn:cn_names,en:en_names};
            for(var i = 0; i< orderItems.length; i++){
                var orderItem = orderItems[i];
                var itemId = orderItem.item_id;
                var order_quantity =  parseInt(orderItem.quantity,10);
                var menu = menuMap[itemId];
                if(!menu.delivery_restriction_quota || parseInt(menu.delivery_restriction_quota,10) === -1) {
                    continue;
                }
                var menu_quantity = parseInt(menu.delivery_restriction_quota,10);
                if(order_quantity > menu_quantity){
                    overrangeMenus.push({menu_id:itemId,count:(order_quantity-menu_quantity)});
                    names = getNames(names,menu.longNames);
                    continue;
                }
                for(var j = 0;j < boughtMenus.length; j++){
                    var boughtMenu = boughtMenus[j];
                    var boughtId = boughtMenu._id;
                    var bought_quantity = parseInt(boughtMenu.quantity,10);
                    if(boughtId === itemId){
                        if((bought_quantity + order_quantity) > menu_quantity){
                            overrangeMenus.push({menu_id:itemId,count:(bought_quantity+order_quantity-menu_quantity)});
                            names = getNames(names,menu.longNames);
                            break;
                        }
                    }
                }
            }

            if(overrangeMenus.length > 0){
                var errMessage = _this.enums.HttpErrorCodes['OVER_MENU_QUOTA'];
                var  messages = {
                    messageCode:'OVER_MENU_QUOTA',
                    en:errMessage.ERROR_MESSAGE_EN.replace('${en_name}',names.en.toString()),
                    cn: errMessage.ERROR_MESSAGE_CN.replace('${cn_name}',names.cn.toString())
                };
                nextstep(new _this.httpExceptions.HttpErrorException(400,'item_id quantity has been more than restriction quota',overrangeMenus,messages));
            }else{
                nextstep();
            }
        }
    ],function(error){
        callback(error);
    })
};

var getNames = function(names,menuNames){
    if(menuNames.length < 2){
        names.cn.push(menuNames[0].name);
        names.en.push(menuNames[0].name);
    }else{
        for(var i = 0;i < menuNames.length; i++){
            if(menuNames[i].locale ==='zh_CN'){
                names.cn.push(menuNames[i].name)
            }else{
                names.en.push(menuNames[i].name)
            }
        }
    }

    return names;
}

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
    _this.serviceLocator = _this.backendHelpers.serviceLocator;
    _this.enums = _this.backendHelpers.enums;
    _this.httpExceptions =_this.backendHelpers.httpExceptions;
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.restaurantDataAPI_PG = require(_this.app.dbApiPath)(_this.config, _this.mongoConfig,_this.logger,'reward').dataHelper;
    _this.restaurantDataAPI_PG =_this.restaurantDataAPI.rewardPGAPI;
    _this.enums = _this.backendHelpers.enums;

    _this.checkIdsAreValidUUIDs = CheckIdsAreValidUUIDs;
    // _this.checkIfFirstTimeAndGetOthers = CheckIfFirstTimeAndGetOthers;
    _this.checkIfFirstTimeAndGetOthersV2= CheckIfFirstTimeAndGetOthersV2;
    _this.consumeLockedBlueDollars = ConsumeLockedBlueDollars;
    _this.consumeGoldDollars = ConsumeGoldDollars;

    _this.getBlueDollars = GetBlueDollars;
    _this.getGoldDollars = GetGoldDollars;
    _this.grantAndConsumeBlueDollars = GrantAndConsumeBlueDollars;
    _this.grantBlueDollars = GrantBlueDollars;
    _this.grantGoldDollarToServers = GrantGoldDollarToServers;
    _this.grantGoldDollarsToServer = GrantGoldDollarsToServer;
    _this.pagingFunction = PagingFunction;
    _this.updateUserBluedollarDebt = UpdateUserBluedollarDebt;
    _this.reformatBillResponseToV1 = ReformatBillResponseToV1;
    _this.reformatBillResponseToV2 = ReformatBillResponseToV2;
    _this.reformatBillResponseToV2Simplified = ReformatBillResponseToV2Simplified;
    _this.sendToChat = SendToChat;
    _this.switchResponseFormat = SwitchResponseFormat;

    _this.grantBlueDollarForUpComments = GrantBlueDollarForUpComments;

    _this.sendToReward = SendToReward;
    _this.sendToNotificationServer = SendToNotificationServer;
    _this.sendToOauthServer = SendToOauthServer;

    _this.sendToOtherServer = SendToOtherServer;
    _this.sendEmail = SendEmail;

    _this.getMenuItemNameByLocale = GetMenuItemNameByLocale;

    _this.getOrderType = GetOrderType;

    _this.isInRegularHours = IsInRegularHours;

    _this.checkDeliveryRestriction = CheckDeliveryRestriction;

    //-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
    //-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions (below) in alphabetical order
    //-- NOTE to Developers (2015-05-13): 3) For READABILITY, please help to maintain double-spaces between functions declarations
    return _this;
};
