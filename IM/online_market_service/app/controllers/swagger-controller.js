/**
 * Created by alexander.liu on 12/1/2014.
 */
'use strict';

var fs = require('fs');
var InitSwagger = function(req, res) {
    var _this = exports;
    fs.readFile(__dirname + '/../../public/api-docs/api-docs.json', 'utf8', function (err, data) {
        if (err) {
            _this.logger.error('Error: ' + err);
            return;
        }
        _this.logger.info(data);
        data = JSON.parse(data);

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(data));
    });
};
var GetOrderSwagger = function(req, res) {
    var _this = exports;
    fs.readFile(__dirname + '/../../public/api-docs/order.json', 'utf8', function (err, data) {
        if (err) {
            _this.logger.error('Error: ' + err);
            return;
        }
        data = JSON.parse(data);

        //-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
        //-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions in alphabetical order

        data.models.AddOrderItemsPerUnitPrice = _this.Schema.AddOrderItemsPerUnitPrice;
        data.models.AddOrderItemsFixPrice = _this.Schema.AddOrderItemsFixPrice;
        data.models.AddOrderItemToOrderSchema = _this.Schema.AddOrderItemToOrderSchema;
        data.models.AddCustomersToOrderSchema = _this.Schema.AddCustomersToOrderSchema;
        data.models.Addresses = _this.Schema.Addresses;
        data.models.billStatus = _this.Schema.billStatus;
        data.models.BillSchema = _this.Schema.BillSchema;
        data.models.SimplifiedBillSchema = _this.Schema.SimplifiedBillSchema;
        data.models.childrenItem =_this.Schema.childrenItem;
        data.models.childrenItemV1 = _this.Schema.childrenItemV1;
        data.models.childrenItemV2 = _this.Schema.childrenItemV2;
        data.models.ChildrenItemV2 = _this.Schema.ChildrenItemV2;
        data.models.Comment = _this.Schema.Comment;
        data.models.CommentAttachment = _this.Schema.CommentAttachment;
        data.models.CommentDetals = _this.Schema.CommentDetals;
        data.models.currency = _this.Schema.currency;
        data.models.Customers = _this.Schema.Customers;
        data.models.customersInfo = _this.Schema.customersInfo;
        data.models.CustomersObjectInOrderSchema = _this.Schema.CustomersObjectInOrderSchema;
        data.models.Followers = _this.Schema.Followers;

        data.models.GetOrderOnlySchema = _this.Schema.GetOrderOnlySchema;
        data.models.GoldAndBlueDollarsInOrderSchema = _this.Schema.GoldAndBlueDollarsInOrderSchema;
        data.models.items = _this.Schema.items;
        data.models.Location = _this.Schema.Location;
        data.models.lastOrderTime = _this.Schema.lastOrderTime;
        data.models.logo = _this.Schema.logo;
        data.models.logoV2 = _this.Schema.logoV2;
        data.models.PreOrderSchema = _this.Schema.PreOrderSchema;
        data.models.PreOrdersSchema = _this.Schema.PreOrdersSchema;
        data.models.PrintedFlags = _this.Schema.PrintedFlags;
        data.models.MoneyObjectInOrderSchema = _this.Schema.MoneyObjectInOrderSchema;
        data.models.MoneySchema = _this.Schema.MoneySchema;
        data.models.MoneySchema1 = _this.Schema.MoneySchema1;
        data.models.orderServers =_this.Schema.orderServers;
        data.models.orderServerInfo = _this.Schema.orderServerInfo;
        data.models.orderWithRating = _this.Schema.orderWithRating;
        data.models.orderRestaurant = _this.Schema.orderRestaurant;
        data.models.orders = _this.Schema.orders;
        data.models.OrderItemPerUnitPrice = _this.Schema.OrderItemPerUnitPrice;
        data.models.orderItemsResultArray = _this.Schema.orderItemsResultArray;
        data.models.Order = _this.Schema.OrderSchema;
        data.models.OrderCustomersSchema = _this.Schema.OrderCustomersSchema;
        data.models.OrderItem = _this.Schema.OrderItem;
        data.models.OrderItems = _this.Schema.OrderItems;
        data.models.OrderItemsDetals = _this.Schema.OrderItemsDetals;
        data.models.OrderItemsAddressSchema = _this.Schema.OrderItemsAddressSchema;
        data.models.OrderItemsSchema = _this.Schema.OrderItemsSchema;
        data.models.OrderSave = _this.Schema.OrderSaveSchema;
        data.models.OrderSchemaV2 = _this.Schema.OrderSchemaV2;
        data.models.OrderOnlySchema = _this.Schema.OrderOnlySchema;
        data.models.orderItems = _this.Schema.orderItems;
        data.models.OrderItemsObjectInOrderSchema = _this.Schema.OrderItemsObjectInOrderSchema;
        data.models.OrderItemSchema = _this.Schema.OrderItemSchema;
        data.models.OrderItemsV2 = _this.Schema.OrderItemsV2;
        data.models.OrderItemsObjectInOrderSchemaForV3 = _this.Schema.OrderItemsObjectInOrderSchemaForV3;
        data.models.OrderTips = _this.Schema.orderTips;
        data.models.OrderStatusSchema = _this.Schema.OrderStatusSchema;
        data.models.PaymentObjectInBillSchema = _this.Schema.PaymentObjectInBillSchema;
        data.models.price = _this.Schema.price;
        data.models.putOrderItemsResult = _this.Schema.putOrderItemsResult;
        data.models.restaurantIds = _this.Schema.restaurantIds;
        data.models.ReservationSave = _this.Schema.ReservationSaveSchema;
        data.models.RestaurantObjectInOrderSchema = _this.Schema.RestaurantObjectInOrderSchema;
        data.models.ReservationsPreOrderSchema = _this.Schema.ReservationsPreOrderSchema;
        data.models.Tax = _this.Schema.Tax;
        data.models.servers =_this.Schema.servers;
        data.models.serversInfo = _this.Schema.serversInfo;
        data.models.ServerTableInfo = _this.Schema.ServerTableInfo;
        data.models.ServerTables = _this.Schema.ServerTables;
        data.models.SubComments = _this.Schema.SubComments;
        data.models.tableId =_this.Schema.tableId;
        data.models.tableBusserServer = _this.Schema.tableBusserServer;
        data.models.TableServerUserId = _this.Schema.TableServerUserId;
        data.models.TableBusserUserId = _this.Schema.TableBusserUserId;
        data.models.TablesUserId = _this.Schema.TablesUserId;
        data.models.TableAssignments = _this.Schema.TableAssignments;
        data.models.User = _this.Schema.User;
        data.models.UserOrderSchema = _this.Schema.UserOrderSchema;
        data.models.UserOrderItems = _this.Schema.UserOrderItems;
        data.models.UserChildrenItem = _this.Schema.UserChildrenItem;
        data.models.CurrentOrder = _this.Schema.CurrentOrder;
        data.models.ShortRestaurantInfo = _this.Schema.ShortRestaurantInfo;
        data.models.ShortTableInfo = _this.Schema.ShortTableInfo;
        data.models.OrderTax = _this.Schema.OrderTax;
        data.models.TipTotalAmountSchema = _this.Schema.TipTotalAmountSchema;

        data.models.SimpleOrderSchema = _this.Schema.SimpleOrderSchema;
        data.models.SimpleOrderItemsSchema = _this.Schema.SimpleOrderItemsSchema;
        data.models.SimpleOrderItemsCombinationsSchema = _this.Schema.SimpleOrderItemsCombinationsSchema;
        data.models.SimpleBillCombinationsSchema = _this.Schema.SimpleBillCombinationsSchema;
        data.models.OrderNoteSchema = _this.Schema.OrderNoteSchema;
        data.models.OrderPickedUpTimeSchema = _this.Schema.OrderPickedUpTimeSchema;

        data.models.RestaurantOrderStatSchema = _this.Schema.RestaurantOrderStatSchema;
        data.models.TotalTransactionSchema = _this.Schema.TotalTransactionSchema;
        data.models.OrderStatSchema = _this.Schema.OrderStatSchema;
        data.models.PaymentStatSchema = _this.Schema.PaymentStatSchema;
        data.models.TransactionAmountSchema = _this.Schema.TransactionAmountSchema;

        data.models.EditOrderItemsSchema = _this.Schema.EditOrderItemsSchema;
        data.models.EditOrderItemSchema = _this.Schema.EditOrderItemSchema;

        data.models.RestaurantSummarySchema = _this.Schema.RestaurantSummarySchema;
        data.models.OrderPrintedNumberSchema = _this.Schema.OrderPrintedNumberSchema;
        data.models.OrderItemPrintedNumberSchema = _this.Schema.OrderItemPrintedNumberSchema;
        data.models.TaskPrintedNumberSchema = _this.Schema.TaskPrintedNumberSchema;
        data.models.OrderPrinterSchema = _this.Schema.OrderPrinterSchema;
        data.models.OrderPrinterUsageSchema = _this.Schema.OrderPrinterUsageSchema;
        data.models.PrintTaskSchema = _this.Schema.PrintTaskSchema;
        data.models.PrintTasksSchema = _this.Schema.PrintTasksSchema;
        data.models.PrintTasksOrderItemsSchema = _this.Schema.PrintTasksOrderItemsSchema;
        data.models.CancelOrderReasonSchema = _this.Schema.CancelOrderReasonSchema;
        data.models.OderOperationsSchema = _this.Schema.OderOperationsSchema;
        data.models.OperationsSchema = _this.Schema.OperationsSchema;
        data.models.OperationSchema = _this.Schema.OperationSchema;
        data.models.TableSchema = _this.Schema.TableSchema;

        data.models.CityOrderStatSchema = _this.Schema.CityOrderStatSchema;
        data.models.TotalCityOrderStatSchema = _this.Schema.TotalCityOrderStatSchema;
        data.models.TotalCityOrderStatDaysSchema = _this.Schema.TotalCityOrderStatDaysSchema;

        data.models.OrderCountsSchema = _this.Schema.OrderCountsSchema;
        data.models.sourceSchema = _this.Schema.sourceSchema;
        data.models.daysSchema = _this.Schema.daysSchema;
        data.models.OnlinePaymentTypeEnum = _this.Schema.OnlinePaymentTypeEnum;

        data.models.ReorderSchema = _this.Schema.ReorderSchema;
        data.models.ReorderRestaurantSchema = _this.Schema.ReorderRestaurantSchema;
        data.models.ReorderOrderItemsSchema = _this.Schema.ReorderOrderItemsSchema;
        data.models.ReorderOrderItemsInvalidSchema = _this.Schema.ReorderOrderItemsInvalidSchema;
        data.models.CustomerAASchema = _this.Schema.CustomerAASchema;
        data.models.CustomerAAMobileSchema = _this.Schema.CustomerAAMobileSchema;
        //-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
        //-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions in alphabetical order

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(data));
    });
};

