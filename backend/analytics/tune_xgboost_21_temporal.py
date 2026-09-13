"""
Leakage-safe temporal XGBoost tuning for OTIP.

This is a benchmark-only script. It does not modify the OTIP production
classifier.

For each final test year:
  1. Train-period data is split into an earlier training period and a
     one-year validation period.
  2. XGBoost hyperparameters are selected ONLY on that validation year.
  3. The selected configuration is retrained on all data available before
     the final test year.
  4. The final test year remains untouched during tuning.

All 21 finalized source-level FIRMS features are used.
"""

from __future__ import annotations

import csv
from collections import Counter

from sklearn.metrics import accuracy_score, classification_report
from xgboost import XGBClassifier


DATASET_PATH = "data/firms/firms_weak_labels.csv"

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

LABELS = [
    "GAS_FLARE",
    "MINING_ACTIVITY",
    "PERSISTENT_INDUSTRIAL",
]

LABEL_TO_ID = {
    label: index
    for index, label in enumerate(LABELS)
}

# Small, deliberately constrained search space.
# This is intended to find a better general configuration without
# turning the benchmark into an enormous hyperparameter sweep.
PARAM_GRID = [
    {
        "n_estimators": 400,
        "max_depth": 4,
        "learning_rate": 0.05,
        "min_child_weight": 2,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
    },
    {
        "n_estimators": 600,
        "max_depth": 4,
        "learning_rate": 0.05,
        "min_child_weight": 2,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
    },
    {
        "n_estimators": 800,
        "max_depth": 4,
        "learning_rate": 0.03,
        "min_child_weight": 2,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
    },
    {
        "n_estimators": 400,
        "max_depth": 5,
        "learning_rate": 0.05,
        "min_child_weight": 2,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
    },
    {
        "n_estimators": 600,
        "max_depth": 5,
        "learning_rate": 0.05,
        "min_child_weight": 2,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
    },
    {
        "n_estimators": 800,
        "max_depth": 5,
        "learning_rate": 0.03,
        "min_child_weight": 2,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
    },
    {
        "n_estimators": 400,
        "max_depth": 6,
        "learning_rate": 0.05,
        "min_child_weight": 2,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
    },
    {
        "n_estimators": 600,
        "max_depth": 6,
        "learning_rate": 0.05,
        "min_child_weight": 2,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
    },
    {
        "n_estimators": 800,
        "max_depth": 6,
        "learning_rate": 0.03,
        "min_child_weight": 2,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
    },
    {
        "n_estimators": 400,
        "max_depth": 7,
        "learning_rate": 0.05,
        "min_child_weight": 2,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
    },
    {
        "n_estimators": 600,
        "max_depth": 7,
        "learning_rate": 0.05,
        "min_child_weight": 2,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
    },
    {
        "n_estimators": 800,
        "max_depth": 7,
        "learning_rate": 0.03,
        "min_child_weight": 2,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
    },
    {
        "n_estimators": 600,
        "max_depth": 5,
        "learning_rate": 0.05,
        "min_child_weight": 1,
        "subsample": 0.9,
        "colsample_bytree": 0.9,
    },
    {
        "n_estimators": 600,
        "max_depth": 5,
        "learning_rate": 0.05,
        "min_child_weight": 3,
        "subsample": 0.9,
        "colsample_bytree": 0.9,
    },
    {
        "n_estimators": 600,
        "max_depth": 6,
        "learning_rate": 0.05,
        "min_child_weight": 1,
        "subsample": 0.9,
        "colsample_bytree": 0.9,
    },
    {
        "n_estimators": 600,
        "max_depth": 6,
        "learning_rate": 0.05,
        "min_child_weight": 3,
        "subsample": 0.9,
        "colsample_bytree": 0.9,
    },
]


ROLLING_SPLITS = [
    (2022, 2023),
    (2023, 2024),
    (2024, 2025),
]


def load_records(path):
    with open(
        path,
        "r",
        newline="",
        encoding="utf-8",
    ) as file:
        return list(csv.DictReader(file))


