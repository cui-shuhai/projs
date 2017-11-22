/**
 * Created by richardmaglaya on 15-05-29.
 */
'use strict';


//-- FBE-963
var OrderForGetBillV2 =
{
    "_id": "04176817-5413-4101-8d0d-96a20191c0a8",
    "tableId": "0e17557d-9e29-4ba8-bec1-c0789dd7eec9",
    "user": {
        "user_id": "00079e03-1535-407c-955f-af7ef04b52f2",
        "user_name": "User1",
        "avatar_path": ""
    },
    "restaurantId": "620049b2-8c83-44a9-9751-15c816cd3a72",
    //-- This restaurant object inside order is described in FBE-994
    "restaurant": {
        "restaurant_id": "620049b2-8c83-44a9-9751-15c816cd3a72",
        "restaurant_logo": {
            "filename": "",
            "path": ""
        },
        "restaurant_name": "long_name_36519",
        "restaurant_rating": 3,
        "discounts": [
            {
                "id": "00f8a7b0-e675-46cf-9283-005e25d8c3ee",
                "type": "% Off",
                "value": 5,
                "first_time_use": true
            }
        ],
        "applicable_taxes": [
            {
                "name": "GST",
                "rate": 5,
                "type": "T1",
                "id": "4f1e809a-8d68-40b6-af8e-ac2d495b3226"
            },
            {
                "name": "PST",
                "rate": 7,
                "type": "T2_1",
                "id": "efd73cdd-3597-4b2a-8c1e-f8533beb9d30"
            }
        ],
        "is_online_payment": true,
        "currency": "CAN"
    },
    "status": "SUBMITTED",
    "lastmodified": "2015-04-07T18:47:18.000Z",
    "isServer": "FALSE",
    "v": 1,
    "createDate": "2015-04-07T18:46:46.000Z",
    "lastUpdateTime": "2015-05-21T07:09:11.000Z",
    "subTotal": {
        "amount": 60,
        "currencyCode": null
    },
    "total": {
        "amount": 60,
        "currencyCode": null
    },
    //-- There reason for customer duplicates is because V2 is using user_id attribute
    "customers": [
        {
            "userId": "0182a2ce-23ea-467a-b893-379400d13004",
            "userName": "test001",
            "avatarPath": ""
        },
        {
            "userId": "016860e2-9480-4f55-bbeb-187d7efa2dac",
            "userName": "Test 20150217-131843",
            "avatarPath": null
        },
        {
            "user_id": "0182a2ce-23ea-467a-b893-379400d13004",
            "user_name": "test001",
            "avatar_path": ""
        },
        {
            "user_id": "016860e2-9480-4f55-bbeb-187d7efa2dac",
            "user_name": "Test 20150217-131843",
            "avatar_path": ""
        }
    ],
    "batchNo": 3,
    "submitTime": "2015-04-07T18:47:18.000Z",
    "update_time": "2015-05-29T12:08:29.000Z",
    "create_time": "2015-05-29T12:08:29.000Z",
    "billStatus": {
        "userId": "00079e03-1535-407c-955f-af7ef04b52f2",
        "status": "LOCKED",
        "lock_time": "2015-05-29T12:06:35.000Z",
        "lock_duration_mins": 30
    },
    //-- This is for V2
    "bill_status": {
        "user_id": "00079e03-1535-407c-955f-af7ef04b52f2",
        "status": "LOCKED",
        "lock_time": "2015-05-29T12:06:35.000Z",
        "lock_duration_mins": 30
    },
    //-- Everything from here downward are V2 response
    "transaction_number": "04176817-5413-4101-8d0d-96a20191c0a8",
    "table_id": "0e17557d-9e29-4ba8-bec1-c0789dd7eec9",
    "batch_no": 3,
    "is_server": "FALSE",
    "gold_and_blue_dollars": {
        "blue_dollar_discount": 0,
        "blue_dollar_amount_to_buy": 0,
        "total_to_pay_with_blue_gold_dollars": 0,
        "my_blue_dollars_self": 0
    },
    "payment": {
        "online_transaction_charge_rate": 0,
        "fandine_commission_rate_first_time": 0.05,
        "fandine_commission_rate_not_first_time": 0.01,
        "sub_total_before_first_visit_savings": 3756,
        "first_visit_customer_savings": 0,
        "total_discounts": 0,
        "sub_total_after_discount": 3756,
        "taxes": [],
        "total_tax": 450.72,
        "tip": 450.71999999999997,
        "grand_total_to_pay": 4657.4400000000005,
        "blue_dollar_amount_paid": 0,
        "gold_dollar_amount_paid": 0,
        "amount_to_buy_blue_dollar": 0,
        "total_blue_dollar_bought": 0,
        "total_amount_to_pay_with_bd_and_gd": 0,
        "blue_dollar_bought_from_consumer": 0,
        "blue_dollar_bought_from_fandine": 0,
        "blue_dollar_bought_from_restaurant": 0,
        "amount_to_pay_restaurant_offline": 0,
        "amount_to_pay_fandine_transaction": 0,
        "online_payment_amount": 0,
        "total_consumer_gd_to_restaurant_gd": 0,
        "total_consumer_bd_to_restaurant_bd": 0,
        "credit_service_charge": 0,
        "split_payment_going_to_restaurant": 0,
        "split_payment_going_to_fandine": 0,
        "blue_dollar_issued_to_fandine": 0,
        "blue_dollar_paid_to_inviter": 0,
        "ap_to_restaurant_future_settlement": 0
    },
    //-- This attribute explains the reason for the calculation
    //-- This is intended for Support or QA
    "remarks": [
        {
            "menu_item_id": "ad196b0b-257e-46d9-9e2d-75ede98d3177",
            "message": "ORDERITEM_MENU_ITEM_ID_HAS_NO_CATEGORY"
        },
        {
            "child_item_menu_item_id": "childItemId11",
            "message": "ORDERITEM_CHILDITEM_MENU_ITEM_ID_HAS_NO_CATEGORY"
        },
        {
            "menu_item_id": "0604f4f6-a1a9-4f4f-9260-756bb7776fc5",
            "message": "ORDERITEM_MENU_ITEM_ID_HAS_NO_CATEGORY"
        },
        {
            "menu_item_id": "10c87580-00c2-44d8-9f4a-14e96ddb430e",
            "message": "ORDERITEM_MENU_ITEM_ID_HAS_NO_CATEGORY"
        }
    ],
    "order_items": [
        {
            "item_id": "ad196b0b-257e-46d9-9e2d-75ede98d3177",
            "item_name": "Dish 1",
            "type": "dish",
            "quantity": 1,
            "price": {
                "amount": 10,
                "currency_code": "CAD",
                "exponent": 0
            },
            "seat": 8,
            "order_item_id": "7bc19384-bd55-4bdc-88ea-88248d9af869",
            "order_item_user_id": "e1e7b98a-9811-4f04-96ed-59618e7e2597",
            "children_items": [
                {
                    "child_item_id": "childItemId11",
                    "child_item_name": "childItemName11",
                    "quantity": 3,
                    "price_diff": {
                        "amount": 1232,
                        "currency_code": "CAD",
                        "exponent": 1
                    }
                }
            ]
        },
        {
            "item_id": "0604f4f6-a1a9-4f4f-9260-756bb7776fc5",
            "item_name": "Dish 2",
            "type": "dish",
            "quantity": 1,
            "price": {
                "amount": 20,
                "currency_code": "CAD",
                "exponent": 0
            },
            "seat": 3,
            "order_item_id": "eccc1068-470c-48a1-9107-b6a24c651f4b",
            "order_item_user_id": "590267d8-8045-4ea3-9c1c-334160893d9c",
            "children_items": [
                {
                    "child_item_id": "childItemId11",
                    "child_item_name": "childItemName11",
                    "quantity": 3,
                    "price_diff": {
                        "amount": 1232,
                        "currency_code": "CAD",
                        "exponent": 1
                    }
                }
            ]
        },
        {
            "item_id": "10c87580-00c2-44d8-9f4a-14e96ddb430e",
            "item_name": "Dish 3",
            "type": "dish",
            "quantity": 1,
            "price": {
                "amount": 30,
                "currency_code": "CAD",
                "exponent": 0
            },
            "seat": 3,
            "order_item_id": "fdasgeqfefdafdg3q4t5gr",
            "order_item_user_id": "acb0f2dc-078d-4591-b7ec-d308a8722ef0",
            "children_items": [
                {
                    "child_item_id": "childItemId11",
                    "child_item_name": "childItemName11",
                    "quantity": 3,
                    "price_diff": {
                        "amount": 1232,
                        "currency_code": "CAD",
                        "exponent": 1
                    }
                }
            ]
        }
    ],
    "total_taxes": [
        {
            "name": "GST",
            "amount": 18.50
        },
        {
            "name": "PST",
            "amount": 24.50
        }
    ]
};


