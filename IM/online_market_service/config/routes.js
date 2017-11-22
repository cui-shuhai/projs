/**
 * Created by richardmaglaya on 2014-10-31.
 */
'use strict';

var controllersPath = '../app/controllers';

function swaggerRoutes(controllers){
    controllers = controllers || {};
    var _this = exports;
    _this.restaurantSwaggerController = controllers.restaurantSwaggerController || require(controllersPath + '/swagger-controller')(_this.app);
    _this.app.get('/api-docs',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.restaurantSwaggerController.initSwagger);

    _this.app.get('/api-docs/order',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.restaurantSwaggerController.getOrderSwagger);

    _this.app.get('/api-docs/message',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.restaurantSwaggerController.getMessageSwagger);

    _this.app.get('/api-docs/shopping_cart',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.restaurantSwaggerController.GetShoppingCartSwagger);

    _this.app.get('/api-docs/pos_payment',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.restaurantSwaggerController.getPosPaymentSwagger);

    _this.app.get('/api-docs/pos_discount',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.restaurantSwaggerController.getPosDiscountSwagger);

    _this.app.get('/api-docs/pos_analytics',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.restaurantSwaggerController.GetPosAnalyticsSwagger);

    _this.app.get('/api-docs/delivery_address',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.restaurantSwaggerController.GetDeliveryAddressSwagger);
}


function webRoutes(controllers) {
    controllers = controllers || {};
    var _this = exports;
    _this.webController = controllers.webController || require(controllersPath + '/web-controller')(_this.app);
    _this.app.get('/',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.webController.logoWeb);

    _this.app.get('/^[a-zA-Z0-9\/]*.js$/',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.webController.loadJs);


    _this.app.get('/^[a-zA-Z0-9\/]*.css$/',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.webController.loadCss);

    _this.app.get('/getSpa',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.webController.downloadSpa);
}

