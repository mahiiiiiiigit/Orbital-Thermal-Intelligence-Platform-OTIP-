import json
import logging
import urllib.request
from typing import Optional

logger = logging.getLogger(__name__)

# Spatial cache (~1km resolution) pre-populated with key industrial assets and active thermal clusters
_SITE_CACHE = {
    (20.79, 85.26): "Tata Steel Meramandali, Dhenkanal",
    (20.86, 84.99): "Angul Steel Plant, Angul",
    (22.36, 82.30): "Pali, Korba",
    (22.79, 86.20): "Tata Steel Works Jamshedpur",
    (22.46, 70.05): "Jamnagar Refinery (RIL)",
    (23.75, 86.42): "Jharia Coalfield & Seam Fire Zone",
    (23.68, 87.13): "Asansol-Durgapur Mining Corridor",
    (19.96, 79.34): "Chandrapur Super Thermal Power Station",
    (20.97, 86.01): "Kalinganagar Industrial Complex",
    (15.18, 76.66): "Vijayanagar Steel Works, Bellary",
    (31.21, 73.73): "Nankana Sahib Agrarian Sector",
}


def resolve_site_name(latitude: float, longitude: float, fallback_region: Optional[str] = None) -> str:
    """
    Resolves the physical or geographical name of a site given its coordinates.
    1. Checks in-memory spatial cache
    2. Performs fast reverse geocoding via OpenStreetMap Nominatim
    3. Falls back to regional forest/agro bounds
    4. Formatted clean coordinate reference if all lookups fail
    """
    try:
        r_lat = round(float(latitude), 2)
        r_lon = round(float(longitude), 2)
    except (TypeError, ValueError):
        return "Target Site"

    cache_key = (r_lat, r_lon)
    if cache_key in _SITE_CACHE:
        return _SITE_CACHE[cache_key]

    # Live OSM Nominatim reverse geocode with small timeout
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "OTIP-Geocoding-Service/1.0 (Orbital-Thermal-Intelligence)"},
        )
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            addr = data.get("address", {})
            primary = (
                data.get("name")
                or addr.get("industrial")
                or addr.get("aeroway")
                or addr.get("natural")
                or addr.get("leisure")
                or addr.get("suburb")
                or addr.get("village")
                or addr.get("town")
                or addr.get("city")
                or addr.get("county")
            )
            district = addr.get("state_district") or addr.get("district") or addr.get("county")
            state = addr.get("state")

            parts = [p for p in [primary, district, state] if p]
            unique_parts = []
            for p in parts:
                if p not in unique_parts:
                    unique_parts.append(p)

            if unique_parts:
                site_name = ", ".join(unique_parts[:2])
                _SITE_CACHE[cache_key] = site_name
                return site_name
    except Exception as e:
        logger.debug("Reverse geocoding error for (%s, %s): %s", latitude, longitude, e)

    # Heuristic corridor fallback
    if not fallback_region:
        from backend.analytics.facility_registry import AGRO_REGIONS, FOREST_REGIONS

        for r in FOREST_REGIONS:
            if r["min_lat"] <= latitude <= r["max_lat"] and r["min_lon"] <= longitude <= r["max_lon"]:
                fallback_region = r["name"]
                break
        if not fallback_region:
            for r in AGRO_REGIONS:
                if r["min_lat"] <= latitude <= r["max_lat"] and r["min_lon"] <= longitude <= r["max_lon"]:
                    fallback_region = r["name"]
                    break

    if fallback_region:
        _SITE_CACHE[cache_key] = fallback_region
        return fallback_region

    clean_name = f"Site ({r_lat}, {r_lon})"
    _SITE_CACHE[cache_key] = clean_name
    return clean_name
