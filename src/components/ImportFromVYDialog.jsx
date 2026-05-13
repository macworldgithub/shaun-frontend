import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { ScrollArea } from '../components/ui/scroll-area';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, Trash2, FileText } from 'lucide-react';
import { parseVirtualYard, FIELD_LABELS } from '../lib/vyParser';
import { deliveryStages } from '../constants';
import { clientsApi } from '../lib/api';
import { toast } from 'sonner';

const SAMPLE = `143251  69b1f577f00ba
BYD SEALION 7 Premium
Retail    Jacqueline Michelle Hill
Email     jacqui.hill@servier.com    Mobile 0402421154
Address   Malvern, VIC               Date 31/03/2026
STRIPE    cus_U8CHWtB0ttt24k         Qty 1
ASSIGNED TO  Ray Sun                 DELIVERED 1 of 1
$0.00     Floor Mats Moulded (Deep Dish)
          Ceramic Window Tint (2x Front)
Lease     Add                        Delivered`;

const REQUIRED = ['vehicle', 'name', 'phone', 'deliveryDate'];

// Confidence thresholds — keep in sync with vyParser scoring.
const CONFIDENCE_HIGH = 90;
const CONFIDENCE_MED = 70;

const DEAL_TYPES = ['Retail', 'Lease', 'Fleet', 'Cash', 'Demo'];

function getConfidenceTone(value) {
  if (value >= CONFIDENCE_HIGH) return { className: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 };
  if (value >= CONFIDENCE_MED) return { className: 'bg-amber-100 text-amber-700', Icon: AlertTriangle };
  return { className: 'bg-red-100 text-red-700', Icon: XCircle };
}

