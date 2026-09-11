from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.responses import FileResponse, Response

from backend.analytics.anomaly_detector import detect_anomalies
from backend.analytics.classifier import classify_hotspots
from backend.analytics.clusters import build_persistent_clusters
from backend.analytics.st_clustering import cluster_hotspots
from backend.ingestion.demo_data import generate_hotspots
from backend.ingestion.fsi_demo_data import (
    generate_fsi_demo_data,
    generate_fsi_ffdr_grid,
)
from backend.ingestion.firms_client import (
    VALID_SOURCES,
    fetch_firms_hotspots,
    firms_cache,
)
from backend.analytics.routing import (
    calculate_emergency_route,
    find_nearest_emergency_depot,
)
from backend.analytics.safety_infrastructure import (
    fetch_osm_safety_facilities,
    find_nearest_safety_resources,
    get_all_safety_resources,
    get_recommended_response_sop,
)
from backend.analytics.facility_registry import KNOWN_FACILITIES
from backend.analytics.spatial import distance_metres
from backend.analytics.thermal_fingerprint import build_facility_thermal_profile
from backend.reports.dossier_generator import generate_dossier

# Load environment variables from .env file if available
project_root = Path(__file__).resolve().parents[2]
load_dotenv(project_root / ".env", override=True)
load_dotenv(override=True)

app = FastAPI(
    title="ThermalWatch API",
    description="AI-assisted thermal intelligence platform for industrial fire and emission anomaly detection (SIH26162).",
    version="1.0.0",
)


def _mask_key(key: Optional[str]) -> Optional[str]:
    if not key:
        return None
    cleaned = key.strip().strip('"').strip("'")
    if "your_" in cleaned.lower() or "placeholder" in cleaned.lower():
        return "[PLACEHOLDER_KEY_NOT_SET]"
    if len(cleaned) <= 8:
        return "****"
    return f"{cleaned[:4]}...{cleaned[-4:]}"


def _get_active_hotspots(
    mode: str = "auto",
    bbox: Optional[str] = None,
    country: Optional[str] = None,
    days: int = 3,
    source: str = "VIIRS_SNPP_NRT",
    map_key: Optional[str] = None,
    force_refresh: bool = False,
) -> Tuple[List[Dict[str, Any]], str, Optional[str], Dict[str, Any]]:
    """
    Resolves hotspots based on requested mode (auto, live, demo).
    Returns: (classified_hotspots, resolved_mode, notice, metadata)
    """
    if mode == "demo":
        raw_hotspots = generate_hotspots()
        return (
            classify_hotspots(raw_hotspots),
            "demo",
            "Operating on offline simulated demo dataset.",
            {"cached": False, "source": "simulated", "count": len(raw_hotspots)},
        )

    # For 'live' or 'auto'
    load_dotenv(project_root / ".env", override=True)
    raw_key = map_key or os.getenv("FIRMS_MAP_KEY", "")
    effective_key = raw_key.strip().strip('"').strip("'")
    if not effective_key:
        if mode == "live":
            raise HTTPException(
                status_code=400,
                detail="FIRMS_MAP_KEY is not configured. Provide it via query param, header X-FIRMS-KEY, or .env file.",
            )
        raw_hotspots = generate_hotspots()
        return (
            classify_hotspots(raw_hotspots),
            "demo-fallback",
            "FIRMS_MAP_KEY not set. Displaying simulated offline reference data.",
            {"cached": False, "source": "demo_fallback", "count": len(raw_hotspots)},
        )

    try:
        raw_hotspots, meta = fetch_firms_hotspots(
            bbox=bbox or os.getenv("FIRMS_BBOX"),
            country=country or os.getenv("FIRMS_COUNTRY"),
            days=days,
            source=source,
            map_key=effective_key,
            force_refresh=force_refresh,
        )
        resolved_mode = "cached" if meta.get("cached") else "live"
        notice = (
            f"Retrieved {len(raw_hotspots)} satellite detections from NASA FIRMS ({meta.get('source')}). "
            f"{'Served from cache.' if meta.get('cached') else 'Fresh satellite feed.'}"
        )
        return classify_hotspots(raw_hotspots), resolved_mode, notice, meta
    except Exception as e:
        if mode == "live":
            raise HTTPException(
                status_code=502,
                detail=f"Error communicating with NASA FIRMS: {str(e)}",
            )
        # In auto mode, fallback to demo data gracefully
        raw_hotspots = generate_hotspots()
        return (
            classify_hotspots(raw_hotspots),
            "demo-fallback",
            f"Live FIRMS fetch failed ({str(e)}). Displaying simulated reference data.",
            {"cached": False, "source": "demo_fallback", "count": len(raw_hotspots), "error": str(e)},
        )