function orderRoutes(controllers) {
    controllers = controllers || {};
    var _this = exports;
    _this.orderController = controllers.orderController || require(controllersPath + '/order-controller')(_this.app);
    _this.reservationController = controllers.orderController || require(controllersPath + '/reservation-controller')(_this.app);
    _this.app.post('/v1/users/:userId?/orders',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.createOrder);

    _this.app.get('/v1/users/:userId?/orders',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getOrdersByUserId);

    _this.app.get('/v1/users/:userId?/past_orders_with_rating',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getPastOrdersWithRating);

    _this.app.get('/v1/users/:userId?/orders/:orderId?',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getOrderByOrderId);

    _this.app.delete('/v1/users/:userId?/orders/:orderId?',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.deleteOrderByOrderId);

    _this.app.get('/v1/users/:userId?/orders/:orderId?/users',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getUsersByOrderId);

    _this.app.put('/v1/users/:userId?/orders/:orderId?/users',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateUsersByOrderId);

    _this.app.get('/v1/users/:userId?/orders/:orderId?/orderItems',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getOrderItemsByOrderId);

    _this.app.put('/v1/users/:userId?/orders/:orderId?/orderItems',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateOrderItemByOrderId);

    _this.app.get('/v1/users/:userId?/orders/:orderId?/servers',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getServersByOrderId);

    _this.app.put('/v1/users/:userId?/orders/:orderId?/discounts',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateDiscountsByOrderId);

    _this.app.put('/v1/users/:userId?/orders/:orderId?/actions/:action?',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateActionByOrderId);

    _this.app.put('/v1/users/:userId?/orders/:orderId?/servers',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateServersByOrderId);

    _this.app.put('/v1/users/:userId?/orders/:orderId?/tables',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateTablesByOrderId);

    _this.app.put('/v1/users/:userId?/orders/:orderId?/orderItems/:orderItemId?/prices',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateOrderItemPriceByOrderItemId);

    _this.app.put('/v1/users/:userId?/orders/:orderId?/orderItems/:orderItemId?/quantities/:quantity?',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateOrderItemQuantityByOrderItemId);

    _this.app.delete('/v1/users/:userId?/orders/:orderId?/users',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.deleteUsersByOrderId);

    _this.app.delete('/v1/users/:userId?/orders/:orderId?/orderItems/:orderItemId?',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.deleteOrderItemByOrderItemId);

    _this.app.get('/v1/orders',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getOrders);

    _this.app.delete('/v1/orders',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.deleteOrdersByRestaurantId);

    _this.app.get('/v1/users/:userId/haveeaten_restaurants',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getHaveEatenRestaurantsByUserId);

    _this.app.get('/v1/users/:userId?/lastOrderTime',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getLastOrderTimeByUserId);

    _this.app.post('/v1/users/:userId?/reservations',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.reservationController.createReservation);

    _this.app.get('/v1/restaurants/:restaurantId?/reservations',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.reservationController.getReservationsByRestaurantId);

    _this.app.delete('/v1/restaurants/:restaurantId?/reservations',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.reservationController.deleteReservationsByRestaurantId);

    _this.app.put('/v1/reservations/:reservationId?',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.reservationController.updateReservationById);

    _this.app.delete('/v1/reservations/:reservationId?',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.reservationController.deleteReservationById);

    _this.app.put('/v1/restaurants/:restaurantId?/tables/:tableId/servers/:userId',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateServerToTable);

    _this.app.put('/v1/restaurants/:restaurantId?/tables/:tableId/bussers/:userId',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateBusserToTable);

    _this.app.delete('/v1/restaurants/:restaurantId?/tables/:tableId/servers/:userId',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.deleteServerFromTable);

    _this.app.delete('/v1/restaurants/:restaurantId?/tables/:tableId/bussers/:userId',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.deleteBusserFromTable);

    _this.app.get('/v1/restaurants/:restaurantId?/tables/:tableId/servers',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getServersByTableId);

    _this.app.get('/v1/restaurants/:restaurantId?/tables/:tableId/bussers',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getBussersByTableId);

    _this.app.get('/v1/restaurants/:restaurantId?/servers/:userId/tables',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getTableByServerId);

    _this.app.get('/v1/restaurants/:restaurantId?/bussers/:userId/tables',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getTableByBusserId);

    _this.app.put('/v1/restaurants/:restaurantId?/tableAssignments',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateTableAssignment);

    _this.app.get('/v1/restaurants/:restaurantId?/tableAssignments',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getTableAssignments);

    _this.app.get('/v1/transactions',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getTransactions);

    _this.app.get('/v1/healthcheck',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getHealthCheck);

    _this.app.put('/v1/orders/:orderId?/tips',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.setOrderTips);


    _this.app.put('/v1/users/:userId',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.batchUpdateUserInfo);

    _this.app.put('/v1/orders/:orderId?/settlements',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.setSettlement);

    _this.app.get('/v1/users/:userId?/resume_orders',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getResumeOrders);

    /**
     * Due to FBE-963, these APIs got DEPRECATION Notice Date: 2015-05-10
     */

    _this.app.get('/v1/orders/:orderId?/bills',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getBillsByOrderId);

    _this.app.put('/v1/orders/:orderId?/bills',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.unlockBillsByOrderId);

    //-- FBE-1265: [Orders] New v1 API to GET Past Orders (only; no reviews or comments)
    _this.app.get('/v1/users/:user_id/past_orders_only_without_review',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getPastOrdersOnlyWithoutReview);

    //-- FBE-2200: [Orders] Display takeout flag in past order
    _this.app.get('/v1/restaurants/:restaurant_id/restaurant_past_orders_only_without_review',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getRestaurantPastOrdersOnlyWithoutReview);


    //-- FBE-1266: fix old data
    _this.app.get('/v1/fix_old_data_for_order',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.fixOldData);

    // -- FBE-1515: Add two Boolean flags for each order that indicate ��whether the CHIT (order notes for kitchen) is printed�� and ��whether the receipt is printed��
    _this.app.get('/v1/orders/:order_id/printed_flags',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getPrintedFlags);

    _this.app.get('/v1/orderItems/printed_flags',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getChitPrintedFlags);

    _this.app.put('/v1/orders/:order_id/receipt_printed/:printed_flag',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateOrderPrintedFlag);

    _this.app.put('/v1/orderItems/:order_item_id/chit_printed/:printed_flag',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateOrderItemPrintedFlag);

    _this.app.put('/v1/orderItems/chit_printed/:printed_flag',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateOrderItemsPrintedFlag);

    _this.app.get('/v1/users/:userId/reservations',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.reservationController.getReservationByUserId);

    _this.app.put('/v1/orders/:order_id/printers/:printer_id',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateOrderPrinters);

    _this.app.put('/v1/orders/:order_id/order_items/:order_item_id/printers/:printer_id',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateOrderItemPrintedNumber);

    _this.app.put('/v1/tasks/:task_id',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updatePrintedNumber);


    _this.app.put('/v1/users/user_id?/orders/:order_id?/pre_order_print_notice',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.preOrderPrintNotice);


    _this.app.put('/v1/users/:user_id/orders/:order_id/close_order',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.closeOrder);

    _this.app.put('/v1/users/:user_id/orders/:order_id/cancel_order',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.cancelOrder);

    _this.app.put('/v1/users/:user_id/orders/:order_id/request_bill',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.requestBill);


    _this.app.put('/v1/orders/:order_id/action/:action/print',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateOrderPrint);

    _this.app.get('/v1/restaurants/:restaurant_id/order_stat',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getRestaurantOrderStat);

    _this.app.get('/v1/currency/:currency/order_stat',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getCurrencyOrderStat);

    _this.app.get('/v1/city_order_stat',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getOrderStat);

    _this.app.get('/v1/cities/:city_id/restaurants_order_count_stat',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getCityRestaurantsOrderCountStat);

    _this.app.get('/v1/restaurants/:restaurant_id/summary',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getRestaurantSummary);

    _this.app.put('/v1/users/:user_id/orders/:order_id/edit_order_items',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.editOrderItems);

    _this.app.get('/v1/devices/:device_id/print_tasks',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getPrintTasks);

    _this.app.get('/v1/operations',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.getOperations);

    _this.app.put('/v1/order/:order_id/user/:user_id/checkin',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.updateCustomerCheckin);

    _this.app.put('/v1/order/:order_id/order_tip',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderController.customerChangeTip);

}

