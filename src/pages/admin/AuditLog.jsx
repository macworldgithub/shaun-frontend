import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { adminApi } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';

const actionTone = {
  'login.success': 'bg-emerald-100 text-emerald-700',
  'login.failed': 'bg-rose-100 text-rose-700',
  'password.changed': 'bg-blue-100 text-blue-700',
  'user.create': 'bg-violet-100 text-violet-700',
};

export default function AdminAudit() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.audit(300).then((e) => { setEvents(e); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit log</h1>
        <p className="text-neutral-500 mt-1">Recent admin and authentication events.</p>
      </div>
      <Card className="border-neutral-200">
        {loading ? <p className="px-6 py-8 text-sm text-neutral-500 text-center">Loading…</p> : (
          <div className="divide-y divide-neutral-100">
            <div className="hidden md:grid grid-cols-12 px-6 py-3 bg-neutral-50 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <div className="col-span-3">When</div>
              <div className="col-span-3">Actor</div>
              <div className="col-span-2">Action</div>
              <div className="col-span-2">IP</div>
              <div className="col-span-2">Details</div>
            </div>
            {events.length === 0 && <p className="px-6 py-8 text-sm text-neutral-500 text-center">No events yet.</p>}
            {events.map((e) => (
              <div key={e.id} className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-0 px-6 py-3 items-center text-sm">
                <div className="md:col-span-3 text-neutral-600 text-xs">{formatDateTime(e.created_at)}</div>
                <div className="md:col-span-3 truncate">{e.actor_email || <span className="text-neutral-400 italic">anon</span>}</div>
                <div className="md:col-span-2"><Badge className={`${actionTone[e.action] || 'bg-neutral-100 text-neutral-700'} border-0 text-xs`}>{e.action}</Badge></div>
                <div className="md:col-span-2 text-xs text-neutral-500 font-mono truncate">{e.ip || '—'}</div>
                <div className="md:col-span-2 text-xs text-neutral-500 truncate">{e.meta ? Object.entries(e.meta).map(([k, v]) => `${k}: ${v}`).join(', ') : ''}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
