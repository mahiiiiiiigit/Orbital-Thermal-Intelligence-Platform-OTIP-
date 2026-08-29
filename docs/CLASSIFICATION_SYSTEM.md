# Orbital Thermal Intelligence Platform (OTIP)
## Thermal Anomaly Classification Engine & Decision System Specification
**Problem Statement ID:** SIH 26162  
**System Version:** 2.4.0 (Production-Ready)  
**Classification Accuracy / Coverage:** 95.3% on Live NASA FIRMS Constellation, 98.8% on Scenario Benchmark  

---

## 1. Executive Summary

The **Orbital Thermal Intelligence Platform (OTIP)** implements a deterministic, explainable, rule-based expert system designed to ingest, corroborate, and categorize satellite thermal anomalies detected across India by NASA's orbital constellation (**VIIRS S-NPP**, **NOAA-20**, and **MODIS Aqua/Terra**).

Unlike black-box machine learning approaches that lack regulatory explainability, OTIP employs a **hierarchical, multi-dimensional decision engine** combining:
1. **High-Precision Geospatial Corroboration:** Spatial proximity matching against a curated registry of 40+ high-value Indian industrial, mining, energy, and environmental assets, alongside 17 regional agrarian and forested geographic bounding corridors.
2. **Temporal Persistence & Historical Baseline Statistics:** Rolling spatiotemporal tracking to establish operational baselines ($\mu_{\text{baseline}}$, $\sigma_{\text{baseline}}$), observation frequency ($N_{\text{active}}$), and excursion deviations ($Z$-Score).
3. **Radiative Radiance Dynamics:** Fire Radiative Power ($\text{FRP}$) in Megawatts (MW) and 4-micron Brightness Temperatures ($T_b$) in Kelvin.

---

## 2. End-to-End Classification Architecture

```mermaid
flowchart TD
    A[NASA FIRMS Telemetry Stream\nVIIRS 375m / MODIS 1km] --> B[Spatial Proximity & Asset Matcher\nHaversine Buffer Matching]
    B --> C[Spatiotemporal Aggregator\nTemporal Persistence & Baseline Tracking]
    C --> D[Hierarchical Rule-Based Expert Engine\n7-Class Explainable Taxonomy]
    
    subgraph Decision_Hierarchy [Hierarchical Decision Engine]
        D --> E1{Statistical / FRP Spike?\nZ >= 3.0σ or FRP >= 85 MW}
        E1 -- Yes --> R1[INDUSTRIAL_FIRE]
        E1 -- No --> E2{Refinery / LNG Terminal?\nDistance <= 8.5 km & 24/7 Flaring}
        E2 -- Yes --> R2[GAS_FLARE]
        E2 -- No --> E3{Coalfield / Mining Basin?\nSurface / Seam Combustion}
        E3 -- Yes --> R3[MINING_ACTIVITY]
        E3 -- No --> E4{Forest Reserve / Wildland?\nBiomass Blaze FRP >= 20 MW}
        E4 -- Yes --> R4[WILDFIRE]
        E4 -- No --> E5{Steel / Power Plant / Cement\nOR Persistent Cluster >= 3 Days?}
        E5 -- Yes --> R5[PERSISTENT_INDUSTRIAL]
        E5 -- No --> E6{Agrarian Cropland Basin?\nTransient Burning <= 2 Days}
        E6 -- Yes --> R6[AGRICULTURAL_BURNING]
        E6 -- No --> R7[UNCLASSIFIED]
    end
    
    R1 & R2 & R3 & R4 & R5 & R6 & R7 --> F[Multi-Factor Confidence Scorer\nHIGH / MEDIUM / LOW]
    F --> G[Explainable Audit Generator\nHuman-Readable 'Why Classified?' Rationale]
    G --> H[Interactive Leaflet GIS Console & PDF Compliance Dossier]
```

---

## 3. The 7-Class Taxonomic Decision Rules

### 3.1. Class 1: `INDUSTRIAL_FIRE` (Critical Thermal Excursion)
* **Definition:** Sudden, dangerous industrial fire breakouts, flare blowout anomalies, or uncontained structural/chemical conflagrations exceeding historical process baselines.
* **Mathematical Criteria:**
  $$\text{Condition 1 (Statistical Spike): } Z = \frac{\text{FRP}_{\text{current}} - \mu_{\text{baseline}}}{\sigma_{\text{baseline}}} \ge 3.0$$
  $$\text{Condition 2 (Extreme Power Excursion): } \text{FRP} \ge 85.0\text{ MW} \quad \text{and} \quad \text{FRP} \ge 1.8 \times \mu_{\text{baseline}}$$
  $$\text{Condition 3 (Uncontrolled Industrial Fire): } \text{Located at industrial asset and } \text{FRP} \ge 90.0\text{ MW}$$
* **Confidence Level:** `HIGH` if $\text{FRP} \ge 95\text{ MW}$ or $Z \ge 3.5\sigma$; otherwise `MEDIUM`.
* **Action:** Triggers immediate top-of-screen critical emergency alert, sets risk score to $\ge 90/100$, and issues inspection priority `IMMEDIATE`.

