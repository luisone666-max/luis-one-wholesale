import csv
import hashlib
import json
import math
import re
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_CSV = ROOT / "tmp-imports" / "srp-preview" / "srp-products-preview.csv"


def clean(value):
    if value is None:
        return ""
    text = str(value).replace("\t", " ").strip()
    return re.sub(r"\s+", " ", text)


def slugify(text, fallback="item"):
    text = clean(text).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or fallback


def stable_suffix(*parts):
    raw = "|".join(clean(part) for part in parts)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:8]


def product_sku(row):
    return f"SRP-{slugify(row['brand'] or 'helmet').upper()}-{stable_suffix(row['preview_id'], row['english_product_name']).upper()}"


def load_env():
    values = {}
    with (ROOT / ".env.local").open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    url = values.get("NEXT_PUBLIC_SUPABASE_URL")
    key = values.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("Missing Supabase credentials in .env.local")
    return url.rstrip("/"), key


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
        with urllib.request.urlopen(req, timeout=90) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else None
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {table} failed: {exc.code} {details}") from exc


def price_tiers(retail, wholesale):
    return [
        {"min_qty": 1, "max_qty": 5, "unit_price": int(retail)},
        {"min_qty": 6, "max_qty": None, "unit_price": int(wholesale)},
    ]


def replace_product_tiers(product_id, tiers):
    request_json("DELETE", "product_price_tiers", "?product_id=eq." + urllib.parse.quote(product_id), prefer=None)
    request_json("POST", "product_price_tiers", payload=[{"product_id": product_id, **tier} for tier in tiers])


def replace_variant_tiers(product_id, tiers):
    variants = request_json(
        "GET",
        "product_variants",
        "?product_id=eq." + urllib.parse.quote(product_id) + "&select=id",
        prefer=None,
    )
    if not variants:
        return 0, 0
    ids = [variant["id"] for variant in variants]
    deleted_batches = 0
    inserted = 0
    for index in range(0, len(ids), 150):
        chunk = ids[index : index + 150]
        quoted = ",".join(urllib.parse.quote(item) for item in chunk)
        request_json("DELETE", "product_variant_price_tiers", f"?variant_id=in.({quoted})", prefer=None)
        deleted_batches += 1
        rows = []
        for variant_id in chunk:
            rows.extend({"variant_id": variant_id, **tier} for tier in tiers)
        request_json("POST", "product_variant_price_tiers", payload=rows)
        inserted += len(rows)
    request_json("PATCH", "product_variants", "?product_id=eq." + urllib.parse.quote(product_id), payload={"active": True}, prefer=None)
    return len(ids), inserted


def main():
    rows = list(csv.DictReader(PRODUCTS_CSV.open("r", encoding="utf-8-sig", newline="")))
    summary = {
        "products_updated": 0,
        "product_tiers_replaced": 0,
        "variants_updated": 0,
        "variant_tiers_inserted": 0,
        "missing_products": [],
        "errors": [],
    }
    for row in rows:
        sku = product_sku(row)
        try:
            product = request_json(
                "GET",
                "products",
                "?sku=eq." + urllib.parse.quote(sku) + "&select=id,sku,name",
                prefer=None,
            )
            if not product:
                summary["missing_products"].append(sku)
                continue
            product_id = product[0]["id"]
            srp = float(row["srp"])
            cost = math.ceil(srp * 0.70)
            retail = math.ceil(cost * 1.20)
            wholesale = math.ceil(cost * 1.12)
            tiers = price_tiers(retail, wholesale)
            payload = {
                "retail_price": retail,
                "active": True,
                "stock_status": "ready_stock",
                "internal_cost_notes": (
                    f"SRP import corrected. Source SRP PHP {srp:.2f}; supplier cost is 70% of SRP = PHP {cost:.2f}. "
                    f"Retail 1-5pcs PHP {retail}; 6pcs+ PHP {wholesale}."
                ),
                "admin_notes": (
                    f"Imported from SRP preview: {row['source_file']} / {row['sheet']} / {row['preview_id']}. "
                    "Price corrected after confirmation: cost = SRP x 70%."
                ),
            }
            request_json("PATCH", "products", "?id=eq." + urllib.parse.quote(product_id), payload=payload, prefer=None)
            replace_product_tiers(product_id, tiers)
            variant_count, variant_tiers = replace_variant_tiers(product_id, tiers)
            summary["products_updated"] += 1
            summary["product_tiers_replaced"] += len(tiers)
            summary["variants_updated"] += variant_count
            summary["variant_tiers_inserted"] += variant_tiers
        except Exception as exc:
            summary["errors"].append(f"{sku}: {exc}")
    print(json.dumps(summary, indent=2))
    if summary["missing_products"] or summary["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
