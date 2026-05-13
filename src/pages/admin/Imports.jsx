import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const STAGE_COLOURS = {
  Scheduled: 'bg-neutral-100 text-neutral-700',
  'In Transit': 'bg-amber-100 text-amber-800',
  'Pre-Delivery Inspection': 'bg-sky-100 text-sky-800',
  'Ready for Pickup': 'bg-violet-100 text-violet-800',
  Delivered: 'bg-emerald-100 text-emerald-800',
};

export default function AdminImports() {
  const { isSuper } = useAuth();
  const [file, setFile] = useState(null);
  const [replace, setReplace] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState(null); // { mode: 'preview'|'commit', summary, filename }
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  if (!isSuper) {
    return (
      <Alert variant="destructive" className="max-w-xl" data-testid="imports-forbidden">
        <ShieldOffIcon />
        <AlertTitle>Restricted</AlertTitle>
        <AlertDescription>Only super admins may run data imports.</AlertDescription>
      </Alert>
    );
  }

  const onPick = (f) => {
    if (!f) return;
    const name = (f.name || '').toLowerCase();
    if (!name.endsWith('.xlsx')) {
      toast.error('Please select a .xlsx file');
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
  };

  const reset = () => {
    setFile(null); setResult(null); setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const run = async (dryRun) => {
    if (!file) return;
    setBusy(true); setError(null);
    if (dryRun) setResult(null);
    try {
      const res = await adminApi.importHarmony(file, { replace, dryRun });
      setResult({ mode: dryRun ? 'preview' : 'commit', ...res });
      toast.success(dryRun ? 'Preview ready' : `Imported ${res.summary.inserted} records`);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || 'Import failed';
      setError(msg); toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    onPick(f);
  };

  return (
    <div className="space-y-6 max-w-4xl" data-testid="imports-page">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data imports</h1>
        <p className="text-neutral-500 mt-1">Upload Harmony Auto exports to refresh the client database.</p>
      </div>

      <Card className="border-neutral-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-4 w-4 text-[#E11B22]" />
            Harmony Auto · Excel import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            data-testid="imports-dropzone"
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-[#E11B22] bg-[#FFF5F5]' : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              data-testid="imports-file-input"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
            <UploadCloud className="h-10 w-10 mx-auto text-neutral-400 mb-2" />
            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-neutral-800" data-testid="imports-file-name">{file.name}</p>
                <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(1)} KB · click to choose another file</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-neutral-700">Drop the Harmony Auto export here</p>
                <p className="text-xs text-neutral-500">or click to browse · .xlsx only · max 25 MB</p>
              </div>
            )}
          </div>

          <div className="flex items-start justify-between gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex-1">
              <Label className="text-sm font-semibold">Replace mode</Label>
              <p className="text-xs text-neutral-500 mt-0.5">
                When on, all previously imported Harmony rows are wiped and replaced. Manually-created clients are kept.
              </p>
            </div>
            <Switch checked={replace} onCheckedChange={setReplace} data-testid="imports-replace-switch" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              disabled={!file || busy}
              onClick={() => run(true)}
              data-testid="imports-preview-btn"
            >
              {busy && result?.mode !== 'commit' ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Preview (dry run)
            </Button>
            <Button
              disabled={!file || busy}
              onClick={() => run(false)}
              className="bg-[#E11B22] hover:bg-[#B81319] text-white"
              data-testid="imports-commit-btn"
            >
              {busy && (result === null || result?.mode === 'commit') ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-1.5" />}
              Run import
            </Button>
            {file && (
              <Button variant="ghost" onClick={reset} disabled={busy} data-testid="imports-reset-btn">
                <RotateCcw className="h-4 w-4 mr-1.5" /> Clear
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive" data-testid="imports-error">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Import failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && <ResultPanel result={result} />}
        </CardContent>
      </Card>

      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-700" />
        <AlertTitle className="text-amber-900">Heads up</AlertTitle>
        <AlertDescription className="text-amber-900/90 text-sm">
          With <span className="font-semibold">replace mode on</span>, every Harmony row is overwritten. Manual edits to imported records (notes, accessories, comments) will be lost. Use <span className="font-semibold">Preview</span> first to verify counts before committing.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function ResultPanel({ result }) {
  const s = result.summary || {};
  const isPreview = result.mode === 'preview';
  return (
    <div className="border border-neutral-200 rounded-xl p-5 space-y-4 bg-white" data-testid={isPreview ? 'imports-preview-result' : 'imports-commit-result'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPreview ? (
            <Badge className="bg-sky-100 text-sky-800 border-0">Preview</Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-800 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Committed</Badge>
          )}
          <p className="text-sm font-semibold text-neutral-800">{result.filename}</p>
        </div>
        <p className="text-xs text-neutral-500">{((result.size_bytes || 0) / 1024).toFixed(1)} KB</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label={isPreview ? 'Would insert' : 'Inserted'} value={s.inserted ?? 0} accent />
        <Stat label={isPreview ? 'Would wipe' : 'Wiped'} value={s.wiped ?? 0} />
        <Stat label="Skipped (cancelled)" value={s.skipped_cancelled ?? 0} muted />
        <Stat label="Auto-assigned" value={s.auto_assigned ?? 0} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">By stage</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(s.by_stage || {}).map(([stage, count]) => (
            <span
              key={stage}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${STAGE_COLOURS[stage] || 'bg-neutral-100 text-neutral-700'}`}
              data-testid={`imports-stage-${stage.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {stage} <span className="font-bold ml-1">{count}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-neutral-600">
        <span>Arrived at dealership: <span className="font-semibold text-neutral-900">{s.arrived ?? 0}</span></span>
        <span>Unassigned: <span className="font-semibold text-neutral-900">{s.unassigned ?? 0}</span></span>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, muted }) {
  return (
    <div className={`rounded-lg p-3 border ${accent ? 'border-[#E11B22]/30 bg-[#FFF5F5]' : muted ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-200 bg-white'}`}>
      <p className="text-2xl font-bold text-neutral-900 leading-none">{value}</p>
      <p className="text-[11px] text-neutral-500 mt-1.5 uppercase tracking-wide font-semibold">{label}</p>
    </div>
  );
}

function ShieldOffIcon() {
  return <XCircle className="h-4 w-4" />;
}
