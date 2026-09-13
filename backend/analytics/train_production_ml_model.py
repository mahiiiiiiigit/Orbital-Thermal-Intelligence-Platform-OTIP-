"""Train the OTIP production XGBoost source classifier from weak labels."""

from __future__ import annotations

import csv
from pathlib import Path

from backend.analytics.ml_classifier import DEFAULT_MODEL_PATH, train_and_save_production_model

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_PATH = PROJECT_ROOT / "data" / "firms" / "firms_weak_labels.csv"


def main() -> None:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Weak-label dataset not found: {DATASET_PATH}")

    with DATASET_PATH.open("r", newline="", encoding="utf-8") as file:
        records = list(csv.DictReader(file))

    print("=" * 70)
    print("OTIP PRODUCTION XGBOOST MODEL TRAINING")
    print("=" * 70)
    print(f"Dataset : {DATASET_PATH}")
    print(f"Rows    : {len(records):,}")
    print(f"Artifact: {DEFAULT_MODEL_PATH}")
    print()

    model = train_and_save_production_model(records)

    print(f"Model   : {type(model.model).__name__}")
    print(f"Classes : {model.classes_}")
    print(f"Features: {len(model.feature_names_)}")
    print(f"Saved   : {DEFAULT_MODEL_PATH}")


if __name__ == "__main__":
    main()
