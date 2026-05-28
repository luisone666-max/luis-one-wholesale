export type CheckoutAddressDraft = {
  landmark: string;
  streetAddress: string;
  barangay: string;
  city: string;
  province: string;
  notes: string;
};

export const philippinesProvinces = [
  "METRO-MANILA",
  "ABRA",
  "AGUSAN-DEL-NORTE",
  "AGUSAN-DEL-SUR",
  "AKLAN",
  "ALBAY",
  "ANTIQUE",
  "APAYAO",
  "AURORA",
  "BASILAN",
  "BATAAN",
  "BATANES",
  "BATANGAS",
  "BENGUET",
  "BILIRAN",
  "BOHOL",
  "BUKIDNON",
  "BULACAN",
  "CAGAYAN",
  "CAMARINES-NORTE",
  "CAMARINES-SUR",
  "CAMIGUIN",
  "CAPIZ",
  "CATANDUANES",
  "CAVITE",
  "CEBU",
  "COTABATO",
  "DAVAO-DE-ORO",
  "DAVAO-DEL-NORTE",
  "DAVAO-DEL-SUR",
  "DAVAO-OCCIDENTAL",
  "DAVAO-ORIENTAL",
  "DINAGAT-ISLANDS",
  "EASTERN-SAMAR",
  "GUIMARAS",
  "IFUGAO",
  "ILOCOS-NORTE",
  "ILOCOS-SUR",
  "ILOILO",
  "ISABELA",
  "KALINGA",
  "LA-UNION",
  "LAGUNA",
  "LANAO-DEL-NORTE",
  "LANAO-DEL-SUR",
  "LEYTE",
  "MAGUINDANAO",
  "MARINDUQUE",
  "MASBATE",
  "MISAMIS-OCCIDENTAL",
  "MISAMIS-ORIENTAL",
  "MOUNTAIN-PROVINCE",
  "NEGROS-OCCIDENTAL",
  "NEGROS-ORIENTAL",
  "NORTHERN-SAMAR",
  "NUEVA-ECIJA",
  "NUEVA-VIZCAYA",
  "OCCIDENTAL-MINDORO",
  "ORIENTAL-MINDORO",
  "PALAWAN",
  "PAMPANGA",
  "PANGASINAN",
  "QUEZON",
  "QUIRINO",
  "RIZAL",
  "ROMBLON",
  "SARANGANI",
  "SIQUIJOR",
  "SORSOGON",
  "SOUTH-COTABATO",
  "SOUTHERN-LEYTE",
  "SULTAN-KUDARAT",
  "SULU",
  "SURIGAO-DEL-NORTE",
  "SURIGAO-DEL-SUR",
  "TARLAC",
  "TAWI-TAWI",
  "ZAMBALES",
  "ZAMBOANGA-DEL-NORTE",
  "ZAMBOANGA-DEL-SUR",
  "ZAMBOANGA-SIBUGAY",
] as const;

export const citiesByProvince: Record<string, string[]> = {
  "METRO-MANILA": [
    "BINONDO",
    "CALOOCAN",
    "ERMITA",
    "INTRAMUROS",
    "LAS-PINAS",
    "MAKATI",
    "MALABON-CITY",
    "MALATE",
    "MANDALUYONG",
    "MARIKINA",
    "METRO-MANILA-SAMPALOC",
    "METRO-MANILA-SAN-JUAN",
    "METRO-MANILA-SAN-MIGUEL",
    "METRO-MANILA-SAN-NICOLAS",
    "METRO-MANILA-SANTA-ANA",
    "METRO-MANILA-SANTA-MESA",
    "MUNTINLUPA",
    "NAVOTAS-CITY",
    "NORTH-CALOOCAN",
    "PACO",
    "PANDACAN",
    "PARANAQUE",
    "PASAY",
    "PASIG",
    "PATEROS",
    "PORT-AREA",
    "QUEZON-CITY",
    "QUIAPO",
    "SANTA-CRUZ",
    "STA-CRUZ-SOUTH",
    "TAGUIG",
    "TONDO I/II",
    "TONDO-NORTH",
    "VALENZUELA-CITY",
  ],
  BULACAN: ["BALIUAG", "BOCAUE", "MALOLOS", "MARILAO", "MEYCAUAYAN", "SAN-JOSE-DEL-MONTE", "SANTA-MARIA"],
  CAVITE: ["BACOOR", "CAVITE-CITY", "DASMARINAS", "GENERAL-TRIAS", "IMUS", "TAGAYTAY", "TRECE-MARTIRES"],
  LAGUNA: ["BINAN", "CALAMBA", "CABUYAO", "LOS-BANOS", "SAN-PABLO", "SAN-PEDRO", "SANTA-ROSA"],
  RIZAL: ["ANTIPOLO", "BINANGONAN", "CAINTA", "RODRIGUEZ", "SAN-MATEO", "TAYTAY"],
};

