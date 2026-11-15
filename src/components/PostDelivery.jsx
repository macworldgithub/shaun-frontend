import React, { useEffect, useState } from 'react';
import { postDeliveryApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';

const labels = { delivery_day: 'Delivery day · thank-you SMS', sales_followup: 'Day 3 · salesperson call reminder', day_23: 'Day 23 · follow-up SMS', survey: 'Day 31 · survey SMS' };
const inputClass = 'mt-1 w-full rounded-lg border border-neutral-300 bg-white p-2 text-sm';

export function PostDeliverySettings() {
  const { isAdmin } = useAuth();
  const { activeSite } = useSite();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true; setData(null); setError(''); setSaved(false);
    if (activeSite === 'All Sites') return;
    postDeliveryApi.settings().then(value => { if (active) setData(value); }).catch(() => { if (active) setError('Unable to load post-delivery settings.'); });
    return () => { active = false; };
  }, [activeSite]);
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setSaved(false);
    try { const result = await postDeliveryApi.saveSettings({ enabled: data.enabled, templates: data.templates }); setData(result); setSaved(true); }
    catch (error) { setError(error?.response?.data?.detail || 'Settings were not saved.'); }
    finally { setBusy(false); }
  }
  return <section aria-label="Post-delivery sequence settings" className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
    <h2 className="text-base font-semibold">Private customer post-delivery sequence</h2>
    <p className="text-sm text-neutral-500">Thank-you on delivery day, a salesperson call reminder on day 3, follow-up SMS on day 23 and a survey SMS on day 31. Fleet, demo and business customers are excluded.</p>
    {activeSite === 'All Sites' ? <p className="text-sm">Select a dealership to view its settings.</p> : <>
      {error && <p role="alert" className="text-sm text-red-700">{typeof error === 'string' ? error : 'Check your template values.'}</p>}
      {saved && <p role="status" className="text-sm text-emerald-700">Post-delivery settings saved.</p>}
      {!data && !error && <p className="text-sm text-neutral-500">Loading settings…</p>}
      {data && <form onSubmit={save} className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" disabled={!isAdmin || busy} checked={data.enabled} onChange={event => { setSaved(false); setData({ ...data, enabled: event.target.checked }); }}/>Sequence enabled for {activeSite}</label>
        <p className="text-xs text-neutral-500">New deliveries only. Customer opt-outs are respected. Placeholders: [First Name], [Customer Name], [Make], [Model].</p>
        {Object.entries(labels).map(([key, label]) => <label key={key} className="block text-sm font-medium">{label}<textarea rows={4} required maxLength={600} disabled={!isAdmin || busy} value={data.templates[key]} onChange={event => { setSaved(false); setData({ ...data, templates: { ...data.templates, [key]: event.target.value } }); }} className={inputClass}/></label>)}
        {isAdmin && <button disabled={busy} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save post-delivery settings'}</button>}
      </form>}
    </>}
  </section>;
}

export function PostDeliveryClient({ client, onChange }) {
  const [sequence, setSequence] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function update(fields) {
    if (saving) return;
    setSaving(true); setError('');
    try { await onChange(fields); }
    catch { setError('Customer communication settings were not saved. Please retry.'); }
    finally { setSaving(false); }
  }
  useEffect(() => {
    let active = true;
    const load = async () => { try { const value = await postDeliveryApi.client(client.id); if (active) { setSequence(value); setError(''); } } catch { if (active) setError('Sequence status is unavailable.'); } };
    setSequence(null); void load(); const timer = window.setInterval(load, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [client.id, client.stage, client.customer_type, client.sms_opt_out]);
  return <section aria-label="Customer post-delivery communications" className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
    <h2 className="text-base font-semibold">Post-delivery communications</h2>
    <p className="text-sm text-neutral-500">Private customers receive delivery-day, day-23 and day-31 texts. Their salesperson receives a day-3 CRM reminder.</p>
    <label className="block text-sm">Customer type<select aria-label="Customer type" disabled={saving} value={client.customer_type || 'Private'} onChange={event => update({ customer_type: event.target.value })} className={inputClass}><option>Private</option><option>Business</option></select></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={saving} checked={!!client.sms_opt_out} onChange={event => update({ sms_opt_out: event.target.checked })}/>Customer has opted out of SMS</label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {sequence && <>
      {!sequence.eligible && <p className="text-sm text-neutral-600">Excluded: this sequence is for private customers and excludes fleet, demo and business sales.</p>}
      {sequence.eligible && !sequence.enrolled && <p className="text-sm text-neutral-600">Starts when this customer is newly marked Delivered. Previously delivered records are not enrolled automatically.</p>}
      {sequence.opted_out && <p className="text-sm text-amber-800">Customer SMS is blocked by an opt-out.</p>}
      {!!sequence.jobs.length && <ul className="divide-y divide-neutral-100">{sequence.jobs.map(job => <li key={job.step} className="py-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{labels[job.step]}</strong><span className="capitalize">{job.status}</span></div><p className="mt-1 text-xs text-neutral-500">{new Date(job.due_at).toLocaleString('en-AU')}{job.reason ? ` · ${job.reason}` : ''}</p></li>)}</ul>}
    </>}
  </section>;
}
