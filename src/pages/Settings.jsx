import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { CheckCircle2 } from 'lucide-react';
import { adminApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);

  const reload = useCallback(async () => {
    try { setTeam(await adminApi.listUsers()); }
    catch (e) {
      // not admin or transient — keep team list empty and log for diagnostics
      console.warn('Settings: could not load team list', e?.response?.status || e?.message);
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-neutral-500 mt-1">Dealership profile, SMS automations and team.</p>
      </div>

      <Card className="border-neutral-200">
        <CardHeader><CardTitle className="text-base font-semibold">Dealership profile</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Dealership name" defaultValue="BYD Melbourne & Fairfield"/>
          <Field label="Brand SMS sender" defaultValue="BYDMELB"/>
          <Field label="Contact email" defaultValue="deliveries@bydmelbourne.com.au"/>
          <Field label="Phone" defaultValue="+61 3 9000 1234"/>
          <Field label="Address" full defaultValue="Melbourne & Fairfield Delivery Centre, VIC"/>
        </CardContent>
      </Card>

      <Card className="border-neutral-200">
        <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2">SMS Messaging <Badge className="bg-emerald-100 text-emerald-700 border-0"><CheckCircle2 className="h-3 w-3 mr-1"/>Active</Badge></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sender ID" defaultValue="BYDMELB"/>
            <Field label="Default country code" defaultValue="+61"/>
          </div>
          <Separator/>
          <SettingRow title="Auto welcome SMS" desc="Send welcome message when a new client is added" defaultChecked/>
          <SettingRow title="Day-before reminder" desc="Send reminder SMS 24h before delivery" defaultChecked/>
          <SettingRow title="Post-delivery follow-up" desc="Send follow-up 7 days after delivery"/>
          <SettingRow title="Notify team on inbound replies" desc="Email the assigned salesperson when a customer replies" defaultChecked/>
        </CardContent>
      </Card>

      {team.length > 0 && (
        <Card className="border-neutral-200">
          <CardHeader><CardTitle className="text-base font-semibold">Team</CardTitle></CardHeader>
          <CardContent className="divide-y divide-neutral-100">
            {team.map((u) => (
              <div key={u.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="h-9 w-9 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center">{u.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{u.name}</p>
                  <p className="text-xs text-neutral-500 capitalize">{u.role.replace('_', ' ')} · {u.email}</p>
                </div>
                <Badge variant="outline" className="text-xs">{u.active ? 'Active' : 'Inactive'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, defaultValue, full, readOnly }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <Label className="text-xs font-semibold text-neutral-700 mb-1.5 block">{label}</Label>
      <Input defaultValue={defaultValue} readOnly={readOnly} className={readOnly ? 'bg-neutral-50' : ''}/>
    </div>
  );
}

function SettingRow({ title, desc, defaultChecked }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-neutral-500">{desc}</p>
      </div>
      <Switch defaultChecked={defaultChecked}/>
    </div>
  );
}
