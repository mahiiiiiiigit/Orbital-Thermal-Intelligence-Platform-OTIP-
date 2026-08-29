"""
Comprehensive Indian Industrial, Mining, Agricultural, and Environmental Asset Registry.
Covers major Indian thermal sources across:
- Oil Refineries, Petrochemical complexes, and LNG import terminals (Gas Flares)
- Heavy Metallurgical Works (Steel plants, Aluminum smelters, Industrial furnaces)
- Thermal Power Generation Hubs (Super Thermal Power Plants, Lignite plants)
- Major Mining Basins (Coalfields, Coal seam combustion zones, Iron ore surface mining)
- Major Cement Production Hubs (Kilns and calcination clusters)
- Forest Reserves & Biosphere Canopies (Wildfire baselines)
- Designated Agrarian Crop Basins (Agricultural stubble burning zones)
"""

from typing import Any, Dict, List, Optional, Tuple
from backend.analytics.spatial import distance_metres


KNOWN_FACILITIES: List[Dict[str, Any]] = [
    # =========================================================================
    # 1. OIL REFINERIES, PETROCHEMICALS & LNG TERMINALS (GAS FLARE SOURCES)
    # =========================================================================
    {
        "facility_id": "jamnagar-refinery",
        "name": "Jamnagar Refinery (RIL)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery & Petrochemicals",
        "has_flares": True,
        "state": "Gujarat",
        "latitude": 22.4700,
        "longitude": 70.0600,
        "radius_meters": 7500,
        "expected_baseline_frp": 25.0,
    },
    {
        "facility_id": "vadinar-refinery",
        "name": "Vadinar Refinery (Nayara Energy)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery",
        "has_flares": True,
        "state": "Gujarat",
        "latitude": 22.3800,
        "longitude": 69.7500,
        "radius_meters": 6500,
        "expected_baseline_frp": 22.0,
    },
    {
        "facility_id": "hazira-petrochem",
        "name": "Hazira Petrochemical Complex (RIL / ONGC)",
        "facility_type": "refinery_gas",
        "category": "Petrochemicals & Gas Processing",
        "has_flares": True,
        "state": "Gujarat",
        "latitude": 21.1200,
        "longitude": 72.6500,
        "radius_meters": 7000,
        "expected_baseline_frp": 24.0,
    },
    {
        "facility_id": "dahej-petrochem-lng",
        "name": "Dahej Petrochemical & LNG Terminal",
        "facility_type": "refinery_gas",
        "category": "LNG Terminal & Chemical Processing",
        "has_flares": True,
        "state": "Gujarat",
        "latitude": 21.7100,
        "longitude": 72.5300,
        "radius_meters": 6500,
        "expected_baseline_frp": 20.0,
    },
    {
        "facility_id": "panipat-refinery",
        "name": "Panipat Refinery & Petrochem (IOCL)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery & Petrochemicals",
        "has_flares": True,
        "state": "Haryana",
        "latitude": 29.3900,
        "longitude": 76.9700,
        "radius_meters": 6000,
        "expected_baseline_frp": 20.0,
    },
    {
        "facility_id": "paradip-refinery",
        "name": "Paradip Refinery & Petrochem (IOCL)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery & Petrochemicals",
        "has_flares": True,
        "state": "Odisha",
        "latitude": 20.2800,
        "longitude": 86.6700,
        "radius_meters": 6500,
        "expected_baseline_frp": 22.0,
    },
    {
        "facility_id": "bhatinda-refinery",
        "name": "Guru Gobind Singh Refinery (HMEL Bhatinda)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery",
        "has_flares": True,
        "state": "Punjab",
        "latitude": 30.0300,
        "longitude": 74.9300,
        "radius_meters": 6000,
        "expected_baseline_frp": 20.0,
    },
    {
        "facility_id": "mumbai-refineries-hub",
        "name": "Mahul Refineries Complex (BPCL / HPCL Mumbai)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery & Petrochemicals",
        "has_flares": True,
        "state": "Maharashtra",
        "latitude": 19.0100,
        "longitude": 72.8900,
        "radius_meters": 5500,
        "expected_baseline_frp": 22.0,
    },
    {
        "facility_id": "bina-refinery",
        "name": "Bharat Oman Refineries Bina (BPCL)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery",
        "has_flares": True,
        "state": "Madhya Pradesh",
        "latitude": 24.1600,
        "longitude": 78.1800,
        "radius_meters": 6000,
        "expected_baseline_frp": 20.0,
    },
    {
        "facility_id": "mathura-refinery",
        "name": "Mathura Refinery (IOCL)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery",
        "has_flares": True,
        "state": "Uttar Pradesh",
        "latitude": 27.3800,
        "longitude": 77.7100,
        "radius_meters": 5500,
        "expected_baseline_frp": 18.0,
    },
    {
        "facility_id": "haldia-refinery-petrochem",
        "name": "Haldia Refinery & Petrochemicals Complex",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery & Petrochemicals",
        "has_flares": True,
        "state": "West Bengal",
        "latitude": 22.0600,
        "longitude": 88.0800,
        "radius_meters": 6000,
        "expected_baseline_frp": 22.0,
    },
    {
        "facility_id": "kochi-refinery",
        "name": "Kochi Refinery (BPCL)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery",
        "has_flares": True,
        "state": "Kerala",
        "latitude": 9.9500,
        "longitude": 76.3600,
        "radius_meters": 5500,
        "expected_baseline_frp": 18.0,
    },
    {
        "facility_id": "vizag-refinery",
        "name": "Visakh Refinery (HPCL)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery",
        "has_flares": True,
        "state": "Andhra Pradesh",
        "latitude": 17.7000,
        "longitude": 83.2500,
        "radius_meters": 5500,
        "expected_baseline_frp": 18.0,
    },
    {
        "facility_id": "mrpl-mangalore",
        "name": "Mangalore Refinery and Petrochemicals (MRPL)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery",
        "has_flares": True,
        "state": "Karnataka",
        "latitude": 12.9900,
        "longitude": 74.8300,
        "radius_meters": 5500,
        "expected_baseline_frp": 20.0,
    },
    {
        "facility_id": "numaligarh-refinery",
        "name": "Numaligarh Refinery (NRL)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery",
        "has_flares": True,
        "state": "Assam",
        "latitude": 26.5600,
        "longitude": 93.7700,
        "radius_meters": 5500,
        "expected_baseline_frp": 18.0,
    },
    {
        "facility_id": "cpcl-chennai-refinery",
        "name": "Manali Refinery (CPCL Chennai)",
        "facility_type": "refinery_gas",
        "category": "Petroleum Refinery & Petrochemicals",
        "has_flares": True,
        "state": "Tamil Nadu",
        "latitude": 13.1600,
        "longitude": 80.2700,
        "radius_meters": 5500,
        "expected_baseline_frp": 18.0,
    },

    # =========================================================================
    # 2. INTEGRATED STEEL PLANTS & ALUMINUM SMELTERS (PERSISTENT INDUSTRIAL)
    # =========================================================================
    {
        "facility_id": "tata-steel-jamshedpur",
        "name": "Tata Steel Works Jamshedpur",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Jharkhand",
        "latitude": 22.8000,
        "longitude": 86.2000,
        "radius_meters": 6500,
        "expected_baseline_frp": 35.0,
    },
    {
        "facility_id": "tata-steel-kalinganagar",
        "name": "Tata Steel Kalinganagar Plant",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Odisha",
        "latitude": 20.9600,
        "longitude": 86.0100,
        "radius_meters": 6500,
        "expected_baseline_frp": 32.0,
    },
    {
        "facility_id": "rourkela-steel",
        "name": "Rourkela Steel Plant (SAIL)",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Odisha",
        "latitude": 22.2500,
        "longitude": 84.8600,
        "radius_meters": 6500,
        "expected_baseline_frp": 32.0,
    },
    {
        "facility_id": "bokaro-steel",
        "name": "Bokaro Steel Plant (SAIL)",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Jharkhand",
        "latitude": 23.6700,
        "longitude": 86.1700,
        "radius_meters": 6500,
        "expected_baseline_frp": 30.0,
    },
    {
        "facility_id": "bhilai-steel",
        "name": "Bhilai Steel Plant (SAIL)",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Chhattisgarh",
        "latitude": 21.2000,
        "longitude": 81.4000,
        "radius_meters": 6500,
        "expected_baseline_frp": 30.0,
    },
    {
        "facility_id": "vizag-steel",
        "name": "Visakhapatnam Steel Plant (RINL)",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Andhra Pradesh",
        "latitude": 17.6300,
        "longitude": 83.1800,
        "radius_meters": 6500,
        "expected_baseline_frp": 28.0,
    },
    {
        "facility_id": "durgapur-steel",
        "name": "Durgapur Steel Plant (SAIL)",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "West Bengal",
        "latitude": 23.5100,
        "longitude": 87.3200,
        "radius_meters": 6000,
        "expected_baseline_frp": 28.0,
    },
    {
        "facility_id": "jsw-vijayanagar-steel",
        "name": "JSW Steel Vijayanagar Complex (Toranagallu)",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Karnataka",
        "latitude": 15.1800,
        "longitude": 76.6700,
        "radius_meters": 7000,
        "expected_baseline_frp": 34.0,
    },
    {
        "facility_id": "jsw-dolvi-steel",
        "name": "JSW Steel Dolvi Works",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Maharashtra",
        "latitude": 18.7100,
        "longitude": 73.0400,
        "radius_meters": 6000,
        "expected_baseline_frp": 28.0,
    },
    {
        "facility_id": "jspl-angul-steel",
        "name": "Jindal Steel & Power Angul Plant",
        "facility_type": "heavy_industry",
        "category": "Integrated Steel Plant",
        "has_flares": False,
        "state": "Odisha",
        "latitude": 20.8400,
        "longitude": 85.0800,
        "radius_meters": 6500,
        "expected_baseline_frp": 32.0,
    },
    {
        "facility_id": "vedanta-jharsuguda-smelter",
        "name": "Vedanta Aluminium Smelter Jharsuguda",
        "facility_type": "heavy_industry",
        "category": "Aluminum Smelter & Power Complex",
        "has_flares": False,
        "state": "Odisha",
        "latitude": 21.8200,
        "longitude": 84.0500,
        "radius_meters": 6500,
        "expected_baseline_frp": 30.0,
    },
    {
        "facility_id": "hindalco-renukoot-smelter",
        "name": "Hindalco Aluminum Smelter Renukoot",
        "facility_type": "heavy_industry",
        "category": "Aluminum Smelter",
        "has_flares": False,
        "state": "Uttar Pradesh",
        "latitude": 24.2000,
        "longitude": 83.0300,
        "radius_meters": 5500,
        "expected_baseline_frp": 26.0,
    },

    # =========================================================================
    # 3. THERMAL POWER HUBS & MEGA PLANTS (PERSISTENT INDUSTRIAL)
    # =========================================================================
    {
        "facility_id": "mundra-thermal-power",
        "name": "Mundra Ultra Mega Power Plant (Adani / Tata)",
        "facility_type": "heavy_industry",
        "category": "Thermal Power Generation",
        "has_flares": False,
        "state": "Gujarat",
        "latitude": 22.8200,
        "longitude": 69.5200,
        "radius_meters": 6500,
        "expected_baseline_frp": 32.0,
    },
    {
        "facility_id": "singrauli-power-hub",
        "name": "Singrauli Super Thermal Power Hub (NTPC Shaktinagar)",
        "facility_type": "heavy_industry",
        "category": "Thermal Power Generation",
        "has_flares": False,
        "state": "Uttar Pradesh / MP",
        "latitude": 24.1200,
        "longitude": 82.7000,
        "radius_meters": 7500,
        "expected_baseline_frp": 35.0,
    },
    {
        "facility_id": "vindhyachal-ntpc-power",
        "name": "Vindhyachal Super Thermal Power Station (NTPC)",
        "facility_type": "heavy_industry",
        "category": "Thermal Power Generation",
        "has_flares": False,
        "state": "Madhya Pradesh",
        "latitude": 24.1000,
        "longitude": 82.6700,
        "radius_meters": 7000,
        "expected_baseline_frp": 35.0,
    },
    {
        "facility_id": "korba-thermal-power",
        "name": "Korba Super Thermal Power Plant (NTPC)",
        "facility_type": "heavy_industry",
        "category": "Thermal Power Generation",
        "has_flares": False,
        "state": "Chhattisgarh",
        "latitude": 22.3800,
        "longitude": 82.6800,
        "radius_meters": 6500,
        "expected_baseline_frp": 30.0,
    },
    {
        "facility_id": "sasan-ultra-mega-power",
        "name": "Sasan Ultra Mega Power Project (Reliance Power)",
        "facility_type": "heavy_industry",
        "category": "Thermal Power Generation",
        "has_flares": False,
        "state": "Madhya Pradesh",
        "latitude": 23.9700,
        "longitude": 82.6200,
        "radius_meters": 6500,
        "expected_baseline_frp": 32.0,
    },
    {
        "facility_id": "talcher-thermal-power",
        "name": "Talcher Super Thermal Power Station (NTPC Kaniha)",
        "facility_type": "heavy_industry",
        "category": "Thermal Power Generation",
        "has_flares": False,
        "state": "Odisha",
        "latitude": 21.0800,
        "longitude": 85.0700,
        "radius_meters": 6500,
        "expected_baseline_frp": 30.0,
    },
    {
        "facility_id": "ramagundam-thermal-power",
        "name": "Ramagundam Super Thermal Power Station (NTPC)",
        "facility_type": "heavy_industry",
        "category": "Thermal Power Generation",
        "has_flares": False,
        "state": "Telangana",
        "latitude": 18.7600,
        "longitude": 79.4500,
        "radius_meters": 6500,
        "expected_baseline_frp": 30.0,
    },
    {
        "facility_id": "chandrapur-thermal-power",
        "name": "Chandrapur Super Thermal Power Station (CSTPS)",
        "facility_type": "heavy_industry",
        "category": "Thermal Power Generation",
        "has_flares": False,
        "state": "Maharashtra",
        "latitude": 19.9800,
        "longitude": 79.2900,
        "radius_meters": 6500,
        "expected_baseline_frp": 30.0,
    },
    {
        "facility_id": "neyveli-lignite-power",
        "name": "Neyveli Lignite Thermal Power Complex (NLC)",
        "facility_type": "heavy_industry",
        "category": "Lignite Thermal Power Generation",
        "has_flares": False,
        "state": "Tamil Nadu",
        "latitude": 11.5500,
        "longitude": 79.4800,
        "radius_meters": 7000,
        "expected_baseline_frp": 28.0,
    },

    # =========================================================================
    # 4. MAJOR COALFIELDS & MINING BASINS (MINING ACTIVITY)
    # =========================================================================
    {
        "facility_id": "jharia-coalfield",
        "name": "Jharia Coalfield & Seam Fire Zone (Dhanbad)",
        "facility_type": "mining",
        "category": "Coal Mining & Underground Coal Seam Combustion",
        "has_flares": False,
        "state": "Jharkhand",
        "latitude": 23.7500,
        "longitude": 86.4200,
        "radius_meters": 12000,
        "expected_baseline_frp": 28.0,
    },
    {
        "facility_id": "korba-coalfields",
        "name": "Korba Open-cast Coal Basin (Gevra / Dipka / Kusmunda)",
        "facility_type": "mining",
        "category": "Open-cast Coal Mining & Washeries",
        "has_flares": False,
        "state": "Chhattisgarh",
        "latitude": 22.3500,
        "longitude": 82.7100,
        "radius_meters": 13000,
        "expected_baseline_frp": 25.0,
    },
    {
        "facility_id": "raniganj-coalfield",
        "name": "Raniganj Coalfield Basin (Asansol)",
        "facility_type": "mining",
        "category": "Coal Mining Basin",
        "has_flares": False,
        "state": "West Bengal",
        "latitude": 23.6200,
        "longitude": 87.1200,
        "radius_meters": 11000,
        "expected_baseline_frp": 22.0,
    },
    {
        "facility_id": "singrauli-coal-mines",
        "name": "Singrauli Open-cast Coal Belt (NCL Jayant / Nigahi)",
        "facility_type": "mining",
        "category": "Open-cast Coal Mining",
        "has_flares": False,
        "state": "Madhya Pradesh / UP",
        "latitude": 24.1800,
        "longitude": 82.6000,
        "radius_meters": 12000,
        "expected_baseline_frp": 25.0,
    },
    {
        "facility_id": "talcher-coalfield",
        "name": "Talcher Coal Basin (MCL Bhubaneswari / Ananta)",
        "facility_type": "mining",
        "category": "Open-cast Coal Mining",
        "has_flares": False,
        "state": "Odisha",
        "latitude": 20.9500,
        "longitude": 85.1500,
        "radius_meters": 12000,
        "expected_baseline_frp": 24.0,
    },
    {
        "facility_id": "north-karanpura-coalfield",
        "name": "North Karanpura Coalfield (Barkagaon / Piparwar)",
        "facility_type": "mining",
        "category": "Coal Mining Basin",
        "has_flares": False,
        "state": "Jharkhand",
        "latitude": 23.8500,
        "longitude": 85.0500,
        "radius_meters": 12000,
        "expected_baseline_frp": 22.0,
    },
    {
        "facility_id": "keonjhar-iron-mines",
        "name": "Keonjhar-Barbil Iron Ore Basin (Joda / Noamundi)",
        "facility_type": "mining",
        "category": "Iron Ore Surface Mining",
        "has_flares": False,
        "state": "Odisha / Jharkhand",
        "latitude": 21.8500,
        "longitude": 85.5000,
        "radius_meters": 14000,
        "expected_baseline_frp": 20.0,
    },
    {
        "facility_id": "bellary-hospet-iron-mines",
        "name": "Bellary-Hospet-Sandur Iron Ore Belt",
        "facility_type": "mining",
        "category": "Iron Ore Mining & Processing",
        "has_flares": False,
        "state": "Karnataka",
        "latitude": 15.1500,
        "longitude": 76.5500,
        "radius_meters": 13000,
        "expected_baseline_frp": 20.0,
    },
    {
        "facility_id": "bailadila-iron-mines",
        "name": "Bailadila Iron Ore Complex (NMDC Kirandul / Bacheli)",
        "facility_type": "mining",
        "category": "Open-cast Iron Ore Mining",
        "has_flares": False,
        "state": "Chhattisgarh",
        "latitude": 18.7000,
        "longitude": 81.2500,
        "radius_meters": 12000,
        "expected_baseline_frp": 20.0,
    },

    # =========================================================================
    # 5. MAJOR CEMENT PRODUCTION HUBS & KILNS (PERSISTENT INDUSTRIAL)
    # =========================================================================
    {
        "facility_id": "satna-cement-hub",
        "name": "Satna-Maihar Cement Corridor (Birla / Prism)",
        "facility_type": "heavy_industry",
        "category": "Cement Kilns & Lime Calcination",
        "has_flares": False,
        "state": "Madhya Pradesh",
        "latitude": 24.5800,
        "longitude": 80.8300,
        "radius_meters": 8000,
        "expected_baseline_frp": 22.0,
    },
    {
        "facility_id": "wadi-gulbarga-cement",
        "name": "Wadi-Gulbarga Cement Hub (ACC / UltraTech)",
        "facility_type": "heavy_industry",
        "category": "Cement Manufacturing & Kilns",
        "has_flares": False,
        "state": "Karnataka",
        "latitude": 17.0500,
        "longitude": 76.9800,
        "radius_meters": 8500,
        "expected_baseline_frp": 24.0,
    },
    {
        "facility_id": "chandrapur-cement-hub",
        "name": "Chandrapur-Gadchandur Cement Hub (Ambuja / UltraTech)",
        "facility_type": "heavy_industry",
        "category": "Cement Kilns & Clinker Units",
        "has_flares": False,
        "state": "Maharashtra",
        "latitude": 19.7200,
        "longitude": 79.1800,
        "radius_meters": 8500,
        "expected_baseline_frp": 24.0,
    },
    {
        "facility_id": "chittorgarh-cement-belt",
        "name": "Chittorgarh-Nimbahera Cement Belt (JK / Wonder)",
        "facility_type": "heavy_industry",
        "category": "Cement Clinker & Kilns",
        "has_flares": False,
        "state": "Rajasthan",
        "latitude": 24.8800,
        "longitude": 74.6300,
        "radius_meters": 8000,
        "expected_baseline_frp": 22.0,
    },
    {
        "facility_id": "ariyalur-cement-belt",
        "name": "Ariyalur-Dalmiapuram Cement Corridor (Ramco / Dalmia)",
        "facility_type": "heavy_industry",
        "category": "Cement Kilns & Calcination",
        "has_flares": False,
        "state": "Tamil Nadu",
        "latitude": 11.1400,
        "longitude": 79.0800,
        "radius_meters": 8000,
        "expected_baseline_frp": 22.0,
    },

    # =========================================================================
    # 6. PROTECTED FOREST RESERVES & BIOSPHERES (WILDFIRE BASES)
    # =========================================================================
    {
        "facility_id": "bandhavgarh-forest-reserve",
        "name": "Bandhavgarh Dense Forest Canopy",
        "facility_type": "forest",
        "category": "Dense Deciduous Forest Reserve",
        "has_flares": False,
        "state": "Madhya Pradesh",
        "latitude": 23.7000,
        "longitude": 81.0000,
        "radius_meters": 24000,
        "expected_baseline_frp": 0.0,
    },
    {
        "facility_id": "similipal-forest-reserve",
        "name": "Similipal National Park & Biosphere",
        "facility_type": "forest",
        "category": "Protected Forest & Wildlife Reserve",
        "has_flares": False,
        "state": "Odisha",
        "latitude": 21.6500,
        "longitude": 86.3500,
        "radius_meters": 25000,
        "expected_baseline_frp": 0.0,
    },
    {
        "facility_id": "corbett-forest-reserve",
        "name": "Jim Corbett Terai Forest Belt",
        "facility_type": "forest",
        "category": "Protected Terai Forest & Shrubland",
        "has_flares": False,
        "state": "Uttarakhand",
        "latitude": 29.5300,
        "longitude": 78.7700,
        "radius_meters": 22000,
        "expected_baseline_frp": 0.0,
    },
    {
        "facility_id": "kanha-forest-reserve",
        "name": "Kanha Sal & Bamboo Forest Canopy",
        "facility_type": "forest",
        "category": "Protected Tiger Reserve & Forest",
        "has_flares": False,
        "state": "Madhya Pradesh",
        "latitude": 22.3300,
        "longitude": 80.6100,
        "radius_meters": 25000,
        "expected_baseline_frp": 0.0,
    },
    {
        "facility_id": "nilgiri-biosphere-reserve",
        "name": "Nilgiris & Western Ghats Canopy",
        "facility_type": "forest",
        "category": "Tropical Evergreen Forest Reserve",
        "has_flares": False,
        "state": "Tamil Nadu / Kerala",
        "latitude": 11.5000,
        "longitude": 76.5000,
        "radius_meters": 28000,
        "expected_baseline_frp": 0.0,
    },
    {
        "facility_id": "gir-forest-reserve",
        "name": "Gir Forest & National Park",
        "facility_type": "forest",
        "category": "Dry Deciduous Forest Reserve",
        "has_flares": False,
        "state": "Gujarat",
        "latitude": 21.1500,
        "longitude": 70.8000,
        "radius_meters": 22000,
        "expected_baseline_frp": 0.0,
    },
    {
        "facility_id": "sundarbans-mangrove-forest",
        "name": "Sundarbans Biosphere & Mangroves",
        "facility_type": "forest",
        "category": "Mangrove Forest Reserve",
        "has_flares": False,
        "state": "West Bengal",
        "latitude": 21.9500,
        "longitude": 88.8500,
        "radius_meters": 25000,
        "expected_baseline_frp": 0.0,
    },
]


