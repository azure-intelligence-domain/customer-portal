<script setup>
import { label, when } from '../lib/format.js'

defineProps({ progress: { type: Array, required: true }, status: { type: String, required: true } })
</script>

<template>
  <ol class="track" :class="{ stopped: ['cancelled', 'rejected'].includes(status) }">
    <li v-for="step in progress" :key="step.milestone" :class="{ reached: step.reached }">
      <span class="dot" aria-hidden="true"></span>
      <span class="name">{{ label(step.milestone) }}</span>
      <span class="at small muted num">{{ when(step.reachedAt) }}</span>
    </li>
  </ol>
</template>

<style scoped>
.track { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); }
li { position: relative; display: grid; justify-items: center; text-align: center; gap: 4px; padding-top: 2px; }
li::before { content: ''; position: absolute; top: 9px; left: -50%; width: 100%; height: 3px; background: var(--line); z-index: 0; }
li:first-child::before { display: none; }
li.reached::before { background: var(--accent); }
.dot { width: 18px; height: 18px; border-radius: 50%; border: 3px solid var(--line); background: var(--surface); z-index: 1; }
li.reached .dot { border-color: var(--accent); background: var(--accent); }
.stopped li.reached .dot, .stopped li.reached::before { border-color: var(--muted); background: var(--muted); }
.name { font-weight: 600; font-size: 0.85rem; }
li:not(.reached) .name { color: var(--muted); font-weight: 500; }
@media (max-width: 640px) {
  .track { grid-template-columns: 1fr; gap: 10px; }
  li { grid-template-columns: 18px 1fr auto; justify-items: start; text-align: left; gap: 10px; align-items: center; }
  li::before { display: none; }
}
</style>
