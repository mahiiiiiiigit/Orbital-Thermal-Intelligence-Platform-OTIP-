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
