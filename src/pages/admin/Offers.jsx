import React, { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, ExternalLink, Archive, ArchiveRestore, Edit2, Check, X, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { offersApi } from "../../lib/api";
import { toast } from "sonner";
import { formatDate } from "../../lib/utils";

const BYD_MODELS = ["ATTO 1","ATTO 2","ATTO 3","DOLPHIN","SEAL","SEALION 6","SEALION 7","SEALION 8","SHARK 6"];
const SALE_TYPE_OPTIONS = ["Retail","Novated","Novated lease","Fleet","Government","Rental","Demo","Cash","Lease","Other"];
const CLAIM_DOC_OPTIONS = ["EFT form","Bank statement","ATR signed","Handover checklist"];

const emptyOffer = {
  name:"",eligible_models:[],order_from:"",order_to:"",deliver_by:"",honour_if_delayed:false,
  sale_type_exclusions:[],combinable:true,claim_doc_templates:[],cash_or_product:"cash",
  public_url:"",internal_notes:"",active:true,
};

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyOffer);
  const [refreshing, setRefreshing] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const [expanded, setExpanded] = useState({});

  const reload = useCallback(async () => {
    try { const data = await offersApi.list(); setOffers(data); }
    catch (e) { toast.error("Could not load offers"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const toggleExpand = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const startCreate = () => { setForm(emptyOffer); setEditing(null); setCreating(true); };

  const startEdit = (offer) => {
    setForm({
      name: offer.name||"", eligible_models: offer.eligible_models||[],
      order_from: offer.order_from||"", order_to: offer.order_to||"",
      deliver_by: offer.deliver_by||"", honour_if_delayed: offer.honour_if_delayed||false,
      sale_type_exclusions: offer.sale_type_exclusions||[], combinable: offer.combinable!==false,
      claim_doc_templates: offer.claim_doc_templates||[], cash_or_product: offer.cash_or_product||"cash",
      public_url: offer.public_url||"", internal_notes: offer.internal_notes||"", active: offer.active!==false,
    });
    setEditing(offer.id); setCreating(false);
  };

  const cancelForm = () => { setCreating(false); setEditing(null); };

  const saveOffer = async () => {
    if (!form.name.trim()) { toast.error("Offer name is required"); return; }
    try {
      if (editing) { await offersApi.update(editing, form); toast.success("Offer updated and open deals re-scored"); }
      else { await offersApi.create(form); toast.success("Offer created and open deals re-scored"); }
      cancelForm(); reload();
    } catch (e) { toast.error(e?.response?.data?.detail || "Save failed"); }
  };

  const toggleActive = async (offer) => {
    try {
      if (offer.active) { await offersApi.expire(offer.id); toast.success(offer.name + " expired"); }
      else { await offersApi.activate(offer.id); toast.success(offer.name + " reactivated"); }
      reload();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const refreshOffers = async () => {
    setRefreshing(true);
    try { const r = await offersApi.refresh(); toast.success("Catalogue refreshed \u00b7 " + r.active_offers + " offers \u00b7 open deals re-scored"); reload(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Refresh failed"); }
    finally { setRefreshing(false); }
  };

  const takeSnapshot = async () => {
    setSnapping(true);
    try { const r = await offersApi.websiteSnapshot(); toast.success(r.changed ? "Website offer page has changed since last snapshot" : "No change detected on offer page"); }
    catch (e) { toast.error(e?.response?.data?.detail || "Snapshot failed"); }
    finally { setSnapping(false); }
  };

  const toggleList = (key, val) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(val) ? f[key].filter((v) => v !== val) : [...f[key], val] }));

  const chips = (items, key, colors) => items.map((item) => (
    <button key={item} type="button" onClick={() => toggleList(key, item)}
      className={"px-3 py-1 rounded-full text-xs font-medium border transition-colors " +
        (form[key].includes(item) ? colors.on : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500")}>
      {item}
    </button>
  ));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offer Catalogue</h1>
          <p className="text-neutral-500 mt-1">Manage BYD Fairfield offers, eligibility rules, and claim document requirements.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={takeSnapshot} disabled={snapping} className="gap-2">
            <Globe className={"h-4 w-4 " + (snapping ? "animate-spin" : "")} />Website snapshot
          </Button>
          <Button variant="outline" onClick={refreshOffers} disabled={refreshing} className="gap-2">
            <RefreshCw className={"h-4 w-4 " + (refreshing ? "animate-spin" : "")} />Refresh &amp; re-score
          </Button>
          <Button onClick={startCreate} className="bg-[#E11B22] hover:bg-[#B81319] text-white gap-2">
            <Plus className="h-4 w-4" />Add offer
          </Button>
        </div>
      </div>

      {(creating || editing) && (
        <Card className="border-[#E11B22]/30 bg-red-50/20">
          <CardHeader className="pb-3"><CardTitle className="text-base">{editing ? "Edit offer" : "New offer"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F label="Offer name *"><Input value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} placeholder="e.g. $2,000 cashback — SEALION 8" /></F>
              <F label="Cash or product">
                <Select value={form.cash_or_product} onValueChange={(v) => setForm({...form,cash_or_product:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash / Cashback</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="both">Both (Your Way)</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="Order window from"><Input type="date" value={form.order_from} onChange={(e) => setForm({...form,order_from:e.target.value})} /></F>
              <F label="Order window to"><Input type="date" value={form.order_to} onChange={(e) => setForm({...form,order_to:e.target.value})} /></F>
              <F label="Deliver by"><Input type="date" value={form.deliver_by} onChange={(e) => setForm({...form,deliver_by:e.target.value})} /></F>
              <F label="Public URL"><Input value={form.public_url} onChange={(e) => setForm({...form,public_url:e.target.value})} placeholder="https://bydfairfield.com.au/offers#..." /></F>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.honour_if_delayed} onCheckedChange={(v) => setForm({...form,honour_if_delayed:v})} />
                <span className="text-sm">Honour if delivery delayed</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.combinable} onCheckedChange={(v) => setForm({...form,combinable:v})} />
                <span className="text-sm">Combinable with other offers</span>
              </label>
            </div>
            <F label="Eligible models (leave empty = all BYD models)">
              <div className="flex flex-wrap gap-2 mt-1">{chips(BYD_MODELS,"eligible_models",{on:"bg-[#E11B22] text-white border-[#E11B22]"})}</div>
            </F>
            <F label="Sale type exclusions">
              <div className="flex flex-wrap gap-2 mt-1">{chips(SALE_TYPE_OPTIONS,"sale_type_exclusions",{on:"bg-amber-500 text-white border-amber-500"})}</div>
            </F>
            <F label="Claim documents required">
              <div className="flex flex-wrap gap-2 mt-1">{chips(CLAIM_DOC_OPTIONS,"claim_doc_templates",{on:"bg-blue-500 text-white border-blue-500"})}</div>
            </F>
            <F label="Internal notes">
              <Textarea rows={2} value={form.internal_notes} onChange={(e) => setForm({...form,internal_notes:e.target.value})} placeholder="Staff-only notes about eligibility, claim process, exceptions, etc." />
            </F>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveOffer} className="bg-[#E11B22] hover:bg-[#B81319] text-white gap-2"><Check className="h-4 w-4"/>{editing ? "Save changes" : "Create offer"}</Button>
              <Button variant="outline" onClick={cancelForm} className="gap-2"><X className="h-4 w-4"/>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-sm text-neutral-500 py-8 text-center">Loading offers&hellip;</div>
      ) : offers.length === 0 ? (
        <Card className="border-dashed border-neutral-300">
          <CardContent className="py-12 text-center">
            <p className="text-neutral-500">No active offers in the catalogue.</p>
            <Button onClick={startCreate} className="mt-4 bg-[#E11B22] hover:bg-[#B81319] text-white">Add first offer</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => {
            const isExpanded = expanded[offer.id];
            return (
              <Card key={offer.id} className={"border-neutral-200 " + (!offer.active ? "opacity-60" : "")}>
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{offer.name}</p>
                        {!offer.active && <Badge className="bg-neutral-100 text-neutral-500 border-0 text-[10px]">Expired</Badge>}
                        {offer.cash_or_product === "both" && <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px]">Your Way</Badge>}
                        {offer.cash_or_product === "cash" && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Cashback</Badge>}
                        {!offer.combinable && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">Not combinable</Badge>}
                        {offer.honour_if_delayed && <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">Honour if delayed</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-neutral-500">
                        {offer.order_from && <span>Order: {formatDate(offer.order_from)} &ndash; {formatDate(offer.order_to)}</span>}
                        {offer.deliver_by && <span>Deliver by: {formatDate(offer.deliver_by)}</span>}
                        {offer.eligible_models?.length > 0 && <span>Models: {offer.eligible_models.join(", ")}</span>}
                        {offer.sale_type_exclusions?.length > 0 && <span className="text-amber-600">Excl: {offer.sale_type_exclusions.join(", ")}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {offer.public_url && (
                        <a href={offer.public_url} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon" title="Open offer page"><ExternalLink className="h-4 w-4" /></Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" title={offer.active ? "Expire offer" : "Reactivate offer"} onClick={() => toggleActive(offer)}>
                        {offer.active ? <Archive className="h-4 w-4 text-amber-600" /> : <ArchiveRestore className="h-4 w-4 text-emerald-600" />}
                      </Button>
                      <Button variant="ghost" size="icon" title="Edit offer" onClick={() => startEdit(offer)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Toggle details" onClick={() => toggleExpand(offer.id)}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-neutral-100 px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <D label="Claim docs required" value={(offer.claim_doc_templates||[]).join(", ") || "None specified"} />
                      <D label="Honour if delayed" value={offer.honour_if_delayed ? "Yes" : "No"} />
                      <D label="Combinable" value={offer.combinable !== false ? "Yes" : "No"} />
                      <D label="Cash / product election" value={offer.cash_or_product} />
                      <D label="Last refreshed" value={offer.last_refreshed_at ? formatDate(offer.last_refreshed_at) : "Never"} />
                      <D label="Created" value={formatDate(offer.created_at)} />
                      {offer.internal_notes && (
                        <div className="md:col-span-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">Internal notes</p>
                          <p className="text-neutral-700 whitespace-pre-line">{offer.internal_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function F({ label, children }) {
  return (
    <div>
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function D({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-0.5">{label}</p>
      <p className="text-neutral-700 capitalize">{value || "\u2014"}</p>
    </div>
  );
}
