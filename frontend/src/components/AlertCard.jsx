import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { RiskBadge } from './RiskBadge';

export function AlertCard({ alerts = [] }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/80 rounded-xl p-3 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div>
          <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200">No Critical 3σ Spikes</h4>
          <p className="text-[10px] text-slate-500">All observed thermal sources operating within normal statistical variance.</p>
        </div>
      </div>
    );
  }

  const primaryAlert = alerts[0];
  const riskScore = primaryAlert.risk_score != null ? primaryAlert.risk_score : 90.0;
  const riskLevel = primaryAlert.risk_level ? String(primaryAlert.risk_level).toUpperCase() : 'CRITICAL';

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-2 shadow-sm transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0 text-red-400 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 bg-red-500/20 px-1 py-0.2 rounded border border-red-500/30">
                {primaryAlert.severity || 'CRITICAL'} ANOMALY
              </span>
              {primaryAlert.z_score && (
                <span className="text-[10px] font-mono text-red-300">+{primaryAlert.z_score}σ</span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {primaryAlert.facility_name || 'Industrial Thermal Spike'}
            </h4>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-mono font-bold text-red-400">{riskScore} / 100</span>
          <RiskBadge level={riskLevel} />
        </div>
      </div>

      <div className="text-[10.5px] text-slate-700 dark:text-slate-300 leading-snug bg-white/70 dark:bg-dark-900/60 rounded-lg p-2 border border-red-500/20">
        <p className="font-semibold text-red-600 dark:text-red-300">{primaryAlert.message}</p>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
          <strong>Observed:</strong> {primaryAlert.current_frp} MW (Baseline: {primaryAlert.baseline_mean_frp} MW)
        </p>
      </div>
    </div>
  );
}
