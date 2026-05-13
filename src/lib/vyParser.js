// Virtual Yard parser — turns raw pasted/forwarded order text into structured clients.
// Pure JS, no dependencies, deterministic.

const REQUIRED_FIELDS = ['vehicle', 'name', 'phone', 'deliveryDate'];
const OPTIONAL_FIELDS = ['email', 'address', 'stripeCustomerId', 'salesperson', 'addons'];

// Confidence weights — required vs optional fields contribution to the 0-100 score.
const REQUIRED_WEIGHT_PCT = 70;
const OPTIONAL_WEIGHT_PCT = 30;

const STAGE_MAP = {
  delivered: 'Delivered',
  ready: 'Ready for Pickup',
  transit: 'In Transit',
  pdi: 'Pre-Delivery Inspection',
  scheduled: 'Scheduled',
};

const MONTHS_SHORT = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

const UI_NOISE_WORDS = new Set([
  'lease', 'retail', 'fleet', 'cash', 'demo',
  'add', 'edit', 'delete',
  'delivered', 'scheduled', 'ready', 'transit', 'pdi',
]);

// ─── Helpers ────────────────────────────────────────────────────────────────

export function normalisePhone(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/[^\d+]/g, '');
  if (digits.startsWith('+61')) return digits;
  if (digits.startsWith('61') && digits.length === 11) return '+' + digits;
  if (digits.startsWith('04') && digits.length === 10) return '+61' + digits.slice(1);
  if (digits.startsWith('4') && digits.length === 9) return '+61' + digits;
  return digits;
}

export function parseDate(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  let m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return s;
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (m) {
    const mo = MONTHS_SHORT[m[2].slice(0, 3).toLowerCase()];
    if (mo) return `${m[3]}-${mo}-${m[1].padStart(2, '0')}`;
  }
  return '';
}

