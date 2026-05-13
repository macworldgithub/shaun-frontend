import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Phone, Sparkles, MapPin, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { clientsApi, adminApi } from '../lib/api';
import { deliveryStages, contactStatuses } from '../constants';
import { stageClass, formatDate } from '../lib/utils';
import { toast } from 'sonner';
import ImportFromVYDialog from '../components/ImportFromVYDialog';

const empty = { name: '', phone: '', email: '', vehicle: '', rego: '', vin: '', delivery_date: '', stage: 'Scheduled', salesperson: '', notes: '', location: '', address: '' };

const contactBadge = {
  'Not Contacted': 'bg-rose-100 text-rose-700',
  'Contacted': 'bg-emerald-100 text-emerald-700',
  'Awaiting Reply': 'bg-amber-100 text-amber-700',
  'Booked': 'bg-blue-100 text-blue-700',
};

export default function Clients() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [contactFilter, setContactFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const list = await clientsApi.list({});
    setClients(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    adminApi.listUsers().then((u) => setAgents(u.filter((x) => x.active))).catch(() => {});
  }, [reload]);

  useEffect(() => {
    if (params.get('new') === '1') { setOpen(true); params.delete('new'); setParams(params); }
  }, [params, setParams]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter((c) => {
      const matches = !q || c.name.toLowerCase().includes(q) || c.vehicle.toLowerCase().includes(q) || (c.rego || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
      const stageOk = stageFilter === 'All' || c.stage === stageFilter;
      const contactOk = contactFilter === 'All' || c.contact_status === contactFilter;
      const agentOk = agentFilter === 'All' ||
        (agentFilter === 'Unassigned' ? !c.assigned_agent_id : c.assigned_agent_id === agentFilter);
      return matches && stageOk && contactOk && agentOk;
    });
  }, [clients, search, stageFilter, contactFilter, agentFilter]);

  const agentMap = useMemo(() => {
    const m = {};
    agents.forEach((a) => { m[a.id] = a.name; });
    return m;
  }, [agents]);

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.vehicle) { toast.error('Name, phone and vehicle are required'); return; }
    setBusy(true);
    try {
      await clientsApi.create(form);
      toast.success(`${form.name} added to deliveries`);
      setOpen(false); setForm(empty);
      reload();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Could not save');
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-neutral-500 mt-1">{clients.length} customers in your delivery pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-1.5 border-neutral-300">
            <Sparkles className="h-4 w-4 text-[#E11B22]"/> Import from VY
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#E11B22] hover:bg-[#B81319] text-white"><Plus className="h-4 w-4 mr-1.5"/> Add client</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>New delivery client</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Mobile (E.164)"><Input placeholder="+61412345678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Vehicle"><Input placeholder="BYD Atto 3" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} /></Field>
                <Field label="Rego"><Input value={form.rego} onChange={(e) => setForm({ ...form, rego: e.target.value })} /></Field>
                <Field label="Location"><Input placeholder="Suburb, VIC" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
                <Field label="Delivery date"><Input type="date" value={form.delivery_date || ''} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} /></Field>
                <Field label="Stage">
                  <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{deliveryStages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Salesperson" full><Input value={form.salesperson} onChange={(e) => setForm({ ...form, salesperson: e.target.value })} /></Field>
                <Field label="Notes" full><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={busy} className="bg-[#E11B22] hover:bg-[#B81319] text-white">Save client</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ImportFromVYDialog open={importOpen} onOpenChange={setImportOpen} onImported={reload} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Search by name, vehicle or rego…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white" />
        </div>
        <Select value={contactFilter} onValueChange={setContactFilter}>
          <SelectTrigger className="w-44 bg-white"><SelectValue placeholder="Contact status"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All contact</SelectItem>
            {contactStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-44 bg-white"><SelectValue placeholder="Agent"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All agents</SelectItem>
            <SelectItem value="Unassigned">Unassigned</SelectItem>
            {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={stageFilter} onValueChange={setStageFilter}>
        <TabsList className="bg-white border border-neutral-200">
          <TabsTrigger value="All">All</TabsTrigger>
          {deliveryStages.map((s) => <TabsTrigger key={s} value={s}>{s}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <Card className="border-neutral-200 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-6 py-3 bg-neutral-50 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <div className="col-span-3">Customer</div>
          <div className="col-span-3">Vehicle &amp; location</div>
          <div className="col-span-2">Delivery</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Agent</div>
        </div>
        <div className="divide-y divide-neutral-100">
          {loading && <div className="px-6 py-8 text-center text-neutral-500 text-sm">Loading…</div>}
          {!loading && filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-neutral-500 text-sm">No clients match your filters.</div>
          )}
          {filtered.map((c) => {
            const arrivedPending = c.arrived && c.stage !== 'Delivered';
            return (
              <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)} className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-0 px-6 py-4 items-center hover:bg-neutral-50 cursor-pointer ${arrivedPending ? 'bg-amber-50/40 hover:bg-amber-50/60' : ''}`}>
                <div className="md:col-span-3">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{c.name}</p>
                    {arrivedPending && <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px]"><AlertTriangle className="h-3 w-3 mr-1"/>Arrived</Badge>}
                  </div>
                  <div className="flex gap-3 text-xs text-neutral-500 mt-0.5">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3"/>{c.phone}</span>
                  </div>
                </div>
                <div className="md:col-span-3 text-sm">
                  <p className="font-medium">{c.vehicle}</p>
                  <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                    {c.location && <><MapPin className="h-3 w-3"/> {c.location}</>}
                    {c.rego && !c.location && <span>{c.rego}</span>}
                  </p>
                </div>
                <div className="md:col-span-2 text-sm">{formatDate(c.delivery_date)}</div>
                <div className="md:col-span-2 flex flex-col gap-1">
                  <Badge className={`${stageClass(c.stage)} border-0 w-fit`}>{c.stage}</Badge>
                  {c.contact_status && (
                    <Badge className={`${contactBadge[c.contact_status] || 'bg-neutral-100'} border-0 w-fit text-[10px]`}>
                      {c.contact_status === 'Contacted' ? <CheckCircle2 className="h-3 w-3 mr-1"/> : <MessageSquare className="h-3 w-3 mr-1"/>}
                      {c.contact_status}
                    </Badge>
                  )}
                </div>
                <div className="md:col-span-2 text-sm text-neutral-600">
                  {c.assigned_agent_id ? agentMap[c.assigned_agent_id] || 'Agent' : <span className="text-neutral-400 italic">Unassigned</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, full, children }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <Label className="text-xs font-semibold text-neutral-700 mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
