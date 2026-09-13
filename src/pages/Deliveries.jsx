import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Clock, CheckCircle2, AlertCircle, Wrench, FileCheck, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { clientsApi } from '../lib/api';
import { deliveryStages, teamProfiles } from '../constants';
import { stageClass, formatDate } from '../lib/utils';

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }

const DAILY_TARGET = 10;

export default function Deliveries() {
  const [clients, setClients] = useState([]);
  const [view, setView] = useState('calendar');
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [teamFilter, setTeamFilter] = useState(() => localStorage.getItem('active_team') || 'All Teams');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setClients(await clientsApi.list({}));
    setLoading(false);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const byStage = useMemo(() => {
    const m = {};
    deliveryStages.forEach((s) => { m[s] = []; });
    clients.forEach((c) => { if (m[c.stage]) m[c.stage].push(c); });
    return m;
  }, [clients]);

  const monthGrid = useMemo(() => {
    const first = startOfMonth(cursor);
    const startDay = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      const iso = date.toISOString().slice(0, 10);
      cells.push({ date, iso, deliveries: clients.filter((c) => c.delivery_date === iso) });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor, clients]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shared Handover Calendar</h1>
          <p className="text-neutral-500 mt-1">Unified view across Booking &amp; Handover teams for schedule balancing and vehicle prep</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <Filter className="h-3.5 w-3.5 text-neutral-400" />
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="h-6 border-0 bg-transparent shadow-none p-0 text-xs font-bold focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {teamProfiles.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Tabs value={view} onValueChange={setView}>
            <TabsList className="bg-white border border-neutral-200">
              <TabsTrigger value="calendar"><CalendarIcon className="h-4 w-4 mr-1.5"/>Calendar</TabsTrigger>
              <TabsTrigger value="pipeline"><List className="h-4 w-4 mr-1.5"/>Pipeline</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading schedule…</p>}

      {!loading && view === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {deliveryStages.map((stage) => (
            <Card key={stage} className="border-neutral-200 bg-neutral-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{stage}</CardTitle>
                  <Badge variant="outline" className="text-xs">{byStage[stage].length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {byStage[stage].map((c) => {
                  const arrivedPending = c.arrived && c.stage !== 'Delivered';
                  return (
                    <Link to={`/clients/${c.id}`} key={c.id} className={`block bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow ${arrivedPending ? 'border-amber-300' : 'border-neutral-200'}`}>
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5 truncate">{c.vehicle}</p>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-neutral-500">{formatDate(c.delivery_date)}</span>
                        <span className="text-neutral-400">{c.location || c.rego || ''}</span>
                      </div>
                      {arrivedPending && <p className="text-[10px] text-amber-700 mt-1">Arrived — update status</p>}
                    </Link>
                  );
                })}
                {byStage[stage].length === 0 && <p className="text-xs text-neutral-400 text-center py-4">Nothing here</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && view === 'calendar' && (
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 flex-wrap gap-2">
            <div>
              <CardTitle className="text-lg font-bold">{cursor.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</CardTitle>
              <p className="text-xs text-neutral-500 mt-0.5">Showing capacity targets (Daily Target: {DAILY_TARGET} deliveries)</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, -1))}><ChevronLeft className="h-4 w-4"/></Button>
              <Button variant="outline" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>Today</Button>
              <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="h-4 w-4"/></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2 text-center">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="px-2 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {monthGrid.map((cell, i) => {
                const cellKey = cell ? `cell-${cell.iso}` : `empty-${cursor.getFullYear()}-${cursor.getMonth()}-${i}`;
                const count = cell?.deliveries?.length || 0;
                const isOverCapacity = count > DAILY_TARGET;
                const isNearCapacity = count >= DAILY_TARGET * 0.8 && count <= DAILY_TARGET;

                return (
                  <div key={cellKey} className={`min-h-[125px] rounded-lg border ${cell ? 'border-neutral-200 bg-white' : 'border-transparent'} p-2 flex flex-col justify-between`}>
                    {cell && (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-extrabold text-neutral-800">{cell.date.getDate()}</span>
                            {count > 0 && (
                              <Badge className={`text-[10px] px-1.5 py-0 h-4 border-0 font-medium ${
                                isOverCapacity ? 'bg-red-100 text-red-800' : isNearCapacity ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {count}/{DAILY_TARGET}
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1">
                            {cell.deliveries.slice(0, 3).map((d) => {
                              const ready = d.handover_checklist_status === 'Signed copy on file' && d.activation_ready;
                              return (
                                <Link key={d.id} to={`/clients/${d.id}`} className={`block rounded px-1.5 py-1 text-[11px] font-medium truncate border transition-all ${
                                  ready ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-neutral-50 text-neutral-900 border-neutral-200 hover:border-neutral-300'
                                }`}>
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="truncate">{d.name.split(' ')[0]}</span>
                                    {ready && <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />}
                                  </div>
                                  <div className="text-[9px] text-neutral-500 truncate">{d.vehicle} {d.rego ? `· ${d.rego}` : ''}</div>
                                </Link>
                              );
                            })}
                            {cell.deliveries.length > 3 && (
                              <p className="text-[10px] text-neutral-500 font-semibold px-1">+ {cell.deliveries.length - 3} more handovers</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
