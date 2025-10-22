import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES_DIR = ROOT / "app" / "website_templates"

LAYOUT_FULL = 'full'

SERVICE_STUB = {
    "slug": "services",
    "title": "Services",
    "menu_title": "Services",
    "show_in_menu": True,
    "is_homepage": False,
    "sort_order": 10,
    "layout": LAYOUT_FULL,
    "content": {"sections": []},
}

REVIEWS_STUB = {
    "slug": "reviews",
    "title": "Reviews",
    "menu_title": "Reviews",
    "show_in_menu": True,
    "is_homepage": False,
    "sort_order": 20,
    "layout": LAYOUT_FULL,
    "content": {"sections": []},
}

MY_BOOKINGS_STUB = {
    "slug": "my-bookings",
    "title": "My Bookings",
    "menu_title": "My Bookings",
    "show_in_menu": True,
    "is_homepage": False,
    "sort_order": 90,
    "layout": LAYOUT_FULL,
    "content": {"sections": []},
}


def ensure_page(pages, stub):
    slug = stub["slug"].lower()
    for p in pages:
        if str(p.get("slug", "")).lower() == slug:
            # Keep existing; optionally lift into menu
            if slug in {"services", "reviews", "my-bookings"}:
                p.setdefault("menu_title", stub["menu_title"])
                p.setdefault("title", stub["title"])
                # Default show in menu to True unless explicitly false
                if p.get("show_in_menu") is None:
                    p["show_in_menu"] = True
            return False
    pages.append(stub)
    return True

def has_iframe_section(page):
    try:
        for s in page.get("content", {}).get("sections", []):
            body = (s.get("props", {}) or {}).get("body", "")
            if isinstance(body, str) and "<iframe" in body:
                return True
    except Exception:
        pass
    return False

def _enforce_full_layout(page):
    changed = False
    if isinstance(page, dict):
        if page.get('layout') != LAYOUT_FULL:
            page['layout'] = LAYOUT_FULL
            changed = True
        content = page.setdefault('content', {}) if isinstance(page.get('content'), dict) else page.get('content')
        if isinstance(content, dict):
            meta = content.setdefault('meta', {})
            if meta.get('layout') != LAYOUT_FULL:
                meta['layout'] = LAYOUT_FULL
                changed = True
    return changed


def add_embed_section(page, kind: str, primary=None, text_tone='dark'):
    # kind: 'services' | 'reviews'
    qp = []
    if primary:
        qp.append(f"primary={primary}")
    if text_tone:
        qp.append(f"text={text_tone}")
    q = ("&".join(qp))
    src = f"/{{{{slug}}}}/{kind}?embed=1" + (f"&{q}" if q else "")
    iframe = f'<iframe src="{src}" style="width:100%;min-height:900px;border:none;display:block;"></iframe>'
    sec = {
        "id": page.get("id") or None,
        "type": "richText",
        "props": {
            "title": kind.title(),
            "body": iframe,
            "maxWidth": "full",
            "align": "left"
        },
    }
    content = page.setdefault("content", {})
    sections = content.setdefault("sections", [])
    sections.append(sec)


def normalize_file(path: Path, remove_login_only=False):
    text = path.read_text(encoding="utf-8")
    data = json.loads(text)
    pages = list(data.get("pages", []))

    changed = False
    for p in pages:
        if _enforce_full_layout(p):
            changed = True

    # Remove login page if present
    new_pages = [p for p in pages if str(p.get("slug", "")).lower() != "login"]
    removed_login = len(new_pages) != len(pages)
    pages = new_pages

    changed = removed_login or changed

    if not remove_login_only:
        # Ensure the 3 core pages exist
        changed |= ensure_page(pages, SERVICE_STUB.copy())
        changed |= ensure_page(pages, REVIEWS_STUB.copy())
        changed |= ensure_page(pages, MY_BOOKINGS_STUB.copy())

        for p in pages:
            if _enforce_full_layout(p):
                changed = True

        # Add embed sections to services/reviews if missing content
        primary, tone = derive_embed_params(data)
        for p in pages:
            slug = str(p.get("slug", "")).lower()
            if slug in ("services", "reviews"):
                secs = (p.get("content", {}) or {}).get("sections", [])
                if not secs or not has_iframe_section(p):
                    add_embed_section(p, slug, primary=primary, text_tone=tone)
                    changed = True

    if changed:
        data["pages"] = pages
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return changed, removed_login


def main(argv):
    remove_login_only = "--remove-login-only" in argv
    target = None
    for i, a in enumerate(argv):
        if a == "--file" and i + 1 < len(argv):
            target = Path(argv[i + 1])
            break

    files = []
    if target:
        files = [target]
    else:
        files = sorted(TEMPLATES_DIR.glob("*.json"))

    total = 0
    removed = 0
    for f in files:
        try:
            changed, rem = normalize_file(f, remove_login_only=remove_login_only)
            if changed:
                total += 1
            if rem:
                removed += 1
        except Exception as e:
            print(f"[WARN] Failed {f.name}: {e}")

def _hex_to_rgb(hexstr):
    s = str(hexstr or "").strip()
    if not s.startswith('#') or len(s) not in (4, 7):
        return None
    if len(s) == 4:
        r = int(s[1]*2, 16); g = int(s[2]*2, 16); b = int(s[3]*2, 16)
    else:
        r = int(s[1:3], 16); g = int(s[3:5], 16); b = int(s[5:7], 16)
    return (r, g, b)

def _luminance(rgb):
    if not rgb: return None
    r,g,b = [x/255.0 for x in rgb]
    return 0.2126*r + 0.7152*g + 0.0722*b

def derive_embed_params(data):
    # Try to derive primary and text tone from homepage pageStyle props
    try:
        pages = data.get('pages', [])
        home = next((p for p in pages if p.get('is_homepage')), (pages[0] if pages else None))
        sections = (home or {}).get('content', {}).get('sections', [])
        ps = next((s for s in sections if s.get('type') == 'pageStyle'), None)
        props = (ps or {}).get('props', {})
        # Primary color candidates
        primary = props.get('linkColor') or props.get('primaryColor') or props.get('brandColor')
        # Determine text tone based on heading/body color luminance or background
        txt = 'dark'
        bg = props.get('backgroundColor')
        head = props.get('headingColor')
        body = props.get('bodyColor')
        lum_bg = _luminance(_hex_to_rgb(bg)) if bg else None
        lum_head = _luminance(_hex_to_rgb(head)) if head else None
        lum_body = _luminance(_hex_to_rgb(body)) if body else None
        # If background is dark (low luminance), prefer light text
        if lum_bg is not None and lum_bg < 0.4:
            txt = 'light'
        # If heading/body colors exist and are dark, keep light
        if lum_head is not None:
            txt = 'light' if lum_head < 0.5 else 'dark'
        elif lum_body is not None:
            txt = 'light' if lum_body < 0.5 else 'dark'
        return primary, txt
    except Exception:
        return None, 'dark'

    scope = target.name if target else "all templates"
    mode = "remove-login-only" if remove_login_only else "normalize-4-tabs"
    print(f"Done: {scope} | mode={mode} | changed={total} | login_removed={removed}")


if __name__ == "__main__":
    main(sys.argv[1:])
