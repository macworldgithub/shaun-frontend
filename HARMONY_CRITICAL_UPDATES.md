# Harmony Delivery Centre critical updates

The matching `shaun-backend` update must be deployed first.

- Calendar dates use local calendar-day keys, including the first day of the month in Australian time zones.
- Date buttons, estimated/confirmed summary boxes and “more handovers” open all customers for the selected day.
- Day detail shows available site-local half-hour slots (08:00–17:30). Occupied confirmed slots are disabled. Choose a free slot to create a booking, or “Book time” to schedule an existing customer.
- Customer creation and detail support estimated/confirmed bookings and preferred time. Server conflicts refresh availability so another time can be chosen.
- Team & Access searches names, emails, role labels, sites and platform permissions before pagination. Delivery Specialists have management navigation; Delivery Consultants retain operational navigation. Existing owner-only user mutation restrictions are preserved.
- Dashboard previews no longer download full client records. Client lists use smaller summaries, customer details render before secondary requests finish, and page routes are loaded on demand.

Run `npm test -- --watchAll=false --runInBand` and `npm run build`. The Jest configuration maps React Router 7's exported modules for CRA's older test resolver.

SMS remains configured on the backend with Harmony's requested sender `+61408622037` and the existing handset-forwarding integration. Provider-confirmed outbound delivery and an actual forwarded handset reply are separate checks.
