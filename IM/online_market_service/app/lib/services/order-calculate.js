/**
 * Created by Webber.Wang on 2014/8/19.
 */
'use strict';
var async = require('async');
var accounting = require('accounting');
var geolib = require('geolib');

var CATEGORY = {
    LIQUOR: 'LIQUOR'
};

var REMARKS = {
    ORDERITEM_MENU_ITEM_ID_HAS_NO_CATEGORY: 'ORDERITEM_MENU_ITEM_ID_HAS_NO_CATEGORY',
    ORDERITEM_CHILDITEM_MENU_ITEM_ID_HAS_NO_CATEGORY: 'ORDERITEM_CHILDITEM_MENU_ITEM_ID_HAS_NO_CATEGORY',
    RESTAURANT_HAS_NO_APPLICABLE_TAXES: 'RESTAURANT_HAS_NO_APPLICABLE_TAXES'
};


var calculateV1 = function(orderItems,applicableTaxes,discount,currency,discount_rate,callback) {
    var _this = exports;

    var current=currency;
    var totaltax= 0,total= 0,subtotal= 0;
    var exttotaltax= 0,exttotal= 0,extsub=0;

    var taxGST = 0,taxGSTRate = 0, count_GST=0, extTaxGST = 0;
    var taxLiquor = 0,taxLiquorRate = 0,count_Liquor = 0,extLiquor = 0,extTaxLiquor = 0;
    var taxChildItem = 0, childItem_total = 0;
    var newBody={};
    newBody.remarks = [];
    if(orderItems !== null && orderItems !== '' && orderItems !== undefined && orderItems.length >0) {
       var hasNoCategoryNum = 0;

        for(var i=0;i<orderItems.length;i++ ) {
            if(orderItems[i].category === null || orderItems[i].category === undefined || orderItems[i].category === '') {
                hasNoCategoryNum++
            }
            if(hasNoCategoryNum == orderItems.length) {
                newBody.remarks.push(REMARKS.ORDERITEM_MENU_ITEM_ID_HAS_NO_CATEGORY);
            }
            if(orderItems[i].childrenItems !== undefined && orderItems[i].childrenItems !== null && orderItems[i].childrenItems.length >0) {
                for(var j=0;j<orderItems[i].childrenItems.length; j++) {
                    if(orderItems[i].childrenItems[j].priceDiff !== undefined && orderItems[i].childrenItems[j].priceDiff !== null && orderItems[i].childrenItems[j].quantity !== undefined &&
                        orderItems[i].childrenItems[j].quantity !== null && orderItems[i].childrenItems[j].priceDiff.amount !== undefined && orderItems[i].childrenItems[j].priceDiff.amount !==null) {
                        var component_num = parseFloat(orderItems[i].childrenItems[j].priceDiff.amount,10)*parseFloat(orderItems[i].childrenItems[j].quantity,10);
                        childItem_total = parseFloat(childItem_total,10)+ parseFloat(component_num,10);
                    }
                }
            }
            if(orderItems[i].price!==undefined && orderItems[i].price!==null && orderItems[i].quantity!==undefined && orderItems[i].quantity!==null &&
                orderItems[i].price.amount!==undefined && orderItems[i].price.amount!==null ) {

                var subtotalt = 0;
                if (isCombinations(orderItems[i])) {
                    subtotalt =parseFloat(orderItems[i].actual_price.amount,10)*parseFloat(orderItems[i].quantity,10);
                } else {
                    subtotalt =parseFloat(orderItems[i].price.amount,10)*parseFloat(orderItems[i].quantity,10);
                }

                subtotal = parseFloat(subtotal,10)+ parseFloat(subtotalt,10);
                _this.logger.info('subtotal========='+subtotal+'   subtotalt==============='+subtotalt);

                _this.logger.info('orderItems['+i+'].category==========='+orderItems[i].category);
                var liquor_re = /^LIQUOR$/i;
                //var liquor_re = new RegExp(CATEGORY.LIQUOR,"gi");

                if(/*orderItems[i].category === CATEGORY.LIQUOR*/liquor_re.test(orderItems[i].category)) {
                    count_Liquor = parseFloat(count_Liquor,10)+ parseFloat(subtotalt,10);
                    _this.logger.info('count_Liquor ======='+count_Liquor+' extLiquor====='+extLiquor);
                } else {
                    count_GST = parseFloat(count_GST,10)+ parseFloat(subtotalt,10);
                    _this.logger.info('count_GST ======='+count_GST);
                }
                if(current === '' || current === null) {
                    current = orderItems[i].price.currencyCode;
                }
            }
        }
        _this.logger.info('applicableTaxes=================='+JSON.stringify(applicableTaxes));
        if(applicableTaxes.length >0) {
            for(var i=0;i<applicableTaxes.length;i++) {
                if(applicableTaxes[i].name ==='GST') {
                    taxGSTRate = applicableTaxes[i].rate;
                }else if(applicableTaxes[i].name ==='Liquor') {
                    taxLiquorRate = applicableTaxes[i].rate;
                }
            }
        }
        if(taxGSTRate >0 ) {
            _this.logger.info('taxGSTRate ======='+taxGSTRate+' count_GST====='+count_GST+ 'discount_rate ==='+discount_rate);
            _this.logger.info('parseFloat(taxGSTRate,10)/100  * parseFloat(count_GST,10)* (1-discount_rate) ======='+parseFloat(taxGSTRate,10)/100  * parseFloat(count_GST,10)* (1-discount_rate));
            taxGST =  parseFloat(taxGSTRate,10)/100  * parseFloat(count_GST,10) * (1-discount_rate);
            taxGST = parseFloat(taxGST.toFixed(2),10);

        }

        if(taxLiquorRate > 0) {
            _this.logger.info('taxLiquorRate ======='+taxLiquorRate+' count_Liquor====='+count_Liquor + 'discount_rate ==='+discount_rate);
            _this.logger.info('parseFloat(taxLiquorRate,10)/100  * parseFloat(count_Liquor,10)* (1-discount_rate) ======='+parseFloat(taxLiquorRate,10)/100  * parseFloat(count_Liquor,10)* (1-discount_rate));

            taxLiquor =  parseFloat(taxLiquorRate,10)/100  * parseFloat(count_Liquor,10) * (1-discount_rate);
            taxLiquor =  parseFloat(taxLiquor.toFixed(2),10);

        }
        _this.logger.info('count_Liquor ======='+count_Liquor+' extTaxLiquor====='+extTaxLiquor+' taxLiquor====='+taxLiquor);

        if(childItem_total >0) {
            taxChildItem =  parseFloat(taxGSTRate,10)/100  * parseFloat(childItem_total,10)  * (1-discount_rate);
            taxChildItem = parseFloat(taxChildItem.toFixed(2),10);
            subtotal = parseFloat(subtotal,10)+parseFloat(childItem_total,10);
        };

        totaltax =  parseFloat(taxGST,10)  +  parseFloat(taxLiquor,10)+parseFloat(taxChildItem,10);
        totaltax =  parseFloat(totaltax.toFixed(2),10);
        _this.logger.info('totaltax ======='+totaltax+' exttotaltax====='+exttotaltax);

        total =  parseFloat(totaltax,10)  +  parseFloat(subtotal,10);
        total = parseFloat(total.toFixed(2),10);
        _this.logger.info('total ======='+total+' exttotal====='+exttotal);
    } else {
        newBody.remarks.push(REMARKS.ORDERITEM_MENU_ITEM_ID_HAS_NO_CATEGORY);
    }
    if(applicableTaxes.length < 1) {
        newBody.remarks.push(REMARKS.RESTAURANT_HAS_NO_APPLICABLE_TAXES);
    }
    newBody.subTotal={amount:subtotal,currencyCode:current};
    newBody.total={amount:total,currencyCode:current};
    newBody['totalTaxes']={};
    if(taxGST > 0) {
        newBody['totalTaxes']['GST']={amount:taxGST,currencyCode:current};
    }

    if(taxLiquor > 0) {
        newBody['totalTaxes']['Liquor']={amount:taxLiquor,currencyCode:current};
    }

    newBody.totalTax={amount:totaltax,currencyCode:current};
    if(discount !== null && discount !== '' && discount !== undefined) {
        newBody.discount=discount;
    }

    callback(null,newBody);
};


