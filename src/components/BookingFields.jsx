import React, { useEffect, useState } from 'react';
import { clientsApi } from '../lib/api';
import { Button } from './ui/button';
import { toast } from 'sonner';

export default function BookingFields({ value, onChange, refreshKey = 0 }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const { delivery_date: day, site_location: site, id } = value;
  useEffect(() => {
    let active = true;
    setSlots([]); setError(''); setLoading(false);
    if (!day || !site || site === 'All Sites') return;
    setLoading(true);
    clientsApi.slots({ day, site_location: site, exclude_client_id: id }).then((result) => {
      if (active) setSlots(result.slots);
    }).catch(() => { if (active) setError('Could not load available times.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [day, site, id, revision, refreshKey]);
  return <fieldset className="space-y-3 min-w-0">
    <legend className="text-sm font-semibold mb-2">Delivery booking</legend>
    <div className="flex flex-wrap gap-4">
      {[['estimated', 'Estimated delivery booking'], ['confirmed', 'Confirmed booking']].map(([type, label]) =>
        <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="radio" name={`booking-type-${id || 'new'}`} value={type} checked={(value.booking_type || 'estimated') === type}
            onChange={() => onChange({ ...value, booking_type: type })} />{label}
        </label>)}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="text-xs font-semibold">Delivery date
        <input aria-label="Delivery date" type="date" className="mt-1 block w-full rounded-md border p-2 bg-white"
          value={day || ''} onChange={(e) => onChange({ ...value, delivery_date: e.target.value, delivery_time: '' })} />
      </label>
      <label className="text-xs font-semibold">Preferred time (site local)
        <select aria-label="Preferred time" className="mt-1 block w-full rounded-md border p-2 bg-white"
          disabled={!day || loading || !!error} value={value.delivery_time || ''}
          onChange={(e) => onChange({ ...value, delivery_time: e.target.value })}>
          <option value="">{loading ? 'Loading times…' : 'Choose a time'}</option>
          {slots.map((slot) => <option key={slot.time} value={slot.time} disabled={!slot.available}>
            {slot.time}{!slot.available ? ' — booked' : ''}
          </option>)}
        </select>
      </label>
    </div>
    {!day && <p className="text-xs text-neutral-500">Select a date to see available half-hour slots, 08:00–17:30.</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error} <button type="button" className="underline" onClick={() => setRevision((n) => n + 1)}>Retry</button></p>}
    <p className="text-xs text-neutral-500">Confirmed bookings reserve a time. Estimated bookings remain provisional.</p>
  </fieldset>;
}

export function BookingEditor({ client, onSave }) {
  const [draft, setDraft] = useState(client);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => { setDraft(client); }, [client]);
  const save = async () => {
    if (draft.booking_type === 'confirmed' && (!draft.delivery_date || !draft.delivery_time)) {
      toast.error('Choose a date and time to confirm this booking'); return;
    }
    setSaving(true);
    try {
      await onSave({ booking_type: draft.booking_type || 'estimated', delivery_date: draft.delivery_date || null, delivery_time: draft.delivery_time || null });
      toast.success('Delivery booking saved');
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Could not save booking');
      if (error?.response?.status === 409) {
        setDraft((current) => ({ ...current, delivery_time: '' }));
        setRefreshKey((current) => current + 1);
      }
    }
    finally { setSaving(false); }
  };
  return <div className="space-y-3"><BookingFields value={draft} onChange={setDraft} refreshKey={refreshKey} />
    <Button type="button" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save booking'}</Button>
  </div>;
}
