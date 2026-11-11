import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation, Routes, Route } from 'react-router-dom';
import Deliveries from './Deliveries';
import AdminUsers from './admin/Users';
import ClientDetail from './ClientDetail';
import { BookingEditor } from '../components/BookingFields';
import { clientsApi, adminApi, smsApi, templatesApi, staffApi, contractorApi } from '../lib/api';
import { localDateKey } from '../lib/deliveryBooking';
import { toast } from 'sonner';

// The first Radix dialog render can exceed Jest's five-second default on Windows.
jest.setTimeout(30000);

jest.mock('../lib/api', () => ({
  clientsApi: { summary: jest.fn(), slots: jest.fn(), update: jest.fn(), get: jest.fn(), offerMatches: jest.fn() },
  adminApi: { listUsers: jest.fn() }, smsApi: { list: jest.fn() }, templatesApi: { list: jest.fn() },
  staffApi: { list: jest.fn() }, contractorApi: { listJobsForClient: jest.fn() },
}));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: { email: 'fixture@example.com' }, isSuper: false }) }));
jest.mock('../contexts/SiteContext', () => ({ useSite: () => ({ activeSite: 'BYD Caroline Springs', setActiveSite: jest.fn(), siteLocations: ['BYD Caroline Springs'], filterClientsBySite: (clients) => clients }) }));

let container, root;
const current = new Date();
const day = localDateKey(new Date(current.getFullYear(), current.getMonth(), 15));
const customer = (id, type = 'estimated') => ({ id, name: `Customer ${id}`, phone: '+61499918523',
  vehicle: 'BYD Seal', delivery_date: day, delivery_time: type === 'confirmed' ? '09:30' : '',
  booking_type: type, stage: 'Scheduled', site_location: 'BYD Caroline Springs' });

function Location() { return <p data-testid="location">{useLocation().search}</p>; }
async function render(component, initialEntries = ['/']) {
  await act(async () => { root.render(<MemoryRouter initialEntries={initialEntries}>{component}<Location /></MemoryRouter>); });
}
async function click(element) {
  expect(element).toBeTruthy();
  await act(async () => { element.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
}

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  jest.clearAllMocks();
  clientsApi.summary.mockResolvedValue([customer('1', 'confirmed'), customer('2'), customer('3'), customer('4')]);
  clientsApi.slots.mockResolvedValue({ slots: [{ time: '09:30', available: false }, { time: '10:00', available: true }] });
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

test('calendar summary opens every customer, including hidden fourth delivery', async () => {
  await render(<Deliveries />);
  const summary = container.querySelector(`[aria-label="Summary for ${day}"]`);
  expect(summary.textContent).toBe('3 est / 1 confirmed');
  await click(summary);
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog.textContent).toContain('Customer 4');
  expect(dialog.textContent).toContain('Confirmed');
  expect(dialog.querySelector('[aria-label="09:30 booked"]').disabled).toBe(true);
  expect(clientsApi.summary.mock.calls[0][0].date_from).toBe(localDateKey(new Date(current.getFullYear(), current.getMonth(), 1)));
});

test('empty day opens and an available slot starts a confirmed booking', async () => {
  await render(<Deliveries />);
  const emptyDay = localDateKey(new Date(current.getFullYear(), current.getMonth(), 16));
  await click(container.querySelector(`[aria-label="Open deliveries for ${emptyDay}"]`));
  expect(document.querySelector('[role="dialog"]').textContent).toContain('No deliveries booked');
  await click(document.querySelector('[aria-label="10:00 available"]'));
  expect(container.querySelector('[data-testid="location"]').textContent).toBe(`?new=1&date=${emptyDay}&time=10:00&booking_type=confirmed`);
});

test('calendar load failure displays a retry and recovers', async () => {
  clientsApi.summary.mockRejectedValueOnce(new Error('network'));
  await render(<Deliveries />);
  expect(container.querySelector('[role="alert"]').textContent).toContain('Could not load');
  await click([...container.querySelectorAll('button')].find((button) => button.textContent === 'Retry'));
  expect(container.querySelector('[role="alert"]')).toBeNull();
});

test('booking editor keeps occupied slots disabled and saves selected confirmation', async () => {
  const onSave = jest.fn().mockResolvedValue({});
  await render(<BookingEditor client={customer('1')} onSave={onSave} />);
  expect(container.querySelector('option[value="09:30"]').disabled).toBe(true);
  await click(container.querySelector('input[value="confirmed"]'));
  const select = container.querySelector('[aria-label="Preferred time"]');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, '10:00');
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await click([...container.querySelectorAll('button')].find((button) => button.textContent === 'Save booking'));
  expect(onSave).toHaveBeenCalledWith({ booking_type: 'confirmed', delivery_date: day, delivery_time: '10:00' });
});

