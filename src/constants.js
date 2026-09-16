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
    title: '1. Prior to Arrival (Pre-Delivery Vehicle Preparation)',
    icon: 'Sparkles',
    description: 'Vehicle physical preparation and compliance before customer arrives',
    items: [
      { key: 'car_washed_vacuumed_windows', label: 'Car washed, vacuumed & windows clean' },
      { key: 'plates_fitted_securely', label: 'Plates fitted securely & straight' },
      { key: 'build_plate_checked', label: 'Build Plate Checked' },
      { key: 'compliance_plate_checked', label: 'Compliance plate checked' },
      { key: 'roadside_card_in_glovebox', label: 'Roadside assistance card placed in glove box' },
      { key: 'manual_in_glovebox', label: 'Manual in glove box (hard copy or on screen)' },
      { key: 'logbook_manuals_in_vehicle', label: 'Logbook & manuals in vehicle' },
      { key: 'keys_and_emergency_key', label: '2 keys & emergency key' },
      { key: 'floor_mats_fitted', label: 'Floor mats fitted (if applicable)' },
      { key: 'tint_ppf_inspected', label: 'Tint & PPF inspected (if applicable)' },
      { key: 'tyres_pressures_correct', label: 'Tyres checked & pressures correct' },
      { key: 'battery_charged_100_or_fuel', label: 'EV Battery charged to 100% or ICE Fuel topped up' },
      { key: 'software_updated_latest', label: 'System updated to latest software' },
    ],
  },
  {
    id: 'with_customer',
    title: '2. With Customer (Arrival & Introduction)',
    icon: 'Users',
    description: 'Customer greeting, key demonstration and orientation',
    items: [
      { key: 'walk_around_vehicle', label: 'Walk around vehicle with customer' },
      { key: 'point_out_keys_emergency', label: 'Point out 2 keys & emergency key' },
      { key: 'show_lock_unlock', label: 'Show how to lock & unlock vehicle' },
      { key: 'nfc_card_setup_demo', label: 'NFC card setup & demonstration' },
      { key: 'boot_operation_emergency', label: 'Boot operation (including emergency release)' },
      { key: 'explain_tyre_puncture_kit', label: 'Explain tyre inflation kit & puncture repair kit' },
      { key: 'point_out_manual_roadside', label: 'Point out manual in glove box & roadside assistance card' },
    ],
  },
  {
    id: 'exterior',
    title: '3. Exterior Condition Inspection',
    icon: 'Car',
    description: 'Bodywork, wheels, lights, and glass verification',
    items: [
      { key: 'check_bodywork_condition', label: 'Check bodywork condition & paintwork' },
      { key: 'check_rims_tyres_pressures', label: 'Check rims, tyres & tyre pressures' },
      { key: 'check_lights_wipers_mirrors', label: 'Check lights, wipers & mirrors operation' },
      { key: 'inspect_glass_seals_weatherstrips', label: 'Inspect glass, seals & weatherstrips' },
    ],
  },
  {
    id: 'interior',
    title: '4. Interior & Cabin Condition',
    icon: 'Armchair',
    description: 'Cabin cleanliness, seat belts and interior features',
    items: [
      { key: 'cleanliness_trim_condition', label: 'Cleanliness & trim condition' },
      { key: 'floor_mats_seat_protection', label: 'Floor mats & seat protection' },
      { key: 'seat_belts_child_anchors', label: 'Seat belts & ISOFIX child seat anchor points' },
      { key: 'sun_visors_vanity_lights', label: 'Sun visors, vanity mirrors & interior lights' },
    ],
  },
  {
    id: 'seating',
    title: '5. Seating & Ergonomics',
    icon: 'Sliders',
    description: 'Seat controls, folding mechanism and headrests',
    items: [
      { key: 'seat_adjustments_electric', label: 'Seat adjustments (manual / electric)' },
      { key: 'seat_heating_ventilation_memory', label: 'Seat heating / ventilation / memory setup' },
      { key: 'rear_seats_folding_headrests', label: 'Rear seats folding mechanism & headrests' },
    ],
  },
  {
    id: 'technology',
    title: '6. In-Vehicle Technology & Connectivity',
    icon: 'Smartphone',
    description: 'Touchscreen, BYD app pairing, navigation and ADAS',
    items: [
      { key: 'touchscreen_voice_control', label: 'Central touchscreen functions & voice control' },
      { key: 'byd_app_pairing_login', label: 'BYD App pairing & customer login' },
      { key: 'bluetooth_nav_radio_setup', label: 'Bluetooth, navigation & radio setup' },
      { key: 'wireless_charging_usb_ports', label: 'Wireless charging pad & USB ports' },
      { key: 'driver_assistance_adas_acc', label: 'Driver assistance features (ADAS, ACC, Lane Keep)' },
    ],
  },
  {
    id: 'driving',
    title: '7. Driving Operations & Controls',
    icon: 'Gauge',
    description: 'Start procedure, drive modes, regeneration and parking brake',
    items: [
      { key: 'start_stop_gear_selector', label: 'Start / stop procedure & gear selector' },
      { key: 'drive_modes_regen_braking', label: 'Drive modes (Eco, Normal, Sport) & regen braking' },
      { key: 'steering_controls_cluster', label: 'Steering wheel controls & instrument cluster' },
      { key: 'parking_brake_autohold', label: 'Parking brake & Auto-Hold operation' },
    ],
  },
  {
    id: 'accessories',
    title: '8. Fitted Accessories & Extras',
    icon: 'PackageCheck',
    description: 'Verification of all ordered accessories and charging equipment',
    items: [
      { key: 'fitted_accessories_confirmed', label: 'Fitted accessories confirmed with customer' },
      { key: 'optional_extras_demonstrated', label: 'Optional extras explained & demonstrated' },
      { key: 'charging_cable_demonstrated', label: 'Charging cable included & demonstrated (EV/PHEV)' },
      { key: 'v2l_adaptor_handed_over', label: 'V2L adaptor explained & handed over (if applicable)' },
    ],
  },
  {
    id: 'service_and_support',
    title: '9. Service, Warranty & Support',
    icon: 'ShieldCheck',
    description: 'Service intervals, warranty policy and roadside assistance',
    items: [
      { key: 'service_intervals_booking_explained', label: 'Service intervals & booking process explained' },
      { key: 'warranty_terms_coverage_explained', label: 'Warranty terms & coverage explained' },
      { key: 'roadside_assistance_explained', label: 'Roadside assistance procedure explained' },
      { key: 'delivery_satisfaction_confirmed', label: 'Delivery satisfaction confirmed' },
    ],
  },
  {
    id: 'battery_health',
    title: '10. EV / PHEV Battery & Charging Guide',
    icon: 'BatteryCharging',
    description: 'SOC verification, home charging and public charging instructions',
    items: [
      { key: 'soc_confirmed_at_delivery', label: 'State of Charge (SOC) confirmed at delivery' },
      { key: 'charging_instructions_best_practices', label: 'Charging instructions & best practices provided' },
      { key: 'home_public_charging_explained', label: 'Home charging / Public charging network explained' },
    ],
  },
  {
    id: 'customer_experience',
    title: '11. Customer Experience & Celebration',
    icon: 'Smile',
    description: 'Team introduction, handover photo and question resolution',
    items: [
      { key: 'intro_dealership_service_team', label: 'Introduction to dealership team & service dept' },
      { key: 'customer_queries_resolved', label: 'Customer queries answered thoroughly' },
      { key: 'photos_taken_celebration', label: 'Photos taken & handover celebration' },
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

