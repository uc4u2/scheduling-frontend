import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1] / "src" / "locales" / "en" / "common.json"
data = json.loads(ROOT.read_text())
compare = data.get("landing", {}).get("compare", {})
entries = []
for slug, info in compare.items():
    if slug in {"metaTitle", "metaDescription"}:  # skip other props
        continue
    title = info.get("heroTitle") or f"Schedulaa vs {slug.title()}"
    description = info.get("heroSubtitle") or info.get("metaDescription", "")
    entries.append({
        "title": title,
        "description": description,
        "to": f"/compare/{slug}",
        "keywords": [slug, "compare", "vs"]
    })
entries.sort(key=lambda e: e["title"])
print(json.dumps(entries, indent=2))
