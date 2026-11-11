import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, AlertTriangle, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { clientsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';
import { stageClass, formatDate } from '../lib/utils';
import PaginationControls from '../components/PaginationControls';
import { toast } from 'sonner';

export default function MyClients() {
  const { user } = useAuth();
  const { activeSite } = useSite();
  const [mine, setMine] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minePage, setMinePage] = useState(1);
  const [queuePage, setQueuePage] = useState(1);
  const [mineTotal, setMineTotal] = useState(0);
  const [queueTotal, setQueueTotal] = useState(0);
  const requestVersion = useRef(0);

  const reload = useCallback(async () => {
    setLoading(true);
    const siteParams = {};
    if (activeSite && activeSite !== 'All Sites') {
      siteParams.site_location = activeSite;
    }
    const version = ++requestVersion.current;
    try {
      const [m, u] = await Promise.all([
        clientsApi.page({ mine: true, page: minePage, limit: 12, ...siteParams }),
        clientsApi.page({ unassigned: true, page: queuePage, limit: 12, ...siteParams }),
      ]);
      if (version !== requestVersion.current) return;
      setMine(m.items); setMineTotal(m.total);
      setUnassigned(u.items); setQueueTotal(u.total);
      setMinePage((current) => Math.min(current, Math.max(1, m.pages)));
      setQueuePage((current) => Math.min(current, Math.max(1, u.pages)));
    } catch { if (version === requestVersion.current) toast.error('Could not load your clients'); }
    finally { if (version === requestVersion.current) setLoading(false); }
  }, [activeSite, minePage, queuePage]);

  useEffect(() => { reload(); return () => { requestVersion.current += 1; }; }, [reload]);
  useEffect(() => { setMinePage(1); setQueuePage(1); }, [activeSite]);

  const claim = async (id) => {
    await clientsApi.update(id, { assigned_agent_id: user.id });
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My clients</h1>
          <p className="text-neutral-500 mt-1">
            Your assigned deliveries plus the open queue you can claim from ({activeSite === 'All Sites' ? 'all sites' : activeSite}).
          </p>
        </div>
        {activeSite !== 'All Sites' && (
          <Badge variant="outline" className="bg-white border-neutral-300 text-neutral-700 gap-1.5 py-1 px-3">
            <MapPin className="h-3.5 w-3.5 text-[#E11B22]" /> Filtered: {activeSite}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="mine">
        <TabsList className="bg-white border border-neutral-200">
          <TabsTrigger value="mine">Assigned to me <Badge variant="outline" className="ml-2 text-[10px]">{mineTotal}</Badge></TabsTrigger>
          <TabsTrigger value="unassigned">Unallocated queue <Badge variant="outline" className="ml-2 text-[10px]">{queueTotal}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4">
          <ClientGroup loading={loading} clients={mine} page={minePage} total={mineTotal} onPageChange={setMinePage} empty="No clients assigned to you yet."/>
        </TabsContent>
        <TabsContent value="unassigned" className="mt-4">
          <ClientGroup loading={loading} clients={unassigned} page={queuePage} total={queueTotal} onPageChange={setQueuePage} empty="Nothing in the queue — nice work." onClaim={claim}/>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClientGroup({ loading, clients, empty, onClaim, page, total, onPageChange }) {
  const pageSize = 12;

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (clients.length === 0) return (
    <Card className="border-neutral-200"><CardContent className="py-12 text-center text-sm text-neutral-500"><Inbox className="h-8 w-8 mx-auto mb-2 text-neutral-300"/>{empty}</CardContent></Card>
  );
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {clients.map((c) => {
        const arrivedPending = c.arrived && c.stage !== 'Delivered';
        return (
          <Card key={c.id} className={`border ${arrivedPending ? 'border-amber-300 bg-amber-50/40' : 'border-neutral-200'} hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/clients/${c.id}`} className="font-semibold text-sm hover:underline truncate block">{c.name}</Link>
                  <p className="text-xs text-neutral-500 truncate">{c.vehicle}</p>
                </div>
                <Badge className={`${stageClass(c.stage)} border-0`}>{c.stage}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3"/>{c.phone}</span>
                {c.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{c.location}</span>}
                <span>· {formatDate(c.delivery_date) || 'No date'}</span>
              </div>
              {arrivedPending && (
                <p className="text-xs text-amber-800 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Arrived — status not yet updated</p>
              )}
              {c.contact_status === 'Not Contacted' && <p className="text-xs text-rose-700">Customer not yet contacted</p>}
              {onClaim && (
                <Button size="sm" variant="outline" onClick={() => onClaim(c.id)} className="w-full mt-2">Claim</Button>
              )}
            </CardContent>
          </Card>
        );
      })}
      </div>
      <PaginationControls
        page={page}
        pageCount={Math.ceil(total / pageSize)}
        total={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </>
  );
}
