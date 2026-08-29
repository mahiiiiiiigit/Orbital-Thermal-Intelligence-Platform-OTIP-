from __future__ import annotations

import csv
import io
import json
import logging
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv

from backend.analytics.facility_registry import match_facility

logger = logging.getLogger("thermalwatch.ingestion")

# Always load .env with override=True so .env takes precedence over shell placeholders
project_root = Path(__file__).resolve().parents[2]
load_dotenv(project_root / ".env", override=True)
load_dotenv(Path.cwd() / ".env", override=True)

FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api"
DEFAULT_CACHE_TTL_SECONDS = int(os.getenv("FIRMS_CACHE_TTL_SECONDS", "900"))  # 15 mins
CACHE_DIR = Path(__file__).resolve().parent / ".cache"

VALID_SOURCES = {
    "VIIRS_SNPP_NRT",
    "VIIRS_NOAA20_NRT",
    "VIIRS_NOAA21_NRT",
    "MODIS_NRT",
}

# Country BBOX mapping because NASA's /api/country/ endpoint is officially disabled
KNOWN_COUNTRY_BBOXES = {
    "IND": "68.1,6.7,97.4,35.5",
    "INDIA": "68.1,6.7,97.4,35.5",
}


def _normalize_confidence(confidence_raw: Any, sensor: str) -> str:
    if confidence_raw is None:
        return "nominal"

    conf_str = str(confidence_raw).strip().lower()

    # VIIRS format: 'l', 'n', 'h'
    if conf_str in ("h", "high"):
        return "high"
    if conf_str in ("n", "nominal"):
        return "nominal"
    if conf_str in ("l", "low"):
        return "low"

    # MODIS format: 0 to 100 integer
    try:
        score = int(conf_str)
        if score >= 80:
            return "high"
        elif score >= 40:
            return "nominal"
        else:
            return "low"
    except ValueError:
        return "nominal"


def _parse_timestamp(acq_date: str, acq_time: str) -> str:
    if not acq_date:
        return datetime.now(timezone.utc).isoformat()

    acq_time = (acq_time or "0000").strip().zfill(4)

    try:
        dt = datetime.strptime(f"{acq_date} {acq_time}", "%Y-%m-%d %H%M")
        return dt.replace(tzinfo=timezone.utc).isoformat()
    except ValueError:
        try:
            return datetime.strptime(acq_date, "%Y-%m-%d").replace(tzinfo=timezone.utc).isoformat()
        except ValueError:
            return datetime.now(timezone.utc).isoformat()


def validate_bbox(bbox: str) -> Tuple[float, float, float, float]:
    """Validates W,S,E,N (min_lon, min_lat, max_lon, max_lat)"""
    parts = [p.strip() for p in bbox.split(",")]
    if len(parts) != 4:
        raise ValueError(
            f"Invalid bounding box '{bbox}'. Expected format: min_lon,min_lat,max_lon,max_lat"
        )
    try:
        min_lon, min_lat, max_lon, max_lat = map(float, parts)
    except ValueError:
        raise ValueError(f"Non-numeric coordinates in bbox '{bbox}'.")

    if not (-180 <= min_lon <= 180 and -180 <= max_lon <= 180):
        raise ValueError(f"Longitude must be between -180 and 180. Received: min_lon={min_lon}, max_lon={max_lon}")
    if not (-90 <= min_lat <= 90 and -90 <= max_lat <= 90):
        raise ValueError(f"Latitude must be between -90 and 90. Received: min_lat={min_lat}, max_lat={max_lat}")
    if min_lon > max_lon or min_lat > max_lat:
        raise ValueError(
            f"Invalid bbox coordinates: min must be <= max. Got min_lon={min_lon}, max_lon={max_lon}"
        )

    return min_lon, min_lat, max_lon, max_lat


