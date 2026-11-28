"""Apply the six registered illustrations to the two published 1.25.87 editions."""
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
VERSION = '1.25.88'
PREVIOUS = '1.25.87'
SOURCE = ROOT / 'releases' / PREVIOUS
RELEASE = ROOT / 'releases' / VERSION
ART = ROOT / 'assets/town-axis'
PLOTS = json.loads((HERE / 'plots.json').read_text())
NOTES = ('CHANGELOG.md', 'TESTING.md')
PUBLIC = 'https://lion000097.github.io/monster-biyori'

spec = importlib.util.spec_from_file_location('building_tools', HERE.parent / 'building-review-12586/build.py')
building_tools = importlib.util.module_from_spec(spec)
spec.loader.exec_module(building_tools)
replace = building_tools.replace_once
update_json = building_tools.update_json


def build_page(page, compact):
    if f"GAME_APP_VERSION='{PREVIOUS}'" not in page or page.count(PREVIOUS) != 3:
        raise ValueError('Unexpected starting version')
    page = page.replace(PREVIOUS, VERSION)
    page = replace(page, '遊具の修繕小屋・森の製本室・石ころ鑑定所の正面の柱</footer>',
                   '旅人の足湯から雨がさ貸し小屋まで、建築6種の新しい原画</footer>')
    folder = HERE / 'launcher' if compact else ART / 'painted'

    def install_paintings(bank):
        for kind, plot in PLOTS.items():
            uri = base64.b64encode((folder / f'{kind}.webp').read_bytes()).decode('ascii')
            bank[kind] = [plot['size'], 'data:image/webp;base64,' + uri]

    def remove_replaced_illustrations(bank):
        for kind in ('footBath', 'seedSwap', 'openGallery'):
            del bank[kind]

    page = update_json(page, 'axisAtlas', install_paintings)
    page = update_json(page, 'illustratedTownBank', remove_replaced_illustrations)
    details = json.loads((ART / 'painted-details.json').read_text())
    page = update_json(page, 'paintedDetails', lambda bank: bank.update(
        umbrellaHut=details['umbrellaHut'], seedSwap=details['seedSwap']))
    plots = 'const travelerPlots=' + json.dumps(PLOTS, separators=(',', ':')) + ';\n'
    start = page.index('const axisSprites=new Map();')
    stop = page.index('g.restore();art.views.set(key,{subject,image:c});return c;\n}', start)
    stop += len('g.restore();art.views.set(key,{subject,image:c});return c;\n}')
    state_source = (ART / 'painted-state.js').read_text()
    page = page[:start] + plots + state_source[state_source.index('const axisSprites='):].rstrip() + page[stop:]
    start = page.index('const movingDesigns=new Set(')
    stop = page.index('\n})();\n// END town workshop drawings', start)
    page = page[:start] + (ROOT/'assets/town-atelier/illustrated-town.js').read_text().rstrip() + '\n' + page[stop:]
    placement = (HERE / 'registered-lots.js').read_text()
    page = replace(page, 'function plotImageRect(b,m=buildingOf(b)) {',
                   placement + '\nfunction plotImageRect(b,m=buildingOf(b),facing=b.facing) {\n'
                   '  if(travelerPlots[b.type])return travelerLotRect(b,m,facing);')
    page = replace(page, 'const m=buildingOf(b),rect=plotImageRect(b,m);',
                   'const m=buildingOf(b),rect=plotImageRect(b,m,facing);')
    draw_art = 'ctx.drawImage(art,rect.x,rect.y,rect.w,rect.h);'
    return replace(page, draw_art, 'if(travelerPlots[b.type])drawTravelerPaving(b,m);\n  ' + draw_art)


def build_web():
    web = build_page((SOURCE / 'game.html').read_text(), False).encode()
    (RELEASE / 'game.html').write_bytes(web)
    (ROOT / 'game.html').write_bytes(web)


def expanded_launcher():
    codec = building_tools.codec()
    return build_page(codec.unpack_launcher((SOURCE / 'launcher-game.html').read_text()), True)


def build_launcher():
    codec = building_tools.codec()
    game = expanded_launcher()
    packed = codec.pack(game, binary_assets=True, dictionary=True, zstd_pack=True,
                        wide_words=True, zstd_level=22, embedded_inflater=True)
    if codec.unpack_launcher(packed) != game:
        raise ValueError('Launcher round trip changed the game')
    raw = packed.encode()
    print('Launcher bytes:', len(raw), flush=True)
    if len(raw) > 4*1024*1024:
        raise ValueError('The updater accepts at most 4 MiB')
    (RELEASE / 'launcher-game.html').write_bytes(raw)


def package():
    data = (RELEASE / 'launcher-game.html').read_bytes()
    archive = RELEASE / f'monster-biyori-{VERSION}.zip'
    replace_at_root = {name:(RELEASE/name).read_bytes() for name in NOTES}
    replace_at_root['game.html'] = data
    with ZipFile(SOURCE / f'monster-biyori-{PREVIOUS}.zip') as old, ZipFile(archive,'w') as new:
        for item in old.infolist():
            raw = replace_at_root[item.filename] if item.filename in replace_at_root else old.read(item)
            new.writestr(item, raw, compresslevel=9)
        for name in (*NOTES, 'buildings.webp'):
            entry = ZipInfo(f'releases/{VERSION}/{name}',date_time=(2026,11,28,0,0,0))
            entry.compress_type = ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            new.writestr(entry,(RELEASE / name).read_bytes(),compresslevel=9)
    manifest = ROOT / 'latest.json'
    update = json.loads(manifest.read_text())
    if update['version'] not in (PREVIOUS, VERSION):
        raise ValueError('Unexpected updater version')
    update.update(version=VERSION, html_url=f'{PUBLIC}/releases/{VERSION}/launcher-game.html',
                  sha256=hashlib.sha256(data).hexdigest())
    manifest.write_text(json.dumps(update, indent=2) + '\n')
    index = ROOT / 'archive.html'
    page = index.read_text()
    if f'data-version="{VERSION}"' not in page:
        prev = re.search(fr'<li data-version="{re.escape(PREVIOUS)}">.*?</li>',page)[0]
        current = re.sub(r'\d+\.\d+ MB', f'{archive.stat().st_size/1024**2:.2f} MB',
                         prev.replace(PREVIOUS, VERSION))
        index.write_text(replace(page, prev, current+'\n'+prev.replace(' ・ 現行配布','')))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('step', choices=('web','launcher','package','all'), nargs='?',default='all')
    step = parser.parse_args().step
    RELEASE.mkdir(exist_ok=True, parents=True)
    if step in ('web', 'all'):
        build_web()
    if step in ('launcher', 'all'):
        build_launcher()
    if step in ('package', 'all'):
        package()
