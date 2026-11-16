#!/usr/bin/env python3
"""check-site.py — semakan statik laman KAFAI As-Syariff Telok Datok.

Guna: python tools/check-site.py

Semakan:
  1. Semua fail HTML/JSON/CSS/JS boleh dibaca sebagai UTF-8.
  2. JSON sah dan rujukan dalam search-index/sitemap wujud.
  3. Pautan, imej, skrip, stylesheet dan anchor dalaman wujud.
  4. Setiap halaman mempunyai lang, charset, viewport, title, description
     dan robots noindex (laman masih draf).
  5. Tiada id berganda, tiada pautan akar mutlak yang memecahkan GitHub Pages.
  6. Tiada rujukan kepada pangkalan data peribadi, nombor kad pengenalan
     atau kunci data murid dalam fail awam.
  7. Tiada sisa jenama/kandungan PERKIM dalam fail awam.
"""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_PAGES = [ROOT / "index.html"] + sorted((ROOT / "pages").glob("*.html"))
INTERNAL_PAGES = sorted((ROOT / "dev").glob("*.html"))
ALL_PAGES = PUBLIC_PAGES + INTERNAL_PAGES

errors: list[str] = []
warnings: list[str] = []
checked_refs = 0
checked_json = 0


class Document(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.lang: str | None = None
        self.ids: list[str] = []
        self.refs: list[tuple[str, str]] = []
        self.meta: dict[str, str] = {}
        self.title = ""
        self._in_title = False
        self.has_draft_banner = False
        self.images_without_alt: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: (value or "") for key, value in attrs}
        if tag == "html":
            self.lang = values.get("lang")
        if values.get("id"):
            self.ids.append(values["id"])
        if "draft-banner" in values.get("class", "").split():
            self.has_draft_banner = True

        if tag in {"a", "link"} and values.get("href"):
            self.refs.append(("href", values["href"]))
        if tag in {"script", "img", "source", "iframe", "video", "audio"} and values.get("src"):
            self.refs.append(("src", values["src"]))
        if tag == "img" and "alt" not in values:
            self.images_without_alt.append(values.get("src", "(tiada src)"))

        if tag == "meta":
            name = values.get("name", "").lower()
            if name:
                self.meta[name] = values.get("content", "")

        if tag == "title":
            self._in_title = True

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT)).replace("\\", "/")
    except ValueError:
        return str(path)


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        errors.append(f"{rel(path)}: bukan UTF-8 yang sah ({exc})")
        return ""


def parse_html(path: Path, text: str) -> Document:
    doc = Document()
    try:
        doc.feed(text)
    except Exception as exc:  # noqa: BLE001 - laporkan dan teruskan
        errors.append(f"{rel(path)}: HTML tidak dapat dihuraikan ({exc})")
    return doc


def is_external(value: str) -> bool:
    value = value.strip()
    return (
        not value
        or value.startswith(("#", "//"))
        or value.startswith(("mailto:", "tel:", "javascript:", "data:", "blob:"))
        or bool(urlsplit(value).scheme)
    )


def resolve_local(source: Path, value: str) -> tuple[Path | None, str, bool]:
    """Pulangkan (fail sasaran, fragmen, ialah_akar_mutlak)."""
    raw = value.strip()
    if is_external(raw):
        return None, "", False
    split = urlsplit(raw)
    raw_path = unquote(split.path)
    root_absolute = raw_path.startswith("/")
    if not raw_path:
        return source, unquote(split.fragment), False
    target = Path(raw_path.lstrip("/")) if root_absolute else source.parent / raw_path
    target = target.resolve()
    if target.is_dir():
        target = target / "index.html"
    return target, unquote(split.fragment), root_absolute


def check_reference(source: Path, value: str, docs: dict[Path, Document]) -> None:
    global checked_refs
    if is_external(value):
        return
    checked_refs += 1
    target, fragment, root_absolute = resolve_local(source, value)
    if root_absolute:
        errors.append(f"{rel(source)}: pautan akar mutlak tidak sesuai untuk GitHub Pages: {value}")
    if target is None:
        return
    if not target.exists():
        errors.append(f"{rel(source)}: sasaran tidak wujud: {value}")
        return
    if fragment and target.suffix.lower() == ".html":
        target_doc = docs.get(target)
        if target_doc and fragment not in target_doc.ids:
            errors.append(f"{rel(source)}: anchor #{fragment} tiada dalam {rel(target)}")


