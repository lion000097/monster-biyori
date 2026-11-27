"""Reproduce the 1.25.69 distribution from the checked-in checkpoint."""
import argparse
import base64
import hashlib
import io
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

VERSION = '1.25.69'
PREVIOUS = '1.25.68'
ROOT = Path.cwd()
WORK = ROOT / 'work' / VERSION
PRIOR = ROOT / 'releases' / PREVIOUS
RELEASE = ROOT / 'releases' / VERSION
sys.path.insert(0, str(ROOT / 'tools'))
from pack_launcher_html import decode_payload, pack, MARKER
import zlib

def unpack_prior(raw):
    payload = re.search(r'id="ranch-payload">(.*?)</script>', raw, re.S)[1]
    inflater = re.search(r'id="ranch-inflater">(.*?)</script>', raw, re.S)[1]
    length = int(re.search(r'PACKED_BYTES=(\d+)', raw)[1])
    return zlib.decompress(decode_payload(payload, length)).decode().replace(MARKER, inflater)

def sha(data):
    return hashlib.sha256(data).hexdigest()

def main(apply_patch):
    if apply_patch:
        assert (ROOT / 'game.html').read_bytes() == (PRIOR / 'game.html').read_bytes()
        subprocess.run(['git', 'apply', '--unidiff-zero', str(WORK / 'game.patch')], check=True)
    game = ROOT / 'game.html'
    web = game.read_text()
    old_regular = (PRIOR / 'game.html').read_text()
    compact = (PRIOR / 'launcher-game.html').read_bytes()
    old_manifest = json.loads((ROOT / 'latest.json').read_text())
    assert old_manifest['version'] == PREVIOUS and sha(compact) == old_manifest['sha256']
    old_source = unpack_prior(compact.decode())
    source = web
    # Carry forward the exact same lossless image encodings from the 1.25.68 launcher.
    pattern = r'data:image/(?:png|webp);base64,[A-Za-z0-9+/=]+'
    for before, after in zip(old_regular.splitlines(), old_source.splitlines(), strict=True):
        if before == after:
            continue
        pairs = list(zip(re.findall(pattern, before), re.findall(pattern, after), strict=True))
        reconstructed = before
        for png, packed in pairs:
            if png != packed:
                assert source.count(png) == 1
                source = source.replace(png, packed)
                reconstructed = reconstructed.replace(png, packed)
        assert reconstructed == after
    replacement = 'data:image/webp;base64,' + base64.b64encode((WORK / 'frontier-background.webp').read_bytes()).decode()
    source, count = re.subn(r"(?<=frontierPanoramaURI=')data:image/png;base64,[A-Za-z0-9+/=]+", lambda m: replacement, source)
    assert count == 1
    for part in re.findall(r'<script>(.*?)</script>', web, re.S):
        subprocess.run(['node', '--check'], input=part, text=True, check=True)
    release_html = pack(source, dense=True, binary_assets=True).encode()
    if len(release_html) > 4 * 1024**2:
        raise ValueError('Launcher package exceeds 4 MiB')
    RELEASE.mkdir(exist_ok=True)
    (RELEASE / 'launcher-game.html').write_bytes(release_html)
    shutil.copyfile(game, RELEASE / 'game.html')
    manifest = dict(old_manifest, version=VERSION, html_url=f'https://lion000097.github.io/monster-biyori/releases/{VERSION}/launcher-game.html', sha256=sha(release_html))
    (ROOT / 'latest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    updates = {'game.html': release_html}
    for name in ('CHANGELOG.md','TESTING.md'):
        data = (RELEASE/name).read_bytes()
        updates[name] = data
        updates[f'releases/{VERSION}/{name}'] = data
    target = RELEASE / f'monster-biyori-{VERSION}.zip'
    with ZipFile(PRIOR / f'monster-biyori-{PREVIOUS}.zip') as old:
        with ZipFile(target, 'w', compression=ZIP_DEFLATED, compresslevel=9) as out:
            for entry in old.infolist():
                if entry.filename not in updates:
                    out.writestr(entry, old.read(entry))
            for name, data in updates.items():
                entry=ZipInfo(name, (2026,11,27,0,0,0));entry.compress_type=ZIP_DEFLATED;entry.external_attr=0o100644<<16
                out.writestr(entry, data, compresslevel=9)
        with ZipFile(target) as new:
            assert set(new.namelist()) == (set(old.namelist()) | set(updates))
            for name in new.namelist():
                assert new.read(name) == (updates[name] if name in updates else old.read(name))
            print('ZIP entries verified',len(new.namelist()))
    archive=ROOT / 'archive.html'; anchor='<ul id="versions">'
    listing=archive.read_text();assert listing.count(anchor)==1 and f'data-version="{VERSION}"' not in listing
    item=f'<li data-version="{VERSION}"><a href="releases/{VERSION}/{target.name}">Ver. {VERSION} のZIP</a><small>{target.stat().st_size/1e6:.2f} MB ・ 現行配布</small></li>\n'
    archive.write_text(listing.replace(anchor,anchor+item))
    progress=ROOT / 'PROGRESS.md'
    progress.write_text((WORK / 'progress-summary.md').read_text()+'\n'+progress.read_text())
    subprocess.run([sys.executable,'tools/release_preflight.py','--root','.'],check=True)

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--apply-patch',action='store_true')
    main(parser.parse_args().apply_patch)
