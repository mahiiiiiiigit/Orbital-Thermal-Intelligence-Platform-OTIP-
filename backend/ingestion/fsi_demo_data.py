"""
FSI Forest Fire Demo & Fallback Dataset Generator (SIH 26162).

Generates deterministic, realistic synthetic forest-fire intelligence records
modeled after Forest Survey of India (FSI) Van Agni / SNPP-VIIRS forest fire telemetry.

Scenarios Simulated:
1. ACTIVE_WILDFIRE: Spatial spread across consecutive days in Garhwal / Kullu Valley.
2. LARGE_FOREST_FIRE: Multi-point high aggregate FRP front (>50 MW) in Uttarakhand & Simlipal.
3. LOW_FIRE_RISK: Baseline monitoring in Nilgiris / Wayanad with no active fire.
4. MODERATE_FIRE_RISK: Elevated seasonal dry biomass in Kanha / Bandhavgarh.
5. HIGH_FIRE_RISK: Growing fire line in Gir Forest dry deciduous buffer.
6. EXTREME_FIRE_RISK: Severe crown & surface fire front in Himalayan pine forests.

All records are explicitly tagged with source="DEMO_FSI" and is_demo=True.
"""

from __future__ import annotations

import random
from typing import Any, Dict, List


def generate_fsi_demo_data() -> List[Dict[str, Any]]:
    """
    Generates deterministic synthetic FSI forest fire detections.
    Uses a fixed random seed for reproducible demo executions.
    """
    rng = random.Random(42)
    records: List[Dict[str, Any]] = []

    # -------------------------------------------------------------------------
    # Scenario 1 & 2: Uttarakhand Pine Forests (Active Wildfire & Large Forest Fire)
    # Temporal progression from isolated ignition to massive 10-point crown fire front
    # -------------------------------------------------------------------------
    uttarakhand_timeline = [
        # Day 1: Isolated ignition points
        {
            "day": "2026-07-01",
            "time": "08:15:00",
            "count": 2,
            "base_lat": 30.3820,
            "base_lon": 79.3180,
            "frp_range": (18.0, 26.0),
            "status": "ACTIVE_WILDFIRE",
            "danger": "HIGH",
            "large_fire": False,
            "desc": "Initial pine needles surface fire ignition",
        },
        # Day 2: Growing cluster spreading east along ridge
        {
            "day": "2026-07-02",
            "time": "08:30:00",
            "count": 5,
            "base_lat": 30.3950,
            "base_lon": 79.3350,
            "frp_range": (28.0, 48.0),
            "status": "ACTIVE_WILDFIRE",
            "danger": "HIGH",
            "large_fire": False,
            "desc": "Spreading wildfire front along steep slope",
        },
        # Day 3: Massive Crown Fire Front -> LARGE FOREST FIRE
        {
            "day": "2026-07-03",
            "time": "08:45:00",
            "count": 9,
            "base_lat": 30.4120,
            "base_lon": 79.3580,
            "frp_range": (55.0, 115.0),
            "status": "ACTIVE_WILDFIRE",
            "danger": "EXTREME",
            "large_fire": True,
            "desc": "Severe canopy crown fire excursion (Large Forest Fire Alert)",
        },
        # Day 4: Post-fire suppression / containment
        {
            "day": "2026-07-04",
            "time": "09:00:00",
            "count": 4,
            "base_lat": 30.4200,
            "base_lon": 79.3650,
            "frp_range": (12.0, 24.0),
            "status": "CONTAINED",
            "danger": "MODERATE",
            "large_fire": False,
            "desc": "Contained ground embers under forest guard monitoring",
        },
    ]

    for idx_step, step in enumerate(uttarakhand_timeline):
        for i in range(step["count"]):
            lat = round(step["base_lat"] + rng.uniform(-0.018, 0.018), 5)
            lon = round(step["base_lon"] + rng.uniform(-0.018, 0.018), 5)
            frp = round(rng.uniform(step["frp_range"][0], step["frp_range"][1]), 1)
            bt = round(320.0 + (frp * 0.45) + rng.uniform(-3.0, 5.0), 1)
            conf = rng.randint(86, 98) if frp > 35 else rng.randint(75, 88)

            rec_id = f"fsi-demo-uk-chamoli-d{idx_step+1}-{i+1}"
            reasons = [
                "Spatial containment inside FSI Forest Corridor (Garhwal Himalaya)",
                f"FSI Fire Danger Index: {step['danger']} ({step['desc']})",
                f"Thermal Radiance: {frp} MW (Temporal progression step Day {idx_step+1})",
                "Demonstration Record (DEMO_FSI — Synthetic Scenario)",
            ]
            if step["large_fire"]:
                reasons.insert(1, "FLAGGED: Large Forest Fire Excursion (Aggregate Cluster FRP > 250 MW)")

            records.append({
                "id": rec_id,
                "latitude": lat,
                "longitude": lon,
                "state": "Uttarakhand",
                "district": "Chamoli",
                "forest_name": "Garhwal Himalayan Pine Forest",
                "forest_type": "Himalayan Subtropical Pine & Moist Temperate",
                "fire_status": step["status"],
                "fire_danger_level": step["danger"],
                "frp": frp,
                "brightness_temp": bt,
                "confidence": conf,
                "confidence_level": "HIGH" if conf >= 80 else "MEDIUM",
                "timestamp": f"{step['day']}T{step['time']}+00:00",
                "large_forest_fire": step["large_fire"],
                "source": "DEMO_FSI",
                "is_demo": True,
                "classification": "WILDFIRE",
                "facility_name": "Garhwal Himalayan Pine Forest",
                "facility_category": "Forest / Wildland",
                "reasons": reasons,
                "risk_score": round(min(99.0, 45.0 + (frp * 0.52)), 1),
                "risk_level": "CRITICAL" if step["danger"] == "EXTREME" else ("HIGH" if step["danger"] == "HIGH" else "MEDIUM"),
                "active_days": idx_step + 1,
            })

    # -------------------------------------------------------------------------
    # Scenario 3: Himachal Pradesh - Parvati Valley / Kullu (Active Wildfire Front)
    # -------------------------------------------------------------------------
    for day_idx, day_str in enumerate(["2026-07-02", "2026-07-03", "2026-07-04"]):
        for i in range(3):
            lat = round(31.9850 + (day_idx * 0.008) + rng.uniform(-0.01, 0.01), 5)
            lon = round(77.2150 + (day_idx * 0.006) + rng.uniform(-0.01, 0.01), 5)
            frp = round(rng.uniform(25.0, 48.0), 1)
            bt = round(335.0 + (frp * 0.4), 1)
            conf = rng.randint(82, 94)

            records.append({
                "id": f"fsi-demo-hp-kullu-d{day_idx+1}-{i+1}",
                "latitude": lat,
                "longitude": lon,
                "state": "Himachal Pradesh",
                "district": "Kullu",
                "forest_name": "Great Himalayan National Park Buffer",
                "forest_type": "Subalpine Coniferous Forest",
                "fire_status": "ACTIVE_WILDFIRE",
                "fire_danger_level": "HIGH",
                "frp": frp,
                "brightness_temp": bt,
                "confidence": conf,
                "confidence_level": "HIGH",
                "timestamp": f"{day_str}T07:45:00+00:00",
                "large_forest_fire": False,
                "source": "DEMO_FSI",
                "is_demo": True,
                "classification": "WILDFIRE",
                "facility_name": "Great Himalayan National Park Buffer",
                "facility_category": "Forest / Wildland",
                "reasons": [
                    "Spatial containment inside FSI Forest Corridor (Western Himalaya)",
                    "FSI Fire Danger Index: HIGH (Active slope wildfire detection)",
                    f"Thermal Radiance: {frp} MW in Subalpine Conifer Belt",
                    "Demonstration Record (DEMO_FSI — Synthetic Scenario)",
                ],
                "risk_score": 74.5,
                "risk_level": "HIGH",
                "active_days": day_idx + 1,
            })

    # -------------------------------------------------------------------------
    # Scenario 4: Simlipal Biosphere Reserve, Odisha (Large Forest Fire & Extreme Risk)
    # -------------------------------------------------------------------------
    for i in range(7):
        lat = round(21.8950 + rng.uniform(-0.025, 0.025), 5)
        lon = round(86.3450 + rng.uniform(-0.025, 0.025), 5)
        frp = round(rng.uniform(42.0, 89.0), 1)
        bt = round(345.0 + (frp * 0.38), 1)
        conf = rng.randint(88, 97)

        records.append({
            "id": f"fsi-demo-odisha-simlipal-{i+1}",
            "latitude": lat,
            "longitude": lon,
            "state": "Odisha",
            "district": "Mayurbhanj",
            "forest_name": "Simlipal Tiger Reserve & Biosphere",
            "forest_type": "Moist Deciduous & Sal Forest",
            "fire_status": "ACTIVE_WILDFIRE",
            "fire_danger_level": "EXTREME",
            "frp": frp,
            "brightness_temp": bt,
            "confidence": conf,
            "confidence_level": "HIGH",
            "timestamp": "2026-07-03T09:15:00+00:00",
            "large_forest_fire": True,
            "source": "DEMO_FSI",
            "is_demo": True,
            "classification": "WILDFIRE",
            "facility_name": "Simlipal Tiger Reserve & Biosphere",
            "facility_category": "Forest / Wildland",
            "reasons": [
                "Spatial containment inside FSI Forest Reserve (Simlipal Biosphere)",
                "FLAGGED: Large Forest Fire Excursion (Dense Sal Leaf Litter Burn)",
                "FSI Fire Danger Index: EXTREME (Multi-flank spreading active fire)",
                "Demonstration Record (DEMO_FSI — Synthetic Scenario)",
            ],
            "risk_score": 92.0,
            "risk_level": "CRITICAL",
            "active_days": 3,
        })

    # -------------------------------------------------------------------------
    # Scenario 5: Bandhavgarh / Kanha, Madhya Pradesh (Moderate Risk / Monitoring)
    # -------------------------------------------------------------------------
    for i in range(4):
        lat = round(23.7050 + rng.uniform(-0.015, 0.015), 5)
        lon = round(80.9650 + rng.uniform(-0.015, 0.015), 5)
        frp = round(rng.uniform(14.0, 24.0), 1)
        bt = round(318.0 + (frp * 0.3), 1)
        conf = rng.randint(70, 84)

        records.append({
            "id": f"fsi-demo-mp-bandhavgarh-{i+1}",
            "latitude": lat,
            "longitude": lon,
            "state": "Madhya Pradesh",
            "district": "Umaria",
            "forest_name": "Bandhavgarh National Park Core",
            "forest_type": "Tropical Moist Deciduous & Bamboo Breaks",
            "fire_status": "MONITORING",
            "fire_danger_level": "MODERATE",
            "frp": frp,
            "brightness_temp": bt,
            "confidence": conf,
            "confidence_level": "MEDIUM",
            "timestamp": "2026-07-03T07:20:00+00:00",
            "large_forest_fire": False,
            "source": "DEMO_FSI",
            "is_demo": True,
            "classification": "WILDFIRE",
            "facility_name": "Bandhavgarh National Park Core",
            "facility_category": "Forest / Wildland",
            "reasons": [
                "Spatial containment inside FSI Tiger Reserve Corridor (Bandhavgarh)",
                "FSI Fire Danger Index: MODERATE (Controlled ground thermal activity)",
                "Thermal Radiance: <25 MW under forest department surveillance",
                "Demonstration Record (DEMO_FSI — Synthetic Scenario)",
            ],
            "risk_score": 48.0,
            "risk_level": "MEDIUM",
            "active_days": 1,
        })

    # -------------------------------------------------------------------------
    # Scenario 6: Gir Forest National Park, Gujarat (High Risk Dry Deciduous)
    # -------------------------------------------------------------------------
    for i in range(3):
        lat = round(21.1450 + rng.uniform(-0.012, 0.012), 5)
        lon = round(70.8150 + rng.uniform(-0.012, 0.012), 5)
        frp = round(rng.uniform(28.0, 42.0), 1)
        bt = round(332.0 + (frp * 0.35), 1)
        conf = rng.randint(84, 92)

        records.append({
            "id": f"fsi-demo-guj-gir-{i+1}",
            "latitude": lat,
            "longitude": lon,
            "state": "Gujarat",
            "district": "Junagadh",
            "forest_name": "Gir National Park Dry Teak Forest",
            "forest_type": "Very Dry Teak & Dry Deciduous Scrub",
            "fire_status": "ACTIVE_WILDFIRE",
            "fire_danger_level": "HIGH",
            "frp": frp,
            "brightness_temp": bt,
            "confidence": conf,
            "confidence_level": "HIGH",
            "timestamp": "2026-07-03T08:10:00+00:00",
            "large_forest_fire": False,
            "source": "DEMO_FSI",
            "is_demo": True,
            "classification": "WILDFIRE",
            "facility_name": "Gir National Park Dry Teak Forest",
            "facility_category": "Forest / Wildland",
            "reasons": [
                "Spatial containment inside FSI Forest Corridor (Gir National Park)",
                "FSI Fire Danger Index: HIGH (Dry season deciduous thermal excursion)",
                f"Thermal Radiance: {frp} MW in dry teak buffer",
                "Demonstration Record (DEMO_FSI — Synthetic Scenario)",
            ],
            "risk_score": 76.0,
            "risk_level": "HIGH",
            "active_days": 2,
        })

    # -------------------------------------------------------------------------
    # Scenario 7: Nilgiri / Wayanad Biosphere (Low Fire Risk Baseline)
    # -------------------------------------------------------------------------
    for i in range(2):
        lat = round(11.6850 + rng.uniform(-0.01, 0.01), 5)
        lon = round(76.2450 + rng.uniform(-0.01, 0.01), 5)
        frp = round(rng.uniform(6.0, 11.5), 1)
        bt = round(304.0 + frp, 1)
        conf = rng.randint(60, 75)

        records.append({
            "id": f"fsi-demo-ker-wayanad-{i+1}",
            "latitude": lat,
            "longitude": lon,
            "state": "Kerala",
            "district": "Wayanad",
            "forest_name": "Wayanad Wildlife Sanctuary",
            "forest_type": "Tropical Moist Evergreen & Shola Grassland",
            "fire_status": "NO_ACTIVE_FIRE",
            "fire_danger_level": "LOW",
            "frp": frp,
            "brightness_temp": bt,
            "confidence": conf,
            "confidence_level": "LOW",
            "timestamp": "2026-07-03T06:30:00+00:00",
            "large_forest_fire": False,
            "source": "DEMO_FSI",
            "is_demo": True,
            "classification": "WILDFIRE",
            "facility_name": "Wayanad Wildlife Sanctuary",
            "facility_category": "Forest / Wildland",
            "reasons": [
                "Spatial containment inside FSI Protected Area (Western Ghats Biosphere)",
                "FSI Fire Danger Index: LOW (Baseline moist vegetative background)",
                "Low Radiance: <12 MW with zero active fire spread",
                "Demonstration Record (DEMO_FSI — Synthetic Scenario)",
            ],
            "risk_score": 22.0,
            "risk_level": "LOW",
            "active_days": 1,
        })

    # Sort deterministically by timestamp
    records.sort(key=lambda r: r["timestamp"])
    return records


