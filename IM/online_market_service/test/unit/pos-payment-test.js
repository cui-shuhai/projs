'use strict';

process.env.NODE_ENV = 'development';
var fixtures = require('./../fixtures/pos-shopping-cart-fixtures')();
var payment_fixtures = require('./../fixtures/pos-payment-fixtures')();

var should = require('should');
var configServerFixtures = require('./../fixtures/config-server-fixtures').config;
var backendHelpers = require('backend-helpers')();
var co=require('co');
var sinon = require('sinon');
var pos_payment = require('../../app/libv2/pos-payment')(configServerFixtures, configServerFixtures.mongo, console);
var shopping_cart = require('../../app/libv2/shopping-cart')(configServerFixtures, configServerFixtures.mongo, console);
describe('Pos Payment [Unit]', function() {
        describe('PosPaymentCreator', function () {
            it('Create Simple Payment',function(done){
                var dataApiMock={
                    find:function*(){
                        return [{
                            applicableTaxes:[1,2,3]
                        }]
                    }
                }
                var paymentCreator = new pos_payment.PosPaymentCreator(backendHelpers.enums,backendHelpers.httpExceptions,JSON.parse(JSON.stringify(fixtures.TestShoppingCart)),dataApiMock,{
                    applicableTaxes:[1,2,3]
                });
                var input={
                    order_id: "06ab799b-37f7-4cdd-9593-8553676612f5",  //mandatory
                    restaurant_id: "06ab799b-37f7-4cdd-9593-8553676612f5", //mandatory
                    order_detail: {
                        tables:[
                            {
                                table_id:"a992b938-a825-4ae2-848a-bdd65e36d93b", //mandatory
                                seats:[
                                    {
                                        seat_id: "f0481727-33a3-4b2a-b586-5f3a62846a6d", //mandatory
                                        order_items:[
                                            {
                                                order_item_id: "826bd4aa-cc49-46ef-ae69-b80a528f55b4", //mandatory
                                                quantity: 1
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    tip: 1.2,
                    notes: "some string", //max length 50 characters
                    payment_method: "CASH"
                }
                var payment;

                co(function *() {
                    payment=yield paymentCreator.createPosPayment(input,1);
                    payment.should.eql(
                        {
                            "_id": 1,
                            "applicable_taxes": [
                                1,
                                2,
                                3
                            ],
                            "notes": "some string",
                            "order_detail": {
                                "created_by": {
                                    "avatar_path": "xxx",
                                    "user_id": "bcc08cb3-cfec-4eff-893d-2983bf386aaa",
                                    "user_name": "NA_user1"
                                },
                                "discount": {
                                    "discount_id": "85963405-bbd6-49af-b922-2e0d539033bf",
                                    "discount_type": "PERCENTAGE",
                                    "discount_value": 12
                                },
                                "order_no": 1646,
                                "order_type": "DINE_IN",
                                "tables": [
                                    {
                                        "seats": [
                                            {
                                                "order_items": [
                                                    {
                                                        "category": "LIQUOR",
                                                        "item_id": "6b15c1cc-ebc6-49df-abab-c3ea35c924f6",
                                                        "item_names": [
                                                            {
                                                                "locale": "zh_CN",
                                                                "name": "羊头头d",
                                                                "suggest": {
                                                                    "input": [
                                                                        "羊头头d"
                                                                    ],
                                                                    "output": "羊头头d"
                                                                }
                                                            },
                                                            {
                                                                "locale": "en_US",
                                                                "name": "The King of Sheeps",
                                                                "suggest": {
                                                                    "input": [
                                                                        "The",
                                                                        "King",
                                                                        "of",
                                                                        "Sheeps"
                                                                    ],
                                                                    "output": "The King of Sheeps"
                                                                }
                                                            }
                                                        ],
                                                        "order_item_id": "826bd4aa-cc49-46ef-ae69-b80a528f55b4",
                                                        "price": 11,
                                                        "quantity": 1,
                                                        "subtotal_before_discount":0
                                                    }
                                                ],
                                                "seat_id": "f0481727-33a3-4b2a-b586-5f3a62846a6d",
                                                "seat_no": 1,
                                            }
                                        ],
                                        "server_id": "bcc08cb3-cfec-4eff-893d-2983bf386aaa",
                                        "table_id": "a992b938-a825-4ae2-848a-bdd65e36d93b",
                                        "table_no": "7"
                                    }
                                ]
                            },

                            "order_id": "06ab799b-37f7-4cdd-9593-8553676612f5",
                            "payment_method": "CASH",
                            "restaurant_id": "06ab799b-37f7-4cdd-9593-8553676612f5",
                            "tip": 1.2
                        }
                    );
                }).then(done,done);

            });
        });
        describe('PaymentPriceCalculator', function(){
            it('Calculate Total with discounts taxes tips', function(){
                let test_payment=JSON.parse(JSON.stringify(payment_fixtures.TestPaymentForCalculator));
                pos_payment.PaymentPriceCalculator.calculate(test_payment);
                test_payment.should.eql(payment_fixtures.TestPaymentForCalculator_Result);
            });
            it('Calculate discount totals with pre-calculated subtotals', function(){
                let test_payment=JSON.parse(JSON.stringify(payment_fixtures.TestPaymentForCalculator_preSubtotal));
                pos_payment.PaymentPriceCalculator.calculate(test_payment);
                test_payment.discount_total.should.eql(0.3);
            });
            it('Test order item flattern logics', function(){
                let test_payment={
                    order_detail:{
                        tables:[
                            {
                                seats:[
                                    {
                                        order_items:[{
                                            item_id:'item_id1',
                                            quantity:1,
                                            subtotal:12.5
                                        }]
                                    },
                                    {
                                        order_items:[
                                            {
                                                item_id:'item_id1',
                                                quantity:1,
                                                subtotal:12.5
                                            },
                                            {
                                                item_id:'item_id2',
                                                quantity:1,
                                                subtotal:12.5
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                seats:[
                                    {
                                        order_items:[{
                                            item_id:'item_id1',
                                            quantity:1,
                                            subtotal:12.5,
                                            combinations:[{
                                                test:'test'
                                            }]
                                        }]
                                    },
                                    {
                                        order_items:[
                                            {
                                                item_id:'item_id1',
                                                quantity:1,
                                                subtotal:12.5
                                            },
                                            {
                                                item_id:'item_id2',
                                                quantity:1,
                                                subtotal:12.5
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
                let order_list=pos_payment.PaymentPriceCalculator.flattern_order_items(test_payment);
                order_list.should.eql([
                    {
                        "item_id": "item_id1",
                        "quantity": 3,
                        "subtotal": 37.5
                    },
                    {
                        "item_id": "item_id2",
                        "quantity": 2,
                        "subtotal": 25
                    },
                    {
                        "combinations": [
                            {
                                "test": "test"
                            }
                        ],
                        "item_id": "item_id1",
                        "quantity": 1,
                        "subtotal": 12.5
                    }
                ]);
            });
        });
        describe('PaidPercentageCalculator', function(){
            it('Calculate Paid Percentage', function(){
                let test_cart=JSON.parse(JSON.stringify(fixtures.TestShoppingCart));
                let test_payment=JSON.parse(JSON.stringify(payment_fixtures.TestPayment));
                shopping_cart.PriceCalculator.calculate(test_cart);
                pos_payment.PaymentPriceCalculator.calculate(test_payment);
                var percent_calculator = new pos_payment.PaidPercentageCalculator(test_cart,test_payment);
                let res=percent_calculator.calculate();
                test_cart.tables[0].seats[0].order_items[0].paid_percentage.should.eql(50);
                test_cart.tables[0].seats[0].order_items[0].paid_amount.should.eql(11);
                test_cart.paid_percentage.should.eql(50);
                test_cart.paid_amount.should.eql(9.68);


                percent_calculator.calculate();
                test_cart.tables[0].seats[0].order_items[0].paid_percentage.should.eql(100);
                test_cart.tables[0].seats[0].order_items[0].paid_amount.should.eql(22);
                test_cart.paid_percentage.should.eql(100);
                test_cart.paid_amount.should.eql(19.36);

            });

            it('Calculate Multiple Orders', function(){
                let cart={
                    subtotal:73.94,
                    tables:[
                        {
                            table_id: 'table2',
                            seats: [
                                {
                                    seat_id: 'seat3',
                                    order_items: [
                                        {
                                            order_item_id: 'item3',
                                            subtotal: 32.11
                                        },
                                        {
                                            order_item_id: 'item4',
                                            subtotal: 12.11
                                        }
                                    ]
                                }]
                        },
                        {
                            table_id: 'table1',
                            seats: [
                                {
                                    seat_id: 'seat1',
                                    order_items: [
                                        {
                                            order_item_id: 'item1',
                                            subtotal: 12.22
                                        },
                                        {
                                            order_item_id: 'item2',
                                            subtotal: 5
                                        }
                                    ]
                                },
                                {
                                    seat_id: 'seat2',
                                    order_items: [
                                        {
                                            order_item_id: 'item2',
                                            subtotal: 12.50
                                        }
                                    ]
                                }]
                        }]
                }
                let test_payment={
                    subtotal:44.32,
                    order_detail:{
                        tables:[
                            {
                                table_id: 'table2',
                                seats: [
                                    {
                                        seat_id: 'seat3',
                                        order_items: [
                                            {
                                                order_item_id: 'item3',
                                                subtotal: 30.1
                                            },
                                            {
                                                order_item_id: 'item4',
                                                subtotal: 12.11
                                            }
                                        ]
                                    }]
                            },
                            {
                                table_id: 'table1',
                                seats: [
                                    {
                                        seat_id: 'seat1',
                                        order_items: [
                                            {
                                                order_item_id: 'item1',
                                                subtotal: 1.11
                                            },
                                            {
                                                order_item_id: 'item2',
                                                subtotal: 1
                                            }
                                        ]
                                    }]
                            }]
                    }
                };
                
                var percent_calculator = new pos_payment.PaidPercentageCalculator(cart,test_payment);
                percent_calculator.calculate();
                cart.tables[0].seats[0].order_items[0].paid_percentage.should.eql(94);
                cart.tables[0].seats[0].order_items[1].paid_percentage.should.eql(100);
                cart.tables[1].seats[0].order_items[0].paid_percentage.should.eql(9);
                cart.tables[1].seats[0].order_items[1].paid_percentage.should.eql(20);
                cart.tables[1].seats[1].order_items[0].paid_percentage.should.eql(0);
                cart.paid_percentage.should.eql(60);
            });

            it('test accumulative payment - same seat',function() {
                let cart={
                    subtotal: 32.11,
                    tables:[
                        {
                            table_id: 'table2',
                            seats: [
                                {
                                    seat_id: 'seat3',
                                    order_items: [
                                        {
                                            order_item_id: 'item3',
                                            subtotal: 32.11
                                        }
                                    ]
                                }]
                        }]
                }


                var percent_calculator = new pos_payment.PaidPercentageCalculator(cart,{
                    subtotal:12,
                    order_detail:{
                        tables:[
                            {
                                table_id: 'table2',
                                seats: [
                                    {
                                        seat_id: 'seat3',
                                        order_items: [
                                            {
                                                order_item_id: 'item3',
                                                subtotal: 12
                                            }
                                        ]
                                    }]
                            }]
                    }
                });
                percent_calculator.calculate();
                cart.tables[0].seats[0].order_items[0].paid_percentage.should.eql(37);
                cart.paid_percentage.should.eql(37);

                var percent_calculator = new pos_payment.PaidPercentageCalculator(cart,{
                    subtotal:20.11,
                    order_detail:{
                        tables:[
                            {
                                table_id: 'table2',
                                seats: [
                                    {
                                        seat_id: 'seat3',
                                        order_items: [
                                            {
                                                order_item_id: 'item3',
                                                subtotal: 20.11
                                            }
                                        ]
                                    }]
                            }]
                    }
                });
                percent_calculator.calculate();
                cart.tables[0].seats[0].order_items[0].paid_percentage.should.eql(100);
                cart.paid_percentage.should.eql(100);

                var err=null;
                try {
                    //fully paid orders cant be paied again
                    new pos_payment.PaidPercentageCalculator(cart);
                }catch(e){
                    err=e;
                }
                should.exist(err);

            })

            it('test accumulative payment - new order in new seat',function() {
                let cart={
                    subtotal: 62.22,
                    paid_percentage:50,
                    tables:[
                        {
                            table_id: 'table2',
                            seats: [
                                {
                                    seat_id: 'seat3',
                                    order_items: [
                                        {
                                            order_item_id: 'item3',
                                            subtotal: 32.11,
                                            paid_percentage:100,
                                            paid_amount:32.11
                                        }
                                    ]
                                },
                                {
                                    seat_id: 'seat4',
                                    order_items: [
                                        {
                                            order_item_id: 'item3',
                                            subtotal: 32.11
                                        }
                                    ]
                                }
                            
                            ]
                        }]
                }


                var percent_calculator = new pos_payment.PaidPercentageCalculator(cart,{
                    subtotal:32.11,
                    order_detail:{
                        tables:[
                            {
                                table_id: 'table2',
                                seats: [
                                    {
                                        seat_id: 'seat4',
                                        order_items: [
                                            {
                                                order_item_id: 'item3',
                                                subtotal: 32.11
                                            }
                                        ]
                                    }]
                            }]
                    }
                });
                percent_calculator.calculate();
                cart.tables[0].seats[0].order_items[0].paid_percentage.should.eql(100);
                cart.tables[0].seats[1].order_items[0].paid_percentage.should.eql(100);
                cart.paid_percentage.should.eql(100);


            })


        });
        describe('ShoppingCartSplitter',function(){
            it('evenly',function(done){
                let splitter=pos_payment.ShoppingCartSplitter;
                let res=splitter.split_evenly(payment_fixtures.TestSplitterInput,3);
                res.should.eql(payment_fixtures.TestSPlitter_Evenly_Result);
                done();
            });

            it('by seat with shared seats',function(done){
                let splitter=pos_payment.ShoppingCartSplitter;
                let res=splitter.split_by_seat(payment_fixtures.TestSplitterWithSharedSeatInput);
                res.should.eql(payment_fixtures.TestSplitterWithSharedSeatInput_Result);
                done();
            });

            it('by seat ',function(done){
                let splitter=pos_payment.ShoppingCartSplitter;
                let res=splitter.split_by_seat(payment_fixtures.TestSplitterInput);
                res.should.eql(payment_fixtures.TestSplitter_byseat_Result);
                done();
            });

            it('spread shared seats order items evenly across defined seats',function(done){
                let splitter=pos_payment.ShoppingCartSplitter;
                let res=splitter.split_evenly(fixtures.TestShoppingCartForSharedSeats,3);
                res.should.eql([fixtures.TestShoppingCartForSharedSeats_Split_Payment_Evenly_Result]);
                done();
            });

            it('by seat with previously paid payment',function(done){
                let splitter=pos_payment.ShoppingCartSplitter;
                let input=JSON.parse(JSON.stringify(payment_fixtures.TestSplitterInput));
                input.tables[0].seats[0].order_items[0].paid_amount=12;
                input.tables[0].seats[0].order_items[0].paid_percentage=50;
                
                input.tables[0].seats[1].order_items[0].paid_amount=22;
                input.tables[0].seats[1].order_items[0].paid_percentage=100;
                
                input.tables[0].seats[1].order_items[1].paid_amount=110;
                input.tables[0].seats[1].order_items[1].paid_percentage=100;
                
                input.tables[1].seats[0].order_items[0].paid_percentage=30;
                input.tables[1].seats[0].order_items[0].discount= {
                    "discount_id": "85963405-bbd6-49af-b922-2e0d539033bf",
                    "discount_type": "AMOUNT",
                    "discount_value": 0.5
                };
                input.tables[1].seats[0].order_items[0].paid_amount=3.3;

                input.tables[1].seats[0].order_items[1].paid_percentage=52;
                input.tables[1].seats[0].order_items[1].discount= {
                    "discount_id": "85963405-bbd6-49af-b922-2e0d539033bf",
                    "discount_type": "PERCENTAGE",
                    "discount_value": 0.1
                };
                input.tables[1].seats[0].order_items[1].paid_amount=11.3;

                let res=splitter.split_by_seat(input);
                res.should.eql(payment_fixtures.TestSplitter_byseat_Result_with_paid_percentage);
                done();
            });

        });
});
