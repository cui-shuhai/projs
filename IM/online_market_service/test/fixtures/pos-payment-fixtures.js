/**
 * Created by richardmaglaya on 2014-10-27.
 */
'use strict';


var TestPayment = {
    "notes": "some string",
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
    "order_detail": {
        "discount": {
            "discount_id": "85963405-bbd6-49af-b922-2e0d539033bf",
            "discount_type": "PERCENTAGE",
            "discount_value": 12
        },
        "order_no": 1646,
        "tables": [
            {
                "seats": [
                    {
                        "discount":undefined,
                        "order_items": [
                            {
                                "discount":undefined,
                                "category":"LIQUOR",
                                "item_id": "6b15c1cc-ebc6-49df-abab-c3ea35c924f6",
                                "order_item_id": "826bd4aa-cc49-46ef-ae69-b80a528f55b4",
                                "price": 11,
                                "quantity": 1
                            }
                        ],
                        "seat_id": "f0481727-33a3-4b2a-b586-5f3a62846a6d",
                        "seat_no": 1
                    }
                ],
                "table_id": "a992b938-a825-4ae2-848a-bdd65e36d93b",
                "table_no": "7"
            }
        ]
    },
    "order_id": "06ab799b-37f7-4cdd-9593-8553676612f5",
    "payment_method": "CASH",
    "restaurant_id": "06ab799b-37f7-4cdd-9593-8553676612f5",
    "tip": 1.2
};

var TestPaymentForCalculatorDiscountTotal_preSubtotal={
    "applicable_taxes":[],
    "order_detail": { 
        "tables": [
            {
                "seats": [
                    {
                        "order_items": [
                            {
                                "category":"LIQUOR",
                                "subtotal_before_discount":3,
                                "subtotal":3
                            }
                        ]
                    }
                ],
            }
        ]
    },
    "subtotal":2.7,
    "discount_total":1
};
var TestPaymentForCalculator = {
    "notes": "some string",
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
    "order_detail": {
        "discount": {
            "discount_id": "85963405-bbd6-49af-b922-2e0d539033bf",
            "discount_type": "PERCENTAGE",
            "discount_value": 12
        },
        "order_no": 1646,
        "tables": [
            {
                "seats": [
                    {
                        "discount":undefined,
                        "order_items": [
                            {
                                "discount":{
                                    "discount_id": "85963405-bbd6-49af-b922-2e0d539033bf",
                                    "discount_type": "PERCENTAGE",
                                    "discount_value": 5
                                },
                                "category":"LIQUOR",
                                "item_id": "6b15c1cc-ebc6-49df-abab-c3ea35c924f6",
                                "order_item_id": "826bd4aa-cc49-46ef-ae69-b80a528f55b4",
                                "price": 11,
                                "quantity": 1
                            },
                            {
                                "discount":{
                                    "discount_id": "85963405-bbd6-49af-b922-2e0d539033bf",
                                    "discount_type": "PERCENTAGE",
                                    "discount_value": 5
                                },
                                "category":"COMPONENT",
                                "item_id": "6b15c1cc-ebc6-49df-abab-c3ea35c924f6",
                                "order_item_id": "826bd4aa-cc49-46ef-ae69-b80a528f55b4",
                                "price": 12,
                                "quantity": 1
                            }
                        ],
                        "seat_id": "f0481727-33a3-4b2a-b586-5f3a62846a6d",
                        "seat_no": 1
                    }
                ],
                "table_id": "a992b938-a825-4ae2-848a-bdd65e36d93b",
                "table_no": "7"
            }
        ]
    },
    "order_id": "06ab799b-37f7-4cdd-9593-8553676612f5",
    "payment_method": "CASH",
    "restaurant_id": "06ab799b-37f7-4cdd-9593-8553676612f5",
    "tip": 1.2
};

