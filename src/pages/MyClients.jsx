import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, AlertTriangle, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { clientsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { stageClass, formatDate } from '../lib/utils';
import PaginationControls from '../components/PaginationControls';

export default function MyClients() {
  const { user } = useAuth();
  const [mine, setMine] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const [m, u] = await Promise.all([
      clientsApi.list({ mine: true }),
      clientsApi.list({ unassigned: true }),
    ]);
    setMine(m); setUnassigned(u); setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const claim = async (id) => {
    await clientsApi.update(id, { assigned_agent_id: user.id });
    reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My clients</h1>
        <p className="text-neutral-500 mt-1">Your assigned deliveries plus the open queue you can claim from.</p>
      </div>

      <Tabs defaultValue="mine">
        <TabsList className="bg-white border border-neutral-200">
          <TabsTrigger value="mine">Assigned to me <Badge variant="outline" className="ml-2 text-[10px]">{mine.length}</Badge></TabsTrigger>
          <TabsTrigger value="unassigned">Unallocated queue <Badge variant="outline" className="ml-2 text-[10px]">{unassigned.length}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4">
          <ClientGroup loading={loading} clients={mine} empty="No clients assigned to you yet."/>
        </TabsContent>
        <TabsContent value="unassigned" className="mt-4">
          <ClientGroup loading={loading} clients={unassigned} empty="Nothing in the queue — nice work." onClaim={claim}/>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClientGroup({ loading, clients, empty, onClaim }) {
  const [page, setPage] = useState(1);
  const pageSize = 12;
  useEffect(() => { setPage(1); }, [clients.length]);

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (clients.length === 0) return (
    <Card className="border-neutral-200"><CardContent className="py-12 text-center text-sm text-neutral-500"><Inbox className="h-8 w-8 mx-auto mb-2 text-neutral-300"/>{empty}</CardContent></Card>
  );
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {clients.slice((page - 1) * pageSize, page * pageSize).map((c) => {
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
        pageCount={Math.ceil(clients.length / pageSize)}
        total={clients.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </>
  );
}
