import { NextResponse } from "next/server";
import {
  getFallbackBarangayOptions,
  getFallbackCityOptions,
  getFallbackProvinceOptions,
  getPsgcBarangayOptions,
  getPsgcCityOptions,
  getPsgcProvinceOptions,
  type PsgcAddressOption,
} from "@/lib/philippines-psgc";

type AddressLevel = "provinces" | "cities" | "barangays";
type AddressSource = "psgc" | "fallback";

function addressOptionsResponse(options: PsgcAddressOption[], source: AddressSource, message = "") {
  return NextResponse.json({
    ok: true,
    source,
    message,
    options,
  });
}

function getFallbackOptions(level: AddressLevel, parentValue: string) {
  if (level === "cities") {
    return getFallbackCityOptions(parentValue);
  }

  if (level === "barangays") {
    return getFallbackBarangayOptions(parentValue);
  }

  return getFallbackProvinceOptions();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = (searchParams.get("level") ?? "provinces") as AddressLevel;
  const parentCode = searchParams.get("parentCode") ?? "";
  const parentKind = searchParams.get("parentKind") ?? "";
  const parentValue = searchParams.get("parentValue") ?? parentCode;

  if (!["provinces", "cities", "barangays"].includes(level)) {
    return NextResponse.json({ ok: false, message: "Invalid address level." }, { status: 400 });
  }

  try {
    if (level === "provinces") {
      return addressOptionsResponse(await getPsgcProvinceOptions(), "psgc");
    }

    if (!parentCode) {
      return addressOptionsResponse(getFallbackOptions(level, parentValue), "fallback");
    }

    if (level === "cities") {
      return addressOptionsResponse(await getPsgcCityOptions(parentCode, parentKind), "psgc");
    }

    return addressOptionsResponse(await getPsgcBarangayOptions(parentCode), "psgc");
  } catch {
    return addressOptionsResponse(
      getFallbackOptions(level, parentValue),
      "fallback",
      "Address list is using a local fallback right now. You can still type the address manually if your area is missing.",
    );
  }
}