var TestPaymentForCalculator_Result={
    "alcohol_total": 9.2,
    "applicable_taxes": [
        {
            "name": "GST",
            "rate": 5
        },
        {
            "name": "Liquor",
            "rate": 15
        }
    ],
    "before_rounded_data": {
        "alcohol_total": 9.196,
        "change": 0,
        "discount_total": 3.772000000000002,
        "paid_amount": 22.31,
        "subtotal": 19.227999999999998,
        "total": 22.31,
        "total_tax": 1.8815
    },
    "change": 0,
    "discount_total": 3.77,
    "notes": "some string",
    "order_detail": {
        "discount": {
            "discount_id": "85963405-bbd6-49af-b922-2e0d539033bf",
            "discount_type": "PERCENTAGE",
            "discount_value": 12
        },
        "order_no": 1646,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 21.85
                        },
                        "order_items": [
                            {
                                "before_rounded_data": {
                                    "subtotal": 10.45,
                                    "subtotal_before_discount": 11
                                },
                                "category": "LIQUOR",
                                "discount": {
                                    "discount_id": "85963405-bbd6-49af-b922-2e0d539033bf",
                                    "discount_type": "PERCENTAGE",
                                    "discount_value": 5
                                },
                                "item_id": "6b15c1cc-ebc6-49df-abab-c3ea35c924f6",
                                "order_item_id": "826bd4aa-cc49-46ef-ae69-b80a528f55b4",
                                "price": 11,
                                "quantity": 1,
                                "subtotal": 10.45,
                                "subtotal_before_discount": 11
                            },
                            {
                                "before_rounded_data": {
                                    "subtotal": 11.4,
                                    "subtotal_before_discount": 12
                                },
                                "category": "COMPONENT",
                                "discount": {
                                    "discount_id": "85963405-bbd6-49af-b922-2e0d539033bf",
                                    "discount_type": "PERCENTAGE",
                                    "discount_value": 5
                                },
                                "item_id": "6b15c1cc-ebc6-49df-abab-c3ea35c924f6",
                                "order_item_id": "826bd4aa-cc49-46ef-ae69-b80a528f55b4",
                                "price": 12,
                                "quantity": 1,
                                "subtotal": 11.4,
                                "subtotal_before_discount": 12
                            }
                        ],
                        "seat_id": "f0481727-33a3-4b2a-b586-5f3a62846a6d",
                        "seat_no": 1,
                        "subtotal": 21.85
                    }
                ],
                "table_id": "a992b938-a825-4ae2-848a-bdd65e36d93b",
                "table_no": "7"
            }
        ]
    },
    "order_id": "06ab799b-37f7-4cdd-9593-8553676612f5",
    "paid_amount": 22.31,
    "payment_method": "CASH",
    "restaurant_id": "06ab799b-37f7-4cdd-9593-8553676612f5",
    "subtotal": 19.23,
    "taxes": [
        {
            "amount": 0.5,
            "name": "GST"
        },
        {
            "amount": 1.38,
            "name": "Liquor"
        }
    ],
    "tip": 1.2,
    "total": 22.31,
    "total_tax": 1.88
}

