<script setup>
import StatusBadge from './StatusBadge.vue'
import { when } from '../lib/format.js'

defineProps({ shipment: { type: Object, default: null } })
</script>

<template>
  <p v-if="!shipment" class="muted small">Not booked with the 3PL yet: that happens once the stock is reserved.</p>
  <div v-else class="stack">
    <div class="row"><strong class="mono">{{ shipment.trackingNumber }}</strong><StatusBadge :status="shipment.status" /></div>
    <dl class="kv small">
      <dt>Partner</dt><dd>{{ shipment.partnerId }}</dd>
      <dt>Shipment</dt><dd class="mono">{{ shipment.shipmentId }}</dd>
      <dt>Booked</dt><dd class="num">{{ when(shipment.bookedAt) }}</dd>
      <template v-if="shipment.dispatchedAt"><dt>Picked up</dt><dd class="num">{{ when(shipment.dispatchedAt) }}</dd></template>
      <template v-if="shipment.deliveredAt"><dt>Delivered</dt><dd class="num">{{ when(shipment.deliveredAt) }}</dd></template>
      <template v-if="shipment.receivedBy"><dt>Signed by</dt><dd>{{ shipment.receivedBy }}</dd></template>
      <template v-if="shipment.cancelledAt"><dt>Cancelled</dt><dd class="num">{{ when(shipment.cancelledAt) }}</dd></template>
    </dl>
  </div>
</template>
