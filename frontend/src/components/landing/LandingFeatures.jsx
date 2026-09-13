import React, { useState } from 'react';
import { Flame, BrainCircuit, Network, LineChart, Zap, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  {
    id: 'detection',
    icon: Flame,
    color: 'orange',
    accentClass: 'from-orange-500/15 via-red-500/5 to-transparent border-orange-500/30 text-orange-400 hover:border-orange-400',
    iconBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    title: 'Real-Time Hotspot Detection',
    subtitle: 'Orbital Telemetry Feed',
    description:
      'Ingests direct telemetry feeds from NASA FIRMS VIIRS (375m) and MODIS (1km) sensors with spatial precision and sub-minute latency.',
    badge: '375m Spatial Accuracy',
    techSpecs: [
      'Multi-spectral 3.9µm & 11µm channels',
      'Continuous Day/Night orbital swath',
      'Automated baseline subtraction',
    ],
  },
  {
    id: 'ai-analysis',
    icon: BrainCircuit,
    color: 'red',
    accentClass: 'from-red-500/15 via-amber-500/5 to-transparent border-red-500/30 text-red-400 hover:border-red-400',
    iconBg: 'bg-red-500/20 text-red-400 border-red-500/30',
    title: 'AI-Powered Anomaly Analysis',
    subtitle: 'ML Signature Classifier',
    description:
      'Deep learning classification models distinguish true active wildfire fronts from industrial flaring, steel furnaces, and biomass stubble.',
    badge: 'ML Taxonomy Classifier',
    techSpecs: [
      'Confidence scoring (0-100%)',
      'Contextual land-use masking',
      'Facility Thermal Fingerprints',
    ],
  },
  {
    id: 'clustering',
    icon: Network,
    color: 'cyan',
    accentClass: 'from-cyan-500/15 via-blue-500/5 to-transparent border-cyan-500/30 text-cyan-400 hover:border-cyan-400',
    iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    title: 'Geospatial Clustering',
    subtitle: 'Spatial Aggregation Engine',
    description:
      'Aggregates scattered thermal detections into cohesive emergency clusters. Computes active fire perimeter polygons and expansion vectors.',
    badge: 'DBSCAN Spatial Engine',
    techSpecs: [
      'Adaptive distance (eps = 2.5km)',
      'Convex hull geometry generator',
      'Cluster expansion vectors',
    ],
  },
  {
    id: 'trends',
    icon: LineChart,
    color: 'blue',
    accentClass: 'from-blue-500/15 via-purple-500/5 to-transparent border-blue-500/30 text-blue-400 hover:border-blue-400',
    iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    title: 'Historical Trend Tracking',
    subtitle: 'Temporal FRP Regression',
    description:
      'Tracks multi-day temporal evolution of thermal output. Compares thermal load with historical baseline curves to forecast firefront intensity spikes.',
    badge: 'Diurnal Cycle Analysis',
    techSpecs: [
      'Solar diurnal compensation',
      '30-day facility persistence logs',
      'Predictive heat escalation risk',
    ],
  },
];

export function LandingFeatures() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section id="features" className="scroll-mt-16 py-14 sm:py-16 relative overflow-hidden bg-dark-950/80 border-t border-dark-700/50">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-850 border border-sky-500/30 text-xs font-mono text-sky-400">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span>CORE CAPABILITIES</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-sans tracking-tight">
            Orbital Precision.{' '}
            <span className="bg-gradient-to-r from-orange-400 via-red-500 to-amber-300 bg-clip-text text-transparent">
              Actionable Intelligence.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300">
            Engineered from ground-up to transform raw satellite radiance observations into structured, real-time situational awareness.
          </p>
        </div>

        {/* 4 Feature Cards Grid: 4 columns on desktop so all 4 fit side-by-side in viewport! */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;

            return (
              <div
                key={feat.id}
                onMouseEnter={() => setActiveFeature(idx)}
                className={`group relative rounded-2xl p-5 sm:p-6 bg-gradient-to-b ${feat.accentClass} bg-dark-900/90 border backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-dark-950 flex flex-col justify-between`}
              >
                <div>
                  {/* Top Badge & Icon */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-xl border ${feat.iconBg} shadow-md transition-transform group-hover:scale-110`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-dark-800/80 border border-dark-700 text-slate-300">
                      {feat.badge}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-medium block">
                      {feat.subtitle}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-white leading-snug">
                      {feat.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {feat.description}
                  </p>
                </div>

                {/* Technical Specifications */}
                <div className="pt-3 border-t border-dark-700/60 space-y-1.5 bg-dark-950/40 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-3.5 rounded-b-2xl">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide font-semibold">
                    Specs & Architecture
                  </div>
                  <ul className="space-y-1">
                    {feat.techSpecs.map((spec, sIdx) => (
                      <li key={sIdx} className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