# =============================================================================
# GEOGRAPHICAL REGION BOUNDING BOXES FOR HEURISTIC ATTRIBUTION
# =============================================================================

# Known prominent agrarian crop basins in India
AGRO_REGIONS = [
    # Punjab, Haryana, and NCR agro belt
    {"name": "Punjab-Haryana Cropland Basin", "min_lat": 28.0, "max_lat": 32.5, "min_lon": 74.0, "max_lon": 78.0},
    # Indus & Western Border Agrarian Basin (Punjab/Rajasthan/Indus)
    {"name": "Indus & Western Agrarian Basin", "min_lat": 25.0, "max_lat": 34.0, "min_lon": 68.0, "max_lon": 74.5},
    # Western & Central Uttar Pradesh Gangetic Plains
    {"name": "Upper Gangetic Cropland Belt (UP)", "min_lat": 25.5, "max_lat": 29.5, "min_lon": 77.5, "max_lon": 82.5},
    # Eastern UP and Bihar fertile agricultural basin
    {"name": "Middle Gangetic Cropland Basin (UP/Bihar)", "min_lat": 24.5, "max_lat": 27.5, "min_lon": 82.5, "max_lon": 88.0},
    # Madhya Pradesh Malwa & Nimar agro belt
    {"name": "Malwa-Nimar Agrarian Basin (MP)", "min_lat": 21.5, "max_lat": 24.5, "min_lon": 74.5, "max_lon": 78.5},
    # Rajasthan canal & Western arid agricultural zone
    {"name": "Rajasthan Canal & Western Agrarian Basin", "min_lat": 24.0, "max_lat": 30.5, "min_lon": 69.5, "max_lon": 76.5},
    # Southern Peninsula, Tamil Nadu, Sri Lanka & Kaveri Delta agrarian belt
    {"name": "Southern Peninsula & Kaveri Cropland Basin", "min_lat": 6.5, "max_lat": 14.5, "min_lon": 76.5, "max_lon": 82.5},
    # Coastal Andhra & Kaveri Delta paddy basins
    {"name": "Krishna-Godavari / Kaveri Coastal Delta", "min_lat": 14.5, "max_lat": 18.5, "min_lon": 79.0, "max_lon": 83.5},
    # Gujarat Saurashtra & Central agrarian belt (excluding coastline)
    {"name": "Gujarat Agricultural Plains", "min_lat": 21.0, "max_lat": 24.0, "min_lon": 70.8, "max_lon": 73.8},
    # Telangana & North Karnataka Deccan paddy & cotton basin
    {"name": "Deccan Agricultural Basin (Telangana/Karnataka/MH)", "min_lat": 15.0, "max_lat": 21.5, "min_lon": 74.0, "max_lon": 80.5},
    # Odisha & West Bengal fertile delta croplands
    {"name": "Bengal-Odisha Coastal Cropland Basin", "min_lat": 19.5, "max_lat": 24.5, "min_lon": 85.5, "max_lon": 88.8},
]