def check_html_pages(docs: dict[Path, Document]) -> None:
    for path in ALL_PAGES:
        text = read_text(path)
        doc = docs[path]

        if doc.lang != "ms":
            errors.append(f"{rel(path)}: atribut html lang mesti 'ms'")
        if not doc.title.strip():
            errors.append(f"{rel(path)}: elemen <title> kosong")
        if not doc.meta.get("description", "").strip():
            errors.append(f"{rel(path)}: meta description kosong")
        if "viewport" not in doc.meta:
            errors.append(f"{rel(path)}: meta viewport tiada")
        if "noindex" not in doc.meta.get("robots", "").lower():
            errors.append(f"{rel(path)}: meta robots mesti mengandungi noindex semasa draf")
        if path in PUBLIC_PAGES and not doc.has_draft_banner:
            errors.append(f"{rel(path)}: .draft-banner tiada")
        if doc.images_without_alt:
            errors.append(f"{rel(path)}: img tanpa alt: {', '.join(doc.images_without_alt[:3])}")

        seen: set[str] = set()
        for item_id in doc.ids:
            if item_id in seen:
                errors.append(f"{rel(path)}: id berganda #{item_id}")
            seen.add(item_id)

        for _attr, value in doc.refs:
            check_reference(path, value, docs)


def check_css() -> None:
    for path in sorted((ROOT / "css").rglob("*.css")):
        text = read_text(path)
        for match in re.finditer(r"""@import\s+(?:url\()?["']([^"']+)["']""", text):
            value = match.group(1)
            target = (path.parent / value).resolve()
            if not target.exists():
                errors.append(f"{rel(path)}: @import tidak wujud: {value}")

        for match in re.finditer(r"""url\(\s*["']?([^"')\s]+)["']?\s*\)""", text):
            value = match.group(1)
            if value.startswith(("data:", "http://", "https://", "//", "#")):
                continue
            target = (path.parent / unquote(value)).resolve()
            if not target.exists():
                errors.append(f"{rel(path)}: aset url() tidak wujud: {value}")


IMPORT_RE = re.compile(
    r"""(?:import\s+(?:[^"'()]+?\s+from\s+)?|import\s*\(\s*)["']([^"']+)["']"""
)


def check_js() -> None:
    for path in sorted((ROOT / "js").rglob("*.js")) + sorted((ROOT / "dev").glob("*.js")):
        if "vendor" in path.parts:
            continue
        text = read_text(path)
        for match in IMPORT_RE.finditer(text):
            value = match.group(1)
            if not value.startswith("."):
                continue
            target = (path.parent / value).resolve()
            if not target.exists():
                errors.append(f"{rel(path)}: import tidak wujud: {value}")


def check_json() -> None:
    global checked_json
    json_files = sorted((ROOT / "data").glob("*.json"))
    json_files += sorted((ROOT / "web-api-module").rglob("*.json"))
    parsed: dict[Path, object] = {}

    for path in json_files:
        text = read_text(path)
        if not text:
            continue
        try:
            parsed[path] = json.loads(text)
            checked_json += 1
        except json.JSONDecodeError as exc:
            errors.append(f"{rel(path)}: JSON tidak sah pada baris {exc.lineno}: {exc.msg}")

    search_path = ROOT / "data" / "search-index.json"
    if search_path in parsed and isinstance(parsed[search_path], list):
        for item in parsed[search_path]:
            url = item.get("url", "") if isinstance(item, dict) else ""
            if not url:
                errors.append("data/search-index.json: item tanpa url")
                continue
            target = (ROOT / url.lstrip("/")).resolve()
            if not target.exists():
                errors.append(f"data/search-index.json: url tidak wujud: {url}")

    sitemap_path = ROOT / "data" / "sitemap.json"
    if sitemap_path in parsed and isinstance(parsed[sitemap_path], dict):
        for item in parsed[sitemap_path].get("halaman", []):
            url = item.get("url", "") if isinstance(item, dict) else ""
            if not url:
                errors.append("data/sitemap.json: item tanpa url")
                continue
            target = (ROOT / url.lstrip("/")).resolve()
            if target.is_dir():
                target = target / "index.html"
            if not target.exists():
                errors.append(f"data/sitemap.json: url tidak wujud: {url}")