var CalculateOrdersByOrderId = function(userId, orderId, callback) {
    var _this = exports;
    var orderBody, restaurantBody, orderItems, applicableTaxes, discount, apiresult, newBody;
    var discount_percentage;
    var selector,options,helper;
    var discount_rate = 0;
    var currency = '';
    var isFirstTimeVisit = false;
    var isDiscountExist = false;
    async.series([

        //-- step 1, get order info
        function(nextstep) {
            selector = {_id: orderId};
            options = {};
            helper = {collectionName:'dining-orders'};
            _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '' || result.length ===0) {
                    //console.log('step 1');
                    nextstep(new _this.httpExceptions.InvalidParameterException('DATA_NOT_EXIST', '_id', orderId));
                } else {
                    orderBody = result[0];
                    if(result[0].orderItems !== null && result[0].orderItems !== '' && result[0].orderItems !== undefined) {
                        orderItems = result[0].orderItems;
                    }
                    discount = result[0].discount;

                    if (result[0].restaurant.hasOwnProperty('discounts') && result[0].restaurant.discounts.length > 0) {
                        discount_rate = result[0].restaurant.discounts[0].value / 100;
                        isDiscountExist = true;
                    }

                    nextstep();
                }
            });
        },
        //-- Step-4.1: Check if first time to the restaurant.
        function(nextstep) {
                var selector_r = {
                    status: {$in: ['CLOSED', 'PAID']},
                    $and: [{$or: [{'restaurant.restaurant_id': orderBody.restaurantId}, {restaurantId: orderBody.restaurantId}]},
                        {$or: [{'user.user_id': userId}, {'orderItems.order_item_user_id': userId}]},
                        {$or: [{'billStatus.status': 'PAID'}, {'bill_status.status': 'PAID'}]}]
                };
                var options_r = {};
                var helper_r = {
                    collectionName: 'dining-orders',
                    callerScript: 'File: CalculateOrdersByOrderId;  CheckIfFirstTime to the restaurant'
                };
                _this.restaurantDataAPI.find(selector_r, options_r, helper_r, function (error, result) {
                    if (error) {
                        nextstep(error);
                    } else {
                        if (result.length > 0) {
                            isFirstTimeVisit = false;
                        } else {
                            isFirstTimeVisit = true;
                        }
                        if(isFirstTimeVisit !== true) {
                            discount_rate = 0;
                            isDiscountExist = true;
                        }
                        nextstep();
                    }
                });
        },
        //-- step 2, get restaurant info
        function(nextstep) {
            selector = {_id: orderBody.restaurantId};
            options = {};
            helper = {collectionName:'restaurant'};
            _this.restaurantDataAPI.find(selector, options, helper, function(error, result) {
                if (error) {
                    nextstep(error);
                } else if (result === null || result === '') {
                    nextstep(new _this.httpExceptions.InvalidParameterException('DATA_NOT_EXIST', '_id', orderBody.restaurantId));
                } else {
                    restaurantBody = result;
                    if(restaurantBody.length>0) {
                        currency = result[0].currency;
                        if(result[0].hasOwnProperty('applicableTaxes') && result[0].applicableTaxes) {
                            applicableTaxes=result[0].applicableTaxes;
                        } else {
                            applicableTaxes = [];
                        }

                        if (!isDiscountExist) {
                            if (result[0].hasOwnProperty('discounts') && result[0].discounts.length > 0) {
                                discount_rate = result[0].discounts[0].value / 100;
                            }
                        }
                    } else {
                        applicableTaxes = [];
                        discount_percentage =0;
                    }

                    nextstep();
                }
            });
        },

        //step 3,calculate order tax and total
        function(nextstep) {
            calculateV1(orderItems, applicableTaxes, discount, currency,discount_rate, function(error, result) {
                if(error ) {
                    nextstep(error);
                } else {
                    newBody = result;
                    if(orderItems !== null && orderItems !== '' && orderItems !== undefined) {
                        newBody.orderItems = orderItems;
                    }
                    newBody.tableId = orderBody.tableId;
                    newBody.status = orderBody.status;
                    newBody.restaurantId = orderBody.restaurantId;
                    nextstep();
                }
            });
        },

        //step 4,update the order
        function(nextstep) {
            if(orderBody.restaurant) {
                if (!orderBody.restaurant.restaurantId) {
                    newBody.restaurant = orderBody.restaurant;
                    newBody.restaurant.restaurant_id = orderBody.restaurantId;

                    if(!orderBody.restaurant.currency) {
                        newBody.restaurant.currency = currency;
                    }
                }
                if(orderBody.restaurant.is_first_time_visit_restaurant !== true && orderBody.restaurant.is_first_time_visit_restaurant !== false){
                    newBody.restaurant.is_first_time_visit_restaurant = isFirstTimeVisit;
                }
            } else {
                newBody.restaurant = {restaurant_id: orderBody.restaurantId,  currency:currency};
            }

            var criteria = {_id: orderId};
            var document = {$set: newBody};
            var options = {};
            var helper = {collectionName: 'dining-orders'};
            _this.restaurantDataAPI.update(criteria, document, options, helper, function(error,result) {
                if (error) {
                    // console.log('step 4');
                    nextstep(error);
                } else if (result.n === 0) {
                    // console.log('result is null');
                    nextstep(new _this.httpExceptions.ResourceNotFoundException('DATA_NOT_EXIST', '_id', orderId));
                } else {
                    apiresult = {status: 204, newBody: newBody};
                    nextstep();
                }
            }, false);
        }
    ], function (error) {
        callback(error, apiresult);
    });
};


