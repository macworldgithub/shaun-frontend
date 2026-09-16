import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Save,
  FileCheck,
  Download,
  Camera,
  Upload,
  Trash2,
  RefreshCw,
  Sparkles,
  Users,
  Car,
  Armchair,
  Sliders,
  Smartphone,
  Gauge,
  PackageCheck,
  ShieldCheck,
  BatteryCharging,
  Smile,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { clientsApi } from '../lib/api';
import { inspectionSections, inspectionPhotoSlots } from '../constants';
import { toast } from 'sonner';

const iconMap = {
  Sparkles,
  Users,
  Car,
  Armchair,
  Sliders,
  Smartphone,
  Gauge,
  PackageCheck,
  ShieldCheck,
  BatteryCharging,
  Smile,
};

// Touch and mouse enabled signature pad component
function SignaturePad({ label, value, onChange, disabled }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = value;
    } else {
      ctx.clearRect(0, 0, rect.width, rect.height);
      setHasDrawn(false);
    }
  }, [value]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    if (disabled) return;
    e.preventDefault();
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing.current || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = (e) => {
    if (!isDrawing.current || disabled) return;
    e.preventDefault();
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clear = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    onChange('');
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-700">{label}</label>
        {!disabled && hasDrawn && (
          <button
            type="button"
            onClick={clear}
            className="text-[11px] font-medium text-red-600 hover:text-red-700 hover:underline"
          >
            Clear signature
          </button>
        )}
      </div>
      <div className={`relative border rounded-lg bg-neutral-50 overflow-hidden ${disabled ? 'opacity-90 bg-neutral-100' : 'border-neutral-300 hover:border-neutral-400'}`}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-28 touch-none cursor-crosshair bg-white"
        />
        {!hasDrawn && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-neutral-400 font-medium">
            Sign here using finger, stylus or mouse
          </div>
        )}
      </div>
    </div>
  );
}

