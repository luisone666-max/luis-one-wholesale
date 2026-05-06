import json
import math
import re
import sys
import urllib.parse
import urllib.request


def load_env():
    values = {}
    with open(".env.local", "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    url = values.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key = values.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not service_key:
        raise RuntimeError("Missing Supabase server credentials in .env.local")
    return url.rstrip("/"), service_key


SUPABASE_URL, SERVICE_KEY = load_env()


def request_json(method, table, query="", payload=None, prefer="return=representation"):
    url = f"{SUPABASE_URL}/rest/v1/{table}{query}"
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else None
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {table} failed: {exc.code} {details}") from exc


def price_tiers(cost):
    retail = math.ceil(cost * 1.15)
    return retail, [
        {"min_qty": 1, "max_qty": 5, "unit_price": retail},
        {"min_qty": 6, "max_qty": 12, "unit_price": math.ceil(cost * 1.10)},
        {"min_qty": 13, "max_qty": None, "unit_price": math.ceil(cost * 1.08)},
    ]


def original_srp(product):
    notes = product.get("internal_cost_notes") or ""
    srp_match = re.search(r"Imported GILLE SRP:\s*PHP\s*([\d,]+(?:\.\d+)?)", notes, flags=re.I)
    if srp_match:
        return float(srp_match.group(1).replace(",", ""))
    cost_match = re.search(r"Imported supplier cost:\s*PHP\s*([\d,]+(?:\.\d+)?)", notes, flags=re.I)
    if cost_match:
        return float(cost_match.group(1).replace(",", ""))
    current_retail = product.get("retail_price")
    if current_retail:
        return float(current_retail) / 1.15
    raise RuntimeError(f"Cannot find SRP for {product['sku']}")


def replace_product_tiers(product_id, tiers):
    query = "?product_id=eq." + urllib.parse.quote(product_id)
    request_json("DELETE", "product_price_tiers", query, prefer=None)
    payload = [{"product_id": product_id, **tier} for tier in tiers]
    request_json("POST", "product_price_tiers", payload=payload)


def replace_variant_tiers(variant_id, tiers):
    query = "?variant_id=eq." + urllib.parse.quote(variant_id)
    request_json("DELETE", "product_variant_price_tiers", query, prefer=None)
    payload = [{"variant_id": variant_id, **tier} for tier in tiers]
    request_json("POST", "product_variant_price_tiers", payload=payload)


def main():
    products = request_json(
        "GET",
        "products",
        "?select=id,sku,name,brand,retail_price,internal_cost_notes&brand=eq.GILLE&order=sku.asc",
        prefer=None,
    )
    updated_products = 0
    updated_variants = 0
    remaining = [
        product
        for product in products
        if "--all" in sys.argv or not (product.get("internal_cost_notes") or "").startswith("Imported GILLE SRP:")
    ]
    print(f"GILLE products found: {len(products)}")
    print(f"GILLE products to update: {len(remaining)}")
    for index, product in enumerate(remaining, start=1):
        srp = original_srp(product)
        cost = srp * 0.70
        retail, tiers = price_tiers(cost)
        notes = (
            f"Imported GILLE SRP: PHP {srp:.2f}. Supplier discount 30%; "
            f"calculated cost PHP {cost:.2f}. Retail +15%, wholesale 6-12 +10%, 13+ +8%."
        )
        query = "?id=eq." + urllib.parse.quote(product["id"])
        request_json(
            "PATCH",
            "products",
            query,
            payload={"retail_price": retail, "internal_cost_notes": notes},
            prefer=None,
        )
        replace_product_tiers(product["id"], tiers)
        variants = request_json(
            "GET",
            "product_variants",
            "?select=id&product_id=eq." + urllib.parse.quote(product["id"]),
            prefer=None,
        )
        for variant in variants:
            replace_variant_tiers(variant["id"], tiers)
            updated_variants += 1
        updated_products += 1
        print(f"Updated {index}/{len(remaining)}: {product['sku']} -> retail PHP {retail}")
    print(f"Updated GILLE products: {updated_products}")
    print(f"Updated GILLE variants: {updated_variants}")


if __name__ == "__main__":
    main()
