/**
 * Created by richardmaglaya on 2014-10-27.
 */
'use strict';


var TestShoppingCartForPayment = {
    "_id" : "c28424ad-8231-41b0-ba54-225796e43b1c",
    "order_type" : "DINE_IN",
    "restaurant" : {
        "restaurant_id" : "1f5897f3-0892-4446-97a4-c0c7fed1a80c",
        "restaurant_name" : "Delhi Darbar"
    },
    "applicable_taxes":[
        {
            "name" : "GST",
            "rate" : 5
        },
        {
            "name" : "Liquor",
            "rate" : 15
        }
    ],
    "status" : "INPROCESS",
    "create_time" : new Date("2016-08-04T22:15:17.748Z"),
    "update_time" : new Date("2016-08-04T23:42:49.126Z"),
    "created_by" : {
        "user_id" : "bcc08cb3-cfec-4eff-893d-2983bf386aaa",
        "user_name" : "NA_user1",
        "avatar_path" : 'xxx'
    },
    "tables" : [
        {
            "table_id" : "a992b938-a825-4ae2-848a-bdd65e36d93b",
            "table_no" : "7",
            "server" : {
                "server_id" : "bcc08cb3-cfec-4eff-893d-2983bf386aaa",
                "disp_name" : "NA_user1"
            },
            "seats" : [
                {
                    "seat_id" : "f0481727-33a3-4b2a-b586-5f3a62846a6d",
                    "seat_no" : 1,
                    "seat_name" : "123",
                    "create_time" : new Date("2016-08-04T22:15:17.512Z"),
                    "update_time" : new Date("2016-08-04T22:15:17.512Z"),
                    "shared_seat" : true,
                    "order_items" : [
                        {
                            "item_id" : "6b15c1cc-ebc6-49df-abab-c3ea35c924f6",
                            "order_item_id" : "826bd4aa-cc49-46ef-ae69-b80a528f55b4",
                            "create_time" : new Date("2016-08-04T22:15:17.651Z"),
                            "category":"LIQUOR",
                            "item_names" : [
                                {
                                    "locale" : "zh_CN",
                                    "name" : "羊头头d",
                                    "suggest" : {
                                        "input" : [
                                            "羊头头d"
                                        ],
                                        "output" : "羊头头d"
                                    }
                                },
                                {
                                    "locale" : "en_US",
                                    "name" : "The King of Sheeps",
                                    "suggest" : {
                                        "input" : [
                                            "The",
                                            "King",
                                            "of",
                                            "Sheeps"
                                        ],
                                        "output" : "The King of Sheeps"
                                    }
                                }
                            ],
                            "base_price" : 11,
                            "printers" : [],
                            "quantity" : 2
                        }
                    ]
                }
            ]
        }
    ],
    "order_no" : 1646,
    "v" : 1,
    "discount" : {
        "discount_id" : "85963405-bbd6-49af-b922-2e0d539033bf",
        "discount_type" : "PERCENTAGE",
        "discount_value" : 12
    }
};

