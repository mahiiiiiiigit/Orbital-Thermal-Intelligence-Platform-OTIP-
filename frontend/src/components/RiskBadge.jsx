import React from 'react';

export function RiskBadge({ level = 'medium' }) {
  const normalized = String(level).toLowerCase();
  
  const styles = {
    critical: 'bg-red-500/20 text-red-500 dark:text-red-400 border-red-500/40 animate-pulse',
    high: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40',
    medium: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
    low: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
  };

  const activeStyle = styles[normalized] || styles.medium;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${activeStyle}`}>
      {level}
    </span>
  );
}

export function ConfidenceBadge({ level = 'HIGH' }) {
  const normalized = String(level).toUpperCase();

  const styles = {
    HIGH: 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40',
    MEDIUM: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
    LOW: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/40',
  };

  const activeStyle = styles[normalized] || styles.HIGH;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${activeStyle}`}>
      {normalized} CONF
    </span>
  );
}

export function DangerBadge({ level = 'MODERATE' }) {
  const normalized = String(level).toUpperCase();

  const styles = {
    EXTREME: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/50 animate-pulse',
    HIGH: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40',
    MODERATE: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
    LOW: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
  };

  const activeStyle = styles[normalized] || styles.MODERATE;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${activeStyle}`}>
      FSI: {normalized} RISK
    </span>
  );
}
