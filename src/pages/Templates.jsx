import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { templatesApi } from '../lib/api';
import { toast } from 'sonner';
import PaginationControls from '../components/PaginationControls';

const categories = ['Welcome', 'Reminder', 'Status', 'Follow-up', 'Internal'];
const empty = { name: '', body: '', category: 'Welcome' };

export default function Templates() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const reload = useCallback(async () => setList(await templatesApi.list()), []);
  useEffect(() => { reload(); }, [reload]);

  const pagedTemplates = list.slice((page - 1) * pageSize, page * pageSize);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (t) => { setEditing(t.id); setForm({ name: t.name, body: t.body, category: t.category }); setOpen(true); };

  const save = async () => {
    if (!form.name || !form.body) { toast.error('Name and body required'); return; }
    try {
      if (editing) await templatesApi.update(editing, form);
      else await templatesApi.create(form);
      reload(); setOpen(false);
      toast.success(editing ? 'Template updated' : 'Template created');
    } catch (e) { toast.error('Failed'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try { await templatesApi.remove(id); reload(); toast.success('Removed'); }
    catch (e) { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMS Templates</h1>
          <p className="text-neutral-500 mt-1">Reusable, variable-driven messages for every delivery moment</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-[#E11B22] hover:bg-[#B81319] text-white"><Plus className="h-4 w-4 mr-1.5"/>New template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{editing ? 'Edit template' : 'New template'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label className="text-xs font-semibold mb-1.5 block">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Message body</Label>
                <Textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
                <p className="text-xs text-neutral-500 mt-1.5">Variables: {'{{name}} {{vehicle}} {{date}} {{rego}} {{agent}}'}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} className="bg-[#E11B22] hover:bg-[#B81319] text-white">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pagedTemplates.map((t) => (
          <Card key={t.id} className="border-neutral-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base font-semibold">{t.name}</CardTitle>
                <Badge variant="outline" className="mt-2 text-xs">{t.category}</Badge>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(t)} className="h-8 w-8"><Edit2 className="h-3.5 w-3.5"/></Button>
                <Button variant="ghost" size="icon" onClick={() => del(t.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5"/></Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{t.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <PaginationControls
        page={page}
        pageCount={Math.ceil(list.length / pageSize)}
        total={list.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