test('confirmation without a time is rejected locally', async () => {
  const onSave = jest.fn();
  await render(<BookingEditor client={customer('1')} onSave={onSave} />);
  await click(container.querySelector('input[value="confirmed"]'));
  await click([...container.querySelectorAll('button')].find((button) => button.textContent === 'Save booking'));
  expect(onSave).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledWith('Choose a date and time to confirm this booking');
});

test('a booking conflict refreshes availability and clears the contested time', async () => {
  const onSave = jest.fn().mockRejectedValue({ response: { status: 409, data: { detail: 'Choose another time' } } });
  await render(<BookingEditor client={customer('1', 'confirmed')} onSave={onSave} />);
  await click([...container.querySelectorAll('button')].find((button) => button.textContent === 'Save booking'));
  expect(toast.error).toHaveBeenCalledWith('Choose another time');
  expect(clientsApi.slots).toHaveBeenCalledTimes(2);
  expect(container.querySelector('[aria-label="Preferred time"]').value).toBe('');
});

test('team search finds roles beyond the first page and shows empty results', async () => {
  adminApi.listUsers.mockResolvedValue(Array.from({ length: 20 }, (_, index) => ({
    id: String(index), name: `Member ${index}`, email: `member${index}@example.com`, active: true,
    role: index === 19 ? 'delivery_specialist' : 'delivery_consultant', active_site: 'Caroline Springs',
  })));
  await render(<AdminUsers />);
  expect(container.textContent).not.toContain('Member 19');
  const search = container.querySelector('[aria-label="Search team and permissions"]');
  const searchFor = async (text) => { await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(search, text);
    search.dispatchEvent(new Event('input', { bubbles: true }));
  }); };
  await searchFor('Manager Caroline');
  expect(container.textContent).toContain('Member 19');
  expect(container.textContent).toContain('1 matching team member.');
  await searchFor('no-such-user');
  expect(container.textContent).toContain('No team members match your search.');
});

test('customer details load before SMS history and late responses preserve an edit', async () => {
  let resolveMessages;
  smsApi.list.mockImplementation(() => new Promise((resolve) => { resolveMessages = resolve; }));
  clientsApi.get.mockResolvedValue({ ...customer('fixture-client'), documents: [], accessories: [], comments: [], aftermarket_notes: 'Original notes' });
  clientsApi.offerMatches.mockResolvedValue([]);
  templatesApi.list.mockResolvedValue([]);
  staffApi.list.mockResolvedValue([]);
  contractorApi.listJobsForClient.mockResolvedValue([]);
  await render(<Routes><Route path="/clients/:id" element={<ClientDetail />} /></Routes>, ['/clients/fixture-client']);
  expect(container.querySelector('h1').textContent).toBe('Customer fixture-client');
  const notes = container.querySelector('textarea[placeholder="Anything still to be ordered or fitted…"]');
  expect(notes.value).toBe('Original notes');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(notes, 'In-progress edit');
    notes.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => { resolveMessages([]); });
  expect(notes.value).toBe('In-progress edit');
});