function messgeRoutes(controllers){
    controllers = controllers || {};
    var _this = exports;
    _this.messageController = controllers.messageController || require(controllersPath + '/message-controller')(_this.app);
    _this.app.post('/v1/messages',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.messageController.createMessage);

    _this.app.get('/v1/messages',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.messageController.getMessages);


    _this.app.put('/v1/users/:user_id/messages_marked',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.messageController.markMessagesRead);

    _this.app.post('/v1/promotions',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.messageController.createPromotion);

    _this.app.get('/v1/promotions',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.messageController.getPromotions);


    _this.app.get('/v1/users/:user_id/promotion_result',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.messageController.getUserPromotionResult);

    _this.app.get('/v1/users/:user_id/has_new_messages',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.messageController.checkWhetherHasNewMessages);

}

function orderNewRoutes(controllers){
    controllers = controllers || {};
    var _this = exports;
    _this.orderNewController = controllers.orderNewController || require(controllersPath + '/order-new-controller')(_this.app);
    _this.app.put('/v1/orders/:order_id/online_close_order',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderNewController.onlineCloseOrder);

    _this.app.get('/v1/first_order_statistics',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderNewController.getFirstOrderStatistics);

    _this.app.get('/v1/all_orders',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.orderNewController.getAllOrders);

}

