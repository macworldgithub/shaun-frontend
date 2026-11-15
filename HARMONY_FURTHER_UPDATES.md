# Harmony Delivery Centre further updates

Requires the matching `shaun-backend` sequence API and Sales CRM/shared API release.

- Settings now contain the real per-site post-delivery schedule and editable templates: delivery-day SMS, day-3 salesperson CRM reminder, day-23 SMS and day-31 survey SMS. Managers can save the enabled state and templates; ordinary staff can view them.
- Customer creation and detail support Private/Business classification. Customer profiles show sequence job states, due dates, exclusions and an SMS opt-out control. Failed saves keep the persisted state and show an error.
- The obsolete, disconnected seven-day post-delivery toggle is removed. The sequence excludes fleet, demo and business sales and starts on a new Delivered transition, without enrolling historical deliveries.
- The separate Sales CRM release supplies the searchable To Delivery VIN inventory picker, explicit TBA choice, and assigned day-3 call reminder with call notes and text actions.

Validation includes React interaction tests, a production build, and synthetic browser checks at 1365px and 390px. No real customer SMS is sent during these checks.
