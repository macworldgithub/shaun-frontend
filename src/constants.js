// Shared constants used across the app
export const deliveryStages = [
  'Scheduled',
  'Pre-Delivery Inspection',
  'In Transit',
  'Ready for Pickup',
  'Delivered',
];

export const registrationStatuses = [
  'Awaiting registration documents',
  'Awaiting VIN',
  'Ready to register',
  'Partial',
  'Complete',
];

export const handoverChecklistStatuses = [
  'Not issued',
  'Issued in VY',
  'Signed copy on file',
  'Exception',
];

export const tradeInStatuses = [
  'Pending',
  'Quoted',
  'Accepted',
  'Vehicle received',
  'Settled',
  'Valid',
  'Expiring soon',
  'Expiring',
  'Expired',
  'Cancelled',
];

export const saleTypes = ['Retail', 'Lease', 'Novated', 'Novated lease', 'Fleet', 'Government', 'Rental', 'Cash', 'Demo', 'Other'];

export const documentTypes = [
  'ATR signed',
  'ATR incomplete',
  'Licence front',
  'Licence back',
  'Medicare card',
  'Transfer form',
  'Acquisition police strip',
  'Customer trade-in checklist',
  'EFT form',
  'Bank statement',
  'Handover checklist',
  'Other',
];

export const documentStatuses = ['requested', 'partial', 'complete', 're-requested'];
export const activationStatuses = ['Blocked', 'Ready', 'Submitted to BYD', 'Active'];
export const offerStatuses = ['Eligible', 'At risk', 'Ineligible'];
export const yourWaySelections = ['Cashback', 'Accessories', 'Car care', 'Merchandise', 'Charging', 'Other'];

export const contactStatuses = [
  'Not Contacted',
  'Contacted',
  'Awaiting Reply',
  'Booked',
];

export const accessoryStatuses = [
  'Pending Order',
  'Ordered',
  'On Hand',
  'Fitted',
];

export const siteLocations = ['Fairfield', 'Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide'];
export const teamProfiles = ['Booking Team', 'Handover Team', 'All Teams'];

export const checklistItems = [
  { id: 'ck1', label: 'Contract signed & Authority signed' },
  { id: 'ck2', label: 'License uploaded & Medicare uploaded' },
  { id: 'ck3', label: 'Client ID for business', hasInput: true },
  { id: 'ck4', label: 'Trade-in transfers (if applicable) & Demo transfers (if applicable)' },
  { id: 'ck5', label: 'Introduction email sent' },
  { id: 'ck6', label: 'All accessories fitted / missing accessories flagged & customer informed' },
  { id: 'ck7', label: 'Delivery booked & Handover checklist complete' },
  { id: 'ck8', label: 'Car delivered' },
];

