'use strict';

process.env.NODE_ENV = 'development';

var thisFilePath = module.filename.split('/');
var thisFilename = thisFilePath[thisFilePath.length-1];
var should = require('should');
var orderFixtures = require('./../fixtures/pos-shopping-cart-fixtures')();
var configServerFixtures = require('./../fixtures/config-server-fixtures').config;
var shopping_cart = require('../../app/libv2/shopping-cart')(configServerFixtures, configServerFixtures.mongo, console);
var obj;

var sinon = require('sinon');

describe('Shopping Cart [Unit]', function() {

    describe('TableCombiner class', function () {

        it('merge into empty seats', function (done) {
            var from_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A1',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item1',
                                quantity:1
                            },
                            {
                                item_id:'item2',
                                quantity:1
                            }
                        ]
                    }]
                }]
            }

            var to_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: []
                }]
            }
            var combiner=new shopping_cart.TableCombiner(from_cart,to_cart);
            var res=combiner.doMerge();
            res.should.eql([{
                table_id: 'tab1',
                seats: [{
                    seat_no:'A1',
                    seat_id:'sida1',
                    order_items:[
                        {
                            item_id:'item1',
                            quantity:1
                        },
                        {
                            item_id:'item2',
                            quantity:1
                        }
                    ]
                }]
            }]);
            done();
        });

        it('merge into empty order_items', function (done) {
            var from_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A1',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item1',
                                quantity:1
                            },
                            {
                                item_id:'item2',
                                quantity:1
                            }
                        ]
                    }]
                }]
            }

            var to_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A1',
                        seat_id:'sida1',
                        order_items:[
                        ]
                    }]
                }]
            }
            var combiner=new shopping_cart.TableCombiner(from_cart,to_cart);
            var res=combiner.doMerge();
            res.should.eql([{
                table_id: 'tab1',
                seats: [{
                    seat_no:'A1',
                    seat_id:'sida1',
                    order_items:[
                        {
                            item_id:'item1',
                            quantity:1
                        },
                        {
                            item_id:'item2',
                            quantity:1
                        }
                    ]
                }]
            }]);
            done();
        });

        it('merge distinct seats', function (done) {
            var from_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A1',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item1',
                                quantity:1
                            },
                            {
                                item_id:'item2',
                                quantity:1
                            }
                        ]
                    }]
                }]
            }

            var to_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A2',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item1',
                                quantity:1
                            },
                            {
                                item_id:'item2',
                                quantity:1
                            }
                        ]
                    }]
                }]
            }
            var combiner=new shopping_cart.TableCombiner(from_cart,to_cart);
            var res=combiner.doMerge();
            res.should.eql([{
                table_id: 'tab1',
                seats: [{
                    seat_no:'A1',
                    seat_id:'sida1',
                    order_items:[
                        {
                            item_id:'item1',
                            quantity:1
                        },
                        {
                            item_id:'item2',
                            quantity:1
                        }
                    ]
                },{
                    seat_no:'A2',
                    seat_id:'sida1',
                    order_items:[
                        {
                            item_id:'item1',
                            quantity:1
                        },
                        {
                            item_id:'item2',
                            quantity:1
                        }
                    ]
                }]
            }]);
            done();
        });

        it('merge same seats and distinct order_items', function (done) {
            var from_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A1',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item1',
                                quantity:3
                            },
                            {
                                item_id:'item2',
                                quantity:1
                            }
                        ]
                    }]
                }]
            }

            var to_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A1',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item3',
                                quantity:1
                            },
                            {
                                item_id:'item4',
                                quantity:2
                            }
                        ]
                    }]
                }]
            }
            var combiner=new shopping_cart.TableCombiner(from_cart,to_cart);
            var res=combiner.doMerge();
            res.should.eql([{
                table_id: 'tab1',
                seats: [{
                    seat_no:'A1',
                    seat_id:'sida1',
                    order_items:[
                        {
                            item_id:'item1',
                            quantity:3
                        },
                        {
                            item_id:'item2',
                            quantity:1
                        },
                        {
                            item_id:'item3',
                            quantity:1
                        },
                        {
                            item_id:'item4',
                            quantity:2
                        }
                    ]
                }]
            }]);
            done();
        });

        it('merge same seats and same order_items', function (done) {
            var from_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A1',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item1',
                                quantity:3
                            },
                            {
                                item_id:'item2',
                                quantity:1
                            }
                        ]
                    }]
                }]
            }

            var to_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A1',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item1',
                                quantity:1
                            },
                            {
                                item_id:'item2',
                                quantity:2
                            }
                        ]
                    }]
                }]
            }
            var combiner=new shopping_cart.TableCombiner(from_cart,to_cart);
            var res=combiner.doMerge();
            res.should.eql([{
                table_id: 'tab1',
                seats: [{
                    seat_no:'A1',
                    seat_id:'sida1',
                    order_items:[
                        {
                            item_id:'item1',
                            quantity:4
                        },
                        {
                            item_id:'item2',
                            quantity:3
                        }
                    ]
                }]
            }]);
            done();
        });


        it('merge distinct tables', function (done) {
            var from_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A1',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item1',
                                quantity:3
                            }
                        ]
                    }]
                }]
            }

            var to_cart={
                tables:[{
                    table_id: 'tab2',
                    seats: [{
                        seat_no:'A1',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item2',
                                quantity:1
                            }
                        ]
                    }]
                }]
            }
            var combiner=new shopping_cart.TableCombiner(from_cart,to_cart);
            var res=combiner.doMerge();
            res.should.eql([
                {
                    table_id: 'tab1',
                    seats: [{
                        seat_no: 'A1',
                        seat_id: 'sida1',
                        order_items: [
                            {
                                item_id: 'item1',
                                quantity: 3
                            }
                        ]
                    }]
                },
                {
                    table_id: 'tab2',
                    seats: [{
                        seat_no:'A1',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item2',
                                quantity:1
                            }
                        ]
                    }]
                }
            ]);
            done();
        });


        it('merge same tables and distinct seats', function (done) {
            var from_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A1',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item1',
                                quantity:3
                            }
                        ]
                    }]
                }]
            }

            var to_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A2',
                        seat_id:'sida2',
                        order_items:[
                            {
                                item_id:'item2',
                                quantity:1
                            }
                        ]
                    }]
                }]
            }
            var combiner=new shopping_cart.TableCombiner(from_cart,to_cart);
            var res=combiner.doMerge();
            res.should.eql([
                {
                    table_id: 'tab1',
                    seats: [
                        {
                            seat_no: 'A1',
                            seat_id: 'sida1',
                            order_items: [
                                {
                                    item_id: 'item1',
                                    quantity: 3
                                }
                            ]
                        },
                        {
                            seat_no:'A2',
                            seat_id:'sida2',
                            order_items:[
                                {
                                    item_id:'item2',
                                    quantity:1
                                }
                            ]
                        }
                    ]
                }
            ]);
            done();
        });

        it('merge same tables and same seats and some distinct order items and some same order items', function (done) {
            var from_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A2',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item1',
                                quantity:3
                            },
                            {
                                item_id:'item2',
                                quantity:3
                            },
                            {
                                item_id:'item3',
                                quantity:3
                            }
                        ]
                    }]
                }]
            }

            var to_cart={
                tables:[{
                    table_id: 'tab1',
                    seats: [{
                        seat_no:'A2',
                        seat_id:'sida1',
                        order_items:[
                            {
                                item_id:'item2',
                                quantity:1
                            },
                            {
                                item_id:'item4',
                                quantity:1
                            },
                            {
                                item_id:'item6',
                                quantity:1
                            }
                        ]
                    }]
                }]
            }
            var combiner=new shopping_cart.TableCombiner(from_cart,to_cart);
            var res=combiner.doMerge();
            res.should.eql([
                {
                    table_id: 'tab1',
                    seats: [
                        {
                            seat_no: 'A2',
                            seat_id: 'sida1',
                            order_items: [
                                {
                                    item_id:'item1',
                                    quantity:3
                                },
                                {
                                    item_id:'item2',
                                    quantity:4
                                },
                                {
                                    item_id:'item3',
                                    quantity:3
                                },
                                {
                                    item_id:'item4',
                                    quantity:1
                                },
                                {
                                    item_id:'item6',
                                    quantity:1
                                }
                            ]
                        }
                    ]
                }
            ]);
            done();
        });




      
    });
    
    describe('MenuComboCalculator class', function (){
        var menu_combo= [
                {
                    "longNames" : [
                        {
                            "name" : "Burgers",
                            "locale" : "en_US"
                        },
                        {
                            "name" : "汉堡",
                            "locale" : "zh_CN"
                        }
                    ],
                    "maximum_value" : 2,
                    "minimum_value" : 1,
                    "type" : "MODIFIER",
                    "items" : [
                        {
                            "longNames" : [
                                {
                                    "name" : "Burger(Beaf)",
                                    "locale" : "en_US"
                                }
                            ],
                            "maximum_value" : 2,
                            "minimum_value" : 0,
                            "type" : "CHOICE",
                            "price" : 8,
                            "_id" : "3c728f15-c0b2-44ac-a188-c598e9af6ca8"
                        },
                        {
                            "longNames" : [
                                {
                                    "name" : "Burger(Pork)",
                                    "locale" : "en_US"
                                }
                            ],
                            "type" : "CHOICE",
                            "price" : 7,
                            "_id" : "ebbf9d7a-9aec-417c-977b-9ede15ab2220",
                            "maximum_value" : 1,
                            "minimum_value" : 0
                        }
                    ],
                    "_id" : "3795610e-aae0-434b-abca-96b7fecacc8e"
                },
                {
                    "longNames" : [
                        {
                            "name" : "Drink",
                            "locale" : "en_US",
                            "suggest" : {
                                "input" : "Drink",
                                "output" : "Drink"
                            }
                        }
                    ],
                    "maximum_value" : 10,
                    "minimum_value" : 0,
                    "type" : "MODIFIER",
                    "items" : [
                        {
                            "longNames" : [
                                {
                                    "name" : "Coke",
                                    "locale" : "en_US"
                                }
                            ],
                            "maximum_value" : 1,
                            "minimum_value" : 1,
                            "type" : "CHOICE",
                            "items" : [
                                {
                                    "longNames" : [
                                        {
                                            "name" : "Size",
                                            "locale" : "en_US"
                                        }
                                    ],
                                    "maximum_value" : 1,
                                    "minimum_value" : 1,
                                    "type" : "MODIFIER",
                                    "items" : [
                                        {
                                            "longNames" : [
                                                {
                                                    "name" : "Small Coke",
                                                    "locale" : "en_US"
                                                }
                                            ],
                                            "maximum_value" : 2,
                                            "minimum_value" : 1,
                                            "type" : "CHOICE",
                                            "price" : 1.5,
                                            "_id" : "ad6af112-f738-4755-812b-015e21e8f78e"
                                        },
                                        {
                                            "longNames" : [
                                                {
                                                    "name" : "Medium Coke",
                                                    "locale" : "en_US"
                                                }
                                            ],
                                            "maximum_value" : 1,
                                            "minimum_value" : 1,
                                            "type" : "CHOICE",
                                            "price" : 2.5,
                                            "_id" : "38a4dedd-5d89-4269-ab8a-f5ec0f2e8eac"
                                        },
                                        {
                                            "longNames" : [
                                                {
                                                    "name" : "Large Coke",
                                                    "locale" : "en_US"
                                                }
                                            ],
                                            "type" : "CHOICE",
                                            "price" : 3.5,
                                            "_id" : "c64a041b-1a9d-4043-908f-e886871c4e12",
                                            "maximum_value" : 1,
                                            "minimum_value" : 0
                                        }
                                    ],
                                    "_id" : "486bc5f6-1495-4655-9a3c-287ab9db8ae0"
                                }
                            ],
                            "_id" : "8282fb2f-b918-468f-9b86-893a602fa987"
                        }
                    ],
                    "_id" : "ae185ed4-4a05-4152-a190-5e892dad97c4"
                }
            ]

        it('calculate combination',function(){
            var input=[
                {
                    _id: "3795610e-aae0-434b-abca-96b7fecacc8e",
                    items: [
                        {
                            _id:  "3c728f15-c0b2-44ac-a188-c598e9af6ca8",
                            quantity: 2
                        }
                    ]
                },
                {
                    _id:"ae185ed4-4a05-4152-a190-5e892dad97c4",
                    quantity:4,
                    items:[
                        {
                            _id:"8282fb2f-b918-468f-9b86-893a602fa987",
                            quantity:1,
                            items:[
                                {
                                    _id:"486bc5f6-1495-4655-9a3c-287ab9db8ae0",
                                    quantity:1,
                                    items:[
                                        {
                                            _id:"c64a041b-1a9d-4043-908f-e886871c4e12",
                                            quantity:1
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ];
            var res=shopping_cart.MenuComboCalculator.calculatNewCombo(input,menu_combo);
            res.should.eql([
                {
                    "_id": "3795610e-aae0-434b-abca-96b7fecacc8e",
                    "items": [
                        {
                            "_id": "3c728f15-c0b2-44ac-a188-c598e9af6ca8",
                            "longNames": [
                                {
                                    "locale": "en_US",
                                    "name": "Burger(Beaf)"
                                }
                            ],
                            "maximum_value": 2,
                            "minimum_value": 0,
                            "price": 8,
                            "quantity": 2,
                            "type": "CHOICE"
                        }
                    ],
                    "longNames": [
                        {
                            "locale": "en_US",
                            "name": "Burgers"
                        },
                        {
                            "locale": "zh_CN",
                            "name": "汉堡"
                        }
                    ],
                    "maximum_value": 2,
                    "minimum_value": 1,
                    "type": "MODIFIER"
                },
                {
                    "_id": "ae185ed4-4a05-4152-a190-5e892dad97c4",
                    "items": [
                        {
                            "_id": "8282fb2f-b918-468f-9b86-893a602fa987",
                            "items": [
                                {
                                    "_id": "486bc5f6-1495-4655-9a3c-287ab9db8ae0",
                                    "items": [
                                        {
                                            "_id": "c64a041b-1a9d-4043-908f-e886871c4e12",
                                            "longNames": [
                                                {
                                                    "locale": "en_US",
                                                    "name": "Large Coke"
                                                }
                                            ],
                                            "maximum_value": 1,
                                            "minimum_value": 0,
                                            "price": 3.5,
                                            "quantity": 1,
                                            "type": "CHOICE"
                                        }
                                    ],
                                    "longNames": [
                                        {
                                            "locale": "en_US",
                                            "name": "Size"
                                        }
                                    ],
                                    "maximum_value": 1,
                                    "minimum_value": 1,
                                    "quantity": 1,
                                    "type": "MODIFIER"
                                }
                            ],
                            "longNames": [
                                {
                                    "locale": "en_US",
                                    "name": "Coke"
                                }
                            ],
                            "maximum_value": 1,
                            "minimum_value": 1,
                            "quantity": 1,
                            "type": "CHOICE"
                        }
                    ],
                    "longNames": [
                        {
                            "locale": "en_US",
                            "name": "Drink",
                            "suggest": {
                                "input": "Drink",
                                "output": "Drink"
                            }
                        }
                    ],
                    "maximum_value": 10,
                    "minimum_value": 0,
                    "quantity": 4,
                    "type": "MODIFIER"
                }
            ]);
        });

        it('calculate empty combination',function(){
            var input=[];
            var res=shopping_cart.MenuComboCalculator.calculatNewCombo(input,menu_combo);
            res.should.eql([]);
        })

        it('calculate no items',function(){
            var input=[
                {
                    _id: "3795610e-aae0-434b-abca-96b7fecacc8e",
                },
                {
                    _id:"ae185ed4-4a05-4152-a190-5e892dad97c4",
                }
            ];
            var res=shopping_cart.MenuComboCalculator.calculatNewCombo(input,menu_combo);
            res.should.eql([
                {
                    "_id": "3795610e-aae0-434b-abca-96b7fecacc8e",
                    "longNames": [
                        {
                            "locale": "en_US",
                            "name": "Burgers"
                        },
                        {
                            "locale": "zh_CN",
                            "name": "汉堡"
                        }
                    ],
                    "maximum_value": 2,
                    "minimum_value": 1,
                    "type": "MODIFIER"
                },
                {
                    "_id": "ae185ed4-4a05-4152-a190-5e892dad97c4",
                    "longNames": [
                        {
                            "locale": "en_US",
                            "name": "Drink",
                            "suggest": {
                                "input": "Drink",
                                "output": "Drink"
                            }
                        }
                    ],
                    "maximum_value": 10,
                    "minimum_value": 0,
                    "type": "MODIFIER"
                }
            ]);
        });
    });
    
    describe('PriceCalculator class', function(){
        let calculator=shopping_cart.PriceCalculator;
        it('test without combinations',function(){
            let shopping_cart={
                tables:[
                    {
                        seats:[{
                            order_items:[
                                {
                                    base_price:'1.63',
                                    quantity:'31'
                                }
                            ]
                        }]
                    }
                ]
            }

            let total=calculator.calculate(shopping_cart);
            total.should.eql(50.53);
            shopping_cart.subtotal.should.eql(50.53);
            shopping_cart.tables[0].seats[0].subtotal.should.eql(50.53);
        });

        it('test multiple seats',function(){
            let shopping_cart={
                tables:[
                    {
                        seats:[
                            {
                                order_items: [
                                    {
                                        base_price: '1.63',
                                        quantity: 31
                                    }
                                ]
                            },
                            {
                                order_items: [
                                    {
                                        base_price: '3',
                                        quantity: '2'
                                    }
                                ]
                            },
                            {
                                order_items: [
                                    {
                                        base_price: '0.11',
                                        quantity: '3'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }

            let total=calculator.calculate(shopping_cart);
            total.should.eql(56.86);
            shopping_cart.subtotal.should.eql(56.86);
            shopping_cart.tables[0].seats[0].subtotal.should.eql(50.53);
            shopping_cart.tables[0].seats[1].subtotal.should.eql(6);
            shopping_cart.tables[0].seats[2].subtotal.should.eql(0.33);

        })

        it('test multiple tables',function(){
            let shopping_cart={
                tables:[
                    {
                        seats:[
                            {
                                order_items: [
                                    {
                                        base_price: '1.63',
                                        quantity: '31'
                                    }
                                ]
                            },
                            {
                                order_items: [
                                    {
                                        base_price: '3',
                                        quantity: '2'
                                    }
                                ]
                            },
                            {
                                order_items: [
                                    {
                                        base_price: '0.11',
                                        quantity: '3'
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        seats:[
                            {
                                order_items: [
                                    {
                                        base_price: '1.63',
                                        quantity: '31'
                                    }
                                ]
                            },
                            {
                                order_items: [
                                    {
                                        base_price: '3',
                                        quantity: '2'
                                    }
                                ]
                            },
                            {
                                order_items: [
                                    {
                                        base_price: '0.11',
                                        quantity: '3'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }

            let total=calculator.calculate(shopping_cart);
            total.should.eql(113.72);
            shopping_cart.subtotal.should.eql(113.72);
            shopping_cart.tables[0].seats[0].subtotal.should.eql(50.53);
            shopping_cart.tables[0].seats[1].subtotal.should.eql(6);
            shopping_cart.tables[0].seats[2].subtotal.should.eql(0.33);
            shopping_cart.tables[1].seats[0].subtotal.should.eql(50.53);
            shopping_cart.tables[1].seats[1].subtotal.should.eql(6);
            shopping_cart.tables[1].seats[2].subtotal.should.eql(0.33);
        });

        it('test multiple order items',function(){
            let shopping_cart={
                tables:[
                    {
                        seats:[
                            {
                                order_items: [
                                    {
                                        base_price: '1.63',
                                        quantity: '31'
                                    },
                                    {
                                        base_price: '3.63',
                                        quantity: '2'
                                    }
                                ]
                            },
                            {
                                order_items: [
                                    {
                                        base_price: '3',
                                        quantity: '2'
                                    }
                                ]
                            },
                            {
                                order_items: [
                                    {
                                        base_price: '0.11',
                                        quantity: '3'
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        seats:[
                            {
                                order_items: [
                                    {
                                        base_price: '1.63',
                                        quantity: '31'
                                    }
                                ]
                            },
                            {
                                order_items: [
                                    {
                                        base_price: '3',
                                        quantity: '2'
                                    },
                                    {
                                        base_price: '3',
                                        quantity: '2'
                                    }
                                ]
                            },
                            {
                                order_items: [
                                    {
                                        base_price: '0.11',
                                        quantity: '3'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }

            let total=calculator.calculate(shopping_cart);
            total.should.eql(126.98);
            shopping_cart.subtotal.should.eql(126.98);
            shopping_cart.tables[0].seats[0].subtotal.should.eql(57.79);
            shopping_cart.tables[0].seats[1].subtotal.should.eql(6);
            shopping_cart.tables[0].seats[2].subtotal.should.eql(0.33);
            shopping_cart.tables[1].seats[0].subtotal.should.eql(50.53);
            shopping_cart.tables[1].seats[1].subtotal.should.eql(12);
            shopping_cart.tables[1].seats[2].subtotal.should.eql(0.33);
        });

        it('test with combinations',function(){
            let shopping_cart={
                tables:[
                    {
                        seats:[
                            {
                                order_items: [
                                    {
                                        base_price: '1.63',
                                        quantity: '31',
                                        combinations:[
                                            {
                                                type:'MODIFIER',
                                                items:[
                                                    {
                                                        type:'CHOICE',
                                                        price:8.1,
                                                        quantity:9,
                                                        items:[//!!! IMPORTANT !!!! choice sub items should not be calculated
                                                            {
                                                                price: 8.1,
                                                                quantity: 9,
                                                                items: []
                                                            }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                type:'MODIFIER',
                                                items:[]
                                            }
                                        ]
                                    },
                                    {
                                        base_price: '3.63',
                                        quantity: '2'
                                    }
                                ]
                            },
                            {
                                order_items: [
                                    {
                                        base_price: '0.11',
                                        quantity: '3'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }

            let total=calculator.calculate(shopping_cart);
            total.should.eql(131.02);
            shopping_cart.subtotal.should.eql(131.02);
            shopping_cart.tables[0].seats[0].subtotal.should.eql(130.69);
            shopping_cart.tables[0].seats[1].subtotal.should.eql(0.33);

        });

        it('test empty',function(){
            let shopping_cart={
                tables:[
                    {
                        seats:[
                            {
                                order_items: []
                            },
                            {
                                order_items: []
                            }
                        ]
                    }
                ]
            }

            let total=calculator.calculate(shopping_cart);
            total.should.eql(0);
            shopping_cart.subtotal.should.eql(0);
            shopping_cart.tables[0].seats[0].subtotal.should.eql(0);
            shopping_cart.tables[0].seats[1].subtotal.should.eql(0);
        });

        it('test with percentage order discount',function(){
            let shopping_cart={
                discount:{
                    discount_type:'PERCENTAGE',
                    discount_value:50
                },
                tables:[
                    {
                        seats:[
                            {
                                order_items: [
                                    {
                                        base_price: '1.63',
                                        quantity: '31'
                                    },
                                    {
                                        base_price: '3.63',
                                        quantity: '2'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }

            let total=calculator.calculate(shopping_cart);
            total.should.eql(28.89);
            shopping_cart.subtotal.should.eql(28.89);
        });

        it('test with amount discount',function(){
            let shopping_cart={
                discount:{
                    discount_type:'AMOUNT',
                    discount_value:43
                },
                tables:[
                    {
                        seats:[
                            {
                                order_items: [
                                    {
                                        base_price: '1.63',
                                        quantity: '31'
                                    },
                                    {
                                        base_price: '3.63',
                                        quantity: '2'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }

            let total=calculator.calculate(shopping_cart);
            total.should.eql(14.79);
            shopping_cart.subtotal.should.eql(14.79);
        });

        it('test with amount order discount',function(){
            let shopping_cart={

                tables:[
                    {
                        seats:[
                            {
                                order_items: [
                                    {
                                        discount:{
                                            discount_type:'PERCENTAGE',
                                            discount_value:5
                                        },
                                        base_price: '1.63',
                                        quantity: '31'
                                    },
                                    {
                                        discount:{
                                            discount_type:'PERCENTAGE',
                                            discount_value:10
                                        },
                                        base_price: '3.63',
                                        quantity: '2'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }

            let total=calculator.calculate(shopping_cart);
            total.should.eql(54.54);
            shopping_cart.subtotal.should.eql(54.54);
        });
    });

    describe('ShoppingCart Order Item Merge Utility', function(){
        it('with combo and non combo',function(){
            let util=shopping_cart.OrderItemCombiner;
            let items_to_merge=[
                {
                    item_id: 'item_id1',
                    quantity: 123
                },
                {
                    item_id: 'item_id1',
                    quantity: 123,
                    combinations:[{
                        what:'ever'
                    }]
                },
                {
                    item_id: 'item_id1',
                    quantity: 123,
                    combinations:[{
                        what:'ever'
                    }]
                },
                {
                    item_id: 'item_id1',
                    quantity: 123
                },
                {
                    item_id: 'item_id2',
                    quantity: 123
                }
            ];

            let original_items=[
                {
                    item_id: 'item_id1',
                    quantity: 123
                },
                {
                    item_id: 'item_id1',
                    quantity: 123,
                    combinations:[{
                        what:'ever'
                    }]
                }
            ]

            let ret=util.merge_order_items(original_items,items_to_merge);
            ret.should.eql([
                {
                    item_id: 'item_id1',
                    quantity: 369
                },
                {
                    item_id: 'item_id1',
                    quantity: 123,
                    combinations:[{
                        what:'ever'
                    }]
                },
                {
                    item_id: 'item_id1',
                    quantity: 123,
                    combinations:[{
                        what:'ever'
                    }]
                },
                {
                    item_id: 'item_id1',
                    quantity: 123,
                    combinations:[{
                        what:'ever'
                    }]
                },
                {
                    item_id: 'item_id2',
                    quantity: 123
                }
            ]);
        });
 
    });

});
