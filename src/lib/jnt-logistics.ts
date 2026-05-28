import { businessInfo } from "@/lib/business-info";

export type JntConfigStatus = {
  configured: boolean;
  liveBookingEnabled: boolean;
  mode: string;
  required: string[];
  recommended: string[];
  missingRequired: string[];
  missingRecommended: string[];
};

export type JntBookingInput = {
  orderNo: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  codAmount: number | null;
  codCurrency: string;
  packageWeightGrams: number | null;
  packageLengthCm: number | null;
  packageWidthCm: number | null;
  packageHeightCm: number | null;
  notes: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
};

export type JntBookingResult = {
  ok: boolean;
  code: "booked" | "not_configured" | "live_booking_disabled" | "api_error";
  message: string;
  rawRequest: Record<string, unknown>;
  rawResponse: unknown;
  bookingReference?: string;
  trackingNo?: string;
  waybillNo?: string;
  labelUrl?: string;
};

const requiredEnvKeys = [
  "JNT_API_BASE_URL",
  "JNT_ACCOUNT",
  "JNT_API_KEY",
  "JNT_SECRET_KEY",
];

const recommendedEnvKeys = [
  "JNT_API_ENV",
  "JNT_CREATE_ORDER_PATH",
  "JNT_SENDER_NAME",
  "JNT_SENDER_PHONE",
  "JNT_PICKUP_ADDRESS",
];

function missingEnv(keys: string[]) {
  return keys.filter((key) => !process.env[key]?.trim());
}

function envValue(key: string, fallback = "") {
  return process.env[key]?.trim() || fallback;
}

export function getJntConfigStatus(): JntConfigStatus {
  const missingRequired = missingEnv(requiredEnvKeys);
  const missingRecommended = missingEnv(recommendedEnvKeys);

  return {
    configured: missingRequired.length === 0,
    liveBookingEnabled: envValue("JNT_ENABLE_LIVE_BOOKING").toLowerCase() === "true",
    mode: envValue("JNT_API_ENV", "not_set"),
    required: requiredEnvKeys,
    recommended: recommendedEnvKeys,
    missingRequired,
    missingRecommended,
  };
}

export function buildJntBookingPayload(input: JntBookingInput) {
  const senderName = input.senderName || envValue("JNT_SENDER_NAME", businessInfo.name);
  const senderPhone = input.senderPhone || envValue("JNT_SENDER_PHONE", businessInfo.phoneDisplay);
  const senderAddress = input.senderAddress || envValue("JNT_PICKUP_ADDRESS", businessInfo.address);

  return {
    account: envValue("JNT_ACCOUNT"),
    orderNo: input.orderNo,
    serviceType: "COD",
    cod: {
      amount: input.codAmount ?? 0,
      currency: input.codCurrency || "PHP",
    },
    parcel: {
      weightGrams: input.packageWeightGrams,
      lengthCm: input.packageLengthCm,
      widthCm: input.packageWidthCm,
      heightCm: input.packageHeightCm,
      description: input.notes || "Wholesale order",
    },
    sender: {
      name: senderName,
      phone: senderPhone,
      address: senderAddress,
    },
    receiver: {
      name: input.receiverName,
      phone: input.receiverPhone,
      address: input.receiverAddress,
    },
  };
}

function getCreateOrderUrl() {
  const explicitUrl = envValue("JNT_CREATE_ORDER_URL");

  if (explicitUrl) {
    return explicitUrl;
  }

  const baseUrl = envValue("JNT_API_BASE_URL").replace(/\/+$/, "");
  const path = envValue("JNT_CREATE_ORDER_PATH", "/api/order/create").replace(/^\/?/, "/");
  return `${baseUrl}${path}`;
}

function readStringField(source: unknown, keys: string[]): string {
  if (!source || typeof source !== "object") {
    return "";
  }

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  for (const value of Object.values(record)) {
    const nested = readStringField(value, keys);

    if (nested) {
      return nested;
    }
  }

  return "";
}

export async function bookJntCodShipment(input: JntBookingInput): Promise<JntBookingResult> {
  const status = getJntConfigStatus();
  const rawRequest = buildJntBookingPayload(input);

  if (!status.configured) {
    return {
      ok: false,
      code: "not_configured",
      message: `J&T API is missing required config: ${status.missingRequired.join(", ")}.`,
      rawRequest,
      rawResponse: { status },
    };
  }

  if (!status.liveBookingEnabled) {
    return {
      ok: false,
      code: "live_booking_disabled",
      message: "J&T live booking is disabled. Set JNT_ENABLE_LIVE_BOOKING=true after J&T confirms the API details.",
      rawRequest,
      rawResponse: { status },
    };
  }

  try {
    const response = await fetch(getCreateOrderUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${envValue("JNT_API_KEY")}`,
        "x-jnt-account": envValue("JNT_ACCOUNT"),
      },
      body: JSON.stringify(rawRequest),
    });
    const rawResponse = (await response.json().catch(() => null)) ?? { status: response.status, statusText: response.statusText };

    if (!response.ok) {
      return {
        ok: false,
        code: "api_error",
        message: `J&T API returned HTTP ${response.status}.`,
        rawRequest,
        rawResponse,
      };
    }

    return {
      ok: true,
      code: "booked",
      message: "J&T shipment booked.",
      rawRequest,
      rawResponse,
      bookingReference: readStringField(rawResponse, ["bookingReference", "booking_reference", "txlogisticId", "orderId"]),
      trackingNo: readStringField(rawResponse, ["trackingNo", "tracking_no", "billCode", "waybillNo", "waybill_no"]),
      waybillNo: readStringField(rawResponse, ["waybillNo", "waybill_no", "billCode", "trackingNo", "tracking_no"]),
      labelUrl: readStringField(rawResponse, ["labelUrl", "label_url", "waybillUrl", "waybill_url", "pdfUrl"]),
    };
  } catch (error) {
    return {
      ok: false,
      code: "api_error",
      message: error instanceof Error ? error.message : "J&T API request failed.",
      rawRequest,
      rawResponse: null,
    };
  }
}