var TestSplitterWithSharedSeatInput={
    "order_type" : "DINE_IN",
    "status" : "INPROCESS",
    "tables" : [
        {
            "table_id" : "table_id1",
            "table_no" : "7",
            "seats" : [
                {
                    "seat_id" : "table_id1_seat_id_1",
                    "shared_seat":true,
                    "seats_to_share":['table_id1_seat_id_2','table_id1_seat_id_3'],
                    "order_items" : [
                        {
                            "order_item_id" : "table_id1_seat_id_1_item_id_1",
                            "base_price" : 12,
                            "quantity" : 2
                        }
                    ]
                },
                {
                    "seat_id" : "table_id1_seat_id_2",
                    "order_items" : [
                        {
                            "order_item_id" : "table_id1_seat_id_2_item_id_1",
                            "base_price" : 11,
                            "quantity" : 2
                        },
                        {
                            "order_item_id" : "table_id1_seat_id_2_item_id_2",
                            "base_price" : 22,
                            "quantity" : 5
                        }
                    ]
                },
                {
                    "seat_id" : "table_id1_seat_id_3",
                    "order_items" : [
                        {
                            "order_item_id" : "table_id1_seat_id_3_item_id_1",
                            "base_price" : 11,
                            "quantity" : 2
                        },
                        {
                            "order_item_id" : "table_id1_seat_id_3_item_id_2",
                            "base_price" : 22,
                            "quantity" : 5
                        }
                    ]
                }
            ]
        },
        {
            "table_id" : "table_id2",
            "table_no" : "7",
            "seats" : [
                {
                    "seat_id" : "table_id2_seat_id_1",
                    "seat_no" : 1,
                    "seat_name" : "123",
                    "seats_to_share":[],
                    "shared_seat":true,
                    "order_items" : [
                        {
                            "order_item_id" : "table_id2_seat_id_1_item_id_1",
                            "base_price" : 12,
                            "quantity" : 2
                        }
                    ]
                },
                {
                    "seat_id" : "table_id2_seat_id_2",
                    "seat_no" : 1,
                    "seat_name" : "123",
                    "order_items" : [
                        {
                            "order_item_id" : "table_id2_seat_id_2_item_id_1",
                            "base_price" : 11,
                            "quantity" : 2
                        },
                        {
                            "order_item_id" : "table_id2_seat_id_2_item_id_2",
                            "base_price" : 12,
                            "quantity" : 3
                        }
                    ]
                },
                {
                    "seat_id" : "table_id2_seat_id_3",
                    "seat_no" : 1,
                    "seat_name" : "123",
                    "order_items" : [
                        {
                            "order_item_id" : "table_id2_seat_id_3_item_id_1",
                            "base_price" : 11,
                            "quantity" : 2
                        },
                        {
                            "order_item_id" : "table_id2_seat_id_3_item_id_2",
                            "base_price" : 12,
                            "quantity" : 3
                        }
                    ]
                }
            ]
        },
        {
            "table_id" : "table_id3",
            "table_no" : "7",
            "seats" : [
                {
                    "seat_id" : "table_id3_seat_id_1",
                    "seat_no" : 1,
                    "seat_name" : "123",
                    "seats_to_share":['table_id3_seat_id_2'],
                    "shared_seat":true,
                    "order_items" : [
                        {
                            "order_item_id" : "table_id3_seat_id_1_item_id_1",
                            "base_price" : 11,
                            "quantity" : 2,
                            "paid_amount":11,
                            "paid_percentage":50
                        }
                    ]
                },
                {
                    "seat_id" : "table_id3_seat_id_2",
                    "seat_no" : 1,
                    "seat_name" : "123",
                    "order_items" : [
                        {
                            "order_item_id" : "table_id3_seat_id_2_item_id_1",
                            "base_price" : 11,
                            "quantity" : 2
                        },
                        {
                            "order_item_id" : "table_id3_seat_id_2_item_id_2",
                            "base_price" : 12,
                            "quantity" : 3
                        }
                    ]
                },
                {
                    "seat_id" : "table_id3_seat_id_3",
                    "seat_no" : 1,
                    "seat_name" : "123",
                    "order_items" : [
                        {
                            "order_item_id" : "table_id3_seat_id_3_item_id_1",
                            "base_price" : 11,
                            "quantity" : 2
                        },
                        {
                            "order_item_id" : "table_id3_seat_id_3_item_id_2",
                            "base_price" : 12,
                            "quantity" : 3
                        }
                    ]
                }
            ]
        }

    ]
};



