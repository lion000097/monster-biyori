"""Package the approved 127-species town animation for web and launcher 1.1.0."""
import hashlib
import json
import re
import runpy
import shutil
import tempfile
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PREVIOUS = "1.25.95"
VERSION = "1.25.96"
BANK_NAME = f"town-motion-{VERSION}.js"
OLD = ROOT / "releases" / PREVIOUS
NEW = ROOT / "releases" / VERSION


def replace_once(source, old, new):
    if source.count(old) != 1:
        raise ValueError(f"Expected one occurrence of {old[:75]!r}")
    return source.replace(old, new, 1)


def versioned(source):
    for old, new in (
        (f"<title>もんすたー日和 Ver.{PREVIOUS}", f"<title>もんすたー日和 Ver.{VERSION}"),
        (f"Ver.{PREVIOUS} — 建築メニューの整理</footer>", f"Ver.{VERSION} — 街のモンスターの歩き・飛行・遊泳</footer>"),
        (f"GAME_APP_VERSION='{PREVIOUS}'", f"GAME_APP_VERSION='{VERSION}'"),
    ):
        source = replace_once(source, old, new)
    return source


def build():
    motion = runpy.run_path(str(ROOT / "work/town-monster-motion/build.py"))
    codec = runpy.run_path(str(ROOT / "work/scene-camera-12581/build.py"))
    NEW.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        work = Path(temporary)
        generated = work / "web.html"
        motion["build"](OLD / "game.html", generated)
        verified = generated.read_bytes()
        header = f"blob {len(verified)}\0".encode()
        if hashlib.sha1(header + verified).hexdigest() != "d49912a69a6128861998c2b2f20a07fcd8008536":
            raise ValueError("Rebuilt town sprites differ from the approved review game")
        web = versioned(verified.decode()).encode()
        (NEW / "game.html").write_bytes(web)
        (ROOT / "game.html").write_bytes(web)
        light = work / "light.html"
        light.write_text(codec["unpack_launcher"]((OLD / "launcher-game.html").read_text()))
        motion["build"](light, generated)
        adapted = versioned(generated.read_text())

    art = motion["encode_art"]()
    bank = ("globalThis.MBTownMotion96=" + art + ";\n").encode()
    (NEW / BANK_NAME).write_bytes(bank)
    loader = (HERE / "launcher-motion.js").read_text().replace("__BANK_HASH__", hashlib.sha256(bank).hexdigest())
    first = json.dumps({"shirogao": json.loads(art)["shirogao"]}, separators=(",", ":"))
    adapted = replace_once(adapted, f"new Map(Object.entries({art}));",
                           f"new Map(Object.entries({first}));\n{loader}")
    packed = codec["pack"](adapted, binary_assets=True, dictionary=True, zstd_pack=True,
                           wide_words=True, zstd_level=22, embedded_inflater=True)
    if codec["unpack_launcher"](packed) != adapted:
        raise ValueError("Offline game changed during packing")
    payload = packed.encode()
    if len(payload) > 4 * 1024 * 1024:
        raise ValueError(f"1.1.0 update exceeds 4 MiB ({len(payload):,} bytes)")
    (NEW / "launcher-game.html").write_bytes(payload)
    shutil.copyfile(OLD / "stage-art-1.25.90.js", NEW / "stage-art-1.25.90.js")

    archive_name = f"monster-biyori-{VERSION}.zip"
    with ZipFile(OLD / f"monster-biyori-{PREVIOUS}.zip") as previous, ZipFile(NEW / archive_name, "w") as archive:
        for entry in previous.infolist():
            name = entry.filename
            if name == "game.html":
                body = payload
            elif name in {"CHANGELOG.md", "TESTING.md"}:
                body = (NEW / name).read_bytes()
            else:
                body = previous.read(name)
            archive.writestr(entry, body)
        companion = ZipInfo(BANK_NAME, (2026, 11, 29, 0, 0, 0))
        archive.writestr(companion, bank, compress_type=ZIP_DEFLATED)

    index_file = ROOT / "archive.html"
    index = index_file.read_text()
    current = re.search(f'<li data-version="{re.escape(PREVIOUS)}">.*?</li>', index)[0]
    if f'data-version="{VERSION}"' not in index:
        size = (NEW / archive_name).stat().st_size / 1024**2
        new_item = re.sub(r"\d+\.\d+ MB", f"{size:.2f} MB", current.replace(PREVIOUS, VERSION))
        index_file.write_text(replace_once(index, current, new_item + "\n" + current.replace(" ・ 現行配布", "")))
    manifest = ROOT / "latest.json"
    entry = json.loads(manifest.read_text())
    if entry["version"] not in (PREVIOUS, VERSION):
        raise ValueError("Another version is current")
    entry.update(version=VERSION, html_url=entry["html_url"].replace(PREVIOUS, VERSION),
                 sha256=hashlib.sha256(payload).hexdigest())
    manifest.write_text(json.dumps(entry, indent=2) + "\n")
    print(f"Web: {len(web):,}; launcher: {len(payload):,}; town sprites: {len(bank):,} bytes.", flush=True)


if __name__ == "__main__":
    build()
