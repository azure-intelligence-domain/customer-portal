<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { config, configured, renderButton, session } from '../lib/auth.js'

const route = useRoute()
const router = useRouter()
const button = ref(null)
const failed = ref('')

onMounted(async () => {
  if (session.user) return router.replace(route.query.next || '/shop')
  if (!configured()) return
  try {
    await renderButton(button.value, () => router.replace(route.query.next || '/shop'))
  } catch (e) {
    failed.value = e.message
  }
})
</script>

<template>
  <main class="page">
    <section class="hero card">
      <div class="stack">
        <p class="eyebrow">Integration platform demo · Nordic APIs Summit 2026</p>
        <h1>Follow an order through every system it touches.</h1>
        <p class="muted">
          Place an order for ACME in the webshop and watch it travel by events: Salesforce, SAP's credit check and
          invoice, the warehouse, the 3PL partner. Customer service sees what every domain knows; the 3PL partner
          reports the pick-up and the delivery. Every click goes through API Management and lands in the tap.
        </p>
      </div>
      <div class="stack signin">
        <h2>Staff sign-in</h2>
        <p class="small muted">With your Google account of <strong>{{ config.domain }}</strong>. Other accounts are refused.</p>
        <div v-if="configured()" ref="button" class="google"></div>
        <div v-else class="notice">
          Google sign-in is not configured yet: the portal needs its OAuth client id
          (<span class="mono">VITE_GOOGLE_CLIENT_ID</span>).
        </div>
        <div v-if="session.message" class="notice error" role="alert">{{ session.message }}</div>
        <div v-if="failed" class="notice error" role="alert">{{ failed }}</div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.hero { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 32px; padding: 32px; margin-top: 24px; }
.hero h1 { font-size: 2rem; }
.signin { align-content: start; border-left: 1px solid var(--line); padding-left: 32px; }
.google { min-height: 44px; }
@media (max-width: 800px) {
  .hero { grid-template-columns: 1fr; padding: 20px; }
  .signin { border-left: 0; padding-left: 0; border-top: 1px solid var(--line); padding-top: 20px; }
}
</style>
