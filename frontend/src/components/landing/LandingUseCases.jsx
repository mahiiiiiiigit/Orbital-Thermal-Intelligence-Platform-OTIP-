import React, { useState } from 'react';
import { ShieldAlert, Trees, Factory, Landmark, MapPin, CheckCircle2 } from 'lucide-react';

const USE_CASES = [
  {
    id: 'disaster',
    title: 'Disaster Management',
    subtitle: 'Wildfire Containment',
    icon: ShieldAlert,
    theme: 'orange',
    accentBorder: 'border-orange-500/30 hover:border-orange-400',
    tagBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    description:
      'Provides emergency operation centers with real-time active fire line tracking, FRP progression, and evacuation routing avoiding hazards.',
    highlights: [
      'Active firefront perimeter propagation',
      'AI evacuation corridors bypassing fires',
      'Instant SMS/Telegram field dispatch',
    ],
    metricValue: '85% Faster',
    metricLabel: 'Incident Response Time',
    mockLocation: 'Simlipal Reserve',
    mockTelemetry: 'FRP 342 MW • High Risk',
  },
  {
    id: 'environmental',
    title: 'Environmental Monitoring',
    subtitle: 'Deforestation & Peatland',
    icon: Trees,
    theme: 'emerald',
    accentBorder: 'border-emerald-500/30 hover:border-emerald-400',
    tagBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description:
      'Detects illegal slash-and-burn agriculture, peatland smoldering, and unauthorized forest clearing in protected ecological sanctuaries.',
    highlights: [
      'Sub-km detection in dense canopies',
      'Smoldering hotspot persistence',
      'Biomass carbon emission estimation',
    ],
    metricValue: '100% Audit',
    metricLabel: 'Sanctuary Land Coverage',
    mockLocation: 'Sundarbans Biosphere',
    mockTelemetry: 'Biomass Burn Detected',
  },
  {
    id: 'industrial',
    title: 'Industrial Surveillance',
    subtitle: 'Refinery & Flare Auditing',
    icon: Factory,
    theme: 'cyan',
    accentBorder: 'border-cyan-500/30 hover:border-cyan-400',
    tagBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    description:
      'Continuous thermal baselines for petrochemical refineries, steel blast furnaces, and power plants to monitor flaring and unannounced heat leaks.',
    highlights: [
      'Facility Thermal Fingerprints',
      'Flare gas volume anomaly detection',
      'ESG & carbon compliance audit trails',
    ],
    metricValue: '< 0.5 km',
    metricLabel: 'Pinpoint Spatial Accuracy',
    mockLocation: 'Jamnagar Complex',
    mockTelemetry: 'Routine Gas Flaring',
  },
  {
    id: 'government',
    title: 'Government & Policy',
    subtitle: 'National Operations',
    icon: Landmark,
    theme: 'blue',
    accentBorder: 'border-blue-500/30 hover:border-blue-400',
    tagBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description:
      'Empowers spatial agencies and ministries with macro-intelligence dashboards for cross-border smoke haze tracking and treaty verification.',
    highlights: [
      'Daily sovereign thermal density maps',
      'Cross-border smoke haze forecasting',
      'Integrated FSI FFDR risk overlays',
    ],
    metricValue: '3.2M sq km',
    metricLabel: 'Territorial Scan Coverage',
    mockLocation: 'National Ops Center',
    mockTelemetry: 'Danger Index: MODERATE',
  },
];

export function LandingUseCases() {
  const [selectedCase, setSelectedCase] = useState(0);

  return (
    <section id="use-cases" className="scroll-mt-16 py-14 sm:py-16 relative overflow-hidden bg-dark-950/80 border-t border-dark-700/60">
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-850 border border-emerald-500/30 text-xs font-mono text-emerald-400">
            <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>OPERATIONAL DOMAINS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-sans tracking-tight">
            Built for Mission-Critical{' '}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
              Thermal Operations
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300">
            From frontline wildland firefighters to national environmental regulators, OTIP provides purpose-built situational intelligence.
          </p>
        </div>

        {/* 4 Cards Grid in 4 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {USE_CASES.map((uc, idx) => {
            const Icon = uc.icon;
            const isSelected = selectedCase === idx;

            return (
              <div
                key={uc.id}
                onClick={() => setSelectedCase(idx)}
                className={`cursor-pointer rounded-2xl p-5 sm:p-6 bg-dark-900/90 border transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between ${
                  isSelected
                    ? `${uc.accentBorder} shadow-xl shadow-dark-950/80 bg-gradient-to-br from-dark-850 to-dark-900`
                    : 'border-dark-700/80 hover:border-dark-600'
                }`}
              >
                <div>
                  {/* Top Row: Icon, Domain, Metric */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-xl border ${uc.tagBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-white">{uc.metricValue}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{uc.metricLabel}</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      {uc.subtitle}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {uc.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {uc.description}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-1.5 mb-4">
                    {uc.highlights.map((hl, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-1.5 text-[11px] text-slate-300 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" />
                        <span className="leading-tight">{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Telemetry Scenario Preview Pill */}
                <div className="pt-3 border-t border-dark-700/60 flex items-center justify-between text-[10px] font-mono bg-dark-950/60 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-3 rounded-b-2xl">
                  <div className="flex items-center gap-1 text-slate-400 truncate">
                    <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                    <span className="truncate">{uc.mockLocation}</span>
                  </div>
                  <div className="text-orange-400 font-semibold shrink-0 ml-1">
                    {uc.mockTelemetry}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
