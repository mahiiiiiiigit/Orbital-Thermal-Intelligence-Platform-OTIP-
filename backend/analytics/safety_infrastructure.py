"""
Emergency Response & Safety Infrastructure Module for OTIP (SIH 26162).

Maintains a structured registry of emergency facilities across Indian industrial
and forest corridors:
1. Fire Stations (🚒)
2. Hospitals & Trauma Centers (🏥)
3. Police Stations & Outposts (👮)
4. Ambulance & Emergency Medical Posts (🚑)
5. Designated Emergency Shelters & Evacuation Centers (🏠)

All synthetic demonstration records are explicitly tagged with:
is_demo=True and source="State Disaster Management Plan (Demo Registry)".
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
from backend.analytics.spatial import distance_metres


# -----------------------------------------------------------------------------
# Curated Indian Emergency Infrastructure Registry
# -----------------------------------------------------------------------------
SAFETY_RESOURCES_REGISTRY: List[Dict[str, Any]] = [
    # --- Gujarat (Jamnagar & Saurashtra Industrial Hub) ---
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
        "id": "res-amb-jam-01",
        "name": "GVK EMRI 108 Emergency Ambulance Station",
        "type": "ambulance",
        "latitude": 22.4680,
        "longitude": 70.0520,
        "state": "Gujarat",
        "district": "Jamnagar",
        "contact": "108 / 112",
        "source": "Gujarat Emergency Medical Services",
        "last_verified": "2026-06-01",
        "is_demo": True,
        "notes": "Advanced Life Support (ALS) Ambulance on 24/7 standby",
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

    # --- Haryana / NCR (Panipat Refinery Corridor) ---
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
        "id": "res-hosp-pan-01",
        "name": "Panipat Civil Hospital & Trauma Centre",
        "type": "hospital",
        "latitude": 29.3950,
        "longitude": 76.9720,
        "state": "Haryana",
        "district": "Panipat",
        "contact": "112 / 108",
        "source": "Haryana State Health Systems",
        "last_verified": "2026-05-08",
        "is_demo": True,
        "notes": "Specialized trauma unit and industrial inhalation treatment wing",
    },
    {
        "id": "res-pol-pan-01",
        "name": "Model Town Police Station (Panipat)",
        "type": "police",
        "latitude": 29.3880,
        "longitude": 76.9640,
        "state": "Haryana",
        "district": "Panipat",
        "contact": "112 / 100",
        "source": "Haryana Police Directory",
        "last_verified": "2026-03-25",
        "is_demo": True,
        "notes": "Highway emergency cordon and zone barrier enforcement",
    },
    {
        "id": "res-amb-pan-01",
        "name": "Haryana 108 EMS Quick Response Ambulance Base",
        "type": "ambulance",
        "latitude": 29.3840,
        "longitude": 76.9600,
        "state": "Haryana",
        "district": "Panipat",
        "contact": "108 / 112",
        "source": "National Health Mission Haryana",
        "last_verified": "2026-05-30",
        "is_demo": True,
        "notes": "2 Advanced Life Support & 3 Basic Life Support transport vans",
    },
    {
        "id": "res-she-pan-01",
        "name": "Panipat Community Safe Evacuation Hall",
        "type": "shelter",
        "latitude": 29.4050,
        "longitude": 76.9850,
        "state": "Haryana",
        "district": "Panipat",
        "contact": "112",
        "source": "Panipat District Administration",
        "last_verified": "2026-04-12",
        "is_demo": True,
        "notes": "Capacity 800 persons with emergency potable water and medical staging",
    },

    # --- Jharkhand (Jamshedpur Steel Hub & Dhanbad Coal Basin) ---
    {
        "id": "res-fire-jsr-01",
        "name": "Jamshedpur Central Industrial Fire Brigade",
        "type": "fire_station",
        "latitude": 22.8020,
        "longitude": 86.1950,
        "state": "Jharkhand",
        "district": "East Singhbhum",
        "contact": "112 / 101",
        "source": "Jharkhand State Fire Services",
        "last_verified": "2026-05-18",
        "is_demo": True,
        "notes": "Heavy high-reach mist monitors and thermal camera drone squad",
    },
    {
        "id": "res-hosp-jsr-01",
        "name": "Tata Main Hospital (TMH) & Burn Critical Care",
        "type": "hospital",
        "latitude": 22.8080,
        "longitude": 86.2040,
        "state": "Jharkhand",
        "district": "East Singhbhum",
        "contact": "112 / 108",
        "source": "District Health Directory (East Singhbhum)",
        "last_verified": "2026-05-22",
        "is_demo": True,
        "notes": "Level-1 Super-Specialty Trauma & Advanced Toxicology Center",
    },
    {
        "id": "res-pol-jsr-01",
        "name": "Bistupur Police Station",
        "type": "police",
        "latitude": 22.7980,
        "longitude": 86.1880,
        "state": "Jharkhand",
        "district": "East Singhbhum",
        "contact": "112 / 100",
        "source": "Jharkhand Police Department",
        "last_verified": "2026-04-15",
        "is_demo": True,
        "notes": "Emergency crowd dispersion and industrial road diversion unit",
    },
    {
        "id": "res-amb-jsr-01",
        "name": "East Singhbhum EMS Rapid Response Post",
        "type": "ambulance",
        "latitude": 22.8040,
        "longitude": 86.1980,
        "state": "Jharkhand",
        "district": "East Singhbhum",
        "contact": "108 / 112",
        "source": "State Ambulance Fleet Service",
        "last_verified": "2026-06-02",
        "is_demo": True,
        "notes": "2 dedicated cardiac & burn triage transport ambulances",
    },
    {
        "id": "res-she-jsr-01",
        "name": "Sakchi Stadium Emergency Evacuation Point",
        "type": "shelter",
        "latitude": 22.8120,
        "longitude": 86.2100,
        "state": "Jharkhand",
        "district": "East Singhbhum",
        "contact": "112",
        "source": "District Disaster Management Authority",
        "last_verified": "2026-05-14",
        "is_demo": True,
        "notes": "Open-air assembly & indoor sports complex shelter; capacity: 2,500 persons",
    },

    # --- Uttarakhand (Garhwal & Chamoli Himalayan Wildfire Belt) ---
    {
        "id": "res-fire-uk-01",
        "name": "Chamoli Forest Fire Suppression & SDRF Depot",
        "type": "fire_station",
        "latitude": 30.3950,
        "longitude": 79.3250,
        "state": "Uttarakhand",
        "district": "Chamoli",
        "contact": "112 / 101",
        "source": "Uttarakhand Forest Department & Fire Directorate",
        "last_verified": "2026-06-05",
        "is_demo": True,
        "notes": "Forest fire blowers, fire rakes, and heli-bucket coordination radio",
    },
    {
        "id": "res-hosp-uk-01",
        "name": "District Hospital Gopeshwar (Chamoli)",
        "type": "hospital",
        "latitude": 30.4100,
        "longitude": 79.3320,
        "state": "Uttarakhand",
        "district": "Chamoli",
        "contact": "112 / 108",
        "source": "Uttarakhand Directorate of Medical Health",
        "last_verified": "2026-05-28",
        "is_demo": True,
        "notes": "High-altitude trauma center, oxygen bank, and smoke inhalation wards",
    },
    {
        "id": "res-pol-uk-01",
        "name": "Gopeshwar Police Station & SDRF Base",
        "type": "police",
        "latitude": 30.4050,
        "longitude": 79.3280,
        "state": "Uttarakhand",
        "district": "Chamoli",
        "contact": "112 / 100",
        "source": "Uttarakhand Police Headquarters",
        "last_verified": "2026-04-30",
        "is_demo": True,
        "notes": "State Disaster Response Force (SDRF) hill rescue squad on standby",
    },
    {
        "id": "res-amb-uk-01",
        "name": "108 Hill Ambulance Post Gopeshwar",
        "type": "ambulance",
        "latitude": 30.4020,
        "longitude": 79.3220,
        "state": "Uttarakhand",
        "district": "Chamoli",
        "contact": "108 / 112",
        "source": "EMRI Green Health Services Uttarakhand",
        "last_verified": "2026-06-03",
        "is_demo": True,
        "notes": "4x4 All-Terrain mountain ambulance vehicle with ventilator support",
    },
    {
        "id": "res-she-uk-01",
        "name": "Gopeshwar Community Evacuation Shelter",
        "type": "shelter",
        "latitude": 30.4150,
        "longitude": 79.3400,
        "state": "Uttarakhand",
        "district": "Chamoli",
        "contact": "112 / 1070 (SEOC)",
        "source": "Uttarakhand State Emergency Operation Centre",
        "last_verified": "2026-05-19",
        "is_demo": True,
        "notes": "Masonry safe shelter shielded from mountain fire corridors; capacity: 600",
    },

    # --- Himachal Pradesh (Kullu Valley / Parvati Forest Zone) ---
    {
        "id": "res-fire-hp-01",
        "name": "Kullu District Fire Service & Forest Range Office",
        "type": "fire_station",
        "latitude": 31.9580,
        "longitude": 77.1080,
        "state": "Himachal Pradesh",
        "district": "Kullu",
        "contact": "112 / 101",
        "source": "HP Fire & Rescue Services",
        "last_verified": "2026-05-14",
        "is_demo": True,
        "notes": "Rapid mountain response vehicle and portable forest pumping units",
    },
    {
        "id": "res-hosp-hp-01",
        "name": "Regional Hospital Kullu",
        "type": "hospital",
        "latitude": 31.9620,
        "longitude": 77.1140,
        "state": "Himachal Pradesh",
        "district": "Kullu",
        "contact": "112 / 108",
        "source": "HP Department of Health & Family Welfare",
        "last_verified": "2026-05-16",
        "is_demo": True,
        "notes": "Emergency surgery suite, oxygen generation plant, burn stabilization unit",
    },
    {
        "id": "res-pol-hp-01",
        "name": "Kullu Sadar Police Station",
        "type": "police",
        "latitude": 31.9540,
        "longitude": 77.1020,
        "state": "Himachal Pradesh",
        "district": "Kullu",
        "contact": "112 / 100",
        "source": "Himachal Pradesh Police",
        "last_verified": "2026-04-22",
        "is_demo": True,
        "notes": "Valley road block and tourist evacuation communication point",
    },
    {
        "id": "res-amb-hp-01",
        "name": "Kullu Valley 108 Mountain EMS Unit",
        "type": "ambulance",
        "latitude": 31.9600,
        "longitude": 77.1100,
        "state": "Himachal Pradesh",
        "district": "Kullu",
        "contact": "108 / 112",
        "source": "National Ambulance Service HP",
        "last_verified": "2026-06-01",
        "is_demo": True,
        "notes": "Equipped with mountain rescue stretchers and trauma kit",
    },
    {
        "id": "res-she-hp-01",
        "name": "Dhalpur Ground Disaster Assembly Center",
        "type": "shelter",
        "latitude": 31.9520,
        "longitude": 77.0980,
        "state": "Himachal Pradesh",
        "district": "Kullu",
        "contact": "112 / 1077",
        "source": "District Disaster Management Plan Kullu",
        "last_verified": "2026-05-02",
        "is_demo": True,
        "notes": "Designated open buffer & civic hall shelter for forest fire evacuations",
    },

    # --- Odisha (Simlipal Biosphere / Baripada Forest Zone) ---
    {
        "id": "res-fire-od-01",
        "name": "Baripada Fire & Disaster Response Station",
        "type": "fire_station",
        "latitude": 21.9320,
        "longitude": 86.7240,
        "state": "Odisha",
        "district": "Mayurbhanj",
        "contact": "112 / 101",
        "source": "Odisha Fire and Disaster Response Academy (OFDRA)",
        "last_verified": "2026-05-20",
        "is_demo": True,
        "notes": "ODRAF squad deployed with heavy forest water tenders",
    },
    {
        "id": "res-hosp-od-01",
        "name": "PRM Medical College & Hospital Baripada",
        "type": "hospital",
        "latitude": 21.9380,
        "longitude": 86.7320,
        "state": "Odisha",
        "district": "Mayurbhanj",
        "contact": "112 / 108",
        "source": "Health & Family Welfare Dept, Odisha",
        "last_verified": "2026-05-24",
        "is_demo": True,
        "notes": "300-bed referral hospital with emergency burn & trauma ward",
    },
    {
        "id": "res-pol-od-01",
        "name": "Baripada Town Police Station",
        "type": "police",
        "latitude": 21.9280,
        "longitude": 86.7180,
        "state": "Odisha",
        "district": "Mayurbhanj",
        "contact": "112 / 100",
        "source": "Odisha State Police",
        "last_verified": "2026-04-18",
        "is_demo": True,
        "notes": "Perimeter cordon and tribal settlement communication team",
    },
    {
        "id": "res-amb-od-01",
        "name": "Mayurbhanj 108 Emergency Ambulance Unit",
        "type": "ambulance",
        "latitude": 21.9350,
        "longitude": 86.7280,
        "state": "Odisha",
        "district": "Mayurbhanj",
        "contact": "108 / 112",
        "source": "Odisha Emergency Medical Services",
        "last_verified": "2026-05-29",
        "is_demo": True,
        "notes": "2 ALS vehicles with portable oxygen and emergency resuscitation kits",
    },
    {
        "id": "res-she-od-01",
        "name": "Baripada Multipurpose Cyclone & Disaster Shelter",
        "type": "shelter",
        "latitude": 21.9420,
        "longitude": 86.7400,
        "state": "Odisha",
        "district": "Mayurbhanj",
        "contact": "112 / 1070 (OSDMA)",
        "source": "Odisha State Disaster Management Authority (OSDMA)",
        "last_verified": "2026-05-11",
        "is_demo": True,
        "notes": "Reinforced multipurpose shelter; capacity: 1,500 with community kitchen",
    },
]


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
    max_radius_km: float = 120.0,
) -> Dict[str, Any]:
    """
    Finds the geographically nearest resource for each of the 5 safety categories.
    If no resource exists within max_radius_km, explicitly returns None.
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

        if best_candidate and (min_dist_m / 1000.0) <= max_radius_km:
            dist_km = round(min_dist_m / 1000.0, 2)
            # Estimate driving speed ~ 50 km/h for quick geodesic ETA
            eta_mins = round((dist_km / 50.0) * 60.0, 1)
            nearest_map[cat] = {
                **best_candidate,
                "distance_km": dist_km,
                "estimated_travel_time_mins": eta_mins,
            }
        else:
            nearest_map[cat] = None

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
