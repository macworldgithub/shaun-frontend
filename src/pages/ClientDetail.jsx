import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Car, Calendar, User, Send, MessageSquare, CheckCircle2, Circle, MapPin, AlertTriangle, Plus, X, Wrench, FileText, Download } from 'lucide-react';
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
import { deliveryStages, contactStatuses, accessoryStatuses, checklistItems, registrationStatuses, handoverChecklistStatuses, tradeInStatuses, saleTypes, documentTypes, documentStatuses, activationStatuses, offerStatuses, yourWaySelections, siteLocations } from '../constants';
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
  const [documentType, setDocumentType] = useState('Handover checklist');
  const [documentFileName, setDocumentFileName] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [offerMatches, setOfferMatches] = useState([]);
  const [activationReason, setActivationReason] = useState('');
  const [tradeInReason, setTradeInReason] = useState('');
  const [uploadLink, setUploadLink] = useState('');
  const [checks, setChecks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`checks_${id}`)) || {}; } catch { return {}; }
  });

  const reload = useCallback(async () => {
    const [c, m, t, u, matches] = await Promise.all([
      clientsApi.get(id),
      smsApi.list({ client_id: id }),
      templatesApi.list(),
      adminApi.listUsers().catch(() => []),
      clientsApi.offerMatches(id).catch(() => []),
    ]);
    setClient(c);
    setMessages(m);
    setTemplates(t);
    setAgents(u.filter((x) => x.active));
    setOfferMatches(matches);
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

  const syncInventory = async () => {
    try {
      await clientsApi.syncInventory(id);
      reload();
      toast.success('Inventory synced from VY');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Inventory sync failed');
    }
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

  const addDocument = async () => {
    try {
      await clientsApi.addDocument(id, {
        document_type: documentType,
        file_name: documentFileName || undefined,
        source: 'staff-upload',
        status: 'requested',
      });
      setDocumentFileName('');
      reload();
      toast.success('Document added');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to add document'); }
  };

  const uploadDocument = async () => {
    if (!documentFile) { toast.error('Choose a document first'); return; }
    try {
      await clientsApi.uploadDocument(id, documentFile, documentType);
      setDocumentFile(null);
      reload();
      toast.success('Document uploaded and attached');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Upload failed'); }
  };

  const generatePack = async () => {
    try { await clientsApi.generatePack(id); reload(); toast.success('Document pack generated and filed'); }
    catch (e) { toast.error(e?.response?.data?.detail || 'Pack generation failed'); }
  };

  const sendPack = async () => {
    try { await clientsApi.sendPack(id); reload(); toast.success('Document pack emailed to the customer'); }
    catch (e) { toast.error(e?.response?.data?.detail || 'Pack email failed'); }
  };

  const generateClaimPack = async () => {
    try { await clientsApi.generateClaimPack(id); reload(); toast.success('Offer claim pack generated and filed'); }
    catch (e) { toast.error(e?.response?.data?.detail || 'Claim pack generation failed'); }
  };

  const createUploadLink = async () => {
    try {
      const result = await clientsApi.createUploadLink(id);
      setUploadLink(result.url);
      await navigator.clipboard?.writeText(result.url);
      toast.success('Customer upload link created and copied');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Could not create upload link'); }
  };

  const updateDocument = async (documentId, data) => {
    try { await clientsApi.updateDocument(id, documentId, data); reload(); }
    catch (e) { toast.error(e?.response?.data?.detail || 'Failed to update document'); }
  };

  const downloadDocument = async (document) => {
    try { await clientsApi.downloadDocument(id, document.id, document.file_name || 'document'); }
    catch (e) { toast.error(e?.response?.data?.detail || 'Download failed'); }
  };

  const updateTradeInStatus = async (status) => {
    try { await clientsApi.updateTradeIn(id, { trade_in_status: status, trade_in_manager_reason: tradeInReason || undefined }); reload(); }
    catch (e) { toast.error(e?.response?.data?.detail || 'Trade-in update failed'); }
  };

  const toggleCheck = (cid) => {
    const next = { ...checks, [cid]: !checks[cid] };
    setChecks(next);
    localStorage.setItem(`checks_${id}`, JSON.stringify(next));
  };

  const completedChecks = checklistItems.filter((c) => checks[c.id]).length;
  const tradeInDaysLeft = client.trade_in_valid_until ? Math.ceil((new Date(`${client.trade_in_valid_until}T23:59:59`) - new Date()) / 86400000) : null;
  const matchedOffers = offerMatches.filter((item) => item.eligible);

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

      <Card className="border-neutral-200">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Registration & compliance</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Box label="PO / INV">
            <Input defaultValue={client.po_number || ''} onBlur={(e) => e.target.value !== (client.po_number || '') && patch({ po_number: e.target.value })} />
          </Box>
          <Box label="Payment method">
            <Select value={client.payment_method || 'none'} onValueChange={(v) => patch({ payment_method: v === 'none' ? null : v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Not set" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                <SelectItem value="Cash">Cash / Transfer</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Novated lease">Novated lease</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Box>
          <Box label="Sale type">
            <Select value={client.sale_type || 'Retail'} onValueChange={(v) => patch({ sale_type: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{saleTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Box>
          <Box label="Fleet / FMO company">
            <Input defaultValue={client.fleet_company || ''} onBlur={(e) => e.target.value !== (client.fleet_company || '') && patch({ fleet_company: e.target.value })} />
          </Box>
          <Box label="Fleet reference">
            <Input defaultValue={client.fleet_reference || ''} onBlur={(e) => e.target.value !== (client.fleet_reference || '') && patch({ fleet_reference: e.target.value })} />
          </Box>
          <Box label="Lease consultant">
            <Input defaultValue={client.lease_consultant || ''} onBlur={(e) => e.target.value !== (client.lease_consultant || '') && patch({ lease_consultant: e.target.value })} />
          </Box>
          <Box label="Registered operator">
            <Select value={client.registered_operator_type || 'Individual'} onValueChange={(v) => patch({ registered_operator_type: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Individual">Individual</SelectItem><SelectItem value="Company">Company</SelectItem></SelectContent>
            </Select>
          </Box>
          <Box label="Registration status">
            <Select value={client.registration_status || 'Awaiting registration documents'} onValueChange={(v) => patch({ registration_status: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{registrationStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Box>
          <Box label="Trade-in flag">
            <div className="flex items-center gap-2 h-9">
              <Switch checked={Boolean(client.trade_in_flag)} onCheckedChange={(v) => patch({ trade_in_flag: v })} />
              <span className="text-sm text-neutral-700">{client.trade_in_flag ? 'Yes' : 'No'}</span>
            </div>
          </Box>
          <Box label="Trade-in attached">
            <div className="flex items-center gap-2 h-9">
              <Switch checked={Boolean(client.trade_in_attached)} onCheckedChange={(v) => patch({ trade_in_attached: v })} />
              <span className="text-sm text-neutral-700">{client.trade_in_attached ? 'Yes' : 'No'}</span>
            </div>
          </Box>
          <Box label="Trade-in sale date">
            <Input type="date" defaultValue={client.trade_in_sale_date || ''} onBlur={(e) => e.target.value !== (client.trade_in_sale_date || '') && patch({ trade_in_sale_date: e.target.value })} />
          </Box>
          <Box label="Trade-in valid until">
            <Input type="date" defaultValue={client.trade_in_valid_until || ''} onBlur={(e) => e.target.value !== (client.trade_in_valid_until || '') && patch({ trade_in_valid_until: e.target.value })} />
            {client.trade_in_attached && client.trade_in_valid_until && <p className={`text-[10px] mt-1 ${tradeInDaysLeft <= 0 ? 'text-red-600' : tradeInDaysLeft <= 10 ? 'text-amber-700' : 'text-neutral-500'}`}>{tradeInDaysLeft <= 0 ? 'Trade-in expired' : `Trade-in valid for ${tradeInDaysLeft} day${tradeInDaysLeft === 1 ? '' : 's'}`}</p>}
          </Box>
          <Box label="Trade-in status">
            <Select value={client.trade_in_status || 'Pending'} onValueChange={updateTradeInStatus}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{tradeInStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Box>
          <Box label="Trade-in manager reason">
            <Input value={tradeInReason} onChange={(e) => setTradeInReason(e.target.value)} placeholder="Required for expired settlement" />
          </Box>
          <Box label="Handover checklist">
            <Select value={client.handover_checklist_status || 'Not issued'} onValueChange={(v) => patch({ handover_checklist_status: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{handoverChecklistStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Box>
          <Box label="Activation status">
            <Select value={client.activation_status || 'Blocked'} onValueChange={async (v) => {
              try { await clientsApi.updateActivation(id, { activation_status: v, activation_override_reason: activationReason || undefined }); reload(); }
              catch (e) { toast.error(e?.response?.data?.detail || 'Activation update failed'); }
            }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{activationStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Box>
          <Box label="Activation override reason">
            <Input value={activationReason} onChange={(e) => setActivationReason(e.target.value)} placeholder="Manager reason if checklist evidence is unavailable" />
          </Box>
          <Box label="Offer status">
            <Select value={client.offer_status || 'Eligible'} onValueChange={async (v) => {
              try { await clientsApi.updateOfferStatus(id, { offer_status: v }); reload(); }
              catch (e) { toast.error(e?.response?.data?.detail || 'Offer update failed'); }
            }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{offerStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Box>
          <Box label="Linked offer">
            <Select value={client.linked_offer_ids?.[0] || 'none'} onValueChange={(v) => patch({ linked_offer_ids: v === 'none' ? [] : [v] })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select offer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {matchedOffers.map(({ offer }) => <SelectItem key={offer.id} value={offer.id}>{offer.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {matchedOffers.length === 0 && <p className="text-[10px] text-amber-700 mt-1">No currently eligible catalogue offer.</p>}
          </Box>
          <Box label="Your Way selection">
            <Select value={client.your_way_selection || 'none'} onValueChange={(v) => patch({ your_way_selection: v === 'none' ? null : v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Not selected" /></SelectTrigger>
              <SelectContent><SelectItem value="none">Not selected</SelectItem>{yourWaySelections.map((choice) => <SelectItem key={choice} value={choice}>{choice}</SelectItem>)}</SelectContent>
            </Select>
          </Box>
        </CardContent>
      </Card>

      <Card className="border-neutral-200">
        <CardHeader className="pb-3 flex flex-row items-center justify-between"><CardTitle className="text-base font-semibold flex items-center gap-2"><FileText className="h-4 w-4"/> Registration documents</CardTitle><div className="flex gap-2 flex-wrap"><Button onClick={generatePack} variant="outline" size="sm"><FileText className="h-4 w-4 mr-1"/>Generate pack</Button><Button onClick={generateClaimPack} variant="outline" size="sm"><FileText className="h-4 w-4 mr-1"/>Claim pack</Button><Button onClick={sendPack} variant="outline" size="sm"><Send className="h-4 w-4 mr-1"/>Email pack</Button><Button onClick={createUploadLink} variant="outline" size="sm"><FileText className="h-4 w-4 mr-1"/>Customer upload link</Button></div></CardHeader>
        <CardContent className="space-y-3">
          {uploadLink && <p className="break-all rounded-md bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-600">Upload link: {uploadLink}</p>}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{documentTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Returned file name (optional)" value={documentFileName} onChange={(e) => setDocumentFileName(e.target.value)} />
            <Button onClick={addDocument} variant="outline"><Plus className="h-4 w-4 mr-1"/>Add document</Button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Input type="file" className="max-w-md" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
            <Button onClick={uploadDocument} variant="outline"><FileText className="h-4 w-4 mr-1"/>Upload and attach</Button>
          </div>
          {(client.documents || []).length === 0 ? <p className="text-sm text-neutral-500">No registration documents tracked yet.</p> : (
            <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
              {client.documents.map((document) => (
                <div key={document.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center px-3 py-2.5">
                  <div className="text-sm"><p className="font-medium">{document.document_type}</p><p className="text-xs text-neutral-500">{document.file_name || 'No file returned'}</p></div>
                  <Select value={document.status} onValueChange={(v) => updateDocument(document.id, { status: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{documentStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input className="h-8 text-xs" placeholder="Notes" defaultValue={document.notes || ''} onBlur={(e) => e.target.value !== (document.notes || '') && updateDocument(document.id, { notes: e.target.value })} />
                  {document.storage_path && <Button variant="ghost" size="icon" title="Download document" onClick={() => downloadDocument(document)}><Download className="h-4 w-4"/></Button>}
                </div>
              ))}
            </div>
          )}
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
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Wrench className="h-4 w-4"/> Accessories &amp; aftermarket</CardTitle>
              <Button variant="outline" size="sm" onClick={syncInventory} className="text-xs h-8 gap-1">
                Sync from VY
              </Button>
            </CardHeader>
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
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Vehicle &amp; Address</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row icon={Car} label="Vehicle" value={client.vehicle}/>
              <Row label="Rego" value={client.rego}/>
              <Row label="VIN" value={client.vin}/>
              <Row label="Deal type" value={client.deal_type}/>
              <Row icon={MapPin} label="Street Address" value={client.address || client.location}/>
              <Row icon={Calendar} label="Delivery" value={formatDate(client.delivery_date)}/>
              {client.vy_order_id && <Row label="VY order" value={client.vy_order_id}/>}
            </CardContent>
          </Card>

          <Card className="border-neutral-200">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><MapPin className="h-4 w-4"/> Site &amp; Staff Assignment</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <Label className="text-[11px] font-semibold text-neutral-600 mb-1 block">Dealership Site Location</Label>
                <Select value={client.site_location || 'Fairfield'} onValueChange={(v) => patch({ site_location: v })}>
                  <SelectTrigger className="h-8 text-xs bg-white"><SelectValue/></SelectTrigger>
                  <SelectContent>{siteLocations.map((site) => <SelectItem key={site} value={site}>{site}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-neutral-600 mb-1 block">Primary Salesperson</Label>
                <Input value={client.salesperson || ''} placeholder="Primary sales rep" onChange={(e) => patch({ salesperson: e.target.value })} className="h-8 text-xs bg-white"/>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-neutral-600 mb-1 block">Secondary Salesperson</Label>
                <Input value={client.secondary_salesperson || ''} placeholder="Secondary sales rep (if 2 sales reps)" onChange={(e) => patch({ secondary_salesperson: e.target.value })} className="h-8 text-xs bg-white"/>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-neutral-600 mb-1 block">Delivery Follow-Up Consultant</Label>
                <Input value={client.delivery_consultant || ''} placeholder="Consultant for delivery follow-up" onChange={(e) => patch({ delivery_consultant: e.target.value })} className="h-8 text-xs bg-white"/>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-neutral-600 mb-1 block">Handover Specialist</Label>
                <Input value={client.handover_specialist || ''} placeholder="Staff performing physical handover" onChange={(e) => patch({ handover_specialist: e.target.value })} className="h-8 text-xs bg-white"/>
              </div>
            </CardContent>
          </Card>

          <Card className="border-neutral-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Handover checklist</CardTitle>
              <span className="text-xs font-medium text-neutral-500">{completedChecks}/{checklistItems.length}</span>
            </CardHeader>
            <CardContent className="space-y-2">
              {checklistItems.map((item) => (
                <div key={item.id} className="space-y-1 py-0.5">
                  <button onClick={() => toggleCheck(item.id)} className="flex items-start gap-2.5 w-full px-2 py-1.5 rounded-md hover:bg-neutral-50 text-left">
                    {checks[item.id] ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5"/> : <Circle className="h-4 w-4 text-neutral-300 shrink-0 mt-0.5"/>}
                    <span className={`text-sm ${checks[item.id] ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>{item.label}</span>
                  </button>
                  {item.hasInput && (
                    <div className="pl-8 pr-2 pb-1">
                      <Input
                        placeholder="Enter Business Client ID #"
                        value={client.business_client_id || ''}
                        onChange={(e) => patch({ business_client_id: e.target.value })}
                        className="h-8 text-xs bg-white border-neutral-200"
                      />
                    </div>
                  )}
                </div>
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