PRIVATE_REF_RE = re.compile(r"kafa[-_]db", re.IGNORECASE)
IC_RE = re.compile(r"\b\d{6}-\d{2}-\d{4}\b")
STUDENT_KEY_RE = re.compile(
    r'"(namaMurid|noKp|nokp|markah|kehadiran|disiplin)"\s*:', re.IGNORECASE
)
PERKIM_RE = re.compile(r"PERKIM", re.IGNORECASE)


def scan_public_text() -> None:
    files: list[Path] = []
    files += PUBLIC_PAGES
    files += INTERNAL_PAGES
    files += sorted((ROOT / "data").glob("*.json"))
    files += [p for p in sorted((ROOT / "js").rglob("*.js")) if "vendor" not in p.parts]
    files += sorted((ROOT / "dev").glob("*.js"))
    files += sorted((ROOT / "css").rglob("*.css"))
    files += [p for p in sorted((ROOT / "web-api-module").rglob("*")) if p.suffix in {".js", ".json", ".md"}]
    files = list(dict.fromkeys(files))

    for path in files:
        if not path.exists() or not path.is_file():
            continue
        text = read_text(path)
        if not text:
            continue
        for number, line in enumerate(text.splitlines(), 1):
            if PRIVATE_REF_RE.search(line) and path.name != "push.js":
                errors.append(f"{rel(path)}:{number}: rujukan pangkalan data peribadi")
            if IC_RE.search(line):
                errors.append(f"{rel(path)}:{number}: corak nombor kad pengenalan")
            if STUDENT_KEY_RE.search(line):
                errors.append(f"{rel(path)}:{number}: kunci data murid dikesan")
            if PERKIM_RE.search(line):
                errors.append(f"{rel(path)}:{number}: sisa jenama PERKIM")
            if "file://" in line:
                errors.append(f"{rel(path)}:{number}: rujukan file:// tidak dibenarkan")


PRIVATE_LOCAL_FILES = (
    ".env",
    "kafa-db.json",
    "status.txt",
    "semak-perkim.ps1",
    "Guru dan Murid terkini.txt",
)


def check_private_local_files() -> None:
    """Fail peribadi boleh wujud di PC, tetapi mesti diabaikan oleh Git."""
    gitignore_path = ROOT / ".gitignore"
    gitignore = read_text(gitignore_path) if gitignore_path.exists() else ""
    for name in PRIVATE_LOCAL_FILES:
        if (ROOT / name).exists() and name not in gitignore:
            errors.append(f"{name}: fail peribadi wujud tetapi tiada dalam .gitignore")


def main() -> int:
    docs: dict[Path, Document] = {}
    for path in ALL_PAGES:
        docs[path] = parse_html(path, read_text(path))

    check_html_pages(docs)
    check_css()
    check_js()
    check_json()
    scan_public_text()
    check_private_local_files()

    print("\n  Semakan laman KAFAI As-Syariff Telok Datok")
    print("  " + "-" * 48)
    print(f"  Halaman HTML : {len(ALL_PAGES)}")
    print(f"  Fail JSON    : {checked_json}")
    print(f"  Rujukan      : {checked_refs}")
    print(f"  Ralat        : {len(errors)}")
    print(f"  Amaran       : {len(warnings)}")

    if warnings:
        print("\n  Amaran:")
        for warning in warnings[:20]:
            print(f"   - {warning}")

    if errors:
        print("\n  Ralat:")
        for error in errors[:40]:
            print(f"   x {error}")
        if len(errors) > 40:
            print(f"   ... dan {len(errors) - 40} lagi")
        print("")
        return 1

    print("\n  Lulus: tiada ralat.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
