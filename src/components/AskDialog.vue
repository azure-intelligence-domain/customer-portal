<script setup>
import { ref, watch } from 'vue'

// A small form in a dialog: the caller fills the slot and gets `confirm` when it is submitted.
const props = defineProps({ open: Boolean, title: { type: String, required: true }, action: { type: String, default: 'Confirm' }, danger: Boolean })
const emit = defineEmits(['confirm', 'close'])
const dialog = ref(null)
watch(() => props.open, (open) => (open ? dialog.value?.showModal() : dialog.value?.close()))
</script>

<template>
  <dialog ref="dialog" @close="emit('close')">
    <form class="stack" method="dialog" @submit.prevent="emit('confirm')">
      <h2>{{ title }}</h2>
      <slot />
      <div class="row end">
        <button type="button" @click="emit('close')">Back</button>
        <button type="submit" class="primary" :class="{ danger }">{{ action }}</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.end { justify-content: flex-end; }
</style>
