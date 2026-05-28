import argparse
import csv
import hashlib
import json
import math
import mimetypes
import os
import re
import tempfile
import time
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PREVIEW_DIR = ROOT / "tmp-imports" / "google-ok" / "preview"
PRODUCTS_CSV = PREVIEW_DIR / "ok-products-preview-merged-models.csv"
VARIANTS_CSV = PREVIEW_DIR / "ok-variants-preview-merged-models.csv"
PROGRESS_PATH = PREVIEW_DIR / "ok-upload-progress.json"


def clean(value):
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).strip())


def slugify(value, fallback="item"):
    text = clean(value).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or fallback


def stable_suffix(*parts, length=8):
    raw = "|".join(clean(part) for part in parts)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:length]


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
CATEGORY_CACHE = {}


def request_json(method, table, query="", payload=None, prefer="return=representation", timeout=120, retries=4):
    url = f"{SUPABASE_URL}/rest/v1/{table}{query}"
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer

    last_error = None
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body) if body else None
        except urllib.error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace")
            last_error = RuntimeError(f"{method} {table} failed: {exc.code} {details}")
            if exc.code not in {429, 500, 502, 503, 504} or attempt == retries:
                raise last_error from exc
        except (TimeoutError, urllib.error.URLError) as exc:
            last_error = RuntimeError(f"{method} {table} failed: {exc}")
            if attempt == retries:
                raise last_error from exc
        time.sleep(min(12, 1.5 * (attempt + 1)))
    raise last_error or RuntimeError(f"{method} {table} failed")


def storage_upload(local_public_path, image_cache):
    local_public_path = clean(local_public_path)
    if not local_public_path:
        return ""
    if local_public_path.startswith("http://") or local_public_path.startswith("https://"):
        return local_public_path
    if local_public_path in image_cache:
        return image_cache[local_public_path]

    local_path = ROOT / "public" / local_public_path.lstrip("/")
    if not local_path.exists():
        return ""

    data = local_path.read_bytes()
    digest = hashlib.sha1(data).hexdigest()[:16]
    ext = local_path.suffix.lower() or ".png"
    content_type = mimetypes.guess_type(local_path.name)[0] or "image/png"
    object_path = f"products/google-ok/{digest}{ext}"
    url = f"{SUPABASE_URL}/storage/v1/object/product-images/{urllib.parse.quote(object_path, safe='/')}"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }

    for attempt in range(5):
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=180):
                break
        except urllib.error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace")
            if exc.code == 400:
                image_cache[local_public_path] = ""
                return ""
            if exc.code not in {429, 500, 502, 503, 504} or attempt == 4:
                if exc.code >= 500:
                    image_cache[local_public_path] = ""
                    return ""
                raise RuntimeError(f"Storage upload failed: {exc.code} {details}") from exc
        except (TimeoutError, urllib.error.URLError) as exc:
            if attempt == 4:
                image_cache[local_public_path] = ""
                return ""
        time.sleep(min(15, 2 * (attempt + 1)))

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/product-images/{object_path}"
    image_cache[local_public_path] = public_url
    return public_url


def read_csv(path):
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def load_progress(reset=False, reset_completed=False):
    if reset or not PROGRESS_PATH.exists():
        return {"completed_skus": [], "image_cache": {}, "errors": []}
    progress = json.loads(PROGRESS_PATH.read_text(encoding="utf-8"))
    if reset_completed:
        progress["completed_skus"] = []
        progress["errors"] = []
    return progress


def save_progress(progress):
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix="ok-upload-progress-", suffix=".json", dir=str(PREVIEW_DIR))
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        json.dump(progress, fh, indent=2, ensure_ascii=False)
    Path(temp_name).replace(PROGRESS_PATH)


def price_tiers(retail, wholesale):
    return [
        {"min_qty": 1, "max_qty": 5, "unit_price": int(retail)},
        {"min_qty": 6, "max_qty": None, "unit_price": int(wholesale)},
    ]


