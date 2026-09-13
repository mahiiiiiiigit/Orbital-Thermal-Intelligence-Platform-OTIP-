"""
Audit persistent NASA FIRMS type-2 locations against OTIP's
curated spatial context.

This script does NOT create ML labels.
It only measures how persistent static-source candidates
intersect existing facility/context information.
"""

from __future__ import annotations

import csv
from collections import defaultdict, Counter
from pathlib import Path

from backend.analytics.facility_registry import match_facility


PROJECT_ROOT = Path(__file__).resolve().parents[2]
INPUT_FILE = PROJECT_ROOT / "data" / "firms" / "firms_historical_normalized.csv"

GRID_SIZE = 0.005
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

    cells = defaultdict(
        lambda: {
            "latitude_sum": 0.0,
            "longitude_sum": 0.0,
            "coordinates_count": 0,
            "dates": set(),
            "observations": 0,
            "night": 0,
            "day": 0,
            "type_2": 0,
        }
    )

    total_rows = 0

    print("=" * 70)
    print("PERSISTENT TYPE-2 CONTEXT AUDIT")
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

            if row["type"] != "2":
                continue

            try:
                latitude = float(row["latitude"])
                longitude = float(row["longitude"])
            except (ValueError, TypeError):
                continue

            cell = cells[grid_key(latitude, longitude)]

            cell["latitude_sum"] += latitude
            cell["longitude_sum"] += longitude
            cell["coordinates_count"] += 1
            cell["dates"].add(row["acq_date"])
            cell["observations"] += 1
            cell["type_2"] += 1

            if row["daynight"] == "N":
                cell["night"] += 1
            elif row["daynight"] == "D":
                cell["day"] += 1

    persistent_cells = []

    for cell in cells.values():
        active_days = len(cell["dates"])
        observations = cell["observations"]
        total_day_night = cell["night"] + cell["day"]

        night_ratio = (
            cell["night"] / total_day_night
            if total_day_night
            else 0.0
        )

        if (
            active_days >= MIN_PERSISTENT_DAYS
            and observations >= MIN_OBSERVATIONS
            and night_ratio >= MIN_NIGHT_RATIO
        ):
            latitude = cell["latitude_sum"] / cell["coordinates_count"]
            longitude = cell["longitude_sum"] / cell["coordinates_count"]

            persistent_cells.append(
                {
                    "latitude": latitude,
                    "longitude": longitude,
                    "active_days": active_days,
                    "observations": observations,
                    "night_ratio": night_ratio,
                }
            )

    print(f"Rows scanned: {total_rows:,}")
    print(f"Persistent nighttime type-2 cells: {len(persistent_cells):,}")
    print()

    context_counts = Counter()
    facility_type_counts = Counter()
    facility_category_counts = Counter()

    distance_values = []

    for cell in persistent_cells:
        facility, facility_name, context, distance_m = match_facility(
            cell["latitude"],
            cell["longitude"],
        )

        context_counts[context] += 1

        if facility:
            facility_type = facility.get("facility_type")
            category = facility.get("category")

            if facility_type:
                facility_type_counts[facility_type] += 1

            if category:
                facility_category_counts[category] += 1

            if distance_m is not None:
                distance_values.append(distance_m)

    print("-" * 70)
    print("CONTEXT DISTRIBUTION")
    print("-" * 70)

    for context, count in context_counts.most_common():
        print(f"{context:15s}: {count:,}")

    print()
    print("-" * 70)
    print("FACILITY-TYPE DISTRIBUTION")
    print("-" * 70)

    if facility_type_counts:
        for facility_type, count in facility_type_counts.most_common():
            print(f"{facility_type:20s}: {count:,}")
    else:
        print("No facility matches.")

    print()
    print("-" * 70)
    print("TOP FACILITY CATEGORIES")
    print("-" * 70)

    for category, count in facility_category_counts.most_common(15):
        print(f"{category}: {count:,}")

    print()
    print("-" * 70)
    print("FACILITY DISTANCE")
    print("-" * 70)

    if distance_values:
        print(f"Matched cells: {len(distance_values):,}")
        print(f"Minimum distance: {min(distance_values):,.1f} m")
        print(f"Maximum distance: {max(distance_values):,.1f} m")
        print(
            f"Average distance: "
            f"{sum(distance_values) / len(distance_values):,.1f} m"
        )
    else:
        print("No facility distances available.")

    print()
    print("=" * 70)
    print("AUDIT COMPLETE — NO LABELS WERE CREATED")
    print("=" * 70)


if __name__ == "__main__":
    main()