// Mock data for the Vehicle Delivery Agent platform

export const mockStats = {
  scheduledToday: 7,
  pendingHandover: 12,
  completedThisWeek: 23,
  smsSentThisMonth: 184,
};

export const mockClients = [
  {
    id: 'c1',
    name: 'James Whitaker',
    phone: '+61412345001',
    email: 'james.w@email.com',
    vehicle: '2025 Toyota RAV4 Hybrid',
    rego: 'YEW-481',
    vin: 'JTMRWRFV5ND123456',
    deliveryDate: '2025-07-18',
    stage: 'Scheduled',
    salesperson: 'Michael Chen',
    notes: 'Customer prefers afternoon delivery. Wants tutorial on hybrid system.',
    createdAt: '2025-07-08'
  },
  {
    id: 'c2',
    name: 'Priya Sharma',
    phone: '+61412345002',
    email: 'priya.sharma@email.com',
    vehicle: '2025 Mazda CX-5 GT',
    rego: 'BHK-209',
    vin: 'JM3KFBDM5N1500999',
    deliveryDate: '2025-07-17',
    stage: 'Pre-Delivery Inspection',
    salesperson: 'Sarah Johnson',
    notes: 'Trade-in to be collected at delivery. Tinted windows requested.',
    createdAt: '2025-07-05'
  },
  {
    id: 'c3',
    name: 'David Nguyen',
    phone: '+61412345003',
    email: 'd.nguyen@email.com',
    vehicle: '2025 Ford Ranger Wildtrak',
    rego: '1MX-7QN',
    vin: '6FPPXXMJ2PNL45678',
    deliveryDate: '2025-07-17',
    stage: 'Ready for Pickup',
    salesperson: 'Michael Chen',
    notes: 'Tow bar fitted. Floor mats included.',
    createdAt: '2025-07-02'
  },
  {
    id: 'c4',
    name: 'Olivia Bennett',
    phone: '+61412345004',
    email: 'olivia.b@email.com',
    vehicle: '2025 Hyundai Tucson Highlander',
    rego: 'CTR-668',
    vin: 'KMHJ5814DPU789012',
    deliveryDate: '2025-07-19',
    stage: 'Scheduled',
    salesperson: 'Sarah Johnson',
    notes: 'First-time buyer. Walk her through service plan.',
    createdAt: '2025-07-09'
  },
  {
    id: 'c5',
    name: 'Marcus O\'Brien',
    phone: '+61412345005',
    email: 'marcus.ob@email.com',
    vehicle: '2025 Kia Sportage GT-Line',
    rego: 'SPK-114',
    vin: 'KNDPXCAC4P7345678',
    deliveryDate: '2025-07-16',
    stage: 'Delivered',
    salesperson: 'Tom Reilly',
    notes: 'Delivered. Follow-up scheduled in 7 days.',
    createdAt: '2025-06-29'
  },
  {
    id: 'c6',
    name: 'Aisha Patel',
    phone: '+61412345006',
    email: 'aisha.p@email.com',
    vehicle: '2025 Tesla Model Y Long Range',
    rego: 'EVX-902',
    vin: '7SAYGDEE5PA112233',
    deliveryDate: '2025-07-20',
    stage: 'In Transit',
    salesperson: 'Tom Reilly',
    notes: 'Awaiting plate fitment. Customer wants supercharger walkthrough.',
    createdAt: '2025-07-04'
  },
  {
    id: 'c7',
    name: 'Liam Foster',
    phone: '+61412345007',
    email: 'liam.foster@email.com',
    vehicle: '2025 Subaru Outback Touring',
    rego: 'OBK-555',
    vin: 'JF2SKAUC1NH998877',
    deliveryDate: '2025-07-18',
    stage: 'Pre-Delivery Inspection',
    salesperson: 'Sarah Johnson',
    notes: 'Roof racks installed. Highlight EyeSight features.',
    createdAt: '2025-07-07'
  },
  {
    id: 'c8',
    name: 'Grace Thompson',
    phone: '+61412345008',
    email: 'g.thompson@email.com',
    vehicle: '2025 BMW X3 xDrive30i',
    rego: 'BMW-031',
    vin: 'WBX73DP07P5667788',
    deliveryDate: '2025-07-21',
    stage: 'Scheduled',
    salesperson: 'Michael Chen',
    notes: 'VIP customer. Champagne handover requested.',
    createdAt: '2025-07-10'
  }
];

export const deliveryStages = [
  'Scheduled',
  'Pre-Delivery Inspection',
  'In Transit',
  'Ready for Pickup',
  'Delivered'
];

