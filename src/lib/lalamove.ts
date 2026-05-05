import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import { businessInfo } from "@/lib/business-info";

type LalamoveStop = {
  coordinates: {
    lat: string;
    lng: string;
  };
  address: string;
};

type LalamoveQuotationResponse = {
  data?: {
    quotationId?: string;
    expiresAt?: string;
    serviceType?: string;
    priceBreakdown?: {
      total?: string;
      currency?: string;
      [key: string]: string | undefined;
    };
    distance?: {
      value?: string;
      unit?: string;
    };
  };
  message?: string;
};

export type LalamoveQuoteInput = {
  serviceType?: string;
  dropoffAddress: string;
  dropoffLat: string;
  dropoffLng: string;
};

export type LalamoveQuoteResult = {
  quotationId: string;
  expiresAt: string;
  serviceType: string;
  total: number;
  currency: string;
  distanceMeters: number | null;
  priceBreakdown: Record<string, string | undefined>;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function lalamoveBaseUrl() {
  return process.env.LALAMOVE_ENV === "production" ? "https://rest.lalamove.com" : "https://rest.sandbox.lalamove.com";
}

function lalamovePath(path: string) {
  return `/v3${path.startsWith("/") ? path : `/${path}`}`;
}

function normalizeCoordinate(value: string, name: string) {
  const trimmed = value.trim();
  const numberValue = Number(trimmed);

  if (!Number.isFinite(numberValue)) {
    throw new Error(`${name} must be a valid coordinate.`);
  }

  return trimmed;
}

function signRequest(method: string, path: string, body: string, secret: string) {
  const timestamp = Date.now().toString();
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
  const signature = createHmac("sha256", secret).update(rawSignature).digest("hex");

  return { timestamp, signature };
}

export function getLalamoveConfigStatus() {
  return {
    hasCredentials: Boolean(process.env.LALAMOVE_API_KEY?.trim() && process.env.LALAMOVE_API_SECRET?.trim()),
    hasPickupCoordinates: Boolean(process.env.LALAMOVE_PICKUP_LAT?.trim() && process.env.LALAMOVE_PICKUP_LNG?.trim()),
    environment: process.env.LALAMOVE_ENV === "production" ? "production" : "sandbox",
    market: process.env.LALAMOVE_MARKET?.trim() || "PH",
    pickupAddress: process.env.LALAMOVE_PICKUP_ADDRESS?.trim() || businessInfo.address,
  };
}

export async function getLalamoveQuotation(input: LalamoveQuoteInput): Promise<LalamoveQuoteResult> {
  const apiKey = requiredEnv("LALAMOVE_API_KEY");
  const apiSecret = requiredEnv("LALAMOVE_API_SECRET");
  const pickupLat = normalizeCoordinate(requiredEnv("LALAMOVE_PICKUP_LAT"), "LALAMOVE_PICKUP_LAT");
  const pickupLng = normalizeCoordinate(requiredEnv("LALAMOVE_PICKUP_LNG"), "LALAMOVE_PICKUP_LNG");
  const dropoffLat = normalizeCoordinate(input.dropoffLat, "dropoffLat");
  const dropoffLng = normalizeCoordinate(input.dropoffLng, "dropoffLng");
  const path = lalamovePath("/quotations");
  const method = "POST";
  const pickupStop: LalamoveStop = {
    coordinates: {
      lat: pickupLat,
      lng: pickupLng,
    },
    address: process.env.LALAMOVE_PICKUP_ADDRESS?.trim() || businessInfo.address,
  };
  const dropoffStop: LalamoveStop = {
    coordinates: {
      lat: dropoffLat,
      lng: dropoffLng,
    },
    address: input.dropoffAddress.trim(),
  };
  const body = JSON.stringify({
    data: {
      serviceType: input.serviceType || process.env.LALAMOVE_SERVICE_TYPE || "MOTORCYCLE",
      language: "en_PH",
      stops: [pickupStop, dropoffStop],
      isRouteOptimized: false,
    },
  });
  const { timestamp, signature } = signRequest(method, path, body, apiSecret);
  const response = await fetch(`${lalamoveBaseUrl()}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      authorization: `hmac ${apiKey}:${timestamp}:${signature}`,
      market: process.env.LALAMOVE_MARKET?.trim() || "PH",
      "request-id": randomUUID(),
    },
    body,
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as LalamoveQuotationResponse;

  if (!response.ok || !payload.data) {
    throw new Error(payload.message || `Lalamove quotation failed with status ${response.status}.`);
  }

  const total = Number(payload.data.priceBreakdown?.total ?? 0);

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Lalamove did not return a valid quotation total.");
  }

  return {
    quotationId: payload.data.quotationId ?? "",
    expiresAt: payload.data.expiresAt ?? "",
    serviceType: payload.data.serviceType ?? input.serviceType ?? process.env.LALAMOVE_SERVICE_TYPE ?? "MOTORCYCLE",
    total,
    currency: payload.data.priceBreakdown?.currency ?? "PHP",
    distanceMeters: payload.data.distance?.value ? Number(payload.data.distance.value) : null,
    priceBreakdown: payload.data.priceBreakdown ?? {},
  };
}
