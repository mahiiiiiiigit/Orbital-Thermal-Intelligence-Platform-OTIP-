from typing import Any, Dict, List


def build_persistent_clusters(hotspots: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Aggregates persistent operational thermal sources (Gas Flares, Heavy Industry, Mining)
    and anomalous industrial fire clusters into structured facility intelligence records.
    """
    grouped_hotspots: Dict[str, List[Dict[str, Any]]] = {}

    for hotspot in hotspots:
        classification = hotspot.get("classification", "")
        if classification not in (
            "GAS_FLARE",
            "PERSISTENT_INDUSTRIAL",
            "MINING_ACTIVITY",
            "INDUSTRIAL_FIRE",
        ):
            continue

        facility_name = hotspot.get("facility_name")
        if not facility_name:
            lat_approx = round(float(hotspot["latitude"]), 2)
            lon_approx = round(float(hotspot["longitude"]), 2)
            facility_name = f"Unregistered Site ({lat_approx}, {lon_approx})"

        if facility_name not in grouped_hotspots:
            grouped_hotspots[facility_name] = []

        grouped_hotspots[facility_name].append(hotspot)

    clusters: List[Dict[str, Any]] = []

    for facility_name, records in grouped_hotspots.items():
        clean_id = (
            facility_name.lower()
            .replace(" ", "-")
            .replace("(", "")
            .replace(")", "")
            .replace(",", "")
        )
        mean_frp = round(sum(record["frp"] for record in records) / len(records), 2)
        peak_frp = max(record["frp"] for record in records)
        mean_risk = round(
            sum(record.get("risk_score", 50.0) for record in records) / len(records),
            1,
        )

        # Determine dominant classification in this cluster
        class_counts: Dict[str, int] = {}
        for r in records:
            c = r.get("classification", "PERSISTENT_INDUSTRIAL")
            class_counts[c] = class_counts.get(c, 0) + 1

        # If any record is an INDUSTRIAL_FIRE emergency spike, prioritize it
        if "INDUSTRIAL_FIRE" in class_counts:
            dominant_class = "INDUSTRIAL_FIRE"
        else:
            dominant_class = max(class_counts, key=class_counts.get)

        dominant_record = next(
            (r for r in records if r.get("classification") == dominant_class),
            records[0],
        )

        clusters.append(
            {
                "cluster_id": clean_id,
                "facility_name": facility_name,
                "classification": dominant_class,
                "confidence_level": dominant_record.get("confidence_level", "HIGH"),
                "explanation": dominant_record.get("explanation", ""),
                "reasons": dominant_record.get("reasons", []),
                "latitude": round(
                    sum(record["latitude"] for record in records) / len(records),
                    5,
                ),
                "longitude": round(
                    sum(record["longitude"] for record in records) / len(records),
                    5,
                ),
                "active_days": max(r.get("active_days", 1) for r in records),
                "detection_count": len(records),
                "mean_frp": mean_frp,
                "peak_frp": peak_frp,
                "risk_score": mean_risk,
                "risk_level": "critical" if (mean_risk >= 65 or peak_frp > 100 or dominant_class == "INDUSTRIAL_FIRE") else ("high" if mean_risk >= 50 else "medium"),
            }
        )

    return clusters