export const barangaysByCity: Record<string, string[]> = {
  "METRO-MANILA-SAN-MIGUEL": [
    "BARANGAY 637",
    "BARANGAY 638",
    "BARANGAY 639",
    "BARANGAY 640",
    "BARANGAY 641",
    "BARANGAY 642",
    "BARANGAY 643",
    "BARANGAY 644",
    "BARANGAY 645",
    "BARANGAY 646",
    "BARANGAY 647",
    "BARANGAY 648",
  ],
  MAKATI: ["BEL-AIR", "POBLACION", "SAN-ANTONIO", "SAN-LORENZO", "SANTA-CRUZ", "TEJEROS", "URDANETA"],
  "QUEZON-CITY": ["BAGO-BANTAY", "COMMONWEALTH", "CUBAO", "HOLY-SPIRIT", "NOVALICHES", "PAYATAS", "TATALON"],
  TAGUIG: ["BAGUMBAYAN", "BAMBANG", "FORT-BONIFACIO", "LOWER-BICUTAN", "PINAGSAMA", "USUSAN"],
  PASIG: ["KAPASIGAN", "MANGGAHAN", "ORTIGAS-CENTER", "ROSARIO", "SAN-ANTONIO", "UGONG"],
  MANILA: ["BINONDO", "ERMITA", "MALATE", "PACO", "PANDACAN", "QUIAPO", "SANTA-CRUZ", "TONDO"],
};

const nearbyLuzon = new Set(["BULACAN", "CAVITE", "LAGUNA", "RIZAL"]);
const visayas = new Set([
  "AKLAN",
  "ANTIQUE",
  "BILIRAN",
  "BOHOL",
  "CAPIZ",
  "CEBU",
  "EASTERN-SAMAR",
  "GUIMARAS",
  "ILOILO",
  "LEYTE",
  "NEGROS-OCCIDENTAL",
  "NEGROS-ORIENTAL",
  "NORTHERN-SAMAR",
  "SIQUIJOR",
  "SOUTHERN-LEYTE",
]);
const mindanao = new Set([
  "AGUSAN-DEL-NORTE",
  "AGUSAN-DEL-SUR",
  "BASILAN",
  "BUKIDNON",
  "CAMIGUIN",
  "COTABATO",
  "DAVAO-DE-ORO",
  "DAVAO-DEL-NORTE",
  "DAVAO-DEL-SUR",
  "DAVAO-OCCIDENTAL",
  "DAVAO-ORIENTAL",
  "DINAGAT-ISLANDS",
  "LANAO-DEL-NORTE",
  "LANAO-DEL-SUR",
  "MAGUINDANAO",
  "MISAMIS-OCCIDENTAL",
  "MISAMIS-ORIENTAL",
  "SARANGANI",
  "SOUTH-COTABATO",
  "SULTAN-KUDARAT",
  "SULU",
  "SURIGAO-DEL-NORTE",
  "SURIGAO-DEL-SUR",
  "TAWI-TAWI",
  "ZAMBOANGA-DEL-NORTE",
  "ZAMBOANGA-DEL-SUR",
  "ZAMBOANGA-SIBUGAY",
]);

export function normalizeAddressPart(value: string | null | undefined) {
  const normalized = (value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .toUpperCase();

  if (["NCR", "NATIONAL-CAPITAL-REGION", "METRO-MANILA"].includes(normalized)) {
    return "METRO-MANILA";
  }

  return normalized;
}

export function getAddressOptions(province: string, city: string) {
  const normalizedProvince = normalizeAddressPart(province);
  const normalizedCity = normalizeAddressPart(city);

  return {
    cities: citiesByProvince[normalizedProvince] ?? [],
    barangays: barangaysByCity[normalizedCity] ?? [],
  };
}

export function buildCompleteDeliveryAddress(address: CheckoutAddressDraft) {
  return [
    address.landmark,
    address.streetAddress,
    address.barangay,
    address.city,
    address.province,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

export function getShippingQuoteZone(province: string) {
  const normalizedProvince = normalizeAddressPart(province);

  if (!normalizedProvince) {
    return "";
  }

  if (normalizedProvince === "METRO-MANILA") {
    return "metro_manila";
  }

  if (nearbyLuzon.has(normalizedProvince)) {
    return "nearby_luzon";
  }

  if (visayas.has(normalizedProvince)) {
    return "visayas";
  }

  if (mindanao.has(normalizedProvince)) {
    return "mindanao";
  }

  return "luzon";
}

export function estimateCodShippingFee(province: string, itemCount: number) {
  const zone = getShippingQuoteZone(province);

  if (!zone) {
    return null;
  }

  const baseFeeByZone: Record<string, number> = {
    metro_manila: 38,
    nearby_luzon: 85,
    luzon: 120,
    visayas: 160,
    mindanao: 190,
  };
  const baseFee = baseFeeByZone[zone] ?? 120;
  const extraItemFee = Math.max(0, itemCount - 1) * 5;

  return baseFee + extraItemFee;
}