var CalculateOrdersByUserId = function(userId, filter, callback) {
    var _this = exports;
    var apiresult;
    async.series([
        function (callback) {
            var selector = filter;
            var options = {};
            var helper = {collectionName:'dining-orders'};

            _this.restaurantDataAPI.find(selector, options, helper,function(error, result) {
                if (error) {
                    callback(error, null);
                } else if (result !== null && result !== '' && result.length !==0) {
                    // render result
                    if (result && result.length > 0) {
                        var length = result.length;
                        var times=0;
                        for (var i = 0; i < result.length; i++) {
                            _this.calculateOrdersByOrderId(userId,result[i]._id, function (error, result) {
                                if (error) {
                                    callback(error);
                                } else if (result.n === 0) {
                                    callback(new _this.httpExceptions.ResourceNotFoundException('DATA_NOT_EXIST'));
                                } else {
                                    times++;
                                    apiresult = {status: 204};
                                    if(times===length) {
                                        callback();
                                    }
                                }

                            });
                        }
                    }
                } else {
                    callback(new _this.httpExceptions.ResourceNotFoundException('DATA_NOT_EXIST'), null);
                }
            });
        }],function (error) {
        callback(error, apiresult);
    });

};


//-- FBE-1053: [Orders] Refactor method Order-Calculate.CalculateOrderByOrderId() by removing three (3) Async functions
var CalculateOrder = function (order, otherServers, callback) {
    var _this = exports;
    var newOrder = _this.backendHelpers.jsonHelper().cloneDocument(order);

    var subTotal = 0, taxableLiquor = 0;

    var discount_rate = 0;
    var isDiscountExist = false;

    if (newOrder.restaurant.hasOwnProperty('discounts') && newOrder.restaurant.discounts.length > 0) {
        discount_rate = newOrder.restaurant.discounts[0].value / 100;
        isDiscountExist = true;
    }

    async.series([
        // step-1: doFindRestaurant
        function (nextstep) {
            if (!isDiscountExist) {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order-calculate.CalculateOrder step-1 doFindRestaurant'});

                var selector = {_id: newOrder.restaurant.restaurant_id};
                var options = {};
                var helper = { collectionName: 'restaurant', callerScript: 'File: Order-calculate.js; Method: CalculateOrder()' };

                _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                    if (error) {
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order-calculate.CalculateOrder step-1 doFindRestaurant returns an error', error: error});
                        nextstep(new _this.httpExceptions.DataConflictedException("find restaurant", "error"));
                    } else if (result === null || result === '' || result.length === 0) {
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order-calculate.CalculateOrder step-1 doFindRestaurant returns empty'});
                        nextstep(new _this.httpExceptions.ResourceNotFoundException('restaurant', newOrder.restaurant.restaurant_id));
                    } else {
                        var restaurant = result[0];

                        if (restaurant.hasOwnProperty('discounts') && restaurant.discounts.length > 0) {
                            discount_rate = restaurant.discounts[0].value / 100;
                        }

                        _this.logger.info('%j', {function:'DEBUG-INFO: Order-calculate.CalculateOrder step-1 doFindRestaurant returns right'});
                        nextstep();
                    }
                })
            } else {
                nextstep();
            }
        },
        // step-2: doCalculateOrder
        function (nextstep) {
            if(newOrder.bill_status.is_first_time_online_payment !== true  || newOrder.billStatus.isFirstTimeOnlinePayment !==true) {
                discount_rate = 0;
            }
            newOrder.remarks = [];

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateOrder received order ', newOrder: newOrder, otherServers: otherServers });

            /**
             * NOTE: This block performs the following:
             *      - Calculate for sub_total_before_first_visit_savings; Loop through orderItems
             *      - Append the V2 attributes in 'under_score' format (not camelCase format)
             */
            var orderItems = [], childrenItems = [], chitFlagMap = {};
            if(newOrder.order_items && newOrder.order_items.length > 0) {
                var items = newOrder.order_items;
                for(var j=0;j < items.length; j++) {
                    var item = items[j];
                    chitFlagMap[item.order_item_id] = item.chit_printed;
                }
            }

            //var liquor_re = new RegExp(CATEGORY.LIQUOR,"gi");
            for (var i=0; i<newOrder.orderItems.length; i++ ) {

				// FBE-2024: quantity is ineffective
                var quantity = 1;
                if (newOrder.orderItems[i].quantity && newOrder.orderItems[i].quantity > 0) {
                    quantity = newOrder.orderItems[i].quantity;
                }

                if (isCombinations(newOrder.orderItems[i])) {
                    subTotal += newOrder.orderItems[i].actual_price.amount * quantity;
                } else {
                    subTotal += newOrder.orderItems[i].price.amount * quantity;
                }

                if (newOrder.orderItems[i].category) {
                    if (newOrder.orderItems[i].category === _this.enums.MenuCategoryType.LIQUOR) {
                        if (isCombinations(newOrder.orderItems[i])) {
                            taxableLiquor += newOrder.orderItems[i].actual_price.amount * quantity ;
                        } else {
                            taxableLiquor += newOrder.orderItems[i].price.amount * quantity ;
                        }
                    }
                } else {
                    newOrder.remarks.push({menu_item_id: newOrder.orderItems[i].itemId, message: REMARKS.ORDERITEM_MENU_ITEM_ID_HAS_NO_CATEGORY});
                }

            };

            /**
             * NOTE:
             *      - The value of total_discounts and sub_total_after_discounts will be overwritten after doGetFirstTimeAndOtherDiscounts()
             *      - The value of first_visit_customer_savings will be overwritten after doGetFirstTimeAndOtherDiscounts()
             */
            newOrder.payment.sub_total_before_first_visit_savings = subTotal;
            newOrder.payment.sub_total_after_discounts = subTotal;

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateOrder', subTotal: subTotal, taxableLiquor: taxableLiquor,
                discount_rate:discount_rate,is_first_time_online_payment:newOrder.bill_status.is_first_time_online_payment});

            //-- Calculate for applicable_taxes
            var totalTax = 0;
            var liquor_re = /^LIQUOR$/i;
            if (newOrder.restaurant && newOrder.restaurant.applicable_taxes) {
                //-- FBE-1044: totalTaxes.GST.amount is a mandatory object
                var tax;
                for (var t=0; t<newOrder.restaurant.applicable_taxes.length; t++) {
                    tax = 0;
                    if (/*newOrder.restaurant.applicable_taxes[t].name === CATEGORY.LIQUOR*/liquor_re.test(newOrder.restaurant.applicable_taxes[t].name)) {
                        tax = taxableLiquor * (1-discount_rate) * (newOrder.restaurant.applicable_taxes[t].rate / 100);
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateOrder======calculate tax====', taxableLiquor: taxableLiquor, discount_rate: discount_rate,
                            applicable_taxes:newOrder.restaurant.applicable_taxes[t].rate,taxname:newOrder.restaurant.applicable_taxes[t].name});

                    }else{
                        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateOrder======calculate tax====', subTotal: subTotal,taxableLiquor: taxableLiquor, discount_rate: discount_rate,
                            applicable_taxes:newOrder.restaurant.applicable_taxes[t].rate,taxname:newOrder.restaurant.applicable_taxes[t].name});
                        tax += (subTotal-taxableLiquor) * (1-discount_rate) * (newOrder.restaurant.applicable_taxes[t].rate / 100);

                    }

                    newOrder.payment.taxes.push({name: newOrder.restaurant.applicable_taxes[t].name, amount: tax } );
                    totalTax += tax;
                };
                newOrder.payment.total_tax = parseFloat(Number(totalTax.toFixed(3)));
            } else {
                newOrder.remarks.push({restaurant_id: newOrder.restaurant.restaurant_id, message: REMARKS.RESTAURANT_HAS_NO_APPLICABLE_TAXES});
            };

            _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateOrder', newOrder: newOrder });

            nextstep();
        }
    ], function (error) {
        if (error) {
            callback(error, newOrder);
        } else {
            callback(null, newOrder);
        }
    })

};