function ConfidencePill({ value }) {
  const { className, Icon } = getConfidenceTone(value);
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 ${className}`}>
      <Icon className="h-3 w-3" /> {value}%
    </span>
  );
}

// Generate a stable client id and a stable row id at parse time
let rowSeq = 0;
function withRowId(parsed) {
  rowSeq += 1;
  return { ...parsed, rowId: `vyrow_${Date.now()}_${rowSeq}` };
}

function buildClientFromImport(item) {
  return {
    name: item.name,
    phone: item.phone,
    email: item.email || null,
    vehicle: item.vehicle,
    rego: null,
    vin: null,
    delivery_date: item.deliveryDate || null,
    stage: item.stage || 'Scheduled',
    salesperson: item.salesperson || null,
    notes: null,
    address: item.address || null,
    location: item.address ? item.address.split(',').slice(0, 2).join(', ') : null,
    deal_type: item.dealType || null,
    vy_order_id: item.vyOrderId || null,
    vy_stock_id: item.vyStockId || null,
    stripe_customer_id: item.stripeCustomerId || null,
    addons: item.addons || [],
    aftermarket_notes: null,
    imported_from: 'paste',
  };
}

export default function ImportFromVYDialog({ open, onOpenChange, onImported }) {
  const [raw, setRaw] = useState('');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState({});
  const [activeRowId, setActiveRowId] = useState(null);

  const [dupeIds, setDupeIds] = useState(new Set());

  useEffect(() => {
    if (open) {
      clientsApi.list({}).then((cs) => {
        setDupeIds(new Set(cs.map((c) => c.vy_order_id).filter(Boolean)));
      }).catch(() => {});
    }
  }, [open]);

  const handleParse = (text) => {
    setRaw(text);
    const parsed = parseVirtualYard(text).map(withRowId);
    setItems(parsed);
    const next = {};
    parsed.forEach((p) => { next[p.rowId] = true; });
    setSelected(next);
    setActiveRowId(parsed.length > 0 ? parsed[0].rowId : null);
  };

  const updateField = (rowId, field, value) => {
    setItems((prev) => prev.map((it) => (it.rowId === rowId ? { ...it, [field]: value } : it)));
  };

  const removeRow = (rowId) => {
    setItems((prev) => prev.filter((it) => it.rowId !== rowId));
    setSelected((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
    if (activeRowId === rowId) setActiveRowId(null);
  };

  const handleClose = () => {
    setRaw('');
    setItems([]);
    setSelected({});
    setActiveRowId(null);
    onOpenChange(false);
  };

  const handleImport = async () => {
    const toImport = items.filter((it) => selected[it.rowId]);
    if (toImport.length === 0) {
      toast.error('Select at least one row to import');
      return;
    }
    const invalid = toImport.find((it) => REQUIRED.some((f) => !it[f]));
    if (invalid) {
      toast.error('Some rows are missing required fields. Fix them or deselect.');
      return;
    }

    const payload = toImport
      .filter((it) => !(it.vyOrderId && dupeIds.has(it.vyOrderId)))
      .map(buildClientFromImport);
    const skipped = toImport.length - payload.length;

    try {
      const created = await clientsApi.bulkImport(payload);
      if (created.length > 0) toast.success(`${created.length} client${created.length > 1 ? 's' : ''} imported`);
      if (skipped > 0) toast.message(`${skipped} duplicate${skipped > 1 ? 's' : ''} skipped`);
      handleClose();
      if (onImported) onImported();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Import failed');
    }
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const active = items.find((it) => it.rowId === activeRowId) || null;
  const activeIndex = active ? items.findIndex((it) => it.rowId === active.rowId) : -1;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-neutral-200">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#E11B22]" />
            Import from Virtual Yard
          </DialogTitle>
          <p className="text-sm text-neutral-500 mt-1">Paste one or more order rows. We'll auto-extract every field — review, edit, then import.</p>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 overflow-hidden">
          <PasteColumn
            raw={raw}
            items={items}
            selected={selected}
            setSelected={setSelected}
            activeRowId={activeRowId}
            setActiveRowId={setActiveRowId}
            dupeIds={dupeIds}
            onPaste={handleParse}
            onLoadSample={() => handleParse(SAMPLE)}
            onRemove={removeRow}
          />

          <ReviewColumn
            active={active}
            activeIndex={activeIndex}
            total={items.length}
            onUpdate={updateField}
          />
        </div>

        <DialogFooter className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={selectedCount === 0}
            className="bg-[#E11B22] hover:bg-[#B81319] text-white disabled:opacity-50"
          >
            Import {selectedCount > 0 ? selectedCount : ''} client{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasteColumn({ raw, items, selected, setSelected, activeRowId, setActiveRowId, dupeIds, onPaste, onLoadSample, onRemove }) {
  const selectedCount = Object.values(selected).filter(Boolean).length;
  return (
    <div className="border-r border-neutral-200 flex flex-col min-h-0">
      <div className="p-5 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-neutral-700">Paste Virtual Yard rows</Label>
          <button
            type="button"
            onClick={onLoadSample}
            className="text-xs text-[#E11B22] hover:underline font-medium"
          >
            Try with sample
          </button>
        </div>
        <Textarea
          rows={8}
          value={raw}
          onChange={(e) => onPaste(e.target.value)}
          placeholder="Copy a row from Virtual Yard and paste here…"
          className="font-mono text-xs leading-relaxed"
        />
        <p className="text-[11px] text-neutral-500">
          {items.length} row{items.length !== 1 ? 's' : ''} detected · {selectedCount} selected for import
        </p>
      </div>

      {items.length > 0 && (
        <ScrollArea className="flex-1 border-t border-neutral-200">
          <div className="divide-y divide-neutral-100">
            {items.map((it) => (
              <RowListItem
                key={it.rowId}
                item={it}
                isActive={it.rowId === activeRowId}
                isSelected={!!selected[it.rowId]}
                isDuplicate={!!(it.vyOrderId && dupeIds.has(it.vyOrderId))}
                onActivate={() => setActiveRowId(it.rowId)}
                onToggle={(v) => setSelected({ ...selected, [it.rowId]: v })}
                onRemove={() => onRemove(it.rowId)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function RowListItem({ item, isActive, isSelected, isDuplicate, onActivate, onToggle, onRemove }) {
  return (
    <div
      onClick={onActivate}
      className={`px-5 py-3 cursor-pointer flex items-start gap-3 ${isActive ? 'bg-[#FFF5F5]' : 'hover:bg-neutral-50'}`}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={(v) => onToggle(!!v)}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate">{item.name || '— No customer name —'}</p>
          <ConfidencePill value={item.confidence} />
          {isDuplicate && (
            <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">Duplicate</Badge>
          )}
        </div>
        <p className="text-xs text-neutral-500 truncate mt-0.5">
          {item.vehicle || '—'} · {item.phone || 'no phone'}
        </p>
        {item.missing && item.missing.length > 0 && (
          <p className="text-[11px] text-red-600 mt-0.5">
            Missing: {item.missing.map((m) => FIELD_LABELS[m]).join(', ')}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="p-1 text-neutral-400 hover:text-red-500"
        aria-label="Remove row"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ReviewColumn({ active, activeIndex, total, onUpdate }) {
  if (!active) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div className="space-y-2 max-w-xs">
          <FileText className="h-10 w-10 text-neutral-300 mx-auto" />
          <p className="text-sm text-neutral-500">Paste a Virtual Yard row on the left to see parsed fields here.</p>
        </div>
      </div>
    );
  }

  const upd = (field) => (v) => onUpdate(active.rowId, field, v);
  const removeAddon = (idx) => onUpdate(
    active.rowId,
    'addons',
    active.addons.filter((_, x) => x !== idx),
  );

  return (
    <ScrollArea className="flex-1">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Review row {activeIndex + 1} of {total}</h3>
          <ConfidencePill value={active.confidence} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Order ID" value={active.vyOrderId} onChange={upd('vyOrderId')} />
          <FieldInput label="Stock ID" value={active.vyStockId} onChange={upd('vyStockId')} />
        </div>
        <FieldInput label="Vehicle" required value={active.vehicle} onChange={upd('vehicle')} />

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Deal type"
            value={active.dealType || ''}
            onChange={upd('dealType')}
            options={DEAL_TYPES}
            placeholder="—"
          />
          <SelectField
            label="Stage"
            value={active.stage}
            onChange={upd('stage')}
            options={deliveryStages}
          />
        </div>

        <FieldInput label="Customer name" required value={active.name} onChange={upd('name')} />
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Mobile" required value={active.phone} onChange={upd('phone')} placeholder="+61…" />
          <FieldInput label="Email" value={active.email} onChange={upd('email')} />
        </div>
        <FieldInput label="Address" value={active.address} onChange={upd('address')} />
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Delivery date" required type="date" value={active.deliveryDate} onChange={upd('deliveryDate')} />
          <FieldInput label="Salesperson" value={active.salesperson} onChange={upd('salesperson')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Stripe customer ID" value={active.stripeCustomerId} onChange={upd('stripeCustomerId')} />
          <FieldInput label="Qty" type="number" value={active.qty} onChange={(v) => onUpdate(active.rowId, 'qty', parseInt(v || 0, 10))} />
        </div>

        <AddonsList addons={active.addons} onRemove={removeAddon} rowId={active.rowId} />
      </div>
    </ScrollArea>
  );
}

function AddonsList({ addons, onRemove, rowId }) {
  return (
    <div>
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1 block">Add-ons</Label>
      {addons.length === 0 ? (
        <p className="text-xs text-neutral-400 italic py-2">None detected</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {addons.map((a, i) => (
            <Badge key={`${rowId}_addon_${a}_${i}`} variant="outline" className="text-xs font-normal py-1 px-2 bg-neutral-50">
              {a}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="ml-1.5 text-neutral-400 hover:text-red-500"
              >×</button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldInput({ label, value, onChange, required, type = 'text', placeholder }) {
  const missing = required && !value;
  return (
    <div>
      <Label className={`text-[11px] font-semibold uppercase tracking-wide mb-1 block ${missing ? 'text-red-600' : 'text-neutral-500'}`}>
        {label}{required && <span className="ml-1">*</span>}
      </Label>
      <Input
        type={type}
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 ${missing ? 'border-red-300 focus-visible:ring-red-300' : ''}`}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1 block">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