# Known dense forest & wildland corridors in India
FOREST_REGIONS = [
    # Central Indian Deciduous Forest Belt (Satpura, Maikal, Vindhya ranges)
    {"name": "Central Indian Forest Corridor (MP/CG)", "min_lat": 21.5, "max_lat": 24.5, "min_lon": 79.0, "max_lon": 83.5},
    # Western Ghats Rainforest & Montane Corridor
    {"name": "Western Ghats Forest Belt", "min_lat": 8.0, "max_lat": 18.0, "min_lon": 73.5, "max_lon": 77.5},
    # Eastern Ghats & Odisha Jungle Highlands
    {"name": "Eastern Ghats Jungle Highlands (Odisha/AP)", "min_lat": 17.5, "max_lat": 21.5, "min_lon": 81.5, "max_lon": 85.5},
    # Northeast India Hill Canopy & Rainforests
    {"name": "Northeast Hill Forest Reserve (Assam/Arunachal/Meghalaya)", "min_lat": 24.5, "max_lat": 28.5, "min_lon": 89.5, "max_lon": 96.5},
    # Terai-Dooars Himalayan Foothills Forest
    {"name": "Himalayan Foothills Terai Canopy (UK/WB)", "min_lat": 26.5, "max_lat": 30.0, "min_lon": 78.0, "max_lon": 89.0},
    # Southern Dry Forest Canopy & Biosphere
    {"name": "Southern Dry Forest & Scrub Canopy", "min_lat": 6.5, "max_lat": 10.0, "min_lon": 80.0, "max_lon": 82.0},
]


