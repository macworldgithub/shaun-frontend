import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ArrowUpRight, AlertTriangle, UserPlus, Phone, FileWarning, BadgeAlert, ClipboardCheck, RefreshCw, MessageSquare, FileText, Calendar, Target, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { adminApi, clientsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { stageClass, formatDate, formatDateTime } from '../lib/utils';
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

  const activeSite = localStorage.getItem('active_site') || 'Fairfield';
  const activeTeam = localStorage.getItem('active_team') || 'All Teams';

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

  const todayCompleted = stats?.today_completed || 0;
  const dailyTarget = stats?.daily_target || 10;
  const targetPercent = Math.min(100, Math.round((todayCompleted / dailyTarget) * 100));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
            <Badge variant="outline" className="text-xs bg-neutral-100">{activeTeam}</Badge>
          </div>
          <p className="text-neutral-500 mt-1">Live operational metrics &amp; handover pipeline for BYD {activeSite}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={refreshOffers} disabled={refreshingOffers}><RefreshCw className={`h-4 w-4 ${refreshingOffers ? 'animate-spin' : ''}`}/>Refresh offers</Button>
          <Link to="/deliveries"><Button className="bg-[#E11B22] text-white hover:bg-[#B81319] gap-2">View calendar <ArrowUpRight className="h-4 w-4"/></Button></Link>
        </div>
      </div>

      {/* 1. Daily Metrics & Pipeline Banner */}
      <Card className="border-neutral-200 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {/* Target progress */}
            <div className="md:col-span-1 border-r border-neutral-700 pr-4">
              <div className="flex items-center gap-2 text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <Target className="h-4 w-4 text-[#E11B22]" /> Daily Handover Target
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-extrabold">{todayCompleted} <span className="text-sm font-normal text-neutral-400">/ {dailyTarget} completed</span></span>
                <span className="text-xs font-semibold text-emerald-400">{targetPercent}%</span>
              </div>
              <Progress value={targetPercent} className="h-2 bg-neutral-700" />
            </div>

            {/* Short-term Delivery Pipelines */}
            <div className="md:col-span-3 grid grid-cols-3 gap-4">
              <Link to="/deliveries" className="bg-neutral-800/80 hover:bg-neutral-800 p-3.5 rounded-xl border border-neutral-700/60 block transition-all">
                <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Today</p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold">{stats?.pipeline_today || 0}</span>
                  <span className="text-[11px] text-emerald-400 font-medium">Handovers</span>
                </div>
              </Link>
              <Link to="/deliveries" className="bg-neutral-800/80 hover:bg-neutral-800 p-3.5 rounded-xl border border-neutral-700/60 block transition-all">
                <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Tomorrow</p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold">{stats?.pipeline_tomorrow || 0}</span>
                  <span className="text-[11px] text-blue-400 font-medium">Scheduled</span>
                </div>
              </Link>
              <Link to="/deliveries" className="bg-neutral-800/80 hover:bg-neutral-800 p-3.5 rounded-xl border border-neutral-700/60 block transition-all">
                <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">+1 Day</p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold">{stats?.pipeline_plus_one || 0}</span>
                  <span className="text-[11px] text-purple-400 font-medium">Upcoming</span>
                </div>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. "Leak Prevention" Exception Views */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-bold tracking-tight">Leak Prevention &amp; Exception View</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/clients?filter=overdue" className="block">
            <Card className="border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-amber-800 tracking-wide">Overdue updates</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{stats?.overdue_updates || 0}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/clients?filter=trade_in" className="block">
            <Card className="border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-red-800 tracking-wide">Expiring trade-in policy</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">{stats?.trade_ins_at_risk || 0}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
                  <BadgeAlert className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/clients?filter=unallocated" className="block">
            <Card className="border-purple-200 bg-purple-50/50 hover:bg-purple-50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-purple-800 tracking-wide">Unallocated stock / VIN</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{stats?.unallocated_stock || 0}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                  <Truck className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/clients?filter=docs" className="block">
            <Card className="border-orange-200 bg-orange-50/50 hover:bg-orange-50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-orange-800 tracking-wide">Missing paperwork</p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">{stats?.docs_outstanding || 0}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700">
                  <FileWarning className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* 3. Clickable Action Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Messages Feed */}
        <Card className="border-neutral-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#E11B22]" /> Incoming Messages Feed
            </CardTitle>
            <Link to="/messages" className="text-xs text-[#E11B22] font-semibold hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {(!stats?.recent_messages || stats.recent_messages.length === 0) ? (
                <p className="px-6 py-6 text-sm text-neutral-500 text-center">No incoming messages received yet.</p>
              ) : (
                stats.recent_messages.map((m) => (
                  <Link key={m.id} to={m.client_id ? `/clients/${m.client_id}` : '/messages'} className="flex items-start gap-3 px-6 py-3.5 hover:bg-neutral-50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-red-100 text-[#E11B22] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {(m.client_name || 'C').split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{m.client_name || m.phone}</p>
                        <span className="text-[10px] text-neutral-400">{formatDateTime(m.sent_at)}</span>
                      </div>
                      <p className="text-xs text-neutral-600 truncate mt-0.5">{m.body}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Notifications Feed */}
        <Card className="border-neutral-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" /> Document Upload Notifications
            </CardTitle>
            <Link to="/clients" className="text-xs text-[#E11B22] font-semibold hover:underline">View clients</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {(!stats?.recent_doc_uploads || stats.recent_doc_uploads.length === 0) ? (
                <p className="px-6 py-6 text-sm text-neutral-500 text-center">No recent document uploads.</p>
              ) : (
                stats.recent_doc_uploads.map((doc, idx) => (
                  <Link key={idx} to={`/clients/${doc.client_id}`} className="flex items-start gap-3 px-6 py-3.5 hover:bg-neutral-50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{doc.client_name}</p>
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">New File</Badge>
                      </div>
                      <p className="text-xs text-neutral-600 truncate mt-0.5">
                        <span className="font-medium text-neutral-800">{doc.document_type}</span> {doc.file_name ? `(${doc.file_name})` : ''}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main cards grid */}
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
