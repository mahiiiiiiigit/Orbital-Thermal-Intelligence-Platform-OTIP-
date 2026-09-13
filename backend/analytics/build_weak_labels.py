"""
Build a conservative weak/silver-labelled dataset from historical NASA FIRMS.

IMPORTANT:
- This does NOT create ground-truth labels.
- Labels are generated from deterministic OTIP weak-label rules.
- The original FIRMS dataset is never modified.
- Only persistent nighttime type-2 observations are considered.
- A spatial cell is qualified using its aggregate historical behavior.

Output:
    data/firms/firms_weak_labels.csv
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

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "firms"
    / "firms_weak_labels.csv"
)

# Approximately 500 m at the equator.
GRID_SIZE = 0.005

# Conservative persistence requirements.
MIN_PERSISTENT_DAYS = 5
MIN_OBSERVATIONS = 5
MIN_NIGHT_RATIO = 0.60

OUTPUT_FIELDS = [
    "latitude",
    "longitude",
    "brightness",
    "scan",
    "track",
    "acq_date",
    "acq_time",
    "satellite",
    "instrument",
    "confidence",
    "version",
    "bright_t31",
    "frp",
    "daynight",
    "type",
    "cell_id",
    "facility_name",
    "facility_type",
    "facility_category",
    "distance_to_facility_m",
    "label",
    "label_source",
    "label_confidence",
]


def grid_key(latitude: float, longitude: float) -> tuple[int, int]:
    return (
        int(latitude / GRID_SIZE),
        int(longitude / GRID_SIZE),
    )


def cell_id(key: tuple[int, int]) -> str:
    return f"grid:{key[0]}:{key[1]}"


def main() -> None:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Input dataset not found: {INPUT_FILE}"
        )

    print("=" * 70)
    print("OTIP WEAK-LABEL DATASET BUILDER")
    print("=" * 70)
    print()
    print(f"Input : {INPUT_FILE}")
    print(f"Output: {OUTPUT_FILE}")
    print()

    # ------------------------------------------------------------------
    # PASS 1
    # Aggregate type-2 observations by spatial cell.
    # ------------------------------------------------------------------

    cells = defaultdict(
        lambda: {
            "lat_sum": 0.0,
            "lon_sum": 0.0,
            "count": 0,
            "dates": set(),
            "night": 0,
            "day": 0,
        }
    )

    total_rows = 0
    type2_rows = 0

    print("PASS 1/2: Building spatial persistence statistics...")

    with INPUT_FILE.open(
        "r",
        encoding="utf-8",
        newline="",
    ) as file:
        reader = csv.DictReader(file)

        for row in reader:
            total_rows += 1

            # Only NASA type-2 static-source observations are considered.
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

            if row["daynight"] == "N":
                cell["night"] += 1
            elif row["daynight"] == "D":
                cell["day"] += 1

            type2_rows += 1

    print(f"Rows scanned:       {total_rows:,}")
    print(f"Type-2 observations: {type2_rows:,}")
    print(f"Type-2 cells:        {len(cells):,}")
    print()

    # ------------------------------------------------------------------
    # QUALIFY CELLS
    # ------------------------------------------------------------------

    qualified_cells = {}

    for key, cell in cells.items():
        active_days = len(cell["dates"])
        observations = cell["count"]

        day_night_total = cell["night"] + cell["day"]

        night_ratio = (
            cell["night"] / day_night_total
            if day_night_total
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

        facility, facility_name, context, distance_m = match_facility(
            latitude,
            longitude,
        )

        if facility is None:
            label = None
            label_confidence = None

        else:
            facility_type = facility.get("facility_type")
            has_flares = bool(
                facility.get("has_flares", False)
            )

            if (
                facility_type == "refinery_gas"
                and has_flares
            ):
                label = "GAS_FLARE"
                label_confidence = "HIGH"

            elif facility_type == "mining":
                label = "MINING_ACTIVITY"
                label_confidence = "HIGH"

            elif facility_type == "heavy_industry":
                label = "PERSISTENT_INDUSTRIAL"
                label_confidence = "HIGH"

            else:
                label = None
                label_confidence = None

        # Only retain cells for which we have a specific
        # OTIP weak-label rule.
        if label is None:
            continue

        qualified_cells[key] = {
            "cell_id": cell_id(key),
            "latitude": latitude,
            "longitude": longitude,
            "active_days": active_days,
            "observations": observations,
            "night_ratio": night_ratio,
            "facility_name": facility_name,
            "facility_type": (
                facility.get("facility_type")
                if facility
                else None
            ),
            "facility_category": (
                facility.get("category")
                if facility
                else None
            ),
            "distance_to_facility_m": distance_m,
            "label": label,
            "label_source": "OTIP_WEAK_RULE",
            "label_confidence": label_confidence,
        }

    print("-" * 70)
    print("QUALIFIED CELLS")
    print("-" * 70)
    print(
        f"Qualified labelled cells: "
        f"{len(qualified_cells):,}"
    )

    cell_label_counts = Counter(
        cell["label"]
        for cell in qualified_cells.values()
    )

    for label, count in cell_label_counts.most_common():
        print(f"{label:25s}: {count:,}")

    print()

    # ------------------------------------------------------------------
    # PASS 2
    # Write only observations belonging to qualified cells.
    # ------------------------------------------------------------------

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    observation_counts = Counter()
    cells_written = set()

    print("PASS 2/2: Writing weak-labelled observations...")

    with INPUT_FILE.open(
        "r",
        encoding="utf-8",
        newline="",
    ) as input_file, OUTPUT_FILE.open(
        "w",
        encoding="utf-8",
        newline="",
    ) as output_file:

        reader = csv.DictReader(input_file)

        writer = csv.DictWriter(
            output_file,
            fieldnames=OUTPUT_FIELDS,
        )

        writer.writeheader()

        for row in reader:
            if row["type"] != "2":
                continue

            try:
                latitude = float(row["latitude"])
                longitude = float(row["longitude"])
            except (ValueError, TypeError):
                continue

            key = grid_key(latitude, longitude)
            cell = qualified_cells.get(key)

            if cell is None:
                continue

            output_row = {
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "brightness": row["brightness"],
                "scan": row["scan"],
                "track": row["track"],
                "acq_date": row["acq_date"],
                "acq_time": row["acq_time"],
                "satellite": row["satellite"],
                "instrument": row["instrument"],
                "confidence": row["confidence"],
                "version": row["version"],
                "bright_t31": row["bright_t31"],
                "frp": row["frp"],
                "daynight": row["daynight"],
                "type": row["type"],
                "cell_id": cell["cell_id"],
                "facility_name": cell["facility_name"] or "",
                "facility_type": cell["facility_type"] or "",
                "facility_category": cell["facility_category"] or "",
                "distance_to_facility_m": (
                    cell["distance_to_facility_m"]
                    if cell["distance_to_facility_m"] is not None
                    else ""
                ),
                "label": cell["label"],
                "label_source": cell["label_source"],
                "label_confidence": cell["label_confidence"],
            }

            writer.writerow(output_row)

            observation_counts[cell["label"]] += 1
            cells_written.add(cell["cell_id"])

    print()
    print("-" * 70)
    print("OUTPUT SUMMARY")
    print("-" * 70)

    total_labelled = sum(observation_counts.values())

    print(
        f"Labelled observations: "
        f"{total_labelled:,}"
    )

    print(
        f"Unique labelled cells: "
        f"{len(cells_written):,}"
    )

    for label, count in observation_counts.most_common():
        print(
            f"{label:25s}: "
            f"{count:,}"
        )

    print()
    print(f"Dataset written to:")
    print(f"  {OUTPUT_FILE}")

    print()
    print("=" * 70)
    print("WEAK-LABEL BUILD COMPLETE")
    print("=" * 70)
    print()
    print(
        "These are SILVER/WEAK labels, not ground truth."
    )
    print(
        "Do not report these labels as externally validated accuracy."
    )
    print("=" * 70)


if __name__ == "__main__":
    main()