class SimpleFileCache:
    """Disk-backed TTL Cache for NASA FIRMS responses to preserve transaction quota."""

    def __init__(self, cache_dir: Path = CACHE_DIR, default_ttl: int = DEFAULT_CACHE_TTL_SECONDS):
        self.cache_dir = cache_dir
        self.default_ttl = default_ttl
        try:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logger.warning(f"Could not create cache directory {self.cache_dir}: {e}")

    def _get_path(self, key: str) -> Path:
        safe_key = re.sub(r"[^\w\-.]", "_", key)
        return self.cache_dir / f"{safe_key}.json"

    def get(self, key: str) -> Optional[Tuple[List[Dict], int]]:
        path = self._get_path(key)
        if not path.exists():
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            cached_time = data.get("cached_at", 0)
            age = int(time.time() - cached_time)
            ttl = data.get("ttl", self.default_ttl)
            if age > ttl:
                return None
            return data.get("payload", []), age
        except Exception as e:
            logger.warning(f"Error reading cache file {path}: {e}")
            return None

    def set(self, key: str, payload: List[Dict], ttl: Optional[int] = None) -> None:
        path = self._get_path(key)
        try:
            cache_payload = {
                "cached_at": time.time(),
                "ttl": ttl or self.default_ttl,
                "payload": payload,
            }
            with open(path, "w", encoding="utf-8") as f:
                json.dump(cache_payload, f)
        except Exception as e:
            logger.warning(f"Error writing to cache file {path}: {e}")

    def clear(self) -> int:
        count = 0
        if self.cache_dir.exists():
            for f in self.cache_dir.glob("*.json"):
                try:
                    f.unlink()
                    count += 1
                except Exception:
                    pass
        return count


# Singleton cache instance
firms_cache = SimpleFileCache()


def parse_firms_csv(csv_text: str) -> List[Dict]:
    cleaned_text = csv_text.strip()
    if not cleaned_text:
        return []

    # Detect NASA error responses delivered as plain text
    if "Invalid MAP_KEY" in cleaned_text or "No transaction left" in cleaned_text or "Bad Request" in cleaned_text:
        raise ValueError(f"NASA FIRMS API error: {cleaned_text}")

    reader = csv.DictReader(io.StringIO(cleaned_text))
    hotspots: List[Dict] = []

    for index, row in enumerate(reader):
        lat_raw = row.get("latitude")
        lon_raw = row.get("longitude")
        if not lat_raw or not lon_raw:
            continue

        try:
            latitude = float(lat_raw)
            longitude = float(lon_raw)
        except ValueError:
            continue

        frp = float(row.get("frp") or 0.0)

        # Brightness temperature handling (VIIRS bright_ti4 vs MODIS brightness)
        brightness_temp = None
        if row.get("bright_ti4"):
            try:
                brightness_temp = float(row["bright_ti4"])
            except ValueError:
                pass
        elif row.get("brightness"):
            try:
                brightness_temp = float(row["brightness"])
            except ValueError:
                pass

        sensor = row.get("instrument") or "VIIRS"
        confidence = _normalize_confidence(row.get("confidence"), sensor)

        # Spatial facility attribution via KNOWN_FACILITIES
        facility_obj, facility_name, context, distance_m = match_facility(latitude, longitude)
        facility_type = facility_obj.get("facility_type") if facility_obj else None
        facility_category = facility_obj.get("category") if facility_obj else None
        has_flares = facility_obj.get("has_flares", False) if facility_obj else False

        hotspot = {
            "id": row.get("id") or f"firms-{index}",
            "latitude": round(latitude, 5),
            "longitude": round(longitude, 5),
            "frp": round(frp, 1),
            "brightness_temp": round(brightness_temp, 1) if brightness_temp is not None else None,
            "timestamp": _parse_timestamp(row.get("acq_date", ""), row.get("acq_time", "")),
            "context": context,
            "facility_name": facility_name,
            "facility_type": facility_type,
            "facility_category": facility_category,
            "has_flares": has_flares,
            "confidence": confidence,
            "satellite": row.get("satellite") or "VIIRS",
            "sensor": sensor,
            "day_night": (row.get("daynight") or "D").upper(),
            "land_context": facility_category if facility_category else ("cropland" if context == "agricultural" else ("forest reserve" if context == "forest" else "unassigned")),
            "distance_to_facility_m": distance_m,
            "source": "FIRMS",
            "raw": {k: v for k, v in row.items() if k not in ("latitude", "longitude")},
        }
        hotspots.append(hotspot)

    return hotspots


