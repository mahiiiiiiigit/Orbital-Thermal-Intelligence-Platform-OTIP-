"""
Advanced Multi-Class Thermal Intelligence Classifier for SIH 26162.

Provides comprehensive categorization with multi-factor risk scoring,
causal temporal anomaly detection, and human-readable explainable reasoning.

Supported Taxonomic Classes:
1. GAS_FLARE - Operational flare stacks at refineries, petrochemical complexes,
   and LNG terminals.
2. INDUSTRIAL_FIRE - Sudden critical thermal excursions, blowout spikes,
   and structural plant fires.
3. AGRICULTURAL_BURNING - Seasonal, short-lived crop stubble residue fires
   across Indian agrarian basins.
4. WILDFIRE - Biomass combustion and active advancing canopy fires across
   forest reserves and wildlands.
5. MINING_ACTIVITY - Persistent thermal signatures in surface coalfields,
   open-cast pits and seam combustion zones.
6. PERSISTENT_INDUSTRIAL - Continuous operational heat from steel mills,
   power plants, kilns and smelters.
7. UNCLASSIFIED - Rare isolated anomalies with insufficient spatial,
   temporal or contextual signal.
"""

from statistics import mean
from typing import Any, Dict, List, Optional, Tuple

from .temporal_stats import calculate_causal_temporal_stats


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

    Uses facility name if spatially matched, otherwise groups geographically
    by rounded latitude/longitude.
    """
    if hotspot.get("facility_name"):
        return f"facility:{hotspot['facility_name']}"

    lat = round(float(hotspot.get("latitude", 0.0)), 2)
    lon = round(float(hotspot.get("longitude", 0.0)), 2)

    return f"grid:{lat}:{lon}"


def calculate_smart_risk_score(
    hotspot: Dict[str, Any],
    active_days: int,
    classification: str,
    z_score: Optional[float] = None,
) -> Tuple[float, str, Dict[str, float], str]:
    """
    Computes an explainable deterministic 0-100 Smart Risk Score.

    Tiers:
      0 - 24   LOW
      25 - 49  MEDIUM
      50 - 74  HIGH
      75 - 100 CRITICAL

    Important:
    This is a deterministic risk heuristic, NOT a probability.
    """

    frp = float(hotspot.get("frp") or 0.0)

    conf = str(
        hotspot.get("confidence") or "nominal"
    ).lower()

    dist_facility_m = hotspot.get("distance_to_facility_m")
    facility_name = hotspot.get("facility_name")

    fsi_danger = str(
        hotspot.get("fire_danger_level") or ""
    ).upper()

    is_large_forest_fire = bool(
        hotspot.get("large_forest_fire")
    )

    land_context = str(
        hotspot.get("forest_type")
        or hotspot.get("facility_category")
        or hotspot.get("land_context")
        or ""
    ).lower()

    breakdown: Dict[str, float] = {}

    # =====================================================================
    # 1. Classification Base Severity
    # =====================================================================

    # GAS_FLARE is intentionally lower than INDUSTRIAL_FIRE because a
    # normal operational flare is not automatically a high-risk incident.
    base_points = {
        "INDUSTRIAL_FIRE": 30.0,
        "WILDFIRE": 22.0,
        "GAS_FLARE": 10.0,
        "PERSISTENT_INDUSTRIAL": 12.0,
        "MINING_ACTIVITY": 12.0,
        "UNCLASSIFIED": 8.0,
        "AGRICULTURAL_BURNING": 6.0,
    }

    cls_pts = base_points.get(
        classification,
        8.0,
    )

    breakdown["Classification severity"] = cls_pts

    # =====================================================================
    # 2. Thermal Intensity / FRP
    # =====================================================================

    if frp > 80.0:
        frp_pts = 25.0
    elif frp > 30.0:
        frp_pts = 18.0
    elif frp > 10.0:
        frp_pts = 12.0
    elif frp > 2.0:
        frp_pts = 6.0
    else:
        frp_pts = 2.0

    breakdown["FRP intensity"] = frp_pts

    # =====================================================================
    # 3. Statistical Anomaly / Causal Z-Score
    # =====================================================================

    effective_z = (
        z_score
        if z_score is not None
        else float(hotspot.get("z_score") or 0.0)
    )

    if effective_z >= 4.0:
        anomaly_pts = 20.0
    elif effective_z >= 3.0:
        anomaly_pts = 15.0
    elif effective_z >= 2.0:
        anomaly_pts = 10.0
    elif effective_z >= 1.0:
        anomaly_pts = 5.0
    else:
        anomaly_pts = 0.0

    if anomaly_pts > 0:
        breakdown["FRP anomaly"] = anomaly_pts

    # =====================================================================
    # 4. Critical Infrastructure / Forest Proximity
    # =====================================================================

    if (
        dist_facility_m is not None
        and dist_facility_m <= 1000.0
    ):
        prox_pts = 15.0
        breakdown["Facility proximity"] = prox_pts

    elif (
        dist_facility_m is not None
        and dist_facility_m <= 3000.0
    ):
        prox_pts = 10.0
        breakdown["Facility proximity"] = prox_pts

    elif (
        "forest" in land_context
        or "wild" in land_context
        or classification == "WILDFIRE"
    ):
        prox_pts = 12.0
        breakdown["Forest eco-zone"] = prox_pts

    elif facility_name:
        prox_pts = 10.0
        breakdown["Facility proximity"] = prox_pts

    else:
        prox_pts = 2.0
        breakdown["Rural open-land"] = prox_pts

    # =====================================================================
    # 5. FSI Fire Danger / Wildfire Spread
    # =====================================================================

    if (
        is_large_forest_fire
        or fsi_danger in ("EXTREME", "VERY HIGH")
    ):
        fsi_pts = 10.0
        breakdown["FSI fire danger"] = fsi_pts

    elif fsi_danger == "HIGH":
        fsi_pts = 6.0
        breakdown["FSI fire danger"] = fsi_pts

    elif fsi_danger == "MODERATE":
        fsi_pts = 3.0
        breakdown["FSI fire danger"] = fsi_pts

    else:
        fsi_pts = 0.0

    # =====================================================================
    # 6. Persistence & Satellite Confidence
    # =====================================================================

    pers_pts = round(
        min(6.0, active_days * 1.5),
        1,
    )

    if pers_pts > 0:
        breakdown["Persistence"] = pers_pts

    conf_pts = (
        4.0
        if conf in ("high", "h")
        else 2.0
        if conf in ("nominal", "n")
        else 0.0
    )

    breakdown["Satellite confidence"] = conf_pts

    # =====================================================================
    # Total Risk Score
    # =====================================================================

    total_score = round(
        min(
            100.0,
            max(
                0.0,
                sum(breakdown.values()),
            ),
        ),
        1,
    )

    if total_score >= 75.0:
        risk_level = "CRITICAL"

    elif total_score >= 50.0:
        risk_level = "HIGH"

    elif total_score >= 25.0:
        risk_level = "MEDIUM"

    else:
        risk_level = "LOW"

    # =====================================================================
    # Human-readable Risk Explanation
    # =====================================================================

    reasons_summary: List[str] = []

    if effective_z >= 3.0:
        reasons_summary.append(
            "thermal output is significantly above historical baseline "
            "(+{:.1f}σ)".format(effective_z)
        )

    if frp > 50.0:
        reasons_summary.append(
            "high radiative energy ({:.1f} MW)".format(frp)
        )

    if (
        dist_facility_m is not None
        and dist_facility_m <= 1000.0
    ):
        reasons_summary.append(
            "event is close to critical industrial infrastructure"
        )

    elif (
        is_large_forest_fire
        or fsi_danger in ("EXTREME", "VERY HIGH")
    ):
        reasons_summary.append(
            "located in high-danger forest zone with active spread"
        )

    elif classification == "AGRICULTURAL_BURNING":
        reasons_summary.append(
            "routine seasonal crop residue combustion with limited "
            "spatial risk"
        )

    elif classification in (
        "PERSISTENT_INDUSTRIAL",
        "GAS_FLARE",
    ):
        reasons_summary.append(
            "consistent with ongoing industrial baseline operations"
        )

    if reasons_summary:
        explanation = (
            f"{risk_level.capitalize()} risk because "
            f"{', and '.join(reasons_summary)}."
        )

    else:
        explanation = (
            f"{risk_level.capitalize()} risk event evaluated by "
            "multi-factor thermal intelligence model."
        )

    return (
        total_score,
        risk_level,
        breakdown,
        explanation,
    )


def calculate_risk_score(
    hotspot: Dict[str, Any],
    active_days: int,
    classification: str,
) -> float:
    """
    Legacy helper returning scalar risk score.
    """
    score, _, _, _ = calculate_smart_risk_score(
        hotspot,
        active_days,
        classification,
    )

    return score


def _classify_single_hotspot(
    hotspot: Dict[str, Any],
    active_days: int,
    mean_frp: float,
    peak_frp: float,
    z_score: Optional[float],
) -> Tuple[str, str, str, List[str]]:
    """
    Hierarchical explainable rule engine.

    Returns:
        classification,
        confidence_level,
        explanation,
        reasons_list
    """

    frp = float(
        hotspot.get("frp") or 0.0
    )

    brightness = hotspot.get(
        "brightness_temp"
    )

    facility_name = hotspot.get(
        "facility_name"
    )

    facility_type = hotspot.get(
        "facility_type"
    )

    facility_category = (
        hotspot.get("facility_category")
        or hotspot.get("land_context")
        or ""
    )

    has_flares = hotspot.get(
        "has_flares",
        False,
    )

    context = hotspot.get(
        "context",
        "unassigned",
    )

    distance_m = hotspot.get(
        "distance_to_facility_m"
    )

    sat_conf = str(
        hotspot.get("confidence")
        or "nominal"
    ).lower()

    day_night = str(
        hotspot.get("day_night")
        or "D"
    ).upper()

    dist_km = (
        round(distance_m / 1000.0, 1)
        if distance_m is not None
        else None
    )

    dist_str = (
        f"{dist_km} km"
        if dist_km is not None
        else "within facility perimeter"
    )

    # =====================================================================
    # Shared facility-context flags
    # =====================================================================

    category_lower = facility_category.lower()

    is_flare_facility = (
        bool(has_flares)
        or facility_type == "refinery_gas"
        or "refinery" in category_lower
        or "petrochemical" in category_lower
        or "gas processing" in category_lower
        or "lng" in category_lower
    )

    is_mining_zone = (
        facility_type == "mining"
        or context == "mining"
        or "mining" in category_lower
        or "coalfield" in category_lower
        or "coal basin" in category_lower
        or "iron ore" in category_lower
        or "mines" in category_lower
    )

    is_forest_zone = (
        facility_type == "forest"
        or context == "forest"
        or "forest" in category_lower
        or "national park" in category_lower
        or "biosphere" in category_lower
        or "wildland" in category_lower
        or "canopy" in category_lower
    )

    # =====================================================================
    # RULE 1: INDUSTRIAL FIRE
    #
    # A high FRP value by itself does not prove an industrial fire.
    # A known industrial context plus a causal thermal excursion can.
    # =====================================================================

    is_near_industrial = (
        facility_type in (
            "refinery_gas",
            "heavy_industry",
        )
        or context == "industrial"
        or (
            facility_name is not None
            and not is_forest_zone
            and not is_mining_zone
        )
    )

    is_statistical_spike = (
        z_score is not None
        and z_score >= 3.0
    )

    is_extreme_frp_spike = (
        frp >= 85.0
        and mean_frp > 0.0
        and (
            mean_frp <= 45.0
            or frp >= 1.8 * mean_frp
        )
    )

    # Do not let a normal flare automatically become an industrial fire
    # merely because its absolute FRP is high.
    is_uncontrolled_burst = (
        is_near_industrial
        and not is_flare_facility
        and frp >= 90.0
    )

    if is_near_industrial and (
        is_statistical_spike
        or (
            is_extreme_frp_spike
            and not is_flare_facility
        )
        or is_uncontrolled_burst
    ):
        conf_level = (
            "HIGH"
            if (
                frp >= 95.0
                or (
                    z_score is not None
                    and z_score >= 3.5
                )
            )
            else "MEDIUM"
        )

        z_text = (
            f" ({round(z_score, 1)}σ above baseline)"
            if z_score is not None
            else ""
        )

        explanation = (
            f"Classified as INDUSTRIAL_FIRE because hotspot "
            f"experienced a sudden {frp} MW thermal excursion"
            f"{z_text} at "
            f"{facility_name or 'industrial asset'}, "
            "exceeding historical baseline."
        )

        reasons = [
            (
                f"Located within {dist_str} of industrial asset "
                f"{facility_name or 'complex'}"
            ),
            (
                f"Sudden extreme thermal excursion of "
                f"{frp} MW{z_text}"
            ),
            (
                f"Exceeds historical facility mean of "
                f"{round(mean_frp, 1)} MW"
            ),
            (
                "Emergency on-site safety and containment "
                "inspection recommended"
            ),
        ]

        return (
            "INDUSTRIAL_FIRE",
            conf_level,
            explanation,
            reasons,
        )

    # =====================================================================
    # RULE 2: GAS FLARE
    # =====================================================================

    if (
        is_flare_facility
        and distance_m is not None
        and distance_m <= 8500
    ):
        conf_level = (
            "HIGH"
            if (
                distance_m <= 4000
                or active_days >= 2
                or sat_conf in ("high", "h")
            )
            else "MEDIUM"
        )

        night_text = (
            "Nighttime detection supports an active "
            "process-heat signature"
            if day_night == "N"
            else "Daytime process-heat detection"
        )

        explanation = (
            f"Classified as GAS_FLARE because hotspot is "
            f"within {dist_str} of "
            f"{facility_name or 'known flare infrastructure'}."
        )

        reasons = [
            (
                f"Located within {dist_str} of "
                f"{facility_name or 'known flare infrastructure'} "
                f"({facility_category or 'flare facility'})"
            ),
            (
                "Facility metadata indicates flare-capable "
                "infrastructure"
            ),
            (
                f"Observed thermal output of {frp} MW across "
                f"{active_days} active observation day(s)"
            ),
            night_text,
        ]

        return (
            "GAS_FLARE",
            conf_level,
            explanation,
            reasons,
        )

    # =====================================================================
    # RULE 3: MINING ACTIVITY
    # =====================================================================

    if is_mining_zone:
        conf_level = (
            "HIGH"
            if (
                active_days >= 2
                or (
                    distance_m is not None
                    and distance_m <= 8000
                )
                or sat_conf in ("high", "h")
            )
            else "MEDIUM"
        )

        explanation = (
            f"Classified as MINING_ACTIVITY because detection "
            f"is located in "
            f"{facility_name or 'active mining basin'} "
            "with surface mining or coal seam heat."
        )

        reasons = [
            (
                "Located in designated mining basin / field "
                f"({facility_name or 'Mining Sector'})"
            ),
            (
                "Thermal emission characteristic of surface "
                "open-cast mining or coal seam combustion"
            ),
            (
                f"Repeated thermal presence across "
                f"{active_days} active observation day(s)"
            ),
            (
                f"Radiative power output of {frp} MW across "
                "surface extraction perimeter"
            ),
        ]

        return (
            "MINING_ACTIVITY",
            conf_level,
            explanation,
            reasons,
        )

    # =====================================================================
    # RULE 4: WILDFIRE
    # =====================================================================

    if is_forest_zone:
        conf_level = (
            "HIGH"
            if (
                frp >= 20.0
                or sat_conf in ("high", "h")
            )
            else "MEDIUM"
        )

        temp_text = (
            f"Brightness temperature of {brightness} K"
            if brightness
            else f"Thermal output of {frp} MW"
        )

        explanation = (
            f"Classified as WILDFIRE because detection is "
            f"located in "
            f"{facility_name or 'protected forest corridor'} "
            "with active vegetation fire."
        )

        reasons = [
            (
                "Located inside protected forest canopy / "
                f"wildlife reserve "
                f"({facility_name or 'Forest Canopy'})"
            ),
            (
                f"Radiative intensity of {frp} MW associated "
                "with active vegetative biomass fire"
            ),
            (
                f"{temp_text} indicating active thermal "
                "vegetation combustion"
            ),
            (
                "Remote forest location without nearby "
                "industrial or mining attribution"
            ),
        ]

        return (
            "WILDFIRE",
            conf_level,
            explanation,
            reasons,
        )

    # =====================================================================
    # RULE 5: PERSISTENT INDUSTRIAL
    #
    # Registered industrial sites require recurrence.
    # =====================================================================

    is_heavy_industry = (
        facility_type == "heavy_industry"
        or "steel" in category_lower
        or "power" in category_lower
        or "smelter" in category_lower
        or "cement" in category_lower
        or "aluminium" in category_lower
        or (
            facility_name is not None
            and not is_flare_facility
            and not is_mining_zone
            and not is_forest_zone
        )
    )

    if (
        is_heavy_industry
        and active_days >= 2
    ):
        conf_level = (
            "HIGH"
            if (
                active_days >= 2
                or (
                    distance_m is not None
                    and distance_m <= 6000
                )
            )
            else "MEDIUM"
        )

        explanation = (
            "Classified as PERSISTENT_INDUSTRIAL because "
            "repeated thermal detections occurred at registered "
            f"industrial asset {facility_name}."
        )

        reasons = [
            (
                f"Located within {dist_str} of registered "
                f"industrial asset {facility_name}"
            ),
            (
                f"Process heat from "
                f"{facility_category or 'industrial facility'}"
            ),
            (
                f"Persistent thermal output observed across "
                f"{active_days} observation day(s)"
            ),
            (
                f"Mean historical FRP of "
                f"{round(mean_frp, 1)} MW "
                f"(Current: {frp} MW)"
            ),
        ]

        return (
            "PERSISTENT_INDUSTRIAL",
            conf_level,
            explanation,
            reasons,
        )

    # Recurring cluster without registered facility name.
    if (
        active_days >= 3
        and frp >= 14.0
    ):
        conf_level = (
            "HIGH"
            if active_days >= 5
            else "MEDIUM"
        )

        explanation = (
            "Classified as PERSISTENT_INDUSTRIAL because "
            f"repeated thermal detections occurred over "
            f"{active_days} observation days at fixed coordinates."
        )

        reasons = [
            (
                f"Persistent thermal recurrence across "
                f"{active_days} days at stable geographic coordinates"
            ),
            (
                f"Sustained radiative power ({frp} MW) indicates "
                "a persistent non-transient thermal source"
            ),
            (
                "Thermal source is outside the registered "
                "facility attribution set"
            ),
            (
                "Flagged for environmental compliance survey "
                "and site verification"
            ),
        ]

        return (
            "PERSISTENT_INDUSTRIAL",
            conf_level,
            explanation,
            reasons,
        )

    # =====================================================================
    # RULE 6: AGRICULTURAL BURNING
    # =====================================================================

    is_agrarian = (
        context == "agricultural"
        or "cropland" in category_lower
        or "crop" in category_lower
        or "agricultural" in category_lower
    )

    if (
        is_agrarian
        and facility_name is None
    ):
        conf_level = (
            "HIGH"
            if (
                active_days <= 2
                and frp <= 35.0
            )
            else "MEDIUM"
        )

        explanation = (
            "Classified as AGRICULTURAL_BURNING because "
            "hotspot is located in an agricultural cropland "
            f"basin with low persistence ({active_days} day)."
        )

        reasons = [
            (
                "Located in agrarian cropland basin with no "
                "industrial or mining attribution"
            ),
            (
                f"Transient thermal signature active for only "
                f"{active_days} observation day(s)"
            ),
            (
                f"Low-to-moderate thermal output ({frp} MW) "
                "consistent with open-field biomass burning"
            ),
            (
                "Short-lived seasonal crop residue "
                "combustion profile"
            ),
        ]

        return (
            "AGRICULTURAL_BURNING",
            conf_level,
            explanation,
            reasons,
        )

    # =====================================================================
    # RULE 7: UNCLASSIFIED
    # =====================================================================

    explanation = (
        f"Classified as UNCLASSIFIED because isolated thermal "
        f"detection ({frp} MW) lacks definitive spatial or "
        "contextual attribution."
    )

    reasons = [
        (
            "Isolated thermal detection without definitive "
            "spatial or industrial attribution"
        ),
        (
            f"Low recurrence ({active_days} active day) in "
            "unassigned land context"
        ),
        f"Thermal output: {frp} MW",
        (
            "Flagged for analyst triage and subsequent "
            "satellite overpass watch"
        ),
    ]

    return (
        "UNCLASSIFIED",
        "LOW",
        explanation,
        reasons,
    )


def classify_hotspots(
    hotspots: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Analyze spatial, temporal and facility characteristics
    and assign taxonomy, confidence, risk and causal temporal evidence.

    Important:
    - Temporal statistics use only earlier observations.
    - At least five historical observations are required for Z-score.
    - Input/output ordering is preserved.
    """

    if not hotspots:
        return []

    # =====================================================================
    # Group records by the existing source identifier.
    # =====================================================================

    grouped_indices: Dict[str, List[int]] = {}

    for index, hotspot in enumerate(hotspots):
        source_key = _get_source_identifier(
            hotspot
        )

        grouped_indices.setdefault(
            source_key,
            [],
        ).append(index)

    # =====================================================================
    # Calculate causal temporal statistics independently for each source.
    # =====================================================================

    temporal_by_index: Dict[
        int,
        Dict[str, Any],
    ] = {}

    for indices in grouped_indices.values():
        records = [
            hotspots[index]
            for index in indices
        ]

        local_stats = calculate_causal_temporal_stats(
            records
        )

        for local_index, original_index in enumerate(indices):
            temporal_by_index[
                original_index
            ] = local_stats[local_index]

    # =====================================================================
    # Classify while preserving original input order.
    # =====================================================================

    classified_hotspots: List[
        Dict[str, Any]
    ] = []

    for index, hotspot in enumerate(hotspots):
        temporal = temporal_by_index[index]

        active_days = temporal[
            "active_days"
        ]

        z_score = temporal[
            "z_score"
        ]

        baseline_mean = temporal[
            "baseline_mean_frp"
        ]

        # Only use historical baseline when it actually exists.
        # Before five observations, the current FRP becomes a neutral
        # value so that a high absolute FRP cannot create a fake
        # historical anomaly.
        mean_frp = (
            float(baseline_mean)
            if baseline_mean is not None
            else float(
                hotspot.get("frp") or 0.0
            )
        )

        # Peak is retained for compatibility with the existing
        # _classify_single_hotspot() signature.
        source_indices = grouped_indices[
            _get_source_identifier(hotspot)
        ]

        current_timestamp = str(
            hotspot.get("timestamp", "")
        )

        prior_frps = [
            float(
                hotspots[prior_index].get("frp")
                or 0.0
            )
            for prior_index in source_indices
            if str(
                hotspots[prior_index].get(
                    "timestamp",
                    "",
                )
            ) < current_timestamp
        ]

        current_frp = float(
            hotspot.get("frp") or 0.0
        )

        peak_frp = max(
            prior_frps + [current_frp]
        )

        classification, confidence_level, explanation, reasons = (
            _classify_single_hotspot(
                hotspot=hotspot,
                active_days=active_days,
                mean_frp=mean_frp,
                peak_frp=peak_frp,
                z_score=z_score,
            )
        )

        # =================================================================
        # Attach temporal evidence to the hotspot.
        # =================================================================

        enriched_hotspot = {
            **hotspot,

            "active_days": active_days,

            "z_score": (
                round(z_score, 3)
                if z_score is not None
                else None
            ),

            "baseline_mean_frp": (
                round(baseline_mean, 3)
                if baseline_mean is not None
                else None
            ),

            "baseline_std_frp": (
                round(
                    temporal[
                        "baseline_std_frp"
                    ],
                    3,
                )
                if temporal[
                    "baseline_std_frp"
                ] is not None
                else None
            ),

            "historical_observation_count": (
                temporal[
                    "historical_observation_count"
                ]
            ),

            "anomaly_status": (
                temporal[
                    "anomaly_status"
                ]
            ),
        }

        # =================================================================
        # Risk score
        # =================================================================

        (
            risk_score,
            risk_level,
            risk_breakdown,
            risk_explanation,
        ) = calculate_smart_risk_score(
            hotspot=enriched_hotspot,
            active_days=active_days,
            classification=classification,
            z_score=z_score,
        )

        # =================================================================
        # Inspection priority
        # =================================================================

        if risk_level == "CRITICAL":
            inspection_priority = "immediate"

        elif risk_level == "HIGH":
            inspection_priority = "high"

        elif risk_level == "MEDIUM":
            inspection_priority = "watch"

        else:
            inspection_priority = "routine"

        # =================================================================
        # Final API-compatible record
        # =================================================================

        classified_hotspots.append(
            {
                **enriched_hotspot,

                "classification": classification,

                "confidence_level": confidence_level,

                "explanation": explanation,

                "reasons": reasons,

                "risk_score": risk_score,

                "risk_level": risk_level,

                "risk_breakdown": risk_breakdown,

                "risk_explanation": risk_explanation,

                "inspection_priority": inspection_priority,
            }
        )

    return classified_hotspots