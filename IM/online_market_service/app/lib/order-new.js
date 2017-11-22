/**
 * Created by webber.wang on 2016-5-4.
 */
'use strict';

var async = require('async');
var http = require('http');
var moment = require('moment');

var OnlineCloseOrder = function(orderId,headerToken,callback){
    var _this = exports;
    var runTime = 2;//run 3 times
    var apiresult ={status:204};
    _this.logger.info('%j', {function:'DEBUG-INFO: Order-New.OnlineCloseOrder received arguments ',orderId:orderId});
    _this.executeClose(orderId,headerToken, function (error,result) {
        _this.logger.info('%j', {function: 'DEBUG-INFO: order-new.OnlineCloseOrder',
            totallTime:runTime,
            result: result,
            error:error});
        callback(null,apiresult)
    });
    //
    //(function run(index) {
    //    _this.executeClose(orderId,headerToken, function (error,result) {
    //        _this.logger.info('%j', {function: 'DEBUG-INFO: order-new.OnlineCloseOrder',
    //            index:index,
    //            totallTime:runTime,
    //            result: result,
    //            error:error});
    //        if (index === runTime || result.is_finished) return callback(null,apiresult);
    //        run(++index);
    //    });
    //
    //})(0);
}
var ExecuteClose = function(orderId,headerToken,callback){
    var _this = exports;
    var apiresult;

    var selector = { };
    var options = { };
    var helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: order-new.js; Method: OnlineCloseOrder()' };
    var status,schedule_status = false ;
    var schedule ={};

    var order = {};


    async.series([
        //step-1 query the order
        function(nextstep){
            selector = { _id: orderId };
            helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: Order-New.js; Method: ExecuteClose()' };
            _this.restaurantDataAPI.find(selector, options, helper, function (error, result) {
                if(error){
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order-New.ExecuteClose step-1 query the order returns an error', order_id: orderId});
                    nextstep(new _this.httpExceptions.InvalidParameterException( 'order_id', orderId));
                }else if(result == null || result == undefined || result.length == 0){
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order-New.ExecuteClose step-1 query the order returns empty', order_id: orderId});
                    nextstep(new _this.httpExceptions.ResourceNotFoundException( 'order_id', orderId));
                } else {
                    order = result[0];
                    status = order.status;
                    if(order.close_schedule){
                        schedule_status = order.close_schedule.is_finished;
                        schedule = order.close_schedule.schedule;
                    }
                    if(status === _this.enums.OrderStatus.CLOSED && schedule_status){
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order-New.ExecuteClose step-1 query the order,order has been closed,return'});
                        apiresult ={is_finished:true};
                        callback(null,apiresult);
                    }else{
                        _this.logger.info('%j', {function:'DEBUG-INFO: Order-New.ExecuteClose step-1 query the order,order has not been closed,execute close function'});
                        nextstep();
                    }
                }
            });
        },
        //step-2 execute the close progress
        function(nextstep){
            _this.onlineCloseManager.executeCloseOrder(order,headerToken,function(error,result){
                if(error){
                    _this.logger.error('%j', {
                        function: 'DEBUG-ERROR: Order-New.ExecuteClose step-2 execute the close progress returns an error',
                        error: error
                    });
                    nextstep(error);
                }else{
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order-New.ExecuteClose  step-2 execute the close progress==success',
                        result:result});
                    apiresult ={is_finished:result.is_finished};
                    nextstep();
                }
            })
        }

    ],function(error){
        callback(error, apiresult);
    });
};

