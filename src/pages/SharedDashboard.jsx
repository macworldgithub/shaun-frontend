import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { shareApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { AlertTriangle, MapPin, Truck, RefreshCw } from 'lucide-react';
import { stageClass, formatDate, formatDateTime } from '../lib/utils';
import { deliveryStages } from '../constants';

const REFRESH_MS = 30000;

export default function SharedDashboard() {
  const { token } = useParams();
  const [phase, setPhase] = useState('loading'); // loading | gate | denied | revoked | viewing
  const [info, setInfo] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [accessToken, setAccessToken] = useState(null);
  const [data, setData] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const i = await shareApi.info(token);
        setInfo(i);
        setPhase('gate');
      } catch (e) {
        if (e?.response?.status === 410) setPhase('revoked');
        else setPhase('denied');
      }
    })();
  }, [token]);

  const refresh = useCallback(async (at) => {
    try {
      const d = await shareApi.data(token, at);
      setData(d);
      setRefreshedAt(new Date());
    } catch (e) {
      if (e?.response?.status === 401 || e?.response?.status === 410) {
        setPhase('revoked');
      }
    }
  }, [token]);

  useEffect(() => {
    if (phase !== 'viewing' || !accessToken) return undefined;
    const id = setInterval(() => refresh(accessToken), REFRESH_MS);
    return () => clearInterval(id);
  }, [phase, accessToken, refresh]);

  const enter = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await shareApi.access(token, email.trim().toLowerCase());
      setAccessToken(res.access_token);
      setPhase('viewing');
      refresh(res.access_token);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) setError('This email is not authorised to view this dashboard.');
      else if (status === 410) { setPhase('revoked'); }
      else setError(err?.response?.data?.detail || 'Could not access');
    }
  };

  const sortedAgents = useMemo(
    () => (data?.by_agent || []).slice().sort((a, b) => b.count - a.count),
    [data?.by_agent],
  );

  if (phase === 'loading') return <Center><div className="h-8 w-8 border-2 border-neutral-200 border-t-[#E11B22] rounded-full animate-spin"/></Center>;
  if (phase === 'denied') return <Center><Card className="max-w-md"><CardContent className="p-8 text-center"><AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3"/><h1 className="font-bold text-lg mb-1">Link not found</h1><p className="text-sm text-neutral-600">This share link is invalid or has been removed.</p></CardContent></Card></Center>;
  if (phase === 'revoked') return <Center><Card className="max-w-md"><CardContent className="p-8 text-center"><AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3"/><h1 className="font-bold text-lg mb-1">Access ended</h1><p className="text-sm text-neutral-600">This link has expired or been revoked. Please request a new one.</p></CardContent></Card></Center>;

  if (phase === 'gate') {
    return (
      <Center>
        <div className="w-full max-w-md">
          <Brand/>
          <Card className="border-neutral-200 shadow-sm">
            <CardContent className="p-7">
              <h1 className="text-xl font-bold tracking-tight mb-1">{info?.label || 'Live dashboard'}</h1>
              <p className="text-sm text-neutral-500 mb-5">{info?.restricted ? 'Enter your authorised email to continue.' : 'Enter your email to continue. Your visit will be logged.'}</p>
              <form onSubmit={enter} className="space-y-3">
                <Label className="text-xs font-semibold mb-1.5 block">Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" autoFocus/>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <Button type="submit" className="w-full bg-[#E11B22] hover:bg-[#B81319] text-white">View dashboard</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Center>
    );
  }

  if (!data) return <Center><div className="h-8 w-8 border-2 border-neutral-200 border-t-[#E11B22] rounded-full animate-spin"/></Center>;

  const totals = data.totals;
  const cards = [
    { label: 'Total in pipeline', value: totals.total_clients, tone: 'bg-blue-50 text-blue-600', icon: Truck },
    { label: 'Arrived · pending', value: totals.arrived_pending, tone: 'bg-amber-50 text-amber-700', icon: AlertTriangle },
    { label: 'Not contacted', value: totals.not_contacted, tone: 'bg-rose-50 text-rose-600', icon: AlertTriangle },
    { label: 'Delivered (7 days)', value: totals.delivered_this_week, tone: 'bg-emerald-50 text-emerald-700', icon: Truck },
  ];
  const totalByStage = Object.values(data.by_stage || {}).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img src="/delivery-centre-logo.svg" alt="" className="h-9 w-9"/>
            <div className="leading-tight">
              <p className="text-[10px] font-bold tracking-[0.18em] text-[#E11B22]">DELIVERY CENTRE</p>
              <p className="font-bold text-sm">BYD Melbourne &amp; Fairfield</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="outline" className="text-xs">Live</Badge>
            <span className="text-neutral-500">Updated {refreshedAt ? formatDateTime(refreshedAt) : '—'}</span>
            <Button variant="outline" size="sm" onClick={() => refresh(accessToken)} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5"/>Refresh</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{data.label || 'Live dashboard'}</h1>
          <p className="text-neutral-500 mt-1">Real-time view of the delivery pipeline.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Card key={c.label} className="border-neutral-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 font-medium">{c.label}</p>
                    <p className="text-3xl font-bold mt-1.5">{c.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${c.tone}`}><c.icon className="h-5 w-5"/></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-neutral-200">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Pipeline by stage</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {deliveryStages.map((stage) => {
                const count = data.by_stage?.[stage] || 0;
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-neutral-700">{stage}</span>
                      <span className="text-neutral-500">{count}</span>
                    </div>
                    <Progress value={(count / totalByStage) * 100} className="h-1.5"/>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-neutral-200">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">By delivery agent</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {sortedAgents.length === 0 && <p className="text-sm text-neutral-500">No active deliveries.</p>}
              {sortedAgents.map((a) => (
                <div key={a.agent_id} className="flex items-center justify-between text-sm py-1">
                  <span className={a.agent_id === 'unassigned' ? 'italic text-neutral-500' : 'text-neutral-700'}>{a.agent_name}</span>
                  <Badge variant="outline" className="text-xs">{a.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-neutral-200">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Upcoming deliveries</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {(data.upcoming || []).length === 0 && <p className="px-6 py-6 text-sm text-neutral-500 text-center">No upcoming deliveries.</p>}
              {(data.upcoming || []).map((c) => (
                <div key={c.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{c.name}</p>
                      {c.arrived && c.stage !== 'Delivered' && <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px]">Arrived</Badge>}
                    </div>
                    <p className="text-xs text-neutral-500 truncate flex items-center gap-2">{c.vehicle} {c.location && <><MapPin className="h-3 w-3"/>{c.location}</>}</p>
                  </div>
                  <div className="text-right hidden sm:block text-xs text-neutral-500">{formatDate(c.delivery_date)}<br/>{c.salesperson || '—'}</div>
                  <Badge className={`${stageClass(c.stage)} font-medium border-0`}>{c.stage}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-neutral-400 py-6">BYD Melbourne &amp; Fairfield · Delivery Centre. Auto-refreshes every {REFRESH_MS / 1000} seconds.</p>
      </main>
    </div>
  );
}

function Center({ children }) {
  return <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">{children}</div>;
}

function Brand() {
  return (
    <div className="flex items-center gap-3 mb-8 justify-center">
      <img src="/delivery-centre-logo.svg" alt="" className="h-12 w-12"/>
      <div className="leading-tight">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#E11B22]">DELIVERY CENTRE</p>
        <p className="font-bold text-lg tracking-tight">BYD Melbourne &amp; Fairfield</p>
      </div>
    </div>
  );
}