def temporal_range(records, start_year, end_year):
    output = []

    start_date = f"{start_year}-01-01"
    end_date = f"{end_year}-12-31"

    for record in records:
        date = str(record.get("acq_date") or "")

        if start_date <= date <= end_date:
            output.append(record)

    return output


def aggregate_source_records(records):
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
            frp / max(scan * track, 0.01)
            for frp, scan, track in zip(
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
            if str(
                record.get("daynight") or ""
            ).upper() == "N"
        ]

        day_frps = [
            float(record.get("frp") or 0.0)
            for record in cell_records
            if str(
                record.get("daynight") or ""
            ).upper() == "D"
        ]

        brightness_delta = [
            brightness[index] - bright_t31[index]
            for index in range(len(brightness))
        ]

        brightness_delta_std = std(
            brightness_delta
        )

        high_frp_threshold = frp_mean + frp_std

        high_frp_ratio = (
            sum(
                1
                for frp in frps
                if frp > high_frp_threshold
            )
            / len(frps)
            if frps
            else 0.0
        )

        night_mean_frp = mean(night_frps)
        day_mean_frp = mean(day_frps)

        night_day_frp_ratio = (
            night_mean_frp / day_mean_frp
            if day_mean_frp > 0.0
            else (
                night_mean_frp
                if night_mean_frp > 0.0
                else 0.0
            )
        )

        aggregated.append({
            "cell_id": cell_id,
            "label": label,
            "latitude": mean(latitudes),
            "longitude": mean(longitudes),
            "observation_count": len(cell_records),
            "active_days": len(active_dates),
            "night_ratio": (
                night_count / len(cell_records)
            ),
            "mean_frp": frp_mean,
            "median_frp": frp_median,
            "max_frp": max(frps, default=0.0),
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
            "mean_brightness": mean(brightness),
            "max_brightness": max(
                brightness,
                default=0.0,
            ),
            "mean_bright_t31": mean(bright_t31),
            "mean_brightness_delta": mean(
                brightness_delta
            ),
            "mean_scan": mean(scans),
            "mean_track": mean(tracks),
            "mean_frp_density": mean(
                frp_density
            ),
            "max_frp_density": max(
                frp_density,
                default=0.0,
            ),
            "std_brightness_delta": brightness_delta_std,
            "night_day_frp_ratio": night_day_frp_ratio,
        })

    return aggregated


def make_xy(records):
    x = [
        [
            float(record.get(feature) or 0.0)
            for feature in XGBOOST_FEATURES
        ]
        for record in records
    ]

    y = [
        LABEL_TO_ID[record["label"]]
        for record in records
    ]

    return x, y


def train_model(train_records, params):
    x_train, y_train = make_xy(train_records)

    model = XGBClassifier(
        **params,
        objective="multi:softprob",
        num_class=len(LABELS),
        eval_metric="mlogloss",
        random_state=26162,
        n_jobs=-1,
    )

    model.fit(x_train, y_train)

    return model


def evaluate_model(model, records):
    x_test, y_test = make_xy(records)

    predictions = model.predict(x_test)

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    report = classification_report(
        y_test,
        predictions,
        labels=[0, 1, 2],
        target_names=LABELS,
        digits=4,
        zero_division=0,
        output_dict=True,
    )

    return (
        accuracy,
        report,
        predictions,
    )


def params_text(params):
    return (
        f"trees={params['n_estimators']}, "
        f"depth={params['max_depth']}, "
        f"lr={params['learning_rate']}, "
        f"child={params['min_child_weight']}, "
        f"sub={params['subsample']}, "
        f"col={params['colsample_bytree']}"
    )


