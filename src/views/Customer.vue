<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ProblemNotice from '../components/ProblemNotice.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { support } from '../lib/api.js'
import { address, label, money, when } from '../lib/format.js'

const props = defineProps({ customerId: { type: String, required: true } })
const router = useRouter()
const customer = ref(null)
const problem = ref(null)
support.customer(props.customerId).then((c) => (customer.value = c)).catch((e) => (problem.value = e))
</script>

<template>
  <main class="page">
    <ProblemNotice :problem="problem" />
    <template v-if="customer">
      <div class="page-head">
        <div class="stack">
          <p class="eyebrow"><RouterLink to="/support">Customer service</RouterLink> · customer</p>
          <h1>{{ customer.name }}</h1>
          <p class="small muted">{{ customer.industry }} · {{ address(customer.shippingAddress) }}</p>
        </div>
        <RouterLink class="button" :to="`/orders?customerId=${customer.customerId}`">All orders</RouterLink>
      </div>
      <section class="grid cols-3">
        <div class="card stat"><p class="eyebrow">Orders</p><p class="big num">{{ customer.orderCount }}</p></div>
        <div class="card stat"><p class="eyebrow">Still owed</p><p class="big num">{{ money(customer.openAmount) }}</p></div>
        <div class="card stat"><p class="eyebrow">By status</p>
          <div class="row"><span v-for="(n, s) in customer.ordersByStatus" :key="s" class="badge">{{ label(s) }} · {{ n }}</span></div>
        </div>
      </section>
      <section class="card">
        <header><h2>Newest orders</h2></header>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Placed</th><th>Status</th><th>Payment</th><th class="right">Total</th><th>Tracking</th></tr></thead>
            <tbody>
              <tr v-for="o in customer.recentOrders" :key="o.orderId" class="link" tabindex="0"
                @click="router.push(`/support/orders/${o.orderId}`)" @keydown.enter="router.push(`/support/orders/${o.orderId}`)">
                <td><strong class="num">{{ o.orderId }}</strong></td><td class="num small">{{ when(o.createdAt) }}</td>
                <td><StatusBadge :status="o.status" /></td><td><StatusBadge :status="o.paymentStatus" /></td>
                <td class="right num">{{ money(o.totalAmount) }}</td><td class="mono small">{{ o.trackingNumber }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!customer.recentOrders.length" class="empty">No orders yet.</p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.stat { display: grid; gap: 6px; align-content: start; }
.big { font-size: 1.6rem; font-weight: 700; margin: 0; }
</style>
