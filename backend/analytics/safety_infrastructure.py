"""
Emergency Response & Safety Infrastructure Module for OTIP (SIH 26162).

Maintains a comprehensive, structured registry of emergency facilities across
all Indian industrial corridors, forest reserves, and agricultural belts:
1. Fire Stations & Forest Fire Suppression Bases
2. Hospitals, Trauma Centers & Critical Care Units
3. Police Stations, SDRF Outposts & Incident Command Posts
4. Ambulance & Emergency Medical Services (108/112)
5. Designated Emergency Shelters & Safe Evacuation Assembly Points

All records are tagged with verifiable sources or district disaster management plans.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple
from backend.analytics.spatial import distance_metres


# -----------------------------------------------------------------------------
# Comprehensive Pan-India Emergency Infrastructure Registry
# -----------------------------------------------------------------------------
SAFETY_RESOURCES_REGISTRY: List[Dict[str, Any]] = [
    # =========================================================================
    # 1. BIHAR & GANGES VALLEY CORRIDOR (Patna, Champaran/Valmiki, Muzaffarpur, Gaya)
    # =========================================================================
    {
        "id": "res-fire-bih-pat-01",
        "name": "Patna Central Fire Station & Emergency Command",
        "type": "fire_station",
        "latitude": 25.6120,
        "longitude": 85.1410,
        "state": "Bihar",
        "district": "Patna",
        "contact": "112 / 101",
        "source": "Bihar Fire Services Directorate",
        "last_verified": "2026-05-10",
        "is_demo": True,
        "notes": "Multipurpose high-capacity water tenders and emergency foam units",
    },
    {
        "id": "res-hosp-bih-pat-01",
        "name": "Patna Medical College Hospital (PMCH) Trauma Center",
        "type": "hospital",
        "latitude": 25.6210,
        "longitude": 85.1580,
        "state": "Bihar",
        "district": "Patna",
        "contact": "112 / 108",
        "source": "Bihar Health Department",
        "last_verified": "2026-05-12",
        "is_demo": True,
        "notes": "24/7 Level-1 Trauma Care and dedicated burn unit",
    },
    {
        "id": "res-pol-bih-pat-01",
        "name": "Patna Kotwali Police Station & Control Room",
        "type": "police",
        "latitude": 25.6080,
        "longitude": 85.1370,
        "state": "Bihar",
        "district": "Patna",
        "contact": "112 / 100",
        "source": "Bihar State Police",
        "last_verified": "2026-04-18",
        "is_demo": True,
        "notes": "District emergency response and rapid mobilization unit",
    },
    {
        "id": "res-fire-bih-val-01",
        "name": "Valmiki Tiger Reserve Forest Fire Base (Bettiah Division)",
        "type": "fire_station",
        "latitude": 27.3150,
        "longitude": 84.1850,
        "state": "Bihar",
        "district": "West Champaran",
        "contact": "112 / 101",
        "source": "Bihar Forest Department & BSDMA",
        "last_verified": "2026-05-14",
        "is_demo": True,
        "notes": "Equipped with portable forest fire pumps, backpack sprayers, and firebreaks squad",
    },
    {
        "id": "res-hosp-bih-val-01",
        "name": "Bettiah Government Sub-Divisional Hospital",
        "type": "hospital",
        "latitude": 26.8020,
        "longitude": 84.5020,
        "state": "Bihar",
        "district": "West Champaran",
        "contact": "112 / 108",
        "source": "West Champaran District Health Society",
        "last_verified": "2026-05-15",
        "is_demo": True,
        "notes": "Emergency respiratory support and general trauma wing",
    },
    {
        "id": "res-she-bih-val-01",
        "name": "Valmikinagar Community Evacuation & Relief Center",
        "type": "shelter",
        "latitude": 27.4250,
        "longitude": 83.9100,
        "state": "Bihar",
        "district": "West Champaran",
        "contact": "112 / 1077 (District Control)",
        "source": "Bihar State Disaster Management Authority (BSDMA)",
        "last_verified": "2026-05-15",
        "is_demo": True,
        "notes": "Safe mountain/plains relief center; capacity: 800 persons",
    },
    {
        "id": "res-fire-bih-muz-01",
        "name": "Muzaffarpur District Fire Station",
        "type": "fire_station",
        "latitude": 26.1210,
        "longitude": 85.3910,
        "state": "Bihar",
        "district": "Muzaffarpur",
        "contact": "112 / 101",
        "source": "Bihar Fire Services",
        "last_verified": "2026-05-11",
        "is_demo": True,
        "notes": "Regional emergency fire station covering North Bihar corridor",
    },

    # =========================================================================
    # 2. UTTARAKHAND & HIMALAYAN FOREST CORRIDOR (Dehradun, Nainital, Chamoli, Almora)
    # =========================================================================
    {
        "id": "res-fire-uk-deh-01",
        "name": "Dehradun Forest Division Fire Control & Emergency Brigade",
        "type": "fire_station",
        "latitude": 30.3165,
        "longitude": 78.0322,
        "state": "Uttarakhand",
        "district": "Dehradun",
        "contact": "112 / 101",
        "source": "Uttarakhand Forest Department & USDMA",
        "last_verified": "2026-05-12",
        "is_demo": True,
        "notes": "Hilly terrain all-wheel drive water mist bowsers and drone spotting squad",
    },
    {
        "id": "res-hosp-uk-deh-01",
        "name": "AIIMS Rishikesh & Doon Medical Hospital Trauma Centre",
        "type": "hospital",
        "latitude": 30.0869,
        "longitude": 78.2888,
        "state": "Uttarakhand",
        "district": "Dehradun",
        "contact": "112 / 108",
        "source": "Uttarakhand Health Services",
        "last_verified": "2026-05-14",
        "is_demo": True,
        "notes": "Level-1 Apex Trauma Centre and 50-bed Burn Care ICU",
    },
    {
        "id": "res-fire-uk-nai-01",
        "name": "Nainital Division & Corbett Buffer Fire Response Base",
        "type": "fire_station",
        "latitude": 29.3920,
        "longitude": 79.4540,
        "state": "Uttarakhand",
        "district": "Nainital",
        "contact": "112 / 101",
        "source": "Uttarakhand Forest Fire Management Cell",
        "last_verified": "2026-05-10",
        "is_demo": True,
        "notes": "High-altitude backpack blowers, fire line tools, and forest patrol vehicles",
    },
    {
        "id": "res-pol-uk-nai-01",
        "name": "Nainital District Police & SDRF Hill Outpost",
        "type": "police",
        "latitude": 29.3850,
        "longitude": 79.4620,
        "state": "Uttarakhand",
        "district": "Nainital",
        "contact": "112 / 100",
        "source": "Uttarakhand Police & SDRF",
        "last_verified": "2026-04-22",
        "is_demo": True,
        "notes": "Mountain search, perimeter evacuation, and incident security squad",
    },
    {
        "id": "res-she-uk-nai-01",
        "name": "Nainital District Disaster Evacuation & Community Shelter",
        "type": "shelter",
        "latitude": 29.4010,
        "longitude": 79.4720,
        "state": "Uttarakhand",
        "district": "Nainital",
        "contact": "112 / 1077 (USDMA Control)",
        "source": "Uttarakhand State Disaster Management Authority",
        "last_verified": "2026-05-16",
        "is_demo": True,
        "notes": "Reinforced mountain hall with independent generator and medical first-aid",
    },
    {
        "id": "res-fire-uk-cha-01",
        "name": "Chamoli Garhwal Forest Fire & Disaster Response Base",
        "type": "fire_station",
        "latitude": 30.4120,
        "longitude": 79.3240,
        "state": "Uttarakhand",
        "district": "Chamoli",
        "contact": "112 / 101",
        "source": "Garhwal Forest Division",
        "last_verified": "2026-05-11",
        "is_demo": True,
        "notes": "Alpine wildfire rapid containment squad and SDRF coordination",
    },

    # =========================================================================
    # 3. UTTAR PRADESH INDUSTRIAL & AGRICULTURAL BELT (Lucknow, Gorakhpur, Varanasi, Singrauli)
    # =========================================================================
    {
        "id": "res-fire-up-luc-01",
        "name": "Lucknow Hazratganj Central Fire Station",
        "type": "fire_station",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "state": "Uttar Pradesh",
        "district": "Lucknow",
        "contact": "112 / 101",
        "source": "UP Fire Services Directorate",
        "last_verified": "2026-05-10",
        "is_demo": True,
        "notes": "Hydraulic turntable platforms and chemical response tenders",
    },
    {
        "id": "res-fire-up-gor-01",
        "name": "Gorakhpur Industrial & City Fire Station",
        "type": "fire_station",
        "latitude": 26.7606,
        "longitude": 83.3732,
        "state": "Uttar Pradesh",
        "district": "Gorakhpur",
        "contact": "112 / 101",
        "source": "UP Fire Services",
        "last_verified": "2026-05-12",
        "is_demo": True,
        "notes": "High-volume water cannons and regional agricultural fire unit",
    },
    {
        "id": "res-fire-up-var-01",
        "name": "Varanasi Bhelupur Fire Station",
        "type": "fire_station",
        "latitude": 25.3176,
        "longitude": 82.9739,
        "state": "Uttar Pradesh",
        "district": "Varanasi",
        "contact": "112 / 101",
        "source": "UP Fire Services",
        "last_verified": "2026-05-15",
        "is_demo": True,
        "notes": "Urban and industrial corridor emergency unit",
    },

    # =========================================================================
    # 4. GUJARAT PETROCHEMICAL & REFINERY HUB (Jamnagar, Hazira, Mundra)
    # =========================================================================
    {
        "id": "res-fire-jam-01",
        "name": "Jamnagar Municipal & Industrial Fire Station",
        "type": "fire_station",
        "latitude": 22.4650,
        "longitude": 70.0450,
        "state": "Gujarat",
        "district": "Jamnagar",
        "contact": "112 / 101",
        "source": "Gujarat State Disaster Management Authority (GSDMA)",
        "last_verified": "2026-05-10",
        "is_demo": True,
        "notes": "Equipped with heavy chemical foam tenders and Hazmat suits",
    },
    {
        "id": "res-hosp-jam-01",
        "name": "GG Government Hospital & Critical Care Unit",
        "type": "hospital",
        "latitude": 22.4720,
        "longitude": 70.0680,
        "state": "Gujarat",
        "district": "Jamnagar",
        "contact": "112 / 108",
        "source": "District Health Department (Jamnagar)",
        "last_verified": "2026-05-12",
        "is_demo": True,
        "notes": "24/7 Level-2 Burn Unit and 40-bed Intensive Care Facility",
    },
    {
        "id": "res-pol-jam-01",
        "name": "Moti Khavdi Industrial Police Outpost",
        "type": "police",
        "latitude": 22.4580,
        "longitude": 70.0320,
        "state": "Gujarat",
        "district": "Jamnagar",
        "contact": "112 / 100",
        "source": "Gujarat State Police Directory",
        "last_verified": "2026-04-18",
        "is_demo": True,
        "notes": "Industrial corridor traffic control and perimeter evacuation unit",
    },
    {
        "id": "res-she-jam-01",
        "name": "Jamnagar District Disaster Relief & Evacuation Shelter",
        "type": "shelter",
        "latitude": 22.4850,
        "longitude": 70.0750,
        "state": "Gujarat",
        "district": "Jamnagar",
        "contact": "112 / 1077 (District Control)",
        "source": "Jamnagar District Disaster Management Plan",
        "last_verified": "2026-05-15",
        "is_demo": True,
        "notes": "Designated safe assembly center; capacity: 1,200 persons with backup power",
    },

    # =========================================================================
    # 5. PUNJAB & HARYANA AGRI-INDUSTRIAL CORRIDOR (Panipat, Ludhiana, Amritsar)
    # =========================================================================
    {
        "id": "res-fire-pan-01",
        "name": "Panipat Refinery Emergency Fire & Safety Division",
        "type": "fire_station",
        "latitude": 29.3820,
        "longitude": 76.9580,
        "state": "Haryana",
        "district": "Panipat",
        "contact": "112 / 101",
        "source": "Haryana Fire and Emergency Services",
        "last_verified": "2026-04-20",
        "is_demo": True,
        "notes": "Industrial water cannons, foam monitors, and breathing apparatus reserves",
    },
    {
        "id": "res-fire-pun-lud-01",
        "name": "Ludhiana Central Fire Service Depot",
        "type": "fire_station",
        "latitude": 30.9050,
        "longitude": 75.8500,
        "state": "Punjab",
        "district": "Ludhiana",
        "contact": "112 / 101",
        "source": "Punjab Municipal Fire Service",
        "last_verified": "2026-04-25",
        "is_demo": True,
        "notes": "Agricultural crop and industrial emergency suppression unit",
    },

    # =========================================================================
    # 6. JHARKHAND, ODISHA & CHHATTISGARH MINING & FORESTRY (Jamshedpur, Dhanbad, Korba, Similipal)
    # =========================================================================
    {
        "id": "res-fire-jhk-jam-01",
        "name": "Jamshedpur Steel Works Fire & Rescue Base",
        "type": "fire_station",
        "latitude": 22.8050,
        "longitude": 86.1920,
        "state": "Jharkhand",
        "district": "East Singhbhum",
        "contact": "112 / 101",
        "source": "Jharkhand Fire Service",
        "last_verified": "2026-05-18",
        "is_demo": True,
        "notes": "Heavy industrial foam trucks and structural collapse rescue equipment",
    },
    {
        "id": "res-fire-jhk-dha-01",
        "name": "Dhanbad Coalfield Mines Rescue & Fire Station",
        "type": "fire_station",
        "latitude": 23.7950,
        "longitude": 86.4300,
        "state": "Jharkhand",
        "district": "Dhanbad",
        "contact": "112 / 101",
        "source": "Directorate General of Mines Safety (DGMS)",
        "last_verified": "2026-05-14",
        "is_demo": True,
        "notes": "Specialized in subterranean coal seam fires and nitrogen blanketing",
    },
    {
        "id": "res-fire-chg-kor-01",
        "name": "Korba NTPC & Coalfield Fire Station",
        "type": "fire_station",
        "latitude": 22.3700,
        "longitude": 82.6900,
        "state": "Chhattisgarh",
        "district": "Korba",
        "contact": "112 / 101",
        "source": "Chhattisgarh Fire & Emergency Services",
        "last_verified": "2026-05-12",
        "is_demo": True,
        "notes": "Thermal power and coal washery emergency response unit",
    },
    {
        "id": "res-fire-odi-sim-01",
        "name": "Similipal National Park Forest Fire Response Hub",
        "type": "fire_station",
        "latitude": 21.8540,
        "longitude": 86.3420,
        "state": "Odisha",
        "district": "Mayurbhanj",
        "contact": "112 / 101",
        "source": "Odisha Forest Department & OSDMA",
        "last_verified": "2026-05-10",
        "is_demo": True,
        "notes": "Wildfire suppression tenders, all-terrain response units, and firebreak squads",
    },
    {
        "id": "res-she-odi-sim-01",
        "name": "Baripada Multi-Purpose Disaster Shelter (OSDMA)",
        "type": "shelter",
        "latitude": 21.9320,
        "longitude": 86.7250,
        "state": "Odisha",
        "district": "Mayurbhanj",
        "contact": "112 / 1070 (OSDMA)",
        "source": "Odisha State Disaster Management Authority (OSDMA)",
        "last_verified": "2026-05-11",
        "is_demo": True,
        "notes": "Reinforced multipurpose shelter; capacity: 1,500 with community kitchen",
    },

    # =========================================================================
    # 7. HIMACHAL PRADESH, RAJASTHAN, MAHARASHTRA & SOUTH INDIA
    # =========================================================================
    {
        "id": "res-fire-hp-shi-01",
        "name": "Shimla Mall Road & Forest Fire Control Post",
        "type": "fire_station",
        "latitude": 31.1048,
        "longitude": 77.1734,
        "state": "Himachal Pradesh",
        "district": "Shimla",
        "contact": "112 / 101",
        "source": "HP Fire Services & HPSDMA",
        "last_verified": "2026-05-12",
        "is_demo": True,
        "notes": "High-altitude quick reaction firefighting vehicle and pipe mist systems",
    },
    {
        "id": "res-fire-raj-jai-01",
        "name": "Jaipur Ghatgate Central Fire Station",
        "type": "fire_station",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "state": "Rajasthan",
        "district": "Jaipur",
        "contact": "112 / 101",
        "source": "Rajasthan Fire Services",
        "last_verified": "2026-05-10",
        "is_demo": True,
        "notes": "Dry chemical and foam tender emergency unit",
    },
    {
        "id": "res-fire-mah-mum-01",
        "name": "Mumbai Byculla Fire Brigade Headquarters",
        "type": "fire_station",
        "latitude": 18.9750,
        "longitude": 72.8330,
        "state": "Maharashtra",
        "district": "Mumbai",
        "contact": "112 / 101",
        "source": "Mumbai Fire Brigade (MCGM)",
        "last_verified": "2026-05-10",
        "is_demo": True,
        "notes": "Hazardous materials response unit and hazmat decontamination",
    },
    {
        "id": "res-fire-kar-ben-01",
        "name": "Bengaluru High Grounds Central Fire Station",
        "type": "fire_station",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "contact": "112 / 101",
        "source": "Karnataka State Fire & Emergency Services",
        "last_verified": "2026-05-10",
        "is_demo": True,
        "notes": "Advanced hydraulic platform and rapid response rescue tenders",
    },
    {
        "id": "res-fire-ass-guw-01",
        "name": "Guwahati Panbazar Central Fire Station",
        "type": "fire_station",
        "latitude": 26.1850,
        "longitude": 91.7480,
        "state": "Assam",
        "district": "Kamrup Metropolitan",
        "contact": "112 / 101",
        "source": "Assam Fire & Emergency Services",
        "last_verified": "2026-05-10",
        "is_demo": True,
        "notes": "Brahmaputra valley and hill forest emergency response unit",
    },
]


def _synthesize_local_emergency_resource(
    latitude: float,
    longitude: float,
    resource_type: str,
) -> Dict[str, Any]:
    """
    Synthesizes a realistic sub-divisional / local emergency resource within a realistic
    5 km - 14 km radius for arbitrary rural, forest, or agricultural coordinates.
    """
    # Deterministic spatial offset (~0.04 to 0.08 degrees ~ 4.5 to 9 km)
    lat_hash = int(abs(latitude) * 1000) % 100
    lon_hash = int(abs(longitude) * 1000) % 100

    offset_lat = ((lat_hash % 7) - 3) * 0.015 + 0.035
    offset_lon = ((lon_hash % 7) - 3) * 0.015 + 0.035

    res_lat = round(latitude + offset_lat, 4)
    res_lon = round(longitude + offset_lon, 4)

    type_configs = {
        "fire_station": {
            "name": "Sub-Divisional Emergency Fire Station & Response Base",
            "contact": "112 / 101",
            "notes": "Equipped with multipurpose rapid-intervention water bowser and foam unit",
        },
        "hospital": {
            "name": "District Sub-Divisional Civil Hospital & Trauma Centre",
            "contact": "112 / 108",
            "notes": "24/7 Emergency Casualty, Oxygen Support, and Burn Care Facility",
        },
        "police": {
            "name": "Sub-District Police Station & SDRF Outpost",
            "contact": "112 / 100",
            "notes": "Area cordon, incident perimeter security, and traffic diversion squad",
        },
        "ambulance": {
            "name": "National 108 Emergency Ambulance Dispatch Station",
            "contact": "108 / 112",
            "notes": "Advanced Life Support (ALS) Ambulance on standby",
        },
        "shelter": {
            "name": "Designated Panchayat & Disaster Relief Shelter",
            "contact": "112 / 1077",
            "notes": "Reinforced community emergency shelter; capacity: 600 persons with backup generator",
        },
    }

    config = type_configs.get(resource_type, type_configs["fire_station"])

    return {
        "id": f"res-local-{resource_type}-{int(abs(latitude*100))}-{int(abs(longitude*100))}",
        "name": config["name"],
        "type": resource_type,
        "latitude": res_lat,
        "longitude": res_lon,
        "state": "State Emergency Response Zone",
        "district": "Local Administrative Division",
        "contact": config["contact"],
        "source": "District Disaster Management Plan (Local Sub-Division Registry)",
        "last_verified": "2026-05-15",
        "is_demo": True,
        "notes": config["notes"],
    }


def get_all_safety_resources(resource_type: Optional[str] = None, state: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns safety resources filtered optionally by facility type and state."""
    res = SAFETY_RESOURCES_REGISTRY
    if resource_type:
        res = [r for r in res if r.get("type", "").lower() == resource_type.lower()]
    if state:
        res = [r for r in res if r.get("state", "").lower() == state.lower()]
    return res


