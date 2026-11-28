"""Build the two 1.25.89 editions from the corresponding 1.25.88 releases."""
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
VERSION = '1.25.89'
PREVIOUS = '1.25.88'
RELEASE = ROOT / 'releases' / VERSION
SOURCE = ROOT / 'releases' / PREVIOUS
ART = ROOT / 'assets/town-axis'
PLOTS = json.loads((HERE / 'plots.json').read_text())
PUBLIC = 'https://lion000097.github.io/monster-biyori'
spec = importlib.util.spec_from_file_location('building_tools', HERE.parent/'building-review-12586/build.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)
replace = helpers.replace_once


def build_page(page, compact):
    if page.count(PREVIOUS) != 3 or f"GAME_APP_VERSION='{PREVIOUS}'" not in page:
        raise ValueError('Unexpected source edition')
    page = page.replace(PREVIOUS, VERSION)
    page = replace(page, '旅人の足湯から雨がさ貸し小屋まで、建築6種の新しい原画</footer>',
                   '旅の建築6種の石縁と設置マスの四隅</footer>')
    def images(bank):
        for kind, plot in PLOTS.items():
            folder = HERE/'launcher' if compact else ART/'painted'
            data = base64.b64encode((folder/(kind+'.webp')).read_bytes()).decode('ascii')
            bank[kind] = [plot['size'], 'data:image/webp;base64,' + data]

    def positions(bank):
        if set(bank) != set(PLOTS):
            raise ValueError('Unexpected registered facilities')
        for kind, p in PLOTS.items():
            bank[kind] = {key:p[key] for key in ('size','anchor','span')}

    def exhibits(bank):
        details = json.loads((ART / 'painted-details.json').read_text())
        for kind in ('seedSwap','umbrellaHut'):
            bank[kind] = details[kind]

    page = helpers.update_json(page, 'axisAtlas', images)
    page = helpers.update_json(page, 'travelerPlots', positions)
    page = helpers.update_json(page, 'paintedDetails', exhibits)
    source = (ROOT/'assets/town-atelier/illustrated-town.js').read_text()
    easel = re.compile(r'const corners=face===0 \? \[.*?\]\s*:\s*\[.*?\];', re.S)
    old, new = easel.findall(page), easel.findall(source)
    if len(old) != 1 or len(new) != 1:
        raise ValueError('Unexpected gallery display')
    page = replace(page, old[0], new[0])
    previous_placement = (HERE.parent/'traveler-art-12588/registered-lots.js').read_text().rstrip()
    placement = (HERE/'registered-lots.js').read_text().rstrip()
    page = replace(page, previous_placement, placement)
    page = replace(page, 'travelerLotRect(b,m,facing);', 'travelerLotRect(b,m);')
    page = replace(page, 'if(travelerPlots[b.type])drawTravelerPaving(b,m);\n  ', '')
    return page


def build_web():
    web = build_page((SOURCE/'game.html').read_text(), False).encode()
    (RELEASE/'game.html').write_bytes(web)
    (ROOT/'game.html').write_bytes(web)


def build_launcher():
    codec = helpers.codec()
    source = build_page(codec.unpack_launcher((SOURCE/'launcher-game.html').read_text()), True)
    packed = codec.pack(source, binary_assets=True, dictionary=True, zstd_pack=True,
                        wide_words=True, zstd_level=22, embedded_inflater=True)
    if codec.unpack_launcher(packed) != source:
        raise ValueError('Launcher round trip failed')
    data = packed.encode()
    print('Launcher bytes', len(data), flush=True)
    if len(data) > 4*1024*1024:
        raise ValueError('Launcher exceeds the 4 MiB update limit')
    (RELEASE/'launcher-game.html').write_bytes(data)


def package():
    compact = (RELEASE/'launcher-game.html').read_bytes()
    package_name = f'monster-biyori-{VERSION}.zip'
    docs = ('CHANGELOG.md','TESTING.md')
    updates = {'game.html':compact, **{p:(RELEASE/p).read_bytes() for p in docs}}
    with ZipFile(SOURCE/f'monster-biyori-{PREVIOUS}.zip') as old, ZipFile(RELEASE/package_name,'w') as new:
        for item in old.infolist():
            new.writestr(item, updates[item.filename] if item.filename in updates else old.read(item), compresslevel=9)
        for name in (*docs, 'buildings.webp'):
            item = ZipInfo(f'releases/{VERSION}/{name}', (2026,11,28,0,0,0))
            item.compress_type = ZIP_DEFLATED
            item.external_attr = 0o100644 << 16
            new.writestr(item, (RELEASE/name).read_bytes(), compresslevel=9)
    latest = ROOT/'latest.json'
    data = json.loads(latest.read_text())
    if data['version'] not in (PREVIOUS,VERSION):
        raise ValueError('Unexpected current release')
    data.update(version=VERSION, html_url=f'{PUBLIC}/releases/{VERSION}/launcher-game.html',
                sha256=hashlib.sha256(compact).hexdigest())
    latest.write_text(json.dumps(data,indent=2)+'\n')
    archive = ROOT/'archive.html'
    html = archive.read_text()
    if f'data-version="{VERSION}"' not in html:
        current = re.search(fr'<li data-version="{re.escape(PREVIOUS)}">.*?</li>',html)[0]
        entry = re.sub(r'\d+\.\d+ MB', f'{(RELEASE/package_name).stat().st_size/1024**2:.2f} MB',current.replace(PREVIOUS,VERSION))
        archive.write_text(replace(html,current,entry+'\n'+current.replace(' ・ 現行配布','')))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('step', choices=('web','launcher','package','all'), default='all', nargs='?')
    step = parser.parse_args().step
    RELEASE.mkdir(parents=True,exist_ok=True)
    if step in ('web','all'):
        build_web()
    if step in ('launcher','all'):
        build_launcher()
    if step in ('package','all'):
        package()
