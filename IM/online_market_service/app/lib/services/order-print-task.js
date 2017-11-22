/**
 * Created by richardmaglaya on 2014-11-10.
 */
'use strict';

var async = require('async');


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
};

var createNewKitchenTask = function(reqParams){
    var _this = exports;
    var createTime = _this.dataGenerationHelper.getValidUTCDate();

    var order = reqParams.order;
    var printer =  reqParams.printer;
    var orderItems =  reqParams.orderItems;
    var orderType =  reqParams.orderType;
    var printNumber =  reqParams.printNumber;
    var printType =  reqParams.printType;
    var printAction = reqParams.printAction;

    var printTask = {};

    return printTask;
};

var CreateFeieKitchenPrintTask = function(order,callback){
    var _this = exports;

    var printTasks = [];

    var orderType = _this.orderManager.getOrderType(order);
    var printAction ;

    var orderItems = [];

    if(order.status == _this.enums.OrderStatus.CANCELLED){
        printAction = _this.enums.ActionStatus.CANCEL;
    }
    var reqParams ={
        order:order,
        orderType:orderType,
        printAction:printAction
    };


    for (var i=0; i<order.order_items.length; i++) {
        var orderItem = {};
        orderItem.order_item_id = order.order_items[i].order_item_id;
        orderItem.item_id = order.order_items[i].item_id;
        orderItem.item_name = order.order_items[i].item_name;
        orderItem.item_names = order.order_items[i].item_names;
        orderItem.quantity = order.order_items[i].quantity;
        if (order.order_items[i].combinations) {
            orderItem.combinations = populatePrinterCombinations(order.order_items[i].combinations);
        }

        orderItems.push(orderItem);

        if (isValidLength(order.order_items[i].printers)) {
            for (var j=0; j<order.order_items[i].printers.length; j++) {
                var orderItemsPrinter = order.order_items[i].printers[j];
                //现在只处理飞鹅打印机
                if(orderItemsPrinter.type !=_this.enums.PrinterModule.FEIE) continue;

                if (isValidLength(orderItemsPrinter.usages)) {
                    for (var k=0; k<orderItemsPrinter.usages.length; k++) {
                        var usage = orderItemsPrinter.usages[k];
                        //现在只打印厨房小票
                        if(usage.usage != _this.enums.PrinterUsage.KITCHEN) continue;

                        var printNumber = usage.order_print_number;

                        if(!(printNumber && parseInt(printNumber,10) > 0 ) ) continue;

                        var itemsPrinter = {};
                        reqParams.printer = orderItemsPrinter;
                        reqParams.orderItems = [orderItem];
                        reqParams.printNumber = printNumber;
                        reqParams.printType = 'ITEM';
                        itemsPrinter = createNewKitchenTask(reqParams);

                        printTasks.push(itemsPrinter);
                    }
                }

            }
        }
    }

    if (isValidLength(order.printers)) {
        for (var i=0; i<order.printers.length; i++) {
            var orderPrinter = order.printers[i];

            //现在只处理飞鹅打印机
            if(orderPrinter.type !=_this.enums.PrinterModule.FEIE) continue;

            var isAllowPrint = false;
            var printNumber = 0;

            if (isValidLength(orderPrinter.usages)) {
                for (var j=0; j<orderPrinter.usages.length; j++) {
                    var usage = orderPrinter.usages[j];
                    //现在只打印厨房小票
                    if (usage.usage === _this.enums.PrinterUsage.KITCHEN ) {
                        printNumber = usage.order_print_number;
                        if(printNumber && parseInt(printNumber,10) > 0) {
                            isAllowPrint = true;
                        }
                        break;
                    }
                }
            }

            if (isAllowPrint) {
                var printTask = {};
                reqParams.printer = orderPrinter;
                reqParams.orderItems = orderItems;
                reqParams.printNumber = printNumber;
                reqParams.printType = 'ORDER';
                printTask = createNewKitchenTask(reqParams);

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
                _this.logger.error('%j', {function:'DEBUG-ERROR: Order.CreatePrintTask returns error', error: error});
                callback(error, null);
            } else {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreatePrintTask returns right'});
                callback(null, printTasks);
            }
        });
    } else {
        _this.logger.info('%j', {function:'DEBUG-INFO: Order.CreatePrintTask returns empty'});
        callback(null, printTasks);
    }
};

var PrintTasks=function(tasks,callback){
    var _this = exports;
    if(tasks.length  < 1){
        return callback(null,'OK');
    }

    async.eachSeries(tasks,function(task,next){
        printTask(task,function(err,res){
            if(err){
                next(err);
            }else{
                next();
            }
        });
    },function(error){
        callback(error,'OK');
    })

};

