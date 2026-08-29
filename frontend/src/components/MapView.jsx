import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { TAXONOMY_COLORS, THERMAL_GRADIENT, FFDR_COLORS } from '../constants/taxonomy';

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
  onSelectHotspot,
  onSelectCluster,
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

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

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
    if (activeRoute) return; // Don't override route zoom
    mapInstanceRef.current.flyTo(regionConfig.center, regionConfig.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [regionConfig, activeRoute]);

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

          const popupContent = `
            <div style="font-family:system-ui, sans-serif; font-size:12px; line-height:1.45; min-width:250px; max-width:300px; color:#f8fafc;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">
                <strong style="color:${color}; font-size:13px;">${risk.toUpperCase()} FIRE RISK</strong>
                <span style="font-size:9px; font-weight:700; background:rgba(34,197,94,0.2); color:#4ade80; padding:2px 6px; border-radius:4px; border:1px solid rgba(34,197,94,0.4);">
                  FSI FFDR GRID
                </span>
              </div>
              <div style="margin-bottom:2px;"><strong>Forest Reserve:</strong> ${p.forest_name || 'Forest Area'}</div>
              <div style="margin-bottom:2px;"><strong>Division:</strong> ${p.forest_division || 'Division'} (${p.state || 'India'})</div>
              <div style="margin-bottom:2px;"><strong>Fire Weather Index:</strong> <span style="font-family:monospace; color:#fbbf24; font-weight:bold;">${p.fwi_score || 'N/A'}</span></div>
              <div style="margin-bottom:4px; font-size:11px; color:#94a3b8;"><strong>Validity:</strong> ${p.validity_window || 'Weekly Pre-Fire Bulletin'}</div>
              <div style="margin-top:6px; background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:6px 8px; font-size:10.5px; color:#cbd5e1;">
                <strong style="display:block; color:#38bdf8; margin-bottom:2px;">Source: Forest Survey of India</strong>
                <span>${p.context_note || 'Pre-fire vulnerability indicator (Not an active fire ignition without thermal detection).'}</span>
              </div>
            </div>
          `;
          layer.bindPopup(popupContent);
        },
      }).addTo(map);
    }

    // 3. Render Contextual Temporary Safety Resources (Only when toggled by analyst for active incident)
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

        marker.bindPopup(`
          <div style="font-family:system-ui, sans-serif; font-size:12px; line-height:1.4; min-width:220px; color:#f8fafc;">
            <div style="font-weight:bold; font-size:13px; color:${color}; margin-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:3px;">
              ${res.name}
            </div>
            <div><strong>Type:</strong> ${typeLabel}</div>
            <div><strong>Location:</strong> ${res.district || ''}, ${res.state || ''}</div>
            <div><strong>Contact:</strong> ${res.contact || '112'}</div>
            ${res.distance_km ? `<div><strong>Distance:</strong> ${res.distance_km} km (ETA: ${res.estimated_travel_time_mins || '-'} min)</div>` : ''}
            <div style="margin-top:4px; font-size:10px; color:#94a3b8;">Source: ${res.source || 'State Disaster Plan'}</div>
          </div>
        `);

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

        circle.on('click', () => onSelectCluster && onSelectCluster(cluster));
        clustersLayerRef.current.push(circle);
      });
    }

    // 6. Render Hotspot Markers (Standard, Hybrid & Forest Risk modes)
    if (mapMode === 'standard' || mapMode === 'hybrid' || mapMode === 'forest_risk') {
      hotspots.forEach((hotspot) => {
        const isSpike = hotspot.classification === 'INDUSTRIAL_FIRE' || (hotspot.frp >= 90);
        const color = TAXONOMY_COLORS[hotspot.classification] || '#94a3b8';

        const reasonsHtml = (hotspot.reasons || [hotspot.explanation || ''])
          .map((r) => `<li style="margin-bottom:2px;"><span style="color:#38bdf8;">✓</span> ${r}</li>`)
          .join('');

        const isFsiDemo = hotspot.source === 'DEMO_FSI';
        const popupContent = `
          <div style="font-family:system-ui, sans-serif; font-size:12px; line-height:1.4; min-width:240px; max-width:290px; color:#f8fafc;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">
              <strong style="color:${color}; font-size:13px;">${hotspot.classification}</strong>
              <div style="display:flex; gap:4px; align-items:center;">
                ${isFsiDemo ? '<span style="font-size:9px; font-weight:700; background:rgba(245,158,11,0.25); color:#fbbf24; padding:1px 5px; border-radius:3px; border:1px solid rgba(245,158,11,0.4);">DEMO FSI</span>' : ''}
                <span style="font-size:10px; font-weight:700; background:rgba(56,189,248,0.2); color:#38bdf8; padding:2px 6px; border-radius:4px;">
                  ${hotspot.confidence_level || 'HIGH'} CONF
                </span>
              </div>
            </div>
            ${hotspot.fire_danger_level ? `<div style="color:#fbbf24; font-weight:600; font-size:11px; margin-bottom:2px;">FSI Danger Index: ${hotspot.fire_danger_level}</div>` : ''}
            <div><strong>Location:</strong> ${hotspot.forest_name || hotspot.facility_name || hotspot.land_context || 'Forest / Wildland'} ${hotspot.state ? `(${hotspot.state})` : ''}</div>
            <div><strong>Radiance:</strong> ${hotspot.frp} MW ${hotspot.brightness_temp ? `(${hotspot.brightness_temp} K)` : ''}</div>
            <div><strong>Status:</strong> ${hotspot.fire_status || (hotspot.active_days ? `${hotspot.active_days} observation day(s)` : 'Active Pass')}</div>
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
        .bindPopup(`
          <div style="font-family:system-ui, sans-serif; font-size:12px; min-width:220px; color:#f8fafc;">
            <strong style="color:#ef4444; font-size:13px;">CRITICAL THERMAL SPIKE</strong><br/>
            <strong>Facility:</strong> ${alt.facility_name}<br/>
            <strong>Current FRP:</strong> ${alt.current_frp} MW (Z-Score: +${alt.z_score}σ)<br/>
            <strong>Normal Baseline:</strong> ${alt.baseline_mean_frp} MW<br/>
            <p style="margin-top:4px; font-size:11px; color:#fca5a5;">${alt.recommendation}</p>
          </div>
        `)
        .on('click', () => onSelectHotspot && onSelectHotspot(alt));

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
    </div>
  );
}
