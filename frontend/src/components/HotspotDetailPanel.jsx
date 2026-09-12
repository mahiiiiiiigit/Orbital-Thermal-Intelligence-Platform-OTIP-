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

  // If a cluster is selected instead of a hotspot
  const isCluster = !selectedHotspot && selectedCluster;
  const activeItem = selectedHotspot || selectedCluster;

  const handleCopyCoords = (lat, lon) => {
    if (!lat || !lon) return;
    navigator.clipboard.writeText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Helper for confidence color
  const getConfidenceBadge = (confidence) => {
    const confVal = typeof confidence === 'number' ? confidence : parseInt(confidence) || 85;
    if (confVal >= 80) {
      return {
        bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        text: 'HIGH CONFIDENCE',
        value: `${confVal}%`,
      };
    }
    if (confVal >= 50) {
      return {
        bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        text: 'NOMINAL',
        value: `${confVal}%`,
      };
    }
    return {
      bg: 'bg-red-500/15 text-red-400 border-red-500/30',
      text: 'LOW CONFIDENCE',
      value: `${confVal}%`,
    };
  };

  // If nothing is selected, show recent live anomaly detections feed
  if (!activeItem) {
    return (
      <aside className="w-80 md:w-88 bg-dark-900 border-l border-dark-700 flex flex-col h-full select-none z-20 transition-all duration-300">
        {/* Panel Header */}
        <div className="h-12 px-4 border-b border-dark-700 flex items-center justify-between bg-dark-850">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Live Anomaly Feed
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-dark-800 px-2 py-0.5 rounded border border-dark-700">
            {recentHotspots.length} Active
          </span>
        </div>

        {/* Empty State / Live Feed */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div className="p-3.5 rounded-xl bg-dark-850 border border-dark-700/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <h4 className="text-xs font-bold text-slate-200">Select an Anomaly on Map</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Click any thermal hotspot or cluster marker to inspect high-resolution radiative telemetry, FRP curves, and safety actions.
            </p>
          </div>

          <div className="pt-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 px-1 flex items-center justify-between">
              <span>Recent Hotspot Detections</span>
              <span className="text-emerald-400 text-[9px]">REAL-TIME</span>
            </div>

            <div className="space-y-1.5">
              {recentHotspots.slice(0, 10).map((h, idx) => {
                const frp = Number(h.frp) || 0;
                const cls = h.classification || 'UNCLASSIFIED';
                const color = TAXONOMY_COLORS[cls] || '#f97316';

                return (
                  <button
                    key={h.id || idx}
                    type="button"
                    onClick={() => onSelectHotspot && onSelectHotspot(h)}
                    className="w-full text-left p-2.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700/70 hover:border-orange-500/40 transition-all duration-150 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-sky-300">
                          {cls.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-orange-400">
                        {frp.toFixed(1)} <span className="text-[10px] text-slate-500">MW</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{h.latitude ? `${h.latitude.toFixed(2)}°, ${h.longitude.toFixed(2)}°` : 'NRT Swath'}</span>
                      <span>{h.timestamp ? h.timestamp.slice(11, 16) : 'LIVE'}</span>
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

  // Active Hotspot Details View
  const frp = Number(selectedHotspot?.frp) || 0;
  const brightness = Number(selectedHotspot?.brightness) || Number(selectedHotspot?.bright_ti4) || 330;
  const brightnessCelsius = (brightness - 273.15).toFixed(1);
  const confidence = selectedHotspot?.confidence || '95';
  const confBadge = getConfidenceBadge(confidence);
  const classification = selectedHotspot?.classification || 'UNCLASSIFIED';
  const classColor = TAXONOMY_COLORS[classification] || '#f97316';
  const sensor = selectedHotspot?.sensor || selectedHotspot?.satellite || 'VIIRS_SNPP';
  const timestamp = selectedHotspot?.timestamp || selectedHotspot?.acq_date || new Date().toISOString();
  const lat = selectedHotspot?.latitude || 0;
  const lon = selectedHotspot?.longitude || 0;
  const facility = selectedHotspot?.facility_name || selectedHotspot?.nearest_facility || null;

  return (
    <aside className="w-80 md:w-92 bg-dark-900 border-l border-dark-700 flex flex-col h-full select-none z-20 transition-all duration-300 shadow-2xl">
      
      {/* Top Header Bar with Close */}
      <div className="h-12 px-4 border-b border-dark-700 flex items-center justify-between bg-dark-850">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: classColor }}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
            Telemetry Inspector
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Classification Banner Card */}
        <div className="rounded-xl p-3.5 bg-gradient-to-br from-dark-850 to-dark-800 border border-dark-700/90 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span
              className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wide border"
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
            {facility ? facility : `Thermal Anomaly #${selectedHotspot?.id || 'SNPP-01'}`}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-1">
            <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{timestamp.replace('T', ' ').slice(0, 19)} UTC</span>
          </div>
        </div>

        {/* Radiance & Brightness Gauges (2x2 Grid) */}
        <div className="grid grid-cols-2 gap-2.5">
          
          {/* FRP Radiance */}
          <div className="p-3 rounded-xl bg-dark-850 border border-orange-500/30 shadow-inner">
            <div className="flex items-center justify-between text-[10px] font-mono text-orange-400">
              <span>RADIANCE (FRP)</span>
              <Flame className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-2xl font-mono font-black text-orange-400 mt-1">
              {frp.toFixed(1)} <span className="text-xs font-normal text-slate-400">MW</span>
            </div>
            <div className="w-full bg-dark-950 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (frp / 250) * 100)}%` }}
              />
            </div>
          </div>

          {/* Brightness Temperature */}
          <div className="p-3 rounded-xl bg-dark-850 border border-red-500/30 shadow-inner">
            <div className="flex items-center justify-between text-[10px] font-mono text-red-400">
              <span>BRIGHTNESS (T4)</span>
              <Thermometer className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-2xl font-mono font-black text-red-400 mt-1">
              {brightness.toFixed(1)} <span className="text-xs font-normal text-slate-400">K</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">
              ≈ {brightnessCelsius} °C
            </div>
          </div>

        </div>

        {/* Spatial Coordinates & Sensor Specifications */}
        <div className="rounded-xl p-3 bg-dark-850 border border-dark-700/80 space-y-2 text-xs font-mono">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-dark-700/60">
            Geospatial & Sensor Telemetry
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400" /> Coords:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-200 font-semibold">
                {lat.toFixed(4)}°, {lon.toFixed(4)}°
              </span>
              <button
                type="button"
                onClick={() => handleCopyCoords(lat, lon)}
                className="p-1 rounded hover:bg-dark-800 text-slate-400 hover:text-sky-400 transition-colors"
                title="Copy Coordinates"
              >
                {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Satellite className="w-3.5 h-3.5 text-cyan-400" /> Sensor:
            </span>
            <span className="text-slate-200 font-semibold">{sensor}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" /> Resolution:
            </span>
            <span className="text-emerald-400 font-semibold">375m (I-Band)</span>
          </div>
        </div>

        {/* Contextual Action Buttons */}
        <div className="space-y-2 pt-2">
          
          {/* Facility Fingerprint action */}
          {onViewFingerprint && (
            <button
              type="button"
              onClick={() => onViewFingerprint(facility || selectedHotspot)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-sky-500/30 hover:border-sky-500 text-xs font-semibold text-sky-400 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Inspect Facility Fingerprint</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Investigation Modal action */}
          {onInvestigateEvent && (
            <button
              type="button"
              onClick={() => onInvestigateEvent(selectedHotspot)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/40 text-xs font-bold text-orange-300 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-400 animate-pulse" />
                <span>Investigate Anomaly Incident</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>

      {/* Footer Info */}
      <div className="h-10 px-4 border-t border-dark-700 bg-dark-850 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          NASA FIRMS NRT L1B
        </span>
        <a
          href={`https://www.google.com/maps?q=${lat},${lon}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:underline flex items-center gap-1"
        >
          <span>Map</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

    </aside>
  );
}
