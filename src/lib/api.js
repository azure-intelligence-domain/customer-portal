// The Experience APIs, through the gateway (apim-intplat-demo). Every call carries the staff
// sign-in and a Correlation-Id: ord-<orderId> for everything about one order, so the whole journey
// (portal, gateway, order domain, SAP, warehouse, 3PL) is one trace and one story in the tap.
import { signOut, token } from './auth.js'

const GATEWAY = (import.meta.env.VITE_GATEWAY_URL ?? '').replace(/\/$/, '')

export class Problem extends Error {
  constructor(status, body = {}) {
    super(body.detail || body.title || `HTTP ${status}`)
    this.status = status
    this.title = body.title ?? `HTTP ${status}`
    this.type = body.type
  }
}

export const journeyOf = (orderId) => `ord-${orderId}`
export const newJourney = (prefix = 'web') => `${prefix}-${crypto.randomUUID().slice(0, 8)}`

export async function call(api, method, path, { body, query, journey, idempotencyKey, fetcher = fetch } = {}) {
  const url = new URL(`${GATEWAY}/${api}${path}`)
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  const headers = { 'Correlation-Id': journey ?? newJourney('portal'), Authorization: `Bearer ${token()}` }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
  let response
  try {
    response = await fetcher(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new Problem(0, { title: 'Gateway Unreachable', detail: 'The gateway could not be reached. Check your connection and try again.' })
  }
  const text = await response.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { title: `HTTP ${response.status}`, detail: text.slice(0, 200) }
  }
  if (response.status === 401) signOut(data.detail ?? 'Sign in again.')
  if (!response.ok) throw new Problem(response.status, data)
  return data
}

const order = (id) => ({ journey: journeyOf(id) })

export const webshop = {
  products: () => call('webshop', 'GET', '/products'),
  customers: () => call('webshop', 'GET', '/customers'),
  orders: (query) => call('webshop', 'GET', '/orders', { query }),
  order: (id) => call('webshop', 'GET', `/orders/${id}`, order(id)),
  place: (body, idempotencyKey) => call('webshop', 'POST', '/orders', { body, idempotencyKey, journey: newJourney('web') }),
  cancel: (id, reason) => call('webshop', 'DELETE', `/orders/${id}`, { ...order(id), query: { reason } }),
  changeAddress: (id, address) => call('webshop', 'PUT', `/orders/${id}/delivery-address`, { ...order(id), body: address }),
  pay: (id, invoiceNumber) => call('webshop', 'POST', `/orders/${id}/payments`, { ...order(id), body: { invoiceNumber } }),
}

export const support = {
  customers: () => call('customer-service', 'GET', '/customers'),
  customer: (id) => call('customer-service', 'GET', `/customers/${id}`),
  orders: (query) => call('customer-service', 'GET', '/orders', { query }),
  order: (id) => call('customer-service', 'GET', `/orders/${id}`, order(id)),
  cancel: (id, reason) => call('customer-service', 'DELETE', `/orders/${id}`, { ...order(id), query: { reason } }),
  hold: (id, reason) => call('customer-service', 'PUT', `/orders/${id}/hold`, { ...order(id), body: { reason } }),
  release: (id) => call('customer-service', 'DELETE', `/orders/${id}/hold`, order(id)),
  reschedule: (id, requestedDeliveryDate) =>
    call('customer-service', 'PUT', `/orders/${id}/requested-delivery-date`, { ...order(id), body: { requestedDeliveryDate } }),
  changeAddress: (id, address) => call('customer-service', 'PUT', `/orders/${id}/delivery-address`, { ...order(id), body: address }),
}

const shipmentJourney = (booking) => journeyOf(booking.orderId)

export const partner = {
  bookings: (status) => call('partner', 'GET', '/shipment-bookings', { query: { status } }),
  shipment: (id) => call('partner', 'GET', `/shipments/${id}`),
  pickUp: (booking) => call('partner', 'POST', `/shipment-bookings/${booking.shipmentId}/pick-up`, { journey: shipmentJourney(booking), body: {} }),
  deliver: (booking, receivedBy) =>
    call('partner', 'POST', `/shipments/${booking.shipmentId}/delivery`, {
      journey: shipmentJourney(booking),
      body: receivedBy ? { receivedBy } : {},
    }),
}