var CalculateTransactionsForChina = function(order, PAYMENTTYPE, otherServers){
    var _this = exports;
    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateTransactionsForChina received paid order ', order: order, otherServers: otherServers });
    var payment = _this.backendHelpers.jsonHelper().cloneDocument(order.payment) || {};
    var bill_status = _this.backendHelpers.jsonHelper().cloneDocument(order.bill_status) || {};
    var restaurant = _this.backendHelpers.jsonHelper().cloneDocument(order.restaurant) || {};
    if(bill_status.is_online_payment ===true) {
        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateTransactionsForChina online payment ', is_online_payment: bill_status.is_online_payment });
        payment.total_blue_dollar_bought                                  //--
            = payment.blue_dollar_bought_from_consumer
            + payment.blue_dollar_bought_from_fandine
            + payment.blue_dollar_bought_from_restaurant;

        payment.amount_to_buy_blue_dollar
            = payment.total_blue_dollar_bought                            //-- Q = R * 0.9
            * otherServers.other_rates.blue_dollar_rate;

        payment.amount_to_pay_restaurant_offline                          //-- G8-G9-G12+(G16*0.8)
            = payment.grand_total_to_pay                                    //G8
            + payment.blue_dollar_bought_from_restaurant * otherServers.other_rates.ap_settlement_rate  //(G16*0.8)
            - payment.blue_dollar_amount_paid                         //-- O (A): G9
            - payment.total_blue_dollar_bought;                       //-- R:   G12

        payment.amount_to_pay_fandine_transaction                         //--  G18 =SUM(G14:G15)*0.9+(G16*0.1)
            = (payment.blue_dollar_bought_from_consumer
            + payment.blue_dollar_bought_from_fandine)* otherServers.other_rates.blue_dollar_rate
            + payment.blue_dollar_bought_from_restaurant * otherServers.other_rates.fandine_revenue_bd_exchange_service_rate;

        payment.total_amount_to_pay_with_bd_and_gd                        //--
            = payment.grand_total_to_pay
            + payment.amount_to_buy_blue_dollar
            - payment.total_blue_dollar_bought
            - payment.blue_dollar_amount_paid
            - payment.gold_dollar_amount_paid;

        payment.online_payment_amount                                     //--
            = payment.amount_to_pay_restaurant_offline + payment.amount_to_pay_fandine_transaction;              //--

        payment.total_consumer_gd_to_restaurant_gd = payment.gold_dollar_amount_paid;                            //

        payment.online_transaction_charge_rate = otherServers.other_rates.alipay_fee_rate;  //--X   In China for Alipay: x% = 1% In USA and Canada x% = (OPA * 2.9% + 0.3)/OPA

        payment.credit_service_charge                                     //-- G20 =G19*0.005
            = payment.online_payment_amount   * otherServers.other_rates.transaction_charge_include_alipay;

        payment.total_consumer_bd_to_restaurant_bd                        //
            = payment.total_blue_dollar_bought + payment.blue_dollar_amount_paid;

        //online payment
        if(payment.credit_service_charge < 1){
            payment.real_alipaty_service_charge    = 1;                     //--Real Alipay Service Charge(new added)  G23=IF(G20<1,1,IF(G20>25,25,G20))
        } else if(payment.credit_service_charge > 25){
            payment.real_alipaty_service_charge    = 25;                     //--Real Alipay Service Charge(new added)  =IF(G20<1,1,IF(G20>25,25,G20))
        }else{
            payment.real_alipaty_service_charge    =  payment.credit_service_charge   ;
        }

        payment.total_dollar_fdacc_after_service_charge      //G24=G19-G23
            =payment.online_payment_amount - payment.real_alipaty_service_charge;

        //add some attribute for QA use (indirect variable) for FBE-1686,FBE-1687,FBE-1688 and FBE-1689 webber wang 20150901
        payment.dollar_to_fandine  //b22
            =(payment.blue_dollar_bought_from_consumer + payment.blue_dollar_bought_from_fandine )
            * otherServers.other_rates.ap_settlement_rate;

        payment.dollar_to_restaurant //b23
            = payment.amount_to_pay_restaurant_offline +
        payment.blue_dollar_bought_from_restaurant  * otherServers.other_rates.ap_settlement_rate;

        payment.total_dollar   //b24=b22+b23
            =payment.dollar_to_fandine + payment.dollar_to_restaurant;

        payment.service_charge_shared_by_fd   //b25 = B21*B22/B24
            = payment.credit_service_charge * payment.dollar_to_fandine / payment.total_dollar;

        if(payment.online_payment_amount !== 0) {
            payment.split_payment_going_to_restaurant                         //--G25 =  G17-G23
                = payment.amount_to_pay_restaurant_offline - payment.real_alipaty_service_charge;

            payment.split_payment_going_to_fandine                            //-- AD: X - AB * X / Y
                = payment.amount_to_pay_fandine_transaction ;
        } else {
            payment.split_payment_going_to_restaurant = 0;
            payment.split_payment_going_to_fandine = 0;
        }

        payment.fandine_general_bd_gain                                   //-- AE (FGBDG): sub_total_after_discounts * 1%
            = payment.sub_total_after_discounts  * otherServers.other_rates.fandine_general_bd_gain_rate;

        if (payment.first_visit_customer_savings && payment.first_visit_customer_savings > 0) {
            //-- This means the customer has first-time-visit discount
            payment.fandine_additional_bd_gain_first_visit                //-- AF (FBDGFV): K * J
                = payment.sub_total_after_discounts * otherServers.other_rates.fandine_commission_rate_first_time;
        };

        payment.blue_dollar_issued_to_fandine                             //-- AG: AE + AF
            = payment.fandine_general_bd_gain + payment.fandine_additional_bd_gain_first_visit;

        var recommenderRate;

        recommenderRate =  otherServers.other_rates.recommender_reward_rule_china;
        var recommender_blue_dollar = 0;
        var rate,subTotal_amount;
        if(payment.sub_total_after_discounts===undefined || payment.sub_total_after_discounts ===null || (!payment.sub_total_after_discounts)) {
            subTotal_amount = 0;
        } else {
            subTotal_amount = payment.sub_total_after_discounts;
        }
        for(var i=0;i<recommenderRate.length;i++) {
            rate = recommenderRate[i];
            if ((rate.min<= subTotal_amount && rate.max > subTotal_amount) ||
                (rate.min<= subTotal_amount && (rate.max ===null || rate.max===undefined))) {
                recommender_blue_dollar = rate.reward;
            }
        }
        if(order.bill_status.is_first_time_online_payment === true ) {
            payment.blue_dollar_paid_to_inviter         = recommender_blue_dollar;                  //-- ???
        }else{
            payment.blue_dollar_paid_to_inviter         = 0;                  //-- ???
        }

        payment.ap_to_restaurant_future_settlement                // G31=G25
            = payment.split_payment_going_to_restaurant;

        payment.balance_change_restaurant_bd_account                      //--
            = payment.blue_dollar_bought_from_restaurant * -1;

        payment.payer_bd_account_balance_change                           //--
            = payment.blue_dollar_amount_paid * -1;

        payment.payer_gd_account_balance_change                           //--
            = payment.gold_dollar_amount_paid * -1;

        payment.fandine_revenue_selling_bd                                //-- G35 = G15*0.9
            = payment.blue_dollar_bought_from_fandine  * otherServers.other_rates.blue_dollar_rate;

        payment.fandine_revenue_bd_exchange_service                       //-- G36 =(G14+G16)*0.1
            = (payment.blue_dollar_bought_from_consumer
            + payment.blue_dollar_bought_from_restaurant) * otherServers.other_rates.fandine_revenue_bd_exchange_service_rate;

        payment.owned_to_consumers_bd_exchange = payment.blue_dollar_bought_from_consumer
            * otherServers.other_rates.ap_settlement_rate;

        payment.fandine_bd_account_balance_change                         //-- AP (FBDABC): FGBDG + FBDGFV - C
            = payment.fandine_general_bd_gain
            + payment.fandine_additional_bd_gain_first_visit
            - payment.blue_dollar_bought_from_fandine;

    }else{
        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateTransactionsForChina offline payment ', is_online_payment: bill_status.is_online_payment });
        payment.total_blue_dollar_bought = 0;
        payment.amount_to_buy_blue_dollar = 0;
        payment.amount_to_pay_restaurant_offline  = payment.grand_total_to_pay;
        payment.amount_to_pay_fandine_transaction = 0;
        payment.total_amount_to_pay_with_bd_and_gd = payment.grand_total_to_pay;
        payment.online_payment_amount = 0;
        payment.total_consumer_gd_to_restaurant_gd = 0;
        payment.online_transaction_charge_rate = 0;
        payment.total_consumer_bd_to_restaurant_bd =0;
        payment.credit_service_charge = 0;
        payment.real_alipaty_service_charge = 0;
        payment.total_dollar_fdacc_after_service_charge = 0;
        payment.dollar_to_fandine = 0;
        payment.dollar_to_restaurant = 0;
        payment.total_dollar = 0;
        payment.split_payment_going_to_restaurant=0;
        payment.split_payment_going_to_fandine = 0;
        payment.fandine_general_bd_gain = 0;
        payment.fandine_additional_bd_gain_first_visit = 0;
        payment.blue_dollar_issued_to_fandine = 0;
        payment.blue_dollar_paid_to_inviter = 0;
        payment.ap_to_restaurant_future_settlement = 0;
        payment.balance_change_restaurant_bd_account = 0;
        payment.payer_bd_account_balance_change = 0;
        payment.payer_gd_account_balance_change = 0;
        payment.fandine_revenue_selling_bd = 0;
        payment.fandine_revenue_bd_exchange_service = 0;
        payment.owned_to_consumers_bd_exchange = 0;
        payment.fandine_bd_account_balance_change = 0;
        payment.service_charge_shared_by_fd = 0;

        //payment.first_visit_customer_savings = 0;
        //payment.total_discounts = 0;
        //payment.sub_total_after_discounts = 0;
    }
    var actualPayment = payment;
    order.before_round_data = {};
    order.before_round_data.payment = _this.backendHelpers.jsonHelper().cloneDocument(actualPayment);

    for(var key in payment){
        var value = payment[key];
        payment[key] = _this.dataGenerationHelper.getAccurateNumber(value, 2);
    }

    if (order.bill_status && order.bill_status.is_online_payment === true) {

        var country = otherServers.country;
        if (!country || (otherServers.region.north_america.indexOf(country) >-1)) {
            payment.FDC = parseFloat(accounting.toFixed((payment.total_amount_to_pay_with_bd_and_gd * 100 - payment.split_payment_going_to_restaurant * 100
            - payment.credit_service_charge * 100)/100, 2), 10);
        } else {
            payment.FDC = parseFloat(accounting.toFixed((payment.total_amount_to_pay_with_bd_and_gd * 100 - payment.split_payment_going_to_restaurant * 100
            - payment.real_alipaty_service_charge * 100)/100, 2), 10);
        }

    }

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateTransactionsForChina calculated transaction ', payment: payment });

    return payment;
};

