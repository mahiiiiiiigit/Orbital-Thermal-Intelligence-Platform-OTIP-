import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

if (typeof window !== 'undefined') {
  window.L = L;
}

import 'leaflet.heat';
import { TAXONOMY_COLORS, THERMAL_GRADIENT, FFDR_COLORS } from '../constants/taxonomy';
import { HotspotCard } from './HotspotCard';
import { ClusterCard } from './ClusterCard';
import { Navigation, X } from 'lucide-react';

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
  viewMode = 'dark', // 'dark' | 'light'
  regionConfig,
  selectedHotspot,
  selectedCluster,
  activeRoute,
  onSetRoute,
  onClearRoute,
  onSelectHotspot,
  onSelectCluster,
  onShowTemporaryResources,
  showingTemporaryResources = false,
  onViewFingerprint,
  onInvestigateEvent,
}) {
  const mapContainerRef = useRef(null);
  const cardRef = useRef(null);
  const [map, setMap] = useState(null);
  const baseTileLayerRef = useRef(null);
  const markersLayerRef = useRef([]);
  const clustersLayerRef = useRef([]);
  const alertsLayerRef = useRef([]);
  const temporarySafetyLayerRef = useRef([]);
  const routeLayersRef = useRef([]);
  const ffdrLayerRef = useRef(null);
  const heatLayerRef = useRef(null);

  // Track marker/cluster clicks to prevent map background click from closing popup immediately
  const lastMarkerClickTimeRef = useRef(0);

  // Dynamic Map-Anchored Overlay Position State
  const [popupPos, setPopupPos] = useState(null);

  // Active anchor (hotspot or cluster)
  const activeAnchor = selectedHotspot || selectedCluster || null;

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialMap = L.map(mapContainerRef.current, {
      center: regionConfig?.center || [22.5, 78.5],
      zoom: regionConfig?.zoom || 5,
      zoomControl: false,
    });

    // Zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(initialMap);

    // Map background click closes selected popups
    initialMap.on('click', () => {
      if (Date.now() - lastMarkerClickTimeRef.current < 400) {
        return; // Ignore if a marker/cluster was just clicked
      }
      if (onSelectHotspot) onSelectHotspot(null);
      if (onSelectCluster) onSelectCluster(null);
    });

    setMap(initialMap);

    // Invalidate size once DOM layout completes safely
    const timer = setTimeout(() => {
      if (initialMap && initialMap._container) {
        try {
          initialMap.invalidateSize();
        } catch (e) {
          // Ignore if map unmounted
        }
      }
    }, 150);

    let resizeObserver = null;
    if (window.ResizeObserver && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (initialMap && initialMap._container) {
          try {
            initialMap.invalidateSize();
          } catch (e) {
            // Ignore if map unmounted
          }
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      try {
        initialMap.remove();
      } catch (e) {
        // Ignore unmount errors
      }
      setMap(null);
    };
  }, []);

  // 2. Manage Base Tile Layer (CARTO Dark or Light)
  useEffect(() => {
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    const tileSub = viewMode === 'light' ? 'light_all' : 'dark_all';
    // CARTO's public raster basemaps do not require an application API key.
    // Do not append a placeholder key: CARTO rejects it and blocks the map.
    const tileUrl = `https://{s}.basemaps.cartocdn.com/${tileSub}/{z}/{x}/{y}{r}.png`;

    const newTileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; NASA FIRMS &copy; Forest Survey of India &copy; OpenRouteService',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    baseTileLayerRef.current = newTileLayer;
  }, [map, viewMode]);

  // 3. Manage Region Pan/Zoom Navigation
  useEffect(() => {
    if (!map || !regionConfig) return;
    if (activeRoute || selectedHotspot || selectedCluster) return;
    map.flyTo(regionConfig.center, regionConfig.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [map, regionConfig, activeRoute, selectedHotspot, selectedCluster]);

  // 4. Compute Smart Map-Anchored Popup Position (Zero-Clipping Calculation)
  const updatePopupPosition = useCallback(() => {
    if (!map || !activeAnchor) {
      setPopupPos(null);
      return;
    }

    const lat = Number(activeAnchor.latitude);
    const lon = Number(activeAnchor.longitude);
    if (isNaN(lat) || isNaN(lon)) {
      setPopupPos(null);
      return;
    }

    const container = mapContainerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth || window.innerWidth;
    const containerHeight = container.clientHeight || window.innerHeight;

    let point;
    try {
      point = map.latLngToContainerPoint([lat, lon]);
    } catch {
      return;
    }

    if (!point || isNaN(point.x) || isNaN(point.y)) return;

    const cardEl = cardRef.current;
    const cardWidth = cardEl && cardEl.offsetWidth > 100 ? cardEl.offsetWidth : 370;
    const cardHeight = cardEl && cardEl.offsetHeight > 100 ? cardEl.offsetHeight : 440;

    const MARGIN = 16;
    const PIN_OFFSET = 14;

    // Available space in viewport
    const spaceAbove = point.y - MARGIN;
    const spaceBelow = containerHeight - point.y - MARGIN;

    // Decision: Place below if insufficient space above AND more space below
    let isAbove = true;
    if (spaceAbove < (cardHeight + PIN_OFFSET) && spaceBelow >= spaceAbove) {
      isAbove = false;
    }

    // Calculate vertical position
    let targetTop = isAbove
      ? (point.y - cardHeight - PIN_OFFSET)
      : (point.y + PIN_OFFSET);

    // Hard clamp top within [MARGIN, containerHeight - cardHeight - MARGIN]
    const maxTop = Math.max(MARGIN, containerHeight - cardHeight - MARGIN);
    const top = Math.max(MARGIN, Math.min(targetTop, maxTop));

    // Calculate horizontal position centered on marker
    let targetLeft = point.x - cardWidth / 2;
    // Hard clamp left within [MARGIN, containerWidth - cardWidth - MARGIN]
    const maxLeft = Math.max(MARGIN, containerWidth - cardWidth - MARGIN);
    const left = Math.max(MARGIN, Math.min(targetLeft, maxLeft));

    // Pointer arrow horizontal anchor relative to card
    const arrowLeft = Math.max(20, Math.min(point.x - left, cardWidth - 20));

    setPopupPos({
      left: Math.round(left),
      top: Math.round(top),
      isAbove,
      arrowLeft: Math.round(arrowLeft),
      markerX: point.x,
      markerY: point.y,
      isVisible: true,
    });
  }, [map, activeAnchor]);

  // Sync Popup Position on selection change and auto-pan if marker is near edge
  useEffect(() => {
    if (!map || !activeAnchor) {
      setPopupPos(null);
      return;
    }

    updatePopupPosition();

    // Auto-pan slightly if marker is too close to container boundary
    const container = mapContainerRef.current;
    if (container) {
      const lat = Number(activeAnchor.latitude);
      const lon = Number(activeAnchor.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        try {
          const pt = map.latLngToContainerPoint([lat, lon]);
          const padTop = 130;
          const padBottom = 130;
          const padSide = 150;
          let dx = 0;
          let dy = 0;

          if (pt.x < padSide) dx = pt.x - padSide;
          else if (pt.x > container.clientWidth - padSide) dx = pt.x - (container.clientWidth - padSide);

          if (pt.y < padTop) dy = pt.y - padTop;
          else if (pt.y > container.clientHeight - padBottom) dy = pt.y - (container.clientHeight - padBottom);

          if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
            map.panBy([dx, dy], { animate: true, duration: 0.35 });
          }
        } catch {
          // Ignore
        }
      }
    }
  }, [map, activeAnchor, updatePopupPosition]);

  // Keep Popup position updated during map movement / zoom / resize
  useEffect(() => {
    if (!map || !activeAnchor) return;

    const handleMapMovement = () => {
      updatePopupPosition();
    };

    map.on('move zoom viewreset resize moveend zoomend', handleMapMovement);

    // Watch for card size changes
    let cardResizeObs = null;
    if (window.ResizeObserver && cardRef.current) {
      cardResizeObs = new ResizeObserver(() => {
        updatePopupPosition();
      });
      cardResizeObs.observe(cardRef.current);
    }

    return () => {
      map.off('move zoom viewreset resize moveend zoomend', handleMapMovement);
      if (cardResizeObs) cardResizeObs.disconnect();
    };
  }, [map, activeAnchor, updatePopupPosition]);

  // 5. Render Overlays according to mapMode, telemetry, and temporary resources
  useEffect(() => {
    if (!map) return;

    // Clear previous layers
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

    // Render Forest Fire Danger Rating (FFDR) 5km Grid (Forest Risk Mode)
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

    // Render Contextual Temporary Safety Resources (Only when toggled by analyst)
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

    // Render Heatmap Layer (Thermal & Hybrid modes)
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

    // Render Cluster Boundaries and Cluster Markers across all modes
    clusters.forEach((cluster) => {
      if (!cluster.latitude || !cluster.longitude) return;

      const isFire = cluster.classification === 'INDUSTRIAL_FIRE';
      const color = isFire
        ? '#ef4444'
        : (cluster.classification === 'GAS_FLARE' ? '#06b6d4' : '#8b5cf6');

      // 1. Outer subtle halo boundary (5km radius)
      const circle = L.circle([cluster.latitude, cluster.longitude], {
        radius: 5000,
        color: color,
        fillColor: color,
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 6',
      }).addTo(map);

      // 2. Distinct prominent Cluster Marker Badge with detection count: (18), (30), (48)
      const isLight = viewMode === 'light';
      const count = cluster.detection_count || 1;
      const clusterIconHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
          padding: 0 6px;
          border-radius: 9999px;
          background: ${isLight ? '#ffffff' : '#111722'};
          border: 2px solid ${color};
          box-shadow: 0 0 14px ${color}80, 0 4px 12px rgba(0,0,0,${isLight ? '0.25' : '0.6'});
          color: ${isLight ? '#0f172a' : '#ffffff'};
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          user-select: none;
          transition: transform 0.15s ease;
        ">
          (${count})
        </div>
      `;

      const clusterIcon = L.divIcon({
        className: 'cluster-map-badge',
        html: clusterIconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const clusterMarker = L.marker([cluster.latitude, cluster.longitude], {
        icon: clusterIcon,
        zIndexOffset: 500, // Elevated above standard hotspot markers
      }).addTo(map);

      const tooltipBg = isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(17, 23, 34, 0.96)';
      const tooltipTextColor = isLight ? '#0f172a' : '#f8fafc';
      const tooltipBorder = isLight ? `1px solid ${color}` : `1px solid ${color}60`;
      const tooltipShadow = isLight ? '0 8px 24px rgba(0,0,0,0.15)' : '0 8px 24px rgba(0,0,0,0.6)';

      const clusterCategory = cluster.classification
        ? cluster.classification.replace(/_/g, ' ')
        : 'INDUSTRIAL CLUSTER';
      const clusterTitle = cluster.facility_name || cluster.name || 'Industrial Facility';
      const frpSnippet = cluster.mean_frp != null && Number.isFinite(Number(cluster.mean_frp))
        ? `Avg: ${Number(cluster.mean_frp).toFixed(1)} MW`
        : (cluster.peak_frp != null && Number.isFinite(Number(cluster.peak_frp))
          ? `Peak: ${Number(cluster.peak_frp).toFixed(1)} MW`
          : `${count} Detections`);

      const tooltipContent = `
        <div style="background: ${tooltipBg}; border: ${tooltipBorder}; border-radius: 8px; padding: 7px 10px; font-family: 'Inter', sans-serif; box-shadow: ${tooltipShadow}; min-width: 180px; backdrop-filter: blur(8px);">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
            <span style="font-size: 10px; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: ${color}; text-transform: uppercase;">
              ${clusterCategory}
            </span>
            <span style="font-size: 10.5px; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #f97316;">
              ${count} DETECTIONS
            </span>
          </div>
          <div style="font-size: 11px; font-weight: 600; color: ${tooltipTextColor}; margin-bottom: 3px; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${clusterTitle}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 9.5px; font-family: 'JetBrains Mono', monospace; color: ${isLight ? '#64748b' : '#94a3b8'}; border-top: 1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}; padding-top: 3px; margin-top: 3px;">
            <span>${frpSnippet}</span>
            <span style="color: #0284c7;">Click for details →</span>
          </div>
        </div>
      `;

      clusterMarker.bindTooltip(tooltipContent, {
        sticky: true,
        direction: 'top',
        className: 'custom-hud-tooltip',
      });
      circle.bindTooltip(tooltipContent, {
        sticky: true,
        direction: 'top',
        className: 'custom-hud-tooltip',
      });

      const handleClusterClick = (e) => {
        lastMarkerClickTimeRef.current = Date.now();
        if (e?.originalEvent) e.originalEvent.stopPropagation();
        if (L.DomEvent) L.DomEvent.stopPropagation(e);

        if (onSelectCluster) onSelectCluster(cluster);
        if (onSelectHotspot) onSelectHotspot(null);
      };

      clusterMarker.on('click', handleClusterClick);
      circle.on('click', handleClusterClick);

      clustersLayerRef.current.push(circle);
      clustersLayerRef.current.push(clusterMarker);
    });

    // Render Hotspot Markers (Standard, Hybrid, Forest Risk & Thermal modes)
    const isLight = viewMode === 'light';
    hotspots.forEach((hotspot) => {
      const isSpike = hotspot.classification === 'INDUSTRIAL_FIRE' || (hotspot.frp >= 90);
      const color = TAXONOMY_COLORS[hotspot.classification] || '#94a3b8';

      // Ensure high contrast on both dark and light basemaps:
      // In light mode, yellow/gray dots have a solid dark border so they pop instantly against white landmass
      const strokeColor = isLight
        ? (isSpike ? '#dc2626' : (hotspot.classification === 'AGRICULTURAL_BURNING' ? '#78350f' : '#0f172a'))
        : (isSpike ? '#ffffff' : color);

      const marker = L.circleMarker([hotspot.latitude, hotspot.longitude], {
        radius: isSpike ? 9 : (hotspot.classification === 'GAS_FLARE' || hotspot.classification === 'PERSISTENT_INDUSTRIAL' ? 7 : 5),
        color: strokeColor,
        fillColor: color,
        fillOpacity: isLight ? 0.98 : (mapMode === 'thermal' ? 0.35 : (mapMode === 'hybrid' ? 0.95 : 0.85)),
        weight: isLight ? 1.6 : (isSpike ? 2 : 1.2),
      }).addTo(map);

      const frpVal = Number(hotspot.frp) || 0;
      const locationLabel = hotspot.facility_name || hotspot.forest_name || hotspot.state || `${hotspot.latitude.toFixed(2)}°, ${hotspot.longitude.toFixed(2)}°`;
      const tempVal = hotspot.brightness ? `${Number(hotspot.brightness).toFixed(0)} K` : (hotspot.bright_ti4 ? `${Number(hotspot.bright_ti4).toFixed(0)} K` : '330 K');

      const tooltipBg = isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(17, 23, 34, 0.96)';
      const tooltipTextColor = isLight ? '#0f172a' : '#f8fafc';
      const tooltipBorder = isLight ? `1px solid ${color}` : `1px solid ${color}60`;
      const tooltipShadow = isLight ? '0 8px 24px rgba(0,0,0,0.15)' : '0 8px 24px rgba(0,0,0,0.6)';

      const tooltipContent = `
        <div style="background: ${tooltipBg}; border: ${tooltipBorder}; border-radius: 8px; padding: 7px 10px; font-family: 'Inter', sans-serif; box-shadow: ${tooltipShadow}; min-width: 170px; backdrop-filter: blur(8px);">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
            <span style="font-size: 10px; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: ${color}; text-transform: uppercase;">
              ${(hotspot.classification || 'ANOMALY').replace('_', ' ')}
            </span>
            <span style="font-size: 10.5px; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #f97316;">
              ${frpVal.toFixed(1)} MW
            </span>
          </div>
          <div style="font-size: 11px; font-weight: 600; color: ${tooltipTextColor}; margin-bottom: 3px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${locationLabel}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 9.5px; font-family: 'JetBrains Mono', monospace; color: ${isLight ? '#64748b' : '#94a3b8'}; border-top: 1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}; padding-top: 3px; margin-top: 3px;">
            <span>T4: ${tempVal}</span>
            <span style="color: #0284c7;">Click for details →</span>
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        sticky: true,
        direction: 'top',
        className: 'custom-hud-tooltip',
      });

      marker.on('click', (e) => {
        lastMarkerClickTimeRef.current = Date.now();
        if (e?.originalEvent) e.originalEvent.stopPropagation();
        if (L.DomEvent) L.DomEvent.stopPropagation(e);

        if (onSelectHotspot) onSelectHotspot(hotspot);
        if (onSelectCluster) onSelectCluster(null);
      });

      markersLayerRef.current.push(marker);
    });

    // Render Anomaly Spikes Pulse Icons
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
          lastMarkerClickTimeRef.current = Date.now();
          if (e?.originalEvent) e.originalEvent.stopPropagation();
          if (L.DomEvent) L.DomEvent.stopPropagation(e);

          if (onSelectHotspot) onSelectHotspot(alt);
          if (onSelectCluster) onSelectCluster(null);
        });

      alertsLayerRef.current.push(alertMarker);
    });

  }, [map, hotspots, clusters, alerts, ffdrGrid, temporarySafetyResources, mapMode, viewMode, onSelectHotspot, onSelectCluster]);

  // 6. Render Active Emergency Dispatch Route Polyline
  useEffect(() => {
    if (!map) return;

    if (routeLayersRef.current.length > 0) {
      console.log('[Routing] Removing route layers from map');
      routeLayersRef.current.forEach((l) => map.removeLayer(l));
      routeLayersRef.current = [];
    }

    if (!activeRoute || !activeRoute.route || !activeRoute.route.coordinates) return;

    const coords = activeRoute.route.coordinates;
    if (!Array.isArray(coords) || coords.length === 0) {
      console.warn('[Routing] activeRoute has invalid or empty coordinates');
      return;
    }

    console.log('[Routing] Leaflet polyline created:', {
      coordinatesCount: coords.length,
      distanceKm: activeRoute.route?.distance_km,
      durationMinutes: activeRoute.route?.duration_minutes,
      origin: activeRoute.origin_depot?.name,
    });

    // Glowing casing polyline
    const glowLine = L.polyline(coords, {
      color: '#f59e0b',
      weight: 7,
      opacity: 0.5,
    }).addTo(map);

    // Inner route polyline
    const routeLine = L.polyline(coords, {
      color: '#38bdf8',
      weight: 3.5,
      opacity: 0.95,
      dashArray: '6, 6',
    }).addTo(map);

    // Origin Base Marker
    const depot = activeRoute.origin_depot;
    let depotMarker = null;
    if (depot && depot.latitude && depot.longitude) {
      const depotLabel = (depot.name || 'BASE')
        .split('(')[0]
        .replace(/Emergency|Fire Station|Response Base/gi, '')
        .trim()
        .toUpperCase()
        .slice(0, 20) || 'BASE';

      const depotIcon = L.divIcon({
        className: 'dispatch-origin-pin-wrapper',
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 9999px;
            font-weight: 800;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            border: 1.5px solid rgba(255, 255, 255, 0.95);
            box-shadow: 0 4px 14px rgba(2, 132, 199, 0.65), 0 0 10px rgba(56, 189, 248, 0.4);
            letter-spacing: 0.5px;
            white-space: nowrap;
            width: max-content;
            transform: translate(-50%, -50%);
          ">
            <span style="font-size: 11px; line-height: 1;">🚒</span>
            <span>DISPATCH: ${depotLabel}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      depotMarker = L.marker([depot.latitude, depot.longitude], { icon: depotIcon })
        .addTo(map)
        .bindTooltip(`<strong>${depot.name}</strong><br/>Emergency Response Dispatch Point`, { permanent: false, direction: 'top' });
    }

    routeLayersRef.current = [glowLine, routeLine];
    if (depotMarker) routeLayersRef.current.push(depotMarker);

    // Invalidate map size to sync with container dimensions before fitting bounds
    map.invalidateSize();

    // Fit map bounds to show complete route
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    console.log('[Routing] fitBounds executed:', bounds);

  }, [map, activeRoute]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Active Dispatch Route HUD */}
      {activeRoute && activeRoute.route && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-dark-950/95 border border-amber-500/50 shadow-2xl backdrop-blur-xl px-4 py-2.5 rounded-2xl animate-fadeIn text-slate-100 max-w-[95vw] pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Navigation className="w-4 h-4 animate-pulse" />
          </div>

          <div className="flex flex-col min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-amber-400">
                Active Dispatch Route
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {activeRoute.route.source || 'Emergency Route'}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5 max-w-[240px] sm:max-w-[360px]">
              <span className="truncate">{activeRoute.origin_depot?.name || 'Emergency Base'}</span>
              <span className="text-slate-400 shrink-0">→</span>
              <span className="text-orange-400 shrink-0">Incident Target</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pl-2 border-l border-dark-750">
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-emerald-400">
                {activeRoute.route.distance_km} km
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                ETA: ~{activeRoute.route.duration_minutes} min
              </div>
            </div>

            {onClearRoute && (
              <button
                type="button"
                onClick={onClearRoute}
                className="p-1.5 rounded-lg bg-dark-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-dark-750 hover:border-red-500/40 transition-all cursor-pointer shadow-sm"
                title="Clear Active Emergency Route"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Map-Anchored Smart Overlay Detail Card (Hotspot or Cluster) */}
      {activeAnchor && popupPos && (
        <div
          ref={cardRef}
          className="absolute z-[1000] w-[370px] max-w-[calc(100%-32px)] transition-all duration-75 pointer-events-auto shadow-2xl"
          style={{
            left: `${popupPos.left}px`,
            top: `${popupPos.top}px`,
            maxHeight: 'calc(100% - 32px)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Pointer Caret / Triangle Arrow */}
          {popupPos.isAbove ? (
            <div
              className="absolute -bottom-2 w-3.5 h-3.5 bg-dark-900 border-r border-b border-dark-700/90 transform rotate-45 pointer-events-none shadow-md"
              style={{ left: `${popupPos.arrowLeft - 7}px` }}
            />
          ) : (
            <div
              className="absolute -top-2 w-3.5 h-3.5 bg-dark-900 border-l border-t border-dark-700/90 transform rotate-45 pointer-events-none shadow-md"
              style={{ left: `${popupPos.arrowLeft - 7}px` }}
            />
          )}

          {selectedHotspot ? (
            <HotspotCard
              hotspot={selectedHotspot}
              activeRoute={activeRoute}
              onSetRoute={onSetRoute}
              onShowTemporaryResources={onShowTemporaryResources}
              showingTemporaryResources={showingTemporaryResources}
              onClose={() => onSelectHotspot && onSelectHotspot(null)}
              onViewFingerprint={onViewFingerprint}
              onInvestigateEvent={onInvestigateEvent}
            />
          ) : selectedCluster ? (
            <ClusterCard
              cluster={selectedCluster}
              onClose={() => onSelectCluster && onSelectCluster(null)}
              onViewFingerprint={onViewFingerprint}
              onInvestigateEvent={onInvestigateEvent}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
