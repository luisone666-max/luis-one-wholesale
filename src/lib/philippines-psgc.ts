import { getAddressOptions, philippinesProvinces } from "@/lib/philippines-addresses";

export type PsgcAddressKind = "region" | "province" | "city" | "municipality" | "barangay";

export type PsgcAddressOption = {
  code: string;
  label: string;
  value: string;
  kind: PsgcAddressKind;
  parentCode?: string;
};

type PsgcProvince = {
  code: string;
  name: string;
  regionCode?: string | false;
};

type PsgcCityMunicipality = {
  code: string;
  name: string;
  isCity?: boolean;
  isMunicipality?: boolean;
  provinceCode?: string | false;
  regionCode?: string | false;
};

type PsgcBarangay = {
  code: string;
  name: string;
  cityCode?: string | false;
  municipalityCode?: string | false;
};

const psgcApiBaseUrl = (process.env.PSGC_API_BASE_URL ?? "https://psgc.gitlab.io/api").replace(/\/+$/, "");
const metroManilaOption: PsgcAddressOption = {
  code: "130000000",
  label: "Metro Manila",
  value: "METRO-MANILA",
  kind: "region",
};

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function toCheckoutAddressValue(value: string) {
  const normalized = stripDiacritics(value)
    .replace(/^CITY OF\s+/i, "")
    .replace(/^PROVINCE OF\s+/i, "")
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

function toLabel(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function toOption(record: PsgcProvince | PsgcCityMunicipality | PsgcBarangay, kind: PsgcAddressKind, parentCode?: string): PsgcAddressOption {
  return {
    code: record.code,
    label: record.name,
    value: toCheckoutAddressValue(record.name),
    kind,
    parentCode,
  };
}

function sortOptions(options: PsgcAddressOption[]) {
  return options.sort((first, second) => first.label.localeCompare(second.label));
}

async function fetchPsgc<T>(path: string): Promise<T[]> {
  const response = await fetch(`${psgcApiBaseUrl}${path}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!response.ok) {
    throw new Error(`PSGC request failed: ${response.status}`);
  }

  const data = (await response.json()) as T[];
  return Array.isArray(data) ? data : [];
}

export function getFallbackProvinceOptions(): PsgcAddressOption[] {
  return philippinesProvinces.map((province) => ({
    code: province,
    label: toLabel(province),
    value: province,
    kind: province === "METRO-MANILA" ? "region" : "province",
  }));
}

export function getFallbackCityOptions(province: string): PsgcAddressOption[] {
  return getAddressOptions(province, "").cities.map((city) => ({
    code: `${province}:${city}`,
    label: toLabel(city),
    value: city,
    kind: "city",
    parentCode: province,
  }));
}

export function getFallbackBarangayOptions(city: string): PsgcAddressOption[] {
  return getAddressOptions("", city).barangays.map((barangay) => ({
    code: `${city}:${barangay}`,
    label: toLabel(barangay),
    value: barangay,
    kind: "barangay",
    parentCode: city,
  }));
}

export async function getPsgcProvinceOptions() {
  const provinces = await fetchPsgc<PsgcProvince>("/provinces/");
  const options = provinces.map((province) => toOption(province, "province", province.regionCode || undefined));
  return [metroManilaOption, ...sortOptions(options)];
}

export async function getPsgcCityOptions(parentCode: string, parentKind: string) {
  const path = parentKind === "region" ? `/regions/${encodeURIComponent(parentCode)}/cities-municipalities/` : `/provinces/${encodeURIComponent(parentCode)}/cities-municipalities/`;
  const cities = await fetchPsgc<PsgcCityMunicipality>(path);

  return sortOptions(
    cities.map((city) =>
      toOption(city, city.isMunicipality ? "municipality" : "city", (city.provinceCode || city.regionCode || parentCode) as string),
    ),
  );
}

export async function getPsgcBarangayOptions(parentCode: string) {
  const barangays = await fetchPsgc<PsgcBarangay>(`/cities-municipalities/${encodeURIComponent(parentCode)}/barangays/`);

  return sortOptions(
    barangays.map((barangay) => toOption(barangay, "barangay", (barangay.cityCode || barangay.municipalityCode || parentCode) as string)),
  );
}
