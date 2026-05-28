import csv
import importlib.util
import json
import math
import re
import time
import urllib.request
from collections import Counter, defaultdict, deque
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / "scripts" / "prepare-google-ok-preview.py"
BASELINE_VARIANTS = ROOT / "tmp-imports" / "google-ok" / "preview" / "ok-variants-preview-merged-models.csv"
AUDIT_ROOT = ROOT / "tmp-imports" / "google-ok" / "price-audit"

spec = importlib.util.spec_from_file_location("google_ok_preview_base", BASE_SCRIPT)
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)


def clean(value):
    return base.clean(value)


def norm(value):
    return re.sub(r"\s+", " ", clean(value).upper()).strip()


def num(value):
    if value is None or clean(value) == "":
        return None
    return float(value)


def price_tiers(cost):
    return math.ceil(float(cost) * 1.2), math.ceil(float(cost) * 1.12)


def csv_cells(values):
    return [{"text": clean(value), "images": []} for value in values]


def fetch_sheet_csv(gid, sheet_name, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{gid}-{base.slugify(sheet_name)}.csv"
    url = f"https://docs.google.com/spreadsheets/d/{base.SPREADSHEET_ID}/export?format=csv&gid={gid}"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        data = response.read()
    path.write_bytes(data)
    time.sleep(0.08)
    return path


def read_csv_rows(path):
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        return list(csv.reader(fh))


def parse_current_sheet(gid, sheet_name, csv_dir):
    path = fetch_sheet_csv(gid, sheet_name, csv_dir)
    rows = read_csv_rows(path)
    active_header = {}
    current_title = base.sheet_display_name(sheet_name)
    variants = []

    for row_number, values in enumerate(rows, start=1):
        cells = csv_cells(values)
        texts = [cell["text"] for cell in cells]
        maybe_header = base.header_map(cells)
        if maybe_header:
            active_header = maybe_header
            continue

        if base.is_title_row(texts):
            title_values = [clean(text) for text in texts if clean(text)]
            title = " ".join(title_values[:2])
            if title.upper() not in base.NON_PRODUCT_TITLES:
                current_title = title
            continue

        if not active_header:
            continue

        code = base.cell_text(cells, active_header.get("code"))
        qty_box, cost = base.infer_qty_and_price(
            cells,
            active_header.get("code", 0),
            active_header.get("qty"),
            active_header.get("price"),
        )
        if not base.looks_like_code(code) or cost is None:
            continue

        attrs = {}
        for index, label in active_header.get("attrs", []):
            value = base.cell_text(cells, index)
            if value:
                attrs[label.lower().replace("/", "_")] = value

        color = attrs.get("color") or attrs.get("colour") or ""
        model = (
            attrs.get("model")
            or attrs.get("fitment")
            or attrs.get("fit")
            or attrs.get("description")
            or attrs.get("brand")
            or ""
        )
        size = attrs.get("size") or attrs.get("type") or attrs.get("pcs") or attrs.get("specification") or ""
        retail, wholesale = price_tiers(cost)
        variants.append(
            {
                "sheet": sheet_name,
                "row": str(row_number),
                "source_title": current_title,
                "source_code": clean(code),
                "color": color,
                "model": model,
                "size": size,
                "qty_box": clean(qty_box),
                "cost": f"{float(cost):.2f}",
                "retail_price_1_5pcs": str(retail),
                "wholesale_price_6pcs_plus": str(wholesale),
            }
        )
    return variants, {"sheet": sheet_name, "gid": gid, "rows": len(rows), "variants": len(variants), "csv": str(path)}


def read_dict_csv(path):
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def write_dict_csv(path, rows, fieldnames):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def key_exact(row):
    return (norm(row.get("source_sheet") or row.get("sheet")), norm(row.get("source_code")), norm(row.get("source_row") or row.get("row")))


def key_attrs(row):
    return (
        norm(row.get("source_sheet") or row.get("sheet")),
        norm(row.get("source_code")),
        norm(row.get("color")),
        norm(row.get("model")),
        norm(row.get("size")),
    )


def key_model(row):
    return (
        norm(row.get("source_sheet") or row.get("sheet")),
        norm(row.get("source_code")),
        norm(row.get("model")),
        norm(row.get("color")),
    )


def key_code(row):
    return (norm(row.get("source_sheet") or row.get("sheet")), norm(row.get("source_code")))


def queue_index(rows, key_func):
    index = defaultdict(deque)
    for row in rows:
        index[key_func(row)].append(row)
    return index


def unique_index(rows, key_func):
    grouped = defaultdict(list)
    for row in rows:
        grouped[key_func(row)].append(row)
    return {key: values[0] for key, values in grouped.items() if len(values) == 1}


def remove_current(row, remaining, indexes):
    row_id = id(row)
    remaining.pop(row_id, None)
    for index in indexes:
        for key, queue in list(index.items()):
            filtered = deque(item for item in queue if id(item) != row_id)
            if filtered:
                index[key] = filtered
            else:
                index.pop(key, None)


def match_rows(baseline_rows, current_rows):
    remaining_current = {id(row): row for row in current_rows}
    exact_index = queue_index(current_rows, key_exact)
    attr_index = queue_index(current_rows, key_attrs)
    model_index = queue_index(current_rows, key_model)
    current_unique_code = unique_index(current_rows, key_code)
    baseline_code_counts = Counter(key_code(row) for row in baseline_rows)
    indexes = [exact_index, attr_index, model_index]

    matches = []
    missing = []
    for old in baseline_rows:
        match = None
        match_method = ""
        for method, key_func, index in [
            ("sheet_code_row", key_exact, exact_index),
            ("sheet_code_attrs", key_attrs, attr_index),
            ("sheet_code_model", key_model, model_index),
        ]:
            queue = index.get(key_func(old))
            while queue and id(queue[0]) not in remaining_current:
                queue.popleft()
            if queue:
                match = queue.popleft()
                match_method = method
                break

        if match is None and baseline_code_counts[key_code(old)] == 1:
            candidate = current_unique_code.get(key_code(old))
            if candidate is not None and id(candidate) in remaining_current:
                match = candidate
                match_method = "unique_sheet_code"

        if match is None:
            missing.append(old)
            continue

        remove_current(match, remaining_current, indexes)
        matches.append((old, match, match_method))

    return matches, missing, list(remaining_current.values())


def changed_row(old, current, match_method):
    old_cost = num(old.get("cost"))
    new_cost = num(current.get("cost"))
    old_retail, old_wholesale = price_tiers(old_cost)
    new_retail, new_wholesale = price_tiers(new_cost)
    cost_delta = new_cost - old_cost
    pct = (cost_delta / old_cost * 100) if old_cost else 0
    return {
        "match_method": match_method,
        "sheet": old.get("source_sheet", ""),
        "source_code": old.get("source_code", ""),
        "old_row": old.get("source_row", ""),
        "current_row": current.get("row", ""),
        "variant_name": old.get("variant_name", ""),
        "old_source_title": "",
        "current_source_title": current.get("source_title", ""),
        "old_color": old.get("color", ""),
        "current_color": current.get("color", ""),
        "old_model": old.get("model", ""),
        "current_model": current.get("model", ""),
        "old_size": old.get("size", ""),
        "current_size": current.get("size", ""),
        "old_qty_box": old.get("qty_box", ""),
        "current_qty_box": current.get("qty_box", ""),
        "old_cost": f"{old_cost:.2f}",
        "current_cost": f"{new_cost:.2f}",
        "cost_delta": f"{cost_delta:.2f}",
        "cost_delta_pct": f"{pct:.2f}",
        "old_retail_1_5pcs": str(old_retail),
        "current_retail_1_5pcs": str(new_retail),
        "retail_delta": str(new_retail - old_retail),
        "old_wholesale_6pcs_plus": str(old_wholesale),
        "current_wholesale_6pcs_plus": str(new_wholesale),
        "wholesale_delta": str(new_wholesale - old_wholesale),
        "old_preview_id": old.get("preview_id", ""),
        "old_variant_sku": old.get("variant_sku", ""),
    }


def missing_row(old):
    return {
        "sheet": old.get("source_sheet", ""),
        "source_code": old.get("source_code", ""),
        "old_row": old.get("source_row", ""),
        "variant_name": old.get("variant_name", ""),
        "old_color": old.get("color", ""),
        "old_model": old.get("model", ""),
        "old_size": old.get("size", ""),
        "old_qty_box": old.get("qty_box", ""),
        "old_cost": old.get("cost", ""),
        "old_preview_id": old.get("preview_id", ""),
        "old_variant_sku": old.get("variant_sku", ""),
    }


def current_new_row(row):
    return {
        "sheet": row.get("sheet", ""),
        "source_code": row.get("source_code", ""),
        "current_row": row.get("row", ""),
        "current_source_title": row.get("source_title", ""),
        "current_color": row.get("color", ""),
        "current_model": row.get("model", ""),
        "current_size": row.get("size", ""),
        "current_qty_box": row.get("qty_box", ""),
        "current_cost": row.get("cost", ""),
        "current_retail_1_5pcs": row.get("retail_price_1_5pcs", ""),
        "current_wholesale_6pcs_plus": row.get("wholesale_price_6pcs_plus", ""),
    }


def main():
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    out_dir = AUDIT_ROOT / timestamp
    csv_dir = out_dir / "source-csv"
    current_rows = []
    sheet_stats = []
    errors = []

    for gid, sheet_name in base.SHEETS:
        try:
            variants, stats = parse_current_sheet(gid, sheet_name, csv_dir)
            current_rows.extend(variants)
            sheet_stats.append(stats)
            print(f"{sheet_name}: {len(variants)} variants")
        except Exception as exc:
            errors.append({"sheet": sheet_name, "gid": gid, "error": str(exc)})
            print(f"{sheet_name}: ERROR {exc}")

    baseline_rows = read_dict_csv(BASELINE_VARIANTS)
    matches, missing, new_rows = match_rows(baseline_rows, current_rows)

    changed = []
    qty_changed = []
    unchanged_count = 0
    for old, current, method in matches:
        row = changed_row(old, current, method)
        price_changed = abs(float(row["cost_delta"])) > 0.001
        if price_changed:
            changed.append(row)
        else:
            unchanged_count += 1
        if clean(old.get("qty_box")) != clean(current.get("qty_box")):
            qty_changed.append(row)

    changed.sort(key=lambda row: abs(float(row["cost_delta"])), reverse=True)
    increases = [row for row in changed if float(row["cost_delta"]) > 0]
    decreases = [row for row in changed if float(row["cost_delta"]) < 0]

    snapshot_fields = [
        "sheet",
        "row",
        "source_title",
        "source_code",
        "color",
        "model",
        "size",
        "qty_box",
        "cost",
        "retail_price_1_5pcs",
        "wholesale_price_6pcs_plus",
    ]
    change_fields = [
        "match_method",
        "sheet",
        "source_code",
        "old_row",
        "current_row",
        "variant_name",
        "old_source_title",
        "current_source_title",
        "old_color",
        "current_color",
        "old_model",
        "current_model",
        "old_size",
        "current_size",
        "old_qty_box",
        "current_qty_box",
        "old_cost",
        "current_cost",
        "cost_delta",
        "cost_delta_pct",
        "old_retail_1_5pcs",
        "current_retail_1_5pcs",
        "retail_delta",
        "old_wholesale_6pcs_plus",
        "current_wholesale_6pcs_plus",
        "wholesale_delta",
        "old_preview_id",
        "old_variant_sku",
    ]
    missing_fields = [
        "sheet",
        "source_code",
        "old_row",
        "variant_name",
        "old_color",
        "old_model",
        "old_size",
        "old_qty_box",
        "old_cost",
        "old_preview_id",
        "old_variant_sku",
    ]
    new_fields = [
        "sheet",
        "source_code",
        "current_row",
        "current_source_title",
        "current_color",
        "current_model",
        "current_size",
        "current_qty_box",
        "current_cost",
        "current_retail_1_5pcs",
        "current_wholesale_6pcs_plus",
    ]

    write_dict_csv(out_dir / "current-price-snapshot.csv", current_rows, snapshot_fields)
    write_dict_csv(out_dir / "ok-price-changes.csv", changed, change_fields)
    write_dict_csv(out_dir / "ok-price-increases.csv", increases, change_fields)
    write_dict_csv(out_dir / "ok-price-decreases.csv", decreases, change_fields)
    write_dict_csv(out_dir / "ok-qty-box-changes.csv", qty_changed, change_fields)
    write_dict_csv(out_dir / "ok-missing-from-current-sheet.csv", [missing_row(row) for row in missing], missing_fields)
    write_dict_csv(out_dir / "ok-new-in-current-sheet.csv", [current_new_row(row) for row in new_rows], new_fields)

    summary = {
        "generated_at": timestamp,
        "baseline_variants": len(baseline_rows),
        "current_variants": len(current_rows),
        "matched_variants": len(matches),
        "unchanged_price_variants": unchanged_count,
        "price_changed_variants": len(changed),
        "price_increases": len(increases),
        "price_decreases": len(decreases),
        "qty_box_changed_variants": len(qty_changed),
        "missing_from_current_sheet": len(missing),
        "new_in_current_sheet": len(new_rows),
        "errors": errors,
        "top_increases": increases[:20],
        "top_decreases": decreases[:20],
        "files": {
            "current_snapshot_csv": str(out_dir / "current-price-snapshot.csv"),
            "changes_csv": str(out_dir / "ok-price-changes.csv"),
            "increases_csv": str(out_dir / "ok-price-increases.csv"),
            "decreases_csv": str(out_dir / "ok-price-decreases.csv"),
            "qty_box_changes_csv": str(out_dir / "ok-qty-box-changes.csv"),
            "missing_csv": str(out_dir / "ok-missing-from-current-sheet.csv"),
            "new_csv": str(out_dir / "ok-new-in-current-sheet.csv"),
            "summary_json": str(out_dir / "summary.json"),
        },
        "sheet_stats": sheet_stats,
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
