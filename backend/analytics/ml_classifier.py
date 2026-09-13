"""
Production ML inference utilities for OTIP.

The production model is trained on 21 FIRMS-derived source-level features.
Live FIRMS observations are normalized and aggregated into the same 0.005-degree
spatial cells used by the historical weak-label pipeline before inference.

Facility/context fields are never used as ML inputs.
"""

from __future__ import annotations

import math
import pickle
from collections import defaultdict
from pathlib import Path
from statistics import mean
from typing import Any, Dict, Iterable, List, Tuple

from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction import DictVectorizer
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MODEL_PATH = PROJECT_ROOT / "data" / "models" / "otip_xgboost_source_model.pkl"
GRID_SIZE = 0.005

XGBOOST_FEATURES = [
    "observation_count",
    "active_days",
    "night_ratio",
    "mean_frp",
    "median_frp",
    "max_frp",
    "std_frp",
    "mean_brightness",
    "max_brightness",
    "mean_bright_t31",
    "mean_brightness_delta",
    "mean_scan",
    "mean_track",
    "mean_frp_density",
    "max_frp_density",
    "frp_cv",
    "peak_to_median_frp",
    "high_frp_ratio",
    "observation_density",
    "std_brightness_delta",
    "night_day_frp_ratio",
]

XGBOOST_LABELS = [
    "GAS_FLARE",
    "MINING_ACTIVITY",
    "PERSISTENT_INDUSTRIAL",
]

CONFIDENCE_MAP = {
    "low": 0.0,
    "nominal": 0.5,
    "nominal/high": 0.75,
    "high": 1.0,
}

ML_SUPPORTED_DETERMINISTIC_CLASSES = {
    "GAS_FLARE",
    "MINING_ACTIVITY",
    "PERSISTENT_INDUSTRIAL",
    "INDUSTRIAL_FIRE",
}

# The deterministic OTIP classifier is the operational classification layer.
# XGBoost is secondary evidence and is explicitly marked when it disagrees.


def _ml_status(deterministic_class: str, ml_class: str | None) -> str:
    """Return an auditable consistency status for the secondary ML signal."""
    if deterministic_class not in ML_SUPPORTED_DETERMINISTIC_CLASSES:
        return "NOT_APPLICABLE"
    if not ml_class or ml_class == "NOT_APPLICABLE":
        return "NOT_APPLICABLE"

    if deterministic_class == "INDUSTRIAL_FIRE":
        # Industrial fire is an event class; any industrial-source ML class is
        # supporting evidence rather than a requirement to agree exactly.
        return (
            "CONSISTENT"
            if ml_class in {"GAS_FLARE", "MINING_ACTIVITY", "PERSISTENT_INDUSTRIAL"}
            else "INCONSISTENT"
        )

    return "CONSISTENT" if ml_class == deterministic_class else "INCONSISTENT"


def extract_ml_features(hotspot: Dict[str, Any]) -> Dict[str, Any]:
    """Extract independent FIRMS/sensor features for an individual observation."""
    frp = float(hotspot.get("frp") or 0.0)
    brightness = float(hotspot.get("brightness") or 0.0)
    bright_t31 = float(hotspot.get("bright_t31") or 0.0)
    scan = float(hotspot.get("scan") or 0.0)
    track = float(hotspot.get("track") or 0.0)

    return {
        "frp": frp,
        "brightness": brightness,
        "bright_t31": bright_t31,
        "brightness_delta": brightness - bright_t31,
        "scan": scan,
        "track": track,
        "frp_density": frp / max(scan * track, 0.01),
        "confidence_score": CONFIDENCE_MAP.get(
            str(hotspot.get("confidence") or "").lower(), 0.0
        ),
        "day_night": str(
            hotspot.get("daynight") or hotspot.get("day_night") or "UNKNOWN"
        ),
        "satellite": str(hotspot.get("satellite") or "UNKNOWN"),
        "sensor": str(
            hotspot.get("sensor") or hotspot.get("instrument") or "UNKNOWN"
        ),
    }


