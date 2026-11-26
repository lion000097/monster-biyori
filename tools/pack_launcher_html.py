"""Pack one self-contained game HTML as a reversible, offline launcher document."""
import argparse
import base64
from pathlib import Path
import re
import zlib

# RFC 1924 base85 never uses '/'. Replace '<' as well so the HTML raw-text parser
# cannot interpret any part of the payload as a tag or an HTML comment.
ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;,=>?@^_`{|}~'
MARKER = '@@LAUNCHER_INFLATER_SOURCE@@'
BOOT = """
const payload=document.getElementById('ranch-payload').textContent;
const inflateSource=document.getElementById('ranch-inflater').textContent;
document.addEventListener('DOMContentLoaded',()=>{
  const lookup=new Uint8Array(128);
  for(const [i,c] of Array.from(ALPHABET).entries())lookup[c.charCodeAt(0)]=i;
  const bytes=new Uint8Array(Math.floor(payload.length*4/5));
  for(let pos=0,out=0;pos<payload.length;pos+=5){
    let word=0;
    const count=Math.min(5,payload.length-pos);
    for(let k=0;k<5;k++)word=word*85+(k<count?lookup[payload.charCodeAt(pos+k)]:84);
    for(let k=0;k<count-1;k++)bytes[out++]=(word>>>((3-k)*8))&255;
  }
  const decoded=new TextDecoder().decode(inflateCharacter12523(bytes));
  const html=decoded.replace('@@LAUNCHER_INFLATER_SOURCE@@',()=>inflateSource);
  if(!html.includes("GAME_APP_VERSION='"+GAME_APP_VERSION+"'"))throw Error('Launcher version mismatch');
  document.open();document.write(html);document.close();
},{once:true});
"""
def pack(source):
    version = re.search(r"GAME_APP_VERSION='([\d.]+)'", source)[1]
    start = source.index('/* Embedded, unmodified pako ')
    end = source.index('\n})();', source.index('  return module.exports.inflate;', start)) + len('\n})();')
    inflater = source[start:end]
    if MARKER in source or '</script' in inflater.lower():
        raise ValueError('Unsafe or ambiguous inflater marker')
    stripped = source[:start] + MARKER + source[end:]
    compressed = zlib.compress(stripped.encode(), 9)
    data = base64.b85encode(compressed).decode().replace('<', ',')
    restored = zlib.decompress(base64.b85decode(data.replace(',', '<'))).decode().replace(MARKER, inflater)
    if restored != source:
        raise ValueError('Launcher round trip changed the game')
    return ("<!doctype html><html lang=ja><meta charset=utf-8><title>もんすたー日和</title>"
            '<script type="application/octet-stream" id="ranch-payload">' + data + '</script>'
            '<script id="ranch-inflater">' + inflater + '</script><script>(()=>{'
            + f"const GAME_APP_VERSION='{version}';const ALPHABET='{ALPHABET}';" + BOOT
            + '})();</script></html>')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    data = pack(args.source.read_text()).encode()
    if len(data) > 4 * 1024 * 1024:
        raise SystemExit(f'Launcher exceeds 4 MiB: {len(data):,} bytes')
    args.destination.write_bytes(data)
    print(f'{len(data):,} bytes')