var TestSplitterWithSharedSeatInput_Result=[
    {
        "before_rounded_data": {
            "subtotal": 144
        },
        "order_type": "DINE_IN",
        "status": "INPROCESS",
        "subtotal": 144,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 132
                        },
                        "order_items": [
                            {
                                "base_price": 22,
                                "before_rounded_data": {
                                    "subtotal": 110,
                                    "subtotal_before_discount": 110
                                },
                                "order_item_id": "table_id1_seat_id_2_item_id_2",
                                "paid_percentage": 0,
                                "quantity": 5,
                                "subtotal": 110,
                                "subtotal_before_discount": 110
                            },
                            {
                                "base_price": 11,
                                "before_rounded_data": {
                                    "subtotal": 22,
                                    "subtotal_before_discount": 22
                                },
                                "order_item_id": "table_id1_seat_id_2_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 22,
                                "subtotal_before_discount": 22
                            }
                        ],
                        "seat_id": "table_id1_seat_id_2",
                        "subtotal": 132
                    },
                    {
                        "before_rounded_data": {
                            "subtotal": 12
                        },
                        "order_items": [
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 12,
                                    "subtotal_before_discount": 12
                                },
                                "order_item_id": "table_id1_seat_id_1_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 12,
                                "subtotal_before_discount": 12
                            }
                        ],
                        "seat_id": "table_id1_seat_id_1",
                        "seats_to_share": [
                            "table_id1_seat_id_2",
                            "table_id1_seat_id_3"
                        ],
                        "shared_seat": true,
                        "subtotal": 12
                    }
                ],
                "table_id": "table_id1",
                "table_no": "7"
            }
        ]
    },
    {
        "before_rounded_data": {
            "subtotal": 144
        },
        "order_type": "DINE_IN",
        "status": "INPROCESS",
        "subtotal": 144,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 132
                        },
                        "order_items": [
                            {
                                "base_price": 22,
                                "before_rounded_data": {
                                    "subtotal": 110,
                                    "subtotal_before_discount": 110
                                },
                                "order_item_id": "table_id1_seat_id_3_item_id_2",
                                "paid_percentage": 0,
                                "quantity": 5,
                                "subtotal": 110,
                                "subtotal_before_discount": 110
                            },
                            {
                                "base_price": 11,
                                "before_rounded_data": {
                                    "subtotal": 22,
                                    "subtotal_before_discount": 22
                                },
                                "order_item_id": "table_id1_seat_id_3_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 22,
                                "subtotal_before_discount": 22
                            }
                        ],
                        "seat_id": "table_id1_seat_id_3",
                        "subtotal": 132
                    },
                    {
                        "before_rounded_data": {
                            "subtotal": 12
                        },
                        "order_items": [
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 12,
                                    "subtotal_before_discount": 12
                                },
                                "order_item_id": "table_id1_seat_id_1_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 12,
                                "subtotal_before_discount": 12
                            }
                        ],
                        "seat_id": "table_id1_seat_id_1",
                        "seats_to_share": [
                            "table_id1_seat_id_2",
                            "table_id1_seat_id_3"
                        ],
                        "shared_seat": true,
                        "subtotal": 12
                    }
                ],
                "table_id": "table_id1",
                "table_no": "7"
            }
        ]
    },
    {
        "before_rounded_data": {
            "subtotal": 70
        },
        "order_type": "DINE_IN",
        "status": "INPROCESS",
        "subtotal": 70,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 58
                        },
                        "order_items": [
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 36,
                                    "subtotal_before_discount": 36
                                },
                                "order_item_id": "table_id2_seat_id_2_item_id_2",
                                "paid_percentage": 0,
                                "quantity": 3,
                                "subtotal": 36,
                                "subtotal_before_discount": 36
                            },
                            {
                                "base_price": 11,
                                "before_rounded_data": {
                                    "subtotal": 22,
                                    "subtotal_before_discount": 22
                                },
                                "order_item_id": "table_id2_seat_id_2_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 22,
                                "subtotal_before_discount": 22
                            }
                        ],
                        "seat_id": "table_id2_seat_id_2",
                        "seat_name": "123",
                        "seat_no": 1,
                        "subtotal": 58
                    },
                    {
                        "before_rounded_data": {
                            "subtotal": 12
                        },
                        "order_items": [
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 12,
                                    "subtotal_before_discount": 12
                                },
                                "order_item_id": "table_id2_seat_id_1_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 12,
                                "subtotal_before_discount": 12
                            }
                        ],
                        "seat_id": "table_id2_seat_id_1",
                        "seat_name": "123",
                        "seat_no": 1,
                        "seats_to_share": [
                            "table_id2_seat_id_2",
                            "table_id2_seat_id_3"
                        ],
                        "shared_seat": true,
                        "subtotal": 12
                    }
                ],
                "table_id": "table_id2",
                "table_no": "7"
            }
        ]
    },
    {
        "before_rounded_data": {
            "subtotal": 70
        },
        "order_type": "DINE_IN",
        "status": "INPROCESS",
        "subtotal": 70,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 58
                        },
                        "order_items": [
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 36,
                                    "subtotal_before_discount": 36
                                },
                                "order_item_id": "table_id2_seat_id_3_item_id_2",
                                "paid_percentage": 0,
                                "quantity": 3,
                                "subtotal": 36,
                                "subtotal_before_discount": 36
                            },
                            {
                                "base_price": 11,
                                "before_rounded_data": {
                                    "subtotal": 22,
                                    "subtotal_before_discount": 22
                                },
                                "order_item_id": "table_id2_seat_id_3_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 22,
                                "subtotal_before_discount": 22
                            }
                        ],
                        "seat_id": "table_id2_seat_id_3",
                        "seat_name": "123",
                        "seat_no": 1,
                        "subtotal": 58
                    },
                    {
                        "before_rounded_data": {
                            "subtotal": 12
                        },
                        "order_items": [
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 12,
                                    "subtotal_before_discount": 12
                                },
                                "order_item_id": "table_id2_seat_id_1_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 12,
                                "subtotal_before_discount": 12
                            }
                        ],
                        "seat_id": "table_id2_seat_id_1",
                        "seat_name": "123",
                        "seat_no": 1,
                        "seats_to_share": [
                            "table_id2_seat_id_2",
                            "table_id2_seat_id_3"
                        ],
                        "shared_seat": true,
                        "subtotal": 12
                    }
                ],
                "table_id": "table_id2",
                "table_no": "7"
            }
        ]
    },
    {
        "before_rounded_data": {
            "subtotal": 69
        },
        "order_type": "DINE_IN",
        "status": "INPROCESS",
        "subtotal": 69,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 58
                        },
                        "order_items": [
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 36,
                                    "subtotal_before_discount": 36
                                },
                                "order_item_id": "table_id3_seat_id_2_item_id_2",
                                "paid_percentage": 0,
                                "quantity": 3,
                                "subtotal": 36,
                                "subtotal_before_discount": 36
                            },
                            {
                                "base_price": 11,
                                "before_rounded_data": {
                                    "subtotal": 22,
                                    "subtotal_before_discount": 22
                                },
                                "order_item_id": "table_id3_seat_id_2_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 22,
                                "subtotal_before_discount": 22
                            }
                        ],
                        "seat_id": "table_id3_seat_id_2",
                        "seat_name": "123",
                        "seat_no": 1,
                        "subtotal": 58
                    },
                    {
                        "before_rounded_data": {
                            "subtotal": 11
                        },
                        "order_items": [
                            {
                                "base_price": 11,
                                "before_rounded_data": {
                                    "subtotal": 11,
                                    "subtotal_before_discount": 11
                                },
                                "order_item_id": "table_id3_seat_id_1_item_id_1",
                                "paid_amount": 11,
                                "paid_percentage": 50,
                                "quantity": 2,
                                "subtotal": 11,
                                "subtotal_before_discount": 11
                            }
                        ],
                        "seat_id": "table_id3_seat_id_1",
                        "seat_name": "123",
                        "seat_no": 1,
                        "seats_to_share": [
                            "table_id3_seat_id_2"
                        ],
                        "shared_seat": true,
                        "subtotal": 11
                    }
                ],
                "table_id": "table_id3",
                "table_no": "7"
            }
        ]
    },
    {
        "before_rounded_data": {
            "subtotal": 58
        },
        "order_type": "DINE_IN",
        "status": "INPROCESS",
        "subtotal": 58,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 58
                        },
                        "order_items": [
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 36,
                                    "subtotal_before_discount": 36
                                },
                                "order_item_id": "table_id3_seat_id_3_item_id_2",
                                "paid_percentage": 0,
                                "quantity": 3,
                                "subtotal": 36,
                                "subtotal_before_discount": 36
                            },
                            {
                                "base_price": 11,
                                "before_rounded_data": {
                                    "subtotal": 22,
                                    "subtotal_before_discount": 22
                                },
                                "order_item_id": "table_id3_seat_id_3_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 22,
                                "subtotal_before_discount": 22
                            }
                        ],
                        "seat_id": "table_id3_seat_id_3",
                        "seat_name": "123",
                        "seat_no": 1,
                        "subtotal": 58
                    }
                ],
                "table_id": "table_id3",
                "table_no": "7"
            }
        ]
    }
]

