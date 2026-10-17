<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AddressForm from '../components/AddressForm.vue'
import ProblemNotice from '../components/ProblemNotice.vue'
import { webshop } from '../lib/api.js'
import { shoppingFor } from '../lib/customer.js'
import { address, money } from '../lib/format.js'

const router = useRouter()
const customers = ref([])
const products = ref([])
const quantities = reactive({})
const problem = ref(null)
const placing = ref(false)
const elsewhere = ref(false)
const deliverTo = ref({ street: '', postalCode: '', city: '', countryCode: '' })
const wanted = ref('')
let attempt = crypto.randomUUID() // one Idempotency-Key per order the cart becomes

onMounted(async () => {
  try {
    const [c, p] = await Promise.all([webshop.customers(), webshop.products()])
    customers.value = c._embedded.customers
    products.value = p._embedded.products
    if (!customers.value.some((x) => x.customerId === shoppingFor.value)) shoppingFor.value = customers.value[0]?.customerId
  } catch (e) {
    problem.value = e
  }
})

const customer = computed(() => customers.value.find((c) => c.customerId === shoppingFor.value))
watch(customer, (c) => c && (deliverTo.value = { ...c.shippingAddress }), { immediate: true })
const lines = computed(() =>
  products.value.filter((p) => quantities[p.productId] > 0).map((p) => ({ product: p, quantity: quantities[p.productId] })),
)
const total = computed(() => {
  const value = lines.value.reduce((sum, l) => sum + l.quantity * l.product.unitPrice.value, 0)
  return { value, currency: products.value[0]?.unitPrice.currency ?? 'EUR' }
})
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

function step(id, by) {
  quantities[id] = Math.max(0, Math.min(1000, (quantities[id] ?? 0) + by))
}

async function place() {
  placing.value = true
  problem.value = null
  try {
    const body = { customerId: shoppingFor.value, orderLines: lines.value.map((l) => ({ productId: l.product.productId, quantity: l.quantity })) }
    if (elsewhere.value) body.deliveryAddress = deliverTo.value
    if (wanted.value) body.requestedDeliveryDate = wanted.value
    const order = await webshop.place(body, attempt)
    attempt = crypto.randomUUID()
    Object.keys(quantities).forEach((k) => delete quantities[k])
    router.push(`/orders/${order.orderId}`)
  } catch (e) {
    problem.value = e
  } finally {
    placing.value = false
  }
}
</script>

<template>
  <main class="page">
    <div class="page-head">
      <div class="stack">
        <p class="eyebrow">Webshop</p>
        <h1>Shop for a customer</h1>
      </div>
      <label class="for">Shopping for
        <select v-model="shoppingFor">
          <option v-for="c in customers" :key="c.customerId" :value="c.customerId">{{ c.name }} ({{ c.customerId }})</option>
        </select>
      </label>
    </div>
    <ProblemNotice :problem="problem" />
    <div class="split">
      <section class="grid cols-3" aria-label="Products">
        <article v-for="p in products" :key="p.productId" class="card product">
          <p class="eyebrow">{{ p.family }}</p>
          <h2>{{ p.name }}</h2>
          <p class="small muted">{{ p.description }}</p>
          <p class="price num">{{ money(p.unitPrice) }}</p>
          <div class="row qty">
            <button :aria-label="`One less ${p.name}`" @click="step(p.productId, -1)">−</button>
            <input v-model.number="quantities[p.productId]" type="number" min="0" max="1000" :aria-label="`Quantity of ${p.name}`" placeholder="0" />
            <button :aria-label="`One more ${p.name}`" @click="step(p.productId, 1)">+</button>
          </div>
        </article>
        <p v-if="!products.length && !problem" class="empty card">Loading the catalogue from Salesforce…</p>
      </section>
      <aside class="card stack cart">
        <h2>Order for {{ customer?.name ?? '…' }}</h2>
        <p v-if="!lines.length" class="muted small">Add products to place an order.</p>
        <ul v-else class="cart-lines">
          <li v-for="l in lines" :key="l.product.productId" class="row">
            <span class="num">{{ l.quantity }} ×</span><span class="grow">{{ l.product.name }}</span>
            <span class="num">{{ money({ value: l.quantity * l.product.unitPrice.value, currency: l.product.unitPrice.currency }) }}</span>
          </li>
        </ul>
        <div class="row total"><strong>Total</strong><strong class="num">{{ money(total) }}</strong></div>
        <p v-if="total.value > 250000" class="notice small">Above €250,000 SAP's credit check refuses the order: try it, the order is rejected by events.</p>
        <div class="stack">
          <label class="check"><input v-model="elsewhere" type="checkbox" /> Deliver somewhere else</label>
          <p v-if="!elsewhere" class="small muted">Delivered to {{ address(customer?.shippingAddress) }}</p>
          <AddressForm v-else v-model="deliverTo" />
          <label>Requested delivery date <input v-model="wanted" type="date" :min="tomorrow" /></label>
        </div>
        <button class="primary" :disabled="!lines.length || placing" @click="place">{{ placing ? 'Placing…' : 'Place order' }}</button>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.for { min-width: 260px; }
.product { display: grid; gap: 6px; align-content: start; }
.price { font-size: 1.2rem; font-weight: 700; margin: 4px 0; }
.qty { flex-wrap: nowrap; }
.qty input { width: 72px; text-align: center; }
.qty button { padding: 6px 12px; }
.cart { position: sticky; top: 76px; }
.cart-lines { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.grow { flex: 1; min-width: 0; }
.total { justify-content: space-between; border-top: 1px solid var(--line); padding-top: 10px; }
.check { display: flex; flex-direction: row; align-items: center; gap: 8px; color: var(--text); }
.check input { width: auto; }
@media (max-width: 900px) { .cart { position: static; } }
</style>
