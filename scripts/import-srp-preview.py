import csv
import hashlib
import json
import math
import os
import re
import time
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PREVIEW_DIR = ROOT / "tmp-imports" / "srp-preview"
PRODUCTS_CSV = PREVIEW_DIR / "srp-products-preview.csv"
VARIANTS_CSV = PREVIEW_DIR / "srp-variants-preview.csv"


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


def load_env():
    env_path = ROOT / ".env.local"
    values = {}
    with env_path.open("r", encoding="utf-8") as fh:
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
CATEGORY_CACHE = {}


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


def get_or_create_category(name, parent_id=None, level=1, sort_order=0):
    cache_key = f"{parent_id or 'root'}:{slugify(name)}"
    if cache_key in CATEGORY_CACHE:
        return CATEGORY_CACHE[cache_key]
    slug = slugify(name)
    query = "?slug=eq." + urllib.parse.quote(slug) + "&select=*"
    existing = request_json("GET", "categories", query, prefer=None)
    if existing:
        CATEGORY_CACHE[cache_key] = existing[0]
        return existing[0]
    payload = {
        "name_en": name,
        "name_zh": None,
        "slug": slug,
        "parent_id": parent_id,
        "level": level,
        "active": True,
        "show_on_homepage": False,
        "show_in_navigation": level <= 2,
        "sort_order": sort_order,
        "template_type": "marketplace",
        "description": f"{name} products.",
    }
    created = request_json("POST", "categories", payload=payload)
    CATEGORY_CACHE[cache_key] = created[0]
    return created[0]


def ensure_category_path(path_text):
    names = [clean(part) for part in path_text.split(">") if clean(part)]
    result = []
    parent = None
    for index, name in enumerate(names):
        category = get_or_create_category(name, parent["id"] if parent else None, index + 1, 80 + index)
        result.append(category)
        parent = category
    return result


def price_tiers(retail, wholesale):
    return [
        {"min_qty": 1, "max_qty": 5, "unit_price": int(retail)},
        {"min_qty": 6, "max_qty": None, "unit_price": int(wholesale)},
    ]


def optimize_image(local_path):
    raw = local_path.read_bytes()
    try:
        source = Image.open(BytesIO(raw)).convert("RGB")
        source.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        for quality in (88, 82, 76, 70, 64):
            output = BytesIO()
            source.save(output, format="JPEG", quality=quality, optimize=True, progressive=True)
            data = output.getvalue()
            if len(data) <= 1_800_000:
                return data, ".jpg", "image/jpeg"
        return data, ".jpg", "image/jpeg"
    except Exception:
        ext = local_path.suffix.lower() or ".png"
        content_type = "image/png" if ext == ".png" else "image/jpeg"
        return raw, ext, content_type


def upload_image(product, local_public_path):
    if not local_public_path:
        return ""
    local_path = ROOT / "public" / local_public_path.lstrip("/")
    if not local_path.exists():
        raise RuntimeError(f"Missing image file: {local_public_path}")
    data, ext, content_type = optimize_image(local_path)
    digest = hashlib.sha1(data).hexdigest()[:10]
    storage_path = f"products/srp/{slugify(product['sku'])}/main-{digest}{ext}"
    url = f"{SUPABASE_URL}/storage/v1/object/product-images/{urllib.parse.quote(storage_path, safe='/')}"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120):
            pass
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Storage upload failed: {exc.code} {details}") from exc
    return f"{SUPABASE_URL}/storage/v1/object/public/product-images/{storage_path}"


def read_csv(path):
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def product_sku(row):
    return f"SRP-{slugify(row['brand'] or 'helmet').upper()}-{stable_suffix(row['preview_id'], row['english_product_name']).upper()}"


def variant_name(row):
    color = clean(row.get("color"))
    size = clean(row.get("size"))
    if color and size:
        return f"{color} / {size}"
    return color or size or "Default"