export const inspectionSections = [
  {
    id: 'prior_to_arrival',
    title: '1. Prior to Customer Arrival',
    icon: 'Sparkles',
    description: 'Vehicle physical preparation and compliance before customer arrives',
    items: [
      { key: 'clean_inside_out', label: 'Car is clean inside and out' },
    ],
  },
  {
    id: 'with_customer',
    title: '2. With Customer',
    icon: 'Users',
    description: 'Customer greeting, specialist introduction, payment and insurance verification',
    items: [
      { key: 'welcome_congratulate', label: 'Welcome and congratulate customer on their new BYD' },
      { key: 'introduce_specialist', label: 'Introduce yourself as a BYD delivery specialist' },
      { key: 'confirm_payments', label: 'Confirm all payments are made' },
      { key: 'confirm_insurance', label: 'Confirm the customer has comprehensive insurance' },
    ],
  },
  {
    id: 'exterior',
    title: '3. Exterior',
    icon: 'Car',
    description: 'Key and NFC card access, boot operation, and included charging / V2L cables',
    items: [
      { key: 'access_keys_nfc', label: 'Show customer how to access the car with keys, NFC card' },
      { key: 'access_boot_power', label: 'Show customer how to access the boot and explain electronic close, lock and set height' },
      { key: 'charging_cable_usage', label: 'Show customer included charging cable and how to use' },
      { key: 'v2l_cable_usage', label: 'Show customer included V2L cable and how to use' },
      { key: 'bonnet_washer_fluid', label: 'Show customer how to open bonnet and fill washer fluid' },
    ],
  },
  {
    id: 'interior',
    title: '4. Interior',
    icon: 'Armchair',
    description: 'Cabin condition satisfaction, infotainment, wireless charging, and safety features',
    items: [
      { key: 'condition_interior', label: 'Completely satisfied with the condition of interior' },
      { key: 'infotainment_navigation', label: 'Explanation of infotainment/navigation system/ wireless charger' },
      { key: 'safety_features', label: 'Explanation of safety features' },
    ],
  },
  {
    id: 'seating',
    title: '5. Seating',
    icon: 'Sliders',
    description: 'Rear seat split-fold, Isofix and tether points, seat adjustments, and sunroof/blind',
    items: [
      { key: 'rear_seats_split', label: 'Show customer rear seats and split fold' },
      { key: 'isofix_tether', label: 'Show customer Isofix and tether points' },
      { key: 'seat_adjustment', label: 'Show customer how to adjust driver and front passenger seats' },
      { key: 'sunroof_blind', label: 'Show customer how to use sunroof and blind (if fitted)' },
    ],
  },
  {
    id: 'technology',
    title: '6. Technology',
    icon: 'Smartphone',
    description: 'In-vehicle technology, wireless charging warning, Bluetooth, OTA updates, and BYD App',
    items: [
      { key: 'wireless_charging_warning', label: 'Explain wireless phone charging and advise against storing NFC cards, credit cards etc. between phone and wireless charging pads while in use.' },
      { key: 'bluetooth_carplay_androidauto', label: 'Pair Bluetooth and explain connection to Apple Car Play (USB cable) and Android Auto (wireless)' },
      { key: 'ota_update_procedure', label: 'Explain OTA update procedure and how the 2GB data limit does not apply to this' },
      { key: 'sim_app_registration', label: 'Explain that SIM card activation and BYD app registration will be activated in the next couple of days.' },
      { key: 'hi_byd_voice', label: 'Explain "Hi BYD"' },
      { key: 'digital_fm_radio', label: 'Explain Digital and FM radio, and other entertainment features' },
      { key: 'vehicle_controls', label: 'Explain vehicle controls (located on centre console, steering wheel etc.)' },
      { key: 'gear_selection_neutral', label: 'Explain how to select gears (including Neutral)' },
      { key: 'park_brake_auto', label: 'Explain automatic park brake engagement when in Park' },
      { key: 'download_byd_app', label: 'Ask permission to download the BYD app for the customer to their phone' },
      { key: 'app_features_explained', label: 'App features explained' },
    ],
  },
  {
    id: 'driving',
    title: '7. Driving',
    icon: 'Gauge',
    description: 'Lane keeping, adaptive cruise control, wipers, driving modes, and regenerative braking',
    items: [
      { key: 'lane_keeping', label: 'Explain lane keeping features' },
      { key: 'adaptive_cruise', label: 'Explain adaptive cruise control' },
      { key: 'wipers_blinkers_distance', label: 'Explain wipers, blinkers and distance to empty gauge' },
      { key: 'driving_modes', label: 'Explain 3 driving modes - Eco, Normal, Sport' },
      { key: 'regenerative_braking', label: 'Explain regenerative braking and settings' },
    ],
  },
  {
    id: 'accessories',
    title: '8. Accessories',
    icon: 'PackageCheck',
    description: 'Care and use of fitted accessories and pickup location confirmation',
    items: [
      { key: 'acc_care', label: 'Explain use and care of any accessories fitted' },
      { key: 'fitted_accessories_confirmed', label: 'Fitted accessories confirmed with customer' },
      { key: 'pickup_site', label: 'Pickup from BYD location confirmed' },
    ],
  },
  {
    id: 'service_and_support',
    title: '9. Service and Support',
    icon: 'ShieldCheck',
    description: 'Service sticker, online booking, service intervals, and online owner’s manual',
    items: [
      { key: 'service_sticker_online', label: 'Show service sticker, and explain how to book online' },
      { key: 'service_intervals', label: 'Explain service intervals and details' },
      { key: 'online_owners_manual', label: 'Show customer how to view Owner\'s manual online' },
    ],
  },
  {
    id: 'battery_health',
    title: '10. Battery Health',
    icon: 'BatteryCharging',
    description: 'Periodic SOC discharge and AC recharging best practices, and long term storage',
    items: [
      { key: 'soc_discharge_cycle', label: 'Discharging the vehicle to 10-20% State of Charge (SOC) at least once every three to six months, and then fully recharging to 100% using an AC charger.' },
      { key: 'ac_preferred_over_dc', label: 'AC charging is preferable over DC charging, and one single charge up to 100% SOC is preferred over multiple smaller charges.' },
      { key: 'long_term_storage_soc', label: 'If the vehicle is intended not to be used for 3 months or longer, keep the SOC between 40-60% to prevent the battery from over-discharging.' },
    ],
  },
  {
    id: 'customer_experience',
    title: '11. Customer Experience',
    icon: 'Smile',
    description: 'Present gift, handover celebration photo, customer signature, and survey notice',
    items: [
      { key: 'gift_presentation_photo', label: 'Present gift in front of car and ask for permission to take photo of the customer and share on our platforms' },
      { key: 'signature_taken', label: 'Ask for customers signature to take delivery of the vehicle' },
      { key: 'app_survey_feedback', label: 'Explain to the customer that they will receive a survey in their BYD app to share feedback in a month' },
    ],
  },
];

export const inspectionPhotoSlots = [
  { key: 'front', label: 'Front View', sublabel: 'Full front facade, headlights & bumper' },
  { key: 'driver_side', label: 'Driver Side', sublabel: 'Driver side profile, doors & wheels' },
  { key: 'rear', label: 'Rear View', sublabel: 'Tailgate, taillights & rear bumper' },
  { key: 'passenger_side', label: 'Passenger Side', sublabel: 'Passenger side profile, doors & wheels' },
  { key: 'fuel_or_charge', label: 'Fuel / Charge SOC', sublabel: 'Instrument cluster showing odometer & SOC/Fuel' },
  { key: 'environment', label: 'Bay Environment', sublabel: 'Showroom delivery bay & presentation' },
  { key: 'boot_and_gift', label: 'Boot & Gift Pack', sublabel: 'Open boot, welcome pack & handover gift' },
];

