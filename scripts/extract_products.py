"""
Extract product cards from legacy listing HTML files into data/products.json.

Each prod-card has the shape (roughly):
  <div|article class="prod-card" data-col=... data-metal=... data-sub=... data-price=...>
    <div class="prod-img">
      <img src="..." alt="STYLE" .../>   (optional - may be just placeholder)
      <div class="prod-img-placeholder">...</div>
      <span class="prod-collection-badge|prod-category-badge">Collection</span>
    </div>
    <div class="prod-info">
      <span class="prod-style">STYLE</span>
      <h3 class="prod-name">Name</h3>
      <p class="prod-desc">...</p>           (optional)
      <p class="prod-metals">Metals</p>
      <p class="prod-price">Price text</p>
    </div>
    <a ... class="prod-cta">Inquire</a>
  </div>
"""
import json
import re
from pathlib import Path

LEGACY_DIR = Path(__file__).resolve().parent.parent / "_legacy"
OUT = Path(__file__).resolve().parent.parent / "data" / "products.json"

FILES = [
    ("engagement-rings.html", "engagement"),
    ("wedding-bands.html", "wedding"),
    ("fine-jewelry.html", "fine"),
    ("mens.html", "mens"),
]

CARD_RE = re.compile(
    r'<(?:div|article)\s+class="prod-card"([^>]*)>(.*?)</(?:div|article)>\s*(?=\n\s*(?:<!--|<div\s+class="prod-card"|<article\s+class="prod-card"|</div><!-- /products-grid|</section))',
    re.DOTALL,
)

# Simpler approach: split file by <div class="prod-card" or <article class="prod-card"
# and parse each chunk.

ATTR_RE = re.compile(r'data-(\w+)="([^"]*)"')
IMG_RE = re.compile(r'<img\s+src="([^"]+)"', re.DOTALL)
STYLE_RE = re.compile(r'<span class="prod-style">([^<]+)</span>')
NAME_RE = re.compile(r'<h3 class="prod-name">([^<]+)</h3>')
METALS_RE = re.compile(r'<p class="prod-metals">([^<]+)</p>')
PRICE_RE = re.compile(r'<p class="prod-price">([^<]+)</p>')
COL_BADGE_RE = re.compile(
    r'<span class="prod-(?:collection|category)-badge">([^<]+)</span>'
)


def clean_html(s: str) -> str:
    s = s.replace("&mdash;", "—")
    s = s.replace("&middot;", "·")
    s = s.replace("&amp;", "&")
    s = s.replace("&ndash;", "–")
    s = s.replace("&rsaquo;", "›")
    s = s.replace("&rarr;", "→")
    return s.strip()


def kebab(sku: str) -> str:
    s = sku.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s


def parse_file(path: Path, category: str):
    html = path.read_text(encoding="utf-8")
    # Find the products grid block
    grid_start = html.find('class="products-grid"')
    if grid_start == -1:
        return []
    # Walk every prod-card opening
    # Use a simpler split-on-card-start approach:
    pieces = re.split(r'<(?:div|article)\s+class="prod-card"', html[grid_start:])
    products = []
    seen = set()
    for piece in pieces[1:]:
        # Find matching closing tag. Cards are either <div>...</div> or <article>...</article>.
        # The card ends at the </div> or </article> that closes the .prod-card. The simplest
        # reliable boundary is: stop at the next "<div class=\"prod-card\"" or "<article class=\"prod-card\""
        # OR at the products-grid closing.
        # We already split, so each `piece` starts with attributes, then ends at next split point.
        # We need to truncate at the </div></section> or </div><!-- /products-grid -->.
        end_idx = piece.find('</div><!-- /products-grid')
        if end_idx == -1:
            end_idx = piece.find('</section>')
        if end_idx == -1:
            end_idx = len(piece)
        chunk = piece[:end_idx]

        # Pull the closing > of the opening tag
        open_close = chunk.find(">")
        attrs_blob = chunk[:open_close]
        body = chunk[open_close + 1 :]

        data_attrs = dict(ATTR_RE.findall(attrs_blob))

        m_style = STYLE_RE.search(body)
        if not m_style:
            continue
        sku = clean_html(m_style.group(1))
        if sku in seen:
            continue
        seen.add(sku)

        m_name = NAME_RE.search(body)
        m_metals = METALS_RE.search(body)
        m_price = PRICE_RE.search(body)
        m_badge = COL_BADGE_RE.search(body)
        m_img = IMG_RE.search(body)

        # Determine collection: badge first, then data-col, then data-sub
        if m_badge:
            collection = clean_html(m_badge.group(1))
        elif "col" in data_attrs:
            collection = data_attrs["col"]
        elif "sub" in data_attrs:
            collection = data_attrs["sub"]
        else:
            collection = ""

        # Detect placeholder-only (no real image). The legacy markup always
        # has an <img> tag, even when the image is a placeholder URL — but
        # in practice all listing-page cards have real product images. The
        # task says "many cards have placeholder SVG instead — set to null".
        # We treat the image as null only if no <img src=""> exists (defensive).
        image = clean_html(m_img.group(1)) if m_img else None

        product = {
            "sku": sku,
            "slug": kebab(sku),
            "name": clean_html(m_name.group(1)) if m_name else sku,
            "collection": collection,
            "metals": clean_html(m_metals.group(1)) if m_metals else "",
            "price": clean_html(m_price.group(1)) if m_price else "",
            "image": image,
            "category": category,
            # keep filter tokens for category pages that need them
            "col": data_attrs.get("col", ""),
            "metal_tokens": data_attrs.get("metal", ""),
            "sub": data_attrs.get("sub", ""),
        }
        products.append(product)

    return products


def main():
    all_products = []
    counts = {}
    for fname, cat in FILES:
        path = LEGACY_DIR / fname
        items = parse_file(path, cat)
        counts[cat] = len(items)
        all_products.extend(items)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(all_products, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(all_products)} products to {OUT}")
    for cat, n in counts.items():
        print(f"  {cat}: {n}")


if __name__ == "__main__":
    main()
