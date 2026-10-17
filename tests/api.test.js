import { describe, expect, it } from 'vitest'
import { Problem, call, journeyOf } from '../src/lib/api.js'

function fakeFetch(status, body) {
  const calls = []
  const fetcher = async (url, init) => {
    calls.push({ url: String(url), ...init })
    return { status, ok: status >= 200 && status < 300, text: async () => (body === undefined ? '' : JSON.stringify(body)) }
  }
  return { fetcher, calls }
}

describe('the gateway client', () => {
  it('sends the journey, the sign-in and the body to the Experience API', async () => {
    const { fetcher, calls } = fakeFetch(200, { orderId: '4711' })
    const order = await call('webshop', 'PUT', '/orders/4711/delivery-address', { journey: journeyOf('4711'), body: { city: 'Ghent' }, fetcher })
    expect(order.orderId).toBe('4711')
    expect(calls[0].url).toMatch(/\/webshop\/orders\/4711\/delivery-address$/)
    expect(calls[0].headers['Correlation-Id']).toBe('ord-4711')
    expect(calls[0].headers.Authorization).toMatch(/^Bearer /)
    expect(calls[0].headers['Content-Type']).toBe('application/json')
    expect(calls[0].body).toBe('{"city":"Ghent"}')
  })
  it('makes up a journey when none is given, and leaves empty filters out', async () => {
    const { fetcher, calls } = fakeFetch(200, {})
    await call('webshop', 'GET', '/orders', { query: { customerId: 'ACME', status: '' }, fetcher })
    expect(calls[0].headers['Correlation-Id']).toMatch(/^portal-[0-9a-f]{8}$/)
    expect(calls[0].url).toMatch(/\/orders\?customerId=ACME$/)
  })
  it('turns Problem Details into a Problem', async () => {
    const { fetcher } = fakeFetch(409, { title: 'Order State Conflict', detail: 'Order 4711 is shipped.' })
    const problem = await call('customer-service', 'DELETE', '/orders/4711', { fetcher }).catch((e) => e)
    expect(problem).toBeInstanceOf(Problem)
    expect([problem.status, problem.title, problem.message]).toEqual([409, 'Order State Conflict', 'Order 4711 is shipped.'])
  })
  it('says so when the gateway cannot be reached', async () => {
    const problem = await call('webshop', 'GET', '/products', { fetcher: async () => { throw new TypeError('offline') } }).catch((e) => e)
    expect([problem.status, problem.title]).toEqual([0, 'Gateway Unreachable'])
  })
})
