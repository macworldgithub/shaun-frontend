import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ArrowUpRight, AlertTriangle, UserPlus, Phone, FileWarning, BadgeAlert, ClipboardCheck, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { adminApi, clientsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { stageClass, formatDate } from '../lib/utils';
import { deliveryStages } from '../constants';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [needsAttention, setNeedsAttention] = useState({ arrivedPending: [], notContacted: [] });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshingOffers, setRefreshingOffers] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, list, alertList] = await Promise.all([adminApi.stats(), clientsApi.list({}), clientsApi.alerts().catch(() => [])]);
        if (cancelled) return;
        setStats(s);
        setAlerts(alertList);
        const upcoming = [...list]
          .filter((c) => c.stage !== 'Delivered')
          .sort((a, b) => (a.delivery_date || '').localeCompare(b.delivery_date || ''))
          .slice(0, 6);
        setUpcoming(upcoming);
        setNeedsAttention({
          arrivedPending: list.filter((c) => c.arrived && c.stage !== 'Delivered').slice(0, 5),
          notContacted: list.filter((c) => c.contact_status === 'Not Contacted').slice(0, 5),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshOffers = async () => {
    setRefreshingOffers(true);
    try {
      const snapshot = await clientsApi.fetchOfferSnapshot().catch(() => null);
      await clientsApi.refreshOffers();
      toast.success(snapshot?.changed ? 'Offer page changed; catalogue refreshed and deals re-scored' : 'Offer catalogue refreshed and open deals re-scored');
    }
    catch (e) { toast.error(e?.response?.data?.detail || 'Offer refresh failed'); }
    finally { setRefreshingOffers(false); }
  };

  const cards = useMemo(() => stats ? [
    { label: 'Total in pipeline', value: stats.total_clients - (stats.by_stage?.Delivered || 0), icon: Truck, accent: 'bg-blue-50 text-blue-600' },
    { label: 'Arrived · pending update', value: stats.arrived_pending, icon: AlertTriangle, accent: 'bg-amber-50 text-amber-700' },
    { label: 'Not contacted', value: stats.not_contacted, icon: Phone, accent: 'bg-rose-50 text-rose-600' },
    { label: 'Unassigned', value: stats.unassigned, icon: UserPlus, accent: 'bg-violet-50 text-violet-600' },
    { label: 'Docs outstanding', value: stats.docs_outstanding, icon: FileWarning, accent: 'bg-orange-50 text-orange-700' },
    { label: 'Offers / trades at risk', value: (stats.offers_at_risk || 0) + (stats.trade_ins_at_risk || 0), icon: BadgeAlert, accent: 'bg-red-50 text-red-700' },
    { label: 'Ready to hand over', value: stats.ready_to_handover, icon: ClipboardCheck, accent: 'bg-emerald-50 text-emerald-700' },
  ] : [], [stats]);

  if (loading) return <DashboardSkeleton/>;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-neutral-500 mt-1">Live pipeline across BYD Melbourne &amp; Fairfield Delivery Centre.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={refreshOffers} disabled={refreshingOffers}><RefreshCw className={`h-4 w-4 ${refreshingOffers ? 'animate-spin' : ''}`}/>Refresh offers</Button>
          <Link to="/deliveries"><Button variant="outline" className="gap-2">View pipeline <ArrowUpRight className="h-4 w-4"/></Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-neutral-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-500 font-medium">{c.label}</p>
                  <p className="text-3xl font-bold mt-1.5">{c.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${c.accent}`}>
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-neutral-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Upcoming deliveries</CardTitle>
            <Link to="/deliveries" className="text-sm text-[#E11B22] hover:underline font-medium">See all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {upcoming.length === 0 && <p className="px-6 py-8 text-sm text-neutral-500 text-center">No upcoming deliveries.</p>}
              {upcoming.map((c) => (
                <Link to={`/clients/${c.id}`} key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50">
                  <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center font-semibold text-sm text-neutral-700">
                    {(c.name || '').split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      {c.arrived && c.stage !== 'Delivered' && <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px]">Arrived</Badge>}
                    </div>
                    <p className="text-xs text-neutral-500 truncate">{c.vehicle} {c.location ? `· ${c.location}` : ''}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{formatDate(c.delivery_date)}</p>
                    <p className="text-xs text-neutral-500">{c.salesperson || '—'}</p>
                  </div>
                  <Badge className={`${stageClass(c.stage)} font-medium border-0`}>{c.stage}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Pipeline health</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {deliveryStages.map((stage) => {
              const count = stats?.by_stage?.[stage] || 0;
              const total = Object.values(stats?.by_stage || {}).reduce((a, b) => a + b, 0) || 1;
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-neutral-700">{stage}</span>
                    <span className="text-neutral-500">{count}</span>
                  </div>
                  <Progress value={(count / total) * 100} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttentionCard
          title="Arrived · awaiting status update"
          tone="amber"
          empty="Nothing waiting — great work!"
          items={needsAttention.arrivedPending}
        />
        <AttentionCard
          title="Not yet contacted"
          tone="rose"
          empty="Every client has been contacted."
          items={needsAttention.notContacted}
        />
      </div>

      {alerts.length > 0 && <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">BYD workflow alerts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {alerts.slice(0, 10).map((alert) => <Link key={alert.id} to={`/clients/${alert.client_id}`} className="flex items-center gap-3 rounded-md bg-white px-3 py-2 text-sm hover:bg-neutral-50"><AlertTriangle className={`h-4 w-4 ${alert.severity === 'danger' ? 'text-red-600' : 'text-amber-600'}`} /><span>{alert.message}</span></Link>)}
        </CardContent>
      </Card>}
    </div>
  );
}

function AttentionCard({ title, items, empty, tone }) {
  const ring = tone === 'amber' ? 'border-amber-200 bg-amber-50/40' : 'border-rose-200 bg-rose-50/30';
  return (
    <Card className={`border ${ring}`}>
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-neutral-100">
          {items.length === 0 && <p className="px-6 py-6 text-sm text-neutral-500 text-center">{empty}</p>}
          {items.map((c) => (
            <Link key={c.id} to={`/clients/${c.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-white">
              <div className="h-8 w-8 rounded-full bg-white border border-neutral-200 text-xs font-semibold flex items-center justify-center text-neutral-700">
                {(c.name || '').split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{c.name}</p>
                <p className="text-xs text-neutral-500 truncate">{c.vehicle} · {c.location || formatDate(c.delivery_date) || '—'}</p>
              </div>
              <Badge variant="outline" className="text-xs">{c.stage}</Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-72 bg-neutral-100 animate-pulse rounded"/>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => <div key={i} className="h-28 bg-white border border-neutral-200 rounded-lg animate-pulse"/>)}
      </div>
      <div className="h-72 bg-white border border-neutral-200 rounded-lg animate-pulse"/>
    </div>
  );
}