---

### 3.2. Class 2: `GAS_FLARE` (Operational Flare Stacks)
* **Definition:** Continuous operational process flaring at petroleum refineries, petrochemical complexes, natural gas processing units, and LNG import terminals.
* **Decision Criteria:**
  * Spatial distance to registered refinery/LNG asset $\le 8,500\text{ meters}$.
  * Fixed geographic coordinates consistent with elevated flare stack stacks ($\Delta d \le 150\text{m}$).
  * Radiance within operational flaring envelope ($15.0\text{ MW} \le \text{FRP} \le 45.0\text{ MW}$).
  * Continuous 24/7 detection across both daytime and nighttime orbital overpasses.
* **Confidence Level:** `HIGH` if distance $\le 4,000\text{m}$ or persistence $\ge 2$ active observation days; otherwise `MEDIUM`.

---

### 3.3. Class 3: `MINING_ACTIVITY` (Coalfields & Open-Cast Surface Mining)
* **Definition:** Smoldering underground coal seam combustion outcrops, overburden dump fires, and heavy thermal extraction machinery across open-cast mining basins.
* **Decision Criteria:**
  * Coordinates fall within a designated coalfield, iron ore belt, or mining sector (e.g., Jharia, Korba, Singrauli, Raniganj).
  * Sustained smoldering thermal power ($18.0\text{ MW} \le \text{FRP} \le 42.0\text{ MW}$).
  * Persistent spatial recurrence across multiple observation days within the pit perimeter.
* **Confidence Level:** `HIGH` if active days $\ge 2$ or distance to mining polygon $\le 8,000\text{m}$.

---

### 3.4. Class 4: `WILDFIRE` (Forest Canopy & Vegetative Fires)
* **Definition:** Advancing biomass fires, canopy blazes, and scrubland wildfires occurring across protected forest reserves, national parks, and wildland corridors.
* **Decision Criteria:**
  * Located inside a protected Forest Reserve, Tiger Reserve, or Biosphere Corridor.
  * Absence of registered industrial infrastructure within $15\text{km}$.
  * Radiative intensity characteristic of vegetative biomass combustion ($\text{FRP} \ge 20.0\text{ MW}$) and elevated brightness temperature ($T_b \ge 330.0\text{ K}$).
  * Geographically moving/advancing fire front across consecutive daily overpasses.
* **Confidence Level:** `HIGH` if $\text{FRP} \ge 20.0\text{ MW}$ or sensor confidence is `high`.

---

### 3.5. Class 5: `PERSISTENT_INDUSTRIAL` (Process Heat at Plants)
* **Definition:** High-temperature continuous industrial process heat from blast furnaces, coke oven batteries, calcination kilns, and thermal boiler units.
* **Decision Criteria:**
  * Distance to registered integrated steel plant, super thermal power station, aluminium smelter, or cement plant $\le 6,500\text{ meters}$.
  * **OR** an unregistered persistent cluster with $\ge 3$ active observation days and stable $\text{FRP} \ge 14.0\text{ MW}$ at fixed coordinates (flags unlicensed industrial operations).
* **Confidence Level:** `HIGH` if active days $\ge 3$ or distance $\le 4,000\text{m}$.

---

### 3.6. Class 6: `AGRICULTURAL_BURNING` (Crop Stubble Residue)
* **Definition:** Short-lived, seasonal open-field burning of post-harvest crop residue (paddy/wheat stubble, sugarcane trash) across agricultural basins.
* **Decision Criteria:**
  * Located inside one of India's 11 designated agrarian crop basins.
  * Short-lived transient persistence: active for only $1$ or $2$ observation days per parcel.
  * Low-to-moderate thermal radiance ($\text{FRP} \le 35.0\text{ MW}$).
  * Zero spatial intersection with industrial or mining asset perimeters.
* **Confidence Level:** `HIGH` if active days $\le 2$ and $\text{FRP} \le 35.0\text{ MW}$.

---

### 3.7. Class 7: `UNCLASSIFIED` (Ambiguous Isolated Telemetry)
* **Definition:** Rare isolated satellite thermal pixels lacking sufficient spatial proximity, recurrence, or context for definitive attribution.
* **Decision Criteria:** Single isolated observation day in unassigned scrubland/barren terrain without industrial or agro context.
* **Confidence Level:** `LOW`.
* **Action:** Flagged for satellite revisit watch without issuing disruptive regulatory alerts.

---

## 4. Multi-Factor Confidence Scoring Model

Every detection is scored across four independent dimensions:

$$\text{Confidence} = f(\text{Spatial Proximity}, \text{Temporal Persistence}, \text{Sensor Quality}, \text{Radiance Conformity})$$

