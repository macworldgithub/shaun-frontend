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

export const checklistItems = [
  { id: 'ck1', label: 'Pre-delivery inspection completed' },
  { id: 'ck2', label: 'Detailing & wash finished' },
  { id: 'ck3', label: 'Plates & registration fitted' },
  { id: 'ck4', label: 'Accessories installed' },
  { id: 'ck5', label: 'Owner manual & service book in vehicle' },
  { id: 'ck6', label: 'Fuel topped up / battery charged' },
  { id: 'ck7', label: 'Handover paperwork prepared' },
  { id: 'ck8', label: 'Customer notified via SMS' },
];
