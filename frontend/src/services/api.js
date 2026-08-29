/**
 * API Service for interacting with the FastAPI backend.
 */

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

  const res = await fetch(endpoint);
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

  const res = await fetch(`/api/v1/fsi/forest-fires?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`FSI API error (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

export async function fetchClusters({ mode = 'auto', source = 'VIIRS_SNPP_NRT' } = {}) {
  const res = await fetch(`/api/v1/clusters/persistent?mode=${mode}&source=${source}`);
  if (!res.ok) {
    throw new Error(`Failed to load clusters (${res.status})`);
  }
  return res.json();
}

export async function fetchAlerts({ mode = 'auto', source = 'VIIRS_SNPP_NRT' } = {}) {
  const res = await fetch(`/api/v1/alerts?mode=${mode}&source=${source}`);
  if (!res.ok) {
    throw new Error(`Failed to load alerts (${res.status})`);
  }
  return res.json();
}

export function getDossierDownloadUrl(clusterId = 'jamnagar-refinery', mode = 'demo') {
  return `/api/v1/reports/${clusterId}/dossier?mode=${mode}`;
}

export async function fetchEmergencyRoute(lat, lon) {
  const res = await fetch(`/api/v1/routing/emergency-route?lat=${lat}&lon=${lon}`);
  if (!res.ok) {
    throw new Error(`Failed to calculate emergency dispatch route (${res.status})`);
  }
  return res.json();
}
