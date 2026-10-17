<script setup>
import { computed } from 'vue'
import { label } from '../lib/format.js'

const props = defineProps({ status: { type: String, required: true } })
const tone = computed(() => {
  if (['completed', 'paid', 'delivered', 'accepted'].includes(props.status)) return 'ok'
  if (['cancelled', 'rejected', 'refused', 'released'].includes(props.status)) return 'stop'
  if (['onHold', 'invoiced', 'unpaid', 'open'].includes(props.status)) return 'warn'
  return 'go'
})
</script>

<template>
  <span class="badge" :class="tone">{{ label(status) }}</span>
</template>