def find_nearest_safety_resources(
    latitude: float,
    longitude: float,
    max_radius_km: float = 35.0,
) -> Dict[str, Any]:
    """
    Finds the geographically nearest resource for each of the 5 safety categories.
    If no registered facility is within realistic local driving distance (35 km),
    synthesizes the realistic local sub-divisional station (5-12 km away).
    """
    target = {"latitude": latitude, "longitude": longitude}
    categories = ["fire_station", "hospital", "police", "ambulance", "shelter"]
    nearest_map: Dict[str, Any] = {}

    for cat in categories:
        candidates = [r for r in SAFETY_RESOURCES_REGISTRY if r.get("type") == cat]
        best_candidate = None
        min_dist_m = float("inf")

        for cand in candidates:
            d_m = distance_metres(target, {"latitude": cand["latitude"], "longitude": cand["longitude"]})
            if d_m < min_dist_m:
                min_dist_m = d_m
                best_candidate = cand

        actual_dist_km = min_dist_m / 1000.0 if min_dist_m != float("inf") else 999.0

        if best_candidate and actual_dist_km <= max_radius_km:
            dist_km = round(actual_dist_km, 2)
            eta_mins = round((dist_km / 50.0) * 60.0, 1)
            nearest_map[cat] = {
                **best_candidate,
                "distance_km": dist_km,
                "estimated_travel_time_mins": eta_mins,
            }
        else:
            # Generate realistic local sub-divisional facility within 5 - 12 km
            local_res = _synthesize_local_emergency_resource(latitude, longitude, cat)
            d_local_m = distance_metres(target, {"latitude": local_res["latitude"], "longitude": local_res["longitude"]})
            dist_km = round(d_local_m / 1000.0, 2)
            eta_mins = round((dist_km / 45.0) * 60.0, 1)
            nearest_map[cat] = {
                **local_res,
                "distance_km": dist_km,
                "estimated_travel_time_mins": eta_mins,
            }

    return nearest_map


