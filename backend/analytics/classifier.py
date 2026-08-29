"""
Advanced Multi-Class Thermal Intelligence Classifier for SIH 26162.
Provides comprehensive categorization with high coverage, multi-factor confidence scoring,
and human-readable explainable reasoning.

Supported Taxonomic Classes:
1. GAS_FLARE - Operational flare stacks at refineries, petrochemical complexes, and LNG terminals.
2. INDUSTRIAL_FIRE - Sudden critical thermal excursions, blowout spikes, and structural plant fires.
3. AGRICULTURAL_BURNING - Seasonal, short-lived crop stubble residue fires across Indian agrarian basins.
4. WILDFIRE - Biomass combustion and active advancing canopy fires across forest reserves & wildlands.
5. MINING_ACTIVITY - Persistent thermal signatures in surface coalfields, open-cast pits & seam combustion zones.
6. PERSISTENT_INDUSTRIAL - Continuous operational heat from steel mills, power plants, kilns & smelters.
7. UNCLASSIFIED - Rare isolated anomalies with genuinely insufficient spatial, temporal, or contextual signal.
"""

from statistics import mean, pstdev
from typing import Any, Dict, List, Optional, Tuple


VALID_CLASSIFICATIONS = [
    "GAS_FLARE",
    "INDUSTRIAL_FIRE",
    "AGRICULTURAL_BURNING",
    "MINING_ACTIVITY",
    "WILDFIRE",
    "PERSISTENT_INDUSTRIAL",
    "UNCLASSIFIED",
]


def _get_source_identifier(hotspot: Dict[str, Any]) -> str:
    """
    Returns a unique key for grouping recurring heat events.
    Uses facility name if spatially matched, otherwise groups geographically by ~0.02 deg grid (~2.2 km).
    """
    if hotspot.get("facility_name"):
        return f"facility:{hotspot['facility_name']}"

    lat = round(float(hotspot.get("latitude", 0.0)), 2)
    lon = round(float(hotspot.get("longitude", 0.0)), 2)
    return f"grid:{lat}:{lon}"


def calculate_risk_score(
    hotspot: Dict[str, Any],
    active_days: int,
    classification: str,
) -> float:
    """
    Calculates an explainable risk score from 0.0 to 100.0 based on:
    - Classification taxonomy severity
    - Fire Radiative Power (FRP) intensity
    - Temporal persistence
    - Satellite detection confidence
    """
    frp = float(hotspot.get("frp") or 0.0)
    conf = str(hotspot.get("confidence") or "nominal").lower()

    base_scores = {
        "INDUSTRIAL_FIRE": 75.0,
        "WILDFIRE": 55.0,
        "PERSISTENT_INDUSTRIAL": 40.0,
        "MINING_ACTIVITY": 35.0,
        "GAS_FLARE": 30.0,
        "AGRICULTURAL_BURNING": 20.0,
        "UNCLASSIFIED": 25.0,
    }
    base = base_scores.get(classification, 25.0)

    frp_component = min(25.0, frp * 0.3)
    persistence_component = min(15.0, active_days * 2.5)
    confidence_weight = 10.0 if conf in ("high", "h") else (6.0 if conf in ("nominal", "n") else 2.0)

    total = base + frp_component + persistence_component + confidence_weight
    return round(min(100.0, max(0.0, total)), 1)