def fetch_firms_hotspots(
    bbox: Optional[str] = None,
    country: Optional[str] = None,
    days: int = 1,
    source: str = "VIIRS_SNPP_NRT",
    map_key: Optional[str] = None,
    force_refresh: bool = False,
) -> Tuple[List[Dict], Dict[str, Any]]:
    # Extract and clean key (strip any surrounding whitespace or quotes)
    raw_key = map_key or os.getenv("FIRMS_MAP_KEY", "")
    key = raw_key.strip().strip('"').strip("'")

    if not key:
        raise ValueError(
            "FIRMS_MAP_KEY is not configured. Please set FIRMS_MAP_KEY in your .env file."
        )

    if source not in VALID_SOURCES:
        source = "VIIRS_SNPP_NRT"

    # NASA FIRMS Area API strictly requires 1 <= days <= 5
    days = max(1, min(5, days))

    # NASA /api/country/ is disabled, so resolve country to bounding box
    effective_bbox = bbox
    if country and not effective_bbox:
        country_code = country.strip().upper()
        effective_bbox = KNOWN_COUNTRY_BBOXES.get(country_code, "68.1,6.7,97.4,35.5")
    elif not effective_bbox:
        effective_bbox = os.getenv("FIRMS_BBOX", "68.1,6.7,97.4,35.5")

    validate_bbox(effective_bbox)
    clean_bbox = ",".join(effective_bbox.split())

    # Formulate official Area API URL
    url = f"{FIRMS_BASE_URL}/area/csv/{key}/{source}/{clean_bbox}/{days}"
    cache_key = f"area_{clean_bbox}_{source}_{days}"

    masked_url = url.replace(key, f"{key[:4]}...{key[-4:]}" if len(key) >= 8 else "***")
    logger.debug(f"Calling NASA FIRMS URL: {masked_url}")

    # Check cache unless force_refresh is requested
    if not force_refresh:
        cached_result = firms_cache.get(cache_key)
        if cached_result is not None:
            data, age_seconds = cached_result
            logger.debug(f"Cache Hit for {cache_key} (age: {age_seconds}s)")
            return data, {
                "source": source,
                "query_type": "area",
                "target": clean_bbox,
                "days": days,
                "cached": True,
                "cache_age_seconds": age_seconds,
                "count": len(data),
            }

    # Execute HTTP request to NASA FIRMS
    request = Request(
        url,
        headers={
            "User-Agent": "ThermalWatch/1.0 (SIH-AI-Assisted-Thermal-Intelligence)",
            "Accept": "text/csv",
        },
    )

    try:
        with urlopen(request, timeout=35) as response:
            status_code = getattr(response, "status", 200)
            csv_text = response.read().decode("utf-8", errors="replace")
            logger.debug(f"NASA FIRMS HTTP Response: {status_code} | Bytes: {len(csv_text)}")
    except HTTPError as http_err:
        error_body = http_err.read().decode("utf-8", errors="replace").strip()
        logger.warning(f"NASA FIRMS HTTP Error: {http_err.code} {http_err.reason} | Body: {error_body}")

        if http_err.code == 400:
            raise ValueError(f"NASA FIRMS 400 Bad Request: {error_body}") from http_err
        elif http_err.code == 403:
            raise ValueError(f"NASA FIRMS 403 Forbidden: {error_body or 'Invalid or expired MAP_KEY'}") from http_err
        elif http_err.code == 429:
            raise ValueError(f"NASA FIRMS 429 Rate Limit Exceeded: {error_body}") from http_err
        else:
            raise RuntimeError(f"NASA FIRMS HTTP Error {http_err.code} ({http_err.reason}): {error_body}") from http_err
    except URLError as url_err:
        logger.error(f"Connection Error: {url_err.reason}")
        raise ConnectionError(f"Failed to connect to NASA FIRMS API: {url_err.reason}") from url_err

    hotspots = parse_firms_csv(csv_text)

    # Save successful result to cache
    firms_cache.set(cache_key, hotspots)

    metadata = {
        "source": source,
        "query_type": "area",
        "target": clean_bbox,
        "days": days,
        "cached": False,
        "cache_age_seconds": 0,
        "count": len(hotspots),
    }

    return hotspots, metadata