var CalculateTransactionsForNA = function(order, PAYMENTTYPE, otherServers){
    var _this = exports;
    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateTransactionsForNA received paid order ', order: order, otherServers: otherServers });
    var payment = _this.backendHelpers.jsonHelper().cloneDocument(order.payment) || {};
    var bill_status = _this.backendHelpers.jsonHelper().cloneDocument(order.bill_status) || {};
    var restaurant = _this.backendHelpers.jsonHelper().cloneDocument(order.restaurant) || {};
    if(bill_status.is_online_payment ===true) {
        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateTransactionsForNA online payment ', is_online_payment: bill_status.is_online_payment });
        payment.total_blue_dollar_bought                                  //--
            = payment.blue_dollar_bought_from_consumer
            + payment.blue_dollar_bought_from_fandine
            + payment.blue_dollar_bought_from_restaurant;

        payment.amount_to_buy_blue_dollar
            = payment.total_blue_dollar_bought                            //-- Q = R * 0.9
            * otherServers.other_rates.blue_dollar_rate;

        payment.amount_to_pay_restaurant_offline                          //-- D17=D8-D9-D12+(D16*0.8)
            = payment.grand_total_to_pay
            - payment.blue_dollar_amount_paid
            - payment.total_blue_dollar_bought
            +payment.blue_dollar_bought_from_restaurant * otherServers.other_rates.ap_settlement_rate;

        payment.amount_to_pay_fandine_transaction                         //-- D18=SUM(D14:D15)*0.9+(D16*0.1)
            = (payment.blue_dollar_bought_from_consumer + payment.blue_dollar_bought_from_fandine)
            * otherServers.other_rates.blue_dollar_rate
            + payment.blue_dollar_bought_from_restaurant * otherServers.other_rates.fandine_revenue_bd_exchange_service_rate;

        payment.total_amount_to_pay_with_bd_and_gd                        //-- S = N + Q - R - O - P
            = payment.grand_total_to_pay
            + payment.amount_to_buy_blue_dollar
            - payment.total_blue_dollar_bought
            - payment.blue_dollar_amount_paid
            - payment.gold_dollar_amount_paid;

        if(bill_status.is_online_payment ===true) {
            payment.online_payment_amount                                     //-- Y = W + X
                = payment.amount_to_pay_restaurant_offline                    //-- W
            + payment.amount_to_pay_fandine_transaction;              //-- X
        } else {
            payment.online_payment_amount                                     //-- Y = W + X
                = payment.amount_to_pay_fandine_transaction;              //-- X
        }


        if(bill_status.is_online_payment ===true) {
            payment.online_payment_amount                                     //-- Y = W + X
                = payment.amount_to_pay_restaurant_offline                    //-- W
            + payment.amount_to_pay_fandine_transaction;              //-- X
        } else {
            payment.online_payment_amount                                     //-- Y = W + X
                = payment.amount_to_pay_fandine_transaction;              //-- X
        }


        payment.total_consumer_gd_to_restaurant_gd
            = payment.gold_dollar_amount_paid;                            //-- Z: P

        if(payment.online_payment_amount !== 0) {
            payment.online_transaction_charge_rate                            //-- =(D19*0.029+0.3)/D19
                = (payment.online_payment_amount
                * otherServers.stripe.online_transaction_charge_variable
                + otherServers.stripe.online_transaction_charge_constant)
                / payment.online_payment_amount;
        } else {
            payment.online_transaction_charge_rate = 0;
        }

        payment.credit_service_charge                                     //-- AB = Y * H  --- D22 =D19*0.029+0.3
            = payment.online_payment_amount * payment.online_transaction_charge_rate;

        payment.total_consumer_bd_to_restaurant_bd                        //-- AA = R + O
            = payment.total_blue_dollar_bought + payment.blue_dollar_amount_paid;
        //add some attribute for QA use (indirect variable) for FBE-1686,FBE-1687,FBE-1688 and FBE-1689 webber wang 20150901
        payment.dollar_to_fandine  //b22
            =(payment.blue_dollar_bought_from_consumer + payment.blue_dollar_bought_from_fandine )
            * otherServers.other_rates.ap_settlement_rate;

        payment.dollar_to_restaurant //b23
            = payment.amount_to_pay_restaurant_offline +
            payment.blue_dollar_bought_from_restaurant  * otherServers.other_rates.ap_settlement_rate;

        payment.total_dollar   //b24=b22+b23
            =payment.dollar_to_fandine + payment.dollar_to_restaurant;

        if(bill_status.is_online_payment ===true) {
            //modified by webber.wang 2015-10-19 for [FBE-1993] new order and transaction of NA need to be changed.
            payment.dollar_to_fandine_before_service_charge  //d23 = =(D14+D15) * 0.9+(D16*0.1)
                =(payment.blue_dollar_bought_from_consumer + payment.blue_dollar_bought_from_fandine)
                * otherServers.other_rates.blue_dollar_rate
                + payment.blue_dollar_bought_from_restaurant * otherServers.other_rates.fandine_revenue_bd_exchange_service_rate;

            payment.dollar_to_restaurant_before_service_charge //d24 = =D8-D21+(D16*0.8)
                = payment.grand_total_to_pay
                - payment.total_consumer_bd_to_restaurant_bd
                +payment.blue_dollar_bought_from_restaurant * otherServers.other_rates.ap_settlement_rate;


            payment.total_dollar   //D25=D24+D23
                =payment.dollar_to_fandine_before_service_charge + payment.dollar_to_restaurant_before_service_charge;

            payment.service_charge_shared_by_fd   //D26  =D22*D23/D25
                = payment.credit_service_charge * payment.dollar_to_fandine_before_service_charge / payment.total_dollar;

            payment.split_payment_going_to_restaurant //=D27==D24-(D22-D26)
                =payment.dollar_to_restaurant_before_service_charge - (payment.credit_service_charge - payment.service_charge_shared_by_fd);

            payment.split_payment_going_to_fandine  // = D28=D23-D26
                = payment.dollar_to_fandine_before_service_charge - payment.service_charge_shared_by_fd;
        } else {
            payment.split_payment_going_to_restaurant =0;
            payment.split_payment_going_to_fandine = 0;
        }

        payment.fandine_general_bd_gain                                   //-- AE (FGBDG): sub_total_after_discounts * 1%
            = payment.sub_total_after_discounts  * otherServers.other_rates.fandine_general_bd_gain_rate;

        if (payment.first_visit_customer_savings && payment.first_visit_customer_savings > 0) {
            //-- This means the customer has first-time-visit discount
            payment.fandine_additional_bd_gain_first_visit                //-- AF (FBDGFV): K * J
                = payment.sub_total_after_discounts * otherServers.other_rates.fandine_commission_rate_first_time;
        };

        payment.blue_dollar_issued_to_fandine                             //-- AG: AE + AF
            = payment.fandine_general_bd_gain + payment.fandine_additional_bd_gain_first_visit;

        var recommenderRate;

        recommenderRate =  otherServers.other_rates.recommender_reward_rule_north_america;

        var recommender_blue_dollar = 0;
        var rate,subTotal_amount;
        if(payment.sub_total_after_discounts===undefined || payment.sub_total_after_discounts ===null || (!payment.sub_total_after_discounts)) {
            subTotal_amount = 0;
        } else {
            subTotal_amount = payment.sub_total_after_discounts;
        }
        for(var i=0;i<recommenderRate.length;i++) {
            rate = recommenderRate[i];
            if ((rate.min<= subTotal_amount && rate.max > subTotal_amount) ||
                (rate.min<= subTotal_amount && (rate.max ===null || rate.max===undefined))) {
                recommender_blue_dollar = rate.reward;
            }
        }
        if(order.bill_status.is_first_time_online_payment === true) {
            payment.blue_dollar_paid_to_inviter         = recommender_blue_dollar;                  //-- ???
        }else{
            payment.blue_dollar_paid_to_inviter         = 0;                  //-- ???
        }

        //--    AI: (V * 0.8 + 0) * (1 - H) + P
        //-- or AI: (V * 0.8 + W) * (1 - H) + P
        var paymentTypeAddend = payment.amount_to_pay_restaurant_offline;
        //if (payment.payment_type === PAYMENTTYPE.OFFLINE || payment.payment_type === PAYMENTTYPE.DEBIT) {
        if(bill_status.is_online_payment !==true) {
            paymentTypeAddend = 0;
        };

        payment.ap_to_restaurant_future_settlement          //D33=(D16 * 0.8+D17) *(1-D2)+D10
            = (payment.blue_dollar_bought_from_restaurant
            * otherServers.other_rates.ap_settlement_rate
            + paymentTypeAddend)
            * (1 - payment.online_transaction_charge_rate)
            + payment.gold_dollar_amount_paid;

        payment.balance_change_restaurant_bd_account                      //-- AJ (BCRBD): D * -1
            = payment.blue_dollar_bought_from_restaurant * -1;

        payment.payer_bd_account_balance_change                           //-- AK: A * -1
            = payment.blue_dollar_amount_paid * -1;

        payment.payer_gd_account_balance_change                           //-- AL: E * -1
            = payment.gold_dollar_amount_paid * -1;

        if(payment.credit_service_charge !==0) {
            payment.fandine_revenue_selling_bd                                //-- D38=D15*(1-D26/D22)
                = payment.blue_dollar_bought_from_fandine
                * (1 - payment.service_charge_shared_by_fd / payment.credit_service_charge);

            payment.fandine_revenue_bd_exchange_service                       //-- D39 =(D14+D16)*0.1*(1-D26/D22)
                = (payment.blue_dollar_bought_from_consumer
                + payment.blue_dollar_bought_from_restaurant)
                * otherServers.other_rates.fandine_revenue_bd_exchange_service_rate
                * (1 - payment.service_charge_shared_by_fd/payment.credit_service_charge);
        } else {
            payment.fandine_revenue_selling_bd = 0;
            payment.fandine_revenue_bd_exchange_service = 0;
        }

        payment.owned_to_consumers_bd_exchange = payment.blue_dollar_bought_from_consumer
        * otherServers.other_rates.ap_settlement_rate;

        payment.fandine_bd_account_balance_change                         //-- AP (FBDABC): FGBDG + FBDGFV - C
            = payment.fandine_general_bd_gain
        + payment.fandine_additional_bd_gain_first_visit
        - payment.blue_dollar_bought_from_fandine;

    }else{
        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateTransactionsForNA offline payment ', is_online_payment: bill_status.is_online_payment });
        payment.total_blue_dollar_bought = 0;
        payment.amount_to_buy_blue_dollar = 0;
        payment.amount_to_pay_restaurant_offline   //B17 =B5+B6+B7-B9-B10-B12
            = payment.grand_total_to_pay - payment.total_blue_dollar_bought
            -payment.blue_dollar_amount_paid - payment.gold_dollar_amount_paid ;
        payment.amount_to_pay_fandine_transaction = 0;
        payment.total_amount_to_pay_with_bd_and_gd      //B13=B8+B11-B12-B9-B10
            = payment.grand_total_to_pay +payment.amount_to_buy_blue_dollar - payment.total_blue_dollar_bought
            -payment.blue_dollar_amount_paid - payment.gold_dollar_amount_paid ;
        payment.online_payment_amount = 0;
        payment.total_consumer_gd_to_restaurant_gd = 0;
        payment.online_transaction_charge_rate = 0;
        payment.total_consumer_bd_to_restaurant_bd  // B21=B12+B9
            =payment.total_blue_dollar_bought + payment.blue_dollar_amount_paid;
        payment.credit_service_charge = 0;
        payment.real_alipaty_service_charge = 0;
        payment.total_dollar_fdacc_after_service_charge = 0;
        payment.dollar_to_fandine = 0;
        payment.dollar_to_restaurant = 0;
        payment.total_dollar = 0;
        payment.split_payment_going_to_restaurant=0;
        payment.split_payment_going_to_fandine = 0;
        payment.fandine_general_bd_gain = 0;
        payment.fandine_additional_bd_gain_first_visit = 0;
        payment.blue_dollar_issued_to_fandine = 0;
        payment.blue_dollar_paid_to_inviter = 0;
        payment.ap_to_restaurant_future_settlement = 0;
        payment.balance_change_restaurant_bd_account = 0;
        payment.payer_bd_account_balance_change = payment.blue_dollar_amount_paid * (-1);
        payment.payer_gd_account_balance_change = 0;
        payment.fandine_revenue_selling_bd = 0;
        payment.fandine_revenue_bd_exchange_service = 0;
        payment.owned_to_consumers_bd_exchange = 0;
        payment.fandine_bd_account_balance_change = 0;
        payment.service_charge_shared_by_fd = 0;

        //payment.first_visit_customer_savings = 0;
        //payment.total_discounts = 0;
        //payment.sub_total_after_discounts = 0;
    }
    var actualPayment = payment;
    order.before_round_data = {};
    order.before_round_data.payment = _this.backendHelpers.jsonHelper().cloneDocument(actualPayment);

    for(var key in payment){
        var value = payment[key];
        payment[key] = _this.dataGenerationHelper.getAccurateNumber(value, 2);
    }

    // for tax
    if (payment.taxes && payment.taxes.length > 0) {
        for (var i=0; i<payment.taxes.length; i++) {
            payment.taxes[i].amount = _this.dataGenerationHelper.getAccurateNumber(payment.taxes[i].amount, 2);
        }
    }

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateTransactionsForNA calculated transaction ', payment: payment });

    return payment;
};

