import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export default function ChangePassword() {
  const { user, refresh, logout } = useAuth();
  const nav = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (next !== confirm) { toast.error('Passwords do not match'); return; }
    setBusy(true);
    try {
      await authApi.changePassword(current, next);
      await refresh();
      toast.success('Password updated');
      nav('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="border-neutral-200 shadow-sm">
          <CardContent className="p-7">
            <h1 className="text-2xl font-bold tracking-tight mb-1">Set a new password</h1>
            <p className="text-sm text-neutral-500 mb-6">{user?.must_change_password ? 'For security, please change your temporary password before continuing.' : 'Update your password.'}</p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Current password</Label>
                <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoFocus />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">New password</Label>
                <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Confirm new password</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => { logout(); nav('/login'); }}>Sign out</Button>
                <Button type="submit" disabled={busy} className="flex-1 bg-[#E11B22] hover:bg-[#B81319] text-white">Update password</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
