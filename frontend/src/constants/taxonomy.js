export const TAXONOMY_CLASSES = [
  { id: 'all', label: 'All Detections', color: '#38bdf8' },
  { id: 'GAS_FLARE', label: 'Gas Flare', color: '#06b6d4', icon: 'Flame' },
  { id: 'INDUSTRIAL_FIRE', label: 'Industrial Fire', color: '#ef4444', icon: 'AlertTriangle' },
  { id: 'AGRICULTURAL_BURNING', label: 'Agricultural Burn', color: '#facc15', icon: 'Sprout' },
  { id: 'MINING_ACTIVITY', label: 'Mining Activity', color: '#f97316', icon: 'Pickaxe' },
  { id: 'WILDFIRE', label: 'Wildfire', color: '#ec4899', icon: 'Trees' },
  { id: 'PERSISTENT_INDUSTRIAL', label: 'Persistent Ind.', color: '#8b5cf6', icon: 'Factory' },
  { id: 'UNCLASSIFIED', label: 'Unclassified', color: '#94a3b8', icon: 'HelpCircle' },
];

export const TAXONOMY_COLORS = {
  GAS_FLARE: '#06b6d4',
  INDUSTRIAL_FIRE: '#ef4444',
  AGRICULTURAL_BURNING: '#facc15',
  MINING_ACTIVITY: '#f97316',
  WILDFIRE: '#ec4899',
  PERSISTENT_INDUSTRIAL: '#8b5cf6',
  UNCLASSIFIED: '#94a3b8',
};

export const REGIONS = {
  india: { name: 'All India', bbox: '68.1,6.7,97.4,35.5', center: [22.5, 78.5], zoom: 5 },
  jamnagar: { name: 'Jamnagar Hub', bbox: '69.5,22.0,71.0,23.0', center: [22.47, 70.06], zoom: 9 },
  ncr: { name: 'NCR & Punjab', bbox: '75.0,28.0,78.5,31.5', center: [29.8, 76.8], zoom: 7 },
  steel: { name: 'Steel Belt', bbox: '83.5,21.0,87.2,24.5', center: [22.8, 85.5], zoom: 7 },
};

export const SENSORS = [
  { id: 'VIIRS_SNPP_NRT', name: 'VIIRS (S-NPP 375m)' },
  { id: 'VIIRS_NOAA20_NRT', name: 'VIIRS (NOAA-20 375m)' },
  { id: 'MODIS_NRT', name: 'MODIS (Aqua/Terra 1km)' },
];

export const THERMAL_GRADIENT = {
  0.10: '#3b82f6', // Blue: Very Low (<10 MW)
  0.28: '#22c55e', // Green: Low (10-25 MW)
  0.52: '#facc15', // Yellow: Moderate (25-50 MW)
  0.75: '#f97316', // Orange: High (50-80 MW)
  1.00: '#ef4444', // Red: Extreme (>80 MW)
};
