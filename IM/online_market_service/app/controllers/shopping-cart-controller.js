'use strict';

var co=require('co');
var Promise=require('es6-promise').Promise;

var checkPermission=function(req,res){
    var _this=exports;
    return new Promise(function(resolve,reject){
        _this.oauthUtils.checkPermission(req, {}, _this.oauthPermission, _this.oauthUtils.ActionType.READ, res, function(error, result){
            if(error){
                reject(error);
            }else {
                resolve(result);
            }

        });
    });
}

var CreateShoppingCart =  function(req,res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let body=req.body;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.CreateShoppingCart',
        body: body
    });

    co(function*(){
        let create = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.CreateShoppingCart(body,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        var schemas = [

            _this.Schema.ShoppingCartCreateItemSchema,
            _this.Schema.ShoppingCartCreateSeatSchema,
            _this.Schema.ShoppingCartCreateTableSchema,
            _this.Schema.ShoppingCartDeliverSchema,
            _this.Schema.ShoppingCartNotesSchema,
            _this.Schema.ShoppingCartCreateSchema,
            _this.Schema.ShoppingCartItemsCombinationsSchema,
            _this.Schema.ShoppingCartItemsCombinationsItemSchema,
        ];
        if(_this.validators.validateRequestBody(body, schemas,res)) {
            if (_this.otherServers.oauth.TOKEN_OFF) {
                yield create();
            } else {
                let result = yield checkPermission(req, res);
                if (result) {
                    yield create();
                }
            }
        }
    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.CreateShoppingCart',
            stack: error
        });
    });

};


var AddOrderToSeat =  function(req,res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let body=req.body;
    let shopping_cart_id=req.params.shopping_cart_id;
    let table_id=req.params.table_id;
    let seat_id=req.params.seat_id;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.AddOrderToSeat',
        body: body
    });

    co(function*(){
        let create = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.addOrderToSeat(shopping_cart_id,table_id,seat_id,body.items,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        var schemas = [
            _this.Schema.ShoppingCartCreateItemSchema,
            _this.Schema.ShoppingCartAddItemSchema,
            _this.Schema.ShoppingCartItemsCombinationsItemSchema,
            _this.Schema.ShoppingCartItemsCombinationsSchema,
        ];
        if(_this.validators.validateRequestBody(body, schemas,res)) {
            if (_this.otherServers.oauth.TOKEN_OFF) {
                yield create();
            } else {
                let result = yield checkPermission(req, res);
                if (result) {
                    yield create();
                }
            }
        }
    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.AddOrderToSeat',
            stack: error
        });
    });

};

var QueryCurrentShoppingCarts=  function(req,res){
    var _this = exports;
    let restaurant_id = req.params.restaurant_id;
    let from=req.query.date_from;
    let to=req.query.date_to;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.QueryCurrentShoppingCarts',
        query: req.query,
        params:req.params
    });

    co(function*(){
        let find = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.findCurrentShoppingCartList(restaurant_id,from,to);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }

        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield find();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield find();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.QueryCurrentShoppingCarts',
            stack: error
        });
    });
};


var QueryShoppingCart =  function(req,res){
    var _this = exports;
    let restaurant_id = req.params.restaurant_id;
    let table_id=req.query.table_id;
    let seat_name=req.query.seat_name;
    let status=req.query.status;


    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.QueryShoppingCart',
        query: req.query,
        params:req.params
    });

    co(function*(){
        let find = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.findShoppingCartList(restaurant_id,table_id,seat_name,status);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }

        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield find();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield find();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.QueryShoppingCart',
            stack: error
        });
    });
};

var QueryShoppingCartByTableNoList =  function(req, res){
    var _this = exports;
    let restaurant_id = req.params.restaurant_id;
    let table_nos=req.query.table_no; 

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.QueryShoppingCartByTableIdList',
        query: req.query,
        params:req.params
    });

    co(function*(){
        let find = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.findShoppingCartByTableNoList(restaurant_id,table_nos);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }

        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield find();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield find();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.QueryShoppingCartByTableIdList',
            stack: error
        });
    });
};

var QueryPastShoppingCart =  function(req,res){
    var _this = exports;
    let restaurant_id = req.params.restaurant_id;


    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.QueryPastShoppingCart',
        query: req.query,
        params:req.params
    });

    co(function*(){
        let find = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.findPastShoppingCartList(restaurant_id,req.query);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }

        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield find();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield find();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.QueryPastShoppingCart',
            stack: error
        });
    });

};




