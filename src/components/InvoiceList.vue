<script setup>
import StatusBadge from './StatusBadge.vue'
import { day, money } from '../lib/format.js'

defineProps({ invoices: { type: Array, required: true }, canPay: Boolean, busy: Boolean })
defineEmits(['pay'])
const payable = (i) => i.status === 'open' && !i.creditNote
</script>

<template>
  <p v-if="!invoices.length" class="muted small">No invoice yet: SAP bills the order once it accepts it.</p>
  <div v-for="i in invoices" :key="i.invoiceNumber" class="invoice">
    <div class="row">
      <strong class="mono">{{ i.invoiceNumber }}</strong>
      <StatusBadge :status="i.creditNote ? 'cancelled' : i.status" />
      <span v-if="i.creditNote" class="small muted">credited</span>
    </div>
    <dl class="kv small">
      <dt>Amount</dt><dd class="num">{{ money(i.amount) }}</dd>
      <dt>Paid</dt><dd class="num">{{ money(i.paidAmount) }}</dd>
      <dt>Due</dt><dd>{{ day(i.dueDate) }}</dd>
      <template v-if="i.creditNote">
        <dt>Credit note</dt><dd><span class="mono">{{ i.creditNote.creditNoteNumber }}</span> · {{ day(i.creditNote.issuedAt) }}</dd>
      </template>
    </dl>
    <button v-if="canPay && payable(i)" class="primary" :disabled="busy" @click="$emit('pay', i)">
      Pay {{ money({ value: i.amount.value - i.paidAmount.value, currency: i.amount.currency }) }}
    </button>
  </div>
</template>

<style scoped>
.invoice { display: grid; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.invoice:last-child { border-bottom: 0; }
</style>