var GetFirstOrderStatistics = function(reqParams, callback) {
    var _this = exports;
    var selector = {};
    var options = {};
    var helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: Order-New.js; Method: GetFirstOrderStatistics()'};

    var SimpleFormat = 'YYYY-MM-DD';
    var ResultFormat = 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]';
    var MaxDaysCount = 90;

    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-New.GetFirstOrderStatistics received arguments:', reqParams: reqParams });

    var startDateStr = reqParams.startDate,
        endDateStr = reqParams.endDate;

    var startDate, endDate, dateMap = {}, now = moment(moment().utc().format(SimpleFormat), SimpleFormat).utc();
    if(startDateStr && startDateStr.length > 0) {
        startDate = moment(startDateStr).utc();
    }
    if(endDateStr && endDateStr.length > 0) {
        endDate = moment(endDateStr).utc();
        if(endDate > now) {
            endDate = now;
        }
        endDate.local().add('day', 1).utc();
    } else {
        endDate = now.clone().local().add('day', 1).utc();
    }

    if(startDate) {
        var deadlineDay = startDate.clone().local().add('day', MaxDaysCount).utc();
        if(deadlineDay < endDate) {
            endDate = deadlineDay;
        }
    } else {
        /*startDate = endDate.clone();
        startDate.startOf('month');
        startDate = startDate.utc();*/
       startDate = endDate.clone().local().add('day', -MaxDaysCount).utc();
    }
    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-New.GetFirstOrderStatistics date',startDate:startDate,endDate:endDate });

    var d = startDate.clone();
    while(d.isBefore(endDate)||d.isSame(endDate)) {
        dateMap[d.format(ResultFormat)] = {
            date: d.format(ResultFormat),
            total: 0,
            first_time:0,
            not_first_time: 0
        };
        d.local().add('day', 1).utc();
    }

    for(var key in dateMap) {
        var data = dateMap[key];
        dateMap[key.substr(0, 10)] = data;
        delete dateMap[key];
    }
    var citys;
    var resultData = {};

    async.waterfall([
        //get citys
        function(nextstep){
            var selector_array = [
                {$project:{city:'$city'}},
                {$group:{_id:null,citys:{$push:'$city'}}},
                {$project:{citys:'$citys',_id:-1}}
            ];
            helper = {collectionName: _this.enums.CollectionName.CITY_LOCATION};
            _this.restaurantDataAPI.aggregateWithArray(selector_array, helper, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order-New.js; Method: GetFirstOrderStatistics()step-query citys returns error', error: error});
                    callback(new _this.httpExceptions.DataConflictedException('get operations', 'error'));
                } else {
                    _this.logger.info('%j', {function:'DEBUG-INFO:Order-New.js; Method: GetFirstOrderStatistics()step-query citys returns right',result:result});
                    citys = result[0].citys;
                    
                    nextstep();
                }
            });
        },
        //get registered user count for each AuthType
        function(nextstep){

            selector = {status:'CLOSED', '$and':[{'bill_status.is_online_payment':true},{'billStatus.isOnlinePayment':true}],'restaurant.addresses.city':{$in:citys}};
            helper = { collectionName: _this.enums.CollectionName.DINING_ORDERS, callerScript: 'File: Order-New.js; Method: GetFirstOrderStatistics()'};
            if(startDate || endDate) {
                if(startDate && endDate) {
                    if(startDate < endDate) {
                        selector.close_time = {$gte:  new Date(startDate), $lt:new Date(endDate)};
                    } else {
                        selector.close_time = {$gte: new Date(startDate)};
                    }
                } else {
                    if(startDate) {
                        selector.close_time =  {$gte:  new Date(startDate)};
                    } else {
                        selector.close_time = {$lt: new Date(endDate)};
                    }
                }
            }
            //group by date
            var keys={};
            var initial = { total : 0, first_time: 0 ,not_first_time:0};
            //for each group, calculate user count
            var reduce=function(curr,result){
                if(curr.bill_status.is_first_time_online_payment ==true){
                    result.first_time += 1;
                }else{
                    result.not_first_time += 1;
                }
                result.total++;
            };
            var finalize=null;
            var command = null;
            var options = null;
            _this.restaurantDataAPI.group(keys, selector, initial, reduce, finalize,command,options, helper, function(error, res) {
                if(error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order-New.GetFirstOrderStatistics Step-1 query order total numbers returns error:', error: error });
                    callback(error);
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-New.GetFirstOrderStatistics Step-1 query order total numbers completed',return_result:res });

                    resultData.source=res;
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-New.GetFirstOrderStatistics success' });

                    nextstep();
                }
            })
        },
        //get registered user count everyday grouped by AuthType
        function(nextstep) {

            //group by date
            var keys=function(doc){
                var date = new Date(doc.create_time);
                var dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                return {day:dateKey};
            };
            var initial = { total : 0, first_time: 0 ,not_first_time:0};
            //for each group, calculate user count
            var reduce=function(curr,result){
                if(curr.bill_status.is_first_time_online_payment ==true){
                    result.first_time += 1;
                }else{
                    result.not_first_time += 1;
                }
                result.total++;
            };
            var finalize = null;
            var command = null;
            var options = null;

            _this.restaurantDataAPI.group(keys, selector, initial, reduce, finalize,command,options, helper, function(error, res) {
                if(error) {
                    _this.logger.error('%j', { function: 'DEBUG-ERROR: Order-New.GetFirstOrderStatistics Step-2 query order count every day  returns error:', error: error });
                    callback(error);
                } else {
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-New.GetFirstOrderStatistics Step-2 query order count every day completed',return_result:res });
                    resultData.days = [];
                    if(res && Array.isArray(res) && res.length>0){
                        for(var i=0; i<res.length; i++){
                            var item = res[i];
                            var day = moment( item.day).utc().format(ResultFormat);
                            _this.logger.info('%j',{day:day});


                            var day_sub_str = day.substr(0, 10);
                            if(dateMap[day_sub_str]) {
                                dateMap[day_sub_str] = {
                                    date: day,
                                    total: item.total,
                                    first_time:item.first_time,
                                    not_first_time:item.not_first_time
                                }
                            }

                        }
                    }
                    var dateArray = [];
                    for(var i in dateMap) {
                        dateArray.push(dateMap[i]);
                    }
                    resultData.days = dateArray;
                   // resultData.days = dateMap;
                    var apiResult = {status: 200, data: resultData};
                    _this.logger.info('%j', { function: 'DEBUG-INFO: Order-New.GetFirstOrderStatistics success' });
                    callback(null, apiResult);
                }
            })
        }
    ], function(error, result) {
        callback(error, result);
    })
}

