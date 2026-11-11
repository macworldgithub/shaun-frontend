// Calendar dates are site-local dates, never UTC instants.
export function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function bookingCounts(customers) {
  return customers.reduce((counts, customer) => {
    counts[customer.booking_type === 'confirmed' ? 'confirmed' : 'estimated'] += 1;
    return counts;
  }, { estimated: 0, confirmed: 0 });
}

export const bookingLabel = (customer) => customer.booking_type === 'confirmed' ? 'Confirmed' : 'Estimated';