var QueryShoppingCartById =  function(req,res){
    var _this = exports;
    let id = req.params.shopping_cart_id;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.QueryShoppingCartById',
        query: req.query,
        params:req.params
    });

    co(function*(){
        let find = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.findShoppingCartById(id);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }

        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield find();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield find();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.QueryShoppingCartById',
            stack: error
        });
    });

};

var AddTable=function(req,res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let body=req.body;
    let table_id=req.body.table_id;
    let shopping_cart_id=req.params.shopping_cart_id;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.AddTable',
        body: body
    });

    co(function*(){
        let create = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.addTable(shopping_cart_id,table_id,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }

        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield create();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield create();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.AddTable',
            stack: error
        });
    });

}

var AddSeat=function(req,res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let body=req.body;
    let table_id=req.params.table_id;
    let shopping_cart_id=req.params.shopping_cart_id;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.AddSeat',
        body: body
    });

    co(function*(){
        let create = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.addSeat(shopping_cart_id,table_id,body);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        var schemas = [
            _this.Schema.AddSeatSchema
        ];
        if(_this.validators.validateRequestBody(body, schemas,res)) {
            if (_this.otherServers.oauth.TOKEN_OFF) {
                yield create();
            } else {
                let result = yield checkPermission(req, res);
                if (result) {
                    yield create();
                }
            }
        }
    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.AddSeat',
            stack: error.stack
        });
    });

}


var Merge=function(req,res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let body=req.body;
    let table_id=req.params.table_id;
    let to_shopping_cart_id=req.params.shopping_cart_id;
    let from_shopping_cart_id=body.shopping_cart_id;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.Merge',
        body: body
    });

    co(function*(){
        let merge = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.merge(from_shopping_cart_id,to_shopping_cart_id);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield merge();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield merge();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.Merge',
            stack: error.stack
        });
    });

}



var Close=function(req,res){
    var _this = exports;
    let user_id=req.params.user_id;
    let shopping_cart_id=req.params.shopping_cart_id;
    let headerToken = req.headers.authorization;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.Close',
        user_id:user_id,
        shopping_cart_id:shopping_cart_id
    });

    co(function*(){
        let close = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.close(shopping_cart_id,user_id,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield close();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield close();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.Close',
            stack: error.stack
        });
    });

}

var Cancel=function(req,res){
    var _this = exports;
    let user_id=req.params.user_id;
    let shopping_cart_id=req.params.shopping_cart_id;
    let reason=req.body.reason;
    let headerToken = req.headers.authorization;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.Cancel',
        user_id:user_id,
        shopping_cart_id:shopping_cart_id,
        reason:reason
    });

    co(function*(){
        let cancel = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.cancel(shopping_cart_id,user_id,reason,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield cancel();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield cancel();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.Cancel',
            stack: error.stack
        });
    });

}

var MoveSeat=function(req,res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let body=req.body;
    let from_table_id=req.params.table_id;
    let from_seat_id=req.params.seat_id;
    let shopping_cart_id=req.params.shopping_cart_id;
    let to_table_id=body.table_id;


    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.MoveSeat',
        body: body
    });

    co(function*(){
        let move = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.moveSeat(shopping_cart_id,from_table_id,from_seat_id,to_table_id);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield move();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield move();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.MoveSeat',
            stack: error.stack
        });
    });

}

var MoveTable=function(req,res){
    var _this = exports;
    let headerToken = req.headers.authorization;
    let body=req.body;
    let from_table_id=req.params.table_id;
    let shopping_cart_id=req.params.shopping_cart_id;
    let new_table_id=body.table_id;


    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.MoveTable',
        body: body
    });

    co(function*(){
        let move = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.moveTable(shopping_cart_id,from_table_id,new_table_id);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield move();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield move();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.MoveTable',
            stack: error.stack
        });
    });

}

var UpdateSeat=function(req,res){
    var _this = exports;
    let table_id=req.params.table_id;
    let seat_id=req.params.seat_id;
    let shopping_cart_id=req.params.shopping_cart_id;
    let body=req.body;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.UpdateSeat',
        body: body
    });

    co(function*(){
        let update = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.UpdateSeat(shopping_cart_id,table_id,seat_id,body);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield update();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield update();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.UpdateSeat',
            stack: error.stack
        });
    });
}