var AddOrderItemsPerUnitPrice_regular = {
    "order_id": "f492faf2-0577-4423-aaa1-bf9f00fcd23c",
    "user_id":  "0aba8c91-4d4d-4b1f-87e0-455437384ae0",
    "restaurant_id": "f492faf2-0577-4423-aaa1-bf9f00fcd23c",
    "order_items": [
        {
            "is_unit_mandatory": true,
            "order_item_user_id": "b386d27c-8af6-451d-baaa-5d1db122fc86",
            "order_item_user_name": "Ethan Hawk",
            "order_item_user_avatar_path": "https://fandinecommentsdev.s3-us-west-2.amazonaws.com/FF3D64AC-52A6-4080-8994-9172746D9B84-23232-00000D30B5903116.jpeg",
            "menu_item_id": "6e9844d7-316e-460a-9212-4973832894b6",
            "menu_item_name": "Spring Roll",
            "menu_item_photo": "https://fandine-testdev-image-repo.s3.amazonaws.com/fc668adc-af44-44d4-be91-4b268ed6e3f0-SpringRoll-large.jpg",
            "seat_number": 0,
            "quantity": 1,
            "quantity_in_unit": 20,
            "unit_of_measurement": "grams",
            "per_unit_regular_price": 1,
            "calculated_price": 20
        }
    ]
};


