import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { SalesHandoff, SalesHandoffNotifications } from './SalesHandoff';
import { clientsApi } from '../lib/api';

jest.mock('../lib/api', () => ({ clientsApi: { salesChat: jest.fn(), sendSalesChat: jest.fn(), readSalesChat: jest.fn(), handoffNotifications: jest.fn() } }));
jest.mock('../contexts/SiteContext', () => ({ useSite: () => ({ activeSite: 'BYD Fairfield' }) }));
let container, root;
const data = { handoff: { promises: 'Include mats', lead_time: '2 weeks', payment_method: 'Finance', finance_provider: 'Test bank', delivery_notes: 'Call before arrival' }, status: 'new', last_sales_message_id: 'm1',
  messages: [{ id: 'm1', team: 'sales', author_name: 'Sales Consultant', body: 'Can you confirm arrival?', created_at: '2026-11-12T10:00:00Z' }] };
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  jest.clearAllMocks(); clientsApi.salesChat.mockResolvedValue(data); clientsApi.readSalesChat.mockResolvedValue({}); clientsApi.sendSalesChat.mockResolvedValue({});
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function render(node) { await act(async () => { root.render(<MemoryRouter>{node}</MemoryRouter>); }); }

test('Delivery sees all handoff fields and attributed Sales messages; acknowledges only the viewed message', async () => {
  await render(<SalesHandoff clientId="client-1"/>);
  for (const text of ['Include mats','2 weeks','Finance','Test bank','Call before arrival','Sales Consultant','Can you confirm arrival?']) expect(container.textContent).toContain(text);
  expect(clientsApi.readSalesChat).toHaveBeenCalledWith('client-1','m1');
});

test('Delivery sends an internal reply and keeps its text on failed submission', async () => {
  await render(<SalesHandoff clientId="client-1"/>);
  const textarea = container.querySelector('textarea');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(textarea,'Arrival confirmed');
    textarea.dispatchEvent(new Event('input',{bubbles:true}));
  });
  clientsApi.sendSalesChat.mockRejectedValueOnce(new Error('Network failure'));
  await act(async () => { container.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); });
  expect(clientsApi.sendSalesChat).toHaveBeenCalledWith('client-1','Arrival confirmed');
  expect(textarea.value).toBe('Arrival confirmed');
  expect(container.querySelector('[role="alert"]').textContent).toContain('Message was not saved');
  await act(async () => { container.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); });
  expect(textarea.value).toBe('');
});

test('new Sold and unread chat notifications link to the actual customer profile', async () => {
  clientsApi.handoffNotifications.mockResolvedValue([{ id:'client-1',name:'Fixture customer',handoff_status:'new',delivery_unread:0 },{ id:'client-2',name:'Reply customer',delivery_unread:2 }]);
  await render(<SalesHandoffNotifications/>);
  expect(container.textContent).toContain('New Sold deal'); expect(container.textContent).toContain('2 unread');
  expect(container.querySelector('a').getAttribute('href')).toBe('/clients/client-1');
});

test('earlier messages remain visible after a live conversation refresh', async () => {
  clientsApi.salesChat.mockResolvedValue({ ...data, has_more: true });
  await render(<SalesHandoff clientId="client-1"/>);
  clientsApi.salesChat.mockResolvedValueOnce({ ...data, has_more: false, messages: [{ ...data.messages[0], id: 'older', body: 'Original promise from Sales' }] });
  const earlier = [...container.querySelectorAll('button')].find(button => button.textContent === 'Load earlier messages');
  await act(async () => earlier.click());
  expect(clientsApi.salesChat).toHaveBeenCalledWith('client-1', 'm1');
  expect(container.textContent).toContain('Original promise from Sales');
  expect(container.textContent).toContain('Can you confirm arrival?');
  clientsApi.salesChat.mockResolvedValueOnce({ ...data, messages: [{ ...data.messages[0], id: 'm2', body: 'A new live reply' }] });
  await act(async () => window.dispatchEvent(new Event('focus')));
  expect(container.textContent).toContain('Original promise from Sales');
  expect(container.textContent).toContain('Can you confirm arrival?');
  expect(container.textContent).toContain('A new live reply');
  expect(container.querySelectorAll('article')).toHaveLength(3);
});
