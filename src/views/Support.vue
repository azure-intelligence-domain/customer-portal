<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ProblemNotice from '../components/ProblemNotice.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { support } from '../lib/api.js'
import { address, money, when } from '../lib/format.js'

const router = useRouter()
const customers = ref([])
const recent = ref([])
const problem = ref(null)
const lookup = ref('')

Promise.all([support.customers(), support.orders({ limit: 10 })])
  .then(([c, o]) => {
    customers.value = c._embedded.customers
    recent.value = o._embedded.orders
  })
  .catch((e) => (problem.value = e))

function open() {
  const id = lookup.value.trim()
  if (/^[0-9]+$/.test(id)) router.push(`/support/orders/${id}`)
}
</script>

<template>
  <main class="page">
    <div class="page-head">
      <div class="stack"><p class="eyebrow">Customer service</p><h1>Customers and orders</h1></div>
      <form class="row" @submit.prevent="open">
        <label>Order number<input v-model="lookup" inputmode="numeric" placeholder="4711" /></label>
        <button class="primary" type="submit">Open</button>
      </form>
    </div>
    <ProblemNotice :problem="problem" />
    <section class="grid cols-2">
      <article v-for="c in customers" :key="c.customerId" class="card link-card" tabindex="0"
        @click="router.push(`/support/customers/${c.customerId}`)" @keydown.enter="router.push(`/support/customers/${c.customerId}`)">
        <header><h2>{{ c.name }}</h2><span class="mono small muted">{{ c.customerId }}</span></header>
        <p class="small muted">{{ c.industry }} · {{ address(c.shippingAddress) }}</p>
      </article>
    </section>
    <section class="card">
      <header><h2>Latest orders, all customers</h2></header>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Status</th><th>Payment</th><th class="right">Total</th></tr></thead>
          <tbody>
            <tr v-for="o in recent" :key="o.orderId" class="link" tabindex="0"
              @click="router.push(`/support/orders/${o.orderId}`)" @keydown.enter="router.push(`/support/orders/${o.orderId}`)">
              <td><strong class="num">{{ o.orderId }}</strong></td><td>{{ o.customerId }}</td>
              <td class="num small">{{ when(o.createdAt) }}</td><td><StatusBadge :status="o.status" /></td>
              <td><StatusBadge :status="o.paymentStatus" /></td><td class="right num">{{ money(o.totalAmount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.link-card { cursor: pointer; }
.link-card:hover { border-color: var(--accent); }
</style>
