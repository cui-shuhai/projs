import Vue from 'vue'
import Router from 'vue-router'
import Lead from '@/components/lead.vue'
import MainItem from '@/components/main_item.vue'
import Cart from '@/components/cart.vue'
import Payment from '@/components/payment.vue'
import Stripe from '@/components/stripe.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Lead',
      component: Lead
    },
    {
      path: '/main_item',
      name: 'MainItem',
      component: MainItem
    },
    {
      path: '/cart',
      name: 'Cart',
      component: Cart
    },
    {
      path: '/payment',
      name: 'Payment',
      component: Payment
    },
    {
      path: '/stripe',
      name: 'Stripe',
      component: Stripe
    }
  ]
})
