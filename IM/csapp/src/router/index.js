import Vue from 'vue'
import Router from 'vue-router'
import Lead from '@/components/lead.vue'
import MainItem from '@/components/main_item.vue'
import HelloWorld from '@/components/HelloWorld'

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
      path: '/helloWorld',
      name: 'HelloWorld',
      component: HelloWorld
    }
  ]
})