@app.get("/")
def home():
    return {
        "project": "ThermalWatch",
        "description": "AI-Assisted Thermal Intelligence Platform (SIH26162)",
        "status": "Backend running",
        "endpoints": {
            "map_dashboard": "/map",
            "live_data": "/api/v1/live-data",
            "demo_data": "/api/v1/demo/offline-data",
            "firms_status": "/api/v1/firms/status",
            "persistent_clusters": "/api/v1/clusters/persistent",
            "spatiotemporal_clusters": "/api/v1/clusters/spatiotemporal",
            "alerts": "/api/v1/alerts",
        },
    }


@app.get("/health")
def health_check():
    load_dotenv(project_root / ".env", override=True)
    return {
        "status": "ok",
        "firms_key_configured": bool(os.getenv("FIRMS_MAP_KEY")),
    }


@app.get("/api/v1/firms/status")
def firms_status():
    """Returns NASA FIRMS integration parameters and current cache status."""
    load_dotenv(project_root / ".env", override=True)
    key = os.getenv("FIRMS_MAP_KEY")
    return {
        "configured": bool(key),
        "masked_key": _mask_key(key),
        "default_country": os.getenv("FIRMS_COUNTRY", "IND"),
        "default_bbox": os.getenv("FIRMS_BBOX", "68.1,6.7,97.4,35.5"),
        "default_source": os.getenv("FIRMS_SOURCE", "VIIRS_SNPP_NRT"),
        "cache_ttl_seconds": int(os.getenv("FIRMS_CACHE_TTL_SECONDS", "900")),
        "supported_sources": list(VALID_SOURCES),
        "preset_regions": {
            "India_National": "68.1,6.7,97.4,35.5",
            "Jamnagar_Refinery_Hub": "69.5,22.0,71.0,23.0",
            "NCR_Industrial_Belt": "76.5,28.2,77.8,29.0",
            "Odisha_Jharkhand_Steel_Belt": "84.0,21.5,87.0,24.0",
        },
    }


@app.post("/api/v1/firms/cache/clear")
def clear_cache():
    """Purges cached FIRMS satellite responses."""
    deleted_files = firms_cache.clear()
    return {"status": "success", "cleared_entries": deleted_files}


@app.get("/api/v1/live-data")
def get_live_data(
    bbox: Optional[str] = Query(None, description="Bounding box: min_lon,min_lat,max_lon,max_lat"),
    country: Optional[str] = Query(None, description="ISO3 country code (e.g. IND)"),
    days: int = Query(3, ge=1, le=5, description="Acquisition days window (1-5)"),
    source: str = Query("VIIRS_SNPP_NRT", description="Satellite sensor source"),
    mode: str = Query("auto", pattern="^(auto|live|demo)$", description="Data retrieval mode"),
    force_refresh: bool = Query(False, description="Bypass cache and force direct NASA query"),
    x_firms_key: Optional[str] = Header(None, alias="X-FIRMS-KEY"),
):
    """
    Ingests and classifies thermal hotspots from NASA FIRMS.
    Falls back gracefully to demo data if the API key is unconfigured or rate-limited.
    """
    classified_hotspots, resolved_mode, notice, meta = _get_active_hotspots(
        mode=mode,
        bbox=bbox,
        country=country,
        days=days,
        source=source,
        map_key=x_firms_key,
        force_refresh=force_refresh,
    )

    return {
        "mode": resolved_mode,
        "notice": notice,
        "query": {
            "bbox": bbox or os.getenv("FIRMS_BBOX"),
            "country": country or os.getenv("FIRMS_COUNTRY"),
            "days": days,
            "source": source,
        },
        "metadata": meta,
        "total_hotspots": len(classified_hotspots),
        "hotspots": classified_hotspots,
    }


