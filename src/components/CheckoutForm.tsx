"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackMetaEvent } from "@/components/MetaPixel";
import { businessInfo } from "@/lib/business-info";
import { getCustomerCartItems, type CustomerCartItem } from "@/lib/customer-cart";
import type { CustomerDeliveryAddressRecord } from "@/lib/customer-delivery-addresses";
import { calculateLoyaltyPoints, formatLoyaltyPoints } from "@/lib/loyalty-points";
import type { ReceivingMethod, ShippingFeePayment } from "@/lib/order-labels";
import { receivingMethodLabels, shippingFeePaymentLabels } from "@/lib/order-labels";
import {
  buildCompleteDeliveryAddress,
  estimateCodShippingFee,
  getAddressOptions,
  philippinesProvinces,
  type CheckoutAddressDraft,
} from "@/lib/philippines-addresses";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatPhp } from "@/lib/wholesale-pricing";

const receivingMethods: ReceivingMethod[] = ["courier_shipping", "pickup", "local_delivery"];
const storeMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessInfo.address)}`;
type LalamoveBookingMode = "seller_books_lalamove" | "customer_books_lalamove";
type CheckoutAddressKind = "region" | "province" | "city" | "municipality" | "barangay";
type CheckoutAddressLevel = "provinces" | "cities" | "barangays";

type CheckoutAddressOption = {
  code: string;
  label: string;
  value: string;
  kind: CheckoutAddressKind;
  parentCode?: string;
};

type CheckoutAddressOptionsResult = {
  ok?: boolean;
  source?: "psgc" | "fallback";
  message?: string;
  options?: CheckoutAddressOption[];
};

function prettifyAddressValue(value: string) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function localAddressOption(value: string, kind: CheckoutAddressKind, parentCode = ""): CheckoutAddressOption {
  return {
    code: parentCode ? `${parentCode}:${value}` : value,
    label: prettifyAddressValue(value),
    value,
    kind,
    parentCode: parentCode || undefined,
  };
}

const fallbackProvinceOptions: CheckoutAddressOption[] = philippinesProvinces.map((province) =>
  localAddressOption(province, province === "METRO-MANILA" ? "region" : "province"),
);

function localAddressOptions(values: string[], kind: CheckoutAddressKind, parentCode = "") {
  return values.map((value) => localAddressOption(value, kind, parentCode));
}

function findAddressOption(options: CheckoutAddressOption[], value: string) {
  return options.find((option) => option.value === value) ?? null;
}

function withCurrentAddressOption(options: CheckoutAddressOption[], currentValue: string, kind: CheckoutAddressKind) {
  if (!currentValue || options.some((option) => option.value === currentValue)) {
    return options;
  }

  return [localAddressOption(currentValue, kind), ...options];
}

async function fetchCheckoutAddressOptions({
  level,
  parentCode,
  parentKind,
  parentValue,
}: {
  level: CheckoutAddressLevel;
  parentCode?: string;
  parentKind?: string;
  parentValue?: string;
}) {
  const params = new URLSearchParams({ level });

  if (parentCode) {
    params.set("parentCode", parentCode);
  }

  if (parentKind) {
    params.set("parentKind", parentKind);
  }

  if (parentValue) {
    params.set("parentValue", parentValue);
  }

  const response = await fetch(`/api/checkout/address-options?${params.toString()}`);
  const result = (await response.json().catch(() => ({ ok: false }))) as CheckoutAddressOptionsResult;

  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? "Address list is not available.");
  }

  return {
    source: result.source ?? "fallback",
    message: result.message ?? "",
    options: result.options ?? [],
  };
}

function getShippingOptions(method: ReceivingMethod): ShippingFeePayment[] {
  if (method === "pickup") {
    return ["no_shipping_fee"];
  }

  if (method === "local_delivery") {
    return ["to_be_confirmed"];
  }

  if (method === "to_be_arranged") {
    return ["to_be_confirmed"];
  }

  return ["cod_included", "to_be_confirmed"];
}

function getDefaultShippingPayment(method: ReceivingMethod): ShippingFeePayment {
  if (method === "pickup") {
    return "no_shipping_fee";
  }

  if (method === "local_delivery") {
    return "to_be_confirmed";
  }

  if (method === "to_be_arranged") {
    return "to_be_confirmed";
  }

  return "cod_included";
}

export function CheckoutForm() {
  const router = useRouter();
  const messageRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<CustomerCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receivingMethod, setReceivingMethod] = useState<ReceivingMethod>("courier_shipping");
  const [addressDraft, setAddressDraft] = useState<CheckoutAddressDraft>({
    landmark: "",
    streetAddress: "",
    barangay: "",
    city: "",
    province: "METRO-MANILA",
    notes: "",
  });
  const [shippingFeePayment, setShippingFeePayment] = useState<ShippingFeePayment>("cod_included");
  const [lalamoveBookingMode, setLalamoveBookingMode] = useState<LalamoveBookingMode>("seller_books_lalamove");
  const [orderNotes, setOrderNotes] = useState("");
  const [saveAsDefaultAddress, setSaveAsDefaultAddress] = useState(true);
  const [geoPoint, setGeoPoint] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [provinceOptions, setProvinceOptions] = useState<CheckoutAddressOption[]>(fallbackProvinceOptions);
  const [cityOptions, setCityOptions] = useState<CheckoutAddressOption[]>([]);
  const [cityOptionsParent, setCityOptionsParent] = useState("");
  const [barangayOptions, setBarangayOptions] = useState<CheckoutAddressOption[]>([]);
  const [barangayOptionsParent, setBarangayOptionsParent] = useState("");
  const [cityOptionsLoading, setCityOptionsLoading] = useState(false);
  const [barangayOptionsLoading, setBarangayOptionsLoading] = useState(false);
  const [addressOptionsMessage, setAddressOptionsMessage] = useState("");
  const shippingOptions = useMemo(() => getShippingOptions(receivingMethod), [receivingMethod]);
  const fallbackAddressOptions = useMemo(() => getAddressOptions(addressDraft.province, addressDraft.city), [addressDraft.city, addressDraft.province]);
  const provinceSelectOptions = useMemo(
    () => withCurrentAddressOption(provinceOptions, addressDraft.province, "province"),
    [addressDraft.province, provinceOptions],
  );
  const localCitySelectOptions = useMemo(
    () => localAddressOptions(fallbackAddressOptions.cities, "city", addressDraft.province),
    [addressDraft.province, fallbackAddressOptions.cities],
  );
  const activeCityOptions = cityOptionsParent === addressDraft.province ? cityOptions : [];
  const rawCitySelectOptions = activeCityOptions.length ? activeCityOptions : localCitySelectOptions;
  const citySelectOptions = useMemo(
    () => (rawCitySelectOptions.length ? withCurrentAddressOption(rawCitySelectOptions, addressDraft.city, "city") : []),
    [addressDraft.city, rawCitySelectOptions],
  );
  const localBarangaySelectOptions = useMemo(
    () => localAddressOptions(fallbackAddressOptions.barangays, "barangay", addressDraft.city),
    [addressDraft.city, fallbackAddressOptions.barangays],
  );
  const activeBarangayOptions = barangayOptionsParent === addressDraft.city ? barangayOptions : [];
  const rawBarangaySelectOptions = activeBarangayOptions.length ? activeBarangayOptions : localBarangaySelectOptions;
  const barangaySelectOptions = useMemo(
    () => (rawBarangaySelectOptions.length ? withCurrentAddressOption(rawBarangaySelectOptions, addressDraft.barangay, "barangay") : []),
    [addressDraft.barangay, rawBarangaySelectOptions],
  );
  const selectedProvinceOption = useMemo(
    () => findAddressOption(provinceSelectOptions, addressDraft.province),
    [addressDraft.province, provinceSelectOptions],
  );
  const selectedCityOption = useMemo(() => findAddressOption(citySelectOptions, addressDraft.city), [addressDraft.city, citySelectOptions]);
  const productTotal = useMemo(() => items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const completeAddress = useMemo(() => buildCompleteDeliveryAddress(addressDraft), [addressDraft]);
  const shippingEstimate = useMemo(
    () => estimateCodShippingFee(addressDraft.province, Math.max(1, itemCount)),
    [addressDraft.province, itemCount],
  );
  const estimatedPoints = calculateLoyaltyPoints(productTotal);
  const invalidCartItem = items.find((item) => item.priceError || item.appliedUnitPrice === null || item.subtotal === null);
  const isJntCod = receivingMethod === "courier_shipping";
  const isPickup = receivingMethod === "pickup";
  const isLalamove = receivingMethod === "local_delivery";
  const customerBooksLalamove = isLalamove && lalamoveBookingMode === "customer_books_lalamove";
  const addressRequired = isJntCod || (isLalamove && !customerBooksLalamove);
  const addressReady =
    !addressRequired ||
    Boolean(addressDraft.province.trim() && addressDraft.city.trim() && addressDraft.barangay.trim() && addressDraft.streetAddress.trim());
  const shippingFeeIncluded = shippingFeePayment === "cod_included" && addressRequired && addressReady && shippingEstimate !== null;
  const shippingFeeAmount = shippingFeeIncluded ? shippingEstimate : 0;
  const codTotal = productTotal + shippingFeeAmount;
  const deliverySectionLabel = isJntCod ? "J&T Express COD Delivery" : "Manual Lalamove Delivery";
  const deliverySectionTitle = isJntCod ? "Choose J&T Express delivery area" : "Delivery address for manual Lalamove booking";
  const orderBadge = isJntCod ? "J&T EXPRESS COD" : isPickup ? "PICKUP" : "LALAMOVE";
  const lalamoveArrangementLabel = customerBooksLalamove ? "Customer books own Lalamove" : "Luis One manually books Lalamove";
  const lalamoveHelpText = customerBooksLalamove
    ? "You will book and pay your own Lalamove rider after we confirm stock and pickup readiness."
    : "Luis One will manually book Lalamove after confirming stock. The website does not create an automatic Lalamove booking.";
  const showPickupPoint = isPickup || isLalamove;
  const pickupPointHelpText = isPickup
    ? "Pick up here after we confirm stock and pickup schedule."
    : customerBooksLalamove
      ? "Use this as the pickup point when booking your own Lalamove rider."
      : "This is the pickup point Luis One will use when manually booking Lalamove.";
  const paymentSummaryLabel =
    shippingFeePayment === "cod_included"
      ? "J&T Express Cash on Delivery"
      : isLalamove
        ? lalamoveArrangementLabel
        : shippingFeePaymentLabels[shippingFeePayment];
  const shippingHelpText = isJntCod
    ? "Luis One uses J&T Express for COD courier delivery. J&T Express COD total includes the estimated shipping fee when available. If your area needs manual quote, we will confirm before booking."
    : isLalamove
      ? "Lalamove is arranged manually by Luis One or booked directly by the customer; no automatic Lalamove order is created here."
      : "Store pickup has no shipping fee. We will confirm pickup time before preparing the order.";
  const totalLabel = isJntCod ? "Total COD" : "Order Total";
  const totalNote = isJntCod
    ? `${itemCount} item(s) - estimated J&T Express shipping is included when selected`
    : isLalamove
      ? `${itemCount} item(s) - ${customerBooksLalamove ? "customer books Lalamove" : "manual Lalamove booking"}`
      : `${itemCount} item(s) - pickup has no shipping fee`;
  const submitLabel = submitting ? "Submitting..." : isJntCod ? "Submit J&T Express COD Order" : isPickup ? "Submit Pickup Order" : "Submit Lalamove Order";
  const agreementText = isJntCod
    ? "By placing this order, you agree that we will confirm stock and arrange J&T Express COD delivery before dispatch."
    : isPickup
      ? "By placing this order, you agree that we will confirm stock and pickup schedule before preparing the order."
      : "By placing this order, you agree that Lalamove is handled manually: Luis One can book it after confirmation, or you can book your own rider.";

  const showCheckoutMessage = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
    window.setTimeout(() => {
      messageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }, []);

  const loadCart = useCallback(async () => {
    const result = await getCustomerCartItems();
    setItems(result.items);
    setMessage(result.error ?? "");
    setLoading(false);
  }, []);

  const applySavedAddress = useCallback((savedAddress: CustomerDeliveryAddressRecord) => {
    setReceiverName((current) => current || savedAddress.receiverName);
    setReceiverPhone((current) => current || savedAddress.receiverPhone);
    setAddressDraft({
      landmark: savedAddress.address.landmark,
      streetAddress: savedAddress.address.streetAddress,
      barangay: savedAddress.address.barangay,
      city: savedAddress.address.city,
      province: savedAddress.address.province || "METRO-MANILA",
      notes: savedAddress.address.notes,
    });

    if (savedAddress.latitude !== null && savedAddress.longitude !== null) {
      setGeoPoint({
        latitude: savedAddress.latitude,
        longitude: savedAddress.longitude,
        accuracy: savedAddress.geolocationAccuracyM ?? 0,
      });
    }
  }, []);

  const loadSavedAddress = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = (await supabase?.auth.getSession()) ?? { data: { session: null } };

    if (!session?.access_token) {
      return null;
    }

    const response = await fetch("/api/customer/delivery-addresses/default", {
      headers: {
        authorization: `Bearer ${session.access_token}`,
      },
    });
    const result = (await response.json().catch(() => ({ ok: false }))) as {
      ok?: boolean;
      address?: CustomerDeliveryAddressRecord | null;
    };

    return response.ok && result.ok && result.address ? result.address : null;
  }, []);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      void (async () => {
        const [result, savedAddress] = await Promise.all([getCustomerCartItems(), loadSavedAddress()]);

        if (!active) {
          return;
        }

        if (savedAddress) {
          applySavedAddress(savedAddress);
        }

        setItems(result.items);
        setMessage(result.error ?? "");
        setLoading(false);
      })();
    });

    return () => {
      active = false;
    };
  }, [applySavedAddress, loadSavedAddress]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const result = await fetchCheckoutAddressOptions({ level: "provinces" });

        if (!active) {
          return;
        }

        if (result.options.length) {
          setProvinceOptions(result.options);
        }

        setAddressOptionsMessage(result.source === "fallback" ? result.message : "");
      } catch {
        if (active) {
          setAddressOptionsMessage("Address list is using a local fallback right now. You can still type the address manually if your area is missing.");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fallbackCities = localAddressOptions(getAddressOptions(addressDraft.province, "").cities, "city", addressDraft.province);

    if (!addressDraft.province || !selectedProvinceOption?.code) {
      return () => {
        active = false;
      };
    }

    void (async () => {
      setCityOptionsLoading(true);

      try {
        const result = await fetchCheckoutAddressOptions({
          level: "cities",
          parentCode: selectedProvinceOption.code,
          parentKind: selectedProvinceOption.kind,
          parentValue: addressDraft.province,
        });

        if (!active) {
          return;
        }

        setCityOptions(result.options.length ? result.options : fallbackCities);
        setCityOptionsParent(addressDraft.province);
        setAddressOptionsMessage(result.source === "fallback" && result.message ? result.message : "");
      } catch {
        if (active) {
          setCityOptions(fallbackCities);
          setCityOptionsParent(addressDraft.province);
          setAddressOptionsMessage("Address list is using a local fallback right now. You can still type the address manually if your area is missing.");
        }
      } finally {
        if (active) {
          setCityOptionsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [addressDraft.province, selectedProvinceOption?.code, selectedProvinceOption?.kind]);

  useEffect(() => {
    let active = true;
    const fallbackBarangays = localAddressOptions(getAddressOptions("", addressDraft.city).barangays, "barangay", addressDraft.city);

    if (!addressDraft.city || !selectedCityOption?.code) {
      return () => {
        active = false;
      };
    }

    void (async () => {
      setBarangayOptionsLoading(true);

      try {
        const result = await fetchCheckoutAddressOptions({
          level: "barangays",
          parentCode: selectedCityOption.code,
          parentKind: selectedCityOption.kind,
          parentValue: addressDraft.city,
        });

        if (!active) {
          return;
        }

        setBarangayOptions(result.options.length ? result.options : fallbackBarangays);
        setBarangayOptionsParent(addressDraft.city);
        setAddressOptionsMessage(result.source === "fallback" && result.message ? result.message : "");
      } catch {
        if (active) {
          setBarangayOptions(fallbackBarangays);
          setBarangayOptionsParent(addressDraft.city);
          setAddressOptionsMessage("Address list is using a local fallback right now. You can still type the address manually if your area is missing.");
        }
      } finally {
        if (active) {
          setBarangayOptionsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [addressDraft.city, selectedCityOption?.code, selectedCityOption?.kind]);

  const changeReceivingMethod = (method: ReceivingMethod) => {
    setReceivingMethod(method);
    setShippingFeePayment(getDefaultShippingPayment(method));
  };

  const updateAddressDraft = (field: keyof CheckoutAddressDraft, value: string) => {
    setAddressDraft((current) => ({ ...current, [field]: value }));
  };

  const changeProvince = (province: string) => {
    setAddressDraft((current) => ({ ...current, province, city: "", barangay: "" }));
    setCityOptions([]);
    setCityOptionsParent("");
    setBarangayOptions([]);
    setBarangayOptionsParent("");
    setCityOptionsLoading(false);
    setBarangayOptionsLoading(false);
  };

  const changeCity = (city: string) => {
    setAddressDraft((current) => ({ ...current, city, barangay: "" }));
    setBarangayOptions([]);
    setBarangayOptionsParent("");
    setBarangayOptionsLoading(false);
  };

  const useCurrentLocation = () => {
    setMessage("");

    if (!navigator.geolocation) {
      setMessage("Location is not available in this browser. Please pick province, city, and barangay manually.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoPoint({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setMessage("Location saved as delivery help. Please still choose province, city, and barangay for delivery matching.");
      },
      () => setMessage("Location permission denied. Please choose province, city, and barangay manually."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const submitOrder = async () => {
    setMessage("");

    if (!items.length) {
      showCheckoutMessage("Your cart is empty. Please add products before checkout.");
      return;
    }

    if (invalidCartItem) {
      showCheckoutMessage(invalidCartItem.priceError ?? "One or more cart items need quotation before checkout.");
      return;
    }

    if (!receiverName.trim()) {
      showCheckoutMessage("Receiver Name is required.");
      return;
    }

    if (!receiverPhone.trim()) {
      showCheckoutMessage("Receiver Phone Number is required.");
      return;
    }

    if (addressRequired && !addressReady) {
      showCheckoutMessage("Province, City / District, Barangay, and Street Address are required for delivery.");
      return;
    }

    if (shippingFeePayment === "cod_included" && addressRequired && shippingEstimate === null) {
      showCheckoutMessage("Please choose a supported province or select To be Confirmed before placing a J&T Express COD order.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = (await supabase?.auth.getSession()) ?? { data: { session: null } };

    if (!session?.access_token) {
      showCheckoutMessage("Please login before placing an order.");
      return;
    }

    trackMetaEvent("InitiateCheckout", {
      content_type: "product",
      currency: "PHP",
      num_items: itemCount,
      value: codTotal,
    });

    setSubmitting(true);
    showCheckoutMessage("Submitting order. Please wait and do not press the button again.");
    const response = await fetch("/api/orders/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        receiverName,
        receiverPhone,
        receivingMethod,
        completeAddress: addressRequired ? completeAddress : "",
        shippingFeePayment,
        shippingFeeAmount: shippingFeeIncluded ? shippingEstimate : null,
        deliveryProvince: addressRequired ? addressDraft.province : "",
        deliveryCity: addressRequired ? addressDraft.city : "",
        deliveryBarangay: addressRequired ? addressDraft.barangay : "",
        deliveryStreetAddress: addressRequired ? addressDraft.streetAddress : "",
        deliveryLandmark: addressRequired ? addressDraft.landmark : "",
        deliveryNotes: addressRequired ? addressDraft.notes : "",
        locationLatitude: geoPoint?.latitude ?? null,
        locationLongitude: geoPoint?.longitude ?? null,
        locationAccuracyM: geoPoint?.accuracy ?? null,
        saveAsDefaultAddress: addressRequired && saveAsDefaultAddress,
        deliveryArrangement: isLalamove ? lalamoveBookingMode : null,
        orderNotes,
      }),
    });
    const result = (await response.json().catch(() => ({ ok: false, message: "Order submission failed." }))) as {
      ok?: boolean;
      message?: string;
      orderNo?: string;
    };
    setSubmitting(false);

    if (!response.ok || !result.ok || !result.orderNo) {
      showCheckoutMessage(result.message ?? "Order submission failed.");
      await loadCart();
      return;
    }

    router.push(`/order-success?order=${encodeURIComponent(result.orderNo)}`);
  };

  const shippingFeeLabel = (() => {
    if (isPickup) {
      return "PHP 0";
    }

    if (!addressReady) {
      return "Select address";
    }

    if (isLalamove && shippingFeePayment === "freight_collect") {
      return "Paid to Lalamove rider";
    }

    if (isLalamove) {
      return customerBooksLalamove ? "Customer books Lalamove" : "Manual Lalamove quote";
    }

    if (shippingFeePayment === "freight_collect") {
      return "Paid by receiver";
    }

    if (shippingFeePayment === "to_be_confirmed") {
      return "To be confirmed";
    }

    if (shippingFeePayment === "cod_included" && shippingEstimate === null) {
      return "To be confirmed";
    }

    return formatPhp(shippingFeeAmount);
  })();

  if (loading) {
    return (
      <main className="bg-[#f6f6f6]">
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Checkout</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Loading checkout...</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-zinc-600">
              We are checking your cart and saved delivery details before showing the order form.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="bg-[#f6f6f6]">
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-sm border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Checkout</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Your cart is empty</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-bold leading-6 text-zinc-600">
              Add wholesale products to your cart before choosing J&T Express COD, Store Pickup, or Lalamove.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/category/all" className="rounded-sm bg-[#f65f18] px-5 py-3 text-center text-sm font-black text-white">
                Continue Shopping
              </Link>
              <Link href="/cart" className="rounded-sm border border-zinc-200 bg-white px-5 py-3 text-center text-sm font-black text-zinc-700">
                Back to Cart
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#f6f6f6]">
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_400px] lg:px-8">
        <div className="space-y-5">
          <section className="rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Checkout</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Checkout Details</h1>
            {message ? (
              <div ref={messageRef} className="mt-5 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                {message}
              </div>
            ) : null}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Recipient" value={receiverName} onChange={setReceiverName} placeholder="Full name" required />
              <Field label="Phone" value={receiverPhone} onChange={setReceiverPhone} placeholder="09171234567" required />
              <label className="block text-sm font-bold text-zinc-800">
                Receiving Method
                <select
                  value={receivingMethod}
                  onChange={(event) => changeReceivingMethod(event.target.value as ReceivingMethod)}
                  className="mt-2 h-12 w-full rounded-sm border border-zinc-200 bg-white px-4 outline-none focus:border-orange-500"
                >
                  {receivingMethods.map((method) => (
                    <option key={method} value={method}>
                      {receivingMethodLabels[method]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold text-zinc-800">
                Payment
                <select
                  value={shippingFeePayment}
                  onChange={(event) => setShippingFeePayment(event.target.value as ShippingFeePayment)}
                  className="mt-2 h-12 w-full rounded-sm border border-zinc-200 bg-white px-4 outline-none focus:border-orange-500"
                >
                  {shippingOptions.map((option) => (
                    <option key={option} value={option}>
                      {shippingFeePaymentLabels[option]}
                    </option>
                  ))}
                </select>
              </label>
              {isLalamove ? (
                <label className="block text-sm font-bold text-zinc-800 sm:col-span-2">
                  Lalamove Booking
                  <select
                    value={lalamoveBookingMode}
                    onChange={(event) => setLalamoveBookingMode(event.target.value as LalamoveBookingMode)}
                    className="mt-2 h-12 w-full rounded-sm border border-zinc-200 bg-white px-4 outline-none focus:border-orange-500"
                  >
                    <option value="seller_books_lalamove">Luis One manually books Lalamove</option>
                    <option value="customer_books_lalamove">Customer books own Lalamove</option>
                  </select>
                  <span className="mt-2 block text-xs font-bold leading-5 text-zinc-500">{lalamoveHelpText}</span>
                </label>
              ) : null}
              {isJntCod ? (
                <div className="sm:col-span-2 rounded-sm border border-red-100 bg-red-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-red-700">Courier Partner</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">J&T Express</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-red-700">
                    Your order will be shipped by J&T Express COD after Luis One confirms stock and delivery details.
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          {showPickupPoint ? (
            <section className="rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Pickup Point</p>
                  <h2 className="mt-2 text-2xl font-black text-zinc-950">{businessInfo.name}</h2>
                </div>
                <Link
                  href={storeMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-sm border border-orange-200 bg-orange-50 px-4 py-2 text-center text-sm font-black text-orange-700"
                >
                  Open Google Maps
                </Link>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-sm border border-orange-100 bg-orange-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-700">Store Address</p>
                  <p className="mt-2 text-sm font-black leading-6 text-zinc-900">{businessInfo.address}</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-orange-700">{pickupPointHelpText}</p>
                </div>
                <div className="rounded-sm border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Contact</p>
                  <p className="mt-2 text-sm font-black leading-6 text-zinc-900">{businessInfo.phoneDisplay}</p>
                  <p className="text-sm font-bold leading-6 text-zinc-700">{businessInfo.hours}</p>
                </div>
              </div>
            </section>
          ) : null}

          {addressRequired ? (
            <section className="rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">{deliverySectionLabel}</p>
                  <h2 className="mt-2 text-2xl font-black text-zinc-950">{deliverySectionTitle}</h2>
                </div>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="rounded-sm border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700"
                >
                  Use my current location
                </button>
              </div>
              {geoPoint ? (
                <div className="mt-4 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold leading-5 text-emerald-800">
                  Location helper saved. Accuracy about {Math.round(geoPoint.accuracy)}m. Province, city, and barangay still control delivery matching.
                </div>
              ) : null}
              {addressOptionsMessage ? (
                <div className="mt-4 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800">
                  {addressOptionsMessage}
                </div>
              ) : null}
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <SelectField
                  label="Province"
                  value={addressDraft.province}
                  onChange={changeProvince}
                  options={provinceSelectOptions}
                  placeholder="Select province"
                  required
                />
                {citySelectOptions.length || cityOptionsLoading ? (
                  <SelectField
                    label="City / District"
                    value={addressDraft.city}
                    onChange={changeCity}
                    options={citySelectOptions}
                    placeholder={cityOptionsLoading ? "Loading cities..." : "Select city / district"}
                    disabled={cityOptionsLoading && !citySelectOptions.length}
                    required
                  />
                ) : (
                  <Field
                    label="City / District"
                    value={addressDraft.city}
                    onChange={(value) => updateAddressDraft("city", value)}
                    placeholder="City / district"
                    required
                  />
                )}
                {barangaySelectOptions.length || barangayOptionsLoading ? (
                  <SelectField
                    label="Barangay"
                    value={addressDraft.barangay}
                    onChange={(value) => updateAddressDraft("barangay", value)}
                    options={barangaySelectOptions}
                    placeholder={barangayOptionsLoading ? "Loading barangays..." : "Select barangay"}
                    disabled={barangayOptionsLoading && !barangaySelectOptions.length}
                    required
                  />
                ) : (
                  <Field
                    label="Barangay"
                    value={addressDraft.barangay}
                    onChange={(value) => updateAddressDraft("barangay", value)}
                    placeholder="Barangay"
                    required
                  />
                )}
                <Field
                  label="Street Address"
                  value={addressDraft.streetAddress}
                  onChange={(value) => updateAddressDraft("streetAddress", value)}
                  placeholder="House no., street, building"
                  required
                  className="sm:col-span-2"
                />
                <Field
                  label="Landmark"
                  value={addressDraft.landmark}
                  onChange={(value) => updateAddressDraft("landmark", value)}
                  placeholder="Near Puregold / red gate / beside 7-Eleven"
                />
                <label className="block text-sm font-bold text-zinc-800 sm:col-span-3">
                  Delivery Notes
                  <textarea
                    value={addressDraft.notes}
                    onChange={(event) => updateAddressDraft("notes", event.target.value)}
                    placeholder="Call before delivery, preferred time, gate color, or other courier notes"
                    className="mt-2 min-h-20 w-full rounded-sm border border-zinc-200 px-4 py-3 outline-none focus:border-orange-500"
                  />
                </label>
              </div>
              <div className="mt-5 rounded-sm border border-orange-100 bg-orange-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-700">Complete Address Preview</p>
                <p className="mt-2 text-sm font-bold leading-6 text-zinc-800">
                  {completeAddress || "Your delivery address will appear here after you choose area and street."}
                </p>
              </div>
              <label className="mt-4 flex items-start gap-3 rounded-sm border border-zinc-200 bg-zinc-50 p-3 text-sm font-bold text-zinc-700">
                <input
                  type="checkbox"
                  checked={saveAsDefaultAddress}
                  onChange={(event) => setSaveAsDefaultAddress(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#f65f18]"
                />
                <span>Save this as my default delivery address for next checkout.</span>
              </label>
            </section>
          ) : null}

          <section className="rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-zinc-950">Seller Order</h2>
            <div className="mt-4 rounded-md border border-zinc-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-zinc-950">Luis One Supply Hub</p>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Local wholesale order</p>
                </div>
                <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                  {orderBadge}
                </span>
              </div>
              <label className="mt-4 block text-sm font-bold text-zinc-800">
                Note to seller
                <textarea
                  value={orderNotes}
                  onChange={(event) => setOrderNotes(event.target.value)}
                  placeholder="Optional note about variants, packing, pickup time, or delivery instruction"
                  className="mt-2 min-h-20 w-full rounded-sm border border-zinc-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-zinc-950">Price Breakdown</h2>
          <div className="mt-5 space-y-3 text-sm">
            {loading ? <p className="font-bold text-zinc-600">Loading cart...</p> : null}
            {!loading && !items.length ? (
              <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-700">
                Your cart is empty. Add products before checkout.
              </div>
            ) : null}
            {invalidCartItem ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
                One or more items need Messenger confirmation before checkout. Please go back to cart and remove unavailable items.
              </div>
            ) : null}
            {items.map((item) => (
              <div key={item.id} className="rounded-md bg-zinc-50 p-3 ring-1 ring-zinc-100">
                <p className="font-black text-zinc-950">{item.name}</p>
                <p className="mt-1 text-xs font-bold text-zinc-500">
                  {item.quantity} pcs x {item.appliedUnitPrice === null ? "To quote" : formatPhp(item.appliedUnitPrice)}
                </p>
              </div>
            ))}
            <SummaryRow label="Items Total" value={formatPhp(productTotal)} />
            {isJntCod ? <SummaryRow label="Courier" value="J&T Express COD" /> : null}
            <SummaryRow label="Shipping" value={shippingFeeLabel} />
            <SummaryRow label="Payment" value={paymentSummaryLabel} />
            <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-700">
              {shippingHelpText}
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-700">
              Member points estimate: {formatLoyaltyPoints(estimatedPoints)} after payment is confirmed. Every PHP 100 = 1 point.
            </div>
            <div className="border-t border-zinc-100 pt-4">
              <SummaryRow label={totalLabel} value={formatPhp(codTotal)} strong />
              <p className="mt-2 text-xs font-bold text-zinc-500">{totalNote}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={submitOrder}
            disabled={loading || submitting || !items.length || Boolean(invalidCartItem)}
            className="mt-6 block w-full rounded-sm bg-[#f65f18] px-5 py-3 text-center text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-orange-300"
          >
            {submitLabel}
          </button>
          <p className="mt-3 text-xs font-bold leading-5 text-zinc-500">
            {agreementText}
          </p>
          <Link href="/cart" className="mt-3 block rounded-sm border border-zinc-200 bg-white px-5 py-3 text-center text-sm font-black text-zinc-700">
            Back to Cart
          </Link>
        </aside>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-bold text-zinc-800 ${className}`}>
      {label} {required ? <span className="text-red-600">*</span> : null}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-sm border border-zinc-200 px-4 outline-none placeholder:text-zinc-400 focus:border-orange-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | { code?: string; label: string; value: string }>;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm font-bold text-zinc-800">
      {label} {required ? <span className="text-red-600">*</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-2 h-12 w-full rounded-sm border border-zinc-200 bg-white px-4 outline-none focus:border-orange-500 disabled:cursor-wait disabled:bg-zinc-100"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const normalizedOption = typeof option === "string" ? { label: option, value: option, code: option } : option;

          return (
            <option key={normalizedOption.code ?? normalizedOption.value} value={normalizedOption.value}>
              {normalizedOption.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className={strong ? "font-black text-zinc-950" : "text-zinc-600"}>{label}</span>
      <span className={strong ? "text-xl font-black text-[#f65f18]" : "text-right font-bold text-zinc-950"}>{value}</span>
    </div>
  );
}
