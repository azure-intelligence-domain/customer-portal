<script setup>
import { when } from '../lib/format.js'

defineProps({ items: { type: Array, required: true } })
const DOMAINS = { order: 'Order', finance: 'Finance · SAP', supply: 'Supply · WMS', logistics: 'Logistics · 3PL' }
</script>

<template>
  <p v-if="!items.length" class="muted small">This order was placed before the order domain kept a timeline.</p>
  <ol v-else class="facts">
    <li v-for="(f, i) in [...items].reverse()" :key="i" :data-domain="f.domain">
      <span class="pin" aria-hidden="true"></span>
      <div>
        <div class="what">{{ f.description }}</div>
        <div class="small muted">
          <span class="who">{{ DOMAINS[f.domain] ?? f.domain }}</span> · <span class="mono">{{ f.fact }}</span> ·
          <span class="num">{{ when(f.occurredAt) }}</span>
        </div>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.facts { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; }
li { display: grid; grid-template-columns: 14px 1fr; gap: 12px; padding: 8px 0; position: relative; }
li::before { content: ''; position: absolute; left: 6px; top: 22px; bottom: -8px; width: 2px; background: var(--line); }
li:last-child::before { display: none; }
.pin { width: 14px; height: 14px; border-radius: 50%; margin-top: 4px; background: var(--c, var(--muted)); box-shadow: 0 0 0 3px var(--surface); z-index: 1; }
[data-domain='order'] { --c: var(--order); }
[data-domain='finance'] { --c: var(--finance); }
[data-domain='supply'] { --c: var(--supply); }
[data-domain='logistics'] { --c: var(--logistics); }
.who { color: var(--c); font-weight: 600; }
.what { font-weight: 500; }
</style>