def get_or_create_category(name, parent_id=None, level=1, sort_order=0):
    name = clean(name)
    cache_key = f"{parent_id or 'root'}:{slugify(name)}"
    if cache_key in CATEGORY_CACHE:
        return CATEGORY_CACHE[cache_key]
    slug = slugify(name)
    existing = request_json("GET", "categories", "?slug=eq." + urllib.parse.quote(slug) + "&select=*", prefer=None)
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
        "show_on_homepage": level == 1,
        "show_in_navigation": level <= 2,
        "sort_order": sort_order,
        "template_type": "marketplace",
        "description": f"{name} products.",
    }
    created = request_json("POST", "categories", payload=payload)[0]
    CATEGORY_CACHE[cache_key] = created
    return created


def ensure_category_path(path_text):
    names = [clean(part) for part in clean(path_text).split(">") if clean(part)]
    categories = []
    parent = None
    for index, name in enumerate(names):
        category = get_or_create_category(name, parent["id"] if parent else None, index + 1, 200 + index)
        categories.append(category)
        parent = category
    return categories


def product_sku(row):
    base = slugify(row["english_product_name"]).upper()[:64]
    return f"OK-{base}-{stable_suffix(row['preview_id'], row['english_product_name']).upper()}"[:96]


def product_slug(row, sku):
    return f"{slugify(row['english_product_name'])}-{stable_suffix(sku)}"[:120]


def brand_model_from_name(name):
    if " - " not in name:
        return "OK", ""
    suffix = clean(name.split(" - ", 1)[1])
    return "OK", suffix


def safe_float(value, default=0.0):
    try:
        return float(clean(value))
    except ValueError:
        return default


def product_payload(row, sku, categories, image_url):
    name = clean(row["english_product_name"])
    retail_min = int(safe_float(row["retail_min_1_5pcs"]))
    wholesale_min = int(safe_float(row["wholesale_min_6pcs_plus"]))
    cost_min = safe_float(row["cost_min"])
    cost_max = safe_float(row["cost_max"])
    brand, model = brand_model_from_name(name)
    description = (
        f"{name}. Ready-stock OK motorcycle part. Select the exact model, size, color, or SKU variant before ordering. "
        "Final availability is confirmed before release."
    )
    return {
        "sku": sku,
        "name": name,
        "slug": product_slug(row, sku),
        "category_id": categories[0]["id"] if categories else None,
        "subcategory_id": categories[1]["id"] if len(categories) > 1 else None,
        "child_category_id": categories[2]["id"] if len(categories) > 2 else None,
        "brand": brand,
        "model": model or clean(row.get("sheet")),
        "moq": 1,
        "retail_price": retail_min,
        "stock_status": "ready_stock",
        "lead_time": "To be confirmed",
        "image_url": image_url or None,
        "description": description,
        "supplier_notes": None,
        "internal_cost_notes": (
            f"OK supplier import. Supplier PRICE is cost. Cost range PHP {cost_min:.2f}-{cost_max:.2f}. "
            f"Retail 1-5pcs starts PHP {retail_min}; 6pcs+ starts PHP {wholesale_min}."
        ),
        "admin_notes": (
            f"Imported from Google OK preview: {row['sheet']} / {row['preview_id']}. "
            f"Source title: {row['source_title']}. Review note: {row.get('review_note') or 'none'}."
        ),
        "active": True,
    }


def upsert_product(row, categories, image_url):
    sku = product_sku(row)
    payload = product_payload(row, sku, categories, image_url)
    product = request_json(
        "POST",
        "products",
        "?on_conflict=sku&select=*",
        [payload],
        prefer="resolution=merge-duplicates,return=representation",
    )[0]
    return product, sku


def replace_product_images(product_id, image_url):
    request_json("DELETE", "product_images", "?product_id=eq." + urllib.parse.quote(product_id), prefer=None)
    if image_url:
        request_json("POST", "product_images", payload=[{"product_id": product_id, "image_url": image_url, "sort_order": 0}])


