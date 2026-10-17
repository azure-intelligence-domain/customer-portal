export const money = (m) =>
  m ? new Intl.NumberFormat('en-BE', { style: 'currency', currency: m.currency }).format(m.value) : ''

export const when = (iso) =>
  iso ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : ''

export const day = (iso) => (iso ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(iso)) : '')

export const STATUS = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  onHold: 'On hold',
  readyForShipment: 'Ready for shipment',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  unpaid: 'Unpaid',
  invoiced: 'Invoiced',
  paid: 'Paid',
  open: 'Open',
  booked: 'Booked',
  dispatched: 'On its way',
  pickedUp: 'Picked up',
  reserved: 'Reserved',
  released: 'Released',
  accepted: 'Accepted',
  refused: 'Refused',
}
export const label = (status) => STATUS[status] ?? status

/** Statuses after which nothing happens to an order by itself any more. */
export const settled = (status) => ['completed', 'cancelled', 'rejected'].includes(status)

export const address = (a) => (a ? `${a.street}, ${a.postalCode} ${a.city}, ${a.countryCode}` : '')