@app.get("/api/v1/demo/offline-data")
def get_offline_data():
    """Returns static offline simulated demo data for predictable presentations."""
    hotspots = generate_hotspots()
    classified_hotspots = classify_hotspots(hotspots)

    return {
        "mode": "demo",
        "total_hotspots": len(classified_hotspots),
        "hotspots": classified_hotspots,
    }


@app.get("/api/v1/clusters/persistent")
def get_persistent_clusters(
    mode: str = Query("auto", pattern="^(auto|live|demo)$"),
    days: int = Query(3, ge=1, le=5),
    source: str = Query("VIIRS_SNPP_NRT"),
):
    """Extracts persistent industrial heat clusters from satellite hotspots."""
    classified_hotspots, resolved_mode, _, _ = _get_active_hotspots(mode=mode, days=days, source=source)
    clusters = build_persistent_clusters(classified_hotspots)

    return {
        "mode": resolved_mode,
        "total_clusters": len(clusters),
        "clusters": clusters,
    }


@app.get("/api/v1/alerts")
def get_alerts(
    mode: str = Query("auto", pattern="^(auto|live|demo)$"),
    days: int = Query(3, ge=1, le=5),
    source: str = Query("VIIRS_SNPP_NRT"),
):
    """Detects statistical and intensity anomalies in thermal signatures."""
    classified_hotspots, resolved_mode, _, _ = _get_active_hotspots(mode=mode, days=days, source=source)
    alerts = detect_anomalies(classified_hotspots)

    return {
        "mode": resolved_mode,
        "total_alerts": len(alerts),
        "alerts": alerts,
    }


@app.get("/api/v1/clusters/spatiotemporal")
def get_spatiotemporal_clusters(
    mode: str = Query("auto", pattern="^(auto|live|demo)$"),
    radius_meters: int = Query(2500, ge=500, le=50000),
    time_window_days: int = Query(30, ge=1, le=90),
):
    """Performs spatiotemporal clustering over thermal detections."""
    classified_hotspots, resolved_mode, _, _ = _get_active_hotspots(mode=mode)
    clusters = cluster_hotspots(
        classified_hotspots,
        radius_metres=radius_meters,
        time_window_days=time_window_days,
    )

    return {
        "mode": resolved_mode,
        "total_clusters": len(clusters),
        "clusters": clusters,
    }


@app.get("/api/v1/routing/emergency-route")
def get_emergency_route(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Target hotspot latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Target hotspot longitude"),
    start_lat: Optional[float] = Query(None, description="Optional custom dispatch station latitude"),
    start_lon: Optional[float] = Query(None, description="Optional custom dispatch station longitude"),
):
    """
    Computes emergency response road driving route from the nearest
    fire station/depot to the thermal anomaly coordinates using OpenRouteService.
    """
    if start_lat is not None and start_lon is not None:
        origin = {"name": "Custom Incident Command Unit", "latitude": start_lat, "longitude": start_lon}
        origin_dist = 0.0
    else:
        origin, origin_dist = find_nearest_emergency_depot(lat, lon)

    route_data = calculate_emergency_route(
        start_lat=origin["latitude"],
        start_lon=origin["longitude"],
        dest_lat=lat,
        dest_lon=lon,
    )

    return {
        "origin_depot": origin,
        "target_coords": {"latitude": lat, "longitude": lon},
        "route": route_data,
    }


