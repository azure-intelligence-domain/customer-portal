# CLAUDE.md

The customer portal (Vue.js 3, Vite). Owned by the channel team. Ground rules live in the
[ai-intelligence-domain](https://github.com/azure-intelligence-domain/ai-intelligence-domain)
repository (ADR 0017 experience layer and staff sign-in).

- The portal only calls the Experience APIs on the gateway (`src/lib/api.js`); never a Process or
  System API, never a Function.
- Every call carries a `Correlation-Id`: `ord-<orderId>` for anything about one order.
- No secrets: `.env` holds public settings only. The Google sign-in is checked by the gateway; the
  portal's own check only gives a clearer message.
- Buttons follow the order's HAL `_links`: show an action only when the API offers it.
- Tests: `npm test`; build: `npm run build`.