function shoppingCartRoutes(controllers){
    controllers = controllers || {};
    var _this = exports;
    _this.shoppingCartController = controllers.shoppingCartController || require(controllersPath + '/shopping-cart-controller')(_this.app);
    _this.app.post('/v1/shopping_carts',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.CreateShoppingCart);

    _this.app.get('/v1/restaurants/:restaurant_id/shopping_carts',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.QueryShoppingCart);

    _this.app.get('/v1/restaurants/:restaurant_id/current_shopping_carts',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.QueryCurrentShoppingCarts);

    _this.app.get('/v1/restaurants/:restaurant_id/shopping_carts_by_tables',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.QueryShoppingCartByTableNoList);

    _this.app.get('/v1/restaurants/:restaurant_id/past_shopping_carts',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.QueryPastShoppingCart);

    _this.app.get('/v1/shopping_carts/:shopping_cart_id',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.QueryShoppingCartById);

    _this.app.put('/v1/shopping_carts/:shopping_cart_id/tables',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.AddTable);

    _this.app.put('/v1/shopping_carts/:shopping_cart_id/tables/:table_id/seats',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.AddSeat);

    _this.app.put('/v1/shopping_carts/:shopping_cart_id/tables/:table_id/seats/:seat_id/items',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.AddOrderToSeat);

    _this.app.delete('/v1/shopping_carts/:shopping_cart_id/tables/:table_id/seats/:seat_id/items/:order_item_id',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.RemoveOrderToSeat);

    _this.app.put('/v1/shopping_carts/:shopping_cart_id/tables/:table_id/seats/:seat_id/items/:order_item_id/notes',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.UpdateOrderItemNotes);

    _this.app.put('/v1/shopping_carts/:shopping_cart_id/merge',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.Merge);

    _this.app.put('/v1/users/:user_id/shopping_carts/:shopping_cart_id/close',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.Close);

    _this.app.put('/v1/users/:user_id/shopping_carts/:shopping_cart_id/cancel',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.Cancel);

    _this.app.put('/v1/shopping_carts/:shopping_cart_id/tables/:table_id/seats/:seat_id/move',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.MoveSeat);

    _this.app.put('/v1/shopping_carts/:shopping_cart_id/tables/:table_id/move',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.MoveTable);

    _this.app.put('/v1/shopping_carts/:shopping_cart_id/tables/:table_id/seats/:seat_id',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.UpdateSeat);

    _this.app.delete('/v1/shopping_carts/:shopping_cart_id/tables/:table_id/seats/:seat_id',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.RemoveSeat);

    _this.app.put('/v1/shopping_carts/:shopping_cart_id/tables/:table_id/seats/:seat_id/shared_seats',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.UpdateSharedSeats);

    _this.app.delete('/v1/shopping_carts/:shopping_cart_id/tables/:table_id',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.RemoveTable);

    _this.app.put('/v1/shopping_carts/:shopping_cart_id/order_type',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.ChangeOrderType);

    _this.app.put('/v1/shopping_carts/:shopping_cart_id/employee',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.ChangeEmployee);

    _this.app.put('/v1/shopping_carts/:shopping_cart_id/discount',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.AddDiscount);

    _this.app.delete('/v1/shopping_carts/:shopping_cart_id/discount',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.RemoveDiscount);

    _this.app.put('/v1/shopping_carts/:shopping_cart_id/tables/:table_id/seats/:seat_id/order_items/:order_item_id/move',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.MoveItemToSeat);

    _this.app.post('/v1/shopping_carts/:shopping_cart_id/reopen',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.Reopen);

    _this.app.post('/v1/shopping_carts/:shopping_cart_id/update',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.shoppingCartController.Update);
}