var TestShoppingCartForSharedSeats={
    "tables" : [
        {
            "table_id" : "2177363b-a482-4ddb-8305-990a1bd537a4",
            "seats" : [
                {
                    "seat_id" : "aac80a5d-6311-4827-830f-97b7eb108a22",
                    "shared_seat" : true,
                    "order_items" : [
                        {
                            "item_id" : "cf5bf25a-96bd-4386-b391-523cc3bdbcb3",
                            "order_item_id" : "item_id_1",
                            "base_price" : 1,
                            "quantity" : 5
                        },
                        {
                            "item_id" : "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                            "order_item_id" : "item_id_2",
                            "base_price" : 8,
                            "quantity" : 1,
                            "combinations" : [
                                {
                                    "type" : "MODIFIER",
                                    "_id" : "fc8d445d-9838-44e8-8aa7-3941a7a3ef85",
                                    "items" : []
                                }
                            ]
                        }
                    ],
                    "seats_to_share" : [
                        "f0480afa-2ebc-4d2a-ac3d-3523fefb8352",
                        "f0480afa-2ebc-4d2a-ac3d-3523fefbasd"
                    ]
                },
                {
                    "seat_id" : "aac80a5d-6311-4827-830f-97b7eb108a22",
                    "shared_seat" : true,
                    "order_items" : [
                        {
                            "item_id" : "cf5bf25a-96bd-4386-b391-523cc3bdbcb3",
                            "order_item_id" : "item_id_3",
                            "base_price" : 1,
                            "quantity" : 5
                        },
                        {
                            "item_id" : "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                            "order_item_id" : "item_id_4",
                            "base_price" : 8,
                            "quantity" : 1,
                            "combinations" : [
                                {
                                    "type" : "MODIFIER",
                                    "_id" : "fc8d445d-9838-44e8-8aa7-3941a7a3ef85",
                                    "items" : []
                                }
                            ]
                        }
                    ],
                    "seats_to_share" : [
                        "f0480afa-2ebc-4d2a-ac3d-35111"
                    ]
                },
                {
                    "seat_id" : "f0480afa-2ebc-4d2a-ac3d-3523fefb8352",
                    "shared_seat" : false,
                    "order_items" : [
                        {
                            "item_id" : "cf5bf25a-96bd-4386-b391-523cc3bdbcb3",
                            "order_item_id" : "item_id_5",
                            "base_price" : 1,
                            "quantity" : 5
                        },
                        {
                            "item_id" : "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                            "order_item_id" : "item_id_6",
                            "base_price" : 8,
                            "quantity" : 1,
                            "combinations" : [
                                {
                                    "type" : "MODIFIER",
                                    "_id" : "fc8d445d-9838-44e8-8aa7-3941a7a3ef85",
                                    "items" : []
                                }
                            ]
                        }
                    ]
                },
                {
                    "seat_id" : "f0480afa-2ebc-4d2a-ac3d-3523fefbasd",
                    "shared_seat" : false,
                    "order_items" : [
                        {
                            "item_id" : "some item id",
                            "order_item_id" : "item_id_7",
                            "base_price" : 1,
                            "quantity" : 5
                        },
                        {
                            "item_id" : "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                            "order_item_id" : "item_id_8",
                            "base_price" : 8,
                            "quantity" : 3
                        }
                    ]
                },
                {
                    "seat_id" : "f0480afa-2ebc-4d2a-ac3d-35111",
                    "shared_seat" : false,
                    "order_items" : []
                }
            ]
        }
    ],
    "order_no" : 245,
    "v" : 1
}

var TestShoppingCartForSharedSeats_Result={
    "order_no": 245,
    "tables": [
        {
            "seats": [
                {
                    "seat_id" : "aac80a5d-6311-4827-830f-97b7eb108a22",
                    "shared_seat" : true,
                    "order_items" : [
                        {
                            "item_id" : "cf5bf25a-96bd-4386-b391-523cc3bdbcb3",
                            "order_item_id" : "item_id_3",
                            "base_price" : 1,
                            "quantity" : 5,
                            "subtotal" : 1.66
                        },
                        {
                            "item_id" : "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                            "order_item_id" : "item_id_4",
                            "base_price" : 8,
                            "quantity" : 1,
                            "subtotal" : 2.66,
                            "combinations" : [
                                {
                                    "type" : "MODIFIER",
                                    "_id" : "fc8d445d-9838-44e8-8aa7-3941a7a3ef85",
                                    "items" : []
                                }
                            ]
                        }
                    ],
                    "seats_to_share" : [
                        "f0480afa-2ebc-4d2a-ac3d-35111"
                    ]
                },
                {
                    "seat_id" : "aac80a5d-6311-4827-830f-97b7eb108a22",
                    "shared_seat" : true,
                    "order_items" : [
                        {
                            "item_id" : "cf5bf25a-96bd-4386-b391-523cc3bdbcb3",
                            "order_item_id" : "item_id_1",
                            "base_price" : 1,
                            "quantity" : 5,
                            "subtotal" : 0.83
                        },
                        {
                            "item_id" : "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                            "order_item_id" : "item_id_2",
                            "base_price" : 8,
                            "quantity" : 1,
                            "subtotal" : 1.33,
                            "combinations" : [
                                {
                                    "type" : "MODIFIER",
                                    "_id" : "fc8d445d-9838-44e8-8aa7-3941a7a3ef85",
                                    "items" : []
                                }
                            ]
                        }
                    ],
                    "seats_to_share" : [
                        "f0480afa-2ebc-4d2a-ac3d-3523fefb8352",
                        "f0480afa-2ebc-4d2a-ac3d-3523fefbasd"
                    ]
                },
                {
                    "order_items": [
                        {
                            "base_price": 1,
                            "item_id": "cf5bf25a-96bd-4386-b391-523cc3bdbcb3",
                            "order_item_id": "item_id_5",
                            "quantity": 7.5
                        },
                        {
                            "base_price": 8,
                            "combinations": [
                                {
                                    "_id": "fc8d445d-9838-44e8-8aa7-3941a7a3ef85",
                                    "items": [],
                                    "type": "MODIFIER"
                                }
                            ],
                            "item_id": "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                            "order_item_id": "item_id_6",
                            "quantity": 1
                        },
                        {
                            "base_price": 8,
                            "combinations": [
                                {
                                    "_id": "fc8d445d-9838-44e8-8aa7-3941a7a3ef85",
                                    "items": [],
                                    "type": "MODIFIER"
                                }
                            ],
                            "item_id": "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                            "order_item_id": "item_id_2",
                            "quantity": 0.5
                        }
                    ],
                    "seat_id": "f0480afa-2ebc-4d2a-ac3d-3523fefb8352",
                    "shared_seat": false
                },
                {
                    "order_items": [
                        {
                            "base_price": 1,
                            "item_id": "some item id",
                            "order_item_id": "item_id_7",
                            "quantity": 5
                        },
                        {
                            "base_price": 8,
                            "item_id": "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                            "order_item_id": "item_id_8",
                            "quantity": 3
                        },
                        {
                            "base_price": 1,
                            "item_id": "cf5bf25a-96bd-4386-b391-523cc3bdbcb3",
                            "order_item_id": "item_id_1",
                            "quantity": 2.5
                        },
                        {
                            "base_price": 8,
                            "combinations": [
                                {
                                    "_id": "fc8d445d-9838-44e8-8aa7-3941a7a3ef85",
                                    "items": [],
                                    "type": "MODIFIER"
                                }
                            ],
                            "item_id": "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                            "order_item_id": "item_id_2",
                            "quantity": 0.5
                        }
                    ],
                    "seat_id": "f0480afa-2ebc-4d2a-ac3d-3523fefbasd",
                    "shared_seat": false
                },
                {
                    "order_items": [
                        {
                            "base_price": 1,
                            "item_id": "cf5bf25a-96bd-4386-b391-523cc3bdbcb3",
                            "order_item_id": "item_id_3",
                            "quantity": 5
                        },
                        {
                            "base_price": 8,
                            "combinations": [
                                {
                                    "_id": "fc8d445d-9838-44e8-8aa7-3941a7a3ef85",
                                    "items": [],
                                    "type": "MODIFIER"
                                }
                            ],
                            "item_id": "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                            "order_item_id": "item_id_4",
                            "quantity": 1
                        }
                    ],
                    "seat_id": "f0480afa-2ebc-4d2a-ac3d-35111",
                    "shared_seat": false
                }
            ],
            "table_id": "2177363b-a482-4ddb-8305-990a1bd537a4"
        }
    ],
    "v": 1
}

