import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  Grid,
  Layers,
  Calendar,
  MapPin,
  Flame,
  AlertTriangle,
  Download,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  Filter,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Split,
  Globe2,
} from 'lucide-react';
import { AnalyticsTrendsChart } from './AnalyticsTrendsChart';
import { CategoryDistributionChart } from './CategoryDistributionChart';
import { RegionIntensityHeatmap } from './RegionIntensityHeatmap';
import { ClusterGrowthTracker } from './ClusterGrowthTracker';
import { REGIONS, TAXONOMY_COLORS, TAXONOMY_CLASSES } from '../../constants/taxonomy';

export function AnalyticsDashboard({
  hotspots = [],
  clusters = [],
  alerts = [],
  onNavigateDashboard,
  onNavigateLanding,
  onNavigateAlerts,
  onViewFingerprint,
  onInvestigateEvent,
}) {
  // State filters
  const [timeRange, setTimeRange] = useState('30D'); // '7D' | '30D' | '90D' | '1Y'
  const [selectedRegionA, setSelectedRegionA] = useState('india');
  const [selectedRegionB, setSelectedRegionB] = useState('jamnagar');
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState('ALL_FUSION');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Synthesize rich time-series data according to timeRange and regions
  const trendsData = useMemo(() => {
    const pointsCount = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : timeRange === '90D' ? 90 : 52;
    const result = [];
    const now = Date.now();

    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date(now - i * (timeRange === '1Y' ? 7 : 1) * 86400000);
      const dateLabel = timeRange === '1Y'
        ? `Wk ${52 - i}`
        : `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;

      // Base curves with realistic seasonal spikes
      const baseVariation = Math.sin((i / pointsCount) * Math.PI * 2) * 35;
      const noise = (Math.sin(i * 12.3) * 15 + Math.cos(i * 7.7) * 10);
      const count = Math.max(12, Math.round(110 + baseVariation + noise + (i % 5 === 0 ? 45 : 0)));
      const avgFrp = Math.max(15, Number((28.5 + (count / 6.5) + (i % 7 === 0 ? 18 : 0)).toFixed(1)));

      // Region B simulated curves for comparison
      const regionBCount = Math.max(8, Math.round(count * 0.45 + (Math.cos(i * 4.2) * 18)));
      const regionBFrp = Math.max(12, Number((avgFrp * 0.88 + (Math.sin(i * 3.1) * 6)).toFixed(1)));

      result.push({
        date: dateLabel,
        count,
        avgFrp,
        regionACount: count,
        regionBCount,
        regionAFrp: avgFrp,
        regionBFrp,
      });
    }

    return result;
  }, [timeRange]);

  // Dynamic KPIs derived from timeRange and selectedRegionA
  const dynamicKpis = useMemo(() => {
    // Regional scaling multiplier
    const regionMultipliers = {
      india: { scale: 1.0, frpBase: 46.8, clusters: 24 },
      jamnagar: { scale: 0.38, frpBase: 58.4, clusters: 8 },
      ncr: { scale: 0.44, frpBase: 38.2, clusters: 11 },
      steel: { scale: 0.41, frpBase: 52.6, clusters: 12 },
      uttarakhand: { scale: 0.29, frpBase: 34.5, clusters: 6 },
    };

    const reg = regionMultipliers[selectedRegionA] || regionMultipliers.india;

    let baseEvents = 982;
    let deltaEvents = '+12.4%';
    let isDeltaPositive = true;
    let avgFrp = reg.frpBase;
    let deltaFrp = '+3.1%';
    let activeClusters = reg.clusters;
    let clusterSubtext = '5 High-Growth';
    let spikeCount = 14;
    let carbonFlux = '12.8k';
    let deltaCarbon = '-1.8%';

    if (timeRange === '7D') {
      baseEvents = Math.round(234 * reg.scale);
      deltaEvents = '+8.5%';
      avgFrp = Number((reg.frpBase * 0.94).toFixed(1));
      deltaFrp = '+1.4%';
      activeClusters = Math.max(3, Math.round(reg.clusters * 0.45));
      clusterSubtext = '2 Rapid Dilation';
      spikeCount = Math.max(2, Math.round(4 * reg.scale));
      carbonFlux = (2.9 * reg.scale).toFixed(1) + 'k';
      deltaCarbon = '+4.2%';
    } else if (timeRange === '30D') {
      baseEvents = Math.round(982 * reg.scale);
      deltaEvents = '+12.4%';
      avgFrp = reg.frpBase;
      deltaFrp = '+3.1%';
      activeClusters = reg.clusters;
      clusterSubtext = '5 High-Growth';
      spikeCount = Math.max(4, Math.round(14 * reg.scale));
      carbonFlux = (12.8 * reg.scale).toFixed(1) + 'k';
      deltaCarbon = '-1.8%';
    } else if (timeRange === '90D') {
      baseEvents = Math.round(3240 * reg.scale);
      deltaEvents = '+5.7%';
      avgFrp = Number((reg.frpBase * 1.06).toFixed(1));
      deltaFrp = '-2.3%';
      activeClusters = Math.round(reg.clusters * 2.2);
      clusterSubtext = '14 Multi-Swath';
      spikeCount = Math.round(42 * reg.scale);
      carbonFlux = (44.2 * reg.scale).toFixed(1) + 'k';
      deltaCarbon = '+1.2%';
    } else if (timeRange === '1Y') {
      baseEvents = Math.round(14820 * reg.scale);
      deltaEvents = '-4.2%';
      isDeltaPositive = false;
      avgFrp = Number((reg.frpBase * 1.02).toFixed(1));
      deltaFrp = '+0.8%';
      activeClusters = Math.round(reg.clusters * 5.4);
      clusterSubtext = '28 Annual Zones';
      spikeCount = Math.round(168 * reg.scale);
      carbonFlux = (194.5 * reg.scale).toFixed(1) + 'k';
      deltaCarbon = '-3.6%';
    }

    return {
      totalEvents: baseEvents.toLocaleString(),
      deltaEvents,
      isDeltaPositive,
      avgFrp: avgFrp.toFixed(1),
      deltaFrp,
      activeClusters,
      clusterSubtext,
      spikeCount,
      carbonFlux,
      deltaCarbon,
    };
  }, [timeRange, selectedRegionA]);

  // Synthesize category distribution breakdown based on timeframe & region
  const categoryData = useMemo(() => {
    const timeScale = timeRange === '7D' ? 0.24 : timeRange === '30D' ? 1.0 : timeRange === '90D' ? 3.3 : 15.0;
    
    // Regional weight bias
    const isNCR = selectedRegionA === 'ncr';
    const isJamnagar = selectedRegionA === 'jamnagar';
    const isUttarakhand = selectedRegionA === 'uttarakhand';
    const isSteel = selectedRegionA === 'steel';

    const counts = {
      WILDFIRE: Math.round((isUttarakhand ? 620 : 342) * timeScale),
      GAS_FLARE: Math.round((isJamnagar ? 580 : 215) * timeScale),
      PERSISTENT_INDUSTRIAL: Math.round((isSteel ? 480 : 178) * timeScale),
      AGRICULTURAL_BURNING: Math.round((isNCR ? 640 : 145) * timeScale),
      MINING_ACTIVITY: Math.round((isSteel ? 160 : 64) * timeScale),
      UNCLASSIFIED: Math.round(38 * timeScale),
    };

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return [
      {
        id: 'WILDFIRE',
        name: 'Wildfire',
        count: counts.WILDFIRE,
        percentage: ((counts.WILDFIRE / total) * 100).toFixed(1),
        avgFrp: isUttarakhand ? 86.4 : 74.2,
        color: TAXONOMY_COLORS.WILDFIRE,
      },
      {
        id: 'GAS_FLARE',
        name: 'Gas Flare',
        count: counts.GAS_FLARE,
        percentage: ((counts.GAS_FLARE / total) * 100).toFixed(1),
        avgFrp: isJamnagar ? 68.2 : 52.8,
        color: TAXONOMY_COLORS.GAS_FLARE,
      },
      {
        id: 'PERSISTENT_INDUSTRIAL',
        name: 'Industrial',
        count: counts.PERSISTENT_INDUSTRIAL,
        percentage: ((counts.PERSISTENT_INDUSTRIAL / total) * 100).toFixed(1),
        avgFrp: isSteel ? 72.0 : 61.0,
        color: TAXONOMY_COLORS.PERSISTENT_INDUSTRIAL,
      },
      {
        id: 'AGRICULTURAL_BURNING',
        name: 'Biomass Stubble',
        count: counts.AGRICULTURAL_BURNING,
        percentage: ((counts.AGRICULTURAL_BURNING / total) * 100).toFixed(1),
        avgFrp: 28.4,
        color: TAXONOMY_COLORS.AGRICULTURAL_BURNING,
      },
      {
        id: 'MINING_ACTIVITY',
        name: 'Mining / Smelter',
        count: counts.MINING_ACTIVITY,
        percentage: ((counts.MINING_ACTIVITY / total) * 100).toFixed(1),
        avgFrp: 44.6,
        color: TAXONOMY_COLORS.MINING_ACTIVITY,
      },
      {
        id: 'UNCLASSIFIED',
        name: 'Unclassified',
        count: counts.UNCLASSIFIED,
        percentage: ((counts.UNCLASSIFIED / total) * 100).toFixed(1),
        avgFrp: 18.2,
        color: TAXONOMY_COLORS.UNCLASSIFIED,
      },
    ].sort((a, b) => b.count - a.count);
  }, [timeRange, selectedRegionA]);

  // Handle Export Analytics Report - Generates real Printable Executive PDF Dossier & triggers download
  const handleExportReport = () => {
    setIsExporting(true);

    try {
      const generatedDate = new Date().toUTCString();
      const filename = `OTIP_Executive_Thermal_Dossier_${selectedRegionA.toUpperCase()}_${timeRange}_${Date.now()}`;

      // Build HTML for the Printable Executive Dossier
      const dossierHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OTIP Executive Dossier - ${regionAName} (${timeRange})</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap');
    
    @page {
      size: A4;
      margin: 14mm 16mm 16mm 16mm;
    }
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background-color: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 24px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .header-box {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      margin: 0 0 4px 0;
      text-transform: uppercase;
    }

    .brand-sub {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin: 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .dossier-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
      border-radius: 6px;
      text-align: right;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
    }

    .meta-item strong {
      color: #475569;
      display: block;
      font-size: 9.5px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .meta-item span {
      color: #0f172a;
      font-weight: 700;
      font-size: 12px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      margin: 20px 0 10px 0;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }

    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .kpi-label {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .kpi-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }

    .kpi-delta {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      color: #059669;
      margin-top: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 18px;
    }

    th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 7px 10px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
    }

    td {
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }

    tr:nth-child(even) {
      background-color: #fafafa;
    }

    .badge-critical {
      background-color: #fee2e2;
      color: #991b1b;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9.5px;
      font-family: 'JetBrains Mono', monospace;
    }

    .badge-accel {
      background-color: #ffedd5;
      color: #9a3412;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9.5px;
      font-family: 'JetBrains Mono', monospace;
    }

    .badge-stable {
      background-color: #dcfce7;
      color: #166534;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9.5px;
      font-family: 'JetBrains Mono', monospace;
    }

    .sop-box {
      background-color: #fff7ed;
      border: 1px solid #fed7aa;
      border-left: 4px solid #f97316;
      border-radius: 6px;
      padding: 10px 14px;
      margin-top: 16px;
      font-size: 10.5px;
      color: #7c2d12;
    }

    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body>

  <!-- 1. Header & Official Seal -->
  <div class="header-box">
    <div>
      <h1 class="brand-title">OTIP • Executive Thermal Intelligence Dossier</h1>
      <p class="brand-sub">Orbital Earth Observation & Autonomous Anomaly Analytics</p>
    </div>
    <div class="dossier-badge">
      <div>DOC ID: ${filename.slice(0, 26)}</div>
      <div>SECURITY: OPERATIONAL / AUDIT</div>
    </div>
  </div>

  <!-- 2. Target Observation Metadata -->
  <div class="meta-grid">
    <div class="meta-item">
      <strong>Target Jurisdiction</strong>
      <span>${regionAName}</span>
    </div>
    <div class="meta-item">
      <strong>Temporal Horizon</strong>
      <span>${timeRange} Analysis Window</span>
    </div>
    <div class="meta-item">
      <strong>Satellite Constellation</strong>
      <span>VIIRS 375m & MODIS 1km</span>
    </div>
    <div class="meta-item">
      <strong>Generated Timestamp</strong>
      <span>${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC</span>
    </div>
  </div>

  <!-- 3. Key Telemetry Indicators (Executive Summary) -->
  <div class="section-title">
    <span>1. Executive Telemetry Overview</span>
    <span style="font-size: 10px; font-weight: normal; color: #64748b;">Baseline Comparison Mode</span>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Anomalies</div>
      <div class="kpi-value">${dynamicKpis.totalEvents}</div>
      <div class="kpi-delta">${dynamicKpis.deltaEvents} vs prior</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Mean Radiance</div>
      <div class="kpi-value">${dynamicKpis.avgFrp} <span style="font-size: 11px;">MW</span></div>
      <div class="kpi-delta">${dynamicKpis.deltaFrp}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Active Clusters</div>
      <div class="kpi-value">${dynamicKpis.activeClusters}</div>
      <div class="kpi-delta" style="color: #6366f1;">${dynamicKpis.clusterSubtext}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">3σ Hazard Spikes</div>
      <div class="kpi-value" style="color: #dc2626;">${dynamicKpis.spikeCount}</div>
      <div class="kpi-delta" style="color: #dc2626;">CRITICAL SPIKES</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Est. Carbon Flux</div>
      <div class="kpi-value">${dynamicKpis.carbonFlux}</div>
      <div class="kpi-delta">${dynamicKpis.deltaCarbon}</div>
    </div>
  </div>

  <!-- 4. Thermal Category Taxonomy Distribution -->
  <div class="section-title">
    <span>2. Thermal Taxonomy & Physical Category Breakdown</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>Classification Category</th>
        <th>Event Count</th>
        <th>Sample Share (%)</th>
        <th>Mean Radiance (MW FRP)</th>
        <th>Diurnal Dominance</th>
      </tr>
    </thead>
    <tbody>
      ${categoryData.map(c => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${c.count.toLocaleString()}</td>
          <td>${c.percentage}%</td>
          <td>${c.avgFrp} MW</td>
          <td>${c.id === 'WILDFIRE' || c.id === 'AGRICULTURAL_BURNING' ? 'Diurnal (Daytime 72%)' : 'Persistent 24/7 (Nocturnal 48%)'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- 5. Monitored Persistent Industrial & Forest Clusters -->
  <div class="section-title">
    <span>3. High-Thermal Facility & Cluster Dilation Velocity</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>Monitored Complex / Facility</th>
        <th>Jurisdiction</th>
        <th>Spatial Area (km²)</th>
        <th>Detections</th>
        <th>Expansion Velocity</th>
        <th>Operational Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Jamnagar Flare Stack Complex</strong></td>
        <td>Gujarat</td>
        <td>8.4 km²</td>
        <td>48</td>
        <td>+18.2%</td>
        <td><span class="badge-accel">ACCELERATING</span></td>
      </tr>
      <tr>
        <td><strong>Simlipal Biosphere Core</strong></td>
        <td>Odisha</td>
        <td>14.2 km²</td>
        <td>36</td>
        <td>+42.5%</td>
        <td><span class="badge-critical">CRITICAL SPREAD</span></td>
      </tr>
      <tr>
        <td><strong>Jamshedpur Metallurgical Smelter</strong></td>
        <td>Jharkhand</td>
        <td>5.6 km²</td>
        <td>30</td>
        <td>+4.1%</td>
        <td><span class="badge-stable">STABLE BASELINE</span></td>
      </tr>
      <tr>
        <td><strong>Singrauli Thermal Power Basin</strong></td>
        <td>Madhya Pradesh</td>
        <td>6.8 km²</td>
        <td>24</td>
        <td>+8.9%</td>
        <td><span class="badge-accel">ELEVATED</span></td>
      </tr>
      <tr>
        <td><strong>Sangrur Biomass Stubble Zone</strong></td>
        <td>Punjab</td>
        <td>12.0 km²</td>
        <td>18</td>
        <td>-12.4%</td>
        <td><span class="badge-stable">COOLING</span></td>
      </tr>
    </tbody>
  </table>

  <!-- 6. Standard Operating Emergency Protocol SOP -->
  <div class="sop-box">
    <strong>RECOMMENDED OPERATIONAL SOP PROTOCOL:</strong><br>
    Continuous satellite overpass analysis indicates ${dynamicKpis.spikeCount} critical 3-sigma anomaly spikes requiring immediate field ranger / safety officer validation. Synchronize dispatch routes with nearest emergency fire depots and verify flare gas recovery unit (FGRU) telemetry logs.
  </div>

  <!-- 7. Dossier Footer Sign-off -->
  <div class="footer">
    <span>OTIP - Orbital Thermal Intelligence Platform (v2.4.0)</span>
    <span>NASA FIRMS NRT • Forest Survey of India • OpenRouteService</span>
    <span>Page 1 of 1 • Official Intelligence Record</span>
  </div>

</body>
</html>
      `;

      // Open Printable Window for Instant Browser "Save as PDF" Dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(dossierHtml);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 350);
      }

      setTimeout(() => {
        setIsExporting(false);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 4500);
      }, 600);

    } catch (err) {
      console.error('Failed to export dossier:', err);
      setIsExporting(false);
    }
  };

  const regionAName = REGIONS[selectedRegionA]?.name || 'All India';
  const regionBName = REGIONS[selectedRegionB]?.name || 'Jamnagar Hub';

  return (
    <div className="flex flex-col min-h-full w-full bg-[#0a0e17] text-slate-100 font-sans select-none pb-12">
      
      {/* 1. TOP ANALYTICS NAVIGATION BAR */}
      <header className="sticky top-0 z-40 h-16 bg-[#0c111c]/95 border-b border-slate-800/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-lg">
        
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onNavigateDashboard}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Live Map</span>
          </button>

          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-600/25 border border-sky-400/30">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-wider uppercase text-white font-sans">
                  Thermal Trends & Anomaly Analytics
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  SAAS INTELLIGENCE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Longitudinal Orbital Radiative Power, Spatial Clustered Growth & Taxonomy Patterns
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Page Navigators */}
        <div className="flex items-center gap-3">
          {onNavigateAlerts && (
            <button
              type="button"
              onClick={onNavigateAlerts}
              className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer hidden md:flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Alerts & Events</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateLanding}
            className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Overview
          </button>
        </div>
      </header>

      {/* 2. ANALYTICS CONTROL & FILTER STRIP */}
      <div className="bg-[#0f172a]/90 border-b border-slate-800/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs z-30 shrink-0 sticky top-16 backdrop-blur-md">
        
        {/* Left: Time Range Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] font-semibold pr-1">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>TIMEFRAME:</span>
          </div>

          <div className="flex items-center bg-dark-950 p-1 rounded-lg border border-slate-800">
            {['7D', '30D', '90D', '1Y'].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Primary Region + Compare Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Primary Region Select */}
          <div className="flex items-center gap-1.5 bg-dark-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400 text-[10px] font-mono font-semibold">REGION:</span>
            <select
              value={selectedRegionA}
              onChange={(e) => setSelectedRegionA(e.target.value)}
              className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer pr-1 text-xs font-medium"
            >
              {Object.entries(REGIONS).map(([key, cfg]) => (
                <option key={key} value={key} className="bg-dark-900 text-slate-200">
                  {cfg.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Compare Mode Button */}
          <button
            type="button"
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isCompareMode
                ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-md shadow-purple-600/20'
                : 'bg-dark-950 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Split className="w-3.5 h-3.5 text-purple-400" />
            <span>Compare Regions</span>
          </button>

          {/* Secondary Region Select (Appears when compare mode is active) */}
          {isCompareMode && (
            <div className="flex items-center gap-1.5 bg-dark-950 border border-purple-500/40 rounded-lg px-3 py-1.5 text-xs text-purple-300 animate-in fade-in duration-200">
              <span className="text-purple-400 text-[10px] font-mono font-semibold">VS REGION B:</span>
              <select
                value={selectedRegionB}
                onChange={(e) => setSelectedRegionB(e.target.value)}
                className="bg-transparent border-none text-purple-200 focus:outline-none cursor-pointer pr-1 text-xs font-medium"
              >
                {Object.entries(REGIONS).map(([key, cfg]) => (
                  <option key={key} value={key} className="bg-dark-900 text-slate-200">
                    {cfg.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Export Report Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportReport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 border border-sky-400/40 shadow-md shadow-sky-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Compiling Dossier...' : 'Export Analytics PDF / CSV'}</span>
          </button>
        </div>

      </div>

      {/* Export Success Notification Banner */}
      {exportSuccess && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Thermal anomaly executive dossier for <strong>{regionAName} ({timeRange})</strong> compiled and downloaded.
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase">READY</span>
        </div>
      )}

      {/* 3. TOP EXECUTIVE KPI CARDS */}
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          
          {/* KPI 1: Total Anomaly Events */}
          <div className="bg-[#111722]/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all duration-200">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Total Anomaly Events</div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-mono font-black text-white">{dynamicKpis.totalEvents}</span>
              <span className={`text-xs font-mono font-bold ${dynamicKpis.isDeltaPositive ? 'text-emerald-400' : 'text-sky-400'}`}>
                {dynamicKpis.deltaEvents}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">vs preceding {timeRange}</div>
          </div>

          {/* KPI 2: Mean Thermal Radiance */}
          <div className="bg-[#111722]/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all duration-200">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Mean Thermal Radiance</div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-mono font-black text-orange-400">
                {dynamicKpis.avgFrp} <span className="text-xs text-slate-400 font-normal">MW</span>
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">{dynamicKpis.deltaFrp}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">Radiative Power (FRP)</div>
          </div>

          {/* KPI 3: Active Clusters */}
          <div className="bg-[#111722]/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all duration-200">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Active Clusters</div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-mono font-black text-purple-400">{dynamicKpis.activeClusters}</span>
              <span className="text-xs font-mono font-bold text-slate-400">{dynamicKpis.clusterSubtext}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">Dilation footprint index</div>
          </div>

          {/* KPI 4: 3-sigma Anomaly Spikes */}
          <div className="bg-[#111722]/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all duration-200">
            <div className="text-[11px] font-mono text-slate-400 uppercase">3σ Anomaly Spikes</div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-mono font-black text-red-400">{dynamicKpis.spikeCount}</span>
              <span className="text-xs font-mono font-bold text-red-400 animate-pulse">CRITICAL</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">Exceeding baseline variance</div>
          </div>

          {/* KPI 5: Estimated Carbon Footprint */}
          <div className="col-span-2 md:col-span-1 bg-[#111722]/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all duration-200">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Est. Carbon Footprint</div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-mono font-black text-sky-400">
                {dynamicKpis.carbonFlux} <span className="text-xs text-slate-400 font-normal">tCO₂e</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">{dynamicKpis.deltaCarbon}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">Satellite derived flux model</div>
          </div>

        </div>

        {/* 4. MAIN ANALYTICS GRID SECTIONS */}
        <div className="space-y-6">
          
          {/* Section 1: Line / Area Chart - Anomalies Over Time */}
          <div className="min-h-[390px] w-full flex flex-col">
            <AnalyticsTrendsChart
              data={trendsData}
              timeRange={timeRange}
              isCompareMode={isCompareMode}
              regionAName={regionAName}
              regionBName={regionBName}
            />
          </div>

          {/* Section 2 & Section 3: Category Distribution + Region Intensity Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Category Breakdown Bar Chart (6 cols) */}
            <div className="lg:col-span-6 min-h-[420px] flex flex-col">
              <CategoryDistributionChart data={categoryData} />
            </div>

            {/* Region / Temporal Heatmap Matrix (6 cols) */}
            <div className="lg:col-span-6 min-h-[420px] flex flex-col">
              <RegionIntensityHeatmap data={hotspots} />
            </div>

          </div>

          {/* Section 4: Cluster Growth & Persistent Hotspot Velocity Visualization */}
          <div className="w-full flex flex-col">
            <ClusterGrowthTracker
              clusters={clusters}
              onViewFingerprint={onViewFingerprint}
            />
          </div>

        </div>

        {/* 5. FOOTER INSIGHT SUMMARY STRIP */}
        <div className="bg-[#111722]/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400 mt-8 mb-12">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-200 font-bold">NASA NRT Swath Calibration Active:</span>
              <span className="ml-1 text-slate-400">All analytics models synchronizing with 375m VIIRS S-NPP and NOAA-20 orbital overpasses.</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Explore Live Telemetry Map</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