@app.get("/api/v1/fsi/forest-fires")
def get_fsi_forest_fires(
    mode: str = Query("auto", pattern="^(auto|live|demo)$"),
    state: Optional[str] = Query(None, description="Filter by Indian State"),
    danger_level: Optional[str] = Query(None, description="Filter by Fire Danger Level (EXTREME, HIGH, MODERATE, LOW)"),
):
    """
    Ingests Forest Survey of India (FSI) forest fire alerts and danger intelligence.
    Fallback hierarchy: Live FSI -> if unavailable -> Demo FSI with clear labeling.
    """
    fsi_records = []
    resolved_mode = mode
    is_demo = False
    notice = ""

    if mode == "live":
        # Check if live FSI feed / key is configured
        fsi_key = os.getenv("FSI_API_KEY", "").strip()
        if not fsi_key:
            raise HTTPException(
                status_code=503,
                detail="Live FSI API feed is currently not configured. Use mode=auto for automatic fallback or mode=demo.",
            )
        fsi_records = []
        resolved_mode = "live"
        is_demo = False
        notice = "Live Forest Survey of India (FSI) Van Agni feed."

    if not fsi_records:
        # Fallback to deterministic FSI demo dataset
        fsi_records = generate_fsi_demo_data()
        resolved_mode = "demo"
        is_demo = True
        notice = "DEMO DATA — Simulated Forest Survey of India (FSI) Wildfire Intelligence"

    # Apply filters if requested
    if state:
        fsi_records = [r for r in fsi_records if r.get("state", "").lower() == state.lower()]
    if danger_level:
        fsi_records = [r for r in fsi_records if r.get("fire_danger_level", "").upper() == danger_level.upper()]

    # Run through classification and anomaly detection to integrate with analytics engine
    classified_fsi = classify_hotspots(fsi_records)
    alerts = detect_anomalies(classified_fsi)
    clusters = build_persistent_clusters(classified_fsi)

    return {
        "mode": resolved_mode,
        "source": "DEMO_FSI" if is_demo else "FSI_LIVE",
        "is_demo": is_demo,
        "notice": notice,
        "total_records": len(classified_fsi),
        "large_forest_fires_count": sum(1 for r in classified_fsi if r.get("large_forest_fire")),
        "hotspots": classified_fsi,
        "alerts": alerts,
        "clusters": clusters,
    }


@app.get("/api/v1/fsi/ffdr-grid")
def get_fsi_ffdr_grid(
    state: Optional[str] = Query(None, description="Filter grid by Indian state"),
    risk_level: Optional[str] = Query(None, description="Filter grid by risk level (Extreme, Very High, High, Moderate, Low)"),
):
    """
    Returns Forest Survey of India (FSI) 5km x 5km Forest Fire Danger Rating (FFDR) GeoJSON grid.
    Categories: Extreme (Red), Very High (Red-Orange), High (Orange), Moderate (Yellow), Low (Green).
    """
    geojson = generate_fsi_ffdr_grid()
    features = geojson.get("features", [])

    if state:
        features = [f for f in features if f["properties"].get("state", "").lower() == state.lower()]
    if risk_level:
        features = [f for f in features if f["properties"].get("risk_level", "").lower() == risk_level.lower()]

    geojson["features"] = features
    geojson["metadata"]["total_grids"] = len(features)
    return geojson


@app.get("/api/v1/safety/resources")
def get_safety_resources(
    resource_type: Optional[str] = Query(None, description="Filter by type: fire_station, hospital, police, ambulance, shelter"),
    state: Optional[str] = Query(None, description="Filter by Indian State"),
):
    """Returns all registered emergency response and safety infrastructure resources."""
    resources = get_all_safety_resources(resource_type=resource_type, state=state)
    return {
        "total_resources": len(resources),
        "resources": resources,
    }


