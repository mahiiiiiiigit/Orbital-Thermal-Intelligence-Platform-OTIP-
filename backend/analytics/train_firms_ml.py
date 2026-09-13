"""
Train and evaluate the OTIP ML source classifier
on the FIRMS weak-labelled dataset.

Observations from the same spatial cell are kept in the
same split to prevent spatial leakage.

The primary evaluation uses a chronological temporal holdout.

Training uses observations from 2020-2024 and testing uses
observations from 2025. The split is performed before source
aggregation to prevent future observations from entering
training source statistics.

Random Forest and XGBoost are benchmarked on the same
temporal holdout using source-level thermal and behavioural features.
The added behavioural features capture variability, burstiness,
detection density, and day/night thermal contrast.
"""

from __future__ import annotations

import csv
import math
import random
from collections import Counter

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

from xgboost import XGBClassifier

from backend.analytics.ml_classifier import OTIPSourceMLModel


DATASET_PATH = "data/firms/firms_weak_labels.csv"

TEST_RATIO = 0.20

RANDOM_STATE = 26162

EVALUATION_SEEDS = [
    26162,
    26163,
    26164,
    26165,
    26166,
]

# Spatial neighbourhood radius in degrees.
# Approximately 5-6 km at Indian latitudes.
NEIGHBOUR_RADIUS_DEGREES = 0.05
ROLLING_TEMPORAL_SPLITS = [
    (2022, 2023),
    (2023, 2024),
    (2024, 2025),
]


def load_records(path: str):
    """Load the weak-labelled FIRMS records."""

    with open(
        path,
        "r",
        newline="",
        encoding="utf-8",
    ) as file:
        return list(csv.DictReader(file))

def temporal_train_test_split(records, train_end_year, test_year):
    """Split raw FIRMS observations chronologically by year."""

    train_records = []
    test_records = []

    train_end_date = f"{train_end_year}-12-31"
    test_start_date = f"{test_year}-01-01"
    test_end_date = f"{test_year}-12-31"

    for record in records:
        date = str(record.get("acq_date") or "")

        if date and date <= train_end_date:
            train_records.append(record)

        elif test_start_date <= date <= test_end_date:
            test_records.append(record)

    return train_records, test_records