def upsert_product(row, categories, image_url):
    sku = product_sku(row)
    name = clean(row["english_product_name"])
    slug = f"{slugify(name)}-{stable_suffix(sku)}"
    srp = float(row["srp"])
    cost = int(float(row["computed_cost_30pct"]))
    retail = int(float(row["retail_price_1_5pcs"]))
    wholesale = int(float(row["wholesale_price_6pcs_plus"]))
    description = (
        f"{name}. Ready-stock motorcycle helmet from {clean(row['brand']) or 'supplier'} with selectable color and size variants. "
        "Final color and size availability is confirmed before release."
    )
    payload = {
        "sku": sku,
        "name": name,
        "slug": slug,
        "category_id": categories[0]["id"] if categories else None,
        "subcategory_id": categories[1]["id"] if len(categories) > 1 else None,
        "child_category_id": categories[2]["id"] if len(categories) > 2 else None,
        "brand": clean(row["brand"]),
        "model": clean(row["supplier_name"]),
        "moq": 1,
        "stock_status": "ready_stock",
        "lead_time": "To be confirmed",
        "image_url": image_url or None,
        "description": description,
        "supplier_notes": None,
        "internal_cost_notes": (
            f"SRP import. Source SRP PHP {srp:.2f}; calculated supplier cost is 30% of SRP = PHP {cost:.2f}. "
            f"Retail 1-5pcs PHP {retail}; 6pcs+ PHP {wholesale}."
        ),
        "admin_notes": f"Imported from SRP preview: {row['source_file']} / {row['sheet']} / {row['preview_id']}.",
        "active": True,
        "retail_price": retail,
    }
    created = request_json(
        "POST",
        "products",
        "?on_conflict=sku&select=*",
        [payload],
        prefer="resolution=merge-duplicates,return=representation",
    )[0]
    return created, sku, price_tiers(retail, wholesale)


def replace_product_images(product_id, image_url):
    request_json("DELETE", "product_images", "?product_id=eq." + urllib.parse.quote(product_id), prefer=None)
    if image_url:
        request_json(
            "POST",
            "product_images",
            payload=[{"product_id": product_id, "image_url": image_url, "sort_order": 0}],
        )


def replace_product_tiers(product_id, tiers):
    request_json("DELETE", "product_price_tiers", "?product_id=eq." + urllib.parse.quote(product_id), prefer=None)
    request_json("POST", "product_price_tiers", payload=[{"product_id": product_id, **tier} for tier in tiers])


def clear_old_variants(product_id):
    old = request_json(
        "GET",
        "product_variants",
        "?product_id=eq." + urllib.parse.quote(product_id) + "&select=id",
        prefer=None,
    )
    if not old:
        return 0
    ids = [item["id"] for item in old]
    quoted = ",".join(urllib.parse.quote(item) for item in ids)
    request_json("DELETE", "product_variant_price_tiers", f"?variant_id=in.({quoted})", prefer=None)
    request_json("DELETE", "product_variants", "?product_id=eq." + urllib.parse.quote(product_id), prefer=None)
    return len(ids)


def insert_variants(product_id, product_sku_value, variants, tiers, image_url):
    if not variants:
        variants = [{"color": "", "size": ""}]
    payload = []
    for index, variant in enumerate(variants, start=1):
        name = variant_name(variant)
        sku = f"{product_sku_value}-{slugify(name, f'variant-{index}').upper()}"[:96]
        payload.append(
            {
                "product_id": product_id,
                "variant_name": name,
                "variant_sku": sku,
                "model": name,
                "fits": f"Size: {clean(variant.get('size'))}" if clean(variant.get("size")) else None,
                "image_url": image_url or None,
                "moq": 1,
                "stock_status": "ready_stock",
                "lead_time": "To be confirmed",
                "active": True,
                "sort_order": index,
            }
        )
    created = request_json("POST", "product_variants", payload=payload)
    tier_rows = []
    for variant in created:
        tier_rows.extend({"variant_id": variant["id"], **tier} for tier in tiers)
    if tier_rows:
        request_json("POST", "product_variant_price_tiers", payload=tier_rows)
    return len(created)


def main():
    product_rows = read_csv(PRODUCTS_CSV)
    variant_rows = read_csv(VARIANTS_CSV)
    variants_by_preview = {}
    for row in variant_rows:
        variants_by_preview.setdefault(row["preview_id"], []).append(row)

    summary = {
        "products_created_or_updated": 0,
        "images_uploaded": 0,
        "product_tiers_replaced": 0,
        "old_variants_deleted": 0,
        "variants_created": 0,
        "errors": [],
    }

    for index, row in enumerate(product_rows, start=1):
        try:
            row["sku"] = product_sku(row)
            categories = ensure_category_path(row["category"])
            image_url = upload_image(row, row.get("main_image", ""))
            if image_url:
                summary["images_uploaded"] += 1
            product, sku, tiers = upsert_product(row, categories, image_url)
            replace_product_images(product["id"], image_url)
            replace_product_tiers(product["id"], tiers)
            summary["product_tiers_replaced"] += 1
            summary["old_variants_deleted"] += clear_old_variants(product["id"])
            summary["variants_created"] += insert_variants(
                product["id"],
                sku,
                variants_by_preview.get(row["preview_id"], []),
                tiers,
                image_url,
            )
            summary["products_created_or_updated"] += 1
            if index % 20 == 0:
                print(f"Imported {index}/{len(product_rows)} products...")
                time.sleep(0.2)
        except Exception as exc:
            summary["errors"].append(f"{row.get('preview_id', 'unknown')}: {exc}")

    print(json.dumps(summary, indent=2))
    if summary["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
