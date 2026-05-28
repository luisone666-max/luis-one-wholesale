import argparse
import csv
import json
import math
import os
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AUDIT_ROOT = ROOT / "tmp-imports" / "google-ok" / "price-audit"


def clean(value):
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).strip())


def norm(value):
    return clean(value).upper()


def money(value):
    return float(clean(value).replace(",", ""))


def price_tiers(retail, wholesale):
    return [
        {"min_qty": 1, "max_qty": 5, "unit_price": int(retail)},
        {"min_qty": 6, "max_qty": None, "unit_price": int(wholesale)},
    ]


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


def latest_audit_dir():
    candidates = [path for path in AUDIT_ROOT.iterdir() if path.is_dir()]
    if not candidates:
        raise RuntimeError(f"No price audit directory found under {AUDIT_ROOT}")
    return sorted(candidates, key=lambda path: path.name)[-1]


def read_csv(path):
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def write_csv(path, rows, fieldnames):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def update_rows_from_audit(audit_dir):
    rows = []
    for row in read_csv(audit_dir / "ok-price-changes.csv"):
        rows.append(
            {
                "source": "price_change",
                "preview_id": clean(row["old_preview_id"]),
                "source_code": clean(row["source_code"]),
                "variant_name": clean(row["variant_name"]),
                "old_cost": clean(row["old_cost"]),
                "current_cost": clean(row["current_cost"]),
                "current_retail_1_5pcs": int(money(row["current_retail_1_5pcs"])),
                "current_wholesale_6pcs_plus": int(money(row["current_wholesale_6pcs_plus"])),
                "sheet": clean(row["sheet"]),
                "note": clean(row.get("current_source_title")),
            }
        )

    missing_by_code = {norm(row["source_code"]): row for row in read_csv(audit_dir / "ok-missing-from-current-sheet.csv")}
    cross_path = audit_dir / "ok-cross-sheet-price-matches.csv"
    if cross_path.exists():
        for row in read_csv(cross_path):
            old = missing_by_code.get(norm(row["source_code"]))
            if not old:
                continue
            if abs(money(row["current_cost"]) - money(row["old_cost"])) < 0.001:
                continue
            rows.append(
                {
                    "source": "cross_sheet_price_change",
                    "preview_id": clean(old["old_preview_id"]),
                    "source_code": clean(row["source_code"]),
                    "variant_name": clean(row["variant_name"]),
                    "old_cost": clean(row["old_cost"]),
                    "current_cost": clean(row["current_cost"]),
                    "current_retail_1_5pcs": int(money(row["current_retail_1_5pcs"])),
                    "current_wholesale_6pcs_plus": int(money(row["current_wholesale_6pcs_plus"])),
                    "sheet": clean(row["old_sheet"]),
                    "note": f"Moved to {clean(row['current_sheet'])}: {clean(row['current_source_title'])}",
                }
            )
    return rows


def source_code_from_fits(fits):
    match = re.search(r"Source code:\s*([^;]+)", clean(fits), flags=re.IGNORECASE)
    return clean(match.group(1)) if match else ""


def product_rows_for_preview_id(preview_id):
    query = "?admin_notes=ilike." + urllib.parse.quote(f"*{preview_id}*") + "&select=id,sku,name,retail_price,active,admin_notes"
    return request_json("GET", "products", query, prefer=None) or []


def variants_for_product(product_id):
    query = "?product_id=eq." + urllib.parse.quote(product_id) + "&select=id,product_id,variant_sku,variant_name,fits,active,sort_order"
    return request_json("GET", "product_variants", query, prefer=None) or []


def variant_score(row, variant):
    source_code = norm(row["source_code"])
    fits_code = norm(source_code_from_fits(variant.get("fits")))
    variant_name = norm(variant.get("variant_name"))
    wanted_name = norm(row.get("variant_name"))

    if fits_code != source_code and source_code not in variant_name:
        return -1

    score = 10
    if fits_code == source_code:
        score += 50
    if wanted_name and variant_name == wanted_name:
        score += 25
    elif wanted_name and wanted_name in variant_name:
        score += 10
    if variant.get("active"):
        score += 2
    return score


def find_variant(row):
    products = product_rows_for_preview_id(row["preview_id"])
    candidates = []
    for product in products:
        for variant in variants_for_product(product["id"]):
            score = variant_score(row, variant)
            if score >= 0:
                candidates.append((score, product, variant))

    candidates.sort(key=lambda item: item[0], reverse=True)
    if not candidates:
        return None, products, []

    best_score = candidates[0][0]
    best = [item for item in candidates if item[0] == best_score]
    if len(best) > 1:
        return "ambiguous", products, best
    _, product, variant = candidates[0]
    return (product, variant), products, candidates


def replace_variant_tiers(variant_id, retail, wholesale):
    request_json("DELETE", "product_variant_price_tiers", "?variant_id=eq." + urllib.parse.quote(variant_id), prefer=None)
    payload = [{"variant_id": variant_id, **tier} for tier in price_tiers(retail, wholesale)]
    request_json("POST", "product_variant_price_tiers", payload=payload, prefer="return=minimal")


def get_variant_tiers(variant_ids):
    tiers = []
    for index in range(0, len(variant_ids), 150):
        chunk = variant_ids[index : index + 150]
        quoted = ",".join(urllib.parse.quote(item) for item in chunk)
        rows = request_json(
            "GET",
            "product_variant_price_tiers",
            f"?variant_id=in.({quoted})&select=variant_id,min_qty,max_qty,unit_price",
            prefer=None,
        )
        tiers.extend(rows or [])
    return tiers


