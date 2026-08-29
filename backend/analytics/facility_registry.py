"""
Industrial, Mining, and Environmental Facility Registry for Thermal Intelligence.
Contains geospatial coordinates, spatial buffer thresholds, and facility categories for:
- Refineries, Petrochemical complexes, and Gas processing facilities (Flare sources)
- Heavy industry (Steel plants, Smelters, Thermal Power plants)
- Coal & mineral mining basins (Coal seam fires, Open-cast surface mining)
- Major forest reserves & wildlands (Wildfire baselines)
Used to spatially attribute raw NASA FIRMS satellite detections.
"""

from typing import Dict, List, Optional, Tuple
from backend.analytics.spatial import distance_metres


KNOWN_FACILITIES: List[Dict] = [
    # --- REFINERIES & PETROCHEMICALS & LNG (GAS FLARE SOURCES) ---
    {
        "facility_id": "jamnagar-refinery",
        "name": "Jamnagar Refinery (RIL)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery & Petrochemicals",
        "has_flares": True,
        "state": "Gujarat",
        "latitude": 22.4700,
        "longitude": 70.0600,
        "radius_meters": 6000,
        "expected_baseline_frp": 25.0,
    },
    {
        "facility_id": "vadinar-refinery",
        "name": "Vadinar Refinery (Nayara)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery",
        "has_flares": True,
        "state": "Gujarat",
        "latitude": 22.3800,
        "longitude": 69.7500,
        "radius_meters": 5000,
        "expected_baseline_frp": 22.0,
    },
    {
        "facility_id": "panipat-refinery",
        "name": "Panipat Refinery & Petrochem (IOCL)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery & Petrochemicals",
        "has_flares": True,
        "state": "Haryana",
        "latitude": 29.3900,
        "longitude": 76.9700,
        "radius_meters": 5000,
        "expected_baseline_frp": 20.0,
    },
    {
        "facility_id": "hazira-petrochem",
        "name": "Hazira Petrochemical Complex",
        "facility_type": "refinery_gas",
        "category": "Petrochemicals & Gas Processing",
        "has_flares": True,
        "state": "Gujarat",
        "latitude": 21.1200,
        "longitude": 72.6500,
        "radius_meters": 5500,
        "expected_baseline_frp": 24.0,
    },
    {
        "facility_id": "paradip-refinery",
        "name": "Paradip Refinery (IOCL)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery & Petrochemicals",
        "has_flares": True,
        "state": "Odisha",
        "latitude": 20.2800,
        "longitude": 86.6700,
        "radius_meters": 5000,
        "expected_baseline_frp": 22.0,
    },
    {
        "facility_id": "bhatinda-refinery",
        "name": "Guru Gobind Singh Refinery (HMEL Bhatinda)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery",
        "has_flares": True,
        "state": "Punjab",
        "latitude": 30.0300,
        "longitude": 74.9300,
        "radius_meters": 5000,
        "expected_baseline_frp": 20.0,
    },
    {
        "facility_id": "bina-refinery",
        "name": "Bina Refinery (BPCL)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery",
        "has_flares": True,
        "state": "Madhya Pradesh",
        "latitude": 24.1600,
        "longitude": 78.1800,
        "radius_meters": 5000,
        "expected_baseline_frp": 20.0,
    },

    # --- HEAVY INDUSTRY & STEEL & POWER (PERSISTENT INDUSTRIAL) ---
    {
        "facility_id": "tata-steel-jamshedpur",
        "name": "Tata Steel Works Jamshedpur",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Jharkhand",
        "latitude": 22.8000,
        "longitude": 86.2000,
        "radius_meters": 5000,
        "expected_baseline_frp": 35.0,
    },
    {
        "facility_id": "rourkela-steel",
        "name": "Rourkela Steel Plant (SAIL)",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Odisha",
        "latitude": 22.2500,
        "longitude": 84.8600,
        "radius_meters": 5000,
        "expected_baseline_frp": 32.0,
    },
    {
        "facility_id": "bokaro-steel",
        "name": "Bokaro Steel Plant (SAIL)",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Jharkhand",
        "latitude": 23.6700,
        "longitude": 86.1700,
        "radius_meters": 5000,
        "expected_baseline_frp": 28.0,
    },
    {
        "facility_id": "bhilai-steel",
        "name": "Bhilai Steel Plant (SAIL)",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Chhattisgarh",
        "latitude": 21.2000,
        "longitude": 81.4000,
        "radius_meters": 5000,
        "expected_baseline_frp": 30.0,
    },
    {
        "facility_id": "vizag-steel",
        "name": "Visakhapatnam Steel Plant (RINL)",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Andhra Pradesh",
        "latitude": 17.6300,
        "longitude": 83.1800,
        "radius_meters": 5000,
        "expected_baseline_frp": 26.0,
    },
    {
        "facility_id": "mundra-thermal-power",
        "name": "Mundra Ultra Mega Power Plant",
        "facility_type": "heavy_industry",
        "category": "Thermal Power Generation",
        "has_flares": False,
        "state": "Gujarat",
        "latitude": 22.8200,
        "longitude": 69.5200,
        "radius_meters": 4500,
        "expected_baseline_frp": 30.0,
    },
    {
        "facility_id": "singrauli-power-hub",
        "name": "Singrauli Super Thermal Power Hub",
        "facility_type": "heavy_industry",
        "category": "Thermal Power Generation",
        "has_flares": False,
        "state": "Uttar Pradesh / MP",
        "latitude": 24.1200,
        "longitude": 82.7000,
        "radius_meters": 6000,
        "expected_baseline_frp": 32.0,
    },

    # --- MINING BASINS & COALFIELDS (MINING ACTIVITY) ---
    {
        "facility_id": "jharia-coalfield",
        "name": "Jharia Coalfield & Seam Fire Zone",
        "facility_type": "mining",
        "category": "Coal Mining & Underground Coal Seam Combustion",
        "has_flares": False,
        "state": "Jharkhand",
        "latitude": 23.7500,
        "longitude": 86.4200,
        "radius_meters": 10000,
        "expected_baseline_frp": 28.0,
    },
    {
        "facility_id": "korba-coalfields",
        "name": "Korba Open-cast Coal Basin",
        "facility_type": "mining",
        "category": "Open-cast Coal Mining & Washeries",
        "has_flares": False,
        "state": "Chhattisgarh",
        "latitude": 22.3500,
        "longitude": 82.7100,
        "radius_meters": 10000,
        "expected_baseline_frp": 25.0,
    },
    {
        "facility_id": "raniganj-coalfield",
        "name": "Raniganj Coalfield Belt",
        "facility_type": "mining",
        "category": "Coal Mining Basin",
        "has_flares": False,
        "state": "West Bengal",
        "latitude": 23.6200,
        "longitude": 87.1200,
        "radius_meters": 9000,
        "expected_baseline_frp": 22.0,
    },
    {
        "facility_id": "keonjhar-iron-mines",
        "name": "Keonjhar-Barbil Iron Ore Basin",
        "facility_type": "mining",
        "category": "Iron Ore Surface Mining",
        "has_flares": False,
        "state": "Odisha",
        "latitude": 21.8500,
        "longitude": 85.5000,
        "radius_meters": 11000,
        "expected_baseline_frp": 20.0,
    },

    # --- FOREST RESERVES & WILDLANDS (WILDFIRE BASES) ---
    {
        "facility_id": "similipal-forest-reserve",
        "name": "Similipal National Park & Biosphere",
        "facility_type": "forest",
        "category": "Protected Forest & Wildlife Reserve",
        "has_flares": False,
        "state": "Odisha",
        "latitude": 21.6500,
        "longitude": 86.3500,
        "radius_meters": 22000,
        "expected_baseline_frp": 0.0,
    },
    {
        "facility_id": "bandhavgarh-forest-reserve",
        "name": "Bandhavgarh Dense Forest Canopy",
        "facility_type": "forest",
        "category": "Dense Deciduous Forest Reserve",
        "has_flares": False,
        "state": "Madhya Pradesh",
        "latitude": 23.7000,
        "longitude": 81.0000,
        "radius_meters": 20000,
        "expected_baseline_frp": 0.0,
    },
    {
        "facility_id": "corbett-forest-reserve",
        "name": "Jim Corbett Terai Forest Belt",
        "facility_type": "forest",
        "category": "Protected Terai Forest & Shrubland",
        "has_flares": False,
        "state": "Uttarakhand",
        "latitude": 29.5300,
        "longitude": 78.7700,
        "radius_meters": 18000,
        "expected_baseline_frp": 0.0,
    },
]


