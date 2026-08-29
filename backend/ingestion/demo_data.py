"""
Realistic Synthetic Demo Dataset for ThermalWatch (SIH 26162).
Generates deterministic multi-scenario thermal intelligence telemetry
covering the complete 7-class taxonomy with realistic spatial-temporal profiles:

1. GAS_FLARE - Operational flare stack at Jamnagar Refinery (tight fixed coordinates, 30 days continuous, 20-28 MW).
2. INDUSTRIAL_FIRE - Critical industrial fire breakout at Jamnagar Refinery (Day 29 sudden excursion: 124.8 MW, 38σ spike).
3. AGRICULTURAL_BURNING - Spatially scattered, short-lived stubble burning in Punjab/Haryana croplands (1-2 day transients, 6-18 MW).
4. WILDFIRE - Spatially expanding and moving forest canopy blaze in Bandhavgarh Forest Reserve (Days 15-18, 30-75 MW, spreading coords).
5. MINING_ACTIVITY - Persistent open-cast & coal seam combustion across Jharia Coalfield (12 observations across days, 22-40 MW).
6. PERSISTENT_INDUSTRIAL - Continuous heavy process heat at Tata Steel Works Jamshedpur (18 days continuous, 32-46 MW).
7. UNCLASSIFIED - Isolated single-day anomaly in semi-arid Deccan scrubland (14.2 MW, no facility or crop context).
"""

from datetime import datetime, timedelta, timezone
import random
from typing import Any, Dict, List


