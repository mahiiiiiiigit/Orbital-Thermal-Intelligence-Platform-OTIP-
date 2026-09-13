"""
Prepare the historical NASA FIRMS archive for OTIP ML work.

This script:
1. Reads the three NASA FIRMS ZIP archives directly.
2. Processes CSV rows without loading the full dataset into RAM.
3. Normalizes the NASA FIRMS schema.
4. Validates coordinates and required thermal fields.
5. Writes one normalized CSV dataset.

This script does NOT create ML labels and does NOT train a model.
"""

from __future__ import annotations

import csv
import zipfile
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]

FIRMS_DIR = PROJECT_ROOT / "data" / "firms"

INPUT_FILES = [
    FIRMS_DIR / "DL_FIRE_SV-C2_804568.zip",
    FIRMS_DIR / "DL_FIRE_J1V-C2_804566.zip",
    FIRMS_DIR / "DL_FIRE_J2V-C2_804567.zip",
]

OUTPUT_FILE = FIRMS_DIR / "firms_historical_normalized.csv"


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
]


def normalize_row(row):
    """Normalize one NASA FIRMS CSV row."""

    return {
        "latitude": row.get("latitude", "").strip(),
        "longitude": row.get("longitude", "").strip(),
        "brightness": row.get("brightness", "").strip(),
        "scan": row.get("scan", "").strip(),
        "track": row.get("track", "").strip(),
        "acq_date": row.get("acq_date", "").strip(),
        "acq_time": row.get("acq_time", "").strip(),
        "satellite": row.get("satellite", "").strip(),
        "instrument": row.get("instrument", "").strip(),
        "confidence": row.get("confidence", "").strip(),
        "version": row.get("version", "").strip(),
        "bright_t31": row.get("bright_t31", "").strip(),
        "frp": row.get("frp", "").strip(),
        "daynight": row.get("daynight", "").strip(),
        "type": row.get("type", "").strip(),
    }


def validate_row(row):
    """Return True when the row contains valid core FIRMS values."""

    try:
        latitude = float(row["latitude"])
        longitude = float(row["longitude"])
        float(row["brightness"])
        float(row["frp"])
    except (ValueError, TypeError):
        return False

    if not (-90.0 <= latitude <= 90.0):
        return False

    if not (-180.0 <= longitude <= 180.0):
        return False

    if not row["acq_date"] or not row["acq_time"]:
        return False

    return True


def process_zip(zip_path, writer):
    """Process one FIRMS ZIP archive."""

    total = 0
    written = 0
    invalid = 0

    print()
    print(f"Processing: {zip_path.name}")

    with zipfile.ZipFile(zip_path, "r") as archive:
        csv_files = [
            name
            for name in archive.namelist()
            if name.lower().endswith(".csv")
        ]

        if not csv_files:
            raise RuntimeError(
                f"No CSV file found inside {zip_path.name}"
            )

        for csv_name in csv_files:
            print(f"  CSV: {csv_name}")

            with archive.open(csv_name, "r") as raw_file:
                text_file = (
                    line.decode("utf-8-sig", errors="replace")
                    for line in raw_file
                )

                reader = csv.DictReader(text_file)

                for raw_row in reader:
                    total += 1
                    row = normalize_row(raw_row)

                    if not validate_row(row):
                        invalid += 1
                        continue

                    writer.writerow(row)
                    written += 1

    print(f"  Rows read:       {total:,}")
    print(f"  Rows written:    {written:,}")
    print(f"  Invalid skipped: {invalid:,}")

    return total, written, invalid


def main():
    print("=" * 70)
    print("NASA FIRMS HISTORICAL DATA PREPARATION")
    print("=" * 70)

    missing_files = [
        path for path in INPUT_FILES
        if not path.exists()
    ]

    if missing_files:
        print()
        print("ERROR: Missing input files:")

        for path in missing_files:
            print(f"  {path}")

        return

    print()
    print("Input archives:")

    for path in INPUT_FILES:
        print(f"  {path.name}")

    print()
    print(f"Output:")
    print(f"  {OUTPUT_FILE}")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    total_read = 0
    total_written = 0
    total_invalid = 0

    with OUTPUT_FILE.open(
        "w",
        encoding="utf-8",
        newline=""
    ) as output_file:

        writer = csv.DictWriter(
            output_file,
            fieldnames=OUTPUT_FIELDS
        )

        writer.writeheader()

        for zip_path in INPUT_FILES:
            read, written, invalid = process_zip(
                zip_path,
                writer
            )

            total_read += read
            total_written += written
            total_invalid += invalid

    print()
    print("=" * 70)
    print("PREPARATION COMPLETE")
    print("=" * 70)
    print(f"Total rows read:       {total_read:,}")
    print(f"Total rows written:    {total_written:,}")
    print(f"Total invalid skipped: {total_invalid:,}")
    print()
    print(f"Dataset written to:")
    print(f"  {OUTPUT_FILE}")
    print("=" * 70)


if __name__ == "__main__":
    main()