def match_facility(
    latitude: float,
    longitude: float,
    custom_facilities: Optional[List[Dict]] = None,
) -> Tuple[Optional[Dict], Optional[str], str, Optional[float]]:
    """
    Spatially checks whether a given coordinate falls within the perimeter buffer
    of a known registered industrial, mining, or forest asset.

    Returns:
        (facility_dict, facility_name, context, distance_to_facility_meters)
    """
    point = {"latitude": latitude, "longitude": longitude}
    facilities = custom_facilities if custom_facilities is not None else KNOWN_FACILITIES

    closest_facility: Optional[Dict] = None
    min_distance = float("inf")

    for facility in facilities:
        dist = distance_metres(
            point,
            {"latitude": facility["latitude"], "longitude": facility["longitude"]},
        )
        if dist <= facility.get("radius_meters", 5000) and dist < min_distance:
            min_distance = dist
            closest_facility = facility

    if closest_facility:
        f_type = closest_facility.get("facility_type", "industrial")
        if f_type in ("refinery_gas", "heavy_industry"):
            context = "industrial"
        elif f_type == "mining":
            context = "mining"
        elif f_type == "forest":
            context = "forest"
        else:
            context = "industrial"

        return (
            closest_facility,
            closest_facility["name"],
            context,
            round(min_distance, 1),
        )

    # In India, typical agrarian coordinates during crop seasons (Punjab/Haryana/UP/Indo-Gangetic belt)
    # Latitude ~25.0 to 32.5, Longitude ~74.0 to 88.0 (excluding designated forests and industrial nodes)
    if (27.5 <= latitude <= 32.5 and 74.0 <= longitude <= 79.5) or (24.5 <= latitude <= 27.5 and 80.0 <= longitude <= 88.0):
        return (None, None, "agricultural", None)

    return (None, None, "unassigned", None)