var GetMessageSwagger = function(req, res) {
    var _this = exports;
    fs.readFile(__dirname + '/../../public/api-docs/message.json', 'utf8', function (err, data) {
        if (err) {
            _this.logger.error('Error: ' + err);
            return;
        }
        data = JSON.parse(data);

        //-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
        //-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions in alphabetical order

        data.models.MessageSchema = _this.Schema.MessageSchema;
        data.models.MessageSaveSchema = _this.Schema.MessageSaveSchema;
        data.models.messageItemInfo = _this.Schema.messageItemInfo;
        data.models.userInfo = _this.Schema.userInfo;
        data.models.PromotionResultSchema = _this.Schema.PromotionResultSchema;
        data.models.PromotionShareContentSchema = _this.Schema.PromotionShareContentSchema;
        data.models.PromotionSaveSchema = _this.Schema.PromotionSaveSchema;
        data.models.PromotionPageSchema = _this.Schema.PromotionPageSchema;
        data.models.PromotionShareContent = _this.Schema.PromotionShareContent;
        data.models.PromotionImage = _this.Schema.PromotionImage;
        data.models.ShareContent = _this.Schema.ShareContent;
        data.models.MessageItem =  _this.Schema.MessageItem;
        data.models.PromotionWinnerSchema = _this.Schema.PromotionWinnerSchema;
        data.models.PromotionWinnerDataSchema = _this.Schema.PromotionWinnerDataSchema;


        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(data));
    });
};

