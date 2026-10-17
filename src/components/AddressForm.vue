<script setup>
const address = defineModel({ type: Object, required: true })
</script>

<template>
  <div class="grid address">
    <label class="wide">Street and number<input v-model.trim="address.street" required autocomplete="street-address" /></label>
    <label>Postal code<input v-model.trim="address.postalCode" required autocomplete="postal-code" /></label>
    <label>City<input v-model.trim="address.city" required autocomplete="address-level2" /></label>
    <label>Country
      <input v-model.trim="address.countryCode" required maxlength="2" pattern="[A-Z]{2}" placeholder="BE"
        @input="address.countryCode = address.countryCode.toUpperCase()" />
    </label>
  </div>
</template>

<style scoped>
.address { grid-template-columns: 1fr 1fr 80px; }
.wide { grid-column: 1 / -1; }
@media (max-width: 520px) { .address { grid-template-columns: 1fr; } }
</style>
