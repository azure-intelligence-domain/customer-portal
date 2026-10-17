<script setup>
import { ref } from 'vue'
import AddressForm from '../components/AddressForm.vue'
import AskDialog from '../components/AskDialog.vue'
import FactTimeline from '../components/FactTimeline.vue'
import InvoiceList from '../components/InvoiceList.vue'
import OrderLines from '../components/OrderLines.vue'
import ProblemNotice from '../components/ProblemNotice.vue'
import ProgressTrack from '../components/ProgressTrack.vue'
import ShipmentCard from '../components/ShipmentCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { journeyOf, webshop } from '../lib/api.js'
import { address, day, settled, when } from '../lib/format.js'
import { useOrder } from '../lib/useOrder.js'

const props = defineProps({ orderId: { type: String, required: true } })
const { order, problem, busy, refresh, act } = useOrder(() => webshop.order(props.orderId))
const asking = ref('')
const reason = ref('')
const newAddress = ref({ street: '', postalCode: '', city: '', countryCode: '' })
const paid = ref(null)

function ask(what) {
  if (what === 'address') newAddress.value = { ...order.value.deliveryAddress }
  reason.value = ''
  asking.value = what
}
async function cancel() {
  asking.value = ''
  await act(() => webshop.cancel(props.orderId, reason.value || undefined))
}
async function changeAddress() {
  asking.value = ''
  await act(() => webshop.changeAddress(props.orderId, newAddress.value))
}
async function pay(invoice) {
  paid.value = await act(() => webshop.pay(props.orderId, invoice.invoiceNumber))
  await refresh(true)
}
</script>

<template>
  <main class="page">
    <ProblemNotice :problem="problem" />
    <template v-if="order">
      <div class="page-head">
        <div class="stack">
          <p class="eyebrow">Webshop · order of {{ order.customerId }}</p>
          <h1>Order <span class="num">{{ order.orderId }}</span></h1>
          <div class="row"><StatusBadge :status="order.status" /><StatusBadge :status="order.paymentStatus" />
            <span class="small muted">Placed {{ when(order.createdAt) }} · journey <span class="mono">{{ journeyOf(order.orderId) }}</span></span>
          </div>
        </div>
        <div class="row">
          <button v-if="order._links.changeDeliveryAddress" :disabled="busy" @click="ask('address')">Change address</button>
          <button v-if="order._links.cancel" class="danger" :disabled="busy" @click="ask('cancel')">Cancel order</button>
          <RouterLink class="button" :to="`/support/orders/${order.orderId}`">Customer service view</RouterLink>
        </div>
      </div>

      <section class="card">
        <ProgressTrack :progress="order.progress" :status="order.status" />
        <p v-if="order.status === 'cancelled'" class="notice small">Cancelled: {{ order.cancellationReason }}. SAP, the warehouse and the 3PL undo their part by events; watch the timeline.</p>
        <p v-else-if="order.status === 'rejected'" class="notice error small">SAP refused this order (credit check).</p>
        <p v-else-if="order.status === 'readyForShipment'" class="notice small">Waiting for the 3PL partner to pick it up (the <RouterLink to="/partner">3PL partner</RouterLink> screen reports it).</p>
        <p v-else-if="!settled(order.status)" class="small muted live">Live: this page follows the order as SAP, the warehouse and the 3PL report back.</p>
      </section>
      <div v-if="paid" class="notice ok">Payment <span class="mono">{{ paid.paymentId }}</span> received: SAP publishes PaymentReceived, the order becomes paid.</div>

      <div class="split">
        <div class="stack">
          <section class="card"><h2>What was ordered</h2><OrderLines :lines="order.orderLines" :total="order.totalAmount" /></section>
          <section class="card"><header><h2>Timeline</h2><span class="small muted">every domain's facts, newest first</span></header>
            <FactTimeline :items="order.timeline" /></section>
        </div>
        <div class="stack">
          <section class="card">
            <h2>Delivery</h2>
            <dl class="kv small">
              <dt>Address</dt><dd>{{ address(order.deliveryAddress) }}</dd>
              <template v-if="order.requestedDeliveryDate"><dt>Requested</dt><dd>{{ day(order.requestedDeliveryDate) }}</dd></template>
            </dl>
          </section>
          <section class="card"><h2>Shipment</h2><ShipmentCard :shipment="order.shipment" /></section>
          <section class="card"><h2>Invoices</h2>
            <InvoiceList :invoices="order.invoices" :can-pay="!!order._links.pay" :busy="busy" @pay="pay" /></section>
        </div>
      </div>
    </template>
    <p v-else-if="!problem" class="empty">Loading order {{ orderId }}…</p>

    <AskDialog :open="asking === 'cancel'" title="Cancel this order?" action="Cancel order" danger @confirm="cancel" @close="asking = ''">
      <p class="small muted">SAP credits the invoice, the warehouse releases the stock, the 3PL cancels the booking.</p>
      <label>Reason (optional)<input v-model="reason" maxlength="200" placeholder="Ordered twice by mistake" /></label>
    </AskDialog>
    <AskDialog :open="asking === 'address'" title="Deliver somewhere else" action="Change address" @confirm="changeAddress" @close="asking = ''">
      <AddressForm v-model="newAddress" />
    </AskDialog>
  </main>
</template>

<style scoped>
.live { margin: 12px 0 0; }
.live::before { content: '● '; color: var(--ok); }
section .notice { margin: 14px 0 0; }
</style>