var GetAllOrders = function (queryParas, callback) {
    var _this = exports;
    var apiresult;
    var query = {};
    var userIds = [];
    async.series([
        // init the query parameters
        function (nextstep) {

            if(isNotNull(queryParas.restaurant_id)){
                query['restaurant.restaurant_id'] = queryParas.restaurant_id;
            }

            if(!isNotNull(queryParas.restaurant_id) && isNotNull(queryParas.restaurant_name)){
                query['restaurant.restaurant_name'] = {$regex: queryParas.restaurant_name, $options: 'i'};
            }
            if(isNotNull(queryParas.order_type)){

                if(_this.enums.OrderType.DINNER === queryParas.order_type.toUpperCase()){
                    query['order_type'] = {$exists:false};
                    query['is_takeout'] = {$ne:true};
                }else if(_this.enums.OrderType.TAKEOUT === queryParas.order_type.toUpperCase()){
                    query['is_takeout'] = true;
                    if(isNotNull(queryParas.takeout_status)){
                        if(queryParas.takeout_status.toUpperCase() === 'PAID' ){
                            query.picked_up = {$ne:true};
                        }else{
                            query.picked_up =true;
                        }
                    }
                }else{
                    query.order_type = queryParas.order_type;

                    if(_this.enums.OrderType.DELIVERY === queryParas.order_type.toUpperCase() && isNotNull(queryParas.delivery_status)){
                        query.delivery_status =queryParas.delivery_status;
                    }
                }
                
            }else{
                if(isNotNull(queryParas.delivery_status)){
                    query.delivery_status =queryParas.delivery_status;
                }

                if(isNotNull(queryParas.takeout_status)){
                    if(queryParas.takeout_status.toUpperCase() === 'PAID' ){
                        query.picked_up = {$ne:true};
                    }else{
                        query.picked_up =true;
                    }
                }
            }
            var startTime = queryParas.from_date ;
            var endTime = queryParas.to_date ;
            if (isNotNull(startTime) && isNotNull(endTime)) {
                query.create_time = {$gte:_this.dataGenerationHelper.getUtcToLocalDate(startTime), $lte:_this.dataGenerationHelper.getUtcToLocalDate(endTime)};
            } else if (isNotNull(startTime) && !isNotNull(endTime)) {
                query.create_time = {$gte:_this.dataGenerationHelper.getUtcToLocalDate(startTime)};
            } else if (!isNotNull(startTime) && isNotNull(endTime)) {
                query.create_time = {$lte:_this.dataGenerationHelper.getUtcToLocalDate(endTime)};
            }

            if(queryParas.order_status){
                query.status = queryParas.order_status;
            }

            _this.logger.info('%j', {function:'DEBUG-INFO: Order-New.GetAllOrders  step-1 init query para==',
                queryParas:queryParas,
                query:query
            });
            nextstep();
        },

        function (nextstep) {
           // var options = {fields:{ user:1,servers:1,_id:1,restaurantResponse:1,restaurantId:1}};
            var options = {};
            _this.orderManager.pagingFunction(options,queryParas.from,queryParas.page_size);
            options.sort = { 'create_time':-1,'_id':1 };
            var selector =  query;
            var helper = {
                collectionName: _this.enums.CollectionName.DINING_ORDERS,
                apiVersion: 1
            };
            _this.restaurantDataAPI.find(selector,options,helper,function (error,orderResult) {
                if (error) {
                    callback(error);
                } else if (orderResult === null || orderResult === '' || orderResult.length === 0) {
                    apiresult = {status: 200, data: orderResult};
                    nextstep()
                } else {
                    apiresult = {status: 200, data: orderResult};
                    nextstep();
                }
            });
        }
    ], function (error) {
        callback(error, apiresult);
    });
};