def main():
    print("Loading FIRMS weak-labelled dataset...")

    records = load_records(
        DATASET_PATH
    )

    print(
        f"Raw FIRMS observations: {len(records):,}"
    )

    final_results = []

    for train_end_year, test_year in ROLLING_SPLITS:

        tuning_train_raw = temporal_range(
            records,
            2020,
            train_end_year - 1,
        )

        validation_raw = temporal_range(
            records,
            train_end_year,
            train_end_year,
        )

        final_train_raw = temporal_range(
            records,
            2020,
            train_end_year,
        )

        final_test_raw = temporal_range(
            records,
            test_year,
            test_year,
        )

        tuning_train = aggregate_source_records(
            tuning_train_raw
        )

        validation = aggregate_source_records(
            validation_raw
        )

        final_train = aggregate_source_records(
            final_train_raw
        )

        final_test = aggregate_source_records(
            final_test_raw
        )

        print(
            "\n"
            "=================================================="
        )
        print(
            f"FINAL TEST YEAR: {test_year}"
        )
        print(
            "=================================================="
        )

        print(
            f"Tuning train: 2020-{train_end_year - 1}"
        )
        print(
            f"Validation:   {train_end_year}"
        )
        print(
            f"Final train:  2020-{train_end_year}"
        )
        print(
            f"Final test:   {test_year}"
        )

        best_params = None
        best_accuracy = -1.0
        best_macro_f1 = -1.0

        print(
            "\nHyperparameter tuning on validation year..."
        )

        for index, params in enumerate(
            PARAM_GRID,
            start=1,
        ):
            model = train_model(
                tuning_train,
                params,
            )

            accuracy, report, _ = evaluate_model(
                model,
                validation,
            )

            macro_f1 = report["macro avg"]["f1-score"]

            print(
                f"[{index:02d}/{len(PARAM_GRID)}] "
                f"Accuracy={accuracy:.4f} "
                f"MacroF1={macro_f1:.4f} | "
                f"{params_text(params)}"
            )

            # Macro F1 is the primary selection metric because the
            # three classes are imbalanced. Accuracy breaks ties.
            if (
                macro_f1 > best_macro_f1
                or (
                    macro_f1 == best_macro_f1
                    and accuracy > best_accuracy
                )
            ):
                best_macro_f1 = macro_f1
                best_accuracy = accuracy
                best_params = params

        print(
            "\nBEST VALIDATION CONFIGURATION:"
        )
        print(
            params_text(best_params)
        )
        print(
            f"Validation Accuracy: {best_accuracy:.4f}"
        )
        print(
            f"Validation Macro F1: {best_macro_f1:.4f}"
        )

        print(
            "\nRetraining selected configuration on "
            "all pre-test-year data..."
        )

        final_model = train_model(
            final_train,
            best_params,
        )

        test_accuracy, test_report, _ = evaluate_model(
            final_model,
            final_test,
        )

        print(
            "\nFINAL UNSEEN TEST RESULTS"
        )
        print(
            f"Accuracy: {test_accuracy:.4f}"
        )
        print(
            f"Macro F1: "
            f"{test_report['macro avg']['f1-score']:.4f}"
        )
        print(
            f"GAS_FLARE F1: "
            f"{test_report['GAS_FLARE']['f1-score']:.4f}"
        )
        print(
            f"MINING_ACTIVITY F1: "
            f"{test_report['MINING_ACTIVITY']['f1-score']:.4f}"
        )
        print(
            f"PERSISTENT_INDUSTRIAL F1: "
            f"{test_report['PERSISTENT_INDUSTRIAL']['f1-score']:.4f}"
        )

        final_results.append({
            "year": test_year,
            "accuracy": test_accuracy,
            "macro_f1": test_report["macro avg"]["f1-score"],
            "params": best_params,
        })

    print(
        "\n"
        "=================================================="
    )
    print(
        "FINAL TEMPORAL TUNING SUMMARY"
    )
    print(
        "=================================================="
    )

    print(
        "\nYear   Accuracy   Macro F1"
    )

    for result in final_results:
        print(
            f"{result['year']}    "
            f"{result['accuracy']:.4f}     "
            f"{result['macro_f1']:.4f}"
        )

    mean_accuracy = (
        sum(result["accuracy"] for result in final_results)
        / len(final_results)
    )

    mean_macro_f1 = (
        sum(result["macro_f1"] for result in final_results)
        / len(final_results)
    )

    print(
        f"\nMean Accuracy: {mean_accuracy:.4f}"
    )
    print(
        f"Mean Macro F1: {mean_macro_f1:.4f}"
    )


if __name__ == "__main__":
    main()