def match_facility(
    latitude: float,
    longitude: float,
    custom_facilities: Optional[List[Dict[str, Any]]] = None,
) -> Tuple[Optional[Dict[str, Any]], Optional[str], str, Optional[float]]:
    """
    Spatially correlates a thermal coordinate to:
    1. Known registered industrial assets, refineries, power plants, steel mills, mining basins, and forest reserves.
    2. Regional agrarian crop basins.
    3. Regional forested wildland corridors.

    Returns:
        (facility_dict, facility_name, context, distance_to_facility_meters)
    """
    point = {"latitude": latitude, "longitude": longitude}
    facilities = custom_facilities if custom_facilities is not None else KNOWN_FACILITIES

    closest_facility: Optional[Dict[str, Any]] = None
    min_distance = float("inf")

    # 1. Exact spatial proximity buffer matching against KNOWN_FACILITIES
    for facility in facilities:
        dist = distance_metres(
            point,
            {"latitude": facility["latitude"], "longitude": facility["longitude"]},
        )
        threshold = facility.get("radius_meters", 6000)
        if dist <= threshold and dist < min_distance:
            min_distance = dist
            closest_facility = facility

    if closest_facility:
        f_type = closest_facility.get("facility_type", "industrial")
        if f_type in ("refinery_gas", "heavy_industry"):
            context = "industrial"
        elif f_type == "mining":
            context = "mining"
        elif f_type == "forest":
            context = "forest"
        else:
            context = "industrial"

        return (
            closest_facility,
            closest_facility["name"],
            context,
            round(min_distance, 1),
        )

    # 2. Regional Agrarian Crop Basin match
    for region in AGRO_REGIONS:
        if region["min_lat"] <= latitude <= region["max_lat"] and region["min_lon"] <= longitude <= region["max_lon"]:
            return (
                {"category": "Agricultural Cropland Basin", "region_name": region["name"], "facility_type": "agricultural"},
                None,
                "agricultural",
                None,
            )

    # 3. Regional Forested Wildland Corridor match
    for region in FOREST_REGIONS:
        if region["min_lat"] <= latitude <= region["max_lat"] and region["min_lon"] <= longitude <= region["max_lon"]:
            return (
                {"category": "Protected Forest & Wildland Canopy", "region_name": region["name"], "facility_type": "forest"},
                None,
                "forest",
                None,
            )

    return (None, None, "unassigned", None)
