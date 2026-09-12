import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function AlertMapPreview({ selectedAlert, allAlerts = [] }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const allMarkersLayerRef = useRef([]);

  const lat = selectedAlert?.latitude || selectedAlert?.lat || 20.5937;
  const lon = selectedAlert?.longitude || selectedAlert?.lon || 78.9629;
  const severity = (selectedAlert?.severity || selectedAlert?.risk_level || 'critical').toLowerCase();
  const isCritical = severity === 'critical';
  const color = isCritical ? '#ef4444' : (severity === 'high' ? '#f97316' : '#eab308');

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 9,
        zoomControl: false,
        attributionControl: false,
      });

      const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 18,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update center, marker, and radius when selected alert changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous single active markers
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    // Pan map smoothly to selected alert
    map.flyTo([lat, lon], 10, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    // 1. Radar pulse perimeter circle (3.5km hazard radius)
    circleRef.current = L.circle([lat, lon], {
      radius: 3500,
      color: color,
      fillColor: color,
      fillOpacity: 0.12,
      weight: 1.8,
      dashArray: '4, 6',
    }).addTo(map);

    // 2. Custom pulsing HTML Marker
    const iconHtml = `
      <div style="position: relative; width: 24px; height: 24px; display: flex; items-center: center; justify-content: center;">
        <div style="position: absolute; inset: -6px; border-radius: 9999px; background: ${color}; opacity: 0.6; animation: anomaly-pulse 1.8s infinite;"></div>
        <div style="width: 14px; height: 14px; border-radius: 9999px; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 0 12px ${color}; margin: auto;"></div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'emergency-alert-pin',
      html: iconHtml,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    markerRef.current = L.marker([lat, lon], { icon: customIcon })
      .addTo(map)
      .bindTooltip(
        `<strong>${selectedAlert?.facility_name || 'Thermal Incident'}</strong><br/>${selectedAlert?.current_frp || selectedAlert?.frp || 0} MW • ${severity.toUpperCase()}`,
        { sticky: true, direction: 'top' }
      )
      .openTooltip();

  }, [lat, lon, color, severity, selectedAlert]);

  return (
    <div className="relative w-full h-full min-h-[260px] rounded-xl overflow-hidden border border-dark-700/80 bg-[#0c1119]">
      <div ref={mapContainerRef} className="w-full h-full min-h-[260px]" />

      {/* Map Top-Right Status Badge */}
      <div className="absolute top-3 right-3 z-[400] bg-dark-900/90 border border-dark-700/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300 flex items-center gap-1.5 shadow-lg">
        <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: color }} />
        <span className="font-bold text-white uppercase">{severity} INCIDENT ZONE</span>
      </div>

      {/* Map Bottom-Left Coordinates HUD */}
      <div className="absolute bottom-3 left-3 z-[400] bg-dark-900/90 border border-dark-700/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-400 space-x-2 shadow-lg">
        <span>LOC: <strong className="text-slate-200">{lat.toFixed(4)}° N, {lon.toFixed(4)}° E</strong></span>
        <span>RAD: <strong className="text-orange-400">3.5 km</strong></span>
      </div>
    </div>
  );
}
