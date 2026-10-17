import { onBeforeUnmount, onMounted } from 'vue'

// The order moves by events, seconds apart (SAP, the warehouse, the 3PL): while it is on its way,
// read it again every few seconds, only while the tab is visible.
export function usePolling(refresh, keepGoing, every = 3000) {
  let timer
  const tick = async () => {
    if (document.visibilityState === 'visible' && keepGoing()) await refresh(true)
    timer = setTimeout(tick, every)
  }
  onMounted(() => (timer = setTimeout(tick, every)))
  onBeforeUnmount(() => clearTimeout(timer))
}