def generate_hotspots() -> List[Dict[str, Any]]:
    """
    Generates a deterministic 30-day simulated dataset representing all 7 SIH classes.
    Uses fixed seed 26162 for reproducible hackathon demonstrations and judge audits.
    """
    random.seed(26162)
    start_date = datetime(2026, 7, 1, 4, 30, tzinfo=timezone.utc)
    hotspots: List[Dict[str, Any]] = []

    # =========================================================================
    # SCENARIO 1 & 2: GAS FLARE (Days 0-28) & INDUSTRIAL FIRE SPIKE (Day 29)
    # Facility: Jamnagar Refinery (RIL)
    # Spatial: Fixed elevated flare stack at (22.4708, 70.0605)
    # =========================================================================
    for day in range(30):
        is_fire_anomaly = (day == 29)
        # Day 29 has an extreme 124.8 MW fire spike; days 0-28 are normal operational flaring (21-27 MW)
        frp = 124.8 if is_fire_anomaly else round(random.uniform(21.0, 27.8), 1)
        brightness_temp = 392.5 if is_fire_anomaly else round(334.0 + frp * 0.45, 1)
        is_night = (day % 3 == 0)

        hotspots.append(
            {
                "id": f"jamnagar-refinery-day-{day:02d}",
                "latitude": round(22.4708 + random.uniform(-0.0006, 0.0006), 5),
                "longitude": round(70.0605 + random.uniform(-0.0006, 0.0006), 5),
                "frp": frp,
                "brightness_temp": brightness_temp,
                "timestamp": (start_date + timedelta(days=day, hours=14 if is_night else 2)).isoformat(),
                "context": "industrial",
                "facility_name": "Jamnagar Refinery (RIL)",
                "facility_type": "refinery_gas",
                "facility_category": "Petroleum Refinery & Petrochemicals",
                "has_flares": True,
                "confidence": "high",
                "satellite": "NOAA-20" if day % 2 == 0 else "VIIRS_SNPP",
                "sensor": "VIIRS",
                "day_night": "N" if is_night else "D",
                "land_context": "Petroleum Refinery & Petrochemicals",
                "distance_to_facility_m": round(random.uniform(65.0, 240.0), 1),
                "source": "SIMULATED_DEMO",
            }
        )

    # =========================================================================
    # SCENARIO 6: PERSISTENT INDUSTRIAL PROCESS HEAT
    # Facility: Tata Steel Works Jamshedpur (Integrated Steel Plant)
    # Spatial: Continuous blast furnaces/coke ovens at (22.8005, 86.2008)
    # Temporal: 18 regular observations across the month
    # =========================================================================
    steel_observation_days = [0, 2, 3, 5, 7, 8, 10, 12, 14, 16, 17, 19, 21, 23, 24, 26, 28, 29]
    for idx, day in enumerate(steel_observation_days):
        frp = round(random.uniform(32.5, 46.2), 1)
        brightness_temp = round(342.0 + frp * 0.4, 1)
        is_night = (idx % 2 == 1)

        hotspots.append(
            {
                "id": f"tata-steel-furnace-{day:02d}",
                "latitude": round(22.8005 + random.uniform(-0.0012, 0.0012), 5),
                "longitude": round(86.2008 + random.uniform(-0.0012, 0.0012), 5),
                "frp": frp,
                "brightness_temp": brightness_temp,
                "timestamp": (start_date + timedelta(days=day, hours=13 if is_night else 3)).isoformat(),
                "context": "industrial",
                "facility_name": "Tata Steel Works Jamshedpur",
                "facility_type": "heavy_industry",
                "facility_category": "Integrated Steel Plant",
                "has_flares": False,
                "confidence": "high",
                "satellite": "VIIRS_SNPP",
                "sensor": "VIIRS",
                "day_night": "N" if is_night else "D",
                "land_context": "Integrated Steel Plant",
                "distance_to_facility_m": round(random.uniform(90.0, 380.0), 1),
                "source": "SIMULATED_DEMO",
            }
        )

    # =========================================================================
    # SCENARIO 5: MINING ACTIVITY & COAL SEAM COMBUSTION
    # Facility: Jharia Coalfield & Seam Fire Zone (Dhanbad, Jharkhand)
    # Spatial: Distributed open-cast extraction pits & smoldering outcrops
    # Temporal: Persistent repeated detections (12 days across the month)
    # =========================================================================
    mining_days = [1, 3, 6, 8, 11, 13, 16, 18, 21, 24, 27, 29]
    mining_offsets = [
        (-0.012, 0.008), (0.015, -0.010), (0.005, 0.018), (-0.008, -0.015),
        (0.010, 0.012), (-0.014, 0.005), (0.002, -0.008), (0.016, 0.014),
        (-0.006, 0.020), (0.012, -0.012), (0.004, 0.009), (-0.010, -0.004),
    ]

    for idx, day in enumerate(mining_days):
        lat_off, lon_off = mining_offsets[idx % len(mining_offsets)]
        frp = round(random.uniform(22.5, 38.5), 1)
        brightness_temp = round(326.0 + frp * 0.38, 1)

        hotspots.append(
            {
                "id": f"jharia-coal-seam-{day:02d}",
                "latitude": round(23.7520 + lat_off, 5),
                "longitude": 86.4210 + lon_off,
                "frp": frp,
                "brightness_temp": brightness_temp,
                "timestamp": (start_date + timedelta(days=day, hours=5, minutes=15)).isoformat(),
                "context": "mining",
                "facility_name": "Jharia Coalfield & Seam Fire Zone",
                "facility_type": "mining",
                "facility_category": "Coal Mining & Underground Coal Seam Combustion",
                "has_flares": False,
                "confidence": "high",
                "satellite": "NOAA-20",
                "sensor": "VIIRS",
                "day_night": "D",
                "land_context": "Coal Mining & Underground Coal Seam Combustion",
                "distance_to_facility_m": round(random.uniform(850.0, 3100.0), 1),
                "source": "SIMULATED_DEMO",
            }
        )

    # =========================================================================
    # SCENARIO 4: WILDFIRE (Spreading Forest Canopy Fire)
    # Facility: Bandhavgarh Dense Forest Canopy (Madhya Pradesh)
    # Spatial: Geographically spreading and moving active front (Days 15-18)
    # =========================================================================
    wildfire_steps = [
        # Day 15: Initial ignition on southern ridge
        {"day": 15, "lat": 23.6820, "lon": 80.9650, "frp": 34.2, "temp": 348.0},
        # Day 16: Wind-driven spread northeast
        {"day": 16, "lat": 23.6980, "lon": 80.9850, "frp": 46.5, "temp": 362.5},
        {"day": 16, "lat": 23.7040, "lon": 80.9930, "frp": 51.0, "temp": 368.0},
        # Day 17: Peak uncontrolled canopy blaze with multiple front lines
        {"day": 17, "lat": 23.7220, "lon": 81.0180, "frp": 72.8, "temp": 389.0},
        {"day": 17, "lat": 23.7310, "lon": 81.0310, "frp": 65.4, "temp": 381.5},
        {"day": 17, "lat": 23.7150, "lon": 81.0090, "frp": 58.2, "temp": 374.0},
        # Day 18: Containment flanking embers
        {"day": 18, "lat": 23.7420, "lon": 81.0520, "frp": 24.5, "temp": 328.0},
    ]

    for idx, step in enumerate(wildfire_steps):
        hotspots.append(
            {
                "id": f"bandhavgarh-wildfire-{step['day']:02d}-{idx}",
                "latitude": round(step["lat"] + random.uniform(-0.002, 0.002), 5),
                "longitude": round(step["lon"] + random.uniform(-0.002, 0.002), 5),
                "frp": step["frp"],
                "brightness_temp": step["temp"],
                "timestamp": (start_date + timedelta(days=step["day"], hours=8, minutes=20)).isoformat(),
                "context": "forest",
                "facility_name": "Bandhavgarh Dense Forest Canopy",
                "facility_type": "forest",
                "facility_category": "Dense Deciduous Forest Reserve",
                "has_flares": False,
                "confidence": "high",
                "satellite": "VIIRS_SNPP",
                "sensor": "VIIRS",
                "day_night": "D",
                "land_context": "Dense Deciduous Forest Reserve",
                "distance_to_facility_m": round(random.uniform(600.0, 3800.0), 1),
                "source": "SIMULATED_DEMO",
            }
        )

    # =========================================================================
    # SCENARIO 3: AGRICULTURAL BURNING (Stubble Residue)
    # Spatial: Spatially scattered across Punjab & Haryana agrarian belt
    # Temporal: Short-lived transient (1-2 days per parcel, moving across fields)
    # =========================================================================
    agro_locations = [
        # Batch 1 (Days 4-5)
        {"day": 4, "lat": 30.9120, "lon": 75.8450, "frp": 12.4},
        {"day": 4, "lat": 30.8750, "lon": 75.9200, "frp": 8.6},
        {"day": 5, "lat": 30.9300, "lon": 75.8100, "frp": 14.2},
        # Batch 2 (Days 12-13)
        {"day": 12, "lat": 30.2450, "lon": 75.8300, "frp": 11.5},
        {"day": 12, "lat": 30.3300, "lon": 76.3800, "frp": 9.8},
        {"day": 13, "lat": 30.2900, "lon": 75.8900, "frp": 15.6},
        # Batch 3 (Days 20-21)
        {"day": 20, "lat": 29.6850, "lon": 76.9800, "frp": 16.8},
        {"day": 20, "lat": 29.8050, "lon": 76.4000, "frp": 7.4},
        {"day": 21, "lat": 29.7400, "lon": 76.8500, "frp": 13.1},
        # Batch 4 (Days 28-29)
        {"day": 28, "lat": 30.2100, "lon": 74.9450, "frp": 10.2},
        {"day": 28, "lat": 30.1500, "lon": 74.8800, "frp": 8.9},
        {"day": 29, "lat": 30.2600, "lon": 75.0200, "frp": 17.5},
    ]

    for idx, farm in enumerate(agro_locations):
        frp = farm["frp"]
        brightness_temp = round(306.0 + frp * 0.42, 1)

        hotspots.append(
            {
                "id": f"punjab-stubble-{farm['day']:02d}-{idx}",
                "latitude": round(farm["lat"] + random.uniform(-0.015, 0.015), 5),
                "longitude": round(farm["lon"] + random.uniform(-0.015, 0.015), 5),
                "frp": frp,
                "brightness_temp": brightness_temp,
                "timestamp": (start_date + timedelta(days=farm["day"], hours=6, minutes=45)).isoformat(),
                "context": "agricultural",
                "facility_name": None,
                "facility_type": None,
                "facility_category": None,
                "has_flares": False,
                "confidence": "nominal",
                "satellite": "MODIS",
                "sensor": "Aqua/Terra",
                "day_night": "D",
                "land_context": "cropland",
                "distance_to_facility_m": None,
                "source": "SIMULATED_DEMO",
            }
        )

    # =========================================================================
    # SCENARIO 7: UNCLASSIFIED ANOMALY
    # Spatial: Isolated coordinates in central Maharashtra Deccan plateau
    # Temporal: Single isolated event (Day 10, no persistence, unassigned)
    # =========================================================================
    hotspots.append(
        {
            "id": "unclassified-isolated-anomaly-day-10",
            "latitude": 19.2450,
            "longitude": 76.4120,
            "frp": 14.2,
            "brightness_temp": 314.5,
            "timestamp": (start_date + timedelta(days=10, hours=9, minutes=10)).isoformat(),
            "context": "unassigned",
            "facility_name": None,
            "facility_type": None,
            "facility_category": None,
            "has_flares": False,
            "confidence": "nominal",
            "satellite": "VIIRS_SNPP",
            "sensor": "VIIRS",
            "day_night": "D",
            "land_context": "unassigned scrubland",
            "distance_to_facility_m": None,
            "source": "SIMULATED_DEMO",
        }
    )

    # Sort deterministically by timestamp
    hotspots.sort(key=lambda h: h["timestamp"])
    return hotspots
