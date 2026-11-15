import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { PostDeliverySettings, PostDeliveryClient } from './PostDelivery';
import { postDeliveryApi } from '../lib/api';

jest.mock('../lib/api', () => ({ postDeliveryApi: { settings: jest.fn(), saveSettings: jest.fn(), client: jest.fn() } }));
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ isAdmin: true }) }));
jest.mock('../contexts/SiteContext', () => ({ useSite: () => ({ activeSite: 'BYD Fairfield' }) }));
let container, root;
const settings = { enabled: true, site: 'BYD Fairfield', templates: { delivery_day: 'Hi [First Name], enjoy your [Make] [Model].', sales_followup: 'Call [Customer Name].', day_23: 'Checking in.', survey: 'Survey available.' } };
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  jest.clearAllMocks(); postDeliveryApi.settings.mockResolvedValue(settings); postDeliveryApi.saveSettings.mockImplementation(async value => ({ ...settings, ...value }));
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function render(node) { await act(async () => root.render(node)); }

test('post-delivery settings load and save the actual site sequence and all four templates', async () => {
  await render(<PostDeliverySettings/>);
  expect(container.textContent).toContain('day 23'); expect(container.querySelectorAll('textarea')).toHaveLength(4);
  await act(async () => container.querySelector('input[type="checkbox"]').click());
  await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(postDeliveryApi.saveSettings).toHaveBeenCalledWith({ enabled: false, templates: settings.templates });
  expect(container.querySelector('[role="status"]').textContent).toContain('saved');
});

test('failed settings submission retains the entered templates', async () => {
  postDeliveryApi.saveSettings.mockRejectedValueOnce(new Error('network'));
  await render(<PostDeliverySettings/>);
  await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(container.querySelector('[role="alert"]').textContent).toContain('not saved');
  expect(container.querySelector('textarea').value).toBe(settings.templates.delivery_day);
});

test('customer panel displays sequence status and records opt-outs and private/business classification', async () => {
  postDeliveryApi.client.mockResolvedValue({ eligible: true, enrolled: true, opted_out: false, jobs: [{ step: 'delivery_day', status: 'sent', due_at: '2026-11-15T00:00:00Z' }, { step: 'sales_followup', status: 'pending', due_at: '2026-11-18T00:00:00Z' }] });
  const onChange = jest.fn();
  await render(<PostDeliveryClient client={{ id: 'c1', customer_type: 'Private' }} onChange={onChange}/>);
  expect(container.textContent).toContain('thank-you SMS'); expect(container.textContent).toContain('sent');
  await act(async () => container.querySelector('input[type="checkbox"]').click());
  expect(onChange).toHaveBeenCalledWith({ sms_opt_out: true });
  await act(async () => { const select = container.querySelector('select'); select.value = 'Business'; select.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(onChange).toHaveBeenCalledWith({ customer_type: 'Business' });
});

test('excluded customers are clearly identified without promising an automated send', async () => {
  postDeliveryApi.client.mockResolvedValue({ eligible: false, enrolled: false, opted_out: false, jobs: [] });
  await render(<PostDeliveryClient client={{ id: 'fleet-1', customer_type: 'Business', sale_type: 'Fleet' }} onChange={jest.fn()}/>);
  expect(container.textContent).toContain('Excluded:');
  expect(container.textContent).not.toContain('Starts when');
});