var AddOrderItemsPerUnitPrice_personalized = {
    "is_unit_mandatory": true,
    "order_item_user_id": "b386d27c-8af6-451d-baaa-5d1db122fc86",
    "order_item_user_name": "Ethan Hawk",
    "order_item_user_avatar_path": "https://fandinecommentsdev.s3-us-west-2.amazonaws.com/FF3D64AC-52A6-4080-8994-9172746D9B84-23232-00000D30B5903116.jpeg",
    "menu_item_id": "6e9844d7-316e-460a-9212-4973832894b6",
    "menu_item_name": "Spring Roll",
    "menu_item_photo": "https://fandine-testdev-image-repo.s3.amazonaws.com/fc668adc-af44-44d4-be91-4b268ed6e3f0-SpringRoll-large.jpg",
    "seat_number": 0,
    "quantity": 1,
    "quantity_in_unit": 20,
    "unit_of_measurement": "grams",
    "per_unit_personalized_price": .9,
    "calculated_price": 18
};


var AddOrderItemsPerUnitPrice_specific = {
    "is_unit_mandatory": true,
    "order_item_user_id": "b386d27c-8af6-451d-baaa-5d1db122fc86",
    "order_item_user_name": "Ethan Hawk",
    "order_item_user_avatar_path": "https://fandinecommentsdev.s3-us-west-2.amazonaws.com/FF3D64AC-52A6-4080-8994-9172746D9B84-23232-00000D30B5903116.jpeg",
    "menu_item_id": "6e9844d7-316e-460a-9212-4973832894b6",
    "menu_item_name": "Spring Roll",
    "menu_item_photo": "https://fandine-testdev-image-repo.s3.amazonaws.com/fc668adc-af44-44d4-be91-4b268ed6e3f0-SpringRoll-large.jpg",
    "seat_number": 0,
    "quantity": 1,
    "quantity_in_unit": 20,
    "unit_of_measurement": "grams",
    "per_unit_customer_specific_price": .8,
    "calculated_price": 16
};


var AddOrderItemsFixPrice_regular = {
    "restaurant_id": "f492faf2-0577-4423-aaa1-bf9f00fcd23c",
    "order_items": [
        {
            "is_unit_mandatory": true,
            "order_item_user_id": "b386d27c-8af6-451d-baaa-5d1db122fc86",
            "order_item_user_name": "Ethan Hawk",
            "order_item_user_avatar_path": "https://fandinecommentsdev.s3-us-west-2.amazonaws.com/FF3D64AC-52A6-4080-8994-9172746D9B84-23232-00000D30B5903116.jpeg",
            "menu_item_id": "6e9844d7-316e-460a-9212-4973832894b6",
            "menu_item_name": "Spring Roll",
            "menu_item_photo": "https://fandine-testdev-image-repo.s3.amazonaws.com/fc668adc-af44-44d4-be91-4b268ed6e3f0-SpringRoll-large.jpg",
            "seat_number": 0,
            "quantity": 1,
            "quantity_in_unit": 20,
            "unit_of_measurement": "grams",
            "per_unit_regular_price": 1,
            "calculated_price": 20
        }
    ]
};


module.exports = function() {
    return {
        OrderForGetBillV2: OrderForGetBillV2,
        AddOrderItemsPerUnitPrice_regular: AddOrderItemsPerUnitPrice_regular,
        AddOrderItemsPerUnitPrice_personalized: AddOrderItemsPerUnitPrice_personalized,
        AddOrderItemsPerUnitPrice_specific: AddOrderItemsPerUnitPrice_specific,
        AddOrderItemsFixPrice: AddOrderItemsFixPrice_regular
    }
};