import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Car, Calendar, User, Send, MessageSquare, CheckCircle2, Circle, MapPin, AlertTriangle, Plus, X, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import { clientsApi, smsApi, templatesApi, adminApi } from '../lib/api';
import { deliveryStages, contactStatuses, accessoryStatuses, checklistItems } from '../constants';
import { stageClass, formatDate, formatDateTime, renderTemplate } from '../lib/utils';
import { toast } from 'sonner';

const SMS_SEGMENT_CHARS = 160;

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [smsBody, setSmsBody] = useState('');
  const [comment, setComment] = useState('');
  const [accessoryName, setAccessoryName] = useState('');
  const [aftermarket, setAftermarket] = useState('');
  const [checks, setChecks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`checks_${id}`)) || {}; } catch { return {}; }
  });

  const reload = useCallback(async () => {
    const [c, m, t, u] = await Promise.all([
      clientsApi.get(id),
      smsApi.list({ client_id: id }),
      templatesApi.list(),
      adminApi.listUsers().catch(() => []),
    ]);
    setClient(c);
    setMessages(m);
    setTemplates(t);
    setAgents(u.filter((x) => x.active));
    setAftermarket(c.aftermarket_notes || '');
    setLoading(false);
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  const agentMap = useMemo(() => Object.fromEntries(agents.map((a) => [a.id, a.name])), [agents]);

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (!client) return (
    <div className="text-center py-20">
      <p className="text-neutral-500">Client not found.</p>
      <Link to="/clients"><Button variant="outline" className="mt-4">Back to clients</Button></Link>
    </div>
  );

  const arrivedPending = client.arrived && client.stage !== 'Delivered';

  const patch = async (data) => {
    const updated = await clientsApi.update(id, data);
    setClient(updated);
    return updated;
  };

  const sendSms = async () => {
    if (!smsBody.trim()) { toast.error('Message cannot be empty'); return; }
    try {
      await smsApi.send({ client_id: id, body: smsBody });
      toast.success('SMS queued');
      setSmsBody('');
      reload();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'SMS failed');
    }
  };

  const insertTemplate = (tplId) => {
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    const rendered = renderTemplate(tpl.body, {
      name: client.name.split(' ')[0],
      vehicle: client.vehicle,
      date: formatDate(client.delivery_date),
      agent: client.salesperson,
      rego: client.rego,
    });
    setSmsBody(rendered);
  };

  const saveComment = async () => {
    if (!comment.trim()) return;
    try {
      await clientsApi.addComment(id, comment);
      setComment('');
      reload();
      toast.success('Comment added');
    } catch (e) { toast.error('Failed'); }
  };

  const addAccessory = async () => {
    if (!accessoryName.trim()) return;
    try {
      await clientsApi.addAccessory(id, { name: accessoryName, status: 'Pending Order' });
      setAccessoryName('');
      reload();
    } catch (e) { toast.error('Failed'); }
  };

  const updateAccessory = async (aid, data) => {
    try { await clientsApi.updateAccessory(id, aid, data); reload(); }
    catch (e) { toast.error('Failed'); }
  };

  const removeAccessory = async (aid) => {
    try { await clientsApi.removeAccessory(id, aid); reload(); }
    catch (e) { toast.error('Failed'); }
  };

  const saveAftermarket = async () => {
    await patch({ aftermarket_notes: aftermarket });
    toast.success('Aftermarket notes saved');
  };

  const toggleCheck = (cid) => {
    const next = { ...checks, [cid]: !checks[cid] };
    setChecks(next);
    localStorage.setItem(`checks_${id}`, JSON.stringify(next));
  };

  const completedChecks = checklistItems.filter((c) => checks[c.id]).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4"/> Back
      </button>

      {arrivedPending && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5"/>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Vehicle has arrived but the delivery status hasn’t been updated.</p>
            <p className="text-xs text-amber-800 mt-0.5">Move to Pre-Delivery Inspection or Ready for Pickup once you’ve confirmed.</p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-neutral-600">
            <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-neutral-400"/>{client.phone}</span>
            {client.email && <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-neutral-400"/>{client.email}</span>}
            <span className="flex items-center gap-1.5"><Car className="h-4 w-4 text-neutral-400"/>{client.vehicle} {client.rego ? `· ${client.rego}` : ''}</span>
            {client.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-neutral-400"/>{client.location}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={client.stage} onValueChange={(v) => patch({ stage: v })}>
            <SelectTrigger className="w-52 bg-white"><SelectValue/></SelectTrigger>
            <SelectContent>{deliveryStages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Badge className={`${stageClass(client.stage)} border-0 text-sm py-1.5 px-3`}>{client.stage}</Badge>
        </div>
      </div>

      {/* Status row */}
      <Card className="border-neutral-200">
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Box label="Contact status">
            <Select value={client.contact_status} onValueChange={(v) => patch({ contact_status: v })}>
              <SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
              <SelectContent>{contactStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            {client.last_contacted_at && <p className="text-[10px] text-neutral-500 mt-1">Last: {formatDateTime(client.last_contacted_at)}</p>}
          </Box>
          <Box label="Assigned agent">
            <Select value={client.assigned_agent_id || 'unassigned'} onValueChange={(v) => patch({ assigned_agent_id: v === 'unassigned' ? '' : v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Unassigned"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Box>
          <Box label="Vehicle arrived">
            <div className="flex items-center gap-2 h-9">
              <Switch checked={client.arrived} onCheckedChange={(v) => patch({ arrived: v })}/>
              <span className="text-sm text-neutral-700">{client.arrived ? 'Yes' : 'No'}</span>
            </div>
            {client.arrived_at && <p className="text-[10px] text-neutral-500 mt-1">Since: {formatDateTime(client.arrived_at)}</p>}
          </Box>
          <Box label="Delivery date">
            <Input type="date" defaultValue={client.delivery_date || ''} onBlur={(e) => e.target.value !== (client.delivery_date || '') && patch({ delivery_date: e.target.value })}/>
          </Box>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-neutral-200">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><Send className="h-4 w-4 text-[#E11B22]"/> Send SMS</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select onValueChange={insertTemplate}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Insert template…"/></SelectTrigger>
                <SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea rows={4} placeholder={`Message to ${client.phone}…`} value={smsBody} onChange={(e) => setSmsBody(e.target.value)} />
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>{smsBody.length} chars · {Math.ceil(smsBody.length / SMS_SEGMENT_CHARS) || 1} SMS segment</span>
                <Button onClick={sendSms} className="bg-[#E11B22] hover:bg-[#B81319] text-white">Send SMS</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-neutral-200">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4"/> Conversation</CardTitle></CardHeader>
            <CardContent>
              {messages.length === 0 ? <p className="text-sm text-neutral-500">No messages yet.</p> : (
                <div className="space-y-3">
                  {[...messages].reverse().map((m) => (
                    <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.direction === 'outbound' ? 'bg-[#E11B22] text-white' : 'bg-neutral-100 text-neutral-900'}`}>
                        <p>{m.body}</p>
                        <p className={`text-[10px] mt-1 ${m.direction === 'outbound' ? 'text-red-100' : 'text-neutral-500'}`}>{formatDateTime(m.sent_at)} · {m.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-neutral-200">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><Wrench className="h-4 w-4"/> Accessories &amp; aftermarket</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Add accessory (e.g. Floor Mats Moulded)" value={accessoryName} onChange={(e) => setAccessoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addAccessory()}/>
                <Button onClick={addAccessory} variant="outline"><Plus className="h-4 w-4 mr-1"/>Add</Button>
              </div>
              {(client.accessories || []).length === 0 ? (
                <p className="text-sm text-neutral-500 italic py-2">No accessories tracked yet.</p>
              ) : (
                <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                  {client.accessories.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 px-3 py-2.5">
                      <p className="flex-1 text-sm font-medium">{a.name}</p>
                      <Select value={a.status} onValueChange={(v) => updateAccessory(a.id, { status: v })}>
                        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue/></SelectTrigger>
                        <SelectContent>{accessoryStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                      <button onClick={() => removeAccessory(a.id)} className="text-neutral-400 hover:text-red-500"><X className="h-4 w-4"/></button>
                    </div>
                  ))}
                </div>
              )}
              <Separator/>
              <Label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Aftermarket notes</Label>
              <Textarea rows={2} placeholder="Anything still to be ordered or fitted…" value={aftermarket} onChange={(e) => setAftermarket(e.target.value)} onBlur={saveAftermarket}/>
            </CardContent>
          </Card>

          <Card className="border-neutral-200">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Comments &amp; handover</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea rows={2} placeholder="Add an internal comment for the team…" value={comment} onChange={(e) => setComment(e.target.value)}/>
              <div className="flex justify-end"><Button onClick={saveComment} variant="outline">Add comment</Button></div>
              <Separator/>
              {(client.comments || []).length === 0 ? <p className="text-sm text-neutral-500">No comments yet.</p> : (
                <div className="space-y-3">
                  {[...(client.comments || [])].reverse().map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">{(c.author_name || '').split(' ').map((p) => p[0]).join('').slice(0, 2)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-neutral-500"><span className="font-semibold text-neutral-900">{c.author_name}</span> · {formatDateTime(c.created_at)}</div>
                        <p className="text-sm mt-0.5 whitespace-pre-line">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-neutral-200">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Vehicle</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row icon={Car} label="Vehicle" value={client.vehicle}/>
              <Row label="Rego" value={client.rego}/>
              <Row label="VIN" value={client.vin}/>
              <Row label="Deal type" value={client.deal_type}/>
              <Row icon={MapPin} label="Location" value={client.location}/>
              <Row icon={Calendar} label="Delivery" value={formatDate(client.delivery_date)}/>
              <Row icon={User} label="Salesperson" value={client.salesperson}/>
              {client.assigned_agent_id && <Row label="Agent" value={agentMap[client.assigned_agent_id] || 'Agent'}/>}
              {client.vy_order_id && <Row label="VY order" value={client.vy_order_id}/>}
            </CardContent>
          </Card>

          <Card className="border-neutral-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Handover checklist</CardTitle>
              <span className="text-xs font-medium text-neutral-500">{completedChecks}/{checklistItems.length}</span>
            </CardHeader>
            <CardContent className="space-y-1">
              {checklistItems.map((item) => (
                <button key={item.id} onClick={() => toggleCheck(item.id)} className="flex items-center gap-2.5 w-full px-2 py-2 rounded-md hover:bg-neutral-50 text-left">
                  {checks[item.id] ? <CheckCircle2 className="h-4 w-4 text-emerald-600"/> : <Circle className="h-4 w-4 text-neutral-300"/>}
                  <span className={`text-sm ${checks[item.id] ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>{item.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-neutral-500 font-semibold flex items-center gap-1.5">{Icon && <Icon className="h-3.5 w-3.5"/>}{label}</span>
      <span className="font-medium text-neutral-900 text-right truncate">{value}</span>
    </div>
  );
}

function Box({ label, children }) {
  return (
    <div>
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
