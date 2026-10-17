<script setup>
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { session, signOut } from './lib/auth.js'

const route = useRoute()
const router = useRouter()
// Signed out anywhere (expired, or the gateway said 401): back to the sign-in, then back here.
watch(() => session.user, (user) => {
  if (!user && !route.meta.public) router.push({ path: '/sign-in', query: { next: route.fullPath } })
})
const areas = [
  { to: '/shop', label: 'Shop', match: ['/shop'] },
  { to: '/orders', label: 'Orders', match: ['/orders'] },
  { to: '/support', label: 'Customer service', match: ['/support'] },
  { to: '/partner', label: '3PL partner', match: ['/partner'] },
]
const active = (a) => a.match.some((m) => route.path.startsWith(m))
</script>

<template>
  <header class="top">
    <div class="top-inner">
      <RouterLink to="/shop" class="brand">
        <svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" /><path d="M9 21l7-11 7 11" /></svg>
        <span><strong>ACME</strong> portal</span>
        <span class="demo">demo</span>
      </RouterLink>
      <nav v-if="session.user" aria-label="Areas">
        <RouterLink v-for="a in areas" :key="a.to" :to="a.to" :class="{ on: active(a) }">{{ a.label }}</RouterLink>
      </nav>
      <div v-if="session.user" class="who">
        <img v-if="session.user.picture" :src="session.user.picture" alt="" referrerpolicy="no-referrer" />
        <span class="small">{{ session.user.given_name || session.user.email }}</span>
        <button class="small" @click="signOut()">Sign out</button>
      </div>
    </div>
  </header>
  <RouterView />
  <footer class="foot small muted">
    Every screen runs on the integration platform's Experience APIs, through API Management: every click is a business
    journey in the tap. <a href="https://github.com/azure-intelligence-domain/customer-portal">Source</a> ·
    <a href="https://azure-intelligence-domain.github.io/eventcatalog/">Catalog</a>
  </footer>
</template>

<style scoped>
.top { background: var(--surface); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 10; }
.top-inner { max-width: 1180px; margin: 0 auto; padding: 10px 16px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.brand { display: flex; align-items: center; gap: 8px; color: var(--text); font-size: 1.05rem; }
.brand:hover { text-decoration: none; }
.mark { width: 26px; height: 26px; }
.mark rect { fill: var(--accent); }
.mark path { stroke: var(--accent-text); stroke-width: 3; fill: none; stroke-linecap: round; stroke-linejoin: round; }
.demo { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 1px 8px; }
nav { display: flex; gap: 4px; flex-wrap: wrap; }
nav a { color: var(--muted); padding: 6px 12px; border-radius: 8px; font-weight: 600; }
nav a:hover { text-decoration: none; color: var(--text); background: var(--sunken); }
nav a.on { color: var(--text); background: var(--sunken); }
.who { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.who img { width: 28px; height: 28px; border-radius: 50%; }
.who button { padding: 4px 10px; }
.foot { max-width: 1180px; margin: 0 auto; padding: 0 16px 32px; }
</style>
