"""
Emergency Dispatch & First-Responder Routing Module for OTIP (SIH 26162).
Integrates with OpenRouteService (ORS) to calculate:
1. Fastest emergency response road routes from nearest fire station / emergency base to thermal hotspots.
2. Turn-by-turn navigation instructions and estimated time of arrival (ETA).
3. Evacuation reachability and road network distance.
"""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import urllib.error
import urllib.request
import json
from dotenv import load_dotenv
from backend.analytics.spatial import distance_metres

project_root = Path(__file__).resolve().parents[2]
load_dotenv(project_root / ".env", override=True)


# Curated network of major Emergency Response & Fire Stations in India
EMERGENCY_DEPOTS = [
    {"name": "Jamnagar Refinery Emergency Fire Station", "state": "Gujarat", "latitude": 22.4650, "longitude": 70.0450},
    {"name": "Hazira Industrial Fire & Rescue Centre", "state": "Gujarat", "latitude": 21.1350, "longitude": 72.6350},
    {"name": "Panipat Refinery Fire Station", "state": "Haryana", "latitude": 29.3800, "longitude": 76.9550},
    {"name": "Jamshedpur Steel Works Emergency Response Base", "state": "Jharkhand", "latitude": 22.8050, "longitude": 86.1900},
    {"name": "Dhanbad Coalfield Mine Rescue Station", "state": "Jharkhand", "latitude": 23.7650, "longitude": 86.4100},
    {"name": "Singrauli Industrial Area Fire Station", "state": "UP / MP", "latitude": 24.1350, "longitude": 82.6850},
    {"name": "Bandhavgarh Tiger Reserve Forest Fire Control Room", "state": "Madhya Pradesh", "latitude": 23.6950, "longitude": 80.9550},
    {"name": "Ludhiana Central Fire Service Depot", "state": "Punjab", "latitude": 30.9050, "longitude": 75.8500},
    {"name": "Mundra Port & Power Fire Safety Hub", "state": "Gujarat", "latitude": 22.8100, "longitude": 69.5100},
    {"name": "Korba NTPC & Coalfield Fire Base", "state": "Chhattisgarh", "latitude": 22.3700, "longitude": 82.6900},
    {"name": "Western Ghats Forest Protection Camp", "state": "Kerala/TN", "latitude": 11.5200, "longitude": 76.4800},
    {"name": "National Disaster Response Force (NDRF 8th Bn Ghaziabad)", "state": "NCR", "latitude": 28.6700, "longitude": 77.4500},
    {"name": "NDRF 10th Battalion Vijayawada", "state": "Andhra Pradesh", "latitude": 16.5100, "longitude": 80.6400},
    {"name": "NDRF 2nd Battalion Kolkata", "state": "West Bengal", "latitude": 22.5800, "longitude": 88.4200},
]


def find_nearest_emergency_depot(latitude: float, longitude: float) -> Tuple[Dict[str, Any], float]:
    """Finds the geographically nearest emergency fire station / response depot."""
    target = {"latitude": latitude, "longitude": longitude}
    best_depot = EMERGENCY_DEPOTS[0]
    min_dist = float("inf")

    for depot in EMERGENCY_DEPOTS:
        d = distance_metres(target, {"latitude": depot["latitude"], "longitude": depot["longitude"]})
        if d < min_dist:
            min_dist = d
            best_depot = depot

    return best_depot, round(min_dist / 1000.0, 2)


def calculate_emergency_route(
    start_lat: float,
    start_lon: float,
    dest_lat: float,
    dest_lon: float,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Calls OpenRouteService API to compute the emergency driving route.
    Returns distance (km), duration (mins), GeoJSON coordinates [[lat, lon], ...], and steps.
    """
    effective_key = (
        api_key
        or os.getenv("ORS_API_KEY", "").strip()
        or os.getenv("OPENROUTE_MAP_KEY", "").strip()
    )

    # If no key or mock needed, generate realistic geodesic route
    if not effective_key or "your_" in effective_key:
        return _fallback_direct_route(start_lat, start_lon, dest_lat, dest_lon, "No ORS key provided")

    url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
    payload = {
        "coordinates": [
            [start_lon, start_lat],
            [dest_lon, dest_lat],
        ],
        "instructions": True,
        "units": "km",
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": effective_key,
                "Content-Type": "application/json",
                "Accept": "application/json, application/geo+json",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        features = data.get("features", [])
        if not features:
            return _fallback_direct_route(start_lat, start_lon, dest_lat, dest_lon, "Empty ORS response")

        feature = features[0]
        geometry = feature.get("geometry", {})
        raw_coords = geometry.get("coordinates", [])  # [[lon, lat], ...]
        # Convert to [[lat, lon], ...] for Leaflet
        lat_lon_coords = [[pt[1], pt[0]] for pt in raw_coords]

        properties = feature.get("properties", {})
        summary = properties.get("summary", {})
        segments = properties.get("segments", [])
        steps = segments[0].get("steps", []) if segments else []

        distance_km = round(summary.get("distance", 0.0), 2)
        duration_mins = round(summary.get("duration", 0.0) / 60.0, 1)

        return {
            "status": "success",
            "source": "OpenRouteService",
            "distance_km": distance_km,
            "duration_minutes": duration_mins,
            "coordinates": lat_lon_coords,
            "instructions": [
                {
                    "distance_km": round(s.get("distance", 0), 2),
                    "duration_mins": round(s.get("duration", 0) / 60.0, 1),
                    "instruction": s.get("instruction", ""),
                }
                for s in steps[:8]
            ],
        }

    except Exception as e:
        print(f"OpenRouteService error: {e}")
        return _fallback_direct_route(start_lat, start_lon, dest_lat, dest_lon, str(e))


def _fallback_direct_route(start_lat: float, start_lon: float, dest_lat: float, dest_lon: float, note: str) -> Dict[str, Any]:
    """Generates an estimated straight-line trajectory with intermediate waypoint steps."""
    dist_m = distance_metres({"latitude": start_lat, "longitude": start_lon}, {"latitude": dest_lat, "longitude": dest_lon})
    dist_km = round(dist_m / 1000.0, 2)
    # Estimate driving speed ~ 50 km/h
    duration_mins = round((dist_km / 50.0) * 60.0, 1)

    steps_count = 10
    coords = []
    for i in range(steps_count + 1):
        frac = i / float(steps_count)
        lat = start_lat + frac * (dest_lat - start_lat)
        lon = start_lon + frac * (dest_lon - start_lon)
        coords.append([round(lat, 5), round(lon, 5)])

    return {
        "status": "fallback",
        "source": "Geodesic Estimator",
        "note": note,
        "distance_km": dist_km,
        "duration_minutes": duration_mins,
        "coordinates": coords,
        "instructions": [
            {"distance_km": dist_km, "duration_mins": duration_mins, "instruction": f"Dispatch emergency response unit direct to ({dest_lat}, {dest_lon})"}
        ],
    }