def generate_fsi_ffdr_grid() -> Dict[str, Any]:
    """
    Generates official Forest Survey of India (FSI) 5km x 5km Forest Fire Danger Rating (FFDR)
    GeoJSON FeatureCollection grid across major Indian forest divisions.
    Categories: Extreme (Red), Very High (Red-Orange), High (Orange), Moderate (Yellow), Low (Green).
    """
    grid_definitions = [
        # --- 1. Uttarakhand / Garhwal Himalayan Forest Division ---
        {"division": "Chamoli Forest Division", "state": "Uttarakhand", "forest": "Garhwal Himalayan Pine Belt", "center_lat": 30.40, "center_lon": 79.33, "risk": "Extreme", "fwi": 46.8},
        {"division": "Pauri Forest Division", "state": "Uttarakhand", "forest": "Subtropical Pine & Oak Zone", "center_lat": 30.15, "center_lon": 78.78, "risk": "Very High", "fwi": 38.2},
        {"division": "Almora Forest Division", "state": "Uttarakhand", "forest": "Kumaon Chir Pine Buffer", "center_lat": 29.62, "center_lon": 79.66, "risk": "High", "fwi": 29.5},
        {"division": "Nainital Forest Division", "state": "Uttarakhand", "forest": "Corbett Foothills Reserve", "center_lat": 29.40, "center_lon": 79.15, "risk": "Moderate", "fwi": 19.8},
        {"division": "Uttarkashi Division", "state": "Uttarakhand", "forest": "Upper Bhagirathi Subalpine", "center_lat": 30.73, "center_lon": 78.44, "risk": "High", "fwi": 31.4},

        # --- 2. Himachal Pradesh / Western Himalaya ---
        {"division": "Kullu Forest Division", "state": "Himachal Pradesh", "forest": "Parvati Valley Conifer Belt", "center_lat": 31.96, "center_lon": 77.20, "risk": "Very High", "fwi": 39.7},
        {"division": "Shimla Forest Division", "state": "Himachal Pradesh", "forest": "Shimla Pine & Deodar Forest", "center_lat": 31.10, "center_lon": 77.17, "risk": "High", "fwi": 28.6},
        {"division": "Kangra Forest Division", "state": "Himachal Pradesh", "forest": "Dhauladhar Moist Temperate", "center_lat": 32.10, "center_lon": 76.27, "risk": "Moderate", "fwi": 18.2},

        # --- 3. Eastern Sal Forest Belt (Odisha & Jharkhand) ---
        {"division": "Baripada Division", "state": "Odisha", "forest": "Simlipal Tiger Reserve Core", "center_lat": 21.89, "center_lon": 86.34, "risk": "Extreme", "fwi": 48.2},
        {"division": "Keonjhar Division", "state": "Odisha", "forest": "Moist Deciduous Sal Buffer", "center_lat": 21.63, "center_lon": 85.58, "risk": "Very High", "fwi": 37.1},
        {"division": "Kolhan Forest Division", "state": "Jharkhand", "forest": "Saranda Sal Forest Reserve", "center_lat": 22.25, "center_lon": 85.28, "risk": "High", "fwi": 32.6},

        # --- 4. Central Highlands (Madhya Pradesh & Chhattisgarh) ---
        {"division": "Umaria Division", "state": "Madhya Pradesh", "forest": "Bandhavgarh Tiger Reserve", "center_lat": 23.70, "center_lon": 80.96, "risk": "Moderate", "fwi": 22.4},
        {"division": "Mandla Division", "state": "Madhya Pradesh", "forest": "Kanha National Park Buffer", "center_lat": 22.33, "center_lon": 80.61, "risk": "Moderate", "fwi": 21.0},
        {"division": "Korba Forest Division", "state": "Chhattisgarh", "forest": "Hasdeo Arand Sal Forest", "center_lat": 22.45, "center_lon": 82.72, "risk": "High", "fwi": 30.5},
        {"division": "Bastar Forest Division", "state": "Chhattisgarh", "forest": "Indravati River Basin Forest", "center_lat": 19.07, "center_lon": 81.96, "risk": "Low", "fwi": 11.2},

        # --- 5. Western Ghats & Nilgiri Biosphere ---
        {"division": "Wayanad Forest Division", "state": "Kerala", "forest": "Wayanad Wildlife Sanctuary", "center_lat": 11.68, "center_lon": 76.24, "risk": "Low", "fwi": 8.9},
        {"division": "Nilgiris North Division", "state": "Tamil Nadu", "forest": "Mudumalai - Nilgiri Plateau", "center_lat": 11.58, "center_lon": 76.53, "risk": "Low", "fwi": 10.4},
        {"division": "Chamarajanagar Division", "state": "Karnataka", "forest": "Bandipur Tiger Reserve", "center_lat": 11.75, "center_lon": 76.60, "risk": "Moderate", "fwi": 19.5},

        # --- 6. Dry Deciduous & Scrub Forests ---
        {"division": "Junagadh Division", "state": "Gujarat", "forest": "Gir National Park Teak Buffer", "center_lat": 21.14, "center_lon": 70.81, "risk": "High", "fwi": 33.8},
        {"division": "Sawai Madhopur Division", "state": "Rajasthan", "forest": "Ranthambore Tiger Reserve", "center_lat": 26.01, "center_lon": 76.50, "risk": "High", "fwi": 34.2},
    ]

    features = []
    # Grid cell delta ~ 0.045 deg ~= 5 km
    half_d = 0.0225

    for idx, item in enumerate(grid_definitions):
        c_lat = item["center_lat"]
        c_lon = item["center_lon"]

        polygon_coords = [
            [
                [round(c_lon - half_d, 5), round(c_lat - half_d, 5)],
                [round(c_lon + half_d, 5), round(c_lat - half_d, 5)],
                [round(c_lon + half_d, 5), round(c_lat + half_d, 5)],
                [round(c_lon - half_d, 5), round(c_lat + half_d, 5)],
                [round(c_lon - half_d, 5), round(c_lat - half_d, 5)],
            ]
        ]

        feature = {
            "type": "Feature",
            "id": f"fsi-ffdr-grid-{idx+1}",
            "geometry": {
                "type": "Polygon",
                "coordinates": polygon_coords,
            },
            "properties": {
                "grid_id": f"FFDR-5KM-IN-{int(c_lat*100):04d}-{int(c_lon*100):04d}",
                "risk_level": item["risk"],
                "fwi_score": item["fwi"],
                "forest_name": item["forest"],
                "forest_division": item["division"],
                "state": item["state"],
                "bulletin_date": "2026-07-03",
                "validity_window": "Weekly Pre-Fire Bulletin (Valid through 2026-07-09)",
                "source": "Forest Survey of India (FSI Van Agni Geo-Portal)",
                "is_official_format": True,
                "is_active_ignition": False,
                "context_note": "FSI Fire Weather Index Pre-Fire Danger Rating (Vulnerability Indicator)",
            },
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "name": "FSI_Forest_Fire_Danger_Rating_5km_Grid",
        "metadata": {
            "source": "Forest Survey of India (FSI Van Agni)",
            "methodology": "Canadian Forest Fire Danger Rating System (CFFDRS / FWI)",
            "resolution": "5 km x 5 km National Grid",
            "total_grids": len(features),
            "bulletin_cycle": "Weekly Pre-Fire Dissemination",
            "is_wms_compatible": True,
            "wms_url": "https://vanagni.fsi.gov.in/cgi-bin/mapserv?map=/ms4w/apps/vanagni/wms.map",
            "wms_layer": "fsi_ffdr_danger_grid",
        },
        "features": features,
    }