var TestSplitterInput={
    "order_type" : "DINE_IN",
    "status" : "INPROCESS",
    "tables" : [
        {
            "table_id" : "table_id1",
            "table_no" : "7",
            "seats" : [
                {
                    "seat_id" : "table_id1_seat_id_1",
                    "order_items" : [
                        {
                            "order_item_id" : "table_id1_seat_id_1_item_id_1",
                            "base_price" : 12,
                            "quantity" : 2
                        }
                    ]
                },
                {
                    "seat_id" : "table_id1_seat_id_2",
                    "order_items" : [
                        {
                            "order_item_id" : "table_id1_seat_id_2_item_id_1",
                            "base_price" : 11,
                            "quantity" : 2
                        },
                        {
                            "order_item_id" : "table_id1_seat_id_2_item_id_2",
                            "base_price" : 22,
                            "quantity" : 5
                        }
                    ]
                }
            ]
        },
        {
            "table_id" : "table_id2",
            "table_no" : "7",
            "seats" : [
                {
                    "seat_id" : "table_id2_seat_id_2",
                    "seat_no" : 1,
                    "seat_name" : "123",
                    "order_items" : [
                        {
                            "order_item_id" : "table_id2_seat_id_2_item_id_1",
                            "base_price" : 11,
                            "quantity" : 2
                        },
                        {
                            "order_item_id" : "table_id2_seat_id_2_item_id_2",
                            "base_price" : 12,
                            "quantity" : 3
                        }
                    ]
                }
            ]
        }
    ]
};


