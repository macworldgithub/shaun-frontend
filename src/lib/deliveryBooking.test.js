import { localDateKey, bookingCounts } from './deliveryBooking';
import { matchesUser } from './access';

test('calendar dates preserve local midnight across month boundaries', () => {
  expect(localDateKey(new Date(2026, 10, 1))).toBe('2026-11-01');
  expect(localDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
});

test('summary separates confirmed, estimated and legacy bookings', () => {
  expect(bookingCounts([{ booking_type: 'confirmed' }, { booking_type: 'estimated' }, {}]))
    .toEqual({ confirmed: 1, estimated: 2 });
});

test('team search handles names, roles, sites and permissions together', () => {
  const user = { name: 'Sarah Smith', email: 'sarah@example.com', role: 'delivery_specialist',
    active: true, allowed_sites: ['BYD Caroline Springs'], platform_access: ['delivery_centre'] };
  expect(matchesUser(user, 'SARAH Manager Caroline')).toBe(true);
  expect(matchesUser(user, 'example.com delivery_centre')).toBe(true);
  expect(matchesUser(user, 'consultant')).toBe(false);
  expect(matchesUser(user, '   ')).toBe(true);
});
