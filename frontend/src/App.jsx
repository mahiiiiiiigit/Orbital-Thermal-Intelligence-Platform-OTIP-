import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { TimelineSlider } from './components/TimelineSlider';
import { ThermalLegend } from './components/ThermalLegend';
import {
  fetchHotspots,
  fetchClusters,
  fetchAlerts,
  fetchFsiForestFires,
  fetchFsiFfdrGrid,
} from './services/api';
import { REGIONS } from './constants/taxonomy';
import { FacilityFingerprintModal } from './components/FacilityFingerprintModal';
import { EventInvestigationModal } from './components/EventInvestigationModal';

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

  // Temporary Safety Resources
  const [temporarySafetyResources, setTemporarySafetyResources] = useState([]);

  const [timelineIndex, setTimelineIndex] = useState(0);
  const [filterClass, setFilterClass] = useState('all');
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [selectedFingerprintFacility, setSelectedFingerprintFacility] = useState(null);
  const [selectedInvestigationEvent, setSelectedInvestigationEvent] = useState(null);

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

  // Clear temporary safety resources and route when selecting a different hotspot or cluster
  const handleSelectHotspot = useCallback((hotspot) => {
    setSelectedHotspot(hotspot);
    setTemporarySafetyResources([]);
    setActiveRoute(null);
  }, []);

  const handleSelectCluster = useCallback((cluster) => {
    setSelectedCluster(cluster);
    setTemporarySafetyResources([]);
    setActiveRoute(null);
  }, []);

  // Load FSI FFDR Grid on startup
  useEffect(() => {
    fetchFsiFfdrGrid()
      .then((grid) => setFfdrGrid(grid))
      .catch((err) => console.warn('Could not load FFDR grid:', err));
  }, []);

  // Fetch telemetry from backend
  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    const region = REGIONS[selectedRegion] || REGIONS.india;

    try {
      if (dataSource === 'fsi') {
        // Load FSI Forest Fire Intelligence
        const fsiRes = await fetchFsiForestFires({ mode: 'demo' });
        const raw = fsiRes.hotspots || [];
        const sorted = raw.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setAllHotspots(sorted);
        setClusters(fsiRes.clusters || []);
        setAlerts(fsiRes.alerts || []);
        setNotice(fsiRes.notice || 'DEMO DATA — Simulated Forest Survey of India (FSI) Layer');

        if (sorted.length > 0) {
          setTimelineIndex(sorted.length - 1);
        }
        setSelectedHotspot(null);
        setSelectedCluster(null);
      } else {
        // Load NASA FIRMS Stream
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
        }
        setSelectedHotspot(null);
        setSelectedCluster(null);
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
    <div className="flex flex-col h-screen w-screen bg-dark-900 overflow-hidden text-slate-100 transition-colors duration-200">
      {/* Top Operations Navigation Bar */}
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
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onRefresh={() => loadData(true)}
        loading={loading}
        stats={stats}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Analytics Overview Sidebar */}
        <Sidebar
          hotspots={allHotspots}
          clusters={clusters}
          alerts={alerts}
          notice={notice}
          filterClass={filterClass}
          onSelectFilterClass={setFilterClass}
          activeDate={activeDate}
          stats={stats}
        />

        {/* Center / Dominant GIS Map Area */}
        <main className="flex-1 relative h-full w-full bg-dark-950 overflow-hidden transition-colors duration-200">
          {/* Leaflet Map with Working Smart Map-Anchored Popups */}
          <MapView
            hotspots={visibleHotspots}
            clusters={clusters}
            alerts={alerts}
            ffdrGrid={ffdrGrid}
            temporarySafetyResources={temporarySafetyResources}
            mapMode={mapMode}
            theme={theme}
            regionConfig={REGIONS[selectedRegion]}
            selectedHotspot={selectedHotspot}
            selectedCluster={selectedCluster}
            activeRoute={activeRoute}
            onSetRoute={setActiveRoute}
            onSelectHotspot={handleSelectHotspot}
            onSelectCluster={handleSelectCluster}
            onShowTemporaryResources={setTemporarySafetyResources}
            showingTemporaryResources={temporarySafetyResources.length > 0}
            onViewFingerprint={(facility) => setSelectedFingerprintFacility(facility)}
            onInvestigateEvent={(event) => setSelectedInvestigationEvent(event)}
          />

          {/* Facility Thermal Fingerprint Modal Dialog (FACILITY-CENTRIC) */}
          {selectedFingerprintFacility && (
            <FacilityFingerprintModal
              facilityIdentifier={selectedFingerprintFacility}
              mode={mode}
              onClose={() => setSelectedFingerprintFacility(null)}
            />
          )}

          {/* Incident Investigation Modal Dialog (EVENT-CENTRIC) */}
          {selectedInvestigationEvent && (
            <EventInvestigationModal
              event={selectedInvestigationEvent}
              mode={mode}
              onClose={() => setSelectedInvestigationEvent(null)}
              onSetRoute={setActiveRoute}
              onShowTemporaryResources={setTemporarySafetyResources}
              showingTemporaryResources={temporarySafetyResources.length > 0}
            />
          )}

          {/* Floating Intensity Legend (Bottom Right) */}
          {mapMode !== 'standard' && (
            <div className="absolute bottom-6 right-6 z-[1000]">
              <ThermalLegend mode={mapMode} />
            </div>
          )}

          {/* Floating Timeline Scrubbing Controls (Bottom Center) */}
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
    </div>
  );
}

export default App;
