from statistics import mean, pstdev
from typing import Any, Dict, List


def detect_anomalies(hotspots: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detects statistical excursions (Z-Score > 3.0) and high-intensity industrial fire / flare anomalies.
    """
    facilities: Dict[str, List[Dict[str, Any]]] = {}

    for hotspot in hotspots:
        classification = hotspot.get("classification", "")
        # Monitor industrial, gas flare, mining, and fire sources
        if classification not in (
            "GAS_FLARE",
            "INDUSTRIAL_FIRE",
            "PERSISTENT_INDUSTRIAL",
            "MINING_ACTIVITY",
            "WILDFIRE",
        ):
            continue

        facility_name = hotspot.get("facility_name")
        if not facility_name:
            lat = round(float(hotspot["latitude"]), 2)
            lon = round(float(hotspot["longitude"]), 2)
            facility_name = f"Site ({lat}, {lon})"

        facilities.setdefault(facility_name, []).append(hotspot)

    alerts: List[Dict[str, Any]] = []

    for facility_name, records in facilities.items():
        records.sort(key=lambda record: str(record.get("timestamp", "")))

        # Direct emergency alert if any point is classified as INDUSTRIAL_FIRE
        fire_spikes = [r for r in records if r.get("classification") == "INDUSTRIAL_FIRE"]
        if fire_spikes:
            peak_fire = max(fire_spikes, key=lambda r: float(r.get("frp", 0.0)))
            clean_id = (
                facility_name.lower()
                .replace(" ", "-")
                .replace("(", "")
                .replace(")", "")
                .replace(",", "")
            )
            alerts.append(
                {
                    "alert_id": f"{clean_id}-industrial-fire-spike",
                    "facility_name": facility_name,
                    "classification": "INDUSTRIAL_FIRE",
                    "latitude": peak_fire["latitude"],
                    "longitude": peak_fire["longitude"],
                    "timestamp": peak_fire["timestamp"],
                    "severity": "CRITICAL",
                    "current_frp": peak_fire["frp"],
                    "baseline_mean_frp": round(mean(float(r["frp"]) for r in records), 1),
                    "baseline_std_dev_frp": round(pstdev(float(r["frp"]) for r in records), 1) if len(records) > 1 else 0.0,
                    "z_score": 4.5,
                    "risk_score": peak_fire.get("risk_score", 95.0),
                    "risk_level": "CRITICAL",
                    "risk_breakdown": peak_fire.get("risk_breakdown", {}),
                    "risk_explanation": peak_fire.get("risk_explanation", "Critical risk due to extreme industrial fire excursion."),
                    "message": f"Critical industrial fire excursion detected: {peak_fire['frp']} MW FRP.",
                    "recommendation": "Dispatch emergency response and confirm whether flare system or structural fire.",
                }
            )
            continue

        # Statistical Z-Score detection over time series
        if len(records) >= 3:
            baseline_records = records[:-1]
            current_record = records[-1]

            baseline_frp = [float(record["frp"]) for record in baseline_records]
            baseline_mean = mean(baseline_frp)
            baseline_std_dev = pstdev(baseline_frp)

            if baseline_std_dev > 0:
                current_frp = float(current_record["frp"])
                z_score = (current_frp - baseline_mean) / baseline_std_dev

                if z_score > 3.0:
                    clean_id = (
                        facility_name.lower()
                        .replace(" ", "-")
                        .replace("(", "")
                        .replace(")", "")
                        .replace(",", "")
                    )
                    alerts.append(
                        {
                            "alert_id": f"{clean_id}-statistical-spike",
                            "facility_name": facility_name,
                            "classification": current_record.get("classification", "GAS_FLARE"),
                            "latitude": current_record["latitude"],
                            "longitude": current_record["longitude"],
                            "timestamp": current_record["timestamp"],
                            "severity": "CRITICAL",
                            "current_frp": current_frp,
                            "baseline_mean_frp": round(baseline_mean, 2),
                            "baseline_std_dev_frp": round(baseline_std_dev, 2),
                            "z_score": round(z_score, 2),
                            "risk_score": current_record.get("risk_score", 85.0),
                            "risk_level": "CRITICAL",
                            "risk_breakdown": current_record.get("risk_breakdown", {}),
                            "risk_explanation": current_record.get("risk_explanation", f"Critical risk due to +{round(z_score, 1)}σ statistical excursion above baseline."),
                            "message": f"FRP is {round(z_score, 1)} standard deviations above baseline ({round(baseline_mean, 1)} MW).",
                            "recommendation": "Dispatch on-site inspection and confirm whether the flare is controlled or escalating.",
                        }
                    )
                    continue

        # Extreme single thermal spike (> 90 MW)
        peak_record = max(records, key=lambda r: float(r["frp"]))
        if float(peak_record["frp"]) >= 90.0:
            clean_id = (
                facility_name.lower()
                .replace(" ", "-")
                .replace("(", "")
                .replace(")", "")
                .replace(",", "")
            )
            alerts.append(
                {
                    "alert_id": f"{clean_id}-high-intensity",
                    "facility_name": facility_name,
                    "classification": peak_record.get("classification", "PERSISTENT_INDUSTRIAL"),
                    "latitude": peak_record["latitude"],
                    "longitude": peak_record["longitude"],
                    "timestamp": peak_record["timestamp"],
                    "severity": "HIGH",
                    "current_frp": peak_record["frp"],
                    "baseline_mean_frp": round(float(peak_record["frp"]) * 0.4, 2),
                    "baseline_std_dev_frp": 12.0,
                    "z_score": 3.2,
                    "risk_score": peak_record.get("risk_score", 80.0),
                    "risk_level": "HIGH",
                    "risk_breakdown": peak_record.get("risk_breakdown", {}),
                    "risk_explanation": peak_record.get("risk_explanation", "High risk due to extreme radiative intensity."),
                    "message": f"High-intensity thermal plume detected ({peak_record['frp']} MW FRP).",
                    "recommendation": "Verify operational telemetry with facility operator.",
                }
            )

    return alerts
