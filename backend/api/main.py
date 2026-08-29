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
    find_nearest_safety_resources,
    get_all_safety_resources,
    get_recommended_response_sop,
)
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
):
    """
    Returns incident response triage packet containing nearest Fire, Hospital, Police,
    Ambulance, and Shelter facilities, national emergency numbers (112), and classification SOPs.
    """
    nearest_map = find_nearest_safety_resources(latitude=lat, longitude=lon)
    sop = get_recommended_response_sop(classification=classification, risk_level="CRITICAL" if risk_score >= 80 else "HIGH", frp=frp)

    return {
        "event": {
            "classification": classification,
            "frp": frp,
            "risk_score": risk_score,
            "latitude": lat,
            "longitude": lon,
        },
        "nearest_resources": nearest_map,
        "emergency_contacts": {
            "national_emergency": "112",
            "fire_service": "101",
            "ambulance_service": "108",
            "police_control": "100",
            "disaster_management_helpline": "1078",
            "state_emergency_helpline": "1070",
        },
        "recommended_response": sop,
        "source_label": "DEMO SAFETY DATA (District Disaster Management Plans)",
        "is_demo": True,
    }


@app.get("/api/v1/facilities/{facility_id}/thermal-profile")
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
    return profile


@app.get("/map", include_in_schema=False)
def show_thermal_map():
    """Serves the interactive Leaflet GIS thermal map dashboard."""
    map_file = project_root / "frontend" / "thermal_map.html"
    return FileResponse(map_file)


@app.get("/api/v1/reports/{cluster_id}/dossier")
def download_dossier(
    cluster_id: str,
    mode: str = Query("auto", pattern="^(auto|live|demo)$"),
):
    """Generates an official inspection-ready PDF intelligence dossier for a target cluster."""
    classified_hotspots, _, _, _ = _get_active_hotspots(mode=mode)
    clusters = build_persistent_clusters(classified_hotspots)

    matching_cluster = next(
        (cluster for cluster in clusters if cluster["cluster_id"] == cluster_id),
        None,
    )

    # If not found in current dataset, check demo dataset as fallback
    if matching_cluster is None and mode != "demo":
        demo_hotspots = classify_hotspots(generate_hotspots())
        demo_clusters = build_persistent_clusters(demo_hotspots)
        matching_cluster = next(
            (cluster for cluster in demo_clusters if cluster["cluster_id"] == cluster_id),
            None,
        )
        if matching_cluster:
            classified_hotspots = demo_hotspots

    if matching_cluster is None:
        raise HTTPException(status_code=404, detail=f"Cluster '{cluster_id}' not found")

    facility_history = [
        hotspot
        for hotspot in classified_hotspots
        if hotspot.get("facility_name") == matching_cluster["facility_name"]
    ]
    if not facility_history:
        facility_history = [matching_cluster]

    all_alerts = detect_anomalies(classified_hotspots)
    facility_alerts = [
        alert
        for alert in all_alerts
        if alert.get("facility_name") == matching_cluster["facility_name"]
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
