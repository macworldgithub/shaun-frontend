// Lightweight in-memory store for the frontend mock phase.
// Persists to localStorage so interactions feel real.
//
// SECURITY NOTE: This is intentional during the mock/demo phase. localStorage
// is acceptable here because the data set is non-sensitive demo content and
// no auth tokens are stored. Before production this entire layer is migrated
// to the backend (FastAPI + MongoDB), which is the next planned milestone.
// At that point, sensitive customer fields will live server-side and the
// frontend will hold only short-lived session state in memory.
import { mockClients, mockMessages, mockTemplates, mockTeamNotes } from './mock';

const KEYS = {
  clients: 'vd_clients',
  messages: 'vd_messages',
  templates: 'vd_templates',
  notes: 'vd_notes'
};

const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) { return fallback; }
};

const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export const initStore = () => {
  if (!localStorage.getItem(KEYS.clients)) save(KEYS.clients, mockClients);
  if (!localStorage.getItem(KEYS.messages)) save(KEYS.messages, mockMessages);
  if (!localStorage.getItem(KEYS.templates)) save(KEYS.templates, mockTemplates);
  if (!localStorage.getItem(KEYS.notes)) save(KEYS.notes, mockTeamNotes);
};

export const getClients = () => load(KEYS.clients, mockClients);
export const setClients = (v) => save(KEYS.clients, v);
export const getMessages = () => load(KEYS.messages, mockMessages);
export const setMessages = (v) => save(KEYS.messages, v);
export const getTemplates = () => load(KEYS.templates, mockTemplates);
export const setTemplates = (v) => save(KEYS.templates, v);
export const getNotes = () => load(KEYS.notes, mockTeamNotes);
export const setNotes = (v) => save(KEYS.notes, v);

export const upsertClient = (client) => {
  const all = getClients();
  const idx = all.findIndex(c => c.id === client.id);
  if (idx >= 0) all[idx] = client; else all.unshift(client);
  setClients(all);
  return all;
};

export const removeClient = (id) => {
  const all = getClients().filter(c => c.id !== id);
  setClients(all);
  return all;
};

export const addMessage = (msg) => {
  const all = [msg, ...getMessages()];
  setMessages(all);
  return all;
};

export const addNote = (note) => {
  const all = [note, ...getNotes()];
  setNotes(all);
  return all;
};
