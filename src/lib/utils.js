import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const stageClass = (stage) => {
  const map = {
    'Scheduled': 'stage-scheduled',
    'Pre-Delivery Inspection': 'stage-pdi',
    'In Transit': 'stage-transit',
    'Ready for Pickup': 'stage-ready',
    'Delivered': 'stage-delivered'
  };
  return map[stage] || 'stage-scheduled';
};

export const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
};

export const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const renderTemplate = (body, data) => {
  if (!body) return '';
  let out = body;
  const site = data.site_name || localStorage.getItem('active_site') || 'Fairfield';
  const defaults = {
    name: data.name || '',
    customer_name: data.name || '',
    vehicle: data.vehicle || '',
    date: data.date || '',
    agent: data.agent || 'the delivery team',
    rego: data.rego || '',
    site_name: site,
    site_address: data.site_address || `${site} Delivery Centre`,
    site_phone: data.site_phone || '+61 3 9000 1234',
  };

  Object.entries(defaults).forEach(([key, val]) => {
    out = out.replaceAll(`{{${key}}}`, val).replaceAll(`{${key}}`, val);
  });
  return out;
};

export const getReadinessDetails = (client) => {
  if (!client) {
    return {
      isReady: false,
      payment: false,
      tradeInDocs: false,
      pdi: false,
      registrationDocs: false,
      hasTradeIn: false,
      count: 0,
      total: 4,
    };
  }

  const hasTradeIn = Boolean(client.trade_in_flag || client.trade_in_attached);
  const payment = Boolean(client.payment_complete);
  const tradeInDocs = !hasTradeIn || Boolean(
    client.trade_in_docs_complete ||
    ['Settled', 'Accepted', 'Vehicle received', 'Valid'].includes(client.trade_in_status)
  );
  const pdi = Boolean(
    client.pdi_complete ||
    client.stage === 'Ready for Pickup' ||
    client.stage === 'Delivered'
  );
  const registrationDocs = Boolean(
    client.registration_docs_complete ||
    client.registration_status === 'Complete' ||
    client.document_completeness === 'Complete'
  );

  const checks = [payment, tradeInDocs, pdi, registrationDocs];
  const count = checks.filter(Boolean).length;
  const isReady = count === 4;

  return {
    isReady,
    payment,
    tradeInDocs,
    pdi,
    registrationDocs,
    hasTradeIn,
    count,
    total: 4,
  };
};

