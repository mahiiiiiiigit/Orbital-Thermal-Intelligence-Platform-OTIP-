/** 
 * API Service for interacting with the FastAPI backend. 
 * 
 * The backend remains the source of truth for scientific/operational values. 
 * This layer only normalizes field names for the frontend and never invents 
 * measurements, confidence values, risk scores, or timestamps. 
 */ 

// Local development keeps using Vite's /api proxy.
// Vercel production sets VITE_API_BASE_URL to the deployed Render API URL.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
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
  const params = new URLSearchParams(); 
  params.set('mode', mode); 
  params.set('source', source); 
  params.set('days', String(days)); 
  if (forceRefresh) params.set('force_refresh', 'true'); 
  if (country) params.set('country', country); 
  if (bbox) params.set('bbox', bbox); 

  const endpoint = mode === 'demo' 
    ? '/api/v1/demo/offline-data' 
    : `/api/v1/live-data?${params.toString()}`; 

  const res = await fetch(apiUrl(endpoint)); 
  if (!res.ok) { 
    throw new Error(`API error (${res.status}): ${res.statusText}`); 
  } 
  return res.json(); 
} 

export async function fetchFsiForestFires({ 
  mode = 'auto', 
  state = null, 
  dangerLevel = null, 
} = {}) { 
  const params = new URLSearchParams(); 
  params.set('mode', mode); 
  if (state) params.set('state', state); 
  if (dangerLevel) params.set('danger_level', dangerLevel); 

  const res = await fetch(apiUrl(`/api/v1/fsi/forest-fires?${params.toString()}`)); 
  if (!res.ok) { 
    throw new Error(`FSI API error (${res.status}): ${res.statusText}`); 
  } 
  return res.json(); 
} 

export async function fetchFsiFfdrGrid({ 
  state = null, 
  riskLevel = null, 
} = {}) { 
  const params = new URLSearchParams(); 
  if (state) params.set('state', state); 
  if (riskLevel) params.set('risk_level', riskLevel); 

  const res = await fetch(apiUrl(`/api/v1/fsi/ffdr-grid?${params.toString()}`)); 
  if (!res.ok) { 
    throw new Error(`FSI FFDR Grid error (${res.status}): ${res.statusText}`); 
  } 
  return res.json(); 
} 

export async function fetchSafetyResources({ 
  type = null, 
  state = null, 
} = {}) { 
  const params = new URLSearchParams(); 
  if (type) params.set('resource_type', type); 
  if (state) params.set('state', state); 

  const res = await fetch(apiUrl(`/api/v1/safety/resources?${params.toString()}`)); 
  if (!res.ok) { 
    throw new Error(`Safety Resources API error (${res.status}): ${res.statusText}`); 
  } 
  return res.json(); 
} 

export async function fetchNearestSafetyResources({ 
  lat, 
  lon, 
  classification = 'UNCLASSIFIED', 
  frp = null, 
  riskScore = null, 
}) { 
  const params = new URLSearchParams(); 
  params.set('lat', String(lat)); 
  params.set('lon', String(lon)); 
  params.set('classification', classification); 

  // Only send measurements when they actually exist in the selected event. 
  if (frp !== null && frp !== undefined) { 
    params.set('frp', String(frp)); 
  } 
  if (riskScore !== null && riskScore !== undefined) { 
    params.set('risk_score', String(riskScore)); 
  } 

  const res = await fetch(apiUrl(`/api/v1/safety/nearest?${params.toString()}`)); 
  if (!res.ok) { 
    throw new Error(`Nearest Safety API error (${res.status}): ${res.statusText}`); 
  } 
  return res.json(); 
} 

export async function fetchClusters({ mode = 'auto', source = 'VIIRS_SNPP_NRT' } = {}) { 
  const res = await fetch(apiUrl(`/api/v1/clusters/persistent?mode=${mode}&source=${source}`)); 
  if (!res.ok) { 
    throw new Error(`Failed to load clusters (${res.status})`); 
  } 
  return res.json(); 
} 

export async function fetchAlerts({ mode = 'auto', source = 'VIIRS_SNPP_NRT' } = {}) { 
  const res = await fetch(apiUrl(`/api/v1/alerts?mode=${mode}&source=${source}`)); 
  if (!res.ok) { 
    throw new Error(`Failed to load alerts (${res.status})`); 
  } 
  return normalizeAlertsResponse(await res.json()); 
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

  const res = await fetch(endpointUrl); 
  if (!res.ok) { 
    console.error(`[Routing] API request failed with status: ${res.status}`);
    throw new Error(`Failed to calculate emergency dispatch route (${res.status})`); 
  } 
  const data = await res.json();
  console.log('[Routing] Route response received:', data);
  return data; 
} 

export async function fetchFacilityThermalProfile( 
  facilityId, 
  { mode = 'auto', source = 'VIIRS_SNPP_NRT', days = 3 } = {}, 
) { 
  const cleanId = encodeURIComponent(String(facilityId).trim()); 
  const res = await fetch( 
    apiUrl(`/api/v1/facilities/thermal-profile?facility_id=${cleanId}&mode=${mode}&source=${source}&days=${days}`), 
  ); 
  if (!res.ok) { 
    throw new Error(`Failed to load facility thermal profile (${res.status}): ${res.statusText}`); 
  } 
  return res.json(); 
} 
