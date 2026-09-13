import React, { useState } from 'react';
import {
  Flame,
  Satellite,
  Clock,
  MapPin,
  ShieldAlert,
  Thermometer,
  Gauge,
  Activity,
  X,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Layers,
  ChevronRight,
  Radio,
  Share2,
  AlertTriangle,
  Route,
  Building2,
  Cpu,
  Sparkles,
  Radar,
  ArrowUpRight
} from 'lucide-react';
import { TAXONOMY_COLORS } from '../constants/taxonomy';

export function HotspotDetailPanel({
  selectedHotspot,
  selectedCluster,
  recentHotspots = [],
  onSelectHotspot,
  onClose,
  onViewFingerprint,
  onInvestigateEvent,
  onSetRoute,
}) {
  const [copiedCoords, setCopiedCoords] = useState(false);

  const activeItem = selectedHotspot || selectedCluster;
  const isCluster = !selectedHotspot && !!selectedCluster;

  const handleCopyCoords = (lat, lon) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    navigator.clipboard.writeText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Use only sensor confidence supplied by the data source.
  const getConfidenceBadge = (confidence) => {
    const raw = confidence;
    const confVal = raw !== null && raw !== undefined && raw !== '' && Number.isFinite(Number(raw))
      ? Number(raw)
      : null;

    if (confVal === null) {
      return {
        bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        text: 'CONFIDENCE UNASSESSED',
        value: '—',
      };
    }

    if (confVal >= 80) {
      return {
        bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        text: 'HIGH SENSOR CONFIDENCE',
        value: `${confVal}%`,
      };
    }
    if (confVal >= 50) {
      return {
        bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        text: 'NOMINAL CONFIDENCE',
        value: `${confVal}%`,
      };
    }
    return {
      bg: 'bg-red-500/15 text-red-400 border-red-500/30',
      text: 'LOW CONFIDENCE',
      value: `${confVal}%`,
    };
  };

  // Format UTC & IST timestamps
  const formatTimestamps = (rawTimestamp) => {
    const dateObj = rawTimestamp ? new Date(rawTimestamp) : new Date();
    const utcString = isNaN(dateObj.getTime()) ? (rawTimestamp || 'LIVE NRT') : dateObj.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    
    // IST formatting (+5:30)
    let istString = '';
    try {
      istString = dateObj.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' IST';
    } catch {
      istString = 'Local IST';
    }

    return { utcString, istString };
  };

  // Use backend-provided diagnosis/reasoning only. No frontend-generated scientific claims.
  const getDiagnosis = (item) => {
    const explanation =
      item?.ai_explanation ||
      item?.risk_explanation ||
      item?.explanation ||
      item?.message ||
      null;

    const rawReasons = Array.isArray(item?.reasons) ? item.reasons.filter(Boolean) : [];
    const breakdown = item?.risk_breakdown || {};
    const attribution = [];

    if (breakdown.frp_intensity_score !== undefined) attribution.push(`FRP intensity score: +${breakdown.frp_intensity_score} pts`);
    if (breakdown.persistence_score !== undefined) attribution.push(`Persistence score: +${breakdown.persistence_score} pts`);
    if (breakdown.proximity_penalty !== undefined) attribution.push(`Proximity factor: +${breakdown.proximity_penalty} pts`);
    if (breakdown.nighttime_bonus !== undefined) attribution.push(`Nighttime factor: +${breakdown.nighttime_bonus} pts`);
    if (rawReasons.length) attribution.push(...rawReasons.slice(0, 4));

    const riskLevel =
      item?.risk_level
        ? String(item.risk_level).toUpperCase()
        : item?.fire_danger_level
          ? String(item.fire_danger_level).toUpperCase()
          : 'UNASSESSED';

    return {
      headline: item?.classification
        ? String(item.classification).replace(/_/g, ' ')
        : 'Thermal Detection',
      reasoning: explanation || 'No backend diagnostic explanation is available for this detection.',
      attribution: attribution.length ? attribution : ['No additional attribution factors supplied'],
      riskLevel,
      riskColor: riskLevel === 'CRITICAL' || riskLevel === 'EXTREME'
        ? '#ef4444'
        : riskLevel === 'HIGH'
          ? '#f97316'
          : '#94a3b8',
    };
  };

  // If nothing is selected, show recent live anomaly detections feed
  if (!activeItem) {
    return (
      <aside className="w-80 md:w-92 bg-dark-950/95 border-l border-dark-800 flex flex-col h-full select-none z-20 backdrop-blur-xl shadow-2xl transition-all duration-300">
        {/* Panel Header */}
        <div className="h-12 px-4 border-b border-dark-800 flex items-center justify-between bg-dark-900/80">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
              Live Satellite Feed
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
            {recentHotspots.length} DETECTIONS
          </span>
        </div>

        {/* Empty State / Live Feed */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
          <div className="p-4 rounded-xl bg-dark-900/90 border border-dark-800 text-center space-y-2.5 shadow-md">
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
              <Radar className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">Select Anomaly on Map</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Click any thermal hotspot or cluster marker to inspect high-resolution radiance telemetry, AI explanation, and SOP response actions.
            </p>
          </div>

          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 px-1 flex items-center justify-between">
              <span>Recent Thermal Events</span>
              <span className="text-sky-400 text-[9px] font-mono">NRT REAL-TIME</span>
            </div>

            <div className="space-y-1.5">
              {recentHotspots.slice(0, 12).map((h, idx) => {
                const frp = h.frp !== null && h.frp !== undefined && Number.isFinite(Number(h.frp)) ? Number(h.frp) : null;
                const cls = h.classification || 'UNCLASSIFIED';
                const color = TAXONOMY_COLORS[cls] || '#f97316';
                const loc = h.facility_name || h.forest_name || h.state ||
                  (Number.isFinite(Number(h.latitude)) && Number.isFinite(Number(h.longitude))
                    ? `${Number(h.latitude).toFixed(2)}°, ${Number(h.longitude).toFixed(2)}°`
                    : 'Unattributed Source');

                return (
                  <button
                    key={h.id || idx}
                    type="button"
                    onClick={() => onSelectHotspot && onSelectHotspot(h)}
                    className="w-full text-left p-2.5 rounded-xl bg-dark-900/80 hover:bg-dark-850 border border-dark-800 hover:border-orange-500/40 transition-all duration-150 group cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }}
                        />
                        <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-sky-300">
                          {cls.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-orange-400">
                        {frp !== null ? frp.toFixed(1) : '—'} <span className="text-[10px] text-slate-500 font-normal">{frp !== null ? 'MW' : ''}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="truncate max-w-[170px]">{loc}</span>
                      <span className="text-slate-500">{h.timestamp ? h.timestamp.slice(11, 16) : 'LIVE'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Active Hotspot or Cluster Details View
  const frpRaw = activeItem?.frp ?? activeItem?.mean_frp ?? activeItem?.current_frp;
  const frp = frpRaw !== null && frpRaw !== undefined && Number.isFinite(Number(frpRaw)) ? Number(frpRaw) : null;
  const brightnessRaw = activeItem?.brightness_temp ?? activeItem?.brightness ?? activeItem?.bright_ti4;
  const brightness = brightnessRaw !== null && brightnessRaw !== undefined && Number.isFinite(Number(brightnessRaw))
    ? Number(brightnessRaw)
    : null;
  const brightnessCelsius = brightness !== null ? (brightness - 273.15).toFixed(1) : null;
  const confidence = activeItem?.confidence;
  const confBadge = getConfidenceBadge(confidence);
  const classification = activeItem?.classification || (isCluster ? 'PERSISTENT_CLUSTER' : 'UNCLASSIFIED');
  const classColor = TAXONOMY_COLORS[classification] || '#f97316';
  const sensor = activeItem?.sensor || activeItem?.satellite || '—';
  const rawTime = activeItem?.timestamp || activeItem?.acq_date || activeItem?.first_detected;
  const { utcString, istString } = formatTimestamps(rawTime);
  const latRaw = activeItem?.latitude;
  const lonRaw = activeItem?.longitude;
  const hasCoords = Number.isFinite(Number(latRaw)) && Number.isFinite(Number(lonRaw));
  const lat = hasCoords ? Number(latRaw) : null;
  const lon = hasCoords ? Number(lonRaw) : null;
  const facility = activeItem?.facility_name || activeItem?.name || activeItem?.nearest_facility || null;
  const aiDiagnosis = getDiagnosis(activeItem);

  // ML is secondary characterization from the production model.
  // Clusters do not carry a per-source ML characterization, so do not invent one.
  const mlClassification = !isCluster && activeItem?.ml_classification
    ? String(activeItem.ml_classification)
    : null;
  const mlStatus = !isCluster && activeItem?.ml_status
    ? String(activeItem.ml_status)
    : null;
  const mlLabel = mlClassification
    ? mlClassification.replace(/_/g, ' ')
    : 'Not Applicable';
  const mlStatusLabel = mlStatus
    ? mlStatus.replace(/_/g, ' ')
    : 'Not Applicable';
  const mlStatusClass = mlStatus === 'CONSISTENT'
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : mlStatus === 'INCONSISTENT'
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : 'bg-slate-500/15 text-slate-400 border-slate-500/30';

  return (
    <aside className="w-80 md:w-96 bg-dark-950/95 border-l border-dark-800 flex flex-col h-full select-none z-20 backdrop-blur-xl transition-all duration-300 shadow-2xl">
      
      {/* Top Header Bar with Close */}
      <div className="h-12 px-4 border-b border-dark-800 flex items-center justify-between bg-dark-900/80">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: classColor }}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
            {isCluster ? 'Cluster Intelligence' : 'Thermal Hotspot Inspector'}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors cursor-pointer"
          title="Close Inspector Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Details Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
        
        {/* Classification Banner Card */}
        <div className="rounded-xl p-3.5 bg-gradient-to-br from-dark-900 to-dark-850 border border-dark-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span
              className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wide border shadow-sm"
              style={{
                backgroundColor: `${classColor}20`,
                borderColor: `${classColor}50`,
                color: classColor,
              }}
            >
              {classification.replace('_', ' ')}
            </span>

            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${confBadge.bg}`}>
              {confBadge.value} {confBadge.text}
            </span>
          </div>

          <h3 className="text-base font-bold text-white leading-tight">
            {facility ? facility : (isCluster ? `Thermal Cluster (${activeItem?.detection_count || 1} Points)` : `Hotspot #${activeItem?.id || '—'}`)}
          </h3>

          <div className="mt-2 space-y-0.5 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{istString}</span>
            </div>
            <div className="text-[10px] text-slate-500 pl-5">
              {utcString}
            </div>
          </div>
        </div>

        {/* ML-Assisted Characterization — hotspot-level only */}
        {!isCluster && (
          <div className="rounded-xl p-3.5 bg-dark-900/90 border border-sky-500/20 space-y-2 shadow-md">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ML-Assisted Characterization</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Characterization</span>
                <span className="text-slate-100 font-semibold text-right">{mlLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Status</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${mlStatusClass}`}>
                  {mlStatusLabel}
                </span>
              </div>
            </div>

            <p className="text-[9.5px] text-slate-500 leading-relaxed">
              Secondary model characterization; contextual classification remains authoritative.
            </p>
          </div>
        )}

        {/* Radiance & Brightness Gauges (2x2 Grid) */}
        <div className="grid grid-cols-2 gap-2.5">
          
          {/* FRP Radiance */}
          <div className="p-3 rounded-xl bg-dark-900/90 border border-orange-500/30 shadow-md">
            <div className="flex items-center justify-between text-[10px] font-mono text-orange-400">
              <span>RADIANCE (FRP)</span>
              <Flame className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-2xl font-mono font-black text-orange-400 mt-1">
              {frp !== null ? frp.toFixed(1) : '—'} <span className="text-xs font-normal text-slate-400">{frp !== null ? 'MW' : ''}</span>
            </div>
            <div className="w-full bg-dark-950 h-1.5 rounded-full mt-2 overflow-hidden border border-dark-800">
              {frp !== null && (
                <div
                  className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (frp / 250) * 100)}%` }}
                />
              )}
            </div>
          </div>

          {/* Brightness Temperature */}
          <div className="p-3 rounded-xl bg-dark-900/90 border border-red-500/30 shadow-md">
            <div className="flex items-center justify-between text-[10px] font-mono text-red-400">
              <span>BRIGHTNESS (T4)</span>
              <Thermometer className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-2xl font-mono font-black text-red-400 mt-1">
              {brightness !== null ? brightness.toFixed(1) : '—'} <span className="text-xs font-normal text-slate-400">{brightness !== null ? 'K' : ''}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">
              {brightnessCelsius !== null ? `≈ ${brightnessCelsius} °C` : 'Temperature unavailable'}
            </div>
          </div>

        </div>

        {/* AI EXPLANATION & ROOT-CAUSE ATTRIBUTION */}
        <div className="rounded-xl p-3.5 bg-dark-900/90 border border-dark-800 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>AI Thermal Diagnosis</span>
            </span>
            <span
              className="px-2 py-0.5 rounded text-[9px] font-mono font-bold border"
              style={{
                backgroundColor: `${aiDiagnosis.riskColor}15`,
                color: aiDiagnosis.riskColor,
                borderColor: `${aiDiagnosis.riskColor}40`
              }}
            >
              {aiDiagnosis.riskLevel}
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-100">
              {aiDiagnosis.headline}
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans mt-1">
              {aiDiagnosis.reasoning}
            </p>
          </div>

          {/* Attribution Key Factors */}
          <div className="space-y-1 pt-1">
            <span className="text-[9.5px] font-mono uppercase text-slate-500 block">
              Confidence & Attribution Factors:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {aiDiagnosis.attribution.map((attr, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-dark-950 border border-dark-800 text-slate-300 flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5 text-sky-400" />
                  <span>{attr}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Spatial Coordinates & Sensor Specifications */}
        <div className="rounded-xl p-3 bg-dark-900/90 border border-dark-800 space-y-2 text-xs font-mono shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-dark-800 flex items-center justify-between">
            <span>Spatial Telemetry</span>
            <span className="text-emerald-400 text-[9px]">L1B GEOLOCATED</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400" /> Coords:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-200 font-semibold">
                {hasCoords ? `${lat.toFixed(4)}°, ${lon.toFixed(4)}°` : '—'}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCoords(lat, lon)}
                 disabled={!hasCoords}
                className="p-1 rounded hover:bg-dark-800 text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                title="Copy Coordinates"
              >
                {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Satellite className="w-3.5 h-3.5 text-cyan-400" /> Sensor / Satellite:
            </span>
            <span className="text-slate-200 font-semibold">{sensor}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" /> Ground Resolution:
            </span>
            <span className="text-emerald-400 font-semibold">
              {String(sensor).includes('VIIRS') ? '375m (I-Band NRT)' : '—'}
            </span>
          </div>
        </div>

        {/* Contextual Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Facility Fingerprint action */}
          {onViewFingerprint && (
            <button
              type="button"
              onClick={() => onViewFingerprint(facility || activeItem)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-dark-900 hover:bg-dark-850 border border-sky-500/30 hover:border-sky-500 text-xs font-semibold text-sky-400 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Inspect Thermal Fingerprint</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Investigation Modal action */}
          {onInvestigateEvent && (
            <button
              type="button"
              onClick={() => onInvestigateEvent(activeItem)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/40 text-xs font-bold text-orange-300 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-400 animate-pulse" />
                <span>Trigger Emergency Response SOP</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* Footer Info */}
      <div className="h-10 px-4 border-t border-dark-800 bg-dark-900/90 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>ORBITAL RECEPTOR ACTIVE</span>
        </span>
        <a
          href={hasCoords ? `https://www.google.com/maps?q=${lat},${lon}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sky-400 hover:underline flex items-center gap-1 ${!hasCoords ? 'pointer-events-none opacity-50' : ''}`}
        >
          <span>Sat View</span>
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>

    </aside>
  );
}