var GetShoppingCartSwagger = function(req, res) {
    var _this = exports;
    fs.readFile(__dirname + '/../../public/api-docs/shopping-cart.json', 'utf8', function (err, data) {
        if (err) {
            _this.logger.error('Error: ' + err);
            return;
        }
        data = JSON.parse(data);

        //-- NOTE to Developers (2015-05-13): 1) Let's be consistent that all exposed JSON objects should start with Upper-Case
        //-- NOTE to Developers (2015-05-13): 2) For READABILITY, please help to arrange these exposed functions in alphabetical order
        data.models.ShoppingCartSchema= _this.Schema.ShoppingCartSchema;
        data.models.ShoppingCartRestaurantSchema= _this.Schema.ShoppingCartRestaurantSchema;
        data.models.ShoppingCartDeliverSchema= _this.Schema.ShoppingCartDeliverSchema;
        data.models.ShoppingCartNotesSchema= _this.Schema.ShoppingCartNotesSchema;
        data.models.ShoppingCartTableSchema= _this.Schema.ShoppingCartTableSchema;
        data.models.ShoppingCartServerSchema= _this.Schema.ShoppingCartServerSchema;
        data.models.ShoppingCartSeatSchema= _this.Schema.ShoppingCartSeatSchema;
        data.models.ShoppingCartItemSchema= _this.Schema.ShoppingCartItemSchema;
        data.models.ShoppingCartCreateSchema= _this.Schema.ShoppingCartCreateSchema;
        data.models.ShoppingCartCreateTableSchema= _this.Schema.ShoppingCartCreateTableSchema;
        data.models.ShoppingCartCreateSeatSchema= _this.Schema.ShoppingCartCreateSeatSchema;
        data.models.ShoppingCartCreateItemSchema= _this.Schema.ShoppingCartCreateItemSchema;
        data.models.ShoppingCartAddItemSchema=_this.Schema.ShoppingCartAddItemSchema;
        data.models.AddSeatSchema=_this.Schema.AddSeatSchema;
        data.models.ShoppingCartItemsCombinationsSchema=_this.Schema.ShoppingCartItemsCombinationsSchema;
        data.models.ShoppingCartItemsCombinationsItemSchema=_this.Schema.ShoppingCartItemsCombinationsItemSchema;
        data.models.ShoppingCartDiscountSchema=_this.Schema.ShoppingCartDiscountSchema;
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(data));
    });
};


