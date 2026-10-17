<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ProblemNotice from '../components/ProblemNotice.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { partner } from '../lib/api.js'
import { address, day, when } from '../lib/format.js'

// The 3PL partner's screen: in the demo, staff play speedy-3pl. Its work list is what is booked;
// what it picked up is out for delivery until it reports the delivery.
const booked = ref([])
const onTheWay = ref([])
const problem = ref(null)
const busy = ref('')
const signedBy = ref({})

async function load() {
  try {
    const [b, p] = await Promise.all([partner.bookings('booked'), partner.bookings('pickedUp')])
    booked.value = b._embedded.shipmentBookings
    const shipments = await Promise.all(p._embedded.shipmentBookings.slice(0, 15).map(async (s) => ({ ...s, shipment: await partner.shipment(s.shipmentId).catch(() => null) })))
    onTheWay.value = shipments.filter((s) => s.shipment?.status === 'dispatched')
    problem.value = null
  } catch (e) {
    problem.value = e
  }
}
async function report(booking, action) {
  busy.value = booking.shipmentId
  try {
    await action()
    await load()
  } catch (e) {
    problem.value = e
  } finally {
    busy.value = ''
  }
}
let timer
onMounted(() => {
  load()
  timer = setInterval(() => document.visibilityState === 'visible' && load(), 5000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <main class="page">
    <div class="page-head">
      <div class="stack">
        <p class="eyebrow">3PL partner · speedy-3pl</p>
        <h1>Bookings and deliveries</h1>
        <p class="small muted">You play the 3PL partner: report what you picked up and what you delivered. Each notice is a business fact (ShipmentDispatched, ShipmentDelivered) the order domain turns into OrderShipped and OrderDelivered.</p>
      </div>
      <button @click="load">Refresh</button>
    </div>
    <ProblemNotice :problem="problem" />
    <section class="card">
      <header><h2>To pick up</h2><span class="small muted">{{ booked.length }} booked</span></header>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Shipment</th><th>Order</th><th>Deliver to</th><th>Items</th><th>Wanted by</th><th>Booked</th><th></th></tr></thead>
          <tbody>
            <tr v-for="b in booked" :key="b.shipmentId">
              <td class="mono">{{ b.shipmentId }}</td>
              <td><RouterLink :to="`/support/orders/${b.orderId}`" class="num">{{ b.orderId }}</RouterLink> <span class="small muted">{{ b.customerId }}</span></td>
              <td class="small">{{ address(b.deliveryAddress) }}</td>
              <td class="small">{{ b.orderLines.map((l) => `${l.quantity} × ${l.productId}`).join(', ') }}</td>
              <td class="small">{{ day(b.requestedDeliveryDate) }}</td>
              <td class="num small">{{ when(b.bookedAt) }}</td>
              <td class="right"><button class="primary" :disabled="busy === b.shipmentId" @click="report(b, () => partner.pickUp(b))">Picked up</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!booked.length" class="empty">Nothing to pick up. Place an order in the <RouterLink to="/shop">shop</RouterLink>: it is booked here once SAP and the warehouse are done.</p>
    </section>
    <section class="card">
      <header><h2>Out for delivery</h2><span class="small muted">{{ onTheWay.length }} on the way</span></header>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Tracking</th><th>Order</th><th>Deliver to</th><th>Picked up</th><th>Signed by</th><th></th></tr></thead>
          <tbody>
            <tr v-for="s in onTheWay" :key="s.shipmentId">
              <td class="mono">{{ s.trackingNumber }} <StatusBadge :status="s.shipment.status" /></td>
              <td><RouterLink :to="`/support/orders/${s.orderId}`" class="num">{{ s.orderId }}</RouterLink></td>
              <td class="small">{{ address(s.deliveryAddress) }}</td>
              <td class="num small">{{ when(s.shipment.dispatchedAt) }}</td>
              <td><input v-model="signedBy[s.shipmentId]" maxlength="80" placeholder="J. Peeters" :aria-label="`Signed by, ${s.shipmentId}`" /></td>
              <td class="right"><button class="primary" :disabled="busy === s.shipmentId" @click="report(s, () => partner.deliver(s, signedBy[s.shipmentId]))">Delivered</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!onTheWay.length" class="empty">Nothing out for delivery.</p>
    </section>
  </main>
</template>