def aggregate_source_records(records):
    """Aggregate FIRMS observations into one record per spatial source."""

    grouped = {}

    for record in records:
        cell_id = record.get("cell_id")

        if cell_id:
            grouped.setdefault(
                cell_id,
                [],
            ).append(record)

    aggregated = []

    for cell_id, cell_records in grouped.items():

        def values(field):
            return [
                float(record.get(field) or 0.0)
                for record in cell_records
            ]

        frps = values("frp")
        brightness = values("brightness")
        bright_t31 = values("bright_t31")
        scans = values("scan")
        tracks = values("track")

        latitudes = values("latitude")
        longitudes = values("longitude")

        frp_density = [
            frp / max(
                scan * track,
                0.01,
            )
            for frp, scan, track
            in zip(
                frps,
                scans,
                tracks,
            )
        ]

        active_dates = {
            record.get("acq_date")
            for record in cell_records
            if record.get("acq_date")
        }

        night_count = sum(
            1
            for record in cell_records
            if str(
                record.get("daynight") or ""
            ).upper() == "N"
        )

        label_counts = Counter(
            record["label"]
            for record in cell_records
        )

        label = label_counts.most_common(1)[0][0]

        def mean(items):
            return (
                sum(items) / len(items)
                if items
                else 0.0
            )

        def std(items):
            if len(items) < 2:
                return 0.0

            average = mean(items)

            return (
                sum(
                    (value - average) ** 2
                    for value in items
                ) / len(items)
            ) ** 0.5

        frp_mean = mean(frps)
        frp_median = sorted(frps)[len(frps) // 2]
        frp_std = std(frps)

        night_frps = [
            float(record.get("frp") or 0.0)
            for record in cell_records
            if str(record.get("daynight") or "").upper() == "N"
        ]
        day_frps = [
            float(record.get("frp") or 0.0)
            for record in cell_records
            if str(record.get("daynight") or "").upper() == "D"
        ]

        brightness_std = std(brightness)
        bright_t31_std = std(bright_t31)
        brightness_delta = [
            brightness[i] - bright_t31[i]
            for i in range(len(brightness))
        ]
        brightness_delta_std = std(brightness_delta)

        high_frp_threshold = frp_mean + frp_std
        high_frp_ratio = (
            sum(1 for frp in frps if frp > high_frp_threshold)
            / len(frps)
            if frps else 0.0
        )

        night_mean_frp = mean(night_frps)
        day_mean_frp = mean(day_frps)
        night_day_frp_ratio = (
            night_mean_frp / day_mean_frp
            if day_mean_frp > 0.0
            else (night_mean_frp if night_mean_frp > 0.0 else 0.0)
        )

        aggregated.append({
            "cell_id": cell_id,
            "label": label,

            "latitude": mean(latitudes),
            "longitude": mean(longitudes),

            "observation_count": len(
                cell_records
            ),

            "active_days": len(
                active_dates
            ),

            "night_ratio": (
                night_count
                / len(cell_records)
            ),

            "mean_frp": frp_mean,

            "median_frp": frp_median,

            "max_frp": max(
                frps,
                default=0.0,
            ),

            "std_frp": frp_std,

            "frp_cv": (
                frp_std / frp_mean
                if frp_mean > 0.0
                else 0.0
            ),

            "peak_to_median_frp": (
                max(frps, default=0.0) / frp_median
                if frp_median > 0.0
                else 0.0
            ),

            "high_frp_ratio": high_frp_ratio,

            "observation_density": (
                len(cell_records) / len(active_dates)
                if active_dates
                else 0.0
            ),

            "mean_brightness": mean(
                brightness
            ),

            "max_brightness": max(
                brightness,
                default=0.0,
            ),

            "std_brightness": brightness_std,

            "std_bright_t31": bright_t31_std,

            "std_brightness_delta": brightness_delta_std,

            "mean_bright_t31": mean(
                bright_t31
            ),

            "mean_brightness_delta": mean(
                brightness_delta
            ),

            "mean_night_frp": night_mean_frp,

            "mean_day_frp": day_mean_frp,

            "night_day_frp_ratio": night_day_frp_ratio,

            "mean_scan": mean(scans),

            "mean_track": mean(tracks),

            "mean_frp_density": mean(
                frp_density
            ),

            "max_frp_density": max(
                frp_density,
                default=0.0,
            ),
        })

    return aggregated


def geographic_train_test_split(
    records,
    random_state,
):
    """
    Split data by coarse geographic blocks.

    All sources inside the same 1-degree latitude/longitude block
    remain together in either train or test.

    This provides a stronger geographic generalization test than
    randomly splitting individual spatial cells.
    """

    block_to_cells = {}

    for record in records:

        latitude = float(
            record.get("latitude") or 0.0
        )

        longitude = float(
            record.get("longitude") or 0.0
        )

        block_lat = math.floor(latitude)
        block_lon = math.floor(longitude)

        block_id = (
            block_lat,
            block_lon,
        )

        block_to_cells.setdefault(
            block_id,
            set(),
        ).add(
            record["cell_id"]
        )

    blocks = list(
        block_to_cells.keys()
    )

    rng = random.Random(
        random_state
    )

    rng.shuffle(blocks)

    target_test_sources = max(
        1,
        int(
            len(records)
            * TEST_RATIO
        ),
    )

    test_blocks = set()
    test_source_count = 0

    for block in blocks:

        test_blocks.add(block)

        test_source_count += len(
            block_to_cells[block]
        )

        if (
            test_source_count
            >= target_test_sources
        ):
            break

    test_cells = set()

    for block in test_blocks:
        test_cells.update(
            block_to_cells[block]
        )

    train_records = []
    test_records = []

    for record in records:

        if (
            record["cell_id"]
            in test_cells
        ):
            test_records.append(
                record
            )
        else:
            train_records.append(
                record
            )

    return (
        train_records,
        test_records,
        test_blocks,
    )

def add_spatial_neighbour_features(
    train_records,
    target_records,
):
    """
    Add spatial neighbourhood features to target records.

    Neighbourhood statistics are calculated using TRAINING
    sources only. This prevents test-source observations from
    influencing the feature construction.

    The target source itself is excluded from neighbourhood
    calculations.
    """

    for target in target_records:

        target_lat = float(
            target.get("latitude") or 0.0
        )

        target_lon = float(
            target.get("longitude") or 0.0
        )

        neighbours = []

        for source in train_records:

            if (
                source.get("cell_id")
                == target.get("cell_id")
            ):
                continue

            source_lat = float(
                source.get("latitude") or 0.0
            )

            source_lon = float(
                source.get("longitude") or 0.0
            )

            lat_difference = (
                target_lat
                - source_lat
            )

            lon_difference = (
                target_lon
                - source_lon
            )

            distance = math.sqrt(
                lat_difference ** 2
                + lon_difference ** 2
            )

            if (
                distance
                <= NEIGHBOUR_RADIUS_DEGREES
            ):
                neighbours.append(
                    source
                )

        neighbour_frps = [
            float(
                source.get("mean_frp") or 0.0
            )
            for source in neighbours
        ]

        neighbour_counts = [
            int(
                source.get(
                    "observation_count"
                ) or 0
            )
            for source in neighbours
        ]

        if neighbours:

            target[
                "neighbour_count"
            ] = len(neighbours)

            target[
                "neighbour_mean_frp"
            ] = (
                sum(neighbour_frps)
                / len(neighbour_frps)
            )

            target[
                "neighbour_max_frp"
            ] = max(
                neighbour_frps
            )

            target[
                "neighbour_mean_observation_count"
            ] = (
                sum(neighbour_counts)
                / len(neighbour_counts)
            )

        else:

            target[
                "neighbour_count"
            ] = 0.0

            target[
                "neighbour_mean_frp"
            ] = 0.0

            target[
                "neighbour_max_frp"
            ] = 0.0

            target[
                "neighbour_mean_observation_count"
            ] = 0.0

    return target_records


def print_error_analysis(actual_labels, predictions, model_name):
    """Print confusion matrix and prediction distribution for one holdout."""

    labels = [
        "GAS_FLARE",
        "MINING_ACTIVITY",
        "PERSISTENT_INDUSTRIAL",
    ]

    matrix = confusion_matrix(
        actual_labels,
        predictions,
        labels=labels,
    )

    print(
        f"\n{model_name} Confusion Matrix"
    )

    print(
        "Rows = actual, columns = predicted"
    )

    print(
        f"{'':24} "
        f"{'GAS':>8} "
        f"{'MINING':>8} "
        f"{'PERSISTENT':>12}"
    )

    for index, label in enumerate(labels):
        print(
            f"{label:<24} "
            f"{matrix[index, 0]:>8} "
            f"{matrix[index, 1]:>8} "
            f"{matrix[index, 2]:>12}"
        )

    print(
        f"\n{model_name} Prediction Distribution:"
    )

    print(
        Counter(predictions)
    )


def evaluate_temporal_split(
    train_records,
    test_records,
):
    """Train Random Forest on historical sources and evaluate on a future year."""

    model = OTIPSourceMLModel()

    model.fit(
        train_records
    )

    predictions = model.predict(
        test_records
    )

    actual_labels = [
        record["label"]
        for record in test_records
    ]

    accuracy = accuracy_score(
        actual_labels,
        predictions,
    )

    report = classification_report(
        actual_labels,
        predictions,
        labels=[
            "GAS_FLARE",
            "MINING_ACTIVITY",
            "PERSISTENT_INDUSTRIAL",
        ],
        digits=4,
        zero_division=0,
        output_dict=True,
    )

    return model, predictions, accuracy, report


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

def evaluate_xgboost_temporal_split(
    train_records,
    test_records,
):
    """Train XGBoost on historical sources and evaluate on a future year."""

    label_to_id = {
        label: index
        for index, label in enumerate(XGBOOST_LABELS)
    }

    for record in train_records + test_records:
        if record["label"] not in label_to_id:
            raise ValueError(
                f"Unexpected label in temporal evaluation: {record['label']}"
            )

    X_train = [
        [
            float(record.get(feature) or 0.0)
            for feature in XGBOOST_FEATURES
        ]
        for record in train_records
    ]

    y_train = [
        label_to_id[record["label"]]
        for record in train_records
    ]

    X_test = [
        [
            float(record.get(feature) or 0.0)
            for feature in XGBOOST_FEATURES
        ]
        for record in test_records
    ]

    model = XGBClassifier(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=2,
        objective="multi:softprob",
        num_class=len(XGBOOST_LABELS),
        eval_metric="mlogloss",
        random_state=26162,
        n_jobs=-1,
    )

    model.fit(
        X_train,
        y_train,
    )

    predictions = model.predict(
        X_test
    )

    predicted_labels = [
        XGBOOST_LABELS[int(prediction)]
        for prediction in predictions
    ]

    actual_labels = [
        record["label"]
        for record in test_records
    ]

    accuracy = accuracy_score(
        actual_labels,
        predicted_labels,
    )

    report = classification_report(
        actual_labels,
        predicted_labels,
        labels=XGBOOST_LABELS,
        digits=4,
        zero_division=0,
        output_dict=True,
    )

    return model, predicted_labels, accuracy, report


def main():

    print(
        "Loading FIRMS weak-labelled dataset..."
    )

    records = load_records(
        DATASET_PATH
    )

    print(
        f"Raw FIRMS observations: "
        f"{len(records):,}"
    )

    results = []

    for train_end_year, test_year in ROLLING_TEMPORAL_SPLITS:

        train_raw, test_raw = temporal_train_test_split(
            records,
            train_end_year,
            test_year,
        )

        train_records = aggregate_source_records(
            train_raw
        )

        test_records = aggregate_source_records(
            test_raw
        )

        print(
            "\n"
            "=================================================="
        )

        print(
            "Rolling Temporal Holdout Evaluation"
        )

        print(
            "=================================================="
        )

        print(
            f"\nTraining period: 2020-01-01 to {train_end_year}-12-31"
        )

        print(
            f"Testing period:  {test_year}-01-01 to {test_year}-12-31"
        )

        print(
            f"\nTraining observations: {len(train_raw):,}"
        )

        print(
            f"Testing observations:  {len(test_raw):,}"
        )

        print(
            f"Training source cells: {len(train_records):,}"
        )

        print(
            f"Testing source cells:  {len(test_records):,}"
        )

        print(
            "\nTraining label distribution:",
            Counter(
                record["label"]
                for record in train_records
            )
        )

        print(
            "Testing label distribution:",
            Counter(
                record["label"]
                for record in test_records
            )
        )

        (
            rf_model,
            rf_predictions,
            rf_accuracy,
            rf_report,
        ) = evaluate_temporal_split(
            train_records,
            test_records,
        )

        print(
            "\nRandom Forest Results"
        )

        print(
            f"Accuracy: "
            f"{rf_accuracy:.4f}"
        )

        print(
            f"Macro F1: "
            f"{rf_report['macro avg']['f1-score']:.4f}"
        )

        print(
            f"GAS_FLARE F1: "
            f"{rf_report['GAS_FLARE']['f1-score']:.4f}"
        )

        print(
            f"MINING_ACTIVITY F1: "
            f"{rf_report['MINING_ACTIVITY']['f1-score']:.4f}"
        )

        print(
            f"PERSISTENT_INDUSTRIAL F1: "
            f"{rf_report['PERSISTENT_INDUSTRIAL']['f1-score']:.4f}"
        )

        print_error_analysis(
            [record["label"] for record in test_records],
            rf_predictions,
            "Random Forest",
        )

        (
            xgb_model,
            xgb_predictions,
            xgb_accuracy,
            xgb_report,
        ) = evaluate_xgboost_temporal_split(
            train_records,
            test_records,
        )

        print(
            "\nXGBoost Results"
        )

        print(
            f"Accuracy: "
            f"{xgb_accuracy:.4f}"
        )

        print(
            f"Macro F1: "
            f"{xgb_report['macro avg']['f1-score']:.4f}"
        )

        print(
            f"GAS_FLARE F1: "
            f"{xgb_report['GAS_FLARE']['f1-score']:.4f}"
        )

        print(
            f"MINING_ACTIVITY F1: "
            f"{xgb_report['MINING_ACTIVITY']['f1-score']:.4f}"
        )

        print(
            f"PERSISTENT_INDUSTRIAL F1: "
            f"{xgb_report['PERSISTENT_INDUSTRIAL']['f1-score']:.4f}"
        )

        print_error_analysis(
            [record["label"] for record in test_records],
            xgb_predictions,
            "XGBoost",
        )

        results.append({
            "test_year": test_year,
            "rf_accuracy": rf_accuracy,
            "rf_macro_f1": rf_report["macro avg"]["f1-score"],
            "xgb_accuracy": xgb_accuracy,
            "xgb_macro_f1": xgb_report["macro avg"]["f1-score"],
        })

        if test_year == 2025:

            print(
                "\nXGBoost Feature Importances (2025 holdout):"
            )

            feature_importances = sorted(
                zip(
                    XGBOOST_FEATURES,
                    xgb_model.feature_importances_,
                ),
                key=lambda item: item[1],
                reverse=True,
            )

            for (
                feature_name,
                importance,
            ) in feature_importances:

                print(
                    f"  {feature_name}: "
                    f"{importance:.4f}"
                )

    print(
        "\n"
        "=================================================="
    )

    print(
        "Rolling Temporal Comparison Summary"
    )

    print(
        "=================================================="
    )

    print(
        "\nYear   RF Accuracy   RF Macro F1   XGB Accuracy   XGB Macro F1"
    )

    for result in results:
        print(
            f"{result['test_year']}    "
            f"{result['rf_accuracy']:.4f}        "
            f"{result['rf_macro_f1']:.4f}       "
            f"{result['xgb_accuracy']:.4f}         "
            f"{result['xgb_macro_f1']:.4f}"
        )


if __name__ == "__main__":
    main()