var GetPosPaymentSwagger = function(req, res) {
    var _this = exports;
    fs.readFile(__dirname + '/../../public/api-docs/pos_payment.json', 'utf8', function (err, data) {
        if (err) {
            _this.logger.error('Error: ' + err);
            return;
        }
        data = JSON.parse(data);
        data.models.PosPaymentCreateSchema= _this.Schema.PosPaymentCreateSchema;
        data.models.PosPaymentCreateTablesSchema= _this.Schema.PosPaymentCreateTablesSchema;
        data.models.PosPaymentCreateSeatsSchema= _this.Schema.PosPaymentCreateSeatsSchema;
        data.models.PosPaymentCreateItemsSchema= _this.Schema.PosPaymentCreateItemsSchema;
        data.models.PosPaymentCreateOrderDetailSchema=_this.Schema.PosPaymentCreateOrderDetailSchema;
        res.end(JSON.stringify(data));
    });
};

var GetPosDiscountSwagger = function(req, res) {
    var _this = exports;
    fs.readFile(__dirname + '/../../public/api-docs/pos_discount.json', 'utf8', function (err, data) {
        if (err) {
            _this.logger.error('Error: ' + err);
            return;
        }
        data = JSON.parse(data);
        data.models.PosDiscountSchema= _this.Schema.PosDiscountSchema;
        data.models.PosDiscountTimePeriod= _this.Schema.PosDiscountTimePeriod;
        data.models.PosDiscountDate= _this.Schema.PosDiscountDate;
        data.models.PosDiscountTime= _this.Schema.PosDiscountTime;
        data.models.PosDiscountHourMin=_this.Schema.PosDiscountHourMin;
        data.models.PosDiscountUpdateSchema=_this.Schema.PosDiscountUpdateSchema;
        res.end(JSON.stringify(data));
    });
};