def replace_product_tiers(product_id, retail, wholesale):
    request_json("DELETE", "product_price_tiers", "?product_id=eq." + urllib.parse.quote(product_id), prefer=None)
    request_json("POST", "product_price_tiers", payload=[{"product_id": product_id, **tier} for tier in price_tiers(retail, wholesale)])


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
    for index in range(0, len(ids), 150):
        chunk = ids[index : index + 150]
        quoted = ",".join(urllib.parse.quote(item) for item in chunk)
        request_json("DELETE", "product_variant_price_tiers", f"?variant_id=in.({quoted})", prefer=None)
    request_json("DELETE", "product_variants", "?product_id=eq." + urllib.parse.quote(product_id), prefer=None)
    return len(ids)


def unique_variant_sku(product_sku_value, variant, index, used_skus):
    source_code = clean(variant.get("source_code"))
    label = clean(variant.get("variant_name")) or source_code or f"Variant {index}"
    base = f"{product_sku_value}-{slugify(source_code or label).upper()}"[:88].rstrip("-")
    suffix = stable_suffix(product_sku_value, source_code, label, index).upper()
    candidate = f"{base}-{suffix}"[:96].rstrip("-")
    counter = 2
    while candidate in used_skus:
        candidate = f"{base}-{suffix}-{counter}"[:96].rstrip("-")
        counter += 1
    used_skus.add(candidate)
    return candidate


def insert_variants(product_id, product_sku_value, product_image_url, rows, image_cache, batch_size=80):
    if not rows:
        rows = [{"variant_name": "Default", "cost": 0, "retail_price_1_5pcs": 0, "wholesale_price_6pcs_plus": 0}]
    used_skus = set()
    created_count = 0
    tier_count = 0

    for start in range(0, len(rows), batch_size):
        chunk = rows[start : start + batch_size]
        payload = []
        tier_inputs = []
        for offset, row in enumerate(chunk, start=start + 1):
            image_url = storage_upload(row.get("source_image_url"), image_cache) or product_image_url or None
            variant_name = clean(row.get("variant_name")) or clean(row.get("source_code")) or f"Variant {offset}"
            model = clean(row.get("model"))
            fits_parts = [
                f"Color: {clean(row.get('color'))}" if clean(row.get("color")) else "",
                f"Size: {clean(row.get('size'))}" if clean(row.get("size")) else "",
                f"Source code: {clean(row.get('source_code'))}" if clean(row.get("source_code")) else "",
                f"Qty/box: {clean(row.get('qty_box'))}" if clean(row.get("qty_box")) else "",
            ]
            payload.append(
                {
                    "product_id": product_id,
                    "variant_name": variant_name,
                    "variant_sku": unique_variant_sku(product_sku_value, row, offset, used_skus),
                    "model": model or None,
                    "fits": "; ".join(part for part in fits_parts if part) or None,
                    "image_url": image_url,
                    "moq": 1,
                    "stock_status": "ready_stock",
                    "lead_time": "To be confirmed",
                    "active": True,
                    "sort_order": offset,
                }
            )
            tier_inputs.append(
                price_tiers(
                    int(safe_float(row.get("retail_price_1_5pcs"))),
                    int(safe_float(row.get("wholesale_price_6pcs_plus"))),
                )
            )
        created = request_json("POST", "product_variants", payload=payload)
        tier_rows = []
        for variant, tiers in zip(created, tier_inputs):
            tier_rows.extend({"variant_id": variant["id"], **tier} for tier in tiers)
        if tier_rows:
            request_json("POST", "product_variant_price_tiers", payload=tier_rows)
        created_count += len(created)
        tier_count += len(tier_rows)
    return created_count, tier_count


def deactivate_stale_ok_products(current_skus):
    existing = []
    offset = 0
    page_size = 1000
    while True:
        batch = request_json(
            "GET",
            "products",
            f"?sku=like.OK-%25&select=id,sku,admin_notes&limit={page_size}&offset={offset}",
            prefer=None,
        )
        if not batch:
            break
        existing.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    stale_ids = [
        item["id"]
        for item in (existing or [])
        if item.get("sku") not in current_skus and "Google OK preview" in clean(item.get("admin_notes"))
    ]
    for index in range(0, len(stale_ids), 100):
        chunk = stale_ids[index : index + 100]
        quoted = ",".join(urllib.parse.quote(item) for item in chunk)
        request_json("PATCH", "products", f"?id=in.({quoted})", payload={"active": False}, prefer=None)
    return len(stale_ids)


def main():
    parser = argparse.ArgumentParser(description="Slow, resumable import for Google OK preview products.")
    parser.add_argument("--limit", type=int, default=0, help="Import only the first N pending products.")
    parser.add_argument("--batch-size", type=int, default=20, help="Pause after this many products.")
    parser.add_argument("--delay", type=float, default=1.5, help="Seconds to pause between product batches.")
    parser.add_argument("--variant-batch-size", type=int, default=80, help="Variant insert batch size.")
    parser.add_argument("--reset-progress", action="store_true", help="Start a fresh progress file.")
    parser.add_argument("--reset-completed", action="store_true", help="Reimport all products while preserving uploaded image cache.")
    parser.add_argument("--cleanup-stale", action="store_true", help="Deactivate stale previous OK Google products after import.")
    args = parser.parse_args()

    product_rows = read_csv(PRODUCTS_CSV)
    variant_rows = read_csv(VARIANTS_CSV)
    variants_by_preview = {}
    for row in variant_rows:
        variants_by_preview.setdefault(row["preview_id"], []).append(row)

    progress = load_progress(args.reset_progress, args.reset_completed)
    completed = set(progress.get("completed_skus", []))
    image_cache = progress.setdefault("image_cache", {})
    current_skus = {product_sku(row) for row in product_rows}
    pending_rows = [row for row in product_rows if product_sku(row) not in completed]
    if args.limit:
        pending_rows = pending_rows[: args.limit]

    summary = {
        "total_products_in_preview": len(product_rows),
        "pending_selected": len(pending_rows),
        "products_completed_before_run": len(completed),
        "products_imported": 0,
        "variants_created": 0,
        "variant_tiers_created": 0,
        "product_tiers_replaced": 0,
        "old_variants_deleted": 0,
        "images_cached": len(image_cache),
        "errors": [],
    }

    for run_index, row in enumerate(pending_rows, start=1):
        sku = product_sku(row)
        try:
            categories = ensure_category_path(row["category"])
            product_image_url = storage_upload(row.get("main_image_url"), image_cache)
            product, sku = upsert_product(row, categories, product_image_url)
            replace_product_images(product["id"], product_image_url)
            replace_product_tiers(
                product["id"],
                int(safe_float(row["retail_min_1_5pcs"])),
                int(safe_float(row["wholesale_min_6pcs_plus"])),
            )
            summary["product_tiers_replaced"] += 2
            summary["old_variants_deleted"] += clear_old_variants(product["id"])
            variant_count, tier_count = insert_variants(
                product["id"],
                sku,
                product_image_url,
                variants_by_preview.get(row["preview_id"], []),
                image_cache,
                args.variant_batch_size,
            )
            summary["variants_created"] += variant_count
            summary["variant_tiers_created"] += tier_count
            completed.add(sku)
            progress["completed_skus"] = sorted(completed)
            progress["image_cache"] = image_cache
            save_progress(progress)
            summary["products_imported"] += 1

            if run_index % args.batch_size == 0:
                print(
                    f"Imported {summary['products_imported']}/{len(pending_rows)} selected products; "
                    f"{len(completed)}/{len(product_rows)} preview products complete."
                )
                time.sleep(args.delay)
        except Exception as exc:
            message = f"{sku} ({row.get('english_product_name')}): {exc}"
            summary["errors"].append(message)
            progress.setdefault("errors", []).append(message)
            save_progress(progress)
            print(f"ERROR {message}")
            time.sleep(max(args.delay, 2.0))

    if args.cleanup_stale and not args.limit:
        summary["stale_ok_products_deactivated"] = deactivate_stale_ok_products(current_skus)

    summary["products_completed_after_run"] = len(completed)
    summary["images_cached_after_run"] = len(image_cache)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    if summary["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
