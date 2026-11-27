"""Build the two 1.25.80 editions from their respective published 1.25.79 games."""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from launcher_utf8_words import decode
from pack_launcher_html import MARKER, pack, unbundle_assets

OLD = ROOT / 'releases/1.25.79'
NEW = ROOT / 'releases/1.25.80'
FEATURE = ROOT / 'assets/ranch-notebook'


def replace(source, old, new, count=1):
    if source.count(old) != count:
        raise ValueError(f'Expected {count} occurrences of {old[:95]!r}')
    return source.replace(old, new)


def update(source):
    source = replace(source, '1.25.79', '1.25.80', 3)
    source = replace(source, '施設と装飾73種の新原画</footer>', '牧場の観察手帳と建築検索</footer>')
    source = replace(source, 'function initial(){return {version:1,', 'function initial(){return {version:1,observationDays80:{},')
    source = replace(source, 'if(ok)ensureAtlasSeen137();return ok;',
                     'if(ok){ensureAtlasSeen137();loadObservationDays80(state);}return ok;')
    button = '<button type="button" class="${atlasCategory===\'notebook\'?\'on\':\'\'}" data-action="atlas" data-id="notebook" aria-pressed="${atlasCategory===\'notebook\'}">📖 牧場の観察手帳</button>'
    end = "${equipmentArt12514('legacy')}装備</button>"
    source = replace(source, end, end + button, 2)
    source = replace(source, "['friend','citizen','material','equipment'].includes(id)",
                     "['friend','citizen','material','equipment','notebook'].includes(id)")
    atlas = "if(atlasCategory==='equipment')html+=renderEquipmentAtlas12513();"
    source = replace(source, atlas, "if(atlasCategory==='notebook')html+=renderObservationBook80();\n else "+atlas, 2)
    source = replace(source, "if(tab==='build'||tab==='adventure'||tab==='treasure')paintVillageCanvases();",
                     "if(tab==='build'||tab==='adventure'||tab==='treasure'||(tab==='bestiary'&&atlasCategory==='notebook'))paintVillageCanvases();")
    poll = "if(poll)for(const site of state.buildings)if(townSceneRules[site.type])townVenue(site);"
    source = replace(source, poll, "if(poll)for(const site of state.buildings){\n    observeTownPhase80(site);\n    if(townSceneRules[site.type])townVenue(site);\n  }")
    source = replace(source, "if(a.kind==='water')ranchRoutines124.wateredBy=m;",
                     "if(a.kind==='water'){ranchRoutines124.wateredBy=m;recordObservation80('flowerbed211');}")
    source = replace(source, "a.actor.act=picnicAct257;}", "a.actor.act=picnicAct257;}\n    recordObservation80('picnic257');")
    source = replace(source, "m.phase='use';m.stay=0;\n  actor.act=townSceneActs",
                     "m.phase='use';m.stay=0;\n  if(type==='rainPavilion'&&weatherInfo().name==='雨')recordObservation80(type);\n  actor.act=townSceneActs")
    source = replace(source, "if(site.type==='artHut'&&m.phase==='use'&&m.stay>=4)site.townPicture=((Math.floor(Number(site.townPicture))||0)+1)%4;",
                     "if(site.type==='artHut'&&m.phase==='use'&&m.stay>=4){site.townPicture=((Math.floor(Number(site.townPicture))||0)+1)%4;recordObservation80(site.type);}")
    source = replace(source, "v.running=true;v.elapsed=0;\n    for(const m of inside)",
                     "v.running=true;v.elapsed=0;\n    if(kind==='music'||kind==='chase')recordObservation80(v.site.type);\n    for(const m of inside)")
    script = (FEATURE/'notebook.js').read_text()
    styles = (FEATURE/'notebook.css').read_text()
    marker = '// Load saved species only after the full roster has been registered.'
    source = replace(source, marker, script+'\n'+marker)
    return replace(source, '</head>', '<style>\n'+styles+'</style>\n</head>')


def unpack_old():
    html = (OLD/'launcher-game.html').read_text()
    def script(id_):
        return re.search(f'id="{id_}">(.*?)</script>', html, re.S)[1]
    size = int(re.search(r'const PACKED_BYTES=(\d+);', html)[1])
    compressed = decode(script('ranch-payload'), size)
    raw = subprocess.run(['zstd','-qdc'], input=compressed, capture_output=True, check=True).stdout
    return unbundle_assets(raw, dictionary=True).replace(MARKER, script('ranch-inflater'))


if __name__ == '__main__':
    web = update((OLD/'game.html').read_text()).encode()
    (ROOT/'game.html').write_bytes(web)
    (NEW/'game.html').write_bytes(web)
    if '--web' not in sys.argv:
        compact = pack(update(unpack_old()), binary_assets=True, dictionary=True, zstd_pack=True, wide_words=True).encode()
        print(f'Offline HTML {len(compact):,} / {4*1024*1024:,} bytes', flush=True)
        if len(compact) > 4*1024*1024:
            raise ValueError('Offline HTML is too large')
        (NEW/'launcher-game.html').write_bytes(compact)