var GetPosAnalyticsSwagger = function(req, res) {
    var _this = exports;
    fs.readFile(__dirname + '/../../public/api-docs/pos_analytics.json', 'utf8', function (err, data) {
        if (err) {
            _this.logger.error('Error: ' + err);
            return;
        }
        data = JSON.parse(data);
        res.end(JSON.stringify(data));
    });
};

var GetDeliveryAddressSwagger = function(req, res) {
    var _this = exports;
    fs.readFile(__dirname + '/../../public/api-docs/delivery_address.json', 'utf8', function (err, data) {
        if (err) {
            _this.logger.error('Error: ' + err);
            return;
        }
        data = JSON.parse(data);

        data.models.DeliveryAddressSaveSchema = _this.Schema.DeliveryAddressSaveSchema;
        data.models.DeliveryAddressUpdateSchema = _this.Schema.DeliveryAddressUpdateSchema;
        data.models.deliveryAddressInfo = _this.Schema.deliveryAddressInfo;
        data.models.deliveryLocationInfo = _this.Schema.deliveryLocationInfo;
        data.models.deliveryUserInfo = _this.Schema.deliveryUserInfo;
        data.models.deliveryReceiverInfo = _this.Schema.deliveryReceiverInfo;
        data.models.DeliveryFeeSchema = _this.Schema.DeliveryFeeSchema;

        res.end(JSON.stringify(data));
    });
};

module.exports = function (app) {
    var _this = exports;
    _this.app = app;
    _this.config = app.config;
    _this.logger = app.logger;
    _this.backendHelpers = require(_this.app.utilsPath)(_this.config, {}, _this.logger);
    _this.loggerName = 'swagger';
    _this.logger = _this.app.log4jsHelper.initialize(_this.loggerName);
    _this.httpHelper = _this.backendHelpers.httpHelper();
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.validators=_this.backendHelpers.SchemaValidator;
    _this.responseUtilsAPI=_this.backendHelpers.responseUtilsAPI;
    _this.Schema=_this.backendHelpers.Schemas;

    _this.initSwagger=InitSwagger;
    _this.getOrderSwagger=GetOrderSwagger;
    _this.getMessageSwagger= GetMessageSwagger;
    _this.GetShoppingCartSwagger=GetShoppingCartSwagger;
    _this.getPosPaymentSwagger = GetPosPaymentSwagger;
    _this.getPosDiscountSwagger = GetPosDiscountSwagger;
    _this.GetPosAnalyticsSwagger = GetPosAnalyticsSwagger;
    _this.GetDeliveryAddressSwagger = GetDeliveryAddressSwagger;
    return _this;
};