export default function DeliveryInspection() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [client, setClient] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [openSections, setOpenSections] = useState({});

  // Load inspection data and client info
  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const [clientData, inspectionData] = await Promise.all([
        clientsApi.get(id),
        clientsApi.getInspection(id),
      ]);
      setClient(clientData);
      setInspection(inspectionData);

      // Open all sections by default
      const initialOpen = {};
      inspectionSections.forEach((s) => {
        initialOpen[s.id] = true;
      });
      setOpenSections(initialOpen);
    } catch (err) {
      toast.error('Failed to load delivery inspection');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Checklist item toggle
  const toggleItem = (key) => {
    if (!inspection) return;
    const current = Boolean(inspection.checklist?.[key]);
    setInspection((prev) => ({
      ...prev,
      checklist: {
        ...(prev.checklist || {}),
        [key]: !current,
      },
    }));
  };

  // Section bulk toggle
  const toggleSectionAll = (section, checkAll = true) => {
    if (!inspection) return;
    const updated = { ...(inspection.checklist || {}) };
    section.items.forEach((item) => {
      updated[item.key] = checkAll;
    });
    setInspection((prev) => ({
      ...prev,
      checklist: updated,
    }));
  };

  // Check all items across all 12 sections
  const checkAllItems = () => {
    if (!inspection) return;
    const updated = { ...(inspection.checklist || {}) };
    inspectionSections.forEach((s) => {
      s.items.forEach((item) => {
        updated[item.key] = true;
      });
    });
    setInspection((prev) => ({
      ...prev,
      checklist: updated,
    }));
    toast.success('All checklist items marked complete');
  };

  // Photo slot upload handler
  const handlePhotoUpload = (slotKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Limit to ~8MB
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image is too large (max 8MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target.result;
      setInspection((prev) => ({
        ...prev,
        photos: {
          ...(prev.photos || {}),
          [slotKey]: dataUri,
        },
      }));
      toast.success('Photo added');
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (slotKey) => {
    setInspection((prev) => ({
      ...prev,
      photos: {
        ...(prev.photos || {}),
        [slotKey]: null,
      },
    }));
  };

  // Calculate stats
  const totalItems = useMemo(() => {
    return inspectionSections.reduce((acc, s) => acc + s.items.length, 0);
  }, []);

  const checkedCount = useMemo(() => {
    if (!inspection?.checklist) return 0;
    let count = 0;
    inspectionSections.forEach((s) => {
      s.items.forEach((item) => {
        if (inspection.checklist[item.key]) count += 1;
      });
    });
    return count;
  }, [inspection]);

  const progressPercent = Math.round((checkedCount / (totalItems || 1)) * 100);

  const photosCount = useMemo(() => {
    if (!inspection?.photos) return 0;
    return Object.values(inspection.photos).filter(Boolean).length;
  }, [inspection]);

  // Save draft
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      await clientsApi.updateInspection(id, inspection);
      toast.success('Inspection draft saved');
    } catch (err) {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  // Complete and Sign
  const handleComplete = async () => {
    if (!inspection.customer_signature) {
      toast.error('Customer signature is required to complete delivery handover');
      return;
    }
    if (!inspection.salesperson_signature) {
      toast.error('Delivery consultant signature is required to complete delivery handover');
      return;
    }

    try {
      setCompleting(true);
      const updated = await clientsApi.completeInspection(id, inspection);
      setInspection(updated);
      toast.success('Delivery Inspection Completed & Signed! PDF generated and attached.');
      // Reload to ensure client document list & readiness statuses are updated
      await reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to complete inspection');
    } finally {
      setCompleting(false);
    }
  };

  const toggleSectionCollapse = (sectionId) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-[#E11B22]" />
        <p className="text-sm text-neutral-500 font-medium">Loading digital delivery inspection…</p>
      </div>
    );
  }

  if (!client || !inspection) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold">Client Not Found</h2>
        <Button onClick={() => navigate('/deliveries')}>Return to Deliveries</Button>
      </div>
    );
  }

  const isCompleted = inspection.status === 'completed';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Navigation & Status */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          to={`/clients/${id}`}
          className="inline-flex items-center text-xs font-semibold text-neutral-600 hover:text-neutral-900 gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Client Profile
        </Link>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <Badge className="bg-emerald-600 text-white font-bold text-xs py-1 px-3 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" /> Handover Complete &amp; Signed
            </Badge>
          )}
          {!isCompleted && (
            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 font-semibold text-xs py-1 px-3">
              Draft In Progress
            </Badge>
          )}
          {isCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clientsApi.downloadInspectionPdf(id, `Delivery_Inspection_${client.rego || client.name}.pdf`)}
              className="gap-1.5 text-xs font-semibold border-neutral-300"
            >
              <Download className="h-3.5 w-3.5" /> Download Signed PDF
            </Button>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <Card className="border-neutral-200 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#E11B22] bg-white/10 px-2.5 py-0.5 rounded">
                  BYD Official
                </span>
                <span className="text-xs text-neutral-400 font-medium">Pre-Delivery &amp; Handover Inspection</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{client.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-300">
                <span className="font-semibold text-white">{client.vehicle}</span>
                {client.vin && <span>VIN: <strong className="text-neutral-100">{client.vin}</strong></span>}
                {client.rego && <span>Rego: <strong className="text-neutral-100">{client.rego}</strong></span>}
                {client.location && <span>Site: <strong className="text-neutral-100">{client.location}</strong></span>}
                {client.salesperson && <span>Consultant: <strong className="text-neutral-100">{client.salesperson}</strong></span>}
              </div>
            </div>

            {/* Checklist progress badge & quick actions */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 min-w-[240px] space-y-2 border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium">Checklist Progress</span>
                <span className="font-extrabold text-white text-sm">{checkedCount} / {totalItems} ({progressPercent}%)</span>
              </div>
              <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-neutral-400">{photosCount}/7 Photos Uploaded</span>
                {!isCompleted && (
                  <button
                    type="button"
                    onClick={checkAllItems}
                    className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 underline"
                  >
                    Quick Check All
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky Action Toolbar */}
      <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md border border-neutral-200 rounded-xl p-3 shadow-md flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{checkedCount} of {totalItems} items completed</span>
          </div>
          <span className="text-neutral-300">|</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
            <Camera className="h-4 w-4 text-sky-600" />
            <span>{photosCount} photos</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={saving || completing}
            className="text-xs font-semibold"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? 'Saving…' : 'Save Draft'}
          </Button>

          <Button
            size="sm"
            onClick={handleComplete}
            disabled={completing || saving}
            className={`text-xs font-bold text-white shadow-sm ${
              isCompleted ? 'bg-neutral-800 hover:bg-neutral-900' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <FileCheck className="h-3.5 w-3.5 mr-1.5" />
            {completing ? 'Generating Signed PDF…' : isCompleted ? 'Update & Re-sign PDF' : 'Complete Handover & Sign'}
          </Button>
        </div>
      </div>

      {/* Fitted Accessories Verification Card */}
      {client.accessories && client.accessories.length > 0 && (
        <Card className="border-sky-200 bg-sky-50/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-sky-600" />
                <CardTitle className="text-sm font-bold text-sky-950">Vehicle Order Accessories</CardTitle>
              </div>
              <Badge variant="outline" className="text-sky-800 border-sky-300 text-xs">
                {client.accessories.length} ordered
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {client.accessories.map((acc, idx) => (
                <div key={idx} className="bg-white border border-sky-100 rounded-md p-2.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-800">{acc.name}</span>
                  <Badge className={`text-[10px] ${acc.status === 'Fitted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {acc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 12 Checklist Sections */}
      <div className="space-y-4">
        {inspectionSections.map((section, idx) => {
          const Icon = iconMap[section.icon] || Sparkles;
          const sectionItems = section.items;
          const sectionChecked = sectionItems.filter((i) => inspection.checklist?.[i.key]).length;
          const isSectionComplete = sectionChecked === sectionItems.length;
          const isOpen = openSections[section.id];

          return (
            <Card key={section.id} className={`border transition-all ${isSectionComplete ? 'border-emerald-200 bg-emerald-50/10' : 'border-neutral-200'}`}>
              <CardHeader
                className="py-3 px-4 cursor-pointer select-none hover:bg-neutral-50/80 transition-colors"
                onClick={() => toggleSectionCollapse(section.id)}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${isSectionComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-700'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-neutral-900">{section.title}</CardTitle>
                      <p className="text-[11px] text-neutral-500">{section.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Badge className={`text-xs font-semibold border-0 ${
                      isSectionComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {sectionChecked} / {sectionItems.length}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] text-neutral-600 hover:text-neutral-900 font-medium px-2"
                      onClick={() => toggleSectionAll(section, !isSectionComplete)}
                    >
                      {isSectionComplete ? 'Uncheck all' : 'Check all'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => toggleSectionCollapse(section.id)}
                      className="text-neutral-400 hover:text-neutral-600 p-1"
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardHeader>

              {isOpen && (
                <CardContent className="pt-2 pb-4 px-4 border-t border-neutral-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sectionItems.map((item) => {
                      const checked = Boolean(inspection.checklist?.[item.key]);
                      return (
                        <div
                          key={item.key}
                          onClick={() => toggleItem(item.key)}
                          className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                            checked
                              ? 'bg-emerald-50/60 border-emerald-300 text-neutral-900 shadow-2xs'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {checked ? (
                              <div className="h-4 w-4 rounded bg-emerald-600 text-white flex items-center justify-center">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="h-4 w-4 rounded border-2 border-neutral-300 bg-white" />
                            )}
                          </div>
                          <span className="text-xs font-medium leading-tight select-none">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* 7 Vehicle Condition Photo Slots */}
      <Card className="border-neutral-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-[#E11B22]" />
              <CardTitle className="text-base font-bold">Vehicle Condition Photos (7 Required Slots)</CardTitle>
            </div>
            <Badge className="bg-sky-100 text-sky-800 border-0 text-xs font-semibold">
              {photosCount} / 7 Photos
            </Badge>
          </div>
          <p className="text-xs text-neutral-500">
            Capture condition evidence before driving away. Photos are automatically embedded directly into the handover report.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {inspectionPhotoSlots.map((slot) => {
              const photoData = inspection.photos?.[slot.key];
              return (
                <div
                  key={slot.key}
                  className={`border rounded-lg p-3 flex flex-col justify-between space-y-2 transition-all ${
                    photoData ? 'border-emerald-300 bg-emerald-50/30' : 'border-neutral-200 bg-neutral-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">{slot.label}</span>
                      {photoData ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-neutral-300" />
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-tight">{slot.sublabel}</p>
                  </div>

                  {photoData ? (
                    <div className="relative group rounded-md overflow-hidden border border-neutral-200 aspect-video bg-black flex items-center justify-center">
                      <img src={photoData} alt={slot.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="cursor-pointer bg-white text-neutral-900 px-2.5 py-1 rounded text-xs font-bold shadow hover:bg-neutral-100">
                          Replace
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(slot.key, e)}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removePhoto(slot.key)}
                          className="bg-red-600 text-white p-1 rounded hover:bg-red-700 shadow"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-neutral-300 hover:border-neutral-400 rounded-md p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 bg-white hover:bg-neutral-50 transition-colors aspect-video">
                      <Upload className="h-5 w-5 text-neutral-400" />
                      <span className="text-xs font-semibold text-neutral-700">Take Photo / Upload</span>
                      <span className="text-[9px] text-neutral-400">JPG, PNG up to 8MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(slot.key, e)}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notes & Special Instructions */}
      <Card className="border-neutral-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Delivery Notes &amp; Observations</CardTitle>
          <p className="text-xs text-neutral-500">Record any specific customer requests, follow-ups, or notes</p>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            value={inspection.notes || ''}
            onChange={(e) => setInspection((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="e.g. Second key handed over, customer configured BYD app successfully, charging card activated..."
            className="text-xs"
          />
        </CardContent>
      </Card>

      {/* Customer Verification & Signatures */}
      <Card className="border-neutral-300 shadow-md">
        <CardHeader className="pb-3 bg-neutral-50/50 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#E11B22]" />
            <CardTitle className="text-base font-bold text-neutral-900">Delivery Acceptance &amp; Signoff</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          {/* Official Verification Declaration Box */}
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 leading-relaxed">
            <strong className="text-neutral-900 block mb-1">Customer Verification Declaration:</strong>
            {inspection.verification_declaration ||
              'I have inspected the vehicle and confirm it is in satisfactory condition, all accessories and keys have been received, and the vehicle features and controls have been explained to me.'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Signature Pad */}
            <div className="space-y-3">
              <SignaturePad
                label={`Customer Signature · ${client.name}`}
                value={inspection.customer_signature}
                onChange={(dataUri) => setInspection((prev) => ({ ...prev, customer_signature: dataUri }))}
              />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-medium text-neutral-500">Customer Name</label>
                  <Input
                    value={client.name}
                    disabled
                    className="h-8 text-xs bg-neutral-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-neutral-500">Sign Date</label>
                  <Input
                    type="date"
                    value={inspection.customer_signature_date ? inspection.customer_signature_date.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setInspection((prev) => ({ ...prev, customer_signature_date: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Salesperson Signature Pad */}
            <div className="space-y-3">
              <SignaturePad
                label={`Delivery Consultant Signature · ${client.salesperson || 'Staff'}`}
                value={inspection.salesperson_signature}
                onChange={(dataUri) => setInspection((prev) => ({ ...prev, salesperson_signature: dataUri }))}
              />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-medium text-neutral-500">Consultant Name</label>
                  <Input
                    value={client.salesperson || 'Delivery Specialist'}
                    disabled
                    className="h-8 text-xs bg-neutral-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-neutral-500">Sign Date</label>
                  <Input
                    type="date"
                    value={inspection.salesperson_signature_date ? inspection.salesperson_signature_date.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setInspection((prev) => ({ ...prev, salesperson_signature_date: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Final Actions Callout */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-neutral-500">
              Completing will automatically set <strong>Pre-Delivery Inspection Complete</strong>, update status to <strong>Signed copy on file</strong>, and compile the official PDF document into customer records.
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving || completing}
                className="text-xs"
              >
                Save Draft
              </Button>
              <Button
                onClick={handleComplete}
                disabled={completing || saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 shadow-sm"
              >
                <FileCheck className="h-4 w-4 mr-1.5" />
                {completing ? 'Finalizing Handover…' : isCompleted ? 'Update Signed Handover' : 'Complete Handover & Generate PDF'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
