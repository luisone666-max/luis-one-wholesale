import "server-only";

export type GeocodeResult = {
  formattedAddress: string;
  lat: number;
  lng: number;
  locationType: string;
  placeId: string;
};

type GoogleGeocodingResponse = {
  status?: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    place_id?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
      location_type?: string;
    };
  }>;
};

function googleMapsApiKey() {
  const value = process.env.GOOGLE_MAPS_API_KEY?.trim() || process.env.GOOGLE_GEOCODING_API_KEY?.trim();

  if (!value) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured.");
  }

  return value;
}

export function getGoogleGeocodingConfigStatus() {
  return {
    hasCredentials: Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim() || process.env.GOOGLE_GEOCODING_API_KEY?.trim()),
  };
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const cleanAddress = address.trim();

  if (!cleanAddress) {
    throw new Error("Address is required.");
  }

  const params = new URLSearchParams({
    address: cleanAddress,
    key: googleMapsApiKey(),
    region: "ph",
  });
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`, {
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as GoogleGeocodingResponse;

  if (!response.ok) {
    throw new Error(`Google Geocoding failed with status ${response.status}.`);
  }

  if (payload.status !== "OK" || !payload.results?.length) {
    throw new Error(payload.error_message || `Google Geocoding returned ${payload.status || "no result"}.`);
  }

  const bestResult = payload.results[0];
  const lat = bestResult.geometry?.location?.lat;
  const lng = bestResult.geometry?.location?.lng;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Google Geocoding did not return valid coordinates.");
  }

  return {
    formattedAddress: bestResult.formatted_address || cleanAddress,
    lat: lat as number,
    lng: lng as number,
    locationType: bestResult.geometry?.location_type || "",
    placeId: bestResult.place_id || "",
  };
}
