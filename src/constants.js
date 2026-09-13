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
