"""Build the 1.25.98 city walkers on top of the released game and launcher."""
import argparse
import base64
import hashlib
import json
import re
import runpy
import shutil
import zlib
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OLD = '1.25.97'
VERSION = '1.25.98'
BANK = f'citizen-walk-{VERSION}.js'
OLD_BANK = 'town-motion-1.25.96.js'
LOOKUP = """function townResidentAsset(person) {
  return townMotionSpecies.get('@' + characterArt.citizens[citizenPortraitName(person)]);
}
"""


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('Expected one occurrence of ' + old[:70])
    return source.replace(old, new, 1)


def encode_sheets():
    roster = json.loads((HERE / 'roster.json').read_text())
    if len({r['slot'] for r in roster}) != 55:
        raise ValueError('Incomplete citizen and traveler roster')
    sheets = {}
    for entry in roster:
        slot = entry['slot']
        with Image.open(HERE / 'sprites' / f'{slot:03}.png') as atlas:
            if atlas.size != (192, 256) or atlas.mode != 'P' or atlas.info.get('transparency') != 0:
                raise ValueError(f'Invalid sheet for {entry["name"]}')
            frames = [atlas.crop((x, y, x+64, y+64)).tobytes()
                      for y in range(0, 256, 64) for x in range(0, 192, 64)]
            if len(set(frames)) != 12:
                raise ValueError(f'Repeated frame for {entry["name"]}')
            colors = bytes(atlas.getpalette())
        indices = b''.join(frames)
        palette = [int.from_bytes(colors[i:i+3], 'big') for i in range(0, (1+max(indices))*3, 3)]
        sheets[f'@{slot}'] = dict(side=64, normal=palette,
                                  pixels=base64.b64encode(zlib.compress(indices, 9)).decode())
    return json.dumps(sheets, separators=(',', ':'))


def patch(source):
    source = once(source, f'<title>もんすたー日和 Ver.{OLD}', f'<title>もんすたー日和 Ver.{VERSION}')
    source = once(source, f'Ver.{OLD} — モンスターの気持ち</footer>',
                  f'Ver.{VERSION} — 市民と旅人の街歩き</footer>')
    source = once(source, f"GAME_APP_VERSION='{OLD}'", f"GAME_APP_VERSION='{VERSION}'")
    source = once(source, 'const motionAsset=monster && townMotionAsset(o);',
                  'const motionAsset=monster ? townMotionAsset(o) : townResidentAsset(o);')
    start = source.index('const stepBeforeTownMotion = stepActors;')
    end = source.index('function townMotionArt(', start)
    source = source[:start] + (HERE / 'step.js').read_text() + '\n' + source[end:]
    source = once(source, 'const key = tile + (monster.shiny ? 12 : 0);',
                  'const shiny = monster.shiny && asset.shiny;\n  const key = tile + (shiny ? 12 : 0);')
    source = once(source, 'palette = monster.shiny ? asset.shiny : asset.normal;',
                  'palette = shiny ? asset.shiny : asset.normal;')
    return once(source, 'const townMotionPoses = new WeakMap();', LOOKUP + 'const townMotionPoses = new WeakMap();')


def launcher_banks(source, digest, monster_hash):
    """Share the existing cache and retain all previously cached monster art."""
    previous = (ROOT / 'work/town-motion-12596/launcher-motion.js').read_text().replace('__BANK_HASH__', monster_hash)
    shared = previous[:previous.index('(async function loadTownMotionBank96()')] + previous[previous.index('  function install(bank)'):]
    start = shared.index('  function install(bank)')
    shared = shared[:start] + """async function loadTownArtBank(filename, version, digest, key, valid) {
  const prefix = 'globalThis.' + key + '=';
  const official = 'https://lion000097.github.io/monster-biyori/releases/' + version + '/' + filename;
""" + shared[start:]
    # Browser drawing adds canvases to installed assets. Keep the cached data cloneable.
    shared = once(shared, 'townMotionSpecies.set(id, asset);', 'townMotionSpecies.set(id, {...asset});')
    shared = once(shared, 'const bank = globalThis.MBTownMotion96;\n        delete globalThis.MBTownMotion96;',
                  'const bank = globalThis[key];\n        delete globalThis[key];')
    shared = once(shared, '})().catch(() => {});', '''}
loadTownArtBank('town-motion-1.25.96.js', '1.25.96', '__MONSTER__', 'MBTownMotion96',
  bank => bank && Object.keys(bank).length === 127 && SPECIES.every(s => {
    const a=bank[s.id]; return a && typeof a.pixels === 'string' && Array.isArray(a.normal) && a.normal.length === a.shiny?.length;
  })).catch(() => {});
loadTownArtBank('__BANK__', '__VERSION__', '__CITIZEN__', 'MBCitizenWalk98',
  bank => bank && Object.keys(bank).length === 55 && Object.values(characterArt.citizens).every(slot => {
    const a=bank['@'+slot]; return a && a.side === 64 && typeof a.pixels === 'string' && Array.isArray(a.normal);
  })).catch(() => {});''')
    shared = shared.replace('__MONSTER__', monster_hash).replace('__CITIZEN__', digest)
    return once(source, previous, shared.replace('__BANK__', BANK).replace('__VERSION__', VERSION))


