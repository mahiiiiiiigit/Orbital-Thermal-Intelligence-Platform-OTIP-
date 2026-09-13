"""
Audit historical NASA FIRMS observations for potential ML-label candidates.

This script does NOT assign labels and does NOT modify the training dataset.
It only measures spatial/temporal persistence patterns that can later support
conservative weak-label generation.
"""

from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
INPUT_FILE = PROJECT_ROOT / "data" / "firms" / "firms_historical_normalized.csv"

# Roughly 500 m at the equator. FIRMS VIIRS detections are approximately 375 m.
GRID_SIZE = 0.005

# Candidate thresholds are intentionally conservative.
MIN_PERSISTENT_DAYS = 5
MIN_OBSERVATIONS = 5
MIN_NIGHT_RATIO = 0.60


def grid_key(latitude: float, longitude: float) -> tuple[int, int]:
    return (
        int(latitude / GRID_SIZE),
        int(longitude / GRID_SIZE),
    )


def main() -> None:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Dataset not found: {INPUT_FILE}")

    # key -> aggregate statistics
    cells = defaultdict(
        lambda: {
            "dates": set(),
            "observations": 0,
            "night": 0,
            "day": 0,
            "type_0": 0,
            "type_2": 0,
            "frp_sum": 0.0,
            "frp_max": 0.0,
        }
    )

    total_rows = 0

    print("=" * 70)
    print("NASA FIRMS LABEL-CANDIDATE AUDIT")
    print("=" * 70)
    print(f"Input: {INPUT_FILE}")
    print()
    print("Scanning historical FIRMS dataset...")

    with INPUT_FILE.open(
        "r",
        encoding="utf-8",
        newline="",
    ) as file:
        reader = csv.DictReader(file)

        for row in reader:
            total_rows += 1

            try:
                latitude = float(row["latitude"])
                longitude = float(row["longitude"])
                frp = float(row["frp"])
            except (ValueError, TypeError):
                continue

            cell = cells[grid_key(latitude, longitude)]

            cell["observations"] += 1
            cell["dates"].add(row["acq_date"])

            if row["daynight"] == "N":
                cell["night"] += 1
            elif row["daynight"] == "D":
                cell["day"] += 1

            if row["type"] == "0":
                cell["type_0"] += 1
            elif row["type"] == "2":
                cell["type_2"] += 1

            cell["frp_sum"] += frp
            cell["frp_max"] = max(cell["frp_max"], frp)

    print(f"Rows scanned: {total_rows:,}")
    print(f"Spatial cells: {len(cells):,}")
    print()

    # Candidate counts.
    persistent_static = 0
    strong_static = 0
    persistent_vegetation = 0

    static_days = []
    static_observations = []
    static_night_ratios = []

    vegetation_days = []
    vegetation_observations = []

    for cell in cells.values():
        active_days = len(cell["dates"])
        observations = cell["observations"]

        night_total = cell["night"] + cell["day"]
        night_ratio = (
            cell["night"] / night_total
            if night_total
            else 0.0
        )

        # Type-2 spatially persistent cells.
        if (
            cell["type_2"] > 0
            and active_days >= MIN_PERSISTENT_DAYS
            and observations >= MIN_OBSERVATIONS
        ):
            persistent_static += 1

            static_days.append(active_days)
            static_observations.append(observations)
            static_night_ratios.append(night_ratio)

            # Stronger nighttime static-source candidate.
            if night_ratio >= MIN_NIGHT_RATIO:
                strong_static += 1

        # Type-0 cells with repeated activity.
        if (
            cell["type_0"] > 0
            and active_days >= MIN_PERSISTENT_DAYS
            and observations >= MIN_OBSERVATIONS
        ):
            persistent_vegetation += 1

            vegetation_days.append(active_days)
            vegetation_observations.append(observations)

    print("-" * 70)
    print("CANDIDATE CELL COUNTS")
    print("-" * 70)

    print(
        f"Persistent type-2 cells: "
        f"{persistent_static:,}"
    )

    print(
        f"Persistent type-2 + >=60% nighttime: "
        f"{strong_static:,}"
    )

    print(
        f"Persistent type-0 cells: "
        f"{persistent_vegetation:,}"
    )

    print()

    if static_days:
        print("-" * 70)
        print("TYPE-2 PERSISTENCE SUMMARY")
        print("-" * 70)
        print(
            f"Max active days: "
            f"{max(static_days):,}"
        )
        print(
            f"Max observations in one cell: "
            f"{max(static_observations):,}"
        )
        print(
            f"Average nighttime ratio: "
            f"{sum(static_night_ratios) / len(static_night_ratios):.3f}"
        )

    if vegetation_days:
        print()
        print("-" * 70)
        print("TYPE-0 PERSISTENCE SUMMARY")
        print("-" * 70)
        print(
            f"Max active days: "
            f"{max(vegetation_days):,}"
        )
        print(
            f"Max observations in one cell: "
            f"{max(vegetation_observations):,}"
        )

    print()
    print("=" * 70)
    print("AUDIT COMPLETE — NO LABELS WERE CREATED")
    print("=" * 70)


if __name__ == "__main__":
    main()