//-- FBE-1106: [Orders] Transfer the calculation of Transactions from GET Bill v2 to Update Order API
var CalculateTransactions = function (order, PAYMENTTYPE, otherServers) {
    var _this = exports;

    var country = otherServers.country;
    if (!country || (otherServers.region.north_america.indexOf(country) >-1)) {
        country = _this.enums.RegionCode.NA;
    } else {
        country = _this.enums.RegionCode.CHINA;
    }

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateTransaction received paid order ', order: order, otherServers: otherServers });

    var payment = {};

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateTransaction received paid order ', country: country });
    if (country === _this.enums.RegionCode.CHINA) {
        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateTransaction received paid order country is China ', country: country });
        payment =  _this.calculateTransactionsForChina(order, PAYMENTTYPE, otherServers);
    }else{ //  NA
        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateTransaction received paid order country is NA ', country: country });
        payment =  _this.calculateTransactionsForNA(order, PAYMENTTYPE, otherServers);
    }

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateTransaction calculated transaction ', payment: payment });

    return payment;

};

//FBE-1177
var CalculateForAlipay = function (order, otherServers) {
    var _this = exports;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateForAlipay received paid order ', order: order, otherServers: otherServers });
    var country = otherServers.country;
    if (!country || (otherServers.region.north_america.indexOf(country) >-1)) {
        country = _this.enums.RegionCode.NA;
    } else {
        country = _this.enums.RegionCode.CHINA;
    }
    var payment = _this.backendHelpers.jsonHelper().cloneDocument(order.payment) || {};
    var payment_information_for_alipay = _this.backendHelpers.jsonHelper().cloneDocument(order.payment_information_for_alipay) || {};
    
    // FBE-1690 in NA get bill v2, should not display alipay information modified by webber.wang 20150901
    // FBE-2020 V2 get bill calculation change modified by webber.wang 20151104
    if(country === _this.enums.RegionCode.CHINA) {
        payment_information_for_alipay.split_amount_going_to_restaurant =               //G40 =G25
            payment.split_payment_going_to_restaurant;

        payment_information_for_alipay.split_amount_going_to_alipay =                   //G41 = G23
            payment.real_alipaty_service_charge;

        payment_information_for_alipay.pre_settlement_amount      //G39 = G40+G41
            = payment_information_for_alipay.split_amount_going_to_restaurant + payment_information_for_alipay.split_amount_going_to_alipay;

        var actualPaymentAlipay = _this.backendHelpers.jsonHelper().cloneDocument(payment_information_for_alipay) || {};
        if (!order.before_round_data) {
            order.before_round_data = {};
        }
        order.before_round_data.payment_information_for_alipay = actualPaymentAlipay;

        payment_information_for_alipay.pre_settlement_amount             = parseFloat(Number(payment_information_for_alipay.pre_settlement_amount).toFixed(2));
        payment_information_for_alipay.split_amount_going_to_restaurant  = parseFloat(Number(payment_information_for_alipay.split_amount_going_to_restaurant).toFixed(2));
        payment_information_for_alipay.split_amount_going_to_fandine     = parseFloat(Number(payment_information_for_alipay.split_amount_going_to_fandine).toFixed(2));

        _this.logger.info('%j', { function: 'DEBUG-INFO: Order-Calculate.CalculateForAlipay calculated transaction ',
            payment_information_for_alipay: payment_information_for_alipay });

    } else {
        payment_information_for_alipay.pre_settlement_amount            = 0;
        payment_information_for_alipay.split_amount_going_to_restaurant = 0;
        payment_information_for_alipay.split_amount_going_to_fandine    = 0;
    }

    return payment_information_for_alipay;
};