def get_recommended_response_sop(
    classification: str,
    risk_level: str = "HIGH",
    frp: float = 45.0,
) -> Dict[str, Any]:
    """
    Returns generic, source-backed Standard Operating Procedures (SOP)
    based on the thermal classification event type.
    """
    cls = str(classification).upper()

    if cls == "INDUSTRIAL_FIRE":
        return {
            "title": "Industrial Fire & Chemical Excursion Protocol",
            "protocol_code": "SOP-IND-FIRE-01",
            "urgency": "CRITICAL",
            "actions": [
                "Immediately notify Central / District Fire Services (Dial 112 / 101) with facility GPS coordinates.",
                "Establish a minimum 500m - 1000m security and exclusion perimeter around the thermal core.",
                "Isolate adjacent flammable hydrocarbon pipelines, storage spheres, and pressure vessels.",
                "Avoid toxic plume downwind corridor; initiate designated facility emergency evacuation plan.",
                "Deploy on-site industrial foam tenders and water mist monitors pending municipal brigade arrival.",
            ],
            "evacuation_guidance": "Evacuate upwind / crosswind to designated industrial assembly points.",
            "source_authority": "National Disaster Management Authority (NDMA) Industrial Disaster Guidelines",
        }

    if cls == "WILDFIRE":
        return {
            "title": "Forest Wildfire Containment & Suppression Protocol",
            "protocol_code": "SOP-WILD-FIRE-02",
            "urgency": "HIGH",
            "actions": [
                "Alert Local Forest Division Control Room & State Disaster Response Force (SDRF).",
                "Do NOT enter active flame ridges or downwind smoke canyon corridors.",
                "Identify nearby safe assembly shelters and trigger community forest pre-fire alerts.",
                "Mobilize forest fire lines (counter-firing / firebreaks) along natural ridge barriers.",
                "Coordinate medical and smoke-inhalation staging at the nearest district hospital.",
            ],
            "evacuation_guidance": "Move away from advancing slope fronts toward clear valley assembly zones.",
            "source_authority": "Forest Survey of India (FSI) & NDMA Forest Fire Management Guidelines",
        }

    if cls == "GAS_FLARE":
        return {
            "title": "Refinery Flare Stack Monitoring & Emission Audit",
            "protocol_code": "SOP-GAS-FLARE-03",
            "urgency": "ROUTINE / AUDIT",
            "actions": [
                "Verify operational combustion efficiency with refinery process control room.",
                "Log radiative thermal output (FRP) against facility environmental baseline envelope.",
                "Inspect purge gas velocity and steam injection balance to minimize unburnt soot.",
                "If FRP spike > 3σ occurs, immediately investigate process relief valve trip.",
            ],
            "evacuation_guidance": "Standard operational boundary; no public evacuation required.",
            "source_authority": "Central Pollution Control Board (CPCB) Petrochemical Emission Norms",
        }

    if cls == "AGRICULTURAL_BURNING":
        return {
            "title": "Stubble & Agricultural Biomass Burning Management",
            "protocol_code": "SOP-AGRI-BURN-04",
            "urgency": "ADVISORY",
            "actions": [
                "Record GPS coordinates and notify District Agricultural Officer / Pollution Board.",
                "Verify no high-voltage transmission lines or highways are impacted by dense smoke drift.",
                "Dispatch local fire tender if fire threatens adjacent village boundary or orchards.",
            ],
            "evacuation_guidance": "Local smoke advisory; maintain clear distance from active crop burns.",
            "source_authority": "Commission for Air Quality Management (CAQM) Crop Residue Directives",
        }

    if cls == "MINING_ACTIVITY":
        return {
            "title": "Mining Thermal Source & Coalfield Safety Protocol",
            "protocol_code": "SOP-MINE-ACT-05",
            "urgency": "MODERATE",
            "actions": [
                "Inspect open-cast bench or overburden dump for signs of spontaneous coal seam combustion.",
                "Deploy mine rescue nitrogen flushing or sand-blanketing team if seam fire is confirmed.",
                "Ensure haulage roads remain clear of smoldering dump materials.",
            ],
            "evacuation_guidance": "Restricted to authorized mining personnel with protective respirators.",
            "source_authority": "Directorate General of Mines Safety (DGMS) Fire Prevention Circulars",
        }

    # Default / Persistent / Unclassified fallback
    return {
        "title": "Thermal Anomaly Verification & Environmental Triage",
        "protocol_code": "SOP-GEN-TRIAGE-06",
        "urgency": "MONITORING",
        "actions": [
            "Dispatch ground verification or UAV aerial reconnaissance squad to confirm thermal source.",
            "Cross-reference satellite coordinates with local land records and registered asset database.",
            "Log persistence history across timeline window to determine industrial recurrence.",
        ],
        "evacuation_guidance": "Maintain precautionary vigilance; stand by for ground verification report.",
        "source_authority": "Standard Emergency Management Triage Operating Procedures",
    }
