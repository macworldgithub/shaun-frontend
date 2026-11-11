import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Clock, CheckCircle2, AlertCircle, Wrench, FileCheck, Filter, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { clientsApi } from '../lib/api';
import { deliveryStages, teamProfiles } from '../constants';
import { useSite } from '../contexts/SiteContext';
import { stageClass, formatDate, getReadinessDetails } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { BookingEditor } from '../components/BookingFields';
import { localDateKey, bookingCounts, bookingLabel } from '../lib/deliveryBooking';

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }

const DAILY_TARGET = 10;

export default function Deliveries() {
  const navigate = useNavigate();
  const { activeSite, setActiveSite, siteLocations, filterClientsBySite } = useSite();
  const [clients, setClients] = useState([]);
  const [view, setView] = useState('calendar');
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [teamFilter, setTeamFilter] = useState(() => localStorage.getItem('active_team') || 'All Teams');
  const [onlyReady, setOnlyReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [daySlots, setDaySlots] = useState([]);
  const [slotsError, setSlotsError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = {};
    if (activeSite && activeSite !== 'All Sites') {
      params.site_location = activeSite;
    }
    if (view === 'calendar') {
      params.date_from = localDateKey(startOfMonth(cursor));
      params.date_to = localDateKey(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
    }
    try { const list = await clientsApi.summary(params); return list; }
    catch { setError('Could not load the delivery schedule. Please retry.'); return []; }
    finally { setLoading(false); }
  }, [activeSite, cursor, view]);

  useEffect(() => {
    let active = true;
    setSelectedDay(null); setSelectedBooking(null);
    reload().then((list) => { if (active) setClients(list); });
    return () => { active = false; };
  }, [reload]);

  useEffect(() => {
    let active = true;
    setDaySlots([]); setSlotsError('');
    if (!selectedDay || activeSite === 'All Sites') return;
    clientsApi.slots({ day: selectedDay, site_location: activeSite }).then((result) => {
      if (active) setDaySlots(result.slots);
    }).catch(() => { if (active) setSlotsError('Could not load times. Reopen this day to retry.'); });
    return () => { active = false; };
  }, [selectedDay, activeSite, clients]);

  const displayClients = useMemo(() => {
    let list = filterClientsBySite(clients, activeSite);
    if (onlyReady) {
      list = list.filter((c) => getReadinessDetails(c).isReady);
    }
    return list;
  }, [clients, onlyReady, filterClientsBySite, activeSite]);

  const readyCount = useMemo(() => {
    return clients.filter((c) => getReadinessDetails(c).isReady && c.stage !== 'Delivered').length;
  }, [clients]);

  const byStage = useMemo(() => {
    const m = {};
    deliveryStages.forEach((s) => { m[s] = []; });
    displayClients.forEach((c) => { if (m[c.stage]) m[c.stage].push(c); });
    return m;
  }, [displayClients]);

  const monthGrid = useMemo(() => {
    const first = startOfMonth(cursor);
    const startDay = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      const iso = localDateKey(date);
      cells.push({ date, iso, deliveries: displayClients.filter((c) => c.delivery_date === iso) });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor, displayClients]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shared Handover Calendar</h1>
          <p className="text-neutral-500 mt-1">Unified view across Booking &amp; Handover teams for schedule balancing and vehicle prep</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant={onlyReady ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyReady(!onlyReady)}
            className={`gap-1.5 text-xs font-semibold ${onlyReady ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-neutral-200 text-neutral-700'}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Ready For Delivery Only
            <Badge className={`ml-1 text-[10px] px-1 py-0 ${onlyReady ? 'bg-emerald-800 text-white' : 'bg-neutral-100 text-neutral-700'}`}>
              {readyCount}
            </Badge>
          </Button>
          {/* Site Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <MapPin className="h-3.5 w-3.5 text-[#E11B22]" />
            <Select value={activeSite} onValueChange={setActiveSite}>
              <SelectTrigger className="h-6 border-0 bg-transparent shadow-none p-0 text-xs font-bold focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {siteLocations.map((site) => (
                  <SelectItem key={site} value={site}>{site}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
      {error && <p role="alert" className="text-sm text-red-700">{error} <Button variant="outline" onClick={async () => setClients(await reload())}>Retry</Button></p>}

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
                  const readiness = getReadinessDetails(c);
                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/clients/${c.id}`)}
                      className={`block bg-white border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer ${
                        readiness.isReady
                          ? 'border-emerald-400 bg-gradient-to-br from-emerald-50/50 to-white ring-1 ring-emerald-300/50 shadow-xs'
                          : arrivedPending
                          ? 'border-amber-300'
                          : 'border-neutral-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-semibold text-sm truncate">{c.name}</p>
                        {readiness.isReady && (
                          <Badge className="bg-emerald-600 text-white font-extrabold text-[9px] px-1.5 py-0 h-4 shrink-0 tracking-wide uppercase">
                            Ready For Delivery
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 truncate">{c.vehicle}</p>

                      {/* 4 Operational Requirements Checklist Pills */}
                      <div className="grid grid-cols-4 gap-1 mt-2 text-[9px] font-medium">
                        <span className={`px-1 py-0.5 rounded text-center truncate ${readiness.payment ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-400'}`} title="Payment Complete">
                          {readiness.payment ? '✓ Pay' : '○ Pay'}
                        </span>
                        <span className={`px-1 py-0.5 rounded text-center truncate ${readiness.tradeInDocs ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-400'}`} title="Trade-in Docs Returned">
                          {readiness.tradeInDocs ? '✓ Trade' : '○ Trade'}
                        </span>
                        <span className={`px-1 py-0.5 rounded text-center truncate ${readiness.pdi ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-400'}`} title="Pre-Delivery Inspection Complete">
                          {readiness.pdi ? '✓ PDI' : '○ PDI'}
                        </span>
                        <span className={`px-1 py-0.5 rounded text-center truncate ${readiness.registrationDocs ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-400'}`} title="Registration Docs Returned">
                          {readiness.registrationDocs ? '✓ Rego' : '○ Rego'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-100 text-xs">
                        <span className="text-neutral-500 font-medium">{formatDate(c.delivery_date)}</span>
                        <span className="text-neutral-400">{c.location || c.rego || ''}</span>
                      </div>
                      <div className="mt-1.5 pt-1 border-t border-dashed border-neutral-100 flex items-center justify-between">
                        <span className={`text-[10px] font-semibold ${c.pdi_complete ? 'text-emerald-700' : 'text-neutral-500'}`}>
                          {c.pdi_complete ? '✓ Inspection Signed' : '○ Inspection Draft'}
                        </span>
                        <Link
                          to={`/clients/${c.id}/inspection`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-bold text-[#E11B22] hover:underline flex items-center gap-0.5"
                        >
                          <FileCheck className="h-3 w-3" /> Digital Form
                        </Link>
                      </div>
                      {arrivedPending && <p className="text-[10px] text-amber-700 mt-1">Arrived — update status</p>}
                    </div>
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
                            <button type="button" aria-label={`Open deliveries for ${cell.iso}`} onClick={() => { setSelectedDay(cell.iso); setSelectedBooking(null); }} className="text-xs font-extrabold text-neutral-800 underline-offset-2 hover:underline">{cell.date.getDate()}</button>
                            {count > 0 && (
                              <Badge className={`text-[10px] px-1.5 py-0 h-4 border-0 font-medium ${
                                isOverCapacity ? 'bg-red-100 text-red-800' : isNearCapacity ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {count}/{DAILY_TARGET}
                              </Badge>
                            )}
                          </div>
                          <button type="button" onClick={() => { setSelectedDay(cell.iso); setSelectedBooking(null); }}
                            aria-label={`Summary for ${cell.iso}`} className="w-full rounded border border-blue-200 bg-blue-50 px-1 py-1 mb-2 text-[10px] sm:text-xs font-semibold text-blue-900 hover:bg-blue-100">
                            {bookingCounts(cell.deliveries).estimated} est / {bookingCounts(cell.deliveries).confirmed} confirmed
                          </button>
                          <div className="space-y-1">
                            {cell.deliveries.slice(0, 3).map((d) => {
                              const readiness = getReadinessDetails(d);
                              const ready = readiness.isReady;
                              return (
                                <Link
                                  key={d.id}
                                  to={`/clients/${d.id}`}
                                  className={`block rounded px-1.5 py-1 text-[11px] font-medium truncate border transition-all ${
                                    ready
                                      ? 'bg-emerald-50 text-emerald-950 border-emerald-300 ring-1 ring-emerald-300/60 shadow-xs'
                                      : 'bg-neutral-50 text-neutral-900 border-neutral-200 hover:border-neutral-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="truncate">{d.name.split(' ')[0]}</span>
                                    {ready && (
                                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded shrink-0">
                                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 shrink-0" /> Ready
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[9px] text-neutral-500 truncate">{d.delivery_time || 'Time TBC'} · {bookingLabel(d)}</div>
                                  <div className="text-[9px] text-neutral-500 truncate">{d.vehicle} {d.rego ? `· ${d.rego}` : ''}</div>
                                </Link>
                              );
                            })}
                            {cell.deliveries.length > 3 && (
                              <button type="button" onClick={() => { setSelectedDay(cell.iso); setSelectedBooking(null); }} className="text-[10px] text-blue-700 font-semibold px-1 underline">+ {cell.deliveries.length - 3} more handovers</button>
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
      <Dialog open={!!selectedDay} onOpenChange={(open) => { if (!open) { setSelectedDay(null); setSelectedBooking(null); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deliveries for {selectedDay}</DialogTitle>
            <DialogDescription>All customers and available delivery times for {activeSite}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {clients.filter((c) => c.delivery_date === selectedDay).sort((a, b) => (a.delivery_time || '99:99').localeCompare(b.delivery_time || '99:99')).map((customer) =>
              <div key={customer.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                <div><Link className="text-sm font-semibold underline" to={`/clients/${customer.id}`}>{customer.name}</Link>
                  <p className="text-xs text-neutral-500">{customer.vehicle} · {bookingLabel(customer)} · {customer.delivery_time || 'Time TBC'} · {customer.site_location}</p></div>
                <Button size="sm" variant="outline" onClick={() => setSelectedBooking(customer)}>Book time</Button>
              </div>)}
            {!clients.some((c) => c.delivery_date === selectedDay) && <p className="text-sm text-neutral-500">No deliveries booked for this day.</p>}
          </div>
          {selectedBooking && <BookingEditor client={selectedBooking} onSave={async (changes) => {
            const updated = await clientsApi.update(selectedBooking.id, changes);
            setSelectedBooking(updated); setClients(await reload());
          }} />}
          <div className="space-y-2">
            <h3 className="font-semibold">Available time slots</h3>
            {activeSite === 'All Sites' ? <p className="text-sm text-neutral-500">Select a site in the calendar to see its available times.</p> : <>
              <p className="text-xs text-neutral-500">Site-local times. Choose an available slot to create a booking, or use “Book time” above for an existing customer.</p>
              {slotsError && <p role="alert" className="text-sm text-red-700">{slotsError}</p>}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {daySlots.map((slot) => <Button key={slot.time} variant="outline" disabled={!slot.available} aria-label={`${slot.time} ${slot.available ? 'available' : 'booked'}`}
                  onClick={() => navigate(`/clients?new=1&date=${selectedDay}&time=${slot.time}&booking_type=confirmed`)}>{slot.time}{!slot.available && ' · Booked'}</Button>)}
              </div>
            </>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

