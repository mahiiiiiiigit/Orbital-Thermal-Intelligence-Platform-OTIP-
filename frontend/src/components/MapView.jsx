import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { TAXONOMY_COLORS, THERMAL_GRADIENT, FFDR_COLORS } from '../constants/taxonomy';
import { HotspotCard } from './HotspotCard';

const TYPE_COLORS = {
  fire_station: '#ef4444',
  hospital: '#06b6d4',
  police: '#3b82f6',
  ambulance: '#f59e0b',
  shelter: '#8b5cf6',
};

export function MapView({
  hotspots = [],
  clusters = [],
  alerts = [],
  ffdrGrid = null,
  temporarySafetyResources = [],
  mapMode = 'hybrid', // 'standard' | 'thermal' | 'hybrid' | 'forest_risk'
  theme = 'dark',
  regionConfig,
  selectedHotspot,
  activeRoute,
  onSetRoute,
  onSelectHotspot,
  onSelectCluster,
  onShowTemporaryResources,
  showingTemporaryResources = false,
  onViewFingerprint,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseTileLayerRef = useRef(null);
  const markersLayerRef = useRef([]);
  const clustersLayerRef = useRef([]);
  const alertsLayerRef = useRef([]);
  const temporarySafetyLayerRef = useRef([]);
  const routeLayersRef = useRef([]);
  const ffdrLayerRef = useRef(null);
  const heatLayerRef = useRef(null);

  // Dynamic Map Anchored Popup Container
  const popupRef = useRef(null);
  const [popupContainer, setPopupContainer] = useState(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: regionConfig?.center || [22.5, 78.5],
      zoom: regionConfig?.zoom || 5,
      zoomControl: false,
    });

    // Reposition zoom controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Map background click closes selected hotspot popup
    map.on('click', (e) => {
      // If clicking on the map canvas itself, deselect
      if (onSelectHotspot) {
        onSelectHotspot(null);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Manage Selected Hotspot Map-Anchored Popup
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedHotspot && selectedHotspot.latitude != null && selectedHotspot.longitude != null) {
      if (popupRef.current) {
        map.closePopup(popupRef.current);
        popupRef.current = null;
      }

      const div = document.createElement('div');
      div.className = 'hotspot-map-card-wrapper';

      const popup = L.popup({
        offset: [0, -10],
        className: 'custom-map-anchored-popup',
        autoPan: true,
        autoPanPadding: [50, 50],
        closeButton: false,
        maxWidth: 380,
        minWidth: 320,
      })
        .setLatLng([selectedHotspot.latitude, selectedHotspot.longitude])
        .setContent(div)
        .openOn(map);

      popupRef.current = popup;
      setPopupContainer(div);

      popup.on('remove', () => {
        setPopupContainer(null);
        popupRef.current = null;
      });
    } else {
      if (popupRef.current) {
        map.closePopup(popupRef.current);
        popupRef.current = null;
      }
      setPopupContainer(null);
    }
  }, [selectedHotspot]);

  // Update Tile Layer dynamically on Theme Switch
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    const cartoKey = import.meta.env.VITE_CARTO_KEY || 'cb1_2jno_1_ef0c23ffe5f8a02710afad82';
    const tileStyle = theme === 'dark' ? 'dark_all' : 'rastertiles/voyager';
    const tileUrl = `https://basemaps.cartocdn.com/${tileStyle}/{z}/{x}/{y}.png?key=${cartoKey}`;

    const newTileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; NASA FIRMS &copy; Forest Survey of India &copy; OpenRouteService',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    baseTileLayerRef.current = newTileLayer;
  }, [theme]);

  // Update Region Pan/Zoom
  useEffect(() => {
    if (!mapInstanceRef.current || !regionConfig) return;
    if (activeRoute || selectedHotspot) return; // Don't override active focus
    mapInstanceRef.current.flyTo(regionConfig.center, regionConfig.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [regionConfig, activeRoute, selectedHotspot]);

  // Render Overlays according to mapMode, telemetry, and temporary resources
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Clear previous layers
    markersLayerRef.current.forEach((m) => map.removeLayer(m));
    markersLayerRef.current = [];

    clustersLayerRef.current.forEach((c) => map.removeLayer(c));
    clustersLayerRef.current = [];

    alertsLayerRef.current.forEach((a) => map.removeLayer(a));
    alertsLayerRef.current = [];

    temporarySafetyLayerRef.current.forEach((s) => map.removeLayer(s));
    temporarySafetyLayerRef.current = [];

    if (ffdrLayerRef.current) {
      map.removeLayer(ffdrLayerRef.current);
      ffdrLayerRef.current = null;
    }

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // 2. Render Forest Fire Danger Rating (FFDR) 5km Grid (Forest Risk Mode)
    if (mapMode === 'forest_risk' && ffdrGrid && ffdrGrid.features) {
      ffdrLayerRef.current = L.geoJSON(ffdrGrid, {
        style: (feature) => {
          const risk = feature.properties?.risk_level || 'Moderate';
          const color = FFDR_COLORS[risk] || '#eab308';
          return {
            fillColor: color,
            fillOpacity: 0.42,
            weight: 1.5,
            color: color,
            dashArray: '3, 3',
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          const risk = p.risk_level || 'Moderate';
          const color = FFDR_COLORS[risk] || '#eab308';

          layer.bindTooltip(
            `<strong>${p.forest_division || 'Forest Division'}</strong><br/>FSI Danger: <span style="color:${color}; font-weight:bold;">${risk}</span>`,
            { sticky: true, direction: 'top' }
          );
        },
      }).addTo(map);
    }

    // 3. Render Contextual Temporary Safety Resources (Only when toggled by analyst)
    if (temporarySafetyResources && temporarySafetyResources.length > 0) {
      temporarySafetyResources.forEach((res) => {
        const typeLabel = res.type ? res.type.replace('_', ' ').toUpperCase() : 'SAFETY ASSET';
        const color = TYPE_COLORS[res.type] || '#38bdf8';

        const marker = L.circleMarker([res.latitude, res.longitude], {
          radius: 6,
          color: '#ffffff',
          fillColor: color,
          fillOpacity: 0.95,
          weight: 1.8,
        }).addTo(map);

        marker.bindTooltip(
          `<strong>${typeLabel}</strong>: ${res.name}`,
          { sticky: true, direction: 'top' }
        );

        temporarySafetyLayerRef.current.push(marker);
      });
    }

    // 4. Render Heatmap Layer (Thermal & Hybrid modes)
    if (mapMode === 'thermal' || mapMode === 'hybrid') {
      const heatPoints = hotspots.map((h) => {
        const weight = Math.min(1.0, Math.max(0.12, (h.frp || 5.0) / 80.0));
        return [h.latitude, h.longitude, weight];
      });

      if (heatPoints.length > 0) {
        heatLayerRef.current = L.heatLayer(heatPoints, {
          radius: 38,
          blur: 26,
          maxZoom: 9,
          max: 1.0,
          gradient: THERMAL_GRADIENT,
        }).addTo(map);
      }
    }

    // 5. Render Cluster Boundaries (Standard, Hybrid & Forest Risk modes)
    if (mapMode === 'standard' || mapMode === 'hybrid' || mapMode === 'forest_risk') {
      clusters.forEach((cluster) => {
        const isFire = cluster.classification === 'INDUSTRIAL_FIRE';
        const color = isFire
          ? '#ef4444'
          : (cluster.classification === 'GAS_FLARE' ? '#06b6d4' : '#8b5cf6');

        const circle = L.circle([cluster.latitude, cluster.longitude], {
          radius: 5000,
          color: color,
          fillColor: color,
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '4, 6',
        }).addTo(map);

        circle.bindTooltip(
          `<strong>${cluster.facility_name}</strong><br/>${cluster.classification} (${cluster.detection_count} detections)`,
          { sticky: true, direction: 'top' }
        );

        circle.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectCluster) onSelectCluster(cluster);
        });
        clustersLayerRef.current.push(circle);
      });
    }

    // 6. Render Hotspot Markers (Standard, Hybrid & Forest Risk modes)
    if (mapMode === 'standard' || mapMode === 'hybrid' || mapMode === 'forest_risk') {
      hotspots.forEach((hotspot) => {
        const isSpike = hotspot.classification === 'INDUSTRIAL_FIRE' || (hotspot.frp >= 90);
        const color = TAXONOMY_COLORS[hotspot.classification] || '#94a3b8';

        const marker = L.circleMarker([hotspot.latitude, hotspot.longitude], {
          radius: isSpike ? 9 : (hotspot.classification === 'GAS_FLARE' || hotspot.classification === 'PERSISTENT_INDUSTRIAL' ? 7 : 5),
          color: isSpike ? '#ffffff' : color,
          fillColor: color,
          fillOpacity: mapMode === 'hybrid' ? 0.95 : 0.85,
          weight: isSpike ? 2 : 1.2,
        }).addTo(map);

        marker.bindTooltip(
          `<strong>${hotspot.classification}</strong> • ${hotspot.frp} MW<br/>${hotspot.forest_name || hotspot.facility_name || hotspot.state || ''}`,
          { sticky: true, direction: 'top' }
        );

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectHotspot) onSelectHotspot(hotspot);
        });

        markersLayerRef.current.push(marker);
      });
    }

    // 7. Render Anomaly Spikes Pulse Icons
    alerts.forEach((alt) => {
      const anomalyIcon = L.divIcon({
        className: '',
        html: '<div class="anomaly-marker-dot"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const alertMarker = L.marker([alt.latitude, alt.longitude], { icon: anomalyIcon })
        .addTo(map)
        .bindTooltip(`<strong>CRITICAL SPIKE: ${alt.facility_name}</strong><br/>${alt.current_frp} MW (+${alt.z_score}σ)`, {
          sticky: true,
          direction: 'top',
        })
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectHotspot) onSelectHotspot(alt);
        });

      alertsLayerRef.current.push(alertMarker);
    });

  }, [hotspots, clusters, alerts, ffdrGrid, temporarySafetyResources, mapMode]);

  // Render Active Emergency Dispatch Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    routeLayersRef.current.forEach((l) => map.removeLayer(l));
    routeLayersRef.current = [];

    if (!activeRoute || !activeRoute.route || !activeRoute.route.coordinates) return;

    const coords = activeRoute.route.coordinates;
    if (coords.length === 0) return;

    // Glowing casing polyline
    const glowLine = L.polyline(coords, {
      color: '#f59e0b',
      weight: 7,
      opacity: 0.45,
    }).addTo(map);

    // Inner route polyline
    const routeLine = L.polyline(coords, {
      color: '#38bdf8',
      weight: 3.5,
      opacity: 0.95,
      dashArray: '6, 6',
    }).addTo(map);

    // Origin Base Marker (clean text badge, no emojis)
    const depot = activeRoute.origin_depot;
    let depotMarker = null;
    if (depot) {
      const depotIcon = L.divIcon({
        className: '',
        html: '<div style="background:#0284c7; color:#fff; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:10px; border:1px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.5);">DISPATCH ORIGIN</div>',
        iconSize: [100, 20],
        iconAnchor: [50, 10],
      });
      depotMarker = L.marker([depot.latitude, depot.longitude], { icon: depotIcon })
        .addTo(map)
        .bindTooltip(`<strong>${depot.name}</strong><br/>Emergency Response Dispatch Point`, { permanent: false, direction: 'top' });
    }

    routeLayersRef.current = [glowLine, routeLine];
    if (depotMarker) routeLayersRef.current.push(depotMarker);

    // Fit map bounds to show complete route
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });

  }, [activeRoute]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Map-Anchored Portal for Selected Hotspot Detail Card */}
      {popupContainer && selectedHotspot && ReactDOM.createPortal(
        <HotspotCard
          hotspot={selectedHotspot}
          activeRoute={activeRoute}
          onSetRoute={onSetRoute}
          onShowTemporaryResources={onShowTemporaryResources}
          showingTemporaryResources={showingTemporaryResources}
          onClose={() => onSelectHotspot && onSelectHotspot(null)}
          onViewFingerprint={onViewFingerprint}
        />,
        popupContainer
      )}
    </div>
  );
}
