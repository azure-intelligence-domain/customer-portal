import { ref } from 'vue'
import { settled } from './format.js'
import { usePolling } from './polling.js'

// One order on screen, kept fresh while it moves: read again every few seconds for two minutes
// after it last changed (or after an action), until it is completed, cancelled or rejected.
export function useOrder(read) {
  const order = ref(null)
  const problem = ref(null)
  const busy = ref(false)
  let changedAt = Date.now()

  async function refresh(quiet = false) {
    try {
      const fresh = await read()
      if (fresh.updatedAt !== order.value?.updatedAt) changedAt = Date.now()
      order.value = fresh
      if (!quiet) problem.value = null
    } catch (e) {
      if (!quiet || e.status !== 0) problem.value = e
    }
  }

  async function act(action) {
    busy.value = true
    problem.value = null
    try {
      const answer = await action()
      if (answer?.orderId) order.value = answer
      changedAt = Date.now()
      return answer
    } catch (e) {
      problem.value = e
    } finally {
      busy.value = false
    }
  }

  usePolling(refresh, () => order.value && !settled(order.value.status) && Date.now() - changedAt < 120000)
  refresh()
  return { order, problem, busy, refresh, act }
}
