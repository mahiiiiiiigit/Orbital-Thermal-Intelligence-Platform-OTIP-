from typing import Any, Dict, List

from backend.analytics.site_resolver import resolve_site_name


def _clean_alert_id(facility_name: str, suffix: str) -> str:
    clean_id = (
        facility_name.lower()
        .replace(" ", "-")
        .replace("(", "")
        .replace(")", "")
        .replace(",", "")
    )
    return f"{clean_id}-{suffix}"


def detect_anomalies(hotspots: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect statistical excursions and high-intensity thermal events.

    Temporal statistics are calculated upstream by the classifier using
    causal historical observations. This detector consumes those values
    instead of generating synthetic baselines or z-scores.
    """
    facilities: Dict[str, List[Dict[str, Any]]] = {}

    for hotspot in hotspots:
        classification = hotspot.get("classification", "")

        if classification not in (
            "GAS_FLARE",
            "INDUSTRIAL_FIRE",
            "PERSISTENT_INDUSTRIAL",
            "MINING_ACTIVITY",
            "WILDFIRE",
        ):
            continue

        facility_name = hotspot.get("facility_name")

        if not facility_name or facility_name.startswith("Site ("):
            facility_name = resolve_site_name(
                float(hotspot["latitude"]),
                float(hotspot["longitude"]),
            )

        facilities.setdefault(facility_name, []).append(hotspot)

    alerts: List[Dict[str, Any]] = []

    for facility_name, records in facilities.items():
        records.sort(key=lambda record: str(record.get("timestamp", "")))

        # ---------------------------------------------------------------
        # 1. Direct industrial-fire alert
        # ---------------------------------------------------------------
        fire_spikes = [
            record
            for record in records
            if record.get("classification") == "INDUSTRIAL_FIRE"
        ]

        if fire_spikes:
            peak_fire = max(
                fire_spikes,
                key=lambda record: float(record.get("frp", 0.0)),
            )

            baseline_mean = peak_fire.get("baseline_mean_frp")
            baseline_std = peak_fire.get("baseline_std_frp")
            z_score = peak_fire.get("z_score")

            alerts.append(
                {
                    "alert_id": _clean_alert_id(
                        facility_name,
                        "industrial-fire-spike",
                    ),
                    "facility_name": facility_name,
                    "classification": "INDUSTRIAL_FIRE",
                    "latitude": peak_fire["latitude"],
                    "longitude": peak_fire["longitude"],
                    "timestamp": peak_fire["timestamp"],
                    "severity": "CRITICAL",
                    "current_frp": peak_fire["frp"],
                    "baseline_mean_frp": (
                        round(float(baseline_mean), 2)
                        if baseline_mean is not None
                        else None
                    ),
                    "baseline_std_dev_frp": (
                        round(float(baseline_std), 2)
                        if baseline_std is not None
                        else None
                    ),
                    "z_score": (
                        round(float(z_score), 2)
                        if z_score is not None
                        else None
                    ),
                    "risk_score": peak_fire.get("risk_score"),
                    "risk_level": "CRITICAL",
                    "risk_breakdown": peak_fire.get(
                        "risk_breakdown",
                        {},
                    ),
                    "risk_explanation": peak_fire.get(
                        "risk_explanation",
                        "Critical risk due to an industrial fire classification.",
                    ),
                    "message": (
                        f"Critical industrial fire excursion detected: "
                        f"{peak_fire['frp']} MW FRP."
                    ),
                    "recommendation": (
                        "Dispatch emergency response and confirm whether "
                        "the event is a controlled flare or an escalating fire."
                    ),
                }
            )

            continue

        # ---------------------------------------------------------------
        # 2. Statistical anomaly using classifier-provided causal z-score
        # ---------------------------------------------------------------
        current_record = records[-1]

        z_score = current_record.get("z_score")
        anomaly_status = current_record.get("anomaly_status")

        if (
            z_score is not None
            and float(z_score) >= 3.0
            and anomaly_status in (None, "ANOMALY")
        ):
            baseline_mean = current_record.get("baseline_mean_frp")
            baseline_std = current_record.get("baseline_std_frp")
            current_frp = float(current_record.get("frp", 0.0))

            alerts.append(
                {
                    "alert_id": _clean_alert_id(
                        facility_name,
                        "statistical-spike",
                    ),
                    "facility_name": facility_name,
                    "classification": current_record.get(
                        "classification",
                        "GAS_FLARE",
                    ),
                    "latitude": current_record["latitude"],
                    "longitude": current_record["longitude"],
                    "timestamp": current_record["timestamp"],
                    "severity": "CRITICAL",
                    "current_frp": current_frp,
                    "baseline_mean_frp": (
                        round(float(baseline_mean), 2)
                        if baseline_mean is not None
                        else None
                    ),
                    "baseline_std_dev_frp": (
                        round(float(baseline_std), 2)
                        if baseline_std is not None
                        else None
                    ),
                    "z_score": round(float(z_score), 2),
                    "risk_score": current_record.get("risk_score"),
                    "risk_level": "CRITICAL",
                    "risk_breakdown": current_record.get(
                        "risk_breakdown",
                        {},
                    ),
                    "risk_explanation": current_record.get(
                        "risk_explanation",
                        f"Critical risk due to a +{round(float(z_score), 1)}σ "
                        "statistical excursion above the historical baseline.",
                    ),
                    "message": (
                        f"FRP is {round(float(z_score), 1)} standard deviations "
                        f"above baseline"
                        + (
                            f" ({round(float(baseline_mean), 1)} MW)"
                            if baseline_mean is not None
                            else ""
                        )
                        + "."
                    ),
                    "recommendation": (
                        "Dispatch on-site inspection and confirm whether "
                        "the thermal source is controlled or escalating."
                    ),
                }
            )

            continue

        # ---------------------------------------------------------------
        # 3. High-intensity event
        # ---------------------------------------------------------------
        peak_record = max(
            records,
            key=lambda record: float(record.get("frp", 0.0)),
        )

        peak_frp = float(peak_record.get("frp", 0.0))

        if peak_frp >= 90.0:
            baseline_mean = peak_record.get("baseline_mean_frp")
            baseline_std = peak_record.get("baseline_std_frp")
            peak_z_score = peak_record.get("z_score")

            alerts.append(
                {
                    "alert_id": _clean_alert_id(
                        facility_name,
                        "high-intensity",
                    ),
                    "facility_name": facility_name,
                    "classification": peak_record.get(
                        "classification",
                        "PERSISTENT_INDUSTRIAL",
                    ),
                    "latitude": peak_record["latitude"],
                    "longitude": peak_record["longitude"],
                    "timestamp": peak_record["timestamp"],
                    "severity": "HIGH",
                    "current_frp": peak_frp,
                    "baseline_mean_frp": (
                        round(float(baseline_mean), 2)
                        if baseline_mean is not None
                        else None
                    ),
                    "baseline_std_dev_frp": (
                        round(float(baseline_std), 2)
                        if baseline_std is not None
                        else None
                    ),
                    "z_score": (
                        round(float(peak_z_score), 2)
                        if peak_z_score is not None
                        else None
                    ),
                    "risk_score": peak_record.get("risk_score"),
                    "risk_level": "HIGH",
                    "risk_breakdown": peak_record.get(
                        "risk_breakdown",
                        {},
                    ),
                    "risk_explanation": peak_record.get(
                        "risk_explanation",
                        "High risk due to extreme radiative intensity.",
                    ),
                    "message": (
                        f"High-intensity thermal plume detected "
                        f"({peak_frp} MW FRP)."
                    ),
                    "recommendation": (
                        "Verify operational telemetry with the facility "
                        "operator and assess whether emergency response "
                        "is required."
                    ),
                }
            )

    return alerts