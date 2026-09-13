"""
Causal temporal statistics for hotspot classification.

Statistics for an observation are computed only from observations that occurred
before that observation. This prevents future observations from influencing the
classification of an earlier event.
"""

from __future__ import annotations

from statistics import mean, pstdev
from typing import Any, Dict, List, Optional


MIN_HISTORICAL_OBSERVATIONS = 5


def calculate_causal_temporal_stats(
    records: List[Dict[str, Any]],
    min_history: int = MIN_HISTORICAL_OBSERVATIONS,
) -> Dict[int, Dict[str, Any]]:
    """
    Return causal temporal statistics keyed by original record index.

    Each record's baseline contains only observations with an earlier timestamp.

    The returned mapping uses the original input indices so callers can preserve
    the original API/output ordering.
    """
    indexed_records = list(enumerate(records))

    # Sort only internally. The caller's original ordering is preserved.
    indexed_records.sort(
        key=lambda item: str(item[1].get("timestamp", ""))
    )

    stats_by_index: Dict[int, Dict[str, Any]] = {}

    historical_frp: List[float] = []
    historical_days: set[str] = set()

    for original_index, record in indexed_records:
        current_frp = float(record.get("frp") or 0.0)
        current_day = str(record.get("timestamp", ""))[:10]

        history_count = len(historical_frp)

        baseline_mean: Optional[float] = None
        baseline_std: Optional[float] = None
        z_score: Optional[float] = None

        # Do not calculate a statistical baseline until we have enough
        # historical observations.
        if history_count >= min_history:
            baseline_mean = mean(historical_frp)
            baseline_std = pstdev(historical_frp)

            if baseline_std > 0.0:
                z_score = (
                    (current_frp - baseline_mean)
                    / baseline_std
                )

        active_days = len(
            historical_days
            | ({current_day} if current_day else set())
        )

        if z_score is not None and z_score >= 3.0:
            anomaly_status = "ANOMALY"
        elif z_score is not None and z_score >= 2.0:
            anomaly_status = "ELEVATED"
        elif z_score is not None:
            anomaly_status = "BASELINE"
        else:
            anomaly_status = "INSUFFICIENT_HISTORY"

        stats_by_index[original_index] = {
            "active_days": max(1, active_days),
            "historical_observation_count": history_count,
            "baseline_mean_frp": baseline_mean,
            "baseline_std_frp": baseline_std,
            "z_score": z_score,
            "anomaly_status": anomaly_status,
        }

        # Only after calculating the current observation's statistics do we
        # add it to the historical baseline.
        historical_frp.append(current_frp)

        if current_day:
            historical_days.add(current_day)

    return stats_by_index