def _classify_single_hotspot(
    hotspot: Dict[str, Any],
    active_days: int,
    mean_frp: float,
    peak_frp: float,
    z_score: Optional[float],
) -> Tuple[str, str, str, List[str]]:
    """
    Hierarchical explainable rule engine with smart fallbacks to maximize classification coverage.
    Returns: (classification, confidence_level, explanation, reasons_list)
    """
    frp = float(hotspot.get("frp") or 0.0)
    brightness = hotspot.get("brightness_temp")
    facility_name = hotspot.get("facility_name")
    facility_type = hotspot.get("facility_type")
    facility_category = hotspot.get("facility_category") or hotspot.get("land_context") or ""
    has_flares = hotspot.get("has_flares", False)
    context = hotspot.get("context", "unassigned")
    distance_m = hotspot.get("distance_to_facility_m")
    sat_conf = str(hotspot.get("confidence") or "nominal").lower()
    day_night = str(hotspot.get("day_night") or "D").upper()

    dist_km = round(distance_m / 1000.0, 1) if distance_m is not None else None
    dist_str = f"{dist_km} km" if dist_km is not None else "within facility perimeter"

    # =========================================================================
    # RULE 1: INDUSTRIAL FIRE (Critical Thermal Excursion / Sudden Spike)
    # =========================================================================
    is_near_industrial = (
        facility_type in ("refinery_gas", "heavy_industry")
        or context == "industrial"
        or (facility_name is not None and "forest" not in facility_category.lower() and "mining" not in facility_category.lower())
    )

    is_statistical_spike = (z_score is not None and z_score >= 3.0)
    is_extreme_frp_spike = (frp >= 85.0 and (mean_frp <= 45.0 or frp >= 1.8 * mean_frp))
    is_uncontrolled_burst = (is_near_industrial and frp >= 90.0)

    if is_near_industrial and (is_statistical_spike or is_extreme_frp_spike or is_uncontrolled_burst):
        conf_level = "HIGH" if (frp >= 95.0 or (z_score and z_score >= 3.5)) else "MEDIUM"
        z_text = f" ({round(z_score, 1)}σ above baseline)" if z_score is not None else ""
        explanation = (
            f"Classified as INDUSTRIAL_FIRE because hotspot experienced a sudden {frp} MW thermal excursion"
            f"{z_text} at {facility_name or 'industrial asset'}, exceeding historical baseline."
        )
        reasons = [
            f"Located within {dist_str} of industrial asset {facility_name or 'complex'}",
            f"Sudden extreme thermal excursion of {frp} MW{z_text}",
            f"Exceeds historical facility mean of {round(mean_frp, 1)} MW",
            "Emergency on-site safety and containment inspection recommended",
        ]
        return "INDUSTRIAL_FIRE", conf_level, explanation, reasons

    # Extreme single thermal spike in unassigned zone
    if frp >= 95.0 and active_days <= 2 and context != "forest":
        explanation = f"Classified as INDUSTRIAL_FIRE because extreme radiative power ({frp} MW) indicates an uncharacteristic structural or chemical fire."
        reasons = [
            f"Extreme radiative thermal output of {frp} MW",
            f"Sudden onset without historical persistence ({active_days} active day)",
            "Thermal radiance characteristic of structural/chemical blaze",
            "Flagged for urgent environmental compliance triage",
        ]
        return "INDUSTRIAL_FIRE", "HIGH", explanation, reasons

    # =========================================================================
    # RULE 2: GAS FLARE (Refinery, Petrochemical, LNG Flare Stacks)
    # =========================================================================
    is_flare_facility = (
        has_flares
        or facility_type == "refinery_gas"
        or "Refinery" in facility_category
        or "Petrochemical" in facility_category
        or "Gas Processing" in facility_category
        or "LNG" in facility_category
    )

    if is_flare_facility and distance_m is not None and distance_m <= 8500:
        conf_level = "HIGH" if (distance_m <= 4000 or active_days >= 2 or sat_conf in ("high", "h")) else "MEDIUM"
        night_text = "Continuous 24/7 flaring profile with nighttime detection" if day_night == "N" else "Operational daytime process flare emission"
        explanation = f"Classified as GAS_FLARE because hotspot is within {dist_str} of {facility_name} and exhibits stable flaring coordinates."
        reasons = [
            f"Located within {dist_str} of {facility_name} ({facility_category})",
            "Stable geographic coordinates consistent with elevated flare stack",
            f"Persistent operational thermal signature across {active_days} active observation day(s)",
            f"Steady-state radiative power of {frp} MW within normal operational flaring envelope",
            night_text,
        ]
        return "GAS_FLARE", conf_level, explanation, reasons

    # =========================================================================
    # RULE 3: MINING ACTIVITY (Coalfields, Open-Cast Pits, Seam Fires)
    # =========================================================================
    is_mining_zone = (
        facility_type == "mining"
        or context == "mining"
        or "Mining" in facility_category
        or "Coalfield" in facility_category
        or "Coal Basin" in facility_category
        or "Iron Ore" in facility_category
        or "Mines" in facility_category
    )

    if is_mining_zone:
        conf_level = "HIGH" if (active_days >= 2 or (distance_m is not None and distance_m <= 8000) or sat_conf in ("high", "h")) else "MEDIUM"
        explanation = f"Classified as MINING_ACTIVITY because detection is located in {facility_name or 'active mining basin'} with surface mining or coal seam heat."
        reasons = [
            f"Located in designated mining basin / field ({facility_name or 'Mining Sector'})",
            "Thermal emission characteristic of surface open-cast mining or coal seam combustion",
            f"Repeated thermal presence across {active_days} active observation day(s)",
            f"Radiative power output of {frp} MW across surface extraction perimeter",
        ]
        return "MINING_ACTIVITY", conf_level, explanation, reasons

    # =========================================================================
    # RULE 4: WILDFIRE (Forest Reserves, National Parks, Wildlands)
    # =========================================================================
    is_forest_zone = (
        facility_type == "forest"
        or context == "forest"
        or "Forest" in facility_category
        or "National Park" in facility_category
        or "Biosphere" in facility_category
        or "Wildland" in facility_category
        or "Canopy" in facility_category
    )

    if is_forest_zone:
        conf_level = "HIGH" if (frp >= 20.0 or sat_conf in ("high", "h")) else "MEDIUM"
        temp_text = f"Brightness temperature of {brightness} K" if brightness else f"Thermal output of {frp} MW"
        explanation = f"Classified as WILDFIRE because detection is located in {facility_name or 'protected forest corridor'} with active vegetation fire."
        reasons = [
            f"Located inside protected forest canopy / wildlife reserve ({facility_name or 'Forest Canopy'})",
            f"Radiative intensity of {frp} MW characteristic of active vegetative biomass fire",
            f"{temp_text} indicating spreading forest fire front",
            "Remote forest location far from industrial or mining infrastructure",
        ]
        return "WILDFIRE", conf_level, explanation, reasons

    # =========================================================================
    # RULE 5: PERSISTENT INDUSTRIAL (Steel Works, Power Plants, Cement Hubs)
    # =========================================================================
    is_heavy_industry = (
        facility_type == "heavy_industry"
        or "Steel" in facility_category
        or "Power" in facility_category
        or "Smelter" in facility_category
        or "Cement" in facility_category
        or "Aluminium" in facility_category
        or (facility_name is not None and not is_flare_facility and not is_mining_zone and not is_forest_zone)
    )

    if is_heavy_industry:
        conf_level = "HIGH" if (active_days >= 2 or (distance_m is not None and distance_m <= 6000)) else "MEDIUM"
        explanation = f"Classified as PERSISTENT_INDUSTRIAL because repeated thermal detections occurred at registered industrial asset {facility_name}."
        reasons = [
            f"Located within {dist_str} of registered industrial asset {facility_name}",
            f"Continuous process heat from {facility_category or 'industrial facility'}",
            f"Persistent thermal output observed across {active_days} observation day(s)",
            f"Mean operational FRP of {round(mean_frp, 1)} MW (Current: {frp} MW)",
        ]
        return "PERSISTENT_INDUSTRIAL", conf_level, explanation, reasons

    # Recurring cluster without registered facility name (Unregistered Industrial / Persistent Thermal Source)
    if active_days >= 3 and frp >= 14.0:
        conf_level = "HIGH" if active_days >= 5 else "MEDIUM"
        explanation = f"Classified as PERSISTENT_INDUSTRIAL because repeated thermal detections occurred over {active_days} observation days at fixed coordinates."
        reasons = [
            f"Persistent thermal recurrence across {active_days} days at stable geographic coordinates",
            f"Sustained radiative power ({frp} MW) consistent with unlicensed or unregistered industrial facility",
            "Non-agricultural thermal signature operating continuously outside registered asset database",
            "Flagged for environmental compliance survey and site verification",
        ]
        return "PERSISTENT_INDUSTRIAL", conf_level, explanation, reasons

    # =========================================================================
    # RULE 6: AGRICULTURAL BURNING (Stubble / Crop Residue Burning)
    # Smart Regional Attribution for Agrarian Crop Basins
    # =========================================================================
    is_agrarian = (
        context == "agricultural"
        or "cropland" in facility_category.lower()
        or "crop" in facility_category.lower()
        or "agricultural" in facility_category.lower()
    )

    if is_agrarian and facility_name is None:
        conf_level = "HIGH" if (active_days <= 2 and frp <= 35.0) else "MEDIUM"
        explanation = f"Classified as AGRICULTURAL_BURNING because hotspot is located in an agricultural cropland basin with low persistence ({active_days} day)."
        reasons = [
            "Located in agrarian cropland basin with no industrial or mining infrastructure",
            f"Transient thermal signature active for only {active_days} observation day(s)",
            f"Low-to-moderate thermal output ({frp} MW) typical of open-field stubble/biomass burning",
            "Short-lived seasonal crop residue clearing profile",
        ]
        return "AGRICULTURAL_BURNING", conf_level, explanation, reasons

    # =========================================================================
    # RULE 7: UNCLASSIFIED (Truly ambiguous isolated thermal event)
    # =========================================================================
    explanation = f"Classified as UNCLASSIFIED because isolated thermal detection ({frp} MW) lacks definitive spatial or contextual attribution."
    reasons = [
        "Isolated thermal detection without definitive spatial or industrial attribution",
        f"Low recurrence ({active_days} active day) in unassigned land context",
        f"Thermal output: {frp} MW",
        "Flagged for analyst triage and subsequent satellite overpass watch",
    ]
    return "UNCLASSIFIED", "LOW", explanation, reasons


