/**
 * Created by Richard.Maglaya on 2015/9/9.
 */
'use strict';


var OrderV1ToV2 = {
    orderItemId:            ['string', 'order_item_id',                 'order_item_id'],
    orderItemUserId:        ['string', 'order_item_user_id',            'order_item_user_id'],
    orderItemUserName:      ['string', 'order_item_user_name',          'order_item_user_name'],
    orderItemUserAvatarPath:['string', 'order_item_user_avatar_path',   'order_item_user_avatar_path'],
    itemId: 'menu_item_id',
    itemName: 'menu_item_name',
    _menu_item_photo: 'menu_item_photo',
    _menu_item_average_rating: 'menu_item_average_rating',
    type: 'menu_item_type',
    quantity: 'quantity',
    seat: 'seat_number',
    category: 'category',
    price: {
        amount: 'amount',
        currencyCode: 'currency_code'
    },
    submission_time: 'submission_time',
    order_item_batch_no: 'order_item_batch_number',
    _chit_printed: 'chit_printed'
};


module.exports = function () {
        return {
            orderV1ToV2: OrderV1ToV2
    }
};