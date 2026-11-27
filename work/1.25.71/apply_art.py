from pathlib import Path
import re
from apply_health import once, update_health
from draw_adventure_art import embed

HERE = Path(__file__).resolve().parent


def update_game(old, launcher=False):
    if old.count('1.25.70') != 3:
        raise ValueError('Unexpected base game')
    source = old.replace('1.25.70', '1.25.71')
    source, n = re.subn(r"^const frontierPanoramaURI='[^']+';\n", '', source, flags=re.M)
    if n != 1:
        raise ValueError('Missing frontier panorama')
    start = source.index('// Native pixel art from tools/draw_adventure_art.py.')
    end = source.index('function drawAdventureLabel', start)
    source = source[:start] + (HERE / 'scenery.js').read_text() + source[end:]
    start = source.index('function drawAdventureProp(')
    end = source.index('function adventureSparkle', start)
    source = source[:start] + """function drawAdventureProp(g,image,sourceX,width,x,bottom){
 const h=image.naturalHeight;
 if(h)g.drawImage(image,sourceX,0,width,h,Math.round(x),bottom-h,width,h);
}
""" + source[end:]
    source = once(source, 'drawAdventureProp(g,0,46,57,x-8,89);', 'drawAdventureProp(g,adventureGoal,0,46,x-8,89);')
    source = once(source, 'drawAdventureProp(g,opened?78:46,32,32,x,88);',
                  'const frame=opened?(j.loot===null?2:1):0;\n   drawAdventureProp(g,adventureChest,frame*32,32,x,88);')
    return embed(update_health(source), launcher)
