import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clientsApi } from '../lib/api';
import { useSite } from '../contexts/SiteContext';

const labels = { promises: 'Promises made', lead_time: 'Expected lead time / delivery window', payment_method: 'Payment method', finance_provider: 'Finance / leasing provider', delivery_notes: 'Notes for Delivery' };

export function SalesHandoff({ clientId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true, pending = false;
    setData(null); setBody(''); setError('');
    const refresh = async () => {
      if (pending || document.visibilityState !== 'visible') return;
      pending = true;
      try {
        const response = await clientsApi.salesChat(clientId);
        if (active) {
          setData(response); setError('');
          if (response.status === 'new' || response.unread > 0) await clientsApi.readSalesChat(clientId, response.last_sales_message_id);
        }
      } catch (error) { if (active) setError(error?.response?.data?.detail || 'Sales handoff is unavailable.'); }
      finally { pending = false; }
    };
    void refresh(); const timer = window.setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [clientId]);
  async function send(event) {
    event.preventDefault(); if (busy || !body.trim()) return;
    setBusy(true); setError('');
    try {
      await clientsApi.sendSalesChat(clientId, body.trim()); setBody('');
      setData(await clientsApi.salesChat(clientId));
    } catch (error) { setError(error?.response?.data?.detail || 'Message was not saved.'); }
    finally { setBusy(false); }
  }
  return <section aria-label="Sales handoff" className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
    <h2 className="text-base font-semibold">Sales handoff &amp; team chat</h2>
    <p className="text-sm text-neutral-500">Promises and payment details agreed with the customer, plus private coordination with Sales.</p>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!data && !error && <p className="text-sm text-neutral-500">Loading handoff…</p>}
    {data?.handoff ? <><span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800">{data.status === 'new' ? 'New Sold handoff' : 'Handoff received'}</span><dl className="grid gap-4 sm:grid-cols-2">{Object.entries(labels).map(([key,label]) => <div key={key}><dt className="text-xs font-semibold text-neutral-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{data.handoff[key] || 'Not specified'}</dd></div>)}</dl><p className="text-xs text-neutral-500">Shared by {data.handoff.submitted_by || 'Sales'}{data.handoff.submitted_at ? ` · ${new Date(data.handoff.submitted_at).toLocaleString('en-AU')}` : ''}</p></> : data && <p className="text-sm text-neutral-500">No structured Sales handoff is recorded for this client.</p>}
    <div className="border-t pt-4"><h3 className="text-sm font-semibold">Sales ↔ Delivery chat</h3><p className="mt-1 text-xs text-neutral-500">Internal team messages stay on this customer profile. They are not sent by SMS.</p>
      <div role="log" aria-label="Sales and Delivery messages" aria-live="polite" className="my-4 max-h-80 space-y-3 overflow-y-auto">{data && !data.messages.length && <p className="py-4 text-center text-sm text-neutral-500">No team messages yet.</p>}{(data?.messages || []).map(message => <article key={message.id} className={`rounded-lg p-3 ${message.team === 'delivery' ? 'bg-neutral-50' : 'bg-sky-50'}`}><div className="flex flex-wrap justify-between gap-2 text-xs text-neutral-500"><strong className="text-neutral-800">{message.author_name} · {message.team === 'sales' ? 'Sales' : 'Delivery'}</strong><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString('en-AU')}</time></div><p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p></article>)}</div>
      {data?.linked_to_sales === false && <p className="mb-3 text-sm text-amber-800">Link this client to a CRM customer before messaging Sales.</p>}<form onSubmit={send} className="space-y-2"><label htmlFor="sales-team-message" className="sr-only">Message Sales</label><textarea id="sales-team-message" required maxLength={2000} rows={2} value={body} onChange={event => setBody(event.target.value)} placeholder="Ask Sales a question…" className="w-full rounded-lg border border-neutral-300 p-3 text-sm"/><button disabled={busy || !body.trim() || !data || data.linked_to_sales === false} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? 'Sending…' : 'Send to Sales'}</button></form>
    </div>
  </section>;
}

export function SalesHandoffNotifications() {
  const { activeSite } = useSite();
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let active = true, pending = false; setRows([]);
    const refresh = async () => { if (pending || document.visibilityState !== 'visible') return; pending = true;
      try { const records = await clientsApi.handoffNotifications(); if (active) setRows(records); } catch {} finally { pending = false; }
    };
    void refresh(); const timer = window.setInterval(refresh, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [activeSite]);
  if (!rows.length) return null;
  return <aside aria-label="New Sales handoffs and messages" className="flex flex-wrap items-center gap-3 border-b border-sky-200 bg-sky-50 px-5 py-3 text-sm text-sky-900"><strong>Sales handoffs &amp; messages</strong>{rows.map(row => <Link key={row.id} to={`/clients/${encodeURIComponent(row.id)}`} className="rounded-lg border border-sky-200 bg-white px-3 py-1">{row.name} · {row.delivery_unread ? `${row.delivery_unread} unread` : 'New Sold deal'}</Link>)}</aside>;
}
