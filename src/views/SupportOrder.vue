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
import { journeyOf, support } from '../lib/api.js'
import { address, day, money, when } from '../lib/format.js'
import { useOrder } from '../lib/useOrder.js'

const props = defineProps({ orderId: { type: String, required: true } })
const { order, problem, busy, act } = useOrder(() => support.order(props.orderId))
const asking = ref('')
const reason = ref('')
const date = ref('')
const newAddress = ref({ street: '', postalCode: '', city: '', countryCode: '' })
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

function ask(what) {
  reason.value = ''
  date.value = order.value.requestedDeliveryDate ?? tomorrow
  newAddress.value = { ...order.value.deliveryAddress }
  asking.value = what
}
const run = (action) => {
  asking.value = ''
  return act(action)
}
const REFS = [['erpOrderNumber', 'SAP sales order'], ['invoiceNumber', 'SAP invoice'], ['creditNoteNumber', 'SAP credit note'],
  ['reservationId', 'WMS reservation'], ['warehouseId', 'Warehouse'], ['shipmentId', '3PL shipment'], ['trackingNumber', 'Tracking'], ['partnerId', '3PL partner']]
</script>

<template>
  <main class="page">
    <ProblemNotice :problem="problem" />
    <template v-if="order">
      <div class="page-head">
        <div class="stack">
          <p class="eyebrow"><RouterLink to="/support">Customer service</RouterLink> ·
            <RouterLink :to="`/support/customers/${order.customerId}`">{{ order.customerId }}</RouterLink></p>
          <h1>Order <span class="num">{{ order.orderId }}</span></h1>
          <div class="row"><StatusBadge :status="order.status" /><StatusBadge :status="order.paymentStatus" />
            <span class="small muted">{{ order.channel }} · placed {{ when(order.createdAt) }} · journey <span class="mono">{{ journeyOf(order.orderId) }}</span></span>
          </div>
        </div>
        <div class="row">
          <button v-if="order._links.putOnHold" :disabled="busy" @click="ask('hold')">Put on hold</button>
          <button v-if="order._links.release" class="primary" :disabled="busy" @click="run(() => support.release(order.orderId))">Release</button>
          <button v-if="order._links.reschedule" :disabled="busy" @click="ask('date')">Reschedule</button>
          <button v-if="order._links.changeDeliveryAddress" :disabled="busy" @click="ask('address')">Change address</button>
          <button v-if="order._links.cancel" class="danger" :disabled="busy" @click="ask('cancel')">Cancel</button>
        </div>
      </div>
      <section class="card"><ProgressTrack :progress="order.progress" :status="order.status" />
        <p v-if="order.holdReason" class="notice small">On hold: {{ order.holdReason }}</p>
        <p v-if="order.cancellationReason" class="notice small">Cancelled: {{ order.cancellationReason }}</p>
      </section>

      <div class="split">
        <div class="stack">
          <section class="card"><h2>Lines</h2><OrderLines :lines="order.orderLines" :total="order.totalAmount" /></section>
          <section class="card"><header><h2>Timeline</h2><span class="small muted">every domain's facts, newest first</span></header>
            <FactTimeline :items="order.timeline" /></section>
        </div>
        <div class="stack">
          <section class="card">
            <h2>Across the systems</h2>
            <dl class="kv small">
              <template v-for="[key, name] in REFS" :key="key">
                <template v-if="order.references?.[key]"><dt>{{ name }}</dt><dd class="mono">{{ order.references[key] }}</dd></template>
              </template>
            </dl>
            <p v-if="!Object.keys(order.references ?? {}).length" class="small muted">No other system has this order yet.</p>
          </section>
          <section class="card domain finance">
            <h2>Finance · SAP</h2>
            <dl v-if="order.salesOrder" class="kv small">
              <dt>Sales order</dt><dd><span class="mono">{{ order.salesOrder.erpOrderNumber }}</span> <StatusBadge :status="order.salesOrder.status" /></dd>
              <dt>Net value</dt><dd class="num">{{ money(order.salesOrder.netValue) }}</dd>
              <template v-if="order.salesOrder.refusalReason"><dt>Refused</dt><dd>{{ order.salesOrder.refusalReason }}</dd></template>
              <template v-if="order.salesOrder.cancellation"><dt>Cancelled</dt><dd>{{ order.salesOrder.cancellation.reason }} · {{ when(order.salesOrder.cancellation.cancelledAt) }}</dd></template>
            </dl>
            <InvoiceList :invoices="order.invoices" />
          </section>
          <section class="card domain supply">
            <h2>Supply · WMS</h2>
            <dl v-if="order.reservation" class="kv small">
              <dt>Reservation</dt><dd><span class="mono">{{ order.reservation.reservationId }}</span> <StatusBadge :status="order.reservation.lifecycleStatus" /></dd>
              <dt>Warehouse</dt><dd>{{ order.reservation.warehouseId }}</dd>
              <dt>Reserved</dt><dd class="num">{{ when(order.reservation.reservedAt) }}</dd>
              <template v-if="order.reservation.releasedAt"><dt>Released</dt><dd class="num">{{ when(order.reservation.releasedAt) }}</dd></template>
            </dl>
            <p v-else class="small muted">No stock reserved.</p>
          </section>
          <section class="card domain logistics"><h2>Logistics · 3PL</h2><ShipmentCard :shipment="order.shipment" /></section>
          <section class="card"><h2>Delivery</h2>
            <dl class="kv small"><dt>Address</dt><dd>{{ address(order.deliveryAddress) }}</dd>
              <template v-if="order.requestedDeliveryDate"><dt>Requested</dt><dd>{{ day(order.requestedDeliveryDate) }}</dd></template></dl>
          </section>
        </div>
      </div>
    </template>
    <p v-else-if="!problem" class="empty">Loading order {{ orderId }}…</p>

    <AskDialog :open="asking === 'cancel'" title="Cancel this order" action="Cancel order" danger
      @confirm="run(() => support.cancel(order.orderId, reason))" @close="asking = ''">
      <label>Reason<input v-model="reason" required maxlength="200" placeholder="Customer called: ordered twice" /></label>
    </AskDialog>
    <AskDialog :open="asking === 'hold'" title="Put on hold" action="Put on hold" @confirm="run(() => support.hold(order.orderId, reason))" @close="asking = ''">
      <label>Reason<input v-model="reason" required maxlength="200" placeholder="Customer asked to wait" /></label>
    </AskDialog>
    <AskDialog :open="asking === 'date'" title="Reschedule delivery" action="Reschedule" @confirm="run(() => support.reschedule(order.orderId, date))" @close="asking = ''">
      <label>Requested delivery date<input v-model="date" type="date" required :min="tomorrow" /></label>
    </AskDialog>
    <AskDialog :open="asking === 'address'" title="Change delivery address" action="Change address"
      @confirm="run(() => support.changeAddress(order.orderId, newAddress))" @close="asking = ''">
      <AddressForm v-model="newAddress" />
    </AskDialog>
  </main>
</template>

<style scoped>
.domain { border-top: 3px solid var(--c); }
.finance { --c: var(--finance); }
.supply { --c: var(--supply); }
.logistics { --c: var(--logistics); }
section .notice { margin: 14px 0 0; }
</style>
