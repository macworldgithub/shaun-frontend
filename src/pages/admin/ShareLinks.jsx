import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../../components/ui/dialog';
import { Plus, Copy, Eye, Trash2, ExternalLink, Mail, ChevronRight } from 'lucide-react';
import { shareApi } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { toast } from 'sonner';

export default function AdminShareLinks() {
  const [links, setLinks] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: '', allowed_emails: '', expires_in_hours: '' });
  const [activeViews, setActiveViews] = useState(null); // {link, views}

  const reload = useCallback(async () => setLinks(await shareApi.list()), []);
  useEffect(() => { reload(); }, [reload]);

  const buildUrl = (token) => `${window.location.origin}/share/${token}`;

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied'); };

  const create = async () => {
    if (!form.label) { toast.error('Label required'); return; }
    const emails = form.allowed_emails.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
    try {
      await shareApi.create({
        label: form.label,
        allowed_emails: emails,
        expires_in_hours: form.expires_in_hours ? parseInt(form.expires_in_hours, 10) : null,
      });
      setOpen(false); setForm({ label: '', allowed_emails: '', expires_in_hours: '' });
      reload(); toast.success('Share link created');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const revoke = async (id) => {
    if (!window.confirm('Revoke this share link? Anyone with the URL will lose access.')) return;
    await shareApi.revoke(id);
    reload(); toast.success('Revoked');
  };

  const showViews = async (link) => {
    const views = await shareApi.views(link.id);
    setActiveViews({ link, views });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Share links</h1>
          <p className="text-neutral-500 mt-1">Generate trackable, email-gated dashboards for upper management.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#E11B22] hover:bg-[#B81319] text-white"><Plus className="h-4 w-4 mr-1.5"/>New share link</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a shareable dashboard link</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label className="text-xs font-semibold mb-1.5 block">Label</Label><Input placeholder="Executive snapshot" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}/></div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Allowed emails (optional)</Label>
                <Input placeholder="ceo@dealer.com, ops@dealer.com" value={form.allowed_emails} onChange={(e) => setForm({ ...form, allowed_emails: e.target.value })}/>
                <p className="text-xs text-neutral-500 mt-1">Comma or space separated. Leave blank to allow any email.</p>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Expires after (hours, optional)</Label>
                <Input type="number" min="1" placeholder="e.g. 168 for 7 days" value={form.expires_in_hours} onChange={(e) => setForm({ ...form, expires_in_hours: e.target.value })}/>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={create} className="bg-[#E11B22] hover:bg-[#B81319] text-white">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-neutral-200">
        <div className="divide-y divide-neutral-100">
          {links.length === 0 && <p className="px-6 py-8 text-sm text-neutral-500 text-center">No share links yet.</p>}
          {links.map((l) => (
            <div key={l.id} className="px-6 py-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{l.label}</p>
                  {l.active ? <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge> : <Badge className="bg-neutral-200 text-neutral-700 border-0 text-xs">Revoked</Badge>}
                  {(l.allowed_emails || []).length > 0 && <Badge variant="outline" className="text-xs"><Mail className="h-3 w-3 mr-1"/>{l.allowed_emails.length} allowed</Badge>}
                  {l.expires_at && <Badge variant="outline" className="text-xs">Expires {formatDateTime(l.expires_at)}</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <code className="text-xs bg-neutral-100 rounded px-2 py-1 truncate max-w-md font-mono">{buildUrl(l.token)}</code>
                  <Button variant="ghost" size="sm" onClick={() => copy(buildUrl(l.token))} className="h-7 px-2"><Copy className="h-3.5 w-3.5"/></Button>
                  <a href={buildUrl(l.token)} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-neutral-700"><ExternalLink className="h-3.5 w-3.5"/></a>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                  <span><Eye className="h-3 w-3 inline mr-1"/>{l.view_count} views</span>
                  {l.last_viewed_at && <span>Last viewed {formatDateTime(l.last_viewed_at)} · {l.last_viewer_email}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => showViews(l)}>Views <ChevronRight className="h-3 w-3 ml-1"/></Button>
                {l.active && <Button variant="ghost" size="sm" onClick={() => revoke(l.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5"/></Button>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={!!activeViews} onOpenChange={(v) => !v && setActiveViews(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Views — {activeViews?.link.label}</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-neutral-100">
            {(activeViews?.views || []).length === 0 && <p className="text-center text-sm text-neutral-500 py-6">No views yet.</p>}
            {(activeViews?.views || []).map((v) => (
              <div key={v.id} className="py-2.5 flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{v.viewer_email}</p>
                  <p className="text-xs text-neutral-500 truncate">{v.user_agent || ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-600">{formatDateTime(v.viewed_at)}</p>
                  <p className="text-[10px] text-neutral-400 font-mono">{v.ip || ''}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