var CalculateDeliveryFee = function (deliveryAddress, restaurantAddress, deliveryConfig) {
    var _this = exports;

    var result = {
        enable: true,
        delivery_distance: 0,
        delivery_fee: 0,
        delivery_fee_saving: 0
    };

    var deliveryAddressLocation = deliveryAddress.location;
    var restaurantAddressLocation = restaurantAddress.location;

    var directDistance = geolib.getDistance(
        {latitude: deliveryAddressLocation.lat, longitude: deliveryAddressLocation.lon},
        {latitude: restaurantAddressLocation.lat, longitude: restaurantAddressLocation.lon}
    );

    directDistance = _this.dataGenerationHelper.getAccurateNumber(directDistance/1000, 2);
    result.delivery_distance = directDistance;

    if (directDistance > deliveryConfig.max_distance) {
        result.enable = false;
        result.error = 'distance is more than delivery max distance';

        return result;
    }

    if (directDistance > deliveryConfig.free_delivery_distance) {
        result.delivery_fee = deliveryConfig.min_unit_delivery_fee_out_of_free_delivery_distance +
            (directDistance - deliveryConfig.free_delivery_distance) *
            (deliveryConfig.max_unit_delivery_fee - deliveryConfig.min_unit_delivery_fee_out_of_free_delivery_distance)/
            (deliveryConfig.max_distance - deliveryConfig.free_delivery_distance);
        if (result.delivery_fee < 0) {
            result.delivery_fee = 0;
        }

        result.delivery_fee = _this.dataGenerationHelper.getAccurateNumber(result.delivery_fee, 2);
    }

    if (deliveryConfig.free_delivery_enable === true) {
        result.delivery_fee_saving = result.delivery_fee;
    }

    return result;
}


