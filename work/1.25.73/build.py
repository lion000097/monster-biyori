"""Build the regular game, offline edition and ZIP from the shipped 1.25.72 pair."""
import copy
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import zlib
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from update import update_game

ROOT = Path(__file__).resolve().parents[2]
OLD, VERSION = '1.25.72', '1.25.73'
BEFORE, RELEASE = (ROOT / 'releases' / version for version in (OLD, VERSION))
sys.path.insert(0, str(ROOT / 'tools'))
from pack_launcher_html import MARKER, decode_payload, pack, unbundle_assets
from release_preflight import check


def unpack(html):
    data = re.search(r'id="ranch-payload">(.*?)</script>', html, re.S)[1]
    size = int(re.search(r'PACKED_BYTES=(\d+)', html)[1])
    inflater = re.search(r'id="ranch-inflater">(.*?)</script>', html, re.S)[1]
    return unbundle_assets(zlib.decompress(decode_payload(data, size))).replace(MARKER, inflater)


def package_zip(compact):
    output = RELEASE / f'monster-biyori-{VERSION}.zip'
    updates = {'game.html': compact}
    for name in ('CHANGELOG.md', 'TESTING.md'):
        updates[name] = updates[f'releases/{VERSION}/{name}'] = (RELEASE / name).read_bytes()
    with ZipFile(BEFORE / f'monster-biyori-{OLD}.zip') as previous:
        with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
            for member in previous.infolist():
                if member.filename not in updates:
                    archive.writestr(copy.copy(member), previous.read(member))
            for name, content in updates.items():
                member = ZipInfo(name, (2026, 11, 27, 0, 0, 0))
                member.compress_type = ZIP_DEFLATED
                member.external_attr = 0o100644 << 16
                archive.writestr(member, content, compresslevel=9)
        with ZipFile(output) as after:
            assert set(after.namelist()) == set(previous.namelist()) | set(updates)
            for name in after.namelist():
                assert after.read(name) == (updates[name] if name in updates else previous.read(name))
    return output


def main():
    previous = (BEFORE / 'launcher-game.html').read_bytes()
    assert hashlib.sha256(previous).hexdigest() == '6ca2e92febcc24d192a34467688d1f6ad87e878310d106c180edcee87bc04bcb'
    web = update_game((BEFORE / 'game.html').read_text())
    for script in re.findall(r'<script>(.*?)</script>', web, re.S):
        subprocess.run(['node', '--check'], input=script, text=True, check=True)
    compact = pack(update_game(unpack(previous.decode())), dense=True, binary_assets=True).encode()
    assert len(compact) <= 4 * 1024 * 1024
    (RELEASE / 'launcher-game.html').write_bytes(compact)
    (RELEASE / 'game.html').write_text(web)
    (ROOT / 'game.html').write_text(web)
    manifest_path = ROOT / 'latest.json'
    manifest = json.loads(manifest_path.read_text())
    assert manifest['version'] in (VERSION, OLD)
    manifest.update(version=VERSION, html_url=f'https://lion000097.github.io/monster-biyori/releases/{VERSION}/launcher-game.html',
                    sha256=hashlib.sha256(compact).hexdigest())
    manifest_path.write_text(json.dumps(manifest, indent=2)+'\n')
    bundle = package_zip(compact)
    listing = ROOT / 'archive.html'
    page = re.sub(r'<li data-version="1\.25\.73">.*?</li>\n?', '', listing.read_text())
    entry = (f'<li data-version="{VERSION}"><a href="releases/{VERSION}/{bundle.name}">Ver. {VERSION} のZIP</a>'
             f'<small>{bundle.stat().st_size/1e6:.2f} MB ・ 現行配布</small></li>')
    assert page.count('<ul id="versions">') == 1
    listing.write_text(page.replace('<ul id="versions">', '<ul id="versions">'+entry+'\n'))
    progress = ROOT / 'PROGRESS.md'
    previous_heading = f'# {OLD}　'
    old_progress = previous_heading + progress.read_text().split(previous_heading, 1)[1]
    progress.write_text(Path(__file__).with_name('summary.md').read_text().rstrip()+'\n\n'+old_progress)
    print(check(lambda name:(ROOT / name).read_bytes()), flush=True)


if __name__ == '__main__':
    main()