var isNotNull = function(value) {
    if (value !== null && value !== '' && value !== undefined) {
        return true;
    }

    return false;
}

module.exports = function init(app,config, mongoConfig, logger) {
    var _this = exports;
    //-- NOTE to Developers: For READABILITY purpose, PLEASE help maintain a double-spacing between two Functions declarations.//-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
    //-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions (below) in alphabetical order
    //-- NOTE to Developers (2015-05-13): 3) For READABILITY, please help to maintain double-spaces between functions declarations (above)
    _this.app = app;
    _this.config = config;
    _this.logger = logger;
    _this.mongoConfig = mongoConfig;
    _this.restaurantDataAPI = require(_this.app.dbApiPath)(_this.config, _this.mongoConfig, _this.logger);
    _this.onlineCloseManager = require('./services/online-close-order')(_this.app, config, mongoConfig, logger);
    _this.orderManager = require('./services/order-manager')(_this.app, _this.config, _this.mongoConfig, _this.logger);
    _this.backendHelpers = require(_this.app.utilsPath)(_this.config, _this.mongoConfig, _this.logger);
    _this.Schema = _this.backendHelpers.Schemas;
    _this.enums = _this.backendHelpers.enums;
    _this.httpExceptions =_this.backendHelpers.httpExceptions;
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();

    _this.onlineCloseOrder = OnlineCloseOrder;

    _this.executeClose = ExecuteClose;

    _this.getFirstOrderStatistics = GetFirstOrderStatistics;

    _this.getAllOrders  = GetAllOrders;

    return _this;
};