var UpdateSharedSeats=function(req,res){
    var _this = exports;
    let table_id=req.params.table_id;
    let seat_id=req.params.seat_id;
    let shopping_cart_id=req.params.shopping_cart_id;
    let body=req.body;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.UpdateSharedSeats',
        body: body
    });

    co(function*(){
        let update = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.UpdateSharedSeats(shopping_cart_id,table_id,seat_id,body);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield update();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield update();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.UpdateSharedSeats',
            stack: error.stack
        });
    });

}


var RemoveSeat=function(req,res){
    var _this = exports;
    let body=req.body;
    let table_id=req.params.table_id;
    let seat_id=req.params.seat_id;
    let shopping_cart_id=req.params.shopping_cart_id;


    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.RemoveSeat',
        body: body
    });

    co(function*(){
        let remove = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.removeSeat(shopping_cart_id,table_id,seat_id);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield remove();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield remove();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.RemoveSeat',
            stack: error.stack
        });
    });
}

var RemoveOrderToSeat=function(req,res){
    var _this = exports;
    let body=req.body;
    let table_id=req.params.table_id;
    let seat_id=req.params.seat_id;
    let shopping_cart_id=req.params.shopping_cart_id;
    let order_item_id=req.params.order_item_id;
    let quantity=req.query.quantity;
    let notes=req.query.notes;
    if(!notes){
        notes='';
    }
    let headerToken = req.headers.authorization;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.RemoveOrderToSeat',
        body: body
    });

    co(function*(){
        let remove = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.removeOrderItem(shopping_cart_id,
                table_id, seat_id, order_item_id, quantity, notes, headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield remove();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield remove();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.RemoveOrderToSeat',
            stack: error.stack
        });
    });
}

var UpdateOrderItemNotes=function(req,res){
    var _this = exports;
    let body=req.body;
    let table_id=req.params.table_id;
    let seat_id=req.params.seat_id;
    let shopping_cart_id=req.params.shopping_cart_id;
    let order_item_id=req.params.order_item_id;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.UpdateOrderItemNotes',
        body: body
    });

    co(function*(){
        let remove = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.UpdateOrderItemNotes(shopping_cart_id,table_id,seat_id,order_item_id,body.notes);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }

        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield remove();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield remove();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.UpdateOrderItemNotes',
            stack: error.stack
        });
    });
}

var RemoveTable=function(req,res){
    var _this = exports;
    let body=req.body;
    let table_id=req.params.table_id;
    let shopping_cart_id=req.params.shopping_cart_id;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.RemoveTable',
        body: body
    });

    co(function*(){
        let remove = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.removeTable(shopping_cart_id,table_id);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield remove();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield remove();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.RemoveTable',
            stack: error.stack
        });
    });

}

var ChangeOrderType=function(req,res){
    var _this = exports;
    let body=req.body;
    let order_type=body.order_type;
    let shopping_cart_id=req.params.shopping_cart_id;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.ChangeOrderType',
        body: body
    });

    co(function*(){
        let change = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.changeOrderType(shopping_cart_id,order_type);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield change();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield change();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.ChangeOrderType',
            stack: error.stack
        });
    });

}

var ChangeEmployee=function(req,res){
    var _this = exports;
    let body=req.body;
    let employee_id=body.employee_id;
    let shopping_cart_id=req.params.shopping_cart_id;
    let headerToken = req.headers.authorization;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.ChangeEmployee',
        body: body
    });

    co(function*(){
        let change = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.changeEmployee(shopping_cart_id,employee_id,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield change();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield change();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.ChangeEmployee',
            stack: error.stack
        });
    });
}


var AddDiscount=function(req,res){
    var _this = exports;
    let body=req.body;
    let shopping_cart_id=req.params.shopping_cart_id;
    let headerToken = req.headers.authorization;

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.AddDiscount',
        body: body
    });

    co(function*(){
        let change = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.addDiscount(shopping_cart_id,req.body,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield change();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield change();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.AddDiscount',
            stack: error.stack
        });
    });

}

var RemoveDiscount=function(req,res){
    var _this = exports;
    let shopping_cart_id=req.params.shopping_cart_id;
    let table_id=req.query.table_id;
    let seat_id=req.query.seat_id;
    let order_item_id=req.query.order_item_id;
    let headerToken = req.headers.authorization;


    let body={
        table_id:table_id,
        seat_id:seat_id,
        order_item_id:order_item_id
    }

    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.RemoveDiscount',
        body: body
    });
    co(function*(){
        let change = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.removeDiscount(shopping_cart_id,body,headerToken);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }
        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield change();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield change();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.RemoveDiscount',
            stack: error.stack
        });
    });

}