var TestSPlitter_Evenly_Result=[
    {
        "before_rounded_data": {
            "subtotal": 71.33333333333334
        },
        "order_type": "DINE_IN",
        "status": "INPROCESS",
        "subtotal": 71.33,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 8
                        },
                        "order_items": [
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 8,
                                    "subtotal_before_discount": 8
                                },
                                "order_item_id": "table_id1_seat_id_1_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 8,
                                "subtotal_before_discount": 8
                            }
                        ],
                        "seat_id": "table_id1_seat_id_1",
                        "subtotal": 8
                    },
                    {
                        "before_rounded_data": {
                            "subtotal": 44
                        },
                        "order_items": [
                            {
                                "base_price": 11,
                                "before_rounded_data": {
                                    "subtotal": 7.333333333333334,
                                    "subtotal_before_discount": 7.333333333333334
                                },
                                "order_item_id": "table_id1_seat_id_2_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 7.33,
                                "subtotal_before_discount": 7.33
                            },
                            {
                                "base_price": 22,
                                "before_rounded_data": {
                                    "subtotal": 36.666666666666664,
                                    "subtotal_before_discount": 36.666666666666664
                                },
                                "order_item_id": "table_id1_seat_id_2_item_id_2",
                                "paid_percentage": 0,
                                "quantity": 5,
                                "subtotal": 36.67,
                                "subtotal_before_discount": 36.67
                            }
                        ],
                        "seat_id": "table_id1_seat_id_2",
                        "subtotal": 44
                    }
                ],
                "table_id": "table_id1",
                "table_no": "7"
            },
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 19.333333333333336
                        },
                        "order_items": [
                            {
                                "base_price": 11,
                                "before_rounded_data": {
                                    "subtotal": 7.333333333333334,
                                    "subtotal_before_discount": 7.333333333333334
                                },
                                "order_item_id": "table_id2_seat_id_2_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 7.33,
                                "subtotal_before_discount": 7.33
                            },
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 12,
                                    "subtotal_before_discount": 12
                                },
                                "order_item_id": "table_id2_seat_id_2_item_id_2",
                                "paid_percentage": 0,
                                "quantity": 3,
                                "subtotal": 12,
                                "subtotal_before_discount": 12
                            }
                        ],
                        "seat_id": "table_id2_seat_id_2",
                        "seat_name": "123",
                        "seat_no": 1,
                        "subtotal": 19.33
                    }
                ],
                "table_id": "table_id2",
                "table_no": "7"
            }
        ]
    }
]