export const mockTemplates = [
  {
    id: 't1',
    name: 'Welcome & Confirmation',
    body: 'Hi {{name}}, this is {{agent}} from the delivery team. Congrats on your new {{vehicle}}! Your delivery is booked for {{date}}. Reply to this message anytime if you have questions.',
    category: 'Welcome'
  },
  {
    id: 't2',
    name: 'Day-Before Reminder',
    body: 'Hi {{name}}, a friendly reminder your {{vehicle}} delivery is tomorrow ({{date}}). Please bring your driver licence and proof of insurance. See you soon!',
    category: 'Reminder'
  },
  {
    id: 't3',
    name: 'Ready for Pickup',
    body: 'Great news {{name}}! Your {{vehicle}} has passed inspection and is ready for pickup. Please confirm your preferred time on {{date}}.',
    category: 'Status'
  },
  {
    id: 't4',
    name: 'Post-Delivery Follow-up',
    body: 'Hi {{name}}, hope you\'re loving your new {{vehicle}}! Any questions, just reply here. We\'d love a quick Google review if you have a moment.',
    category: 'Follow-up'
  },
  {
    id: 't5',
    name: 'Delay Notice',
    body: 'Hi {{name}}, quick update — your {{vehicle}} delivery has been pushed to {{date}} due to logistics. Apologies for the inconvenience. Reply to discuss.',
    category: 'Status'
  },
  {
    id: 't6',
    name: 'Internal Handover',
    body: 'Team: {{name}}\'s {{vehicle}} ({{rego}}) is at PDI stage. Any outstanding accessories should be flagged before EOD.',
    category: 'Internal'
  }
];

export const mockMessages = [
  {
    id: 'm1',
    clientId: 'c1',
    clientName: 'James Whitaker',
    phone: '+61412345001',
    body: 'Hi James, this is Michael from the delivery team. Congrats on your new 2025 Toyota RAV4 Hybrid! Your delivery is booked for Friday 18 July.',
    direction: 'outbound',
    status: 'Delivered',
    sentAt: '2025-07-12T09:14:00'
  },
  {
    id: 'm2',
    clientId: 'c1',
    clientName: 'James Whitaker',
    phone: '+61412345001',
    body: 'Awesome thanks! Can we make it 3pm instead?',
    direction: 'inbound',
    status: 'Received',
    sentAt: '2025-07-12T09:42:00'
  },
  {
    id: 'm3',
    clientId: 'c3',
    clientName: 'David Nguyen',
    phone: '+61412345003',
    body: 'Great news David! Your Ford Ranger Wildtrak has passed inspection and is ready for pickup.',
    direction: 'outbound',
    status: 'Delivered',
    sentAt: '2025-07-15T11:02:00'
  },
  {
    id: 'm4',
    clientId: 'c5',
    clientName: "Marcus O'Brien",
    phone: '+61412345005',
    body: 'Hi Marcus, hope you\'re loving your new Kia Sportage GT-Line! Any questions just reply here.',
    direction: 'outbound',
    status: 'Delivered',
    sentAt: '2025-07-16T15:30:00'
  }
];

export const mockTeamNotes = [
  {
    id: 'n1',
    clientId: 'c2',
    author: 'Michael Chen',
    role: 'Sales Manager',
    note: 'Trade-in valuation finalised at $18,500. Logbook handed over. Please verify before PDI sign-off.',
    createdAt: '2025-07-14T08:30:00'
  },
  {
    id: 'n2',
    clientId: 'c6',
    author: 'Tom Reilly',
    role: 'Delivery Agent',
    note: 'Plate fitment delayed by supplier. ETA Wed afternoon. Will SMS customer once confirmed.',
    createdAt: '2025-07-15T13:10:00'
  },
  {
    id: 'n3',
    clientId: 'c8',
    author: 'Sarah Johnson',
    role: 'Sales Consultant',
    note: 'VIP handover — coordinate with reception for the champagne and detailing crew Friday morning.',
    createdAt: '2025-07-15T16:45:00'
  }
];

export const mockTeam = [
  { id: 'u1', name: 'Michael Chen', role: 'Sales Manager', initials: 'MC' },
  { id: 'u2', name: 'Sarah Johnson', role: 'Sales Consultant', initials: 'SJ' },
  { id: 'u3', name: 'Tom Reilly', role: 'Delivery Agent', initials: 'TR' },
  { id: 'u4', name: 'Amelia Brooks', role: 'Service Liaison', initials: 'AB' }
];

export const checklistItems = [
  { id: 'ck1', label: 'Pre-delivery inspection completed' },
  { id: 'ck2', label: 'Detailing & wash finished' },
  { id: 'ck3', label: 'Plates & registration fitted' },
  { id: 'ck4', label: 'Accessories installed' },
  { id: 'ck5', label: 'Owner manual & service book in vehicle' },
  { id: 'ck6', label: 'Fuel topped up / battery charged' },
  { id: 'ck7', label: 'Handover paperwork prepared' },
  { id: 'ck8', label: 'Customer notified via SMS' }
];
