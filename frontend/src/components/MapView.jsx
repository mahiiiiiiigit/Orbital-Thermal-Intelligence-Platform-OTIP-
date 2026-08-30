import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

if (typeof window !== 'undefined') {
  window.L = L;
}

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

  // Dynamic Map-Anchored Overlay Position State
  const [popupPos, setPopupPos] = useState(null);

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialMap = L.map(mapContainerRef.current, {
      center: regionConfig?.center || [22.5, 78.5],
      zoom: regionConfig?.zoom || 5,
      zoomControl: false,
    });

    // Reposition zoom controls to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(initialMap);

    // Map canvas click closes selected hotspot popup
    initialMap.on('click', () => {
      if (onSelectHotspot) {
        onSelectHotspot(null);
      }
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

  // 2. Manage Dynamic Base Tile Layer (CARTO Dark / Voyager)
  useEffect(() => {
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
  }, [map, theme]);

  // 3. Manage Region Pan/Zoom Navigation
  useEffect(() => {
    if (!map || !regionConfig) return;
    if (activeRoute || selectedHotspot) return; // Don't override active incident focus
    map.flyTo(regionConfig.center, regionConfig.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [map, regionConfig, activeRoute, selectedHotspot]);

  // 4. Compute Smart Map-Anchored Popup Position (Zero-Clipping Calculation)
  const updatePopupPosition = useCallback(() => {
    if (!map || !selectedHotspot || selectedHotspot.latitude == null || selectedHotspot.longitude == null) {
      setPopupPos(null);
      return;
    }

    const container = mapContainerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const point = map.latLngToContainerPoint([selectedHotspot.latitude, selectedHotspot.longitude]);

    const cardEl = cardRef.current;
    const cardWidth = cardEl ? cardEl.offsetWidth : 370;
    const cardHeight = cardEl ? cardEl.offsetHeight : 440;

    const MARGIN = 16;
    const PIN_OFFSET = 12;

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

    // Marker visibility check
    const isVisible = (
      point.x >= -cardWidth &&
      point.x <= containerWidth + cardWidth &&
      point.y >= -cardHeight &&
      point.y <= containerHeight + cardHeight
    );

    setPopupPos({
      left,
      top,
      isAbove,
      arrowLeft,
      markerX: point.x,
      markerY: point.y,
      isVisible,
    });
  }, [map, selectedHotspot]);

  // Sync Popup Position on selection change and auto-pan if marker is near edge
  useEffect(() => {
    if (!map || !selectedHotspot) {
      setPopupPos(null);
      return;
    }

    updatePopupPosition();

    // Auto-pan slightly if marker is too close to container boundary
    const container = mapContainerRef.current;
    if (container) {
      const pt = map.latLngToContainerPoint([selectedHotspot.latitude, selectedHotspot.longitude]);
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
    }
  }, [map, selectedHotspot, updatePopupPosition]);

  // Keep Popup position updated during map movement / zoom / resize
  useEffect(() => {
    if (!map || !selectedHotspot) return;

    const handleMapMovement = () => {
      updatePopupPosition();
    };

    map.on('move zoom viewreset resize', handleMapMovement);

    // Watch for card size changes (e.g. expanding emergency response or breakdown sections)
    let cardResizeObs = null;
    if (window.ResizeObserver && cardRef.current) {
      cardResizeObs = new ResizeObserver(() => {
        updatePopupPosition();
      });
      cardResizeObs.observe(cardRef.current);
    }

    return () => {
      map.off('move zoom viewreset resize', handleMapMovement);
      if (cardResizeObs) cardResizeObs.disconnect();
    };
  }, [map, selectedHotspot, updatePopupPosition]);

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

    // Render Cluster Boundaries (Standard, Hybrid & Forest Risk modes)
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

    // Render Hotspot Markers (Standard, Hybrid & Forest Risk modes)
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
          L.DomEvent.stopPropagation(e);
          if (onSelectHotspot) onSelectHotspot(alt);
        });

      alertsLayerRef.current.push(alertMarker);
    });

  }, [map, hotspots, clusters, alerts, ffdrGrid, temporarySafetyResources, mapMode]);

  // 6. Render Active Emergency Dispatch Route Polyline
  useEffect(() => {
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

  }, [map, activeRoute]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map-Anchored Smart Overlay Detail Card */}
      {selectedHotspot && popupPos && popupPos.isVisible && (
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
              className="absolute -bottom-2 w-3.5 h-3.5 bg-white/95 dark:bg-dark-850/95 border-r border-b border-slate-300 dark:border-slate-700/80 transform rotate-45 pointer-events-none shadow-md"
              style={{ left: `${popupPos.arrowLeft - 7}px` }}
            />
          ) : (
            <div
              className="absolute -top-2 w-3.5 h-3.5 bg-white/95 dark:bg-dark-850/95 border-l border-t border-slate-300 dark:border-slate-700/80 transform rotate-45 pointer-events-none shadow-md"
              style={{ left: `${popupPos.arrowLeft - 7}px` }}
            />
          )}

          <HotspotCard
            hotspot={selectedHotspot}
            activeRoute={activeRoute}
            onSetRoute={onSetRoute}
            onShowTemporaryResources={onShowTemporaryResources}
            showingTemporaryResources={showingTemporaryResources}
            onClose={() => onSelectHotspot && onSelectHotspot(null)}
            onViewFingerprint={onViewFingerprint}
          />
        </div>
      )}
    </div>
  );
}