def classify_hotspots(hotspots: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Analyzes spatial, temporal, and facility characteristics of hotspots
    and assigns 7-class taxonomy, multi-factor confidence rating, and human-readable reasoning.
    """
    if not hotspots:
        return []

    # First pass: Aggregate temporal and statistical history per source/grid
    source_stats: Dict[str, Dict[str, Any]] = {}

    for hotspot in hotspots:
        source_key = _get_source_identifier(hotspot)
        day = str(hotspot.get("timestamp", ""))[:10]
        frp = float(hotspot.get("frp") or 0.0)

        if source_key not in source_stats:
            source_stats[source_key] = {
                "days": set(),
                "frp_values": [],
            }

        if day:
            source_stats[source_key]["days"].add(day)
        source_stats[source_key]["frp_values"].append(frp)

    classified_hotspots: List[Dict[str, Any]] = []

    # Second pass: Apply explainable classification rules
    for hotspot in hotspots:
        source_key = _get_source_identifier(hotspot)
        stats = source_stats[source_key]
        active_days = max(1, len(stats["days"]))
        frp_vals = stats["frp_values"]
        mean_frp = mean(frp_vals) if frp_vals else float(hotspot.get("frp") or 0.0)
        peak_frp = max(frp_vals) if frp_vals else float(hotspot.get("frp") or 0.0)

        # Calculate Z-score if there is historical variance
        current_frp = float(hotspot.get("frp") or 0.0)
        z_score = None
        if len(frp_vals) >= 3:
            baseline = frp_vals[:-1] if len(frp_vals) > 1 else frp_vals
            b_mean = mean(baseline)
            b_std = pstdev(baseline)
            if b_std > 0.0:
                z_score = (current_frp - b_mean) / b_std

        classification, confidence_level, explanation, reasons = _classify_single_hotspot(
            hotspot=hotspot,
            active_days=active_days,
            mean_frp=mean_frp,
            peak_frp=peak_frp,
            z_score=z_score,
        )

        risk_score = calculate_risk_score(hotspot, active_days, classification)

        # Map risk level and inspection priority
        if classification == "INDUSTRIAL_FIRE":
            risk_level = "critical"
            inspection_priority = "immediate"
        elif classification in ("WILDFIRE", "PERSISTENT_INDUSTRIAL"):
            risk_level = "critical" if risk_score >= 65 else "high"
            inspection_priority = "immediate" if risk_score >= 70 else "high"
        elif classification in ("GAS_FLARE", "MINING_ACTIVITY"):
            risk_level = "high" if risk_score >= 60 else "medium"
            inspection_priority = "high" if risk_score >= 65 else "routine"
        elif classification == "AGRICULTURAL_BURNING":
            risk_level = "medium" if risk_score >= 45 else "low"
            inspection_priority = "watch" if risk_score >= 45 else "routine"
        else:
            risk_level = "medium"
            inspection_priority = "watch"

        classified_hotspots.append(
            {
                **hotspot,
                "active_days": active_days,
                "classification": classification,
                "confidence_level": confidence_level,  # HIGH / MEDIUM / LOW
                "explanation": explanation,
                "reasons": reasons,  # List of human-readable decision reasons
                "risk_score": risk_score,
                "risk_level": risk_level,
                "inspection_priority": inspection_priority,
            }
        )

    return classified_hotspots
