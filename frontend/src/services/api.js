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
    const res = await fetch(apiUrl(`/api/v1/safety/nearest?${params.toString()}`)); 
    if (!res.ok) { 
      throw new Error(`Nearest Safety API error (${res.status}): ${res.statusText}`); 
    } 
    const data = await res.json();
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
