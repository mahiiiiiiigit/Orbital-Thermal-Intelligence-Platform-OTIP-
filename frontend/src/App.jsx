import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
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
import { HotspotDetailPanel } from './components/HotspotDetailPanel';
import { AlertsPage } from './components/AlertsPage';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { LandingPage } from './components/landing/LandingPage';

export function App() {
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash;
    if (hash === '#analytics') return 'analytics';
    if (hash === '#alerts') return 'alerts';
    if (hash === '#dashboard') return 'dashboard';
    return 'landing';
  });

  const [dataSource, setDataSource] = useState('firms'); // 'firms' | 'fsi'
  const [mode, setMode] = useState('auto'); // 'auto' (Live NASA) | 'demo'
  const [selectedRegion, setSelectedRegion] = useState('india');
  const [selectedSensor, setSelectedSensor] = useState('VIIRS_SNPP_NRT');
  const [mapMode, setMapMode] = useState(() => {
    return localStorage.getItem('thermalwatch_map_mode') || 'hybrid';
  });
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('thermalwatch_view_mode') || 'dark';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Hash Change Listener for view synchronization
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#analytics') {
        setCurrentView('analytics');
      } else if (hash === '#alerts') {
        setCurrentView('alerts');
      } else if (hash === '#dashboard') {
        setCurrentView('dashboard');
      } else if (hash === '#landing' || !hash || hash === '#' || hash.startsWith('#features') || hash.startsWith('#how-it-works') || hash.startsWith('#use-cases') || hash.startsWith('#live-preview')) {
        setCurrentView('landing');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLaunchDashboard = useCallback(() => {
    setCurrentView('dashboard');
    window.location.hash = '#dashboard';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateAlerts = useCallback(() => {
    setCurrentView('alerts');
    window.location.hash = '#alerts';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateAnalytics = useCallback(() => {
    setCurrentView('analytics');
    window.location.hash = '#analytics';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateLanding = useCallback(() => {
    setCurrentView('landing');
    window.location.hash = '#';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Manage Dark & Light viewmode classes and persistence
  useEffect(() => {
    if (viewMode === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('thermalwatch_view_mode', viewMode);
  }, [viewMode]);

  // Save map mode to localStorage
  const handleSelectMapMode = useCallback((newMode) => {
    setMapMode(newMode);
    localStorage.setItem('thermalwatch_map_mode', newMode);
  }, []);

  // Commit active route to global map state
  const handleCommitRoute = useCallback((route) => {
    console.log('[Routing] activeRoute updated:', route);
    setActiveRoute(route);
  }, []);

  // Explicit route removal action (only through user action)
  const handleClearRoute = useCallback(() => {
    console.log('[Routing] Route cleared');
    setActiveRoute(null);
  }, []);

  // Dedicated handler for emergency routing from incident investigation modal:
  // Only closes EventInvestigationModal AFTER API succeeds, geometry is valid, and committed to activeRoute
  const handleSetEmergencyRoute = useCallback((routeData) => {
    if (!routeData || !routeData.route || !Array.isArray(routeData.route.coordinates) || routeData.route.coordinates.length === 0) {
      console.warn('[Routing] Attempted to commit invalid route geometry:', routeData);
      return;
    }
    console.log('[Routing] activeRoute updated:', routeData);
    setActiveRoute(routeData);
    setCurrentView('dashboard');
    window.location.hash = '#dashboard';
    // Dismiss incident investigation modal only after route geometry is committed to global map state
    setSelectedInvestigationEvent(null);
  }, []);

  // Clear temporary safety resources when selecting a different hotspot or cluster,
  // but PRESERVE activeRoute across selections unless explicitly cleared.
  const handleSelectHotspot = useCallback((hotspot) => {
    setSelectedHotspot(hotspot);
    setTemporarySafetyResources([]);
  }, []);

  const handleSelectCluster = useCallback((cluster) => {
    setSelectedCluster(cluster);
    setTemporarySafetyResources([]);
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

        const fsiDates = Array.from(new Set(sorted.map((h) => h.timestamp ? h.timestamp.slice(0, 10) : '').filter(Boolean))).sort();
        if (fsiDates.length > 0) {
          setTimelineIndex(fsiDates.length - 1);
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

        const nasaDates = Array.from(new Set(sorted.map((h) => h.timestamp ? h.timestamp.slice(0, 10) : '').filter(Boolean))).sort();
        if (nasaDates.length > 0) {
          setTimelineIndex(nasaDates.length - 1);
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

  // Keep timelineIndex bounded within available date frames
  useEffect(() => {
    if (timelineDates.length > 0 && timelineIndex >= timelineDates.length) {
      setTimelineIndex(timelineDates.length - 1);
    }
  }, [timelineDates, timelineIndex]);

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

  // Landing Page View
  if (currentView === 'landing') {
    return (
      <LandingPage
        onLaunchDashboard={handleLaunchDashboard}
        onNavigateAnalytics={handleNavigateAnalytics}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />
    );
  }

  // Analytics Trends SaaS Dashboard View
  if (currentView === 'analytics') {
    return (
      <div className="relative w-screen h-screen overflow-y-auto overflow-x-hidden bg-[#0a0e17]">
        <AnalyticsDashboard
          hotspots={allHotspots}
          clusters={clusters}
          alerts={alerts}
          onNavigateDashboard={handleLaunchDashboard}
          onNavigateLanding={handleNavigateLanding}
          onNavigateAlerts={handleNavigateAlerts}
          onViewFingerprint={(facility) => setSelectedFingerprintFacility(facility)}
          onInvestigateEvent={(event) => setSelectedInvestigationEvent(event)}
        />

        {/* Facility Thermal Fingerprint Modal Dialog */}
        {selectedFingerprintFacility && (
          <FacilityFingerprintModal
            facilityIdentifier={selectedFingerprintFacility}
            mode={mode}
            onClose={() => setSelectedFingerprintFacility(null)}
            onInvestigateEvent={(event) => setSelectedInvestigationEvent(event)}
          />
        )}

        {/* Incident Investigation Modal Dialog */}
        {selectedInvestigationEvent && (
          <EventInvestigationModal
            event={selectedInvestigationEvent}
            mode={mode}
            activeRoute={activeRoute}
            onClose={() => setSelectedInvestigationEvent(null)}
            onSetRoute={handleSetEmergencyRoute}
            onClearRoute={handleClearRoute}
            onShowTemporaryResources={setTemporarySafetyResources}
            showingTemporaryResources={temporarySafetyResources.length > 0}
          />
        )}
      </div>
    );
  }

  // Alerts & Critical Events Page View
  if (currentView === 'alerts') {
    return (
      <div className="relative w-screen h-screen overflow-hidden">
        <AlertsPage
          alerts={alerts}
          hotspots={allHotspots}
          onNavigateDashboard={handleLaunchDashboard}
          onNavigateLanding={handleNavigateLanding}
          onNavigateAnalytics={handleNavigateAnalytics}
          onInvestigateEvent={(event) => setSelectedInvestigationEvent(event)}
          onViewFingerprint={(facility) => setSelectedFingerprintFacility(facility)}
        />

        {/* Facility Thermal Fingerprint Modal Dialog (FACILITY-CENTRIC) */}
        {selectedFingerprintFacility && (
          <FacilityFingerprintModal
            facilityIdentifier={selectedFingerprintFacility}
            mode={mode}
            onClose={() => setSelectedFingerprintFacility(null)}
            onInvestigateEvent={(event) => setSelectedInvestigationEvent(event)}
          />
        )}

        {/* Incident Investigation Modal Dialog (EVENT-CENTRIC) */}
        {selectedInvestigationEvent && (
          <EventInvestigationModal
            event={selectedInvestigationEvent}
            mode={mode}
            activeRoute={activeRoute}
            onClose={() => setSelectedInvestigationEvent(null)}
            onSetRoute={handleSetEmergencyRoute}
            onClearRoute={handleClearRoute}
            onShowTemporaryResources={setTemporarySafetyResources}
            showingTemporaryResources={temporarySafetyResources.length > 0}
          />
        )}
      </div>
    );
  }

  // Operational Dashboard View
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
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onRefresh={() => loadData(true)}
        loading={loading}
        stats={stats}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigateLanding={handleNavigateLanding}
        onNavigateAlerts={handleNavigateAlerts}
        onNavigateAnalytics={handleNavigateAnalytics}
        currentView={currentView}
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
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          timelineDates={timelineDates}
          timelineIndex={timelineIndex}
          onChangeTimelineIndex={setTimelineIndex}
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
            viewMode={viewMode}
            regionConfig={REGIONS[selectedRegion]}
            selectedHotspot={selectedHotspot}
            selectedCluster={selectedCluster}
            activeRoute={activeRoute}
            onSetRoute={handleCommitRoute}
            onClearRoute={handleClearRoute}
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
              onInvestigateEvent={(event) => setSelectedInvestigationEvent(event)}
            />
          )}

          {/* Incident Investigation Modal Dialog (EVENT-CENTRIC) */}
          {selectedInvestigationEvent && (
            <EventInvestigationModal
              event={selectedInvestigationEvent}
              mode={mode}
              activeRoute={activeRoute}
              onClose={() => setSelectedInvestigationEvent(null)}
              onSetRoute={handleSetEmergencyRoute}
              onClearRoute={handleClearRoute}
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
        </main>

        {/* Right Dynamic Telemetry Detail Panel */}
        <HotspotDetailPanel
          selectedHotspot={selectedHotspot}
          selectedCluster={selectedCluster}
          recentHotspots={visibleHotspots}
          activeRoute={activeRoute}
          onSelectHotspot={handleSelectHotspot}
          onClose={() => {
            handleSelectHotspot(null);
            handleSelectCluster(null);
          }}
          onViewFingerprint={(facility) => setSelectedFingerprintFacility(facility)}
          onInvestigateEvent={(event) => setSelectedInvestigationEvent(event)}
          onSetRoute={handleCommitRoute}
          onClearRoute={handleClearRoute}
        />
      </div>
    </div>
  );
}

export default App;
