from io import BytesIO
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def generate_dossier(
    cluster: Dict[str, Any],
    history: List[Dict[str, Any]],
    alerts: List[Dict[str, Any]],
) -> bytes:
    pdf_stream = BytesIO()

    document = SimpleDocTemplate(
        pdf_stream,
        pagesize=A4,
        leftMargin=42,
        rightMargin=42,
        topMargin=42,
        bottomMargin=42,
    )

    styles = getSampleStyleSheet()

    average_frp = (
        round(sum(float(record["frp"]) for record in history) / len(history), 2)
        if history
        else cluster.get("mean_frp", 0.0)
    )

    confidence = cluster.get("confidence_level", "HIGH")
    explanation = cluster.get("explanation", "Operational thermal intelligence profile.")

    content = [
        Paragraph(
            "THERMALWATCH — FACILITY INTELLIGENCE DOSSIER",
            styles["Title"],
        ),
        Spacer(1, 16),
        Paragraph(
            f"""
            <b>Facility / Asset:</b> {cluster.get('facility_name', 'N/A')}<br/>
            <b>Taxonomic Classification:</b> <b>{cluster.get('classification', 'UNCLASSIFIED')}</b> [Confidence: <b>{confidence}</b>]<br/>
            <b>Coordinates:</b> {cluster.get('latitude')}, {cluster.get('longitude')}<br/>
            <b>Analyst Summary:</b> {explanation}
            """,
            styles["BodyText"],
        ),
        Spacer(1, 14),
    ]

    # Operational statistics table
    statistics = [
        ["Operational Metric", "Value"],
        ["Taxonomic Class", str(cluster.get("classification"))],
        ["Classification Confidence", str(confidence)],
        ["Active Observation Days", str(cluster.get("active_days", 1))],
        ["Satellite Detections", str(cluster.get("detection_count", len(history)))],
        ["Mean FRP Output", f"{average_frp} MW"],
        ["Peak Observed FRP", f"{cluster.get('peak_frp', average_frp)} MW"],
        ["Risk Rating", f"{cluster.get('risk_score', 50.0)} / 100 ({str(cluster.get('risk_level', 'medium')).upper()})"],
    ]

    statistics_table = Table(statistics, colWidths=[250, 200])
    statistics_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#172033")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    content.extend(
        [
            statistics_table,
            Spacer(1, 16),
            Paragraph("Classification Decision Rationale (Why Classified?)", styles["Heading2"]),
        ]
    )

    # Why Classified / Decision Rules Audit Table
    reasons = cluster.get("reasons") or [explanation]
    reason_rows = [["#", "Decision Rule & Geospatial Finding"]]
    for idx, reason in enumerate(reasons, start=1):
        reason_rows.append([str(idx), str(reason)])

    reason_table = Table(reason_rows, colWidths=[30, 420])
    reason_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    content.extend(
        [
            reason_table,
            Spacer(1, 16),
            Paragraph("Thermal Anomaly Audit", styles["Heading2"]),
        ]
    )

    # Anomaly audit table
    audit_rows = [["Date", "Severity", "Anomaly Finding"]]

    if alerts:
        for alert in alerts:
            audit_rows.append(
                [
                    str(alert.get("timestamp", ""))[:10],
                    str(alert.get("severity", "CRITICAL")),
                    str(alert.get("message", "Thermal anomaly excursion")),
                ]
            )
    else:
        audit_rows.append(["—", "—", "No critical anomaly excursions exceeding 3σ baseline"])

    audit_table = Table(audit_rows, colWidths=[90, 80, 280])
    audit_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#172033")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    content.append(audit_table)

    document.build(content)
    return pdf_stream.getvalue()