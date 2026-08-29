import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { TAXONOMY_COLORS, THERMAL_GRADIENT } from '../constants/taxonomy';

export function MapView({
  hotspots = [],
  clusters = [],
  alerts = [],
  mapMode = 'hybrid', // 'standard' | 'thermal' | 'hybrid'
  regionConfig,
  selectedHotspot,
  activeRoute,
  onSelectHotspot,
  onSelectCluster,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef([]);
  const clustersLayerRef = useRef([]);
  const alertsLayerRef = useRef([]);
  const routeLayersRef = useRef([]);
  const heatLayerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: regionConfig?.center || [22.5, 78.5],
      zoom: regionConfig?.zoom || 5,
      zoomControl: false,
    });

    // Dark Tile Layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; NASA FIRMS &copy; OpenRouteService',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Reposition zoom controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Region Pan/Zoom
  useEffect(() => {
    if (!mapInstanceRef.current || !regionConfig) return;
    if (activeRoute) return; // Don't override route zoom
    mapInstanceRef.current.flyTo(regionConfig.center, regionConfig.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [regionConfig, activeRoute]);

  // Render Overlays according to mapMode and telemetry
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

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // 2. Render Heatmap Layer (Thermal & Hybrid modes)
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

    // 3. Render Cluster Boundaries (Standard & Hybrid modes)
    if (mapMode === 'standard' || mapMode === 'hybrid') {
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

        circle.on('click', () => onSelectCluster && onSelectCluster(cluster));
        clustersLayerRef.current.push(circle);
      });
    }

    // 4. Render Hotspot Markers (Standard & Hybrid modes)
    if (mapMode === 'standard' || mapMode === 'hybrid') {
      hotspots.forEach((hotspot) => {
        const isSpike = hotspot.classification === 'INDUSTRIAL_FIRE' || (hotspot.frp >= 90);
        const color = TAXONOMY_COLORS[hotspot.classification] || '#94a3b8';

        const reasonsHtml = (hotspot.reasons || [hotspot.explanation || ''])
          .map((r) => `<li style="margin-bottom:2px;"><span style="color:#38bdf8;">✓</span> ${r}</li>`)
          .join('');

        const popupContent = `
          <div style="font-family:system-ui, sans-serif; font-size:12px; line-height:1.4; min-width:230px; max-width:280px; color:#f8fafc;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">
              <strong style="color:${color}; font-size:13px;">${hotspot.classification}</strong>
              <span style="font-size:10px; font-weight:700; background:rgba(56,189,248,0.2); color:#38bdf8; padding:2px 6px; border-radius:4px;">
                ${hotspot.confidence_level || 'HIGH'} CONF
              </span>
            </div>
            <div><strong>Asset / Area:</strong> ${hotspot.facility_name || hotspot.land_context || 'Agrarian / Wildland'}</div>
            <div><strong>Radiance:</strong> ${hotspot.frp} MW ${hotspot.brightness_temp ? `(${hotspot.brightness_temp} K)` : ''}</div>
            <div><strong>Persistence:</strong> ${hotspot.active_days || 1} observation day(s)</div>
            <div style="margin-top:6px; background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:6px 8px;">
              <strong style="font-size:11px; color:#cbd5e1; display:block; margin-bottom:3px;">Why Classified:</strong>
              <ul style="margin:0; padding-left:12px; font-size:11px; color:#94a3b8;">
                ${reasonsHtml}
              </ul>
            </div>
          </div>
        `;

        const marker = L.circleMarker([hotspot.latitude, hotspot.longitude], {
          radius: isSpike ? 9 : (hotspot.classification === 'GAS_FLARE' || hotspot.classification === 'PERSISTENT_INDUSTRIAL' ? 7 : 5),
          color: isSpike ? '#ffffff' : color,
          fillColor: color,
          fillOpacity: mapMode === 'hybrid' ? 0.95 : 0.85,
          weight: isSpike ? 2 : 1.2,
        })
          .addTo(map)
          .bindPopup(popupContent)
          .on('click', () => onSelectHotspot && onSelectHotspot(hotspot));

        markersLayerRef.current.push(marker);
      });
    }

    // 5. Render Anomaly Spikes Pulse Icons
    alerts.forEach((alt) => {
      const anomalyIcon = L.divIcon({
        className: '',
        html: '<div class="anomaly-marker-dot"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const alertMarker = L.marker([alt.latitude, alt.longitude], { icon: anomalyIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:system-ui, sans-serif; font-size:12px; min-width:220px; color:#f8fafc;">
            <strong style="color:#ef4444; font-size:13px;">CRITICAL THERMAL SPIKE</strong><br/>
            <strong>Facility:</strong> ${alt.facility_name}<br/>
            <strong>Current FRP:</strong> ${alt.current_frp} MW (Z-Score: +${alt.z_score}σ)<br/>
            <strong>Normal Baseline:</strong> ${alt.baseline_mean_frp} MW<br/>
            <p style="margin-top:4px; font-size:11px; color:#fca5a5;">${alt.recommendation}</p>
          </div>
        `);

      alertsLayerRef.current.push(alertMarker);
    });

  }, [hotspots, clusters, alerts, mapMode]);

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

    // Origin Fire Station Marker
    const depot = activeRoute.origin_depot;
    let depotMarker = null;
    if (depot) {
      const depotIcon = L.divIcon({
        className: '',
        html: '<div style="background:#f59e0b; color:#000; padding:2px 6px; border-radius:6px; font-weight:bold; font-size:10px; border:1px solid #fff; box-shadow:0 4px 12px rgba(0,0,0,0.5);">🚒 BASE</div>',
        iconSize: [50, 20],
        iconAnchor: [25, 10],
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
    </div>
  );
}
