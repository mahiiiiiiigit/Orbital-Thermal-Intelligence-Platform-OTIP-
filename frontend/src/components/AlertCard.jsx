import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export function AlertCard({ alerts = [] }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-dark-850/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-200">No Critical 3σ Spikes</h4>
          <p className="text-[11px] text-slate-400">All observed thermal sources operating within normal statistical variance.</p>
        </div>
      </div>
    );
  }

  const primaryAlert = alerts[0];

  return (
    <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3.5 space-y-2.5 shadow-lg shadow-red-950/30 backdrop-blur-md">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center flex-shrink-0 text-red-400 animate-pulse">
          <AlertTriangle className="w-4.5 h-4.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/40">
              {primaryAlert.severity || 'CRITICAL'} ANOMALY
            </span>
            {primaryAlert.z_score && (
              <span className="text-[10px] font-mono text-red-300">Z-Score: +{primaryAlert.z_score}σ</span>
            )}
          </div>
          <h4 className="text-xs font-bold text-slate-100 mt-1">
            {primaryAlert.facility_name || 'Industrial Thermal Spike'}
          </h4>
        </div>
      </div>

      <div className="text-[11px] text-slate-300 leading-relaxed bg-red-950/60 rounded-lg p-2 border border-red-500/20">
        <p className="font-semibold text-red-300">{primaryAlert.message}</p>
        <p className="text-slate-400 mt-1">
          <strong>Observed:</strong> {primaryAlert.current_frp} MW (Baseline Mean: {primaryAlert.baseline_mean_frp} MW)
        </p>
      </div>

      {primaryAlert.recommendation && (
        <div className="text-[11px] text-amber-300 flex items-start gap-1">
          <span className="font-bold">Action:</span>
          <span>{primaryAlert.recommendation}</span>
        </div>
      )}
    </div>
  );
}
