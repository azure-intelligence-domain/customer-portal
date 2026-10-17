import { ref, watch } from 'vue'

// Who the webshop is shopping for: staff pick a customer, remembered in this browser.
const KEY = 'portal.customer'
function read() {
  try {
    return localStorage.getItem(KEY) || 'ACME'
  } catch {
    return 'ACME'
  }
}
export const shoppingFor = ref(read())
watch(shoppingFor, (id) => {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* not remembered */
  }
})
