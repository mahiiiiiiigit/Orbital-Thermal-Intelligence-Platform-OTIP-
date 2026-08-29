"""
Facility Thermal Fingerprint & Historical Profile Analytics for SIH 26162.

Constructs empirical thermal profiles for identifiable industrial assets,
refineries, power plants, steel mills, and mining basins. Answers:
"What is normal thermal behavior for this facility, and how is the current activity different?"
"""

from __future__ import annotations

from statistics import mean, median, pstdev
from typing import Any, Dict, List, Optional, Tuple
from backend.analytics.spatial import distance_metres
from backend.analytics.facility_registry import KNOWN_FACILITIES


def build_facility_thermal_profile(
    facility_identifier: str,
    hotspots: List[Dict[str, Any]],
    is_demo: bool = False,
) -> Dict[str, Any]:
    """
    Computes a comprehensive 30-day empirical thermal fingerprint for a facility.
    Matches observations by facility_id, facility_name, or geographic proximity.
    """
    # 1. Resolve registered facility metadata if known
    matched_facility = None
    clean_target = facility_identifier.lower().strip()

    for fac in KNOWN_FACILITIES:
        if fac.get("facility_id", "").lower() == clean_target:
            matched_facility = fac
            break
        if fac.get("name", "").lower() == clean_target:
            matched_facility = fac
            break
        fac_clean = (
            fac.get("name", "")
            .lower()
            .replace(" ", "-")
            .replace("(", "")
            .replace(")", "")
            .replace(",", "")
        )
        if fac_clean == clean_target:
            matched_facility = fac
            break

    # 2. Extract matching hotspot observations
    facility_name = matched_facility["name"] if matched_facility else facility_identifier
    matching_records: List[Dict[str, Any]] = []

    for h in hotspots:
        h_fac = h.get("facility_name")
        if h_fac and h_fac.lower() == facility_name.lower():
            matching_records.append(h)
            continue
        if matched_facility:
            d = distance_metres(
                {"latitude": h.get("latitude", 0.0), "longitude": h.get("longitude", 0.0)},
                {"latitude": matched_facility["latitude"], "longitude": matched_facility["longitude"]},
            )
            if d <= matched_facility.get("radius_meters", 5000):
                matching_records.append(h)

    # Sort chronologically by timestamp
    matching_records.sort(key=lambda r: str(r.get("timestamp", "")))

    total_obs = len(matching_records)
    has_sufficient_history = total_obs >= 3

    # If no records found, return empty profile
    if total_obs == 0:
        return {
            "facility_id": clean_target,
            "facility_name": facility_name,
            "category": matched_facility.get("category", "Industrial Complex") if matched_facility else "Industrial Site",
            "state": matched_facility.get("state", "India") if matched_facility else "India",
            "latitude": matched_facility.get("latitude") if matched_facility else None,
            "longitude": matched_facility.get("longitude") if matched_facility else None,
            "has_sufficient_history": False,
            "status": "NO_DATA",
            "notice": "No thermal observations recorded for this facility in current observation window.",
            "total_observations": 0,
            "active_days": 0,
            "time_series": [],
            "is_demo": is_demo,
        }

    # Extract FRP series
    frp_series = [float(r.get("frp", 0.0)) for r in matching_records]
    active_dates = set(str(r.get("timestamp", ""))[:10] for r in matching_records if r.get("timestamp"))

    avg_frp = round(mean(frp_series), 2)
    med_frp = round(median(frp_series), 2)
    max_frp = round(max(frp_series), 2)
    min_frp = round(min(frp_series), 2)
    std_dev_frp = round(pstdev(frp_series), 2) if total_obs > 1 else 0.0

    current_record = matching_records[-1]
    current_frp = float(current_record.get("frp", 0.0))
    current_classification = current_record.get("classification", "PERSISTENT_INDUSTRIAL")
    current_risk_score = current_record.get("risk_score", 50.0)
    current_risk_level = current_record.get("risk_level", "MEDIUM")

    deviation_mw = round(current_frp - avg_frp, 2)
    pct_deviation = round(((current_frp - avg_frp) / avg_frp) * 100.0, 1) if avg_frp > 0 else 0.0
    z_score = round((current_frp - avg_frp) / std_dev_frp, 2) if std_dev_frp > 0 else 0.0

    # Count anomalies (Z >= 2.5 or Industrial Fire)
    anomalies_count = 0
    for r in matching_records:
        r_frp = float(r.get("frp", 0.0))
        if std_dev_frp > 0 and (r_frp - avg_frp) / std_dev_frp >= 2.5:
            anomalies_count += 1
        elif r.get("classification") == "INDUSTRIAL_FIRE":
            anomalies_count += 1

    # Trend calculation (comparing recent half vs earlier half)
    if total_obs >= 4:
        split_idx = total_obs // 2
        earlier_mean = mean(frp_series[:split_idx])
        recent_mean = mean(frp_series[split_idx:])
        if recent_mean > earlier_mean * 1.25:
            trend_direction = "RISING"
        elif recent_mean < earlier_mean * 0.75:
            trend_direction = "DECLINING"
        else:
            trend_direction = "STABLE"
    else:
        trend_direction = "STABLE"

    # Status Determination & Normal Operating Range
    if not has_sufficient_history:
        status = "INSUFFICIENT_DATA"
        status_reason = f"Insufficient historical data for reliable fingerprint (only {total_obs} observation(s) recorded; minimum 3 required)."
        normal_range = None
    else:
        normal_min = max(0.0, round(avg_frp - 1.5 * std_dev_frp, 2))
        normal_max = round(avg_frp + 1.5 * std_dev_frp, 2)
        upper_3sigma = round(avg_frp + 3.0 * std_dev_frp, 2)
        normal_range = {
            "min_mw": normal_min,
            "max_mw": normal_max,
            "baseline_mean_mw": avg_frp,
            "upper_3sigma_threshold_mw": upper_3sigma,
        }

        if z_score >= 3.0 or current_classification == "INDUSTRIAL_FIRE":
            status = "ABNORMAL"
            status_reason = f"Current FRP ({current_frp} MW) is {z_score} standard deviations above the facility's historical mean ({avg_frp} MW)."
        elif z_score >= 1.5 or current_frp > normal_max:
            status = "ELEVATED"
            status_reason = f"Elevated thermal radiance detected ({current_frp} MW, +{z_score}σ above mean {avg_frp} MW)."
        else:
            status = "NORMAL"
            status_reason = f"Operating normally within the expected historical baseline range ({normal_min} – {normal_max} MW)."

    # Format time-series points for historical trend chart
    time_series = []
    for idx, r in enumerate(matching_records):
        r_frp = float(r.get("frp", 0.0))
        is_anom = (std_dev_frp > 0 and (r_frp - avg_frp) / std_dev_frp >= 2.5) or r.get("classification") == "INDUSTRIAL_FIRE"
        time_series.append(
            {
                "index": idx + 1,
                "timestamp": r.get("timestamp", ""),
                "date": str(r.get("timestamp", ""))[:10],
                "frp": r_frp,
                "brightness_temp": r.get("brightness_temp"),
                "confidence": r.get("confidence", "HIGH"),
                "is_anomaly": is_anom,
                "is_current": idx == (total_obs - 1),
            }
        )

    return {
        "facility_id": clean_target,
        "facility_name": facility_name,
        "category": matched_facility.get("category", "Heavy Industrial / Petrochemical") if matched_facility else "Industrial Facility",
        "facility_type": matched_facility.get("facility_type", "industrial") if matched_facility else "industrial",
        "state": matched_facility.get("state", current_record.get("state", "India")) if matched_facility else current_record.get("state", "India"),
        "latitude": current_record.get("latitude") or (matched_facility.get("latitude") if matched_facility else None),
        "longitude": current_record.get("longitude") or (matched_facility.get("longitude") if matched_facility else None),
        "classification": current_classification,
        "risk_score": current_risk_score,
        "risk_level": current_risk_level,
        "status": status,  # NORMAL | ELEVATED | ABNORMAL | INSUFFICIENT_DATA
        "status_reason": status_reason,
        "has_sufficient_history": has_sufficient_history,
        "metrics": {
            "total_observations": total_obs,
            "active_days": len(active_dates),
            "average_frp": avg_frp,
            "median_frp": med_frp,
            "maximum_frp": max_frp,
            "minimum_frp": min_frp,
            "std_dev_frp": std_dev_frp,
            "current_frp": current_frp,
            "deviation_mw": deviation_mw,
            "pct_deviation": pct_deviation,
            "z_score": z_score,
            "anomaly_count": anomalies_count,
            "last_detected_timestamp": current_record.get("timestamp"),
            "trend_direction": trend_direction,  # RISING | STABLE | DECLINING
        },
        "normal_operating_range": normal_range,
        "time_series": time_series,
        "is_demo": is_demo or current_record.get("source") == "DEMO_DATA" or current_record.get("is_demo") is True,
        "source_label": "DEMO DATA (Simulated Facility History)" if (is_demo or current_record.get("is_demo") is True) else "NASA FIRMS (Empirical Orbital Telemetry)",
    }
