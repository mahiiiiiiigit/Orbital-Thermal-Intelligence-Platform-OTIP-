"""
Audit high-confidence ML label candidates from historical FIRMS data.

This script does NOT create labels and does NOT modify the dataset.
It only counts candidate locations using conservative spatial,
temporal and contextual rules.
"""

from __future__ import annotations

import csv
from collections import defaultdict, Counter
from pathlib import Path

from backend.analytics.facility_registry import match_facility


PROJECT_ROOT = Path(__file__).resolve().parents[2]
INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "firms"
    / "firms_historical_normalized.csv"
)

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
        raise FileNotFoundError(
            f"Dataset not found: {INPUT_FILE}"
        )

    cells = defaultdict(
        lambda: {
            "lat_sum": 0.0,
            "lon_sum": 0.0,
            "count": 0,
            "dates": set(),
            "night": 0,
            "day": 0,
            "type_2": 0,
        }
    )

    print("=" * 70)
    print("OTIP ML LABEL-CANDIDATE AUDIT")
    print("=" * 70)
    print()
    print(f"Input: {INPUT_FILE}")
    print()
    print("Scanning historical FIRMS dataset...")

    total_rows = 0

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

            key = grid_key(latitude, longitude)
            cell = cells[key]

            cell["lat_sum"] += latitude
            cell["lon_sum"] += longitude
            cell["count"] += 1
            cell["dates"].add(row["acq_date"])
            cell["type_2"] += 1

            if row["daynight"] == "N":
                cell["night"] += 1
            elif row["daynight"] == "D":
                cell["day"] += 1

    candidates = []

    for cell in cells.values():
        active_days = len(cell["dates"])
        observations = cell["count"]

        total_dn = cell["night"] + cell["day"]

        night_ratio = (
            cell["night"] / total_dn
            if total_dn
            else 0.0
        )

        if (
            active_days < MIN_PERSISTENT_DAYS
            or observations < MIN_OBSERVATIONS
            or night_ratio < MIN_NIGHT_RATIO
        ):
            continue

        latitude = cell["lat_sum"] / cell["count"]
        longitude = cell["lon_sum"] / cell["count"]

        candidates.append(
            {
                "latitude": latitude,
                "longitude": longitude,
                "active_days": active_days,
                "observations": observations,
                "night_ratio": night_ratio,
            }
        )

    print(f"Rows scanned: {total_rows:,}")
    print(
        f"Persistent nighttime type-2 cells: "
        f"{len(candidates):,}"
    )
    print()

    candidate_counts = Counter()
    flare_facility_names = Counter()
    industrial_facility_names = Counter()
    mining_facility_names = Counter()

    matched = 0

    for candidate in candidates:
        facility, facility_name, context, distance_m = match_facility(
            candidate["latitude"],
            candidate["longitude"],
        )

        if facility is None:
            candidate_counts["UNASSIGNED_STATIC"] += 1
            continue

        matched += 1

        facility_type = facility.get("facility_type")
        has_flares = bool(facility.get("has_flares", False))

        if (
            facility_type == "refinery_gas"
            and has_flares
        ):
            candidate_counts["GAS_FLARE_CANDIDATE"] += 1

            if facility_name:
                flare_facility_names[facility_name] += 1

        elif facility_type == "mining":
            candidate_counts["MINING_ACTIVITY_CANDIDATE"] += 1

            if facility_name:
                mining_facility_names[facility_name] += 1

        elif facility_type == "heavy_industry":
            candidate_counts["PERSISTENT_INDUSTRIAL_CANDIDATE"] += 1

            if facility_name:
                industrial_facility_names[facility_name] += 1

        else:
            candidate_counts["OTHER_CONTEXT_STATIC"] += 1

    print("-" * 70)
    print("CANDIDATE COUNTS")
    print("-" * 70)

    for name, count in candidate_counts.most_common():
        print(f"{name:35s}: {count:,}")

    print()
    print(f"Facility/context matched: {matched:,}")
    print(
        f"Facility/context unmatched: "
        f"{len(candidates) - matched:,}"
    )

    print()
    print("-" * 70)
    print("GAS-FLARE FACILITY CANDIDATES")
    print("-" * 70)

    if flare_facility_names:
        for name, count in flare_facility_names.most_common(15):
            print(f"{name}: {count:,}")
    else:
        print("None")

    print()
    print("-" * 70)
    print("MINING FACILITY CANDIDATES")
    print("-" * 70)

    if mining_facility_names:
        for name, count in mining_facility_names.most_common(15):
            print(f"{name}: {count:,}")
    else:
        print("None")

    print()
    print("-" * 70)
    print("HEAVY-INDUSTRY FACILITY CANDIDATES")
    print("-" * 70)

    if industrial_facility_names:
        for name, count in industrial_facility_names.most_common(15):
            print(f"{name}: {count:,}")
    else:
        print("None")

    print()
    print("=" * 70)
    print("AUDIT COMPLETE — NO LABELS WERE CREATED")
    print("=" * 70)


if __name__ == "__main__":
    main()