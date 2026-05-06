import json
import re
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
    return values["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/"), values["SUPABASE_SERVICE_ROLE_KEY"]


SUPABASE_URL, SERVICE_KEY = load_env()


def request_json(method, table, query="", payload=None, prefer=None):
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
    with urllib.request.urlopen(req, timeout=90) as resp:
        body = resp.read().decode("utf-8")
        return json.loads(body) if body else None


def smart_title(name):
    name = re.sub(r"(?<!\s)\(", " (", name)
    keep_upper = {
        "HNJ",
        "GILLE",
        "ZEBRA",
        "MOB",
        "HEXA",
        "ECE",
        "MX",
        "YM",
        "V1",
        "V2",
        "V3",
        "W/D",
        "SRP",
        "LED",
        "PVC",
        "NMAX",
        "AEROX",
    }
    words = re.split(r"(\s+)", name.strip())
    out = []
    for word in words:
        if not word.strip():
            out.append(word)
            continue
        clean = re.sub(r"[^A-Za-z0-9#/+-]", "", word)
        upper = clean.upper()
        if upper in keep_upper or re.search(r"\d", word):
            out.append(word.upper())
        elif "/" in word:
            out.append("/".join(part.capitalize() for part in word.split("/")))
        else:
            out.append(word.capitalize())
    result = re.sub(r"\s+", " ", "".join(out)).strip()

    def fix_parenthetical(match):
        inside = match.group(1)
        fixed = " ".join(part.upper() if part.upper() in keep_upper else part.capitalize() for part in inside.split())
        return f"({fixed})"

    result = re.sub(r"\(([^)]+)\)", fix_parenthetical, result)
    return result


def category_suffix(category_name):
    mapping = {
        "Half Face Helmets": "Half Face Motorcycle Helmet",
        "Full Face Helmets": "Full Face Motorcycle Helmet",
        "Modular Helmets": "Modular Motorcycle Helmet",
        "Kids Helmets": "Kids Motorcycle Helmet",
        "Cap Type Helmets": "Cap Type Motorcycle Helmet",
        "Motocross Helmets": "Motocross Motorcycle Helmet",
        "Dual Sport Helmets": "Dual Sport Motorcycle Helmet",
        "Top Boxes": "Motorcycle Top Box",
        "Brackets": "Motorcycle Bracket",
    }
    return mapping.get(category_name, category_name)


def clean_existing_suffix(name):
    patterns = [
        r"\s+Half Face Motorcycle Helmet$",
        r"\s+Full Face Motorcycle Helmet$",
        r"\s+Modular Motorcycle Helmet$",
        r"\s+Kids Motorcycle Helmet$",
        r"\s+Cap Type Motorcycle Helmet$",
        r"\s+Motocross Motorcycle Helmet$",
        r"\s+Dual Sport Motorcycle Helmet$",
        r"\s+Motorcycle Top Box$",
        r"\s+Motorcycle Bracket$",
    ]
    result = name
    for pattern in patterns:
        result = re.sub(pattern, "", result, flags=re.I)
    return result.strip()


def main():
    products = request_json(
        "GET",
        "products",
        "?select=id,sku,name,brand,child_category_id,description,admin_notes&admin_notes=ilike.*Imported%20from*&limit=1000",
    )
    category_ids = sorted({row["child_category_id"] for row in products if row.get("child_category_id")})
    categories = request_json(
        "GET",
        "categories",
        "?select=id,name_en,slug&id=in.(" + ",".join(category_ids) + ")",
    )
    category_by_id = {row["id"]: row for row in categories}

    updated = 0
    samples = []
    for product in products:
        category = category_by_id.get(product.get("child_category_id"), {})
        category_name = category.get("name_en", "")
        suffix = category_suffix(category_name)
        base = smart_title(clean_existing_suffix(product["name"]))
        if suffix.lower() not in base.lower():
            new_name = f"{base} {suffix}"
        else:
            new_name = base

        searchable_terms = [
            suffix,
            category_name,
            product.get("brand") or "",
            "motorcycle parts",
            "wholesale",
        ]
        description = (
            f"{new_name}. Search-friendly wholesale product listing for resellers and shops. "
            f"Keywords: {', '.join(term for term in searchable_terms if term)}. "
            "Available colors or styles are selectable as variants when provided. "
            "Wholesale order is manually confirmed by Luis One Supply Hub."
        )

        request_json(
            "PATCH",
            "products",
            "?id=eq." + urllib.parse.quote(product["id"]),
            payload={"name": new_name, "description": description},
        )
        updated += 1
        if len(samples) < 12 and new_name != product["name"]:
            samples.append((product["name"], new_name))

    print(f"Updated products: {updated}")
    print("Samples:")
    for old, new in samples:
        print(f"- {old} -> {new}")


if __name__ == "__main__":
    main()
