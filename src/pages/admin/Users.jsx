import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, KeyRound, UserX, Copy, ShieldCheck, ShieldAlert } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../lib/utils';
import { toast } from 'sonner';
import PaginationControls from '../../components/PaginationControls';

export default function AdminUsers() {
  const { isSuper } = useAuth();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'agent' });
  const [tempPw, setTempPw] = useState(null); // { user, password }
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const reload = useCallback(async () => setUsers(await adminApi.listUsers()), []);
  useEffect(() => { reload(); }, [reload]);

  const pagedUsers = users.slice((page - 1) * pageSize, page * pageSize);

  const create = async () => {
    if (!form.email || !form.name) { toast.error('Email and name required'); return; }
    try {
      const res = await adminApi.createUser(form);
      setOpen(false); setForm({ email: '', name: '', role: 'agent' });
      reload();
      if (res.temp_password) setTempPw({ user: res.user, password: res.temp_password });
      toast.success('User created');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const reset = async (u) => {
    if (!window.confirm(`Reset password for ${u.name}?`)) return;
    try {
      const res = await adminApi.resetPassword(u.id);
      setTempPw({ user: u, password: res.temp_password });
      reload();
    } catch (e) { toast.error('Failed'); }
  };

  const deactivate = async (u) => {
    if (!window.confirm(`Deactivate ${u.name}? They will not be able to log in.`)) return;
    try { await adminApi.deactivateUser(u.id); reload(); toast.success('Deactivated'); }
    catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
  };

  const toggleActive = async (u) => {
    await adminApi.updateUser(u.id, { active: !u.active });
    reload();
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied'); };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team &amp; access</h1>
          <p className="text-neutral-500 mt-1">Manage delivery agents and admins.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#E11B22] hover:bg-[#B81319] text-white"><Plus className="h-4 w-4 mr-1.5"/>Invite member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite a team member</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label className="text-xs font-semibold mb-1.5 block">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/></div>
              <div><Label className="text-xs font-semibold mb-1.5 block">Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Delivery agent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    {isSuper && <SelectItem value="super_admin">Super admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-neutral-500">A temporary password will be generated and shown to you to share with the user. They will be required to change it on first login.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={create} className="bg-[#E11B22] hover:bg-[#B81319] text-white">Create user</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-neutral-200">
        <div className="divide-y divide-neutral-100">
          <div className="hidden md:grid grid-cols-12 px-6 py-3 bg-neutral-50 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <div className="col-span-4">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Last login</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {pagedUsers.map((u) => (
            <div key={u.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-0 px-6 py-3 items-center">
              <div className="md:col-span-4">
                <p className="text-sm font-semibold">{u.name}</p>
                <p className="text-xs text-neutral-500">{u.email}</p>
              </div>
              <div className="md:col-span-2">
                <Badge variant="outline" className="capitalize text-xs">{u.role.replace('_', ' ')}</Badge>
              </div>
              <div className="md:col-span-2">
                {u.active ? <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs"><ShieldCheck className="h-3 w-3 mr-1"/>Active</Badge> : <Badge className="bg-neutral-200 text-neutral-700 border-0 text-xs"><ShieldAlert className="h-3 w-3 mr-1"/>Inactive</Badge>}
              </div>
              <div className="md:col-span-2 text-xs text-neutral-500">{u.last_login_at ? formatDateTime(u.last_login_at) : 'Never'}</div>
              <div className="md:col-span-2 flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => reset(u)} className="text-xs"><KeyRound className="h-3.5 w-3.5 mr-1"/>Reset</Button>
                {u.active ? (
                  <Button variant="ghost" size="sm" onClick={() => deactivate(u)} className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"><UserX className="h-3.5 w-3.5 mr-1"/>Disable</Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(u)} className="text-xs">Enable</Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <PaginationControls
          page={page}
          pageCount={Math.ceil(users.length / pageSize)}
          total={users.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </Card>

      <Dialog open={!!tempPw} onOpenChange={(v) => !v && setTempPw(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Temporary password</DialogTitle></DialogHeader>
          {tempPw && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-neutral-600">Share this password with <span className="font-semibold">{tempPw.user.name}</span> ({tempPw.user.email}). They will be prompted to change it on first sign-in.</p>
              <div className="flex items-center gap-2">
                <Input readOnly value={tempPw.password} className="font-mono"/>
                <Button variant="outline" onClick={() => copy(tempPw.password)}><Copy className="h-4 w-4 mr-1.5"/>Copy</Button>
              </div>
              <p className="text-xs text-neutral-500">This password will not be shown again.</p>
            </div>
          )}
          <DialogFooter><Button onClick={() => setTempPw(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
