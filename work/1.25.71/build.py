"""Rebuild the verified adventure redraw from both shipped editions of 1.25.70."""
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
OLD, NEW = '1.25.70', '1.25.71'
OLD_DIR, RELEASE = (ROOT / 'releases' / v for v in (OLD, NEW))
WORK = ROOT / 'work' / NEW
sys.path.insert(0, str(ROOT / 'tools'))
from pack_launcher_html import MARKER, decode_payload, pack, unbundle_assets
from release_preflight import check
from apply_art import update_game


def unpack(raw):
    html = raw.decode()
    encoded = re.search(r'id="ranch-payload">(.*?)</script>', html, re.S)[1]
    size = int(re.search(r'PACKED_BYTES=(\d+)', html)[1])
    inflater = re.search(r'id="ranch-inflater">(.*?)</script>', html, re.S)[1]
    return unbundle_assets(zlib.decompress(decode_payload(encoded, size))).replace(MARKER, inflater)


def package_zip(compact):
    replacements = {'game.html': compact}
    for name in ['CHANGELOG.md', 'TESTING.md']:
        replacements[name] = replacements[f'releases/{NEW}/{name}'] = (RELEASE / name).read_bytes()
    output = RELEASE / f'monster-biyori-{NEW}.zip'
    with ZipFile(OLD_DIR / f'monster-biyori-{OLD}.zip') as previous:
        with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
            for member in previous.infolist():
                if member.filename not in replacements:
                    archive.writestr(copy.copy(member), previous.read(member))
            for name, data in replacements.items():
                member = ZipInfo(name, (2026, 11, 27, 0, 0, 0))
                member.compress_type = ZIP_DEFLATED
                member.external_attr = 0o100644 << 16
                archive.writestr(member, data, compresslevel=9)
        with ZipFile(output) as after:
            assert set(after.namelist()) == set(previous.namelist()) | set(replacements)
            for name in after.namelist():
                assert after.read(name) == (replacements[name] if name in replacements else previous.read(name))
    return output


def main():
    previous = (OLD_DIR / 'launcher-game.html').read_bytes()
    assert hashlib.sha256(previous).hexdigest() == '9b66083efa279760b547cabfa30713a5d6f12df65e769efa4fe9bb1dd0c66889'
    regular = update_game((OLD_DIR / 'game.html').read_text())
    for script in re.findall(r'<script>(.*?)</script>', regular, re.S):
        subprocess.run(['node', '--check'], input=script, text=True, check=True)
    compact = pack(update_game(unpack(previous), launcher=True), dense=True, binary_assets=True).encode()
    assert len(compact) <= 4 * 1024 ** 2
    (ROOT / 'game.html').write_text(regular)
    (RELEASE / 'game.html').write_text(regular)
    (RELEASE / 'launcher-game.html').write_bytes(compact)
    manifest = json.loads((ROOT / 'latest.json').read_text())
    assert manifest['version'] in (OLD, NEW)
    manifest.update(version=NEW, html_url=f'https://lion000097.github.io/monster-biyori/releases/{NEW}/launcher-game.html',
                    sha256=hashlib.sha256(compact).hexdigest())
    (ROOT / 'latest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    bundle = package_zip(compact)
    listing = ROOT / 'archive.html'
    page = listing.read_text()
    entry = (f'<li data-version="{NEW}"><a href="releases/{NEW}/{bundle.name}">Ver. {NEW} のZIP</a>'
             f'<small>{bundle.stat().st_size/1e6:.2f} MB ・ 現行配布</small></li>')
    page = re.sub(r'<li data-version="1\.25\.71">.*?</li>\n?', '', page)
    assert page.count('<ul id="versions">') == 1
    listing.write_text(page.replace('<ul id="versions">', '<ul id="versions">' + entry + '\n'))
    progress = ROOT / 'PROGRESS.md'
    old_heading = f'# {OLD}　'
    progress.write_text((WORK / 'summary.md').read_text().rstrip() + '\n\n' + old_heading
                        + progress.read_text().split(old_heading, 1)[1])
    print(check(lambda name: (ROOT / name).read_bytes()), flush=True)


if __name__ == '__main__':
    main()
