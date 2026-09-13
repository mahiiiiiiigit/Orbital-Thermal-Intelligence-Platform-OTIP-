import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  Search,
  SlidersHorizontal,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  Radio,
  Send,
  Building2,
  Share2,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Sparkles,
  Zap,
  Activity,
  ArrowLeft,
  RefreshCw,
  Bell,
  Thermometer,
  TrendingUp,
} from 'lucide-react';
import { AlertMapPreview } from './AlertMapPreview';
import { REGIONS } from '../constants/taxonomy';

export function AlertsPage({
  alerts = [],
  hotspots = [],
  onNavigateDashboard,
  onNavigateLanding,
  onNavigateAnalytics,
  onInvestigateEvent,
  onViewFingerprint,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all'); // 'all' | 'critical' | 'high' | 'medium' | 'low'
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('severity'); // 'severity' | 'time' | 'frp'
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Use backend-generated alerts only.
  // The existing UI fields are preserved, but missing backend values are shown
  // with semantic states instead of fabricated measurements.
  const enrichedAlerts = useMemo(() => {
    return (alerts || []).map((alert, idx) => {
      const classification = String(
        alert.classification || alert.taxonomy || 'UNCLASSIFIED'
      ).toUpperCase();

      const riskLevel = String(
        alert.risk_level || alert.severity || 'UNASSESSED'
      ).toUpperCase();

      const severity = String(
        alert.severity || alert.risk_level || 'UNASSESSED'
      ).toLowerCase();

      const facilityName =
        alert.facility_name ||
        alert.site_name ||
        alert.location ||
        'Unattributed Source';

      const location =
        alert.location ||
        alert.state ||
        alert.region ||
        facilityName;

      const title =
        alert.title ||
        alert.message ||
        `${classification.replace(/_/g, ' ')} anomaly detected`;

      const explanation =
        alert.ai_explanation ||
        alert.risk_explanation ||
        alert.message ||
        'Backend anomaly alert generated from the available thermal observations.';

      const id = alert.id || alert.alert_id || `backend-alert-${idx}`;

      return {
        ...alert,
        id,
        alert_id: alert.alert_id || id,
        title,
        facility_name: facilityName,
        location,
        severity,
        risk_level: riskLevel,
        classification,
        ai_explanation: explanation,
        rawHotspot: alert.rawHotspot || alert.hotspot || null,
      };
    });
  }, [alerts]);

  // Selected Alert State
  const [selectedAlertId, setSelectedAlertId] = useState(() => {
    return enrichedAlerts[0]?.id || null;
  });

  // Filtered & Sorted Alerts
  const filteredAlerts = useMemo(() => {
    return enrichedAlerts
      .filter((a) => {
        // Search filter
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchTitle = (a.title || '').toLowerCase().includes(q);
          const matchFac = (a.facility_name || '').toLowerCase().includes(q);
          const matchLoc = (a.location || '').toLowerCase().includes(q);
          const matchCls = (a.classification || '').toLowerCase().includes(q);
          if (!matchTitle && !matchFac && !matchLoc && !matchCls) return false;
        }

        // Severity filter
        if (selectedSeverity !== 'all') {
          const sev = (a.severity || a.risk_level || '').toLowerCase();
          if (sev !== selectedSeverity) return false;
        }

        // Type filter
        if (selectedType !== 'all') {
          const cls = (a.classification || '').toUpperCase();
          if (cls !== selectedType) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'severity') {
          const sevMap = { critical: 4, high: 3, medium: 2, low: 1 };
          const sA = sevMap[(a.severity || a.risk_level || 'low').toLowerCase()] || 0;
          const sB = sevMap[(b.severity || b.risk_level || 'low').toLowerCase()] || 0;
          return sB - sA;
        }
        if (sortBy === 'frp') {
          return (Number(b.current_frp) || 0) - (Number(a.current_frp) || 0);
        }
        // Time
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
  }, [enrichedAlerts, searchTerm, selectedSeverity, selectedType, sortBy]);

  const activeAlert = useMemo(() => {
    return (
      filteredAlerts.find((a) => a.id === selectedAlertId) ||
      filteredAlerts[0] ||
      enrichedAlerts[0] ||
      null
    );
  }, [filteredAlerts, selectedAlertId, enrichedAlerts]);

  // Telemetry KPIs
  const criticalCount = enrichedAlerts.filter(
    (a) => (a.severity || a.risk_level || '').toLowerCase() === 'critical'
  ).length;
  const highCount = enrichedAlerts.filter(
    (a) => (a.severity || a.risk_level || '').toLowerCase() === 'high'
  ).length;

  const handleTriggerDispatch = () => {
    setDispatchSuccess(true);
    setTimeout(() => setDispatchSuccess(false), 3500);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-dark-950 overflow-hidden text-slate-100 font-sans select-none">
      
      {/* 1. TOP EMERGENCY COMMAND HEADER BAR */}
      <header className="h-16 bg-dark-900 border-b border-dark-700/80 px-4 sm:px-6 flex items-center justify-between gap-4 z-30 shrink-0">
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onNavigateDashboard}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Map</span>
          </button>

          <div className="h-6 w-[1px] bg-dark-700 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/30 border border-red-400/40">
                <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-dark-950"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-wider uppercase text-white font-sans">
                  Alerts & Critical Events
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  REAL-TIME 3σ
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Autonomous Satellite Anomaly Detection & Emergency Incident Dispatch
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Stats & Navigation */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-dark-850 border border-dark-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-slate-400">Critical:</span>
              <span className="font-bold text-red-400">{criticalCount}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-dark-850 border border-dark-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-slate-400">High Severity:</span>
              <span className="font-bold text-orange-400">{highCount}</span>
            </div>
          </div>

          {onNavigateAnalytics && (
            <button
              type="button"
              onClick={onNavigateAnalytics}
              className="px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer hidden md:flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Analytics</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateLanding}
            className="px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Overview
          </button>
        </div>
      </header>

      {/* 2. OPERATIONAL FILTER & SEARCH CONTROL STRIP */}
      <div className="bg-dark-900/90 border-b border-dark-700/70 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-20 shrink-0">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search alerts by location, facility, or taxonomy..."
            className="w-full bg-dark-850 border border-dark-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1 bg-dark-850 p-1 rounded-lg border border-dark-700">
          <span className="text-[10px] font-mono font-bold text-slate-400 px-2">SEVERITY:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => {
            const isSelected = selectedSeverity === sev;
            const colorClass =
              sev === 'critical'
                ? 'text-red-400'
                : sev === 'high'
                ? 'text-orange-400'
                : sev === 'medium'
                ? 'text-amber-400'
                : sev === 'low'
                ? 'text-sky-400'
                : 'text-slate-300';

            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold uppercase transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-dark-750 text-white shadow-sm border border-slate-600'
                    : `${colorClass} hover:text-white hover:bg-dark-800`
                }`}
              >
                {sev}
              </button>
            );
          })}
        </div>

        {/* Anomaly Type & Sort Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Anomaly Type */}
          <div className="flex items-center gap-1.5 bg-dark-850 border border-dark-700 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer pr-1 text-xs font-medium"
            >
              <option value="all" className="bg-dark-850 text-slate-200">All Anomaly Types</option>
              <option value="WILDFIRE" className="bg-dark-850 text-slate-200">Active Wildfire</option>
              <option value="GAS_FLARE" className="bg-dark-850 text-slate-200">Gas Flaring</option>
              <option value="PERSISTENT_INDUSTRIAL" className="bg-dark-850 text-slate-200">Industrial Facility</option>
              <option value="AGRICULTURE" className="bg-dark-850 text-slate-200">Biomass Stubble</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-dark-850 border border-dark-700 rounded-lg px-2.5 py-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer pr-1 text-xs font-medium"
            >
              <option value="severity" className="bg-dark-850 text-slate-200">Severity (Highest)</option>
              <option value="time" className="bg-dark-850 text-slate-200">Timestamp (Newest)</option>
              <option value="frp" className="bg-dark-850 text-slate-200">Radiance (MW FRP)</option>
            </select>
          </div>
        </div>

      </div>

      {/* 3. SPLIT MAIN WORKSPACE: LEFT LIST & RIGHT DETAIL INSPECTOR */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Column: Alert Cards List */}
        <div className="w-full lg:w-5/12 xl:w-4/12 bg-dark-900 border-r border-dark-700/80 flex flex-col h-full overflow-hidden">
          
          <div className="p-3 border-b border-dark-700/70 bg-dark-850 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Showing {filteredAlerts.length} Alert Events</span>
            <span className="text-emerald-400 font-bold">NASA NRT SWATH ACTIVE</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center space-y-3 bg-dark-850 rounded-xl border border-dark-700/60 mt-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Active Anomaly Events Found</h4>
                <p className="text-xs text-slate-400">
                  No active alerts match your current filter parameters. Try clearing your search query or expanding the severity threshold.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isSelected = activeAlert?.id === alert.id;
                const sev = (alert.severity || alert.risk_level || 'low').toLowerCase();
                const isCritical = sev === 'critical';
                const isHigh = sev === 'high';
                const color = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#eab308';
                const frp = Number(alert.current_frp);
                const hasFrp = Number.isFinite(frp);

                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`relative rounded-xl p-4 transition-all duration-200 cursor-pointer border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-dark-800 border-orange-500/60 shadow-xl shadow-dark-950 ring-1 ring-orange-500/40'
                        : isCritical
                        ? 'bg-dark-850/90 border-red-500/30 hover:border-red-500/60 hover:bg-dark-800/80'
                        : 'bg-dark-850/70 border-dark-700/70 hover:border-slate-500 hover:bg-dark-800/60'
                    }`}
                  >
                    {/* Top Row: Severity Badge & Radiance */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {/* Blinking Beacon */}
                        <span className="relative flex h-2.5 w-2.5">
                          {isCritical && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          )}
                          <span
                            className="relative inline-flex rounded-full h-2.5 w-2.5"
                            style={{ backgroundColor: color }}
                          ></span>
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border ${
                            isCritical
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : isHigh
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {sev} SEVERITY
                        </span>

                        {alert.z_score && (
                          <span className="text-[10px] font-mono text-slate-400 bg-dark-900 px-1.5 py-0.5 rounded border border-dark-700">
                            {Number.isFinite(Number(alert.z_score))
                              ? `+${Number(alert.z_score)}σ`
                              : 'Baseline Pending'}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-mono font-extrabold text-orange-400">
                          {hasFrp ? frp.toFixed(1) : '—'} <span className="text-[10px] text-slate-400">MW</span>
                        </span>
                      </div>
                    </div>

                    {/* Alert Title & Location */}
                    <div className="space-y-1 mb-2.5">
                      <h3 className="text-sm font-bold text-white leading-snug">
                        {alert.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-sky-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{alert.facility_name || alert.location}</span>
                      </div>
                    </div>

                    {/* Short AI Explanation */}
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-3 bg-dark-900/60 p-2 rounded-lg border border-dark-700/50 font-mono">
                      {alert.ai_explanation}
                    </p>

                    {/* Timestamp & Meta Footer */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-dark-700/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{alert.timestamp ? `${alert.timestamp.slice(11, 16)} UTC` : '—'}</span>
                      </div>
                      <span className="text-slate-300 flex items-center gap-0.5 hover:text-sky-300 font-semibold">
                        Inspect Telemetry <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Map Preview & Full Incident Details Console */}
        {activeAlert ? (
          <div className="flex-1 bg-dark-950 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-5">
            
            {/* 1. Map Preview Container */}
            <div className="h-[280px] sm:h-[320px] w-full shrink-0 shadow-2xl">
              <AlertMapPreview selectedAlert={activeAlert} allAlerts={filteredAlerts} />
            </div>

            {/* 2. Incident Telemetry & Diagnostic Console */}
            <div className="rounded-2xl bg-dark-900 border border-dark-700/80 p-5 sm:p-6 shadow-xl space-y-5">
              
              {/* Header Title & Severity */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dark-700/70">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-black uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                      {String(activeAlert.severity || activeAlert.risk_level || 'UNASSESSED').toUpperCase()} ANOMALY
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ID: {activeAlert.id}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white font-sans">
                    {activeAlert.title}
                  </h2>

                  <div className="flex items-center gap-2 text-xs text-sky-400 font-mono">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{activeAlert.location}</span>
                    <span className="text-slate-600">•</span>
                    <span>{activeAlert.latitude?.toFixed(4)}° N, {activeAlert.longitude?.toFixed(4)}° E</span>
                  </div>
                </div>

                {/* Dispatch Alert Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerDispatch}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 hover:from-red-500 hover:via-orange-500 hover:to-amber-400 shadow-lg shadow-red-600/30 transition-all duration-200 active:scale-95 border border-red-400/40 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{dispatchSuccess ? 'Response SOP Ready' : 'Prepare Response SOP'}</span>
                  </button>
                </div>
              </div>

              {/* Toast Dispatch Notification */}
              {dispatchSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Backend-generated emergency response recommendation is ready for operational review. No external dispatch has been sent.
                  </span>
                </div>
              )}

              {/* Telemetry Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-dark-850 border border-orange-500/30">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Observed Radiance</div>
                  <div className="text-xl font-mono font-extrabold text-orange-400 mt-1">
                    {Number.isFinite(Number(activeAlert.current_frp))
                      ? Number(activeAlert.current_frp).toFixed(1)
                      : '—'} <span className="text-xs text-slate-400">MW</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-dark-850 border border-dark-700">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Statistical Baseline</div>
                  <div className="text-xl font-mono font-bold text-slate-200 mt-1">
                    {Number.isFinite(Number(activeAlert.baseline_mean_frp))
                      ? Number(activeAlert.baseline_mean_frp).toFixed(1)
                      : 'Baseline Pending'} <span className="text-xs text-slate-400">MW</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-dark-850 border border-red-500/30">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Statistical Variance</div>
                  <div className="text-xl font-mono font-extrabold text-red-400 mt-1">
                    {Number.isFinite(Number(activeAlert.z_score))
                      ? `+${Number(activeAlert.z_score)}σ`
                      : 'Baseline Pending'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-dark-850 border border-dark-700">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Risk Assessment</div>
                  <div className="text-xl font-mono font-bold text-slate-200 mt-1">
                    {activeAlert.risk_level || 'UNASSESSED'}
                  </div>
                </div>
              </div>

              {/* ML-Assisted Characterization */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-dark-850 border border-dark-700/80">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Classification</div>
                  <div className="text-sm font-mono font-bold text-slate-100 mt-1">
                    {String(activeAlert.classification || 'UNCLASSIFIED').replace(/_/g, ' ')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-dark-850 border border-dark-700/80">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">ML-Assisted Characterization</div>
                  <div className="text-sm font-mono font-bold text-sky-300 mt-1">
                    {activeAlert.ml_classification
                      ? String(activeAlert.ml_classification).replace(/_/g, ' ')
                      : 'Not Applicable'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-dark-850 border border-dark-700/80">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">ML Status</div>
                  <div className="text-sm font-mono font-bold text-slate-200 mt-1">
                    {activeAlert.ml_status
                      ? String(activeAlert.ml_status).replace(/_/g, ' ')
                      : 'Not Applicable'}
                  </div>
                </div>
              </div>

              {/* AI Diagnostic Explanation */}
              <div className="space-y-2 bg-dark-850/80 p-4 rounded-xl border border-dark-700/80">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>AI Diagnostic & Anomaly Root-Cause Analysis</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {activeAlert.ai_explanation}
                </p>
              </div>

              {/* SOP Response Protocol */}
              <div className="space-y-2 bg-red-950/20 p-4 rounded-xl border border-red-500/30">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Recommended SOP Emergency Action Protocol</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {activeAlert.recommendation}
                </p>
              </div>

              {/* Contextual Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {onInvestigateEvent && (
                  <button
                    type="button"
                    onClick={() => onInvestigateEvent(activeAlert.rawHotspot || activeAlert)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
                  >
                    <Activity className="w-4 h-4 text-orange-400" />
                    <span>Investigate Incident Dossier</span>
                  </button>
                )}

                {onViewFingerprint && (
                  <button
                    type="button"
                    onClick={() => onViewFingerprint(activeAlert.facility_name || activeAlert)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-sky-400" />
                    <span>Inspect Facility Fingerprint</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onNavigateDashboard}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-xs font-semibold text-sky-300 hover:text-white transition-all cursor-pointer ml-auto"
                >
                  <span>View on Main Live Map</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 bg-dark-950 text-center">
            <div className="max-w-md space-y-3">
              <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">Select an Emergency Alert</h3>
              <p className="text-xs text-slate-500">
                Click any incident card on the left list to review detailed telemetry, map perimeter visualization, and AI response SOPs.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