var CalculateExpressFee = function () {

}


var isCombinations = function (orderItem) {

    return orderItem.combinations && orderItem.combinations.length > 0;
}


module.exports = function init(app, config, mongoConfig, logger) {
    var _this = exports;

    _this.app = app;
    _this.config = config;
    _this.logger = logger;
    _this.mongoConfig=mongoConfig;
    _this.restaurantDataAPI = require(_this.app.dbApiPath)(_this.config, _this.mongoConfig, _this.logger);

    _this.backendHelpers = require(_this.app.utilsPath)(_this.config, _this.mongoConfig, _this.logger);
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.httpExceptions =_this.backendHelpers.httpExceptions;
    _this.enums = _this.backendHelpers.enums;

    _this.calculateOrdersByUserId = CalculateOrdersByUserId;

    /**
     * Due to FBE-963, CalculateOrdersByOrderId() and unlockBillsByOrderId() got DEPRECATION Notice Date: 2015-05-10
     */
    _this.calculateOrdersByOrderId = CalculateOrdersByOrderId;

    /**
     * V2 APIs to replace soon-to-be-deprecated ones
     */
    _this.calculateOrder = CalculateOrder;

    _this.calculateTransactions = CalculateTransactions;
    _this.calculateTransactionsForChina = CalculateTransactionsForChina;
    _this.calculateTransactionsForNA = CalculateTransactionsForNA;
    _this.calculateForAlipay = CalculateForAlipay;

    _this.calculateDeliveryFee = CalculateDeliveryFee;
    _this.calculateExpressFee = CalculateExpressFee;

    return _this;
};
