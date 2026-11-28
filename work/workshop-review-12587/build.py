"""Build the approved workshop art on top of the published 1.25.86 game."""
import argparse
import base64
import hashlib
import importlib.util
import json
import re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PREVIOUS = '1.25.86'
VERSION = '1.25.87'
SOURCE = ROOT / 'releases' / PREVIOUS
RELEASE = ROOT / 'releases' / VERSION
ART = ROOT / 'assets/town-axis'
WORKSHOPS = ('toyRepair', 'bookBind', 'stoneStudy')
PUBLIC_ROOT = 'https://lion000097.github.io/monster-biyori'
PREVIOUS_TITLE = '星図の写し小屋・木の実の薬草園・おやつの瓶詰め小屋'
TITLE = '遊具の修繕小屋・森の製本室・石ころ鑑定所の正面の柱'

spec = importlib.util.spec_from_file_location(
    'reviewed_buildings', HERE.parent / 'building-review-12586/build.py')
reviewed = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reviewed)


def build_page(page, compact):
    if f"GAME_APP_VERSION='{PREVIOUS}'" not in page or page.count(PREVIOUS) != 3:
        raise ValueError('Unexpected source game version')
    page = page.replace(PREVIOUS, VERSION)
    page = reviewed.replace_once(page, PREVIOUS_TITLE + '</footer>', TITLE + '</footer>')

    def replace_paintings(bank):
        folder = HERE / 'launcher' if compact else ART / 'painted'
        for kind in WORKSHOPS:
            encoded = base64.b64encode((folder / (kind + '.webp')).read_bytes()).decode('ascii')
            bank[kind] = [160, 'data:image/webp;base64,' + encoded]

    page = reviewed.update_json(page, 'axisAtlas', replace_paintings)
    # The bookbinder previously used the illustration bank. Its four atlas
    # views now serve the placed building, construction preview and menu.
    page = reviewed.update_json(page, 'illustratedTownBank', lambda bank: bank.pop('bookBind'))
    display = json.loads((ART / 'painted-details.json').read_text())['stoneStudy']
    page = reviewed.update_json(page, 'paintedDetails', lambda bank: bank.update(stoneStudy=display))
    return reviewed.replace_once(
        page, "if(b.type==='starChart'||b.type==='jarHut'){",
        "if(['starChart','jarHut','toyRepair','bookBind','stoneStudy'].includes(b.type)){")


def build_web():
    RELEASE.mkdir(exist_ok=True, parents=True)
    web = build_page((SOURCE / 'game.html').read_text(), False).encode('utf-8')
    (RELEASE / 'game.html').write_bytes(web)
    (ROOT / 'game.html').write_bytes(web)
    print('Web SHA-256', hashlib.sha256(web).hexdigest(), flush=True)


def build_launcher():
    codec = reviewed.codec()
    compact_source = codec.unpack_launcher((SOURCE / 'launcher-game.html').read_text())
    compact = build_page(compact_source, True)
    packed = codec.pack(compact, binary_assets=True, dictionary=True, zstd_pack=True,
                        wide_words=True, zstd_level=22, embedded_inflater=True)
    payload = packed.encode('utf-8')
    if len(payload) > 4 * 1024**2:
        raise ValueError(f'Launcher update exceeds its 4 MiB limit: {len(payload)}')
    if codec.unpack_launcher(packed) != compact:
        raise ValueError('Launcher failed to round trip')
    (RELEASE / 'launcher-game.html').write_bytes(payload)
    print('Expanded launcher SHA-256', hashlib.sha256(compact.encode()).hexdigest())
    print('Launcher size', len(payload), flush=True)


def package_release():
    compact = (RELEASE / 'launcher-game.html').read_bytes()
    notes = ('CHANGELOG.md', 'TESTING.md')
    replacements = {name: (RELEASE / name).read_bytes() for name in notes}
    replacements['game.html'] = compact
    archive = RELEASE / f'monster-biyori-{VERSION}.zip'
    with ZipFile(SOURCE / f'monster-biyori-{PREVIOUS}.zip') as old, ZipFile(archive, 'w') as new:
        for entry in old.infolist():
            data = replacements[entry.filename] if entry.filename in replacements else old.read(entry)
            new.writestr(entry, data, compresslevel=9)
        for name in (*notes, 'buildings.webp'):
            info = ZipInfo(f'releases/{VERSION}/{name}', date_time=(2026, 11, 28, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            new.writestr(info, (RELEASE / name).read_bytes(), compresslevel=9)
    manifest = ROOT / 'latest.json'
    data = json.loads(manifest.read_text())
    if data['version'] not in (PREVIOUS, VERSION):
        raise ValueError('Unexpected updater version')
    data.update(version=VERSION, html_url=f'{PUBLIC_ROOT}/releases/{VERSION}/launcher-game.html',
                sha256=hashlib.sha256(compact).hexdigest())
    manifest.write_text(json.dumps(data, indent=2) + '\n')
    index = ROOT / 'archive.html'
    page = index.read_text()
    if f'data-version="{VERSION}"' not in page:
        previous = re.search(fr'<li data-version="{re.escape(PREVIOUS)}">.*?</li>', page)[0]
        new_entry = re.sub(r'\d+\.\d+ MB', f'{archive.stat().st_size / 1024**2:.2f} MB',
                           previous.replace(PREVIOUS, VERSION))
        index.write_text(reviewed.replace_once(page, previous, new_entry + '\n' +
                                                previous.replace(' ・ 現行配布', '')))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('step', choices=('web', 'games', 'package', 'all'), default='all', nargs='?')
    step = parser.parse_args().step
    if step in ('web', 'games', 'all'):
        build_web()
    if step in ('games', 'all'):
        build_launcher()
    if step in ('package', 'all'):
        package_release()
