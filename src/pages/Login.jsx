import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email.trim().toLowerCase(), password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}`);
      const dest = u.must_change_password ? '/change-password' : (location.state?.from || '/dashboard');
      nav(dest, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <img src="/delivery-centre-logo.svg" alt="" className="h-12 w-12" />
          <div className="leading-tight">
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#E11B22]">DELIVERY CENTRE</p>
            <p className="font-bold text-lg tracking-tight">BYD Melbourne &amp; Fairfield</p>
          </div>
        </div>
        <Card className="border-neutral-200 shadow-sm">
          <CardContent className="p-7">
            <h1 className="text-2xl font-bold tracking-tight mb-1">Sign in</h1>
            <p className="text-sm text-neutral-500 mb-6">Sign in to manage deliveries.</p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={busy} className="w-full bg-[#E11B22] hover:bg-[#B81319] text-white">
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
