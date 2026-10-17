import { createRouter, createWebHashHistory } from 'vue-router'
import { session } from './lib/auth.js'

// Hash routes: the same build works on any static host, at any base path.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/shop' },
    { path: '/sign-in', component: () => import('./views/SignIn.vue'), meta: { public: true } },
    { path: '/shop', component: () => import('./views/Shop.vue') },
    { path: '/orders', component: () => import('./views/Orders.vue') },
    { path: '/orders/:orderId', component: () => import('./views/OrderPage.vue'), props: true },
    { path: '/support', component: () => import('./views/Support.vue') },
    { path: '/support/customers/:customerId', component: () => import('./views/Customer.vue'), props: true },
    { path: '/support/orders/:orderId', component: () => import('./views/SupportOrder.vue'), props: true },
    { path: '/partner', component: () => import('./views/Partner.vue') },
    { path: '/:rest(.*)', redirect: '/shop' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  if (!to.meta.public && !session.user) return { path: '/sign-in', query: { next: to.fullPath } }
})