@app.get("/api/v1/safety/nearest")
def get_nearest_safety_resources(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Event latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Event longitude"),
    classification: str = Query("UNCLASSIFIED", description="Thermal classification class"),
    frp: float = Query(25.0, description="Radiative Power (MW)"),
    risk_score: float = Query(50.0, description="Risk Score (0-100)"),
    radius_km: float = Query(10.0, ge=1.0, le=100.0, description="Search radius in kilometers (5-10 km default)"),
):
    """
    Returns incident response triage packet containing nearest Fire, Hospital, Police,
    Ambulance, and Shelter facilities from live OpenStreetMap Overpass data, sorted by distance,
    with national emergency numbers (112) and classification SOPs.
    """
    osm_result = fetch_osm_safety_facilities(latitude=lat, longitude=lon, radius_km=radius_km)
    nearest_map = osm_result.get("nearest_by_type", {})
    facilities_list = osm_result.get("facilities", [])
    sop = get_recommended_response_sop(classification=classification, risk_level="CRITICAL" if risk_score >= 80 else "HIGH", frp=frp)

    return {
        "site_name": osm_result.get("site_name"),
        "event": {
            "classification": classification,
            "frp": frp,
            "risk_score": risk_score,
            "latitude": lat,
            "longitude": lon,
        },
        "search_radius_km": osm_result.get("search_radius_km", radius_km),
        "auto_expanded": osm_result.get("auto_expanded", False),
        "total_facilities": len(facilities_list),
        "facilities": facilities_list,
        "nearest_resources": nearest_map,
        "nearest": nearest_map,
        "emergency_contacts": {
            "national_emergency": "112",
            "fire_service": "101",
            "ambulance_service": "108",
            "police_control": "100",
            "disaster_management_helpline": "1078",
            "state_emergency_helpline": "1070",
        },
        "recommended_response": sop,
        "source_label": "OpenStreetMap Overpass API & District Disaster Management Registry",
        "is_demo": False,
    }


@app.get("/api/v1/facilities/thermal-profile")
def get_facility_thermal_profile_query(
    facility_id: str = Query(..., description="Facility name, ID, or coordinates"),
    mode: str = Query("auto", pattern="^(auto|live|demo)$"),
    source: str = Query("VIIRS_SNPP_NRT"),
    days: int = Query(3, ge=1, le=5),
):
    """
    Computes an empirical 30-day thermal fingerprint for an identifiable facility via query parameter.
    """
    classified_hotspots, resolved_mode, is_demo, _ = _get_active_hotspots(mode=mode, days=days, source=source)
    profile = build_facility_thermal_profile(
        facility_identifier=facility_id,
        hotspots=classified_hotspots,
        is_demo=is_demo,
    )
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail=f"Facility '{facility_id}' not found in registry and has no recorded satellite detections.",
        )
    return profile


@app.get("/api/v1/facilities/{facility_id:path}/thermal-profile")
def get_facility_thermal_profile(
    facility_id: str,
    mode: str = Query("auto", pattern="^(auto|live|demo)$"),
    source: str = Query("VIIRS_SNPP_NRT"),
    days: int = Query(3, ge=1, le=5),
):
    """
    Computes an empirical 30-day thermal fingerprint for an identifiable facility.
    Evaluates historical mean, standard deviation, Z-score excursion, anomaly frequency,
    and returns a full historical trend time series.
    """
    classified_hotspots, resolved_mode, is_demo, _ = _get_active_hotspots(mode=mode, days=days, source=source)
    profile = build_facility_thermal_profile(
        facility_identifier=facility_id,
        hotspots=classified_hotspots,
        is_demo=is_demo,
    )
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail=f"Facility '{facility_id}' not found in registry and has no recorded satellite detections.",
        )
    return profile


@app.get("/map", include_in_schema=False)
def show_thermal_map():
    """Serves the interactive Leaflet GIS thermal map dashboard."""
    map_file = project_root / "frontend" / "thermal_map.html"
    return FileResponse(map_file)