def extract_source_ml_features(source: Dict[str, Any]) -> Dict[str, Any]:
    """Extract the exact 21 production source-level features."""
    return {
        feature: float(source.get(feature) or 0.0)
        for feature in XGBOOST_FEATURES
    }


class OTIPSourceMLModel:
    """XGBoost wrapper used for OTIP source classification."""

    def __init__(self, random_state: int = 26162) -> None:
        self.vectorizer = DictVectorizer(sparse=False)
        self.model = XGBClassifier(
            n_estimators=400,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=2,
            objective="multi:softprob",
            eval_metric="mlogloss",
            random_state=random_state,
            n_jobs=-1,
        )
        self.label_encoder = LabelEncoder()
        self.classes_: List[str] = []
        self.feature_names_: List[str] = []

    @staticmethod
    def _extract_feature_rows(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not records:
            return []
        if "mean_frp" in records[0]:
            return [extract_source_ml_features(record) for record in records]
        return [extract_ml_features(record) for record in records]

    def fit(self, hotspots: Iterable[Dict[str, Any]]) -> "OTIPSourceMLModel":
        records = list(hotspots)
        if not records:
            raise ValueError("Cannot train ML model on an empty dataset")

        labels = [record.get("label") for record in records]
        if any(not label for label in labels):
            raise ValueError("Every training record must contain label")

        feature_rows = self._extract_feature_rows(records)
        matrix = self.vectorizer.fit_transform(feature_rows)
        encoded_labels = self.label_encoder.fit_transform(labels)

        self.model.set_params(num_class=len(self.label_encoder.classes_))
        self.model.fit(matrix, encoded_labels)

        self.classes_ = [str(value) for value in self.label_encoder.classes_]
        self.feature_names_ = list(self.vectorizer.get_feature_names_out())
        return self

    def predict(self, hotspots: Iterable[Dict[str, Any]]) -> List[str]:
        records = list(hotspots)
        if not records:
            return []

        matrix = self.vectorizer.transform(self._extract_feature_rows(records))
        encoded_predictions = self.model.predict(matrix)
        return [
            str(value)
            for value in self.label_encoder.inverse_transform(
                encoded_predictions.astype(int)
            )
        ]

    def predict_with_confidence(
        self, hotspots: Iterable[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        records = list(hotspots)
        if not records:
            return []

        matrix = self.vectorizer.transform(self._extract_feature_rows(records))
        probabilities = self.model.predict_proba(matrix)
        encoded_predictions = self.model.predict(matrix)
        predictions = self.label_encoder.inverse_transform(
            encoded_predictions.astype(int)
        )

        return [
            {
                "predicted_class": str(prediction),
                "confidence": float(probability.max()),
            }
            for prediction, probability in zip(predictions, probabilities)
        ]


def load_model(path: str | Path = DEFAULT_MODEL_PATH) -> OTIPSourceMLModel:
    """Load and validate a previously trained OTIP production model."""
    model_path = Path(path)
    if not model_path.exists():
        raise FileNotFoundError(f"Production model not found: {model_path}")

    with model_path.open("rb") as file:
        model = pickle.load(file)

    if not isinstance(model, OTIPSourceMLModel):
        raise TypeError(
            f"Unexpected production model type: {type(model).__name__}"
        )

    if len(getattr(model, "feature_names_", [])) != len(XGBOOST_FEATURES):
        raise TypeError(
            "Production model feature contract mismatch: "
            f"expected {len(XGBOOST_FEATURES)}, "
            f"found {len(getattr(model, 'feature_names_', []))}"
        )

    return model


def _cell_id(latitude: float, longitude: float) -> str:
    """Match the historical weak-label grid exactly."""
    return f"grid:{int(latitude / GRID_SIZE)}:{int(longitude / GRID_SIZE)}"


def _float(record: Dict[str, Any], *names: str) -> float:
    for name in names:
        value = record.get(name)
        if value not in (None, ""):
            try:
                return float(value)
            except (TypeError, ValueError):
                pass
    return 0.0


def _normalize_live_record(hotspot: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize firms_client.py output back to the historical FIRMS schema.

    firms_client.py retains the original NASA row in `raw`, so brightness,
    bright_t31, scan, track and daynight are recovered without changing the
    ingestion contract.
    """
    raw = hotspot.get("raw") or {}

    latitude = _float(hotspot, "latitude")
    longitude = _float(hotspot, "longitude")

    brightness = _float(raw, "brightness", "bright_ti4")
    bright_t31 = _float(raw, "bright_t31")
    scan = _float(raw, "scan")
    track = _float(raw, "track")
    frp = _float(hotspot, "frp") or _float(raw, "frp")

    daynight = str(
        raw.get("daynight")
        or hotspot.get("day_night")
        or "UNKNOWN"
    ).upper()

    acq_date = str(raw.get("acq_date") or "")
    return {
        "id": hotspot.get("id"),
        "latitude": latitude,
        "longitude": longitude,
        "brightness": brightness,
        "bright_t31": bright_t31,
        "scan": scan,
        "track": track,
        "frp": frp,
        "daynight": daynight,
        "acq_date": acq_date,
        "cell_id": _cell_id(latitude, longitude),
    }


def aggregate_live_source_records(
    hotspots: Iterable[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Aggregate live FIRMS observations using the same statistics as training.

    Each output record represents one 0.005-degree spatial source.
    """
    normalized = [_normalize_live_record(hotspot) for hotspot in hotspots]
    grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

    for record in normalized:
        grouped[record["cell_id"]].append(record)

    aggregated: List[Dict[str, Any]] = []

    for cell_id, records in grouped.items():
        def values(field: str) -> List[float]:
            return [float(record.get(field) or 0.0) for record in records]

        frps = values("frp")
        brightness = values("brightness")
        bright_t31 = values("bright_t31")
        scans = values("scan")
        tracks = values("track")
        latitudes = values("latitude")
        longitudes = values("longitude")

        def avg(items: List[float]) -> float:
            return mean(items) if items else 0.0

        def std(items: List[float]) -> float:
            if len(items) < 2:
                return 0.0
            m = avg(items)
            return math.sqrt(sum((value - m) ** 2 for value in items) / len(items))

        frp_mean = avg(frps)
        # Intentionally matches the historical training implementation.
        frp_median = sorted(frps)[len(frps) // 2] if frps else 0.0
        frp_std = std(frps)

        active_dates = {
            record.get("acq_date")
            for record in records
            if record.get("acq_date")
        }

        night_frps = [
            record["frp"]
            for record in records
            if record.get("daynight") == "N"
        ]
        day_frps = [
            record["frp"]
            for record in records
            if record.get("daynight") == "D"
        ]

        night_count = len(night_frps)
        brightness_delta = [
            brightness[index] - bright_t31[index]
            for index in range(len(records))
        ]

        frp_density = [
            frp / max(scan * track, 0.01)
            for frp, scan, track in zip(frps, scans, tracks)
        ]

        high_frp_threshold = frp_mean + frp_std
        high_frp_ratio = (
            sum(frp > high_frp_threshold for frp in frps) / len(frps)
            if frps
            else 0.0
        )

        night_mean_frp = avg(night_frps)
        day_mean_frp = avg(day_frps)
        night_day_frp_ratio = (
            night_mean_frp / day_mean_frp
            if day_mean_frp > 0.0
            else (night_mean_frp if night_mean_frp > 0.0 else 0.0)
        )

        aggregated.append(
            {
                "cell_id": cell_id,
                "latitude": avg(latitudes),
                "longitude": avg(longitudes),
                "observation_count": len(records),
                "active_days": len(active_dates),
                "night_ratio": night_count / len(records) if records else 0.0,
                "mean_frp": frp_mean,
                "median_frp": frp_median,
                "max_frp": max(frps, default=0.0),
                "std_frp": frp_std,
                "frp_cv": frp_std / frp_mean if frp_mean > 0.0 else 0.0,
                "peak_to_median_frp": (
                    max(frps, default=0.0) / frp_median
                    if frp_median > 0.0
                    else 0.0
                ),
                "high_frp_ratio": high_frp_ratio,
                "observation_density": (
                    len(records) / len(active_dates)
                    if active_dates
                    else 0.0
                ),
                "mean_brightness": avg(brightness),
                "max_brightness": max(brightness, default=0.0),
                "mean_bright_t31": avg(bright_t31),
                "mean_brightness_delta": avg(brightness_delta),
                "mean_scan": avg(scans),
                "mean_track": avg(tracks),
                "mean_frp_density": avg(frp_density),
                "max_frp_density": max(frp_density, default=0.0),
                "std_brightness_delta": std(brightness_delta),
                "night_day_frp_ratio": night_day_frp_ratio,
            }
        )

    return aggregated


def predict_live_firms(
    hotspots: Iterable[Dict[str, Any]],
    model: OTIPSourceMLModel,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Run ML only for source types supported by the production model."""
    raw_hotspots = list(hotspots)
    if not raw_hotspots:
        return [], {
            "enabled": True,
            "source_count": 0,
            "applicable_source_count": 0,
            "hotspot_count": 0,
            "applicable_hotspot_count": 0,
            "feature_count": len(XGBOOST_FEATURES),
            "classes": list(model.classes_),
            "model": "XGBClassifier",
            "granularity": "0.005-degree FIRMS source cell",
        }

    applicable_hotspots = [
        hotspot for hotspot in raw_hotspots
        if str(hotspot.get("classification") or "")
        in ML_SUPPORTED_DETERMINISTIC_CLASSES
    ]

    source_records = aggregate_live_source_records(applicable_hotspots)
    predictions = model.predict_with_confidence(source_records)
    prediction_by_cell = {
        source["cell_id"]: {
            "ml_classification": prediction["predicted_class"],
        }
        for source, prediction in zip(source_records, predictions)
    }

    enriched = []
    for hotspot in raw_hotspots:
        normalized = _normalize_live_record(hotspot)
        result = dict(hotspot)
        result["ml_source_cell"] = normalized["cell_id"]
        deterministic_class = str(hotspot.get("classification") or "")
        if deterministic_class in ML_SUPPORTED_DETERMINISTIC_CLASSES:
            prediction = prediction_by_cell.get(
                normalized["cell_id"],
                {"ml_classification": "NOT_APPLICABLE"},
            )
            ml_class = prediction.get("ml_classification")
            result["ml_classification"] = ml_class
            result["ml_raw_classification"] = ml_class
            result["ml_status"] = _ml_status(deterministic_class, ml_class)
        else:
            result["ml_classification"] = "NOT_APPLICABLE"
            result["ml_raw_classification"] = None
            result["ml_status"] = "NOT_APPLICABLE"
        enriched.append(result)

    return enriched, {
        "enabled": True,
        "source_count": len(aggregate_live_source_records(raw_hotspots)),
        "applicable_source_count": len(source_records),
        "hotspot_count": len(raw_hotspots),
        "applicable_hotspot_count": len(applicable_hotspots),
        "feature_count": len(XGBOOST_FEATURES),
        "classes": list(model.classes_),
        "model": "XGBClassifier",
        "granularity": "0.005-degree FIRMS source cell",
    }


def train_synthetic_demo_model(
    hotspots: Iterable[Dict[str, Any]],
) -> OTIPSourceMLModel:
    """Retained for compatibility with the existing synthetic/demo pipeline."""
    return OTIPSourceMLModel().fit(hotspots)
