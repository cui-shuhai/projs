import Vue from 'vue'
import VueRouter from 'vue-router'
import Main from './main.vue'
import Register from './register.vue'
import MerchantInfo from './merchant_info.vue'
// maybe resiter as a , b
import Map from './map.vue'
import MerchantItems from './merchant_items.vue'
import EachItem from './each_item.vue'
// import Cart from './cart.vue'
import OrderDetail from './order_detail.vue'
import Payment from './payment.vue'
import Stripe from './stripe.vue'
import Receipt from './receipt.vue'
import Order from './order.vue'
import checkIn from './check_in_receipt.vue'
import Expire from './expire_receipt.vue'
import SavedCard from './saved_card.vue'
Vue.use(VueRouter)
const routes = [
  {
    path: '/',
    component: Main
  },
  {
    path: '/register',
    component: Register
  },
  {
    path: '/merchant_info',
    component: MerchantInfo
  },
  {
    path: '/map',
    component: Map
  },
  {
    path: '/merchant_items',
    component: MerchantItems
  },
  {
    path: '/each_item',
    component: EachItem
  },
  /* {
    path: '/cart',
    component: Cart
  }, */
  {
    path: '/order_detail',
    component: OrderDetail
  },
  {
    path: '/payment',
    component: Payment
  },
  {
    path: '/stripe',
    component: Stripe
  },
  {
    path: '/receipt',
    component: Receipt
  },
  {
    path: '/order',
    component: Order
  },
  {
    path: '/check_in',
    component: checkIn
  },
  {
    path: '/expire_receipt',
    component: Expire
  },
  {
    path: '/saved',
    component: SavedCard
  }
]
export default new VueRouter({
  mode: 'abstract',
  routes: routes
})
