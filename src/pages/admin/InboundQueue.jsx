import React, { useEffect, useState, useCallback } from 'react';
import { Mail, Clock, CheckCircle2, Search, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { inboundQueueApi, clientsApi } from '../../lib/api';
import { documentTypes } from '../../constants';
import { toast } from 'sonner';
import PaginationControls from '../../components/PaginationControls';

export default function InboundQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  const [resolveForm, setResolveForm] = useState({ client_id: '', document_type: 'Other', file_name: '', notes: '' });
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const reload = useCallback(async () => {
    try {
      const data = await inboundQueueApi.list();
      setItems(data);
    } catch (e) {
      toast.error('Failed to load inbound queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (!clientSearch || clientSearch.length < 2) {
      setClientResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await clientsApi.list({});
        // Filter locally for simplicity (assuming all returned, or could add search param)
        const q = clientSearch.toLowerCase();
        const matches = res.filter(c => 
          c.name.toLowerCase().includes(q) || 
          (c.phone && c.phone.includes(q)) || 
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.rego && c.rego.toLowerCase().includes(q))
        ).slice(0, 5);
        setClientResults(matches);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  const startResolve = (item) => {
    setResolving(item);
    setResolveForm({
      client_id: '',
      document_type: item.meta?.classification || 'Other',
      file_name: item.meta?.file_name || 'inbound-document',
      notes: 'Manually matched from unassigned queue',
    });
    setClientSearch('');
    setClientResults([]);
  };

  const handleResolve = async () => {
    if (!resolveForm.client_id) {
      toast.error('Please select a client');
      return;
    }
    try {
      await inboundQueueApi.resolve(resolving.id, resolveForm);
      toast.success('Document attached to client successfully');
      setResolving(null);
      reload();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to resolve item');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Unassigned Documents</h1>
        <p className="text-neutral-500 mt-1">Inbound items (email/portal) that could not be automatically matched to a client.</p>
      </div>

      <Dialog open={!!resolving} onOpenChange={(v) => !v && setResolving(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Match Document</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-neutral-50 p-3 rounded-md text-sm border border-neutral-200">
              <p className="font-medium">{resolving?.meta?.file_name}</p>
              <p className="text-xs text-neutral-500 mt-1">From: {resolving?.meta?.sender || 'Unknown'} • {resolving?.meta?.subject}</p>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Search Client</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input placeholder="Name, phone, email, rego..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="pl-9" />
              </div>
              {searching && <p className="text-xs text-neutral-500 mt-2">Searching...</p>}
              {!searching && clientResults.length > 0 && (
                <div className="mt-2 border border-neutral-200 rounded-md divide-y divide-neutral-100 max-h-48 overflow-auto">
                  {clientResults.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setResolveForm(f => ({ ...f, client_id: c.id }));
                        setClientSearch(c.name);
                        setClientResults([]);
                      }}
                      className={`p-2 text-sm cursor-pointer hover:bg-neutral-50 ${resolveForm.client_id === c.id ? 'bg-red-50 border-l-2 border-[#E11B22]' : ''}`}
                    >
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-neutral-500">{c.vehicle} {c.phone ? `· ${c.phone}` : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Document Type</label>
              <Select value={resolveForm.document_type} onValueChange={(v) => setResolveForm({ ...resolveForm, document_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {documentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">File Name</label>
              <Input value={resolveForm.file_name} onChange={(e) => setResolveForm({ ...resolveForm, file_name: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Notes</label>
              <Textarea rows={2} value={resolveForm.notes} onChange={(e) => setResolveForm({ ...resolveForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolving(null)}>Cancel</Button>
            <Button onClick={handleResolve} className="bg-[#E11B22] hover:bg-[#B81319] text-white">Attach to Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-neutral-200">
        <div className="hidden md:grid grid-cols-12 px-6 py-3 bg-neutral-50 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <div className="col-span-4">Source / Sender</div>
          <div className="col-span-4">Document Details</div>
          <div className="col-span-2">Time Open</div>
          <div className="col-span-2 text-right">Action</div>
        </div>
        <div className="divide-y divide-neutral-100">
          {loading ? (
            <div className="px-6 py-8 text-center text-neutral-500 text-sm">Loading queue...</div>
          ) : items.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-3" />
              <p className="text-sm font-medium text-neutral-900">Queue is clear</p>
              <p className="text-xs text-neutral-500 mt-1">All inbound documents have been matched.</p>
            </div>
          ) : (
            pagedItems.map(item => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-0 px-4 sm:px-6 py-4 items-start md:items-center hover:bg-neutral-50">
                <div className="md:col-span-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm font-medium truncate" title={item.meta?.sender}>{item.meta?.sender || 'Portal Upload'}</span>
                  </div>
                  {item.meta?.subject && (
                    <p className="text-xs text-neutral-500 mt-1 truncate" title={item.meta?.subject}>Re: {item.meta?.subject}</p>
                  )}
                  {item.meta?.po_number && (
                    <Badge variant="outline" className="mt-1 text-[10px]">PO: {item.meta.po_number}</Badge>
                  )}
                  {item.meta?.phone && (
                    <Badge variant="outline" className="mt-1 ml-1 text-[10px]">Ph: {item.meta.phone}</Badge>
                  )}
                </div>
                
                <div className="md:col-span-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{item.meta?.file_name}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Classified as: {item.meta?.classification || 'Unknown'}</p>
                </div>

                <div className="md:col-span-2">
                  <div className={`flex items-center gap-1.5 ${item.sla_breached ? 'text-red-600 font-semibold' : 'text-neutral-600'}`}>
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{item.hours_open !== null ? `${item.hours_open}h` : 'Unknown'}</span>
                  </div>
                  {item.sla_breached && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-red-600">
                      <AlertCircle className="h-3 w-3" /> SLA Breached (&gt;{item.sla_hours}h)
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 md:text-right">
                  <Button variant="outline" size="sm" className="w-full md:w-auto" onClick={() => startResolve(item)}>Match</Button>
                </div>
              </div>
            ))
          )}
        </div>
        <PaginationControls
          page={page}
          pageCount={Math.ceil(items.length / pageSize)}
          total={items.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
