import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Send, Users, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { clientsApi, smsApi, templatesApi } from '../lib/api';
import { formatDateTime } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useSite } from '../contexts/SiteContext';
import { toast } from 'sonner';

export default function Messages() {
  const { activeSite } = useSite();
  const [tab, setTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState({});
  const [bulkBody, setBulkBody] = useState('');
  const [sending, setSending] = useState(false);
  const [threadPhone, setThreadPhone] = useState('');
  const [threadMessages, setThreadMessages] = useState([]);
  const [replyBody, setReplyBody] = useState('');
  const [replySending, setReplySending] = useState(false);

  const reload = useCallback(async () => {
    const siteParams = {};
    if (activeSite && activeSite !== 'All Sites') {
      siteParams.site_location = activeSite;
    }
    const [m, c, t] = await Promise.all([
      smsApi.list({ limit: 200, ...siteParams }),
      clientsApi.list(siteParams),
      templatesApi.list(),
    ]);
    setMessages(m); setClients(c); setTemplates(t);
  }, [activeSite]);

  useEffect(() => {
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState !== 'visible') return;
      pending = true;
      try {
        const rows = await smsApi.list({ limit: 200, site_location: activeSite });
        if (active) setMessages(rows);
      } catch (error) { console.error('Message refresh failed', error); }
      finally { pending = false; }
    };
    setMessages([]);
    reload().catch(() => toast.error('Could not load messages'));
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [reload, activeSite]);

  useEffect(() => {
    setThreadPhone(''); setThreadMessages([]); setReplyBody('');
  }, [activeSite]);

  useEffect(() => {
    if (!threadPhone) return;
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState !== 'visible') return;
      pending = true;
      try {
        const rows = await smsApi.list({ phone: threadPhone, site_location: activeSite, limit: 1000 });
        if (active) setThreadMessages(rows);
      } catch (error) { if (active) toast.error('Could not load this conversation'); }
      finally { pending = false; }
    };
    setThreadMessages([]);
    refresh();
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [threadPhone, activeSite]);

  const conversations = useMemo(() => {
    const map = {};
    messages.forEach((m) => {
      const key = 'phone_' + (m.phone || '').replace(/\D/g, '').replace(/^0/, '61');
      if (!map[key]) map[key] = { key, clientId: m.client_id, clientName: m.client_name || m.phone, phone: m.phone, last: m, count: 0 };
      map[key].count += 1;
      if (!map[key].clientId && m.client_id) map[key].clientId = m.client_id;
      if (new Date(m.sent_at) > new Date(map[key].last.sent_at)) map[key].last = m;
    });
    return Object.values(map)
      .sort((a, b) => new Date(b.last.sent_at) - new Date(a.last.sent_at))
      .filter((c) => !search || (c.clientName || '').toLowerCase().includes(search.toLowerCase()));
  }, [messages, search]);

  const openThread = conversations.find(c => c.phone === threadPhone);
  const sendReply = async () => {
    if (replySending || !replyBody.trim() || !threadPhone) return;
    setReplySending(true);
    try {
      const site = activeSite && activeSite !== 'All Sites' ? activeSite : openThread?.last?.site;
      const result = await smsApi.send({ phone: threadPhone, body: replyBody.trim(), ...(site ? { site } : {}) });
      if (['failed', 'error', 'unconfigured', 'blocked'].includes(result.status)) throw new Error('SMS could not be sent');
      setReplyBody('');
      toast.success(result.status === 'simulated' ? 'SMS simulated' : 'SMS queued');
      setThreadMessages(await smsApi.list({ phone: threadPhone, site_location: activeSite, limit: 1000 }));
      reload();
    } catch (error) { toast.error(error?.response?.data?.detail || error.message || 'SMS failed'); }
    finally { setReplySending(false); }
  };

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  const insertTemplate = (tplId) => {
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) setBulkBody(tpl.body);
  };

  const sendBulk = async () => {
    if (!bulkBody.trim()) { toast.error('Message body is empty'); return; }
    if (selectedIds.length === 0) { toast.error('Select at least one client'); return; }
    setSending(true);
    try {
      const res = await smsApi.bulk({ client_ids: selectedIds, body: bulkBody });
      toast.success(`${res.sent} of ${res.total} SMS queued${res.failed?.length ? ` (${res.failed.length} failed)` : ''}`);
      setSelected({}); setBulkBody('');
      setTab('inbox');
      reload();
    } catch (e) {
      toast.error('Bulk send failed');
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-neutral-500 mt-1">SMS inbox and bulk send</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white border border-neutral-200">
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="bulk"><Users className="h-4 w-4 mr-1.5"/>Bulk SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-4">
          <div className="relative max-w-md mb-4">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations…" className="pl-9 bg-white"/>
          </div>
          <Card className="border-neutral-200">
            <div className="divide-y divide-neutral-100">
              {conversations.length === 0 && <p className="text-center text-sm text-neutral-500 py-12">No conversations yet.</p>}
              {conversations.map((c) => (
                <button type="button" onClick={() => { setThreadPhone(c.phone); setReplyBody(''); }} key={c.key} className="w-full text-left flex items-center gap-4 px-6 py-4 hover:bg-neutral-50">
                  <div className="h-10 w-10 rounded-full bg-neutral-100 text-neutral-700 font-semibold flex items-center justify-center text-sm">
                    {(c.clientName || '#').split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><p className="font-semibold text-sm">{c.clientName}</p><span className="text-xs text-neutral-400">{c.phone}</span></div>
                    <p className="text-sm text-neutral-600 truncate mt-0.5">{c.last.body}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-neutral-500">{formatDateTime(c.last.sent_at)}</p>
                    <Badge variant="outline" className="text-[10px] mt-1">{c.count} msg</Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>
          {threadPhone && (
            <Card className="mt-4 border-neutral-200">
              <CardHeader>
                <CardTitle className="text-base">Conversation with {openThread?.clientName || threadPhone}</CardTitle>
                {openThread?.clientId && <Link className="text-sm text-red-700" to={`/clients/${openThread.clientId}`}>View delivery record</Link>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div aria-live="polite" className="max-h-96 overflow-y-auto space-y-3">
                  {[...threadMessages].reverse().map(m => (
                    <div key={m.direction + ':' + (m.provider_message_id || m.id)} className={'rounded-lg p-3 ' + (m.direction === 'inbound' ? 'bg-neutral-100' : 'bg-red-50')}>
                      <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                      <p className="text-xs text-neutral-500 mt-1">{m.direction === 'inbound' ? 'Customer' : 'Team'} · {formatDateTime(m.sent_at)} · {m.status}</p>
                    </div>
                  ))}
                </div>
                <Textarea value={replyBody} onChange={event => setReplyBody(event.target.value)} placeholder="Write a reply…" rows={3}/>
                <Button onClick={sendReply} disabled={replySending || !replyBody.trim()} className="bg-[#E11B22] hover:bg-[#B81319] text-white">
                  <Send className="h-4 w-4 mr-2"/>{replySending ? 'Sending…' : 'Send reply'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bulk" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-neutral-200">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Recipients</CardTitle>
                <span className="text-sm text-neutral-500">{selectedIds.length} selected</span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-6 py-2 border-b border-neutral-100">
                  <button className="text-xs font-medium text-[#E11B22] hover:underline" onClick={() => { const all = {}; clients.forEach((c) => { all[c.id] = true; }); setSelected(all); }}>Select all</button>
                  <span className="text-neutral-300 mx-2">|</span>
                  <button className="text-xs font-medium text-neutral-600 hover:underline" onClick={() => setSelected({})}>Clear</button>
                </div>
                <div className="divide-y divide-neutral-100 max-h-[480px] overflow-y-auto">
                  {clients.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 px-6 py-3 hover:bg-neutral-50 cursor-pointer">
                      <Checkbox checked={!!selected[c.id]} onCheckedChange={(v) => setSelected({ ...selected, [c.id]: !!v })} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-neutral-500">{c.phone} · {c.vehicle}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{c.stage}</Badge>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 h-fit">
              <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Compose</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select onValueChange={insertTemplate}>
                  <SelectTrigger><SelectValue placeholder="Use a template…"/></SelectTrigger>
                  <SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea rows={6} value={bulkBody} onChange={(e) => setBulkBody(e.target.value)} placeholder="Hi {{name}}, your {{vehicle}} delivery is on {{date}}…"/>
                <div className="text-xs text-neutral-500">Variables: {'{{name}} {{vehicle}} {{date}} {{rego}} {{agent}}'}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">{bulkBody.length} chars</span>
                  <Button onClick={sendBulk} disabled={sending} className="bg-[#E11B22] hover:bg-[#B81319] text-white">
                    <Send className="h-4 w-4 mr-1.5"/> Send to {selectedIds.length || 0}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