def build(previous_zip):
    old = ROOT / 'releases' / OLD
    dest = ROOT / 'releases' / VERSION
    dest.mkdir(exist_ok=True)
    sheets = encode_sheets()
    bank = ('globalThis.MBCitizenWalk98=' + sheets + ';\n').encode()
    (dest/BANK).write_bytes(bank)
    web = patch((old/'game.html').read_bytes().decode())
    before = 'const townMotionPoses = new WeakMap();'
    web = once(web, before, 'for (const [id, sheet] of Object.entries('+sheets+')) townMotionSpecies.set(id, sheet);\n'+before)
    (dest/'game.html').write_bytes(web.encode())
    (ROOT/'game.html').write_bytes(web.encode())
    codec = runpy.run_path(str(ROOT/'work/scene-camera-12581/build.py'))
    source = patch(codec['unpack_launcher']((old/'launcher-game.html').read_bytes().decode()))
    source = launcher_banks(source, hashlib.sha256(bank).hexdigest(), hashlib.sha256((old/OLD_BANK).read_bytes()).hexdigest())
    packed = codec['pack'](source, binary_assets=True, dictionary=True, zstd_pack=True,
                           wide_words=True, zstd_level=22, embedded_inflater=True)
    if codec['unpack_launcher'](packed) != source:
        raise ValueError('Launcher round trip failed')
    launcher = packed.encode()
    if len(launcher) > 4*1024*1024:
        raise ValueError(f'Launcher is too large: {len(launcher)}')
    (dest/'launcher-game.html').write_bytes(launcher)
    for name in ['CHANGELOG.md','TESTING.md']:
        shutil.copyfile(HERE/name, dest/name)
    for name in [OLD_BANK,'stage-art-1.25.90.js']:
        shutil.copyfile(old/name, dest/name)
    zip_name = f'monster-biyori-{VERSION}.zip'
    with ZipFile(previous_zip) as previous, ZipFile(dest/zip_name,'w') as archive:
        if hashlib.sha256(previous.read('game.html')).digest() != hashlib.sha256((old/'launcher-game.html').read_bytes()).digest():
            raise ValueError('Previous ZIP does not correspond to the released launcher')
        for info in previous.infolist():
            if info.filename=='game.html':
                data=launcher
            elif info.filename in ('CHANGELOG.md','TESTING.md'):
                data=(dest/info.filename).read_bytes()
            else:
                data=previous.read(info)
            archive.writestr(info,data)
        archive.writestr(ZipInfo(BANK,(2026,11,29,0,0,0)),bank,compress_type=ZIP_DEFLATED)
    index = ROOT/'archive.html'
    html = index.read_text()
    if f'data-version="{VERSION}"' not in html:
        item = re.search(f'<li data-version="{re.escape(OLD)}">.*?</li>',html)[0]
        new_item=re.sub(r'\d+\.\d+ MB',f'{(dest/zip_name).stat().st_size/1024**2:.2f} MB',item.replace(OLD,VERSION))
        index.write_text(once(html,item,new_item+'\n'+item.replace(' ・ 現行配布','')))
    manifest=ROOT/'latest.json'
    m=json.loads(manifest.read_text())
    if m['version'] not in (OLD,VERSION):
        raise ValueError('The current release changed')
    m.update(version=VERSION, html_url=m['html_url'].replace(OLD,VERSION), sha256=hashlib.sha256(launcher).hexdigest())
    manifest.write_text(json.dumps(m,indent=2)+'\n')
    print(f'{VERSION}: {len(launcher):,} launcher bytes, {len(bank):,} citizen bank bytes',flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('previous_zip',type=Path)
    build(parser.parse_args().previous_zip)
