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
  return body
    .replace(/{{name}}/g, data.name || '')
    .replace(/{{vehicle}}/g, data.vehicle || '')
    .replace(/{{date}}/g, data.date || '')
    .replace(/{{agent}}/g, data.agent || 'the delivery team')
    .replace(/{{rego}}/g, data.rego || '');
};
