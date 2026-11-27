"""Build the treasure artwork patch from the two verified 1.25.69 distributions."""
import base64
import copy
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import zlib
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[2]
OLD, NEW = '1.25.69', '1.25.70'
PRIOR, RELEASE = (ROOT / 'releases' / v for v in (OLD, NEW))
WORK = ROOT / 'work' / NEW
sys.path.insert(0, str(ROOT / 'tools'))
from PIL import Image
from embed_frontier_art import encode_sprites
from pack_launcher_html import MARKER, decode_payload, pack, unbundle_assets
from release_preflight import check

BANK = re.compile(r"^const frontierCells=(.+?);\nconst frontierIndexData='([^']+)';$", re.M)
PREVIOUS_DIGEST = '09621802dfbfd240a53caf624b5ef3220ab69a4cb582177d8cacfb93d47c28cf'


def unpack_launcher(data):
    source = data.decode()
    payload = re.search(r'id="ranch-payload">(.*?)</script>', source, re.S)[1]
    length = int(re.search(r'PACKED_BYTES=(\d+)', source)[1])
    inflater = re.search(r'id="ranch-inflater">(.*?)</script>', source, re.S)[1]
    return unbundle_assets(zlib.decompress(decode_payload(payload, length))).replace(MARKER, inflater)


def update_game(source, cells, stream):
    matches = list(BANK.finditer(source))
    assert len(matches) == 1
    previous = matches[0]
    before = json.loads(previous[1])
    assert len(before) == len(cells) == 35 and before[:25] == cells[:25]
    old_pixels = zlib.decompress(base64.b64decode(previous[2]))
    new_pixels = zlib.decompress(base64.b64decode(stream))
    assert len(old_pixels) == len(new_pixels) == 480 * 672
    assert old_pixels[:480*480] == new_pixels[:480*480]
    assert all(old != new for old, new in zip(before[25:], cells[25:]))
    assert source.count(OLD) == 3
    replacement = 'const frontierCells=' + json.dumps(cells, separators=(',', ':')) + ";\nconst frontierIndexData='" + stream + "';"
    return BANK.sub(lambda _: replacement, source).replace(OLD, NEW)


def update_zip(compact):
    updates = {'game.html': compact}
    for name in ['CHANGELOG.md', 'TESTING.md']:
        updates[name] = updates[f'releases/{NEW}/{name}'] = (RELEASE / name).read_bytes()
    dest = RELEASE / f'monster-biyori-{NEW}.zip'
    with ZipFile(PRIOR / f'monster-biyori-{OLD}.zip') as previous:
        with ZipFile(dest, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
            for member in previous.infolist():
                if member.filename not in updates:
                    archive.writestr(copy.copy(member), previous.read(member))
            for name, data in updates.items():
                member = ZipInfo(name, (2026, 11, 27, 0, 0, 0))
                member.compress_type = ZIP_DEFLATED
                member.external_attr = 0o100644 << 16
                archive.writestr(member, data, compresslevel=9)
        with ZipFile(dest) as archive:
            assert set(archive.namelist()) == set(previous.namelist()) | set(updates)
            for name in archive.namelist():
                assert archive.read(name) == (updates[name] if name in updates else previous.read(name))
    return dest


def main():
    with Image.open(ROOT / 'assets/adventure/frontier-11-15.png') as source:
        cells, stream = encode_sprites(source.convert('RGBA'))
    regular = update_game((PRIOR / 'game.html').read_text(), cells, stream)
    compact_before = (PRIOR / 'launcher-game.html').read_bytes()
    assert hashlib.sha256(compact_before).hexdigest() == PREVIOUS_DIGEST
    compact = pack(update_game(unpack_launcher(compact_before), cells, stream), dense=True, binary_assets=True).encode()
    assert len(compact) <= 4*1024**2, f'Launcher size exceeds budget: {len(compact)}'
    manifest_path = ROOT / 'latest.json'
    manifest = json.loads(manifest_path.read_text())
    assert manifest['version'] in (OLD,NEW)
    if manifest['version'] == OLD:
        assert manifest['sha256'] == PREVIOUS_DIGEST
    sha = hashlib.sha256(compact).hexdigest()
    manifest.update(version=NEW, sha256=sha, html_url=f'https://lion000097.github.io/monster-biyori/releases/{NEW}/launcher-game.html')
    for script in re.findall(r'<script>(.*?)</script>', regular, re.S):
        subprocess.run(['node','--check'], input=script, text=True, check=True)
    (ROOT / 'game.html').write_text(regular)
    (RELEASE / 'game.html').write_text(regular)
    (RELEASE / 'launcher-game.html').write_bytes(compact)
    manifest_path.write_text(json.dumps(manifest, indent=2)+'\n')
    archive = update_zip(compact)
    listing = ROOT / 'archive.html'
    page = listing.read_text()
    entry = f'<li data-version="{NEW}"><a href="releases/{NEW}/{archive.name}">Ver. {NEW} のZIP</a><small>{archive.stat().st_size/1e6:.2f} MB ・ 現行配布</small></li>'
    existing = re.compile(r'<li data-version="'+re.escape(NEW)+r'">.*?</li>')
    if existing.search(page):
        page = existing.sub(lambda _: entry, page)
    else:
        assert page.count('<ul id="versions">') == 1
        page = page.replace('<ul id="versions">','<ul id="versions">'+entry+'\n')
    listing.write_text(page)
    progress = ROOT / 'PROGRESS.md'
    previous_heading = f'# {OLD}　'
    previous_progress = progress.read_text()
    assert previous_heading in previous_progress
    progress.write_text((WORK / 'summary.md').read_text().rstrip()+'\n\n'+previous_heading+previous_progress.split(previous_heading,1)[1])
    version,size,digest = check(lambda name:(ROOT/name).read_bytes())
    print(f'{version} verified: launcher={size} bytes, sha256={digest}, zip={archive.stat().st_size} bytes',flush=True)


if __name__ == '__main__':
    main()