var MoveItemToSeat=function(req,res){
    var _this = exports;
    let body=req.body;
    let from_table_id=req.params.table_id;
    let from_seat_id=req.params.seat_id;
    let order_item_id=req.params.order_item_id;
    let shopping_cart_id=req.params.shopping_cart_id;
    let to_seat_id=body.seat_id;
    let quantity=body.quantity;
    if(isNaN(quantity)){
        quantity=1;
    }
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.MoveItemToSeat',
        body: body
    });

    co(function*(){
        let move = function *(){
            let result=yield _this.shoppingCartAPI.shoppingCartCreateAPI.moveItemToSeat(shopping_cart_id,from_table_id,from_seat_id,order_item_id,to_seat_id,quantity);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield move();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield move();
            }
        }

    }).catch(function(error){
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.MoveItemToSeat',
            stack: error.stack
        });
    });

}


var Reopen=function(req,res) {
    var _this = exports;
    let shopping_cart_id = req.params.shopping_cart_id;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.Reopen',
        shopping_cart_id: shopping_cart_id
    });

    co(function*() {
        let move = function *() {
            let result = yield _this.shoppingCartAPI.shoppingCartCreateAPI.reopen(shopping_cart_id);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }


        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield move();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield move();
            }
        }

    }).catch(function (error) {
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.Reopen',
            stack: error.stack
        });
    });
}

var Update=function(req,res) {
    var _this = exports;
    let shopping_cart_id = req.params.shopping_cart_id;
    _this.logger.info('%j', {
        function: 'DEBUG-INFO: shopping-cart-controller.Updata',
        shopping_cart_id: shopping_cart_id
    });

    co(function*() {
        let move = function *() {
            let result = yield _this.shoppingCartAPI.shoppingCartCreateAPI.update_shopping_cart(shopping_cart_id, req.body);
            _this.responseUtilsAPI.processResponse(null, result, res);
        }

        if (_this.otherServers.oauth.TOKEN_OFF) {
            yield move();
        } else {
            let result = yield checkPermission(req, res);
            if (result) {
                yield move();
            }
        }

    }).catch(function (error) {
        _this.responseUtilsAPI.processResponse(error, null, res);
        _this.logger.error('%j', {
            function: 'DEBUG-ERROR: shopping-cart-controller.Reopen',
            stack: error.stack
        });
    });
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
    _this.shoppingCartAPI = orderAPI.shoppingCart;
    _this.httpHelper = _this.backendHelpers.httpHelper();
    _this.dataGenerationHelper = _this.backendHelpers.dataGenerationHelper();
    _this.loggerName = 'order';
    _this.logger = _this.app.log4jsHelper.initialize(_this.loggerName);


    _this.oauthUtils = _this.backendHelpers.oauthUtils;
    _this.Schema = _this.backendHelpers.Schemas;
    _this.validators = _this.backendHelpers.SchemaValidator;
    _this.responseUtilsAPI = _this.backendHelpers.responseUtilsAPI;
    _this.logger.info('shopping-cart-controller: initialized');


    _this.CreateShoppingCart = CreateShoppingCart;

    _this.QueryShoppingCart = QueryShoppingCart;

    _this.QueryShoppingCartById = QueryShoppingCartById;

    _this.AddOrderToSeat= AddOrderToSeat;

    _this.AddTable=AddTable;

    _this.AddSeat=AddSeat;

    _this.Merge=Merge;

    _this.Close=Close;

    _this.Cancel=Cancel;

    _this.MoveSeat=MoveSeat;

    _this.MoveTable=MoveTable;

    _this.RemoveSeat=RemoveSeat;

    _this.RemoveTable=RemoveTable;

    _this.ChangeOrderType=ChangeOrderType;

    _this.ChangeEmployee=ChangeEmployee;

    _this.QueryPastShoppingCart=QueryPastShoppingCart;

    _this.AddDiscount=AddDiscount;

    _this.RemoveDiscount=RemoveDiscount;

    _this.UpdateSeat=UpdateSeat;

    _this.UpdateSharedSeats=UpdateSharedSeats;

    _this.RemoveOrderToSeat=RemoveOrderToSeat;

    _this.UpdateOrderItemNotes=UpdateOrderItemNotes;

    _this.MoveItemToSeat=MoveItemToSeat;
    
    _this.QueryShoppingCartByTableNoList=QueryShoppingCartByTableNoList;
    
    _this.QueryCurrentShoppingCarts=QueryCurrentShoppingCarts;
    
    _this.Reopen=Reopen;

    _this.Update=Update;
    return _this;
};