def _resolve_cluster_or_target(
    cluster_id: str,
    hotspots: List[Dict[str, Any]],
    clusters: List[Dict[str, Any]],
) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Resolves a target cluster, hotspot, facility, or coordinate pair for dossier generation.
    Returns: (target_cluster_dict, relevant_hotspot_history)
    """
    clean_target = cluster_id.strip()
    norm_target = (
        clean_target.lower()
        .replace(" ", "-")
        .replace("(", "")
        .replace(")", "")
        .replace(",", "")
    )

    # 1. Exact match in clusters by cluster_id
    for cluster in clusters:
        cid = str(cluster.get("cluster_id", ""))
        if cid == clean_target or cid == norm_target or cid.lower() == clean_target.lower():
            fac_name = cluster.get("facility_name")
            history = [h for h in hotspots if h.get("facility_name") == fac_name]
            return cluster, history

    # 2. Case-insensitive facility_name match in clusters
    for cluster in clusters:
        fac_name = str(cluster.get("facility_name", "")).lower()
        if fac_name and (fac_name == clean_target.lower() or norm_target in fac_name.replace(" ", "-")):
            history = [h for h in hotspots if h.get("facility_name") == cluster.get("facility_name")]
            return cluster, history

    # 3. Direct match on hotspot ID (e.g., 'firms-58', 'jamnagar-refinery-day-00')
    target_hotspot = next(
        (h for h in hotspots if str(h.get("id", "")).lower() == clean_target.lower()),
        None,
    )
    if target_hotspot:
        fac_name = target_hotspot.get("facility_name")
        # If this hotspot belongs to a known cluster in this dataset, return that cluster
        if fac_name:
            matching_cluster = next((c for c in clusters if c.get("facility_name") == fac_name), None)
            if matching_cluster:
                history = [h for h in hotspots if h.get("facility_name") == fac_name]
                return matching_cluster, history

        # Otherwise synthesize a cluster record directly from the hotspot
        display_name = (
            fac_name
            or target_hotspot.get("facility_category")
            or target_hotspot.get("land_context")
            or target_hotspot.get("forest_name")
            or f"Thermal Target ({round(float(target_hotspot.get('latitude', 0.0)), 3)}, {round(float(target_hotspot.get('longitude', 0.0)), 3)})"
        )
        frp_val = round(float(target_hotspot.get("frp") or 0.0), 2)
        synthesized_cluster = {
            "cluster_id": str(target_hotspot.get("id", clean_target)),
            "facility_name": display_name,
            "classification": target_hotspot.get("classification", "UNCLASSIFIED"),
            "confidence_level": target_hotspot.get("confidence_level") or target_hotspot.get("confidence", "HIGH"),
            "explanation": target_hotspot.get("explanation") or f"Operational thermal detection recorded at {display_name}.",
            "reasons": target_hotspot.get("reasons") or [target_hotspot.get("explanation", "Satellite thermal detection")],
            "latitude": target_hotspot.get("latitude"),
            "longitude": target_hotspot.get("longitude"),
            "active_days": target_hotspot.get("active_days", 1),
            "detection_count": 1,
            "mean_frp": frp_val,
            "peak_frp": frp_val,
            "risk_score": round(float(target_hotspot.get("risk_score", 50.0)), 1),
            "risk_level": target_hotspot.get("risk_level", "MEDIUM"),
            "risk_breakdown": target_hotspot.get("risk_breakdown", {}),
            "risk_explanation": target_hotspot.get("risk_explanation", ""),
            "frp": frp_val,
        }
        history = [h for h in hotspots if fac_name and h.get("facility_name") == fac_name]
        if not history:
            history = [target_hotspot]
        return synthesized_cluster, history

    # 4. Coordinate match (e.g., '22.47,70.06')
    if "," in clean_target:
        try:
            parts = [float(p.strip()) for p in clean_target.split(",")]
            if len(parts) == 2:
                target_pt = {"latitude": parts[0], "longitude": parts[1]}
                # Try finding closest cluster within 15km
                closest_cluster = None
                min_c_dist = float("inf")
                for c in clusters:
                    d = distance_metres(target_pt, {"latitude": c["latitude"], "longitude": c["longitude"]})
                    if d < min_c_dist and d <= 15000:
                        min_c_dist = d
                        closest_cluster = c
                if closest_cluster:
                    fac_name = closest_cluster.get("facility_name")
                    history = [h for h in hotspots if h.get("facility_name") == fac_name]
                    return closest_cluster, history

                # Try finding closest hotspot within 15km
                closest_h = None
                min_h_dist = float("inf")
                for h in hotspots:
                    d = distance_metres(target_pt, {"latitude": h["latitude"], "longitude": h["longitude"]})
                    if d < min_h_dist and d <= 15000:
                        min_h_dist = d
                        closest_h = h
                if closest_h:
                    return _resolve_cluster_or_target(str(closest_h.get("id")), hotspots, clusters)
        except Exception:
            pass

    # 5. Check known facilities registry
    for fac in KNOWN_FACILITIES:
        fac_id = fac.get("facility_id", "").lower().strip()
        fac_name = fac.get("name", "").lower().strip()
        if fac_id == clean_target.lower() or fac_name == clean_target.lower() or norm_target in fac_id:
            matched_cluster = next((c for c in clusters if (c.get("facility_name") or "").lower() == fac_name), None)
            if matched_cluster:
                history = [h for h in hotspots if h.get("facility_name") == matched_cluster.get("facility_name")]
                return matched_cluster, history
            fac_hotspots = [h for h in hotspots if (h.get("facility_name") or "").lower() == fac_name]
            mean_f = round(sum(float(h.get("frp", 0.0)) for h in fac_hotspots) / len(fac_hotspots), 2) if fac_hotspots else 25.0
            peak_f = max((float(h.get("frp", 0.0)) for h in fac_hotspots), default=25.0)
            synthesized_cluster = {
                "cluster_id": fac.get("facility_id", clean_target),
                "facility_name": fac.get("name", clean_target),
                "classification": "PERSISTENT_INDUSTRIAL",
                "confidence_level": "HIGH",
                "explanation": f"Registered facility profile for {fac.get('name')}.",
                "reasons": [f"Known registered facility in {fac.get('state', 'India')}"],
                "latitude": fac.get("latitude"),
                "longitude": fac.get("longitude"),
                "active_days": max(1, len(fac_hotspots)),
                "detection_count": max(1, len(fac_hotspots)),
                "mean_frp": mean_f,
                "peak_frp": peak_f,
                "risk_score": 50.0,
                "risk_level": "MEDIUM",
                "frp": mean_f,
            }
            return synthesized_cluster, fac_hotspots

    return None, []


@app.get("/api/v1/reports/{cluster_id}/dossier")
def download_dossier(
    cluster_id: str,
    mode: str = Query("auto", pattern="^(auto|live|demo)$"),
):
    """Generates an official inspection-ready PDF intelligence dossier for a target cluster or hotspot."""
    classified_hotspots, _, _, _ = _get_active_hotspots(mode=mode)
    clusters = build_persistent_clusters(classified_hotspots)

    matching_cluster, facility_history = _resolve_cluster_or_target(
        cluster_id, classified_hotspots, clusters
    )

    # If not found in current dataset, check fallback dataset (auto if demo, demo if auto/live)
    if matching_cluster is None:
        fallback_mode = "auto" if mode == "demo" else "demo"
        fallback_hotspots, _, _, _ = _get_active_hotspots(mode=fallback_mode)
        fallback_clusters = build_persistent_clusters(fallback_hotspots)
        matching_cluster, facility_history = _resolve_cluster_or_target(
            cluster_id, fallback_hotspots, fallback_clusters
        )
        if matching_cluster:
            classified_hotspots = fallback_hotspots

    if matching_cluster is None:
        raise HTTPException(status_code=404, detail=f"Cluster '{cluster_id}' not found")

    if not facility_history:
        facility_history = [matching_cluster]

    all_alerts = detect_anomalies(classified_hotspots)
    facility_alerts = [
        alert
        for alert in all_alerts
        if alert.get("facility_name") == matching_cluster.get("facility_name")
        or str(alert.get("id")) == cluster_id
    ]

    pdf = generate_dossier(
        matching_cluster,
        facility_history,
        facility_alerts,
    )

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{cluster_id}-dossier.pdf"'},
    )
