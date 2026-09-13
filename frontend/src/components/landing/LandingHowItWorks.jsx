import React from 'react';
import { Satellite, Cpu, ShieldAlert, MonitorCheck, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Satellite Ingestion',
    subtitle: 'Orbital Telemetry Feed',
    icon: Satellite,
    color: 'sky',
    badge: 'NASA FIRMS NRT',
    desc: 'Automated retrieval of active radiance swaths from VIIRS (NOAA-20/21 & Suomi-NPP) and MODIS (Terra & Aqua) orbital passes.',
    details: ['3.9µm Infrared Swath', 'Sub-pixel Radiance (MW)', 'Global 12-hr Revisit'],
  },
  {
    step: '02',
    title: 'Processing & Clustering',
    subtitle: 'Spatial Aggregation',
    icon: Cpu,
    color: 'cyan',
    badge: 'DBSCAN + Spatial Index',
    desc: 'Reprojection into WGS84 coordinates, spatial R-tree indexing, and dynamic density clustering to group discrete fire pixels into incident fronts.',
    details: ['Noise & Cloud Filter', 'Convex Hull Perimeter', 'Cluster Center of Mass'],
  },
  {
    step: '03',
    title: 'Anomaly Detection',
    subtitle: 'AI Classification Engine',
    icon: ShieldAlert,
    color: 'orange',
    badge: 'ML Taxonomy Classifier',
    desc: 'Thermal signature comparison against facility baselines, distinguishing active wildfires from offshore gas flares, industrial boilers, and stubble.',
    details: ['FRP Intensity Index', 'Land Use Cross-Ref', 'Persistence History'],
  },
  {
    step: '04',
    title: 'Visualization & Alerts',
    subtitle: 'Operational Dispatch',
    icon: MonitorCheck,
    color: 'red',
    badge: 'WebGL GIS & Dispatch',
    desc: 'Real-time rendering of high-density heatmaps, instantaneous emergency dispatch notifications, and safety evacuation routing.',
    details: ['Leaflet WebGL Heatmap', 'Telegram & SMS Dispatch', 'Dynamic Safety Corridors'],
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 py-20 lg:py-24 relative overflow-hidden bg-dark-900 border-t border-dark-700/60">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-space-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-850 border border-orange-500/30 text-xs font-mono text-orange-400">
            <Cpu className="w-3.5 h-3.5 text-orange-400" />
            <span>END-TO-END PIPELINE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-sans tracking-tight">
            How OTIP Works:{' '}
            <span className="bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              From Orbit to Action
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300">
            A high-throughput, fault-tolerant ingestion pipeline that processes millions of orbital thermal detections into sub-second tactical alerts.
          </p>
        </div>

        {/* Horizontal Pipeline Diagram (Desktop: 4 columns connected, Mobile: stacked with flow) */}
        <div className="relative">
          
          {/* Connector Line for Desktop */}
          <div className="hidden lg:block absolute top-1/3 left-12 right-12 h-0.5 bg-gradient-to-r from-sky-500/50 via-cyan-500/50 to-red-500/50 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="relative flex flex-col bg-dark-850/90 border border-dark-700/80 hover:border-slate-500/60 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-2 group"
                >
                  {/* Top Step Number Badge & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-white shadow-inner group-hover:border-sky-400/50 transition-colors">
                      <Icon className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
                    </div>

                    <span className="text-2xl font-mono font-black text-slate-500 group-hover:text-sky-400 transition-colors">
                      {s.step}
                    </span>
                  </div>

                  {/* Step Title & Subtitle */}
                  <div className="space-y-1 mb-3">
                    <span className="text-[11px] font-mono uppercase text-sky-400 font-semibold tracking-wider">
                      {s.subtitle}
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                      {s.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-5 flex-1">
                    {s.desc}
                  </p>

                  {/* Bullet Spec Checklist */}
                  <div className="pt-4 border-t border-dark-700/60 space-y-1.5 bg-dark-900/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                    <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1">
                      Key Milestone
                    </div>
                    {s.details.map((item, dIdx) => (
                      <div key={dIdx} className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Next Step Arrow (Desktop horizontal flow) */}
                  {idx < STEPS.length - 1 && (
                    <div className="hidden lg:flex absolute -right-3.5 top-1/3 -translate-y-1/2 w-7 h-7 rounded-full bg-dark-800 border border-dark-600 text-sky-400 items-center justify-center shadow-md z-20">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

        {/* Real-Time Throughput Benchmark Banner */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-dark-850 via-dark-800 to-dark-850 border border-dark-700 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div>
              <div className="text-base font-bold text-white">Continuous Swath Synchronization Active</div>
              <div className="text-xs text-slate-400 font-mono">
                Polling NASA LANCE/FIRMS endpoints every 300s • VIIRS SNPP, NOAA-20, NOAA-21, Aqua, Terra
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-dark-900 border border-dark-700 text-center">
              <div className="text-xs font-mono text-slate-400">Stream Status</div>
              <div className="text-sm font-mono font-bold text-emerald-400">NOMINAL</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-dark-900 border border-dark-700 text-center">
              <div className="text-xs font-mono text-slate-400">E2E Delay</div>
              <div className="text-sm font-mono font-bold text-sky-400">18.4 ms</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