var printTask = function(task,callback){
    var _this = exports;

    var requestPara = {};
    requestPara.type = 'print';
    requestPara.sn = task.printer_sn;
    requestPara.content = task.content;
    requestPara.times = task.print_number;
    var history ={ create_time:_this.dataGenerationHelper.getValidUTCDate()};

    async.series([
        function(nextstep){

            _this.feiePrinter.requestFeieYun(requestPara,function(error,result){
                if(error){
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order-print-task.printTask do print returns error',
                        error:error
                    });
                    history.error = error;
                }else{
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order-print-task.printTask do print returns right',
                        result:result
                    });
                    history.result = result;
                }
                nextstep()
            });
        },
        function(nextstep){
            var selector = {_id : task._id};
            var updateBody = {$set: {printed_number: task.print_number, task_status: 'DONE'}, $push: { history: history}};
            var options = {};
            var helper = {  collectionName: _this.enums.CollectionName.PRINT_TASKS };

            if(history.error){
                updateBody = {$push: { history: history}};
            }
            _this.logger.info('%j', {function:'DEBUG-INFO: Order-print-task.printTask doUpdatePrintTask returns right',history:history,updateBody:updateBody});

            _this.restaurantDataAPI.update(selector, updateBody, options, helper, function(error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order-print-task.printTask  doUpdatePrintTask returns error', error: error});
                    nextstep(error);
                } else {
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order-print-task.printTask doUpdatePrintTask returns right'});
                    nextstep();
                }
            })
        }
    ],function(error){
        callback(error,'OK');
    })
};

var CreateAndPrintKitchenPrintTask = function(order,callback){
    var _this = exports;
    var tasks = [];
    async.series([
        function(nextstep){
            //step-0 check if China environment
            var country = _this.config.other_servers.country;
            if (!country || (_this.config.other_servers.region.north_america.indexOf(country) >-1)) {
                country = _this.enums.RegionCode.NA ;
            } else {
                country = _this.enums.RegionCode.CHINA;
            }
            if (country === _this.enums.RegionCode.NA || (!Array.isArray(order.order_items) || order.order_items.length < 1 )) {
                _this.logger.info('%j', {function:'DEBUG-INFO: Order-Print-Tasks.CreateAndPrintKitchenPrintTask -step-0 create tasks  [NA] OR order_item is null=====skip',
                    country:country});
                callback(null,{data:'OK'})
            }else{
                _this.logger.info('%j', {function:'DEBUG-INFO: Order-Print-Tasks.CreateAndPrintKitchenPrintTask -step-0 create tasks  [China]+=====continue',country:country});
                nextstep();
            }
        },
        function (nextstep) {
            //step-1 create print task
            _this.createFeieKitchenPrintTask(order, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {function:'DEBUG-ERROR: Order-Print-Tasks.CreateAndPrintKitchenPrintTask -step-1  create tasks returns error',error:error});
                    nextstep(error);
                } else {
                    _this.logger.info('%j', {function:'DEBUG-INFO: Order-Print-Tasks.CreateAndPrintKitchenPrintTask -step-1 create tasks   returns right',result:result.length});
                    tasks = result;
                    nextstep();
                }
            })
        },
        function (nextstep) {
            //step-2 print the tasks
            _this.printTasks(tasks, function (error, result) {
                if (error) {
                    _this.logger.error('%j', {
                        function: 'DEBUG-ERROR: Order-Print-Tasks.CreateAndPrintKitchenPrintTask -step-2  returns error',
                        error: error
                    });
                } else {
                    _this.logger.info('%j', {
                        function: 'DEBUG-INFO: Order-Print-Tasks.CreateAndPrintKitchenPrintTask -step-2  returns right',
                        result: result
                    });
                }
            })
            nextstep();
        }
    ],function(error){
        callback(error,{data:'OK'});
    })
}


module.exports = function init(app, config, mongoConfig, logger) {
    var _this = exports;

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
    _this.feiePrinter = _this.backendHelpers.feiePrinterHelper;

    _this.orderManager = require('./order-manager')(_this.app, _this.config, _this.mongoConfig, _this.logger);


    //-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
    //-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions (below) in alphabetical order
    //-- NOTE to Developers (2015-05-13): 3) For READABILITY, please help to maintain double-spaces between functions declarations
    _this.createFeieKitchenPrintTask = CreateFeieKitchenPrintTask;

    _this.createAndPrintKitchenPrintTask = CreateAndPrintKitchenPrintTask;

    _this.printTasks  = PrintTasks;

    return _this;
};