var TestSplitter_byseat_Result=[
    {
        "before_rounded_data": {
            "subtotal": 24
        },
        "order_type": "DINE_IN",
        "status": "INPROCESS",
        "subtotal": 24,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 24
                        },
                        "order_items": [
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 24,
                                    "subtotal_before_discount": 24
                                },
                                "order_item_id": "table_id1_seat_id_1_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 24,
                                "subtotal_before_discount": 24
                            }
                        ],
                        "seat_id": "table_id1_seat_id_1",
                        "subtotal": 24
                    }
                ],
                "table_id": "table_id1",
                "table_no": "7"
            }
        ]
    },
    {
        "before_rounded_data": {
            "subtotal": 132
        },
        "order_type": "DINE_IN",
        "status": "INPROCESS",
        "subtotal": 132,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 132
                        },
                        "order_items": [
                            {
                                "base_price": 22,
                                "before_rounded_data": {
                                    "subtotal": 110,
                                    "subtotal_before_discount": 110
                                },
                                "order_item_id": "table_id1_seat_id_2_item_id_2",
                                "paid_percentage": 0,
                                "quantity": 5,
                                "subtotal": 110,
                                "subtotal_before_discount": 110
                            },
                            {
                                "base_price": 11,
                                "before_rounded_data": {
                                    "subtotal": 22,
                                    "subtotal_before_discount": 22
                                },
                                "order_item_id": "table_id1_seat_id_2_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 22,
                                "subtotal_before_discount": 22
                            }
                        ],
                        "seat_id": "table_id1_seat_id_2",
                        "subtotal": 132
                    }
                ],
                "table_id": "table_id1",
                "table_no": "7"
            }
        ]
    },
    {
        "before_rounded_data": {
            "subtotal": 58
        },
        "order_type": "DINE_IN",
        "status": "INPROCESS",
        "subtotal": 58,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 58
                        },
                        "order_items": [
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 36,
                                    "subtotal_before_discount": 36
                                },
                                "order_item_id": "table_id2_seat_id_2_item_id_2",
                                "paid_percentage": 0,
                                "quantity": 3,
                                "subtotal": 36,
                                "subtotal_before_discount": 36
                            },
                            {
                                "base_price": 11,
                                "before_rounded_data": {
                                    "subtotal": 22,
                                    "subtotal_before_discount": 22
                                },
                                "order_item_id": "table_id2_seat_id_2_item_id_1",
                                "paid_percentage": 0,
                                "quantity": 2,
                                "subtotal": 22,
                                "subtotal_before_discount": 22
                            }
                        ],
                        "seat_id": "table_id2_seat_id_2",
                        "seat_name": "123",
                        "seat_no": 1,
                        "subtotal": 58
                    }
                ],
                "table_id": "table_id2",
                "table_no": "7"
            }
        ]
    }
]