function posPaymentRoutes(controllers){
    controllers = controllers || {};
    var _this = exports;
    _this.posPaymentController = controllers.messageController || require(controllersPath + '/pos-payment-controller')(_this.app);

    _this.app.post('/v1/pos_payments',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posPaymentController.CreatePayment);

    _this.app.get('/v1/shopping_cart/:shopping_cart_id/bill',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posPaymentController.GetBill);

    _this.app.post('/v1/pos_payments/print_bill',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posPaymentController.DirectPrintBill);

    _this.app.post('/v1/restaurants/:restaurant_id/open_cash_drawer',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posPaymentController.OpenCashDrawer);

    _this.app.get('/v1/shopping_carts/:shopping_cart_id/pos_payments',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posPaymentController.GetPosPayments);

    _this.app.put('/v1/pos_payments/:payment_id',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posPaymentController.UpdatePosPayments);

    _this.app.post('/v1/pos_payments/:payment_id/continue_pay',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posPaymentController.ContinuePay);

    _this.app.post('/v1/orders/:order_id/print_receipt',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posPaymentController.PrintDiningOrderBill);

    _this.app.post('/v1/orders/:order_id/print_order_slip',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posPaymentController.PrintDiningOrderSlips);

    _this.app.post('/v1/pos_payments/:shopping_cart_id/update_payment',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posPaymentController.Update_AllPosPayments);

}

function posDiscountRoutes(controllers){
    controllers = controllers || {};
    var _this = exports;
    _this.posDiscountController = controllers.posDiscountController || require(controllersPath + '/pos-discount-controller')(_this.app);
    _this.app.post('/v1/pos_discounts',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posDiscountController.CreateDiscount);

    _this.app.get('/v1/pos_discounts/:discount_id',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posDiscountController.GetDiscountById);

    _this.app.delete('/v1/pos_discounts/:discount_id',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posDiscountController.DeleteDiscountById);

    _this.app.put('/v1/pos_discounts/:discount_id',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posDiscountController.UpdateDiscount);

    _this.app.get('/v1/pos_discounts',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posDiscountController.GetDiscounts);
}

function posAnalyticsRoutes(controllers){
    controllers = controllers || {};
    var _this = exports;
    _this.posAnalyticsController = controllers.posAnalyticsController || require(controllersPath + '/pos-analytics-controller')(_this.app);

    _this.app.post('/v1/restaurants/:restaurant_id/print_pos_daily_report',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posAnalyticsController.DailySalesReport);

    _this.app.get('/v1/restaurants/:restaurant_id/hourly_sales_report',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posAnalyticsController.HourlySalesReport);

    _this.app.get('/v1/restaurants/:restaurant_id/item_sales_report',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posAnalyticsController.ItemSalesReport);

    _this.app.get('/v1/restaurants/:restaurant_id/cashier_close_report',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posAnalyticsController.CashierCloseReport);

    _this.app.get('/v1/restaurants/:restaurant_id/sales_summary_report',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posAnalyticsController.SalesSummaryReport);

    _this.app.get('/v1/restaurants/:restaurant_id/employee_report',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posAnalyticsController.EmployeeReport);

    _this.app.post('/v1/restaurants/:restaurant_id/passcodes/:passcode/print_employee_report',
        _this.allowAnyOriginJSON,
        _this.userAuthentication.requireAuthentication,
        _this.posAnalyticsController.PrintEmployeeReport);
}

function deliveryRoutes(controllers){
    controllers = controllers || {};
    var _this = exports;
    _this.deliveryContorller = controllers.deliveryContorller;

}

var AllowAnyOriginJSON = function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin,Access-Control-Allow-Origin,Content-Type,Authorization,X-Requested-With');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, PATCH, OPTIONS');
    next();
};

var InitializeRoutes = function (controllers) {
    webRoutes(controllers);
    orderRoutes(controllers);
    swaggerRoutes(controllers);
    messgeRoutes(controllers);
    orderNewRoutes(controllers);
    shoppingCartRoutes(controllers);
    posPaymentRoutes(controllers);
    posDiscountRoutes(controllers);
    posAnalyticsRoutes(controllers);
    deliveryRoutes(controllers);
};

module.exports = function (app) {
    var _this = exports;
    _this.app = app;
    _this.mongoConfig=app.resolvedConfig.mongo;
    //-- _this.logger = app.logger;
    _this.metricsHelper = require('../app/helpers/metrics-helper')(app);
    _this.userAuthentication = require('../app/helpers/user-authentication')(app);
    _this.allowAnyOriginJSON = AllowAnyOriginJSON;
    _this.initializeRoutes = InitializeRoutes;
    return _this;
};