var TestShoppingCartForSharedSeats_Split_Payment_Evenly_Result=
    {
        "before_rounded_data": {
            "subtotal": 22.666666666666664
        },
        "order_no": 245,
        "subtotal": 22.67,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 4.333333333333334
                        },
                        "order_items": [
                            {
                                "base_price": 1,
                                "before_rounded_data": {
                                    "subtotal": 1.6666666666666665,
                                    "subtotal_before_discount": 1.6666666666666665
                                },
                                "item_id": "cf5bf25a-96bd-4386-b391-523cc3bdbcb3",
                                "order_item_id": "item_id_1",
                                "paid_percentage": 0,
                                "quantity": 5,
                                "subtotal": 1.67,
                                "subtotal_before_discount": 1.67
                            },
                            {
                                "base_price": 8,
                                "before_rounded_data": {
                                    "subtotal": 2.666666666666667,
                                    "subtotal_before_discount": 2.666666666666667
                                },
                                "combinations": [
                                    {
                                        "_id": "fc8d445d-9838-44e8-8aa7-3941a7a3ef85",
                                        "before_rounded_data": {
                                            "subtotal": 0,
                                            "subtotal_before_discount": 0
                                        },
                                        "items": [],
                                        "subtotal": 0,
                                        "subtotal_before_discount": 0,
                                        "type": "MODIFIER"
                                    }
                                ],
                                "item_id": "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                                "order_item_id": "item_id_2",
                                "paid_percentage": 0,
                                "quantity": 1,
                                "subtotal": 2.67,
                                "subtotal_before_discount": 2.67
                            }
                        ],
                        "seat_id": "aac80a5d-6311-4827-830f-97b7eb108a22",
                        "seats_to_share": [
                            "f0480afa-2ebc-4d2a-ac3d-3523fefb8352",
                            "f0480afa-2ebc-4d2a-ac3d-3523fefbasd"
                        ],
                        "shared_seat": true,
                        "subtotal": 4.33
                    },
                    {
                        "before_rounded_data": {
                            "subtotal": 4.333333333333334
                        },
                        "order_items": [
                            {
                                "base_price": 1,
                                "before_rounded_data": {
                                    "subtotal": 1.6666666666666665,
                                    "subtotal_before_discount": 1.6666666666666665
                                },
                                "item_id": "cf5bf25a-96bd-4386-b391-523cc3bdbcb3",
                                "order_item_id": "item_id_3",
                                "paid_percentage": 0,
                                "quantity": 5,
                                "subtotal": 1.67,
                                "subtotal_before_discount": 1.67
                            },
                            {
                                "base_price": 8,
                                "before_rounded_data": {
                                    "subtotal": 2.666666666666667,
                                    "subtotal_before_discount": 2.666666666666667
                                },
                                "combinations": [
                                    {
                                        "_id": "fc8d445d-9838-44e8-8aa7-3941a7a3ef85",
                                        "before_rounded_data": {
                                            "subtotal": 0,
                                            "subtotal_before_discount": 0
                                        },
                                        "items": [],
                                        "subtotal": 0,
                                        "subtotal_before_discount": 0,
                                        "type": "MODIFIER"
                                    }
                                ],
                                "item_id": "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                                "order_item_id": "item_id_4",
                                "paid_percentage": 0,
                                "quantity": 1,
                                "subtotal": 2.67,
                                "subtotal_before_discount": 2.67
                            }
                        ],
                        "seat_id": "aac80a5d-6311-4827-830f-97b7eb108a22",
                        "seats_to_share": [
                            "f0480afa-2ebc-4d2a-ac3d-35111"
                        ],
                        "shared_seat": true,
                        "subtotal": 4.33
                    },
                    {
                        "before_rounded_data": {
                            "subtotal": 4.333333333333334
                        },
                        "order_items": [
                            {
                                "base_price": 1,
                                "before_rounded_data": {
                                    "subtotal": 1.6666666666666665,
                                    "subtotal_before_discount": 1.6666666666666665
                                },
                                "item_id": "cf5bf25a-96bd-4386-b391-523cc3bdbcb3",
                                "order_item_id": "item_id_5",
                                "paid_percentage": 0,
                                "quantity": 5,
                                "subtotal": 1.67,
                                "subtotal_before_discount": 1.67
                            },
                            {
                                "base_price": 8,
                                "before_rounded_data": {
                                    "subtotal": 2.666666666666667,
                                    "subtotal_before_discount": 2.666666666666667
                                },
                                "combinations": [
                                    {
                                        "_id": "fc8d445d-9838-44e8-8aa7-3941a7a3ef85",
                                        "before_rounded_data": {
                                            "subtotal": 0,
                                            "subtotal_before_discount": 0
                                        },
                                        "items": [],
                                        "subtotal": 0,
                                        "subtotal_before_discount": 0,
                                        "type": "MODIFIER"
                                    }
                                ],
                                "item_id": "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                                "order_item_id": "item_id_6",
                                "paid_percentage": 0,
                                "quantity": 1,
                                "subtotal": 2.67,
                                "subtotal_before_discount": 2.67
                            }
                        ],
                        "seat_id": "f0480afa-2ebc-4d2a-ac3d-3523fefb8352",
                        "shared_seat": false,
                        "subtotal": 4.33
                    },
                    {
                        "before_rounded_data": {
                            "subtotal": 9.666666666666666
                        },
                        "order_items": [
                            {
                                "base_price": 1,
                                "before_rounded_data": {
                                    "subtotal": 1.6666666666666665,
                                    "subtotal_before_discount": 1.6666666666666665
                                },
                                "item_id": "some item id",
                                "order_item_id": "item_id_7",
                                "paid_percentage": 0,
                                "quantity": 5,
                                "subtotal": 1.67,
                                "subtotal_before_discount": 1.67
                            },
                            {
                                "base_price": 8,
                                "before_rounded_data": {
                                    "subtotal": 8,
                                    "subtotal_before_discount": 8
                                },
                                "item_id": "0aa14b5b-d722-4915-af19-4bd036aaeb02",
                                "order_item_id": "item_id_8",
                                "paid_percentage": 0,
                                "quantity": 3,
                                "subtotal": 8,
                                "subtotal_before_discount": 8
                            }
                        ],
                        "seat_id": "f0480afa-2ebc-4d2a-ac3d-3523fefbasd",
                        "shared_seat": false,
                        "subtotal": 9.66
                    }
                ],
                "table_id": "2177363b-a482-4ddb-8305-990a1bd537a4"
            }
        ],
        "v": 1
    }

module.exports = function() {
    return {
        TestShoppingCart:TestShoppingCartForPayment,
        TestShoppingCartForSharedSeats:TestShoppingCartForSharedSeats,
        TestShoppingCartForSharedSeats_Result:TestShoppingCartForSharedSeats_Result,
        TestShoppingCartForSharedSeats_Split_Payment_Evenly_Result:TestShoppingCartForSharedSeats_Split_Payment_Evenly_Result
    }
};