def recalc_product_tiers(product_id):
    variants = [row for row in variants_for_product(product_id) if row.get("active")]
    if not variants:
        return None
    tiers = get_variant_tiers([row["id"] for row in variants])
    retail_values = [money(row["unit_price"]) for row in tiers if int(row["min_qty"]) == 1]
    wholesale_values = [money(row["unit_price"]) for row in tiers if int(row["min_qty"]) == 6]
    if not retail_values or not wholesale_values:
        return None
    retail = int(min(retail_values))
    wholesale = int(min(wholesale_values))
    request_json("PATCH", "products", "?id=eq." + urllib.parse.quote(product_id), payload={"retail_price": retail}, prefer=None)
    request_json("DELETE", "product_price_tiers", "?product_id=eq." + urllib.parse.quote(product_id), prefer=None)
    request_json("POST", "product_price_tiers", payload=[{"product_id": product_id, **tier} for tier in price_tiers(retail, wholesale)], prefer="return=minimal")
    return {"retail_price": retail, "wholesale_6pcs_plus": wholesale, "active_variant_count": len(variants)}


def current_variant_tiers(variant_id):
    rows = request_json(
        "GET",
        "product_variant_price_tiers",
        "?variant_id=eq." + urllib.parse.quote(variant_id) + "&select=min_qty,max_qty,unit_price&order=min_qty.asc",
        prefer=None,
    )
    return rows or []


def main():
    parser = argparse.ArgumentParser(description="Update only OK variant/product prices from the latest OK price audit.")
    parser.add_argument("--audit-dir", default="", help="Audit directory. Defaults to latest tmp-imports/google-ok/price-audit/*.")
    parser.add_argument("--apply", action="store_true", help="Actually write database changes. Omit for dry-run.")
    args = parser.parse_args()

    audit_dir = Path(args.audit_dir) if args.audit_dir else latest_audit_dir()
    rows = update_rows_from_audit(audit_dir)
    report_rows = []
    affected_products = {}
    matched = 0
    updated = 0
    skipped = 0

    for row in rows:
        result, products, candidates = find_variant(row)
        base_report = {
            "source": row["source"],
            "preview_id": row["preview_id"],
            "source_code": row["source_code"],
            "variant_name": row["variant_name"],
            "old_cost": row["old_cost"],
            "current_cost": row["current_cost"],
            "target_retail_1_5pcs": row["current_retail_1_5pcs"],
            "target_wholesale_6pcs_plus": row["current_wholesale_6pcs_plus"],
            "matched_product_id": "",
            "matched_product_name": "",
            "matched_variant_id": "",
            "matched_variant_name": "",
            "matched_variant_sku": "",
            "old_db_tiers": "",
            "status": "",
            "message": "",
        }

        if result is None:
            skipped += 1
            base_report["status"] = "SKIP"
            base_report["message"] = f"No variant match. Product matches: {len(products)}"
            report_rows.append(base_report)
            continue
        if result == "ambiguous":
            skipped += 1
            base_report["status"] = "SKIP"
            base_report["message"] = "Ambiguous variant match: " + "; ".join(
                f"{product['name']} / {variant['variant_name']}" for _, product, variant in candidates[:5]
            )
            report_rows.append(base_report)
            continue

        product, variant = result
        matched += 1
        old_tiers = current_variant_tiers(variant["id"])
        base_report.update(
            {
                "matched_product_id": product["id"],
                "matched_product_name": product["name"],
                "matched_variant_id": variant["id"],
                "matched_variant_name": variant["variant_name"],
                "matched_variant_sku": variant.get("variant_sku") or "",
                "old_db_tiers": json.dumps(old_tiers, ensure_ascii=False),
            }
        )

        if args.apply:
            replace_variant_tiers(variant["id"], row["current_retail_1_5pcs"], row["current_wholesale_6pcs_plus"])
            affected_products[product["id"]] = product
            updated += 1
            base_report["status"] = "UPDATED"
            base_report["message"] = "Variant price tiers replaced."
        else:
            base_report["status"] = "DRY_RUN_MATCH"
            base_report["message"] = "Matched only; no database write."
        report_rows.append(base_report)

    product_reports = []
    if args.apply:
        for product_id, product in affected_products.items():
            recalculated = recalc_product_tiers(product_id)
            product_reports.append(
                {
                    "product_id": product_id,
                    "product_name": product["name"],
                    "product_sku": product["sku"],
                    "retail_price": recalculated["retail_price"] if recalculated else "",
                    "wholesale_6pcs_plus": recalculated["wholesale_6pcs_plus"] if recalculated else "",
                    "active_variant_count": recalculated["active_variant_count"] if recalculated else "",
                    "status": "UPDATED" if recalculated else "SKIP",
                }
            )

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    mode = "applied" if args.apply else "dry-run"
    output_dir = audit_dir / f"price-update-{mode}-{timestamp}"
    fieldnames = [
        "source",
        "preview_id",
        "source_code",
        "variant_name",
        "old_cost",
        "current_cost",
        "target_retail_1_5pcs",
        "target_wholesale_6pcs_plus",
        "matched_product_id",
        "matched_product_name",
        "matched_variant_id",
        "matched_variant_name",
        "matched_variant_sku",
        "old_db_tiers",
        "status",
        "message",
    ]
    write_csv(output_dir / "variant-update-report.csv", report_rows, fieldnames)
    if product_reports:
        write_csv(
            output_dir / "product-tier-recalc-report.csv",
            product_reports,
            ["product_id", "product_name", "product_sku", "retail_price", "wholesale_6pcs_plus", "active_variant_count", "status"],
        )
    summary = {
        "mode": mode,
        "audit_dir": str(audit_dir),
        "candidate_updates": len(rows),
        "matched_variants": matched,
        "updated_variants": updated,
        "skipped": skipped,
        "affected_products": len(affected_products),
        "report_dir": str(output_dir),
    }
    (output_dir / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    if skipped:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