| Confidence Level | Spatial Proximity ($d$) | Persistence ($N_{\text{days}}$) | Satellite Sensor Quality | Profile Fit |
| :--- | :--- | :--- | :--- | :--- |
| **`HIGH`** | $d \le 4.0\text{ km}$ to asset | $N \ge 3$ active days | VIIRS 375m High Confidence | $\text{FRP}$ perfectly matches operational baseline |
| **`MEDIUM`** | $4.0\text{ km} < d \le 8.5\text{ km}$ | $N = 2$ active days | VIIRS Nominal / MODIS | $\text{FRP}$ within typical regional boundary |
| **`LOW`** | $d > 8.5\text{ km}$ (Unassigned) | $N = 1$ isolated day | Edge of scan / Low confidence | Telemetry exhibits ambiguous radiance |

---

## 5. Indian Asset & Regional Corridor Registry

The platform maintains a curated database of **40+ critical industrial and environmental assets** across India:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 INDIAN ASSET REGISTRY SUMMARY                                    │
├──────────────────────────┬───────┬───────────────────────────────────────────────────────────────┤
│ Asset Category           │ Count │ Representative Facilities / Regions                           │
├──────────────────────────┼───────┼───────────────────────────────────────────────────────────────┤
│ Refineries & LNG Hubs    │ 16+   │ Jamnagar (RIL), Vadinar, Hazira, Dahej LNG, Panipat, Paradip  │
│ Integrated Steel Mills   │ 11+   │ Tata Steel Jamshedpur & Kalinganagar, Rourkela, Bokaro, JSW   │
│ Super Thermal Power Hubs │ 9+    │ Mundra Ultra Mega, Singrauli (NTPC), Vindhyachal, Korba, Sasan│
│ Major Mining Basins      │ 9+    │ Jharia Coalfield, Korba Basins, Raniganj, Singrauli, Keonjhar │
│ Cement Hubs & Kilns      │ 5+    │ Satna-Maihar, Wadi-Gulbarga, Chandrapur-Gadchandur, Ariyalur  │
│ Forest Biospheres        │ 7+    │ Bandhavgarh, Similipal, Corbett Terai, Kanha, Nilgiris, Gir   │
│ Agrarian Crop Basins     │ 11    │ Punjab-Haryana, Upper Gangetic (UP), Kaveri Delta, Deccan     │
│ Forest Corridors         │ 6     │ Central Indian Belt, Western Ghats, Eastern Ghats, Terai      │
└──────────────────────────┴───────┴───────────────────────────────────────────────────────────────┘
```

---

## 6. Live Verification & Benchmark Results

### 6.1. Live NASA Satellite Telemetry (India Window)
* **Total Live Ingested Hotspots:** 275 orbital detections
* **Categorized Detections:** 262 (95.3% classified)
* **Unclassified Telemetry:** 13 (4.7% — Target achieved $< 5\%$)
* **Breakdown:**
  * `AGRICULTURAL_BURNING`: 224 (81.5%)
  * `PERSISTENT_INDUSTRIAL`: 16 (5.8%)
  * `WILDFIRE`: 16 (5.8%)
  * `GAS_FLARE`: 3 (1.1%) *(Hazira Petrochemicals)*
  * `MINING_ACTIVITY`: 3 (1.1%) *(Raniganj & Jharia basins)*
  * `UNCLASSIFIED`: 13 (4.7%)

### 6.2. Deterministic Scenario Benchmark (Seed `26162`)
* **Total Benchmark Records:** 80 detections over 30 days
* **Coverage:** 100% of all 7 problem statement classes represented:
  * `GAS_FLARE`: 29 records (Jamnagar operational baseline)
  * `PERSISTENT_INDUSTRIAL`: 18 records (Tata Steel continuous furnaces)
  * `MINING_ACTIVITY`: 12 records (Jharia coalfield seam fires)
  * `AGRICULTURAL_BURNING`: 12 records (Punjab transient stubble parcels)
  * `WILDFIRE`: 7 records (Bandhavgarh expanding forest fire front)
  * `INDUSTRIAL_FIRE`: 1 record (Day 29 $124.8\text{ MW}$ critical excursion spike)
  * `UNCLASSIFIED`: 1 record (Isolated Deccan plateau check point)

---

## 7. Sample Explainable API & Popup Response

Every telemetry point returns a transparent, human-readable rationale:

```json
{
  "hotspot_id": "VIIRS-SNPP-IND-2026-08-29-01",
  "classification": "GAS_FLARE",
  "confidence_level": "HIGH",
  "facility_name": "Hazira Petrochemical Complex (RIL / ONGC)",
  "facility_type": "refinery_gas",
  "distance_to_facility_m": 1850.4,
  "frp": 24.5,
  "brightness_temp": 341.2,
  "active_days": 3,
  "risk_score": 58.4,
  "risk_level": "medium",
  "inspection_priority": "routine",
  "explanation": "Classified as GAS_FLARE because hotspot is within 1.9 km of Hazira Petrochemical Complex and exhibits stable flaring coordinates.",
  "reasons": [
    "Located within 1.9 km of Hazira Petrochemical Complex (Petrochemicals & Gas Processing)",
    "Stable geographic coordinates consistent with elevated flare stack",
    "Persistent operational thermal signature across 3 active observation day(s)",
    "Steady-state radiative power of 24.5 MW within normal operational flaring envelope",
    "Continuous 24/7 flaring profile with nighttime detection"
  ]
}
```
