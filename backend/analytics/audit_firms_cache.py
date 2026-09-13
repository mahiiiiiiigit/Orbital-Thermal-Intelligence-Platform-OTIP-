from __future__ import annotations

import json
from collections import Counter
from pathlib import Path


CACHE_DIR = Path("backend/ingestion/.cache")


def main() -> None:
    files = sorted(CACHE_DIR.glob("*.json"))

    if not files:
        print("No FIRMS cache files found.")
        return

    total = 0
    all_dates = []
    satellites = Counter()
    sensors = Counter()
    contexts = Counter()
    confidence = Counter()
    facility_matches = 0
    missing_frp = 0
    missing_brightness = 0
    coordinates = []
    unique_ids = set()

    print(f"CACHE FILES: {len(files)}")
    print()

    for path in files:
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)

        records = data.get("payload", [])

        print(f"{path.name}: {len(records)} records")

        for record in records:
            total += 1

            record_id = record.get("id")
            if record_id:
                unique_ids.add(record_id)

            timestamp = record.get("timestamp")
            if timestamp:
                all_dates.append(timestamp)

            satellite = record.get("satellite") or "UNKNOWN"
            sensor = record.get("sensor") or "UNKNOWN"
            context = record.get("context") or "UNKNOWN"
            conf = record.get("confidence") or "UNKNOWN"

            satellites[satellite] += 1
            sensors[sensor] += 1
            contexts[context] += 1
            confidence[conf] += 1

            if record.get("facility_name"):
                facility_matches += 1

            if record.get("frp") is None:
                missing_frp += 1

            if record.get("brightness_temp") is None:
                missing_brightness += 1

            latitude = record.get("latitude")
            longitude = record.get("longitude")

            if latitude is not None and longitude is not None:
                coordinates.append(
                    (float(latitude), float(longitude))
                )

    print()
    print("=" * 60)
    print("FIRMS CACHE AUDIT")
    print("=" * 60)

    print(f"Total observations: {total}")
    print(f"Unique observation IDs: {len(unique_ids)}")
    print(f"Duplicate IDs: {total - len(unique_ids)}")

    if all_dates:
        print(f"Date range: {min(all_dates)} -> {max(all_dates)}")

    print()
    print("Satellites:")
    for name, count in satellites.most_common():
        print(f"  {name}: {count}")

    print()
    print("Sensors:")
    for name, count in sensors.most_common():
        print(f"  {name}: {count}")

    print()
    print("Contexts:")
    for name, count in contexts.most_common():
        print(f"  {name}: {count}")

    print()
    print("Confidence:")
    for name, count in confidence.most_common():
        print(f"  {name}: {count}")

    print()
    print(f"Facility-attributed: {facility_matches}")
    print(f"Missing FRP: {missing_frp}")
    print(f"Missing brightness temperature: {missing_brightness}")

    if coordinates:
        latitudes = [point[0] for point in coordinates]
        longitudes = [point[1] for point in coordinates]

        print()
        print("Geographic extent:")
        print(f"  Latitude:  {min(latitudes):.5f} -> {max(latitudes):.5f}")
        print(f"  Longitude: {min(longitudes):.5f} -> {max(longitudes):.5f}")


if __name__ == "__main__":
    main()