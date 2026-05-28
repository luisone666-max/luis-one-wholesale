import json
import os
import re
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def clean(value):
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).strip())


def slugify(value):
    text = clean(value).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


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
    with urllib.request.urlopen(req, timeout=120) as resp:
        body = resp.read().decode("utf-8")
        return json.loads(body) if body else None


def get_by_slug(slug):
    rows = request_json("GET", "categories", "?slug=eq." + urllib.parse.quote(slug) + "&select=*", prefer=None)
    return rows[0] if rows else None


def upsert_category(name, slug, parent_id, level, sort_order, show_in_navigation):
    existing = get_by_slug(slug)
    payload = {
        "name_en": name,
        "slug": slug,
        "parent_id": parent_id,
        "level": level,
        "active": True,
        "show_on_homepage": level == 1,
        "show_in_navigation": show_in_navigation,
        "sort_order": sort_order,
        "template_type": "marketplace",
        "description": f"{name} products.",
    }
    if existing:
        return request_json("PATCH", "categories", "?id=eq." + urllib.parse.quote(existing["id"]) + "&select=*", payload=payload)[0]
    return request_json("POST", "categories", payload=payload)[0]


def patch_if_exists(slug, payload):
    existing = get_by_slug(slug)
    if not existing:
        return None
    return request_json("PATCH", "categories", "?id=eq." + urllib.parse.quote(existing["id"]) + "&select=*", payload=payload)[0]


def main():
    root = upsert_category("Motorcycle Parts", "motorcycle-parts", None, 1, 10, False)
    root_id = root["id"]

    level2_specs = [
        ("Helmets", "helmets", 10),
        ("Motorcycle Storage", "motorcycle-storage", 20),
        ("Engine Parts", "engine-parts", 30),
        ("Brake System", "brake-system", 40),
        ("Drive Train", "drive-train", 50),
        ("Lights & Electrical", "lights-electrical", 60),
        ("Wheels & Tires", "wheels-tires", 70),
        ("Controls & Cables", "controls-cables", 80),
        ("Controls & Footrests", "controls-footrests", 90),
        ("Body Parts", "body-parts", 100),
        ("Exhaust", "exhaust", 110),
        ("Motorcycle Accessories", "motorcycle-accessories", 120),
        ("Care & Maintenance", "care-maintenance", 130),
        ("Suspension", "suspension", 140),
    ]
    level2 = {
        slug: upsert_category(name, slug, root_id, 2, sort_order, True)
        for name, slug, sort_order in level2_specs
    }

    child_specs = [
        ("Bulbs", "bulb", "lights-electrical", 10),
        ("Electrical Parts", "electrical-parts", "lights-electrical", 20),
        ("Lights & Horns", "lights-horns", "lights-electrical", 30),
        ("Spark Plugs", "spark-plug", "engine-parts", 10),
        ("Filters", "filter", "engine-parts", 20),
        ("Engine Components", "engine-components", "engine-parts", 30),
        ("Exhaust Parts", "exhaust-parts", "exhaust", 10),
        ("Tires", "tires", "wheels-tires", 10),
        ("Inner Tubes", "inner-tubes", "wheels-tires", 20),
        ("Tire Accessories", "tire-accessories", "wheels-tires", 30),
        ("Wheels & Spokes", "wheels-spokes", "wheels-tires", 40),
        ("Maintenance Products", "maintenance-products", "care-maintenance", 10),
        ("Hardware", "hardware", "motorcycle-accessories", 10),
        ("Controls & Accessories", "controls-accessories", "motorcycle-accessories", 20),
        ("Brackets & Guards", "brackets-guards", "motorcycle-accessories", 30),
        ("General Accessories", "general-accessories", "motorcycle-accessories", 40),
    ]
    for name, slug, parent_slug, sort_order in child_specs:
        parent = level2.get(parent_slug) or get_by_slug(parent_slug)
        if parent:
            upsert_category(name, slug, parent["id"], 3, sort_order, False)

    for alias in ["tires-wheels", "accessories", "oils-maintenance", "automotive", "electronics"]:
        patch_if_exists(alias, {"show_in_navigation": False})

    print(
        json.dumps(
            {
                "level2_navigation_categories": len(level2_specs),
                "level3_categories_organized": len(child_specs),
                "hidden_navigation_aliases": 5,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
