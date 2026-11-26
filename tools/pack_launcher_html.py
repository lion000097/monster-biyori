"""Pack one self-contained game HTML as a reversible, offline launcher document."""
import argparse
import json
from pathlib import Path
import re
import zlib

# Two printable symbols can hold 13 bits (91**2 >= 8192). The alphabet
# omits '<' so a payload cannot form an HTML raw-text end tag.
ALPHABET = bytes(c for c in range(33, 127) if c not in b'"<\\')

def encode_payload(data):
    output = bytearray()
    pending = bits = 0
    for byte in data:
        pending |= byte << bits
        bits += 8
        if bits >= 13:
            word = pending & 8191
            output.extend((ALPHABET[word // 91], ALPHABET[word % 91]))
            pending >>= 13
            bits -= 13
    if bits:
        output.extend((ALPHABET[pending // 91], ALPHABET[pending % 91]))
    return output.decode('ascii')

def decode_payload(text, length):
    values = {c: i for i, c in enumerate(ALPHABET)}
    data = text.encode('ascii')
    output = bytearray()
    pending = bits = 0
    for pos in range(0, len(data), 2):
        word = 91 * values[data[pos]] + values[data[pos + 1]]
        pending |= word << bits
        bits += 13
        while bits >= 8 and len(output) < length:
            output.append(pending & 255)
            pending >>= 8
            bits -= 8
    return bytes(output)

MARKER = '@@LAUNCHER_INFLATER_SOURCE@@'
BOOT = """
const payload=document.getElementById('ranch-payload').textContent;
const inflateSource=document.getElementById('ranch-inflater').textContent;
document.addEventListener('DOMContentLoaded',()=>{
  const lookup=new Uint8Array(128);
  for(const [i,c] of Array.from(ALPHABET).entries())lookup[c.charCodeAt(0)]=i;
  const bytes=new Uint8Array(PACKED_BYTES);
  let out=0, pending=0, bits=0;
  for(let pos=0;pos<payload.length;pos+=2){
    const word=91*lookup[payload.charCodeAt(pos)]+lookup[payload.charCodeAt(pos+1)];
    pending|=word<<bits;
    bits+=13;
    while(bits>=8 && out<bytes.length){
      bytes[out++]=pending&255;
      pending>>>=8;
      bits-=8;
    }
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
    data = encode_payload(compressed)
    restored = zlib.decompress(decode_payload(data, len(compressed))).decode().replace(MARKER, inflater)
    if restored != source:
        raise ValueError('Launcher round trip changed the game')
    return ("<!doctype html><html lang=ja><meta charset=utf-8><title>もんすたー日和</title>"
            '<script type="application/octet-stream" id="ranch-payload">' + data + '</script>'
            '<script id="ranch-inflater">' + inflater + '</script><script>(()=>{'
            + f"const GAME_APP_VERSION='{version}';const ALPHABET={json.dumps(ALPHABET.decode())};"
            + f"const PACKED_BYTES={len(compressed)};" + BOOT
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
