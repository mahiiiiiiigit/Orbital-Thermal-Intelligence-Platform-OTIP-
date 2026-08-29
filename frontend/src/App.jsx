import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { TimelineSlider } from './components/TimelineSlider';
import { ThermalLegend } from './components/ThermalLegend';
import { SafetyLegend } from './components/SafetyLegend';
import { ResponsePanel } from './components/ResponsePanel';
import {
  fetchHotspots,
  fetchClusters,
  fetchAlerts,
  fetchFsiForestFires,
  fetchFsiFfdrGrid,
  fetchSafetyResources,
  fetchNearestSafetyResources,
  fetchEmergencyRoute,
} from './services/api';
import { REGIONS } from './constants/taxonomy';
import { AlertTriangle, Trees } from 'lucide-react';

export function App() {
  const [dataSource, setDataSource] = useState('firms'); // 'firms' | 'fsi'
  const [mode, setMode] = useState('auto'); // 'auto' (Live NASA) | 'demo'
  const [selectedRegion, setSelectedRegion] = useState('india');
  const [selectedSensor, setSelectedSensor] = useState('VIIRS_SNPP_NRT');
  const [mapMode, setMapMode] = useState(() => {
    return localStorage.getItem('thermalwatch_map_mode') || 'hybrid';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('thermalwatch_theme') || 'dark';
  });

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [allHotspots, setAllHotspots] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [ffdrGrid, setFfdrGrid] = useState(null);
  const [safetyResources, setSafetyResources] = useState([]);
  const [showSafetyResources, setShowSafetyResources] = useState(true);

  const [timelineIndex, setTimelineIndex] = useState(0);
  const [filterClass, setFilterClass] = useState('all');
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);

  // Response Panel State
  const [responsePanelHotspot, setResponsePanelHotspot] = useState(null);
  const [nearestTriageData, setNearestTriageData] = useState(null);
  const [loadingTriage, setLoadingTriage] = useState(false);

  // Sync theme with document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('thermalwatch_theme', theme);
  }, [theme]);

  // Toggle Theme
  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Save map mode to localStorage
  const handleSelectMapMode = useCallback((newMode) => {
    setMapMode(newMode);
    localStorage.setItem('thermalwatch_map_mode', newMode);
  }, []);

  // Toggle Safety Resources Layer
  const handleToggleSafetyResources = useCallback(() => {
    setShowSafetyResources((prev) => !prev);
  }, []);

  // Load FSI FFDR Grid and Safety Infrastructure on startup
  useEffect(() => {
    fetchFsiFfdrGrid()
      .then((grid) => setFfdrGrid(grid))
      .catch((err) => console.warn('Could not load FFDR grid:', err));

    fetchSafetyResources()
      .then((data) => setSafetyResources(data.resources || []))
      .catch((err) => console.warn('Could not load safety resources:', err));
  }, []);

  // Fetch telemetry from backend
  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    const region = REGIONS[selectedRegion] || REGIONS.india;

    try {
      if (dataSource === 'fsi') {
        // Load FSI Forest Fire Intelligence (Demo / Fallback Layer)
        const fsiRes = await fetchFsiForestFires({ mode: 'demo' });
        const raw = fsiRes.hotspots || [];
        const sorted = raw.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setAllHotspots(sorted);
        setClusters(fsiRes.clusters || []);
        setAlerts(fsiRes.alerts || []);
        setNotice(fsiRes.notice || 'DEMO DATA — Simulated Forest Survey of India (FSI) Layer');

        if (sorted.length > 0) {
          setTimelineIndex(sorted.length - 1);
          setSelectedHotspot(sorted[sorted.length - 1]);
        } else {
          setSelectedHotspot(null);
        }
        setSelectedCluster(null);
      } else {
        // Load NASA FIRMS Stream (Live or Demo as toggled)
        const [hotspotRes, clusterRes, alertRes] = await Promise.all([
          fetchHotspots({
            mode,
            source: selectedSensor,
            days: 3,
            bbox: region.bbox,
            forceRefresh,
          }),
          fetchClusters({ mode, source: selectedSensor }),
          fetchAlerts({ mode, source: selectedSensor }),
        ]);

        const raw = hotspotRes.hotspots || [];
        const sorted = raw.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setAllHotspots(sorted);
        setClusters(clusterRes.clusters || []);
        setAlerts(alertRes.alerts || []);
        setNotice(hotspotRes.notice || `Loaded ${sorted.length} hotspots (${region.name}).`);

        if (sorted.length > 0) {
          setTimelineIndex(sorted.length - 1);
          setSelectedHotspot(sorted[sorted.length - 1]);
        } else {
          setSelectedHotspot(null);
        }

        if (clusterRes.clusters && clusterRes.clusters.length > 0) {
          setSelectedCluster(clusterRes.clusters[0]);
        } else {
          setSelectedCluster(null);
        }
      }
    } catch (err) {
      console.error('Failed to load telemetry:', err);
      setNotice(`Error connecting to satellite feed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [dataSource, mode, selectedRegion, selectedSensor]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Response Triage Panel
  const handleOpenResponsePanel = useCallback(async (hotspot) => {
    if (!hotspot) return;
    setResponsePanelHotspot(hotspot);
    setLoadingTriage(true);
    try {
      const triage = await fetchNearestSafetyResources({
        lat: hotspot.latitude,
        lon: hotspot.longitude,
        classification: hotspot.classification,
        frp: hotspot.frp,
        riskScore: hotspot.risk_score || 50.0,
      });
      setNearestTriageData(triage);
    } catch (err) {
      console.error('Failed to load triage data:', err);
    } finally {
      setLoadingTriage(false);
    }
  }, []);

  // Dispatch Route from selected safety resource to target hotspot
  const handleGetResourceRoute = useCallback(async (startLat, startLon, destLat, destLon, resourceName) => {
    try {
      const data = await fetchEmergencyRoute(destLat, destLon, startLat, startLon);
      if (resourceName && data.origin_depot) {
        data.origin_depot.name = resourceName;
      }
      setActiveRoute(data);
    } catch (err) {
      console.error('Failed to calculate resource dispatch route:', err);
    }
  }, []);

  // Derive unique timeline dates
  const timelineDates = useMemo(() => {
    const dates = new Set();
    allHotspots.forEach((h) => {
      if (h.timestamp) dates.add(h.timestamp.slice(0, 10));
    });
    return Array.from(dates).sort();
  }, [allHotspots]);

  const activeDate = timelineDates[timelineIndex] || (timelineDates.length > 0 ? timelineDates[timelineDates.length - 1] : null);

  // Filter visible hotspots based on timeline and classification filter
  const visibleHotspots = useMemo(() => {
    if (!activeDate) return [];
    return allHotspots.filter((h) => {
      const dateMatch = h.timestamp?.slice(0, 10) <= activeDate;
      if (!dateMatch) return false;
      if (filterClass === 'all') return true;
      return h.classification === filterClass;
    });
  }, [allHotspots, activeDate, filterClass]);

  // Telemetry KPIs
  const stats = useMemo(() => {
    const totalHotspots = allHotspots.length;
    const totalClusters = clusters.length;
    const totalAlerts = alerts.length;
    const avgFrp = totalHotspots > 0
      ? allHotspots.reduce((sum, h) => sum + (Number(h.frp) || 0), 0) / totalHotspots
      : 0;

    return { totalHotspots, totalClusters, totalAlerts, avgFrp };
  }, [allHotspots, clusters, alerts]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 dark:bg-dark-900 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <Navbar
        mode={mode}
        onToggleMode={(newMode) => setMode(newMode)}
        dataSource={dataSource}
        onToggleDataSource={(src) => setDataSource(src)}
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
        selectedSensor={selectedSensor}
        onSelectSensor={setSelectedSensor}
        mapMode={mapMode}
        onSelectMapMode={handleSelectMapMode}
        showSafetyResources={showSafetyResources}
        onToggleSafetyResources={handleToggleSafetyResources}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onRefresh={() => loadData(true)}
        loading={loading}
        stats={stats}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Analytics Command Center */}
        <Sidebar
          hotspots={allHotspots}
          clusters={clusters}
          alerts={alerts}
          selectedHotspot={selectedHotspot}
          selectedCluster={selectedCluster}
          activeRoute={activeRoute}
          onSetRoute={setActiveRoute}
          onOpenResponsePanel={handleOpenResponsePanel}
          mode={mode}
          notice={notice}
          filterClass={filterClass}
          onSelectFilterClass={setFilterClass}
          activeDate={activeDate}
          stats={stats}
        />

        {/* Center / Main GIS Map Area */}
        <main className="flex-1 relative h-full w-full bg-slate-200 dark:bg-dark-950 overflow-hidden transition-colors duration-200">
          {/* Leaflet Map */}
          <MapView
            hotspots={visibleHotspots}
            clusters={clusters}
            alerts={alerts}
            ffdrGrid={ffdrGrid}
            safetyResources={safetyResources}
            showSafetyResources={showSafetyResources}
            mapMode={mapMode}
            theme={theme}
            regionConfig={REGIONS[selectedRegion]}
            selectedHotspot={selectedHotspot}
            activeRoute={activeRoute}
            onSelectHotspot={(h) => setSelectedHotspot(h)}
            onSelectCluster={(c) => setSelectedCluster(c)}
          />

          {/* Floating FSI Demo Data Banner */}
          {dataSource === 'fsi' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500/95 text-slate-950 font-bold text-xs py-1.5 px-4 rounded-xl shadow-2xl border border-amber-300 backdrop-blur-md flex items-center gap-2">
              <Trees className="w-4 h-4 text-slate-950" />
              <span>DEMO DATA — Simulated Forest Survey of India (FSI) Wildfire Intelligence</span>
            </div>
          )}

          {/* Floating Emergency Alert Banner (for Critical Spikes) */}
          {alerts.length > 0 && dataSource !== 'fsi' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-600/95 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-2xl border border-red-400/50 backdrop-blur-md flex items-center gap-2 animate-bounce">
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>
                CRITICAL ALERT: {alerts[0].facility_name} — {alerts[0].current_frp} MW Radiance (Z-Score: +{alerts[0].z_score}σ)
              </span>
            </div>
          )}

          {/* Floating Intensity Legend (Thermal, Hybrid & Forest Risk modes) */}
          {mapMode !== 'standard' && (
            <div className="absolute bottom-6 right-6 z-[1000]">
              <ThermalLegend mode={mapMode} />
            </div>
          )}

          {/* Floating Safety Infrastructure Legend (When enabled) */}
          {showSafetyResources && (
            <div className="absolute top-4 right-4 z-[1000]">
              <SafetyLegend />
            </div>
          )}

          {/* Floating Timeline Scrubbing Controls */}
          {timelineDates.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
              <TimelineSlider
                dates={timelineDates}
                currentIndex={timelineIndex}
                onChangeIndex={(idx) => setTimelineIndex(idx)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Emergency Incident Response Modal / Panel */}
      <ResponsePanel
        isOpen={Boolean(responsePanelHotspot)}
        onClose={() => setResponsePanelHotspot(null)}
        hotspot={responsePanelHotspot}
        nearestData={nearestTriageData}
        loading={loadingTriage}
        onGetRoute={handleGetResourceRoute}
      />
    </div>
  );
}

export default App;
