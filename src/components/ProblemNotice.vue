<script setup>
defineProps({ problem: { type: Object, default: null } })
</script>

<template>
  <div v-if="problem" class="notice error" role="alert">
    <strong>{{ problem.title }}</strong>
    <span v-if="problem.message && problem.message !== problem.title">: {{ problem.message }}</span>
  </div>
</template>
