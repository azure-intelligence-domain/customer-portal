<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProblemNotice from '../components/ProblemNotice.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { webshop } from '../lib/api.js'
import { shoppingFor } from '../lib/customer.js'
import { STATUS, money, when } from '../lib/format.js'

const route = useRoute()
const router = useRouter()
const page = ref(null)
const problem = ref(null)
const customers = ref([])
const filters = ref({ customerId: route.query.customerId ?? shoppingFor.value, status: route.query.status ?? '', offset: 0 })
const LIMIT = 20

webshop.customers().then((c) => (customers.value = c._embedded.customers)).catch(() => {})

async function load() {
  problem.value = null
  try {
    page.value = await webshop.orders({ ...filters.value, limit: LIMIT })
  } catch (e) {
    problem.value = e
  }
}
watch(filters, load, { deep: true, immediate: true })
const statuses = ['placed', 'confirmed', 'onHold', 'readyForShipment', 'shipped', 'delivered', 'completed', 'cancelled', 'rejected']
</script>

<template>
  <main class="page">
    <div class="page-head">
      <div class="stack"><p class="eyebrow">Webshop</p><h1>Orders</h1></div>
      <div class="row">
        <label>Customer
          <select v-model="filters.customerId" @change="filters.offset = 0">
            <option value="">All customers</option>
            <option v-for="c in customers" :key="c.customerId" :value="c.customerId">{{ c.name }}</option>
          </select>
        </label>
        <label>Status
          <select v-model="filters.status" @change="filters.offset = 0">
            <option value="">Any status</option>
            <option v-for="s in statuses" :key="s" :value="s">{{ STATUS[s] }}</option>
          </select>
        </label>
      </div>
    </div>
    <ProblemNotice :problem="problem" />
    <section class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Placed</th><th>Status</th><th>Payment</th><th class="right">Total</th><th>Tracking</th></tr>
          </thead>
          <tbody>
            <tr v-for="o in page?._embedded.orders ?? []" :key="o.orderId" class="link" tabindex="0"
              @click="router.push(`/orders/${o.orderId}`)" @keydown.enter="router.push(`/orders/${o.orderId}`)">
              <td><strong class="num">{{ o.orderId }}</strong> <span class="small muted">{{ o.channel }}</span></td>
              <td>{{ o.customerId }}</td>
              <td class="num small">{{ when(o.createdAt) }}</td>
              <td><StatusBadge :status="o.status" /></td>
              <td><StatusBadge :status="o.paymentStatus" /></td>
              <td class="right num">{{ money(o.totalAmount) }}</td>
              <td class="mono small">{{ o.trackingNumber }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="page && !page.totalCount" class="empty">No orders yet. <RouterLink to="/shop">Place one in the shop.</RouterLink></p>
      <div v-if="page && page.totalCount > LIMIT" class="row pager">
        <button :disabled="filters.offset === 0" @click="filters.offset -= LIMIT">Newer</button>
        <span class="small muted num">{{ filters.offset + 1 }}–{{ Math.min(filters.offset + LIMIT, page.totalCount) }} of {{ page.totalCount }}</span>
        <button :disabled="filters.offset + LIMIT >= page.totalCount" @click="filters.offset += LIMIT">Older</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pager { justify-content: center; margin-top: 12px; }
</style>