var TestSplitter_byseat_Result_with_paid_percentage=[
    {
        "before_rounded_data": {
            "subtotal": 12
        },
        "order_type": "DINE_IN",
        "status": "INPROCESS",
        "subtotal": 12,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 12
                        },
                        "order_items": [
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 12,
                                    "subtotal_before_discount": 12
                                },
                                "order_item_id": "table_id1_seat_id_1_item_id_1",
                                "paid_amount": 12,
                                "paid_percentage": 50,
                                "quantity": 2,
                                "subtotal": 12,
                                "subtotal_before_discount": 12
                            }
                        ],
                        "seat_id": "table_id1_seat_id_1",
                        "subtotal": 12
                    }
                ],
                "table_id": "table_id1",
                "table_no": "7"
            }
        ]
    },
    {
        "before_rounded_data": {
            "subtotal": 42.87530000000001
        },
        "order_type": "DINE_IN",
        "status": "INPROCESS",
        "subtotal": 42.88,
        "tables": [
            {
                "seats": [
                    {
                        "before_rounded_data": {
                            "subtotal": 42.87530000000001
                        },
                        "order_items": [
                            {
                                "base_price": 12,
                                "before_rounded_data": {
                                    "subtotal": 24.675300000000004,
                                    "subtotal_before_discount": 24.7
                                },
                                "discount": {
                                    "discount_id": "85963405-bbd6-49af-b922-2e0d539033bf",
                                    "discount_type": "PERCENTAGE",
                                    "discount_value": 0.1
                                },
                                "order_item_id": "table_id2_seat_id_2_item_id_2",
                                "paid_amount": 11.3,
                                "paid_percentage": 52,
                                "quantity": 3,
                                "subtotal": 24.68,
                                "subtotal_before_discount": 24.7
                            },
                            {
                                "base_price": 11,
                                "before_rounded_data": {
                                    "subtotal": 18.2,
                                    "subtotal_before_discount": 18.7
                                },
                                "discount": {
                                    "discount_id": "85963405-bbd6-49af-b922-2e0d539033bf",
                                    "discount_type": "AMOUNT",
                                    "discount_value": 0.5
                                },
                                "order_item_id": "table_id2_seat_id_2_item_id_1",
                                "paid_amount": 3.3,
                                "paid_percentage": 30,
                                "quantity": 2,
                                "subtotal": 18.2,
                                "subtotal_before_discount": 18.7
                            }
                        ],
                        "seat_id": "table_id2_seat_id_2",
                        "seat_name": "123",
                        "seat_no": 1,
                        "subtotal": 42.87
                    }
                ],
                "table_id": "table_id2",
                "table_no": "7"
            }
        ]
    }
]
module.exports = function() {
    return {
        TestPayment:TestPayment,
        TestPaymentForCalculator:TestPaymentForCalculator,
        TestPaymentForCalculator_Result:TestPaymentForCalculator_Result,
        TestSplitterInput:TestSplitterInput,
        TestSPlitter_Evenly_Result:TestSPlitter_Evenly_Result,
        TestSplitter_byseat_Result:TestSplitter_byseat_Result,
        TestSplitter_byseat_Result_with_paid_percentage:TestSplitter_byseat_Result_with_paid_percentage,
        TestSplitterWithSharedSeatInput:TestSplitterWithSharedSeatInput,
        TestSplitterWithSharedSeatInput_Result:TestSplitterWithSharedSeatInput_Result,
        TestPaymentForCalculator_preSubtotal:TestPaymentForCalculatorDiscountTotal_preSubtotal
    }
};