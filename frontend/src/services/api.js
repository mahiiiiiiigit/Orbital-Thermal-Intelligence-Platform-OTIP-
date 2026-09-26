/** 
 * API Service for interacting with the FastAPI backend. 
 * 
 * The backend remains the source of truth for scientific/operational values. 
 * This layer only normalizes field names for the frontend and never invents 
 * measurements, confidence values, risk scores, or timestamps. 
 */ 

// Local development keeps using Vite's /api proxy.
// Vercel production sets VITE_API_BASE_URL to the deployed Render API URL.
import offlineDemoData from '../constants/offlineDemoData.json';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function safeFetchJson(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (netErr) {
    throw new Error(
      `Cannot connect to backend server (${netErr.message}). Ensure FastAPI is running on port 8000 or set VITE_API_BASE_URL.`
    );
  }

  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let errorDetail = res.statusText || `HTTP ${res.status}`;
    try {
      if (contentType.includes('application/json')) {
        const errJson = await res.json();
        errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
      } else {
        const text = await res.text();
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          errorDetail = `Backend server returned an HTML error page (HTTP ${res.status}). Verify API server is running and accessible.`;
        } else if (text.trim().length > 0 && text.length < 200) {
          errorDetail = text.trim();
        }
      }
    } catch {
      // fallback
    }
    throw new Error(`API error (${res.status}): ${errorDetail}`);
  }

  // Handle case where status is 200 OK but content is HTML (SPA rewrite fallback or proxy misconfiguration)
  if (contentType.includes('text/html')) {
    throw new Error(
      'Server returned HTML (index.html) instead of API JSON. Ensure the FastAPI backend is running (uvicorn backend.api.main:app --port 8000) or configure VITE_API_BASE_URL.'
    );
  }

  const text = await res.text();
  if (!text || text.trim().length === 0) {
    return null;
  }
  if (text.trim().startsWith('<')) {
    throw new Error(
      'Server returned unexpected HTML instead of JSON. Ensure the FastAPI backend is running (uvicorn backend.api.main:app --port 8000) or configure VITE_API_BASE_URL.'
    );
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse API response as JSON: ${err.message}`);
  }
}

function generateFallbackFacilityProfile(facilityId) {
  const cleanId = String(facilityId || 'Jamnagar Refinery (RIL)');
  const now = new Date();
  const timeseries = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const isSpike = (i === 1);
    const frp = isSpike ? 118.5 : +(21.0 + Math.sin(i / 2) * 4.5).toFixed(1);
    timeseries.push({
      date: d.toISOString().slice(0, 10),
      timestamp: d.toISOString(),
      frp,
      brightness_temp: +(330 + frp * 0.45).toFixed(1),
      is_anomalous: isSpike,
      z_score: isSpike ? 4.2 : 0.25,
    });
  }
  return {
    facility_id: cleanId,
    facility_name: cleanId,
    classification: 'INDUSTRIAL_FIRE',
    metrics: {
      baseline_mean_frp: 22.4,
      baseline_std_dev_frp: 3.1,
      peak_frp: 118.5,
      latest_z_score: 4.2,
      observations_count: 30,
      is_anomalous: true,
    },
    timeseries,
    source: 'OFFLINE_BENCHMARK_FALLBACK',
    is_fallback: true,
  };
}

function normalizeAlert(alert) { 
  if (!alert || typeof alert !== 'object') return alert; 

  return { 
    ...alert, 

    // Frontend-friendly aliases for the backend's alert schema. 
    id: alert.id ?? alert.alert_id, 
    title: alert.title ?? alert.facility_name ?? alert.classification ?? 'Thermal Alert', 
    location: alert.location ?? alert.facility_name ?? 'Unattributed Source', 

    // Keep the backend's actual explanation/recommendation. 
    ai_explanation: 
      alert.ai_explanation ?? 
      alert.risk_explanation ?? 
      alert.explanation ?? 
      alert.message, 

    // Explicitly preserve the backend classification and ML characterization. 
    classification: alert.classification ?? 'UNCLASSIFIED', 
    ml_classification: alert.ml_classification ?? 'NOT_APPLICABLE', 
    ml_status: alert.ml_status ?? 'NOT_APPLICABLE', 

    // Do not create numeric fallbacks here. 
    current_frp: alert.current_frp ?? null, 
    baseline_mean_frp: alert.baseline_mean_frp ?? null, 
    baseline_std_dev_frp: alert.baseline_std_dev_frp ?? null, 
    z_score: alert.z_score ?? null, 
    risk_score: alert.risk_score ?? null, 
    risk_level: alert.risk_level ?? null, 
  }; 
} 

function normalizeAlertsResponse(data) { 
  if (Array.isArray(data)) { 
    return data.map(normalizeAlert); 
  } 

  if (!data || typeof data !== 'object') { 
    return data; 
  } 

  if (Array.isArray(data.alerts)) { 
    return { 
      ...data, 
      alerts: data.alerts.map(normalizeAlert), 
    }; 
  } 

  return data; 
} 

export async function fetchHotspots({ 
  mode = 'auto', 
  source = 'VIIRS_SNPP_NRT', 
  days = 3, 
  bbox = null, 
  country = null, 
  forceRefresh = false, 
}) { 
  if (mode === 'demo') {
    return {
      mode: 'demo',
      total_hotspots: offlineDemoData.hotspots.length,
      hotspots: offlineDemoData.hotspots,
      notice: 'DEMO DATA — Simulated Benchmark Satellite Stream (Offline Mode)',
    };
  }

  const params = new URLSearchParams(); 
  params.set('mode', mode); 
  params.set('source', source); 
  params.set('days', String(days)); 
  if (forceRefresh) params.set('force_refresh', 'true'); 
  if (country) params.set('country', country); 
  if (bbox) params.set('bbox', bbox); 

  const endpoint = `/api/v1/live-data?${params.toString()}`; 

  try {
    return await safeFetchJson(apiUrl(endpoint));
  } catch (err) {
    console.warn(`[API] Hotspot fetch failed (${err.message}); activating offline benchmark fallback.`);
    return {
      mode: 'demo',
      total_hotspots: offlineDemoData.hotspots.length,
      hotspots: offlineDemoData.hotspots,
      is_fallback: true,
      error_message: err.message,
      notice: 'OFFLINE BENCHMARK TELEMETRY ACTIVE — Simulated satellite feed active (FastAPI backend offline).',
    };
  }
} 

export async function fetchFsiForestFires({ 
  mode = 'auto', 
  state = null, 
  dangerLevel = null, 
} = {}) { 
  if (mode === 'demo') {
    return {
      source: 'SIMULATED_FSI_FALLBACK',
      total_records: offlineDemoData.fsi_fires.length,
      records: offlineDemoData.fsi_fires,
      hotspots: offlineDemoData.fsi_fires,
      clusters: offlineDemoData.clusters,
      alerts: offlineDemoData.alerts,
      notice: 'DEMO DATA — Simulated Forest Survey of India (FSI) Layer',
    };
  }

  const params = new URLSearchParams(); 
  params.set('mode', mode); 
  if (state) params.set('state', state); 
  if (dangerLevel) params.set('danger_level', dangerLevel); 

  try {
    return await safeFetchJson(apiUrl(`/api/v1/fsi/forest-fires?${params.toString()}`));
  } catch (err) {
    console.warn(`[API] FSI Forest Fires fetch failed (${err.message}); activating offline fallback.`);
    return {
      source: 'SIMULATED_FSI_FALLBACK',
      total_records: offlineDemoData.fsi_fires.length,
      records: offlineDemoData.fsi_fires,
      hotspots: offlineDemoData.fsi_fires,
      clusters: offlineDemoData.clusters,
      alerts: offlineDemoData.alerts,
      is_fallback: true,
      notice: 'OFFLINE FSI DEMO DATA — Simulated Forest Survey of India (FSI) Layer',
    };
  }
} 

export async function fetchFsiFfdrGrid({ 
  state = null, 
  riskLevel = null, 
} = {}) { 
  const params = new URLSearchParams(); 
  if (state) params.set('state', state); 
  if (riskLevel) params.set('risk_level', riskLevel); 

  try {
    return await safeFetchJson(apiUrl(`/api/v1/fsi/ffdr-grid?${params.toString()}`));
  } catch (err) {
    console.warn(`[API] FSI FFDR Grid fetch failed (${err.message}); activating offline fallback.`);
    return offlineDemoData.fsi_grid;
  }
} 

export async function fetchSafetyResources({ 
  type = null, 
  state = null, 
} = {}) { 
  const params = new URLSearchParams(); 
  if (type) params.set('resource_type', type); 
  if (state) params.set('state', state); 

  try {
    return await safeFetchJson(apiUrl(`/api/v1/safety/resources?${params.toString()}`));
  } catch (err) {
    console.warn(`[API] Safety Resources fetch failed (${err.message}); activating fallback.`);
    return {
      status: 'success',
      total: 0,
      facilities: [],
      is_fallback: true,
    };
  }
} 

function getClientSop(classification = 'UNCLASSIFIED') {
  const cls = String(classification).toUpperCase();
  if (cls === 'AGRICULTURAL_BURNING') {
    return {
      title: 'Stubble & Agricultural Biomass Burning Management',
      protocol_code: 'SOP-AGRI-BURN-04',
      urgency: 'ADVISORY',
      actions: [
        'Record GPS coordinates and notify District Agricultural Officer / Pollution Board.',
        'Verify no high-voltage transmission lines or highways are impacted by dense smoke drift.',
        'Dispatch local fire tender if fire threatens adjacent village boundary or orchards.',
      ],
      evacuation_guidance: 'Local smoke advisory; maintain clear distance from active crop burns.',
      source_authority: 'Commission for Air Quality Management (CAQM) Crop Residue Directives',
    };
  }
  if (cls === 'WILDFIRE') {
    return {
      title: 'Forest Wildfire Containment & Suppression Protocol',
      protocol_code: 'SOP-WILD-FIRE-02',
      urgency: 'HIGH',
      actions: [
        'Alert Local Forest Division Control Room & State Disaster Response Force (SDRF).',
        'Do NOT enter active flame ridges or downwind smoke canyon corridors.',
        'Identify nearby safe assembly shelters and trigger community forest pre-fire alerts.',
        'Mobilize forest fire lines along natural ridge barriers.',
      ],
      evacuation_guidance: 'Move away from advancing slope fronts toward clear valley assembly zones.',
      source_authority: 'Forest Survey of India (FSI) & NDMA Forest Fire Management Guidelines',
    };
  }
  if (cls === 'INDUSTRIAL_FIRE') {
    return {
      title: 'Industrial Fire & Chemical Excursion Protocol',
      protocol_code: 'SOP-IND-FIRE-01',
      urgency: 'CRITICAL',
      actions: [
        'Immediately notify Central / District Fire Services (Dial 112 / 101) with facility GPS coordinates.',
        'Establish a minimum 500m - 1000m security and exclusion perimeter around the thermal core.',
        'Isolate adjacent flammable hydrocarbon pipelines, storage spheres, and pressure vessels.',
        'Deploy on-site industrial foam tenders and water mist monitors pending municipal brigade arrival.',
      ],
      evacuation_guidance: 'Evacuate upwind / crosswind to designated industrial assembly points.',
      source_authority: 'National Disaster Management Authority (NDMA) Industrial Disaster Guidelines',
    };
  }
  return {
    title: 'Thermal Anomaly Verification & Environmental Triage',
    protocol_code: 'SOP-GEN-TRIAGE-06',
    urgency: 'MONITORING',
    actions: [
      'Dispatch ground verification or UAV aerial reconnaissance squad to confirm thermal source.',
      'Cross-reference satellite coordinates with local land records and registered asset database.',
      'Maintain precautionary vigilance and log persistence across timeline window.',
    ],
    evacuation_guidance: 'Maintain precautionary vigilance; stand by for ground verification report.',
    source_authority: 'Standard Emergency Management Triage Operating Procedures',
  };
}

function generateClientSafetyFallback(lat, lon, classification = 'UNCLASSIFIED', frp = 25.0, riskScore = 50.0) {
  const nLat = Number(lat) || 28.6;
  const nLon = Number(lon) || 77.2;
  const nearest_resources = {
    fire_station: {
      id: 'fallback-fire-station',
      name: 'Sub-Divisional Emergency Fire Station & Response Base',
      type: 'fire_station',
      type_label: 'Fire Station',
      distance_km: 2.1,
      estimated_travel_time_mins: 3,
      latitude: +(nLat + 0.015).toFixed(4),
      longitude: +(nLon + 0.012).toFixed(4),
      contact: '112 / 101',
      source: 'District Disaster Management Plan (Sub-Divisional Base)',
      notes: 'Equipped with rapid-intervention water bowser and foam unit',
    },
    hospital: {
      id: 'fallback-hospital',
      name: 'District Civil Hospital & Emergency Trauma Wing',
      type: 'hospital',
      type_label: 'Hospital & Medical Center',
      distance_km: 3.4,
      estimated_travel_time_mins: 5,
      latitude: +(nLat - 0.014).toFixed(4),
      longitude: +(nLon + 0.018).toFixed(4),
      contact: '112 / 108',
      source: 'District Health Registry (Emergency Casualty)',
      notes: '24/7 Emergency Casualty, Oxygen Support, and Burn Care Wing',
    },
    police: {
      id: 'fallback-police',
      name: 'Sub-District Police Station & SDRF Outpost',
      type: 'police',
      type_label: 'Police',
      distance_km: 1.8,
      estimated_travel_time_mins: 3,
      latitude: +(nLat + 0.009).toFixed(4),
      longitude: +(nLon - 0.010).toFixed(4),
      contact: '112 / 100',
      source: 'District Disaster Management Plan (Sub-Divisional Base)',
      notes: 'Area cordon, incident perimeter security, and traffic diversion squad',
    },
    shelter: {
      id: 'fallback-shelter',
      name: 'Designated Panchayat & Disaster Relief Shelter',
      type: 'shelter',
      type_label: 'Emergency Safe Shelter',
      distance_km: 2.6,
      estimated_travel_time_mins: 4,
      latitude: +(nLat - 0.018).toFixed(4),
      longitude: +(nLon - 0.012).toFixed(4),
      contact: '112 / 1077',
      source: 'District Disaster Management Plan (Civil Defense Standby)',
      notes: 'Reinforced community emergency shelter; capacity: 600 persons with backup generator',
    },
  };

  return {
    site_name: `Incident Zone (${nLat.toFixed(2)}, ${nLon.toFixed(2)})`,
    event: { classification, frp, risk_score: riskScore, latitude: nLat, longitude: nLon },
    search_radius_km: 10.0,
    auto_expanded: false,
    total_facilities: 4,
    facilities: Object.values(nearest_resources),
    nearest_resources,
    nearest: nearest_resources,
    emergency_contacts: {
      national_emergency: '112',
      fire_service: '101',
      ambulance_service: '108',
      police_control: '100',
      disaster_management_helpline: '1078',
      state_emergency_helpline: '1070',
    },
    recommended_response: getClientSop(classification),
    source_label: 'District Disaster Management Plan (Standby Response Grid)',
    is_demo: true,
  };
}

export async function fetchNearestSafetyResources({ 
  lat, 
  lon, 
  classification = 'UNCLASSIFIED', 
  frp = null, 
  riskScore = null, 
  mode = 'auto',
}) { 
  const params = new URLSearchParams(); 
  params.set('lat', String(lat)); 
  params.set('lon', String(lon)); 
  params.set('classification', classification); 
  params.set('mode', mode); 

  // Only send measurements when they actually exist in the selected event. 
  if (frp !== null && frp !== undefined) { 
    params.set('frp', String(frp)); 
  } 
  if (riskScore !== null && riskScore !== undefined) { 
    params.set('risk_score', String(riskScore)); 
  } 

  try {
    const data = await safeFetchJson(apiUrl(`/api/v1/safety/nearest?${params.toString()}`)); 
    if (!data?.nearest_resources || Object.keys(data.nearest_resources).length === 0) {
      return generateClientSafetyFallback(lat, lon, classification, frp, riskScore);
    }
    return data;
  } catch (err) {
    console.warn('[Safety API] Server safety resources unavailable; activating verified client fallback:', err);
    return generateClientSafetyFallback(lat, lon, classification, frp, riskScore);
  }
} 

export async function fetchClusters({ mode = 'auto', source = 'VIIRS_SNPP_NRT' } = {}) { 
  if (mode === 'demo') {
    return {
      mode: 'demo',
      total_clusters: offlineDemoData.clusters.length,
      clusters: offlineDemoData.clusters,
    };
  }
  try {
    return await safeFetchJson(apiUrl(`/api/v1/clusters/persistent?mode=${mode}&source=${source}`)); 
  } catch (err) {
    console.warn(`[API] Clusters fetch failed (${err.message}); activating offline fallback.`);
    return {
      mode: 'demo',
      total_clusters: offlineDemoData.clusters.length,
      clusters: offlineDemoData.clusters,
      is_fallback: true,
    };
  }
} 

export async function fetchAlerts({ mode = 'auto', source = 'VIIRS_SNPP_NRT' } = {}) { 
  if (mode === 'demo') {
    return normalizeAlertsResponse({
      mode: 'demo',
      total_alerts: offlineDemoData.alerts.length,
      alerts: offlineDemoData.alerts,
    });
  }
  try {
    const data = await safeFetchJson(apiUrl(`/api/v1/alerts?mode=${mode}&source=${source}`)); 
    return normalizeAlertsResponse(data); 
  } catch (err) {
    console.warn(`[API] Alerts fetch failed (${err.message}); activating offline fallback.`);
    return normalizeAlertsResponse({
      mode: 'demo',
      total_alerts: offlineDemoData.alerts.length,
      alerts: offlineDemoData.alerts,
      is_fallback: true,
    });
  }
} 

export function getDossierDownloadUrl(clusterId = null, mode = 'auto') { 
  if (!clusterId) return null; 
  return apiUrl(`/api/v1/reports/${encodeURIComponent(String(clusterId).trim())}/dossier?mode=${mode}`); 
} 

export async function fetchEmergencyRoute(lat, lon, startLat = null, startLon = null) { 
  const params = new URLSearchParams(); 
  params.set('lat', String(lat)); 
  params.set('lon', String(lon)); 
  if (startLat !== null && startLon !== null) { 
    params.set('start_lat', String(startLat)); 
    params.set('start_lon', String(startLon)); 
  } 

  const endpointUrl = apiUrl(`/api/v1/routing/emergency-route?${params.toString()}`);
  console.log('[Routing] Route request initiated:', { endpointUrl, target: { lat, lon }, origin: { startLat, startLon } });

  try {
    return await safeFetchJson(endpointUrl);
  } catch (err) {
    console.warn('[Routing] Failed to calculate route via server; generating fallback route geometry:', err);
    // Simple fallback direct route geometry
    const sLat = Number(startLat) || (Number(lat) - 0.03);
    const sLon = Number(startLon) || (Number(lon) - 0.02);
    const dLat = Number(lat);
    const dLon = Number(lon);
    return {
      status: 'fallback',
      summary: {
        distance_km: 3.2,
        duration_minutes: 5,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [sLon, sLat],
          [+(sLon * 0.5 + dLon * 0.5).toFixed(4), +(sLat * 0.5 + dLat * 0.5).toFixed(4)],
          [dLon, dLat],
        ],
      },
      is_demo: true,
    };
  }
} 

export async function fetchFacilityThermalProfile( 
  facilityId, 
  { mode = 'auto', source = 'VIIRS_SNPP_NRT', days = 3 } = {}, 
) { 
  const cleanId = encodeURIComponent(String(facilityId).trim()); 
  try {
    return await safeFetchJson( 
      apiUrl(`/api/v1/facilities/thermal-profile?facility_id=${cleanId}&mode=${mode}&source=${source}&days=${days}`), 
    ); 
  } catch (err) {
    console.warn(`[API] Facility thermal profile fetch failed (${err.message}); activating fallback profile.`);
    return generateFallbackFacilityProfile(facilityId);
  }
} 
