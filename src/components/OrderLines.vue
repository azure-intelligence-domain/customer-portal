<script setup>
import { money } from '../lib/format.js'

defineProps({ lines: { type: Array, required: true }, total: { type: Object, required: true } })
</script>

<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>#</th><th>Product</th><th class="right">Qty</th><th class="right">Unit price</th><th class="right">Amount</th></tr>
      </thead>
      <tbody>
        <tr v-for="l in lines" :key="l.lineNumber">
          <td class="muted num">{{ l.lineNumber }}</td>
          <td>{{ l.productName ?? l.productId }} <span class="small muted mono">{{ l.productId }}</span></td>
          <td class="right num">{{ l.quantity }}</td>
          <td class="right num">{{ money(l.unitPrice) }}</td>
          <td class="right num">{{ money(l.lineAmount) }}</td>
        </tr>
        <tr>
          <td></td><td colspan="3"><strong>Total</strong></td><td class="right num"><strong>{{ money(total) }}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