function stripHtml(s) {
  if (!s) return '';
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

export function splitRows(raw) {
  const text = stripHtml(raw);
  const headerRegex = /(?=^\s*\d{4,}\s+[0-9a-f]{8,}\b)/gm;
  const parts = text.split(headerRegex).map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts : [text.trim()];
}

function between(text, startLabel, endLabels = []) {
  const start = new RegExp(startLabel + '\\s*:?', 'i').exec(text);
  if (!start) return '';
  const after = text.slice(start.index + start[0].length);
  let end = after.length;
  for (const lbl of endLabels) {
    const m = new RegExp('\\b' + lbl + '\\b', 'i').exec(after);
    if (m && m.index < end) end = m.index;
  }
  return after.slice(0, end).replace(/[\t ]+/g, ' ').trim().replace(/^[:\-\s]+/, '');
}

function inferStage(text) {
  const lower = text.toLowerCase();
  if (/\bdelivered\b/.test(lower)) return STAGE_MAP.delivered;
  if (/\bready\b/.test(lower)) return STAGE_MAP.ready;
  if (/\btransit\b/.test(lower)) return STAGE_MAP.transit;
  if (/\bpdi|pre[\s-]?delivery/.test(lower)) return STAGE_MAP.pdi;
  return STAGE_MAP.scheduled;
}

function isUiOnlyLine(line) {
  const cleaned = line.replace(/\s+/g, ' ').trim();
  const tokens = cleaned.split(/\s+/);
  if (tokens.length === 0 || tokens.length > 4) return false;
  return tokens.every((t) => UI_NOISE_WORDS.has(t.toLowerCase()));
}

function extractAddons(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const addons = [];
  let inBlock = false;
  for (const line of lines) {
    if (/^\$\s*\d/.test(line)) {
      inBlock = true;
      const cleaned = line.replace(/^\$\s*[\d.,]+/, '').trim();
      if (cleaned && !isUiOnlyLine(cleaned)) addons.push(cleaned);
      continue;
    }
    if (inBlock) {
      if (isUiOnlyLine(line)) break;
      if (/[A-Za-z].*[A-Za-z]/.test(line) && !/@/.test(line) && !/^\d/.test(line)) {
        addons.push(line);
      } else {
        break;
      }
    }
  }
  return addons.map((a) => a.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

// ─── Field extractors (each does ONE thing) ─────────────────────────────────

function extractIds(text) {
  const m = /(\d{4,})\s+([0-9a-f]{8,})/i.exec(text);
  return { vyOrderId: m ? m[1] : '', vyStockId: m ? m[2] : '', _idMatch: m };
}

function extractVehicle(text, idMatch) {
  if (!idMatch) return '';
  const after = text.slice(idMatch.index + idMatch[0].length).split(/\r?\n/);
  for (const ln of after) {
    const t = ln.trim();
    if (t) return t;
  }
  return '';
}

function extractDealType(text) {
  const m = /\b(Retail|Lease|Fleet|Cash|Demo)\b/i.exec(text);
  if (!m) return { dealType: '', _dealMatch: null };
  const word = m[1];
  return {
    dealType: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    _dealMatch: m,
  };
}

function extractEmail(text) {
  const m = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.exec(text);
  return { email: m ? m[0] : '', _emailMatch: m };
}

function extractPhone(text) {
  const m = /(?:\+?61\s?4\d{2}|\b04\d{2})[\s-]?\d{3}[\s-]?\d{3}/.exec(text);
  return m ? normalisePhone(m[0]) : '';
}

function extractName(text, dealMatch, emailMatch) {
  if (dealMatch) {
    const after = text.slice(dealMatch.index + dealMatch[0].length);
    const stopIdx = /(\bEmail\b|\bMobile\b|\bAddress\b|\n)/i.exec(after);
    const name = (stopIdx ? after.slice(0, stopIdx.index) : after.slice(0, 60))
      .replace(/[\t ]+/g, ' ').trim();
    if (name) return name;
  }
  // Fallback: capitalised words preceding the email
  if (emailMatch) {
    const before = text.slice(0, emailMatch.index).trim();
    const words = before.split(/\s+/).slice(-4);
    return words.filter((w) => /^[A-Z][a-zA-Z'\-]+$/.test(w)).join(' ');
  }
  return '';
}

function extractAddress(text) {
  return between(text, 'Address', ['Date', 'STRIPE', 'Stripe', 'Qty', 'ASSIGNED']);
}

function extractDeliveryDate(text) {
  const labelled = between(text, 'Date', ['STRIPE', 'Stripe', 'Qty', 'ASSIGNED']);
  if (labelled) return parseDate(labelled);
  const fallback = (/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})/.exec(text) || [])[1];
  return parseDate(fallback);
}

function extractStripeId(text) {
  const m = /cus_[A-Za-z0-9]+/.exec(text);
  return m ? m[0] : '';
}

function extractQty(text) {
  const m = /Qty\s*[:\-]?\s*(\d+)/i.exec(text);
  return m ? parseInt(m[1], 10) : 1;
}

function extractSalesperson(text) {
  return between(text, 'ASSIGNED\\s+TO', ['DELIVERED', 'Delivered', '\\$']);
}

function extractProgress(text) {
  const m = /DELIVERED\s+(\d+\s*of\s*\d+)/i.exec(text);
  return m ? m[1] : '';
}

// ─── Confidence scoring ─────────────────────────────────────────────────────

function valuePresent(v) {
  if (v === null || v === undefined || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function scoreConfidence(parsed) {
  const reqOk = REQUIRED_FIELDS.filter((f) => valuePresent(parsed[f])).length;
  const optOk = OPTIONAL_FIELDS.filter((f) => valuePresent(parsed[f])).length;
  const reqPct = reqOk / REQUIRED_FIELDS.length;
  const optPct = optOk / OPTIONAL_FIELDS.length;
  return Math.round(reqPct * REQUIRED_WEIGHT_PCT + optPct * OPTIONAL_WEIGHT_PCT);
}

function findMissing(parsed) {
  return REQUIRED_FIELDS.filter((f) => !valuePresent(parsed[f]));
}

// ─── Orchestrator ───────────────────────────────────────────────────────────

export function parseVirtualYardSingle(raw) {
  const text = stripHtml(raw).replace(/\r/g, '');
  const oneLine = text.replace(/\s+/g, ' ').trim();

  const { vyOrderId, vyStockId, _idMatch } = extractIds(text);
  const vehicle = extractVehicle(text, _idMatch);
  const { dealType, _dealMatch } = extractDealType(text);
  const { email, _emailMatch } = extractEmail(text);
  const phone = extractPhone(text);
  const name = extractName(text, _dealMatch, _emailMatch);
  const address = extractAddress(text);
  const deliveryDate = extractDeliveryDate(text);
  const stripeCustomerId = extractStripeId(text);
  const qty = extractQty(text);
  const salesperson = extractSalesperson(text);
  const progress = extractProgress(text);
  const addons = extractAddons(text);
  const stage = inferStage(oneLine);

  const parsed = {
    vyOrderId, vyStockId, vehicle, dealType,
    name, email, phone,
    address, deliveryDate,
    stripeCustomerId, qty,
    salesperson, progress,
    addons, stage,
  };

  return {
    ...parsed,
    confidence: scoreConfidence(parsed),
    missing: findMissing(parsed),
    raw,
  };
}

export function parseVirtualYard(raw) {
  return splitRows(raw)
    .map(parseVirtualYardSingle)
    .filter((p) => p.vehicle || p.name || p.vyOrderId);
}

export const FIELD_LABELS = {
  vyOrderId: 'Order ID',
  vyStockId: 'Stock ID',
  vehicle: 'Vehicle',
  dealType: 'Deal type',
  name: 'Customer name',
  email: 'Email',
  phone: 'Mobile',
  address: 'Address',
  deliveryDate: 'Delivery date',
  stripeCustomerId: 'Stripe ID',
  qty: 'Qty',
  salesperson: 'Salesperson',
  progress: 'Progress',
  addons: 'Add-ons',
  stage: 'Stage',
};
