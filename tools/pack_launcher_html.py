"""Pack one self-contained game HTML as a reversible, offline launcher document."""
import argparse
import json
from pathlib import Path
import re
import zlib

# Every 27-bit word occupies exactly four UTF-8 bytes in an HTML raw-text node.
# Most words need four ASCII characters. The rest use one two-byte character
# at one of three positions and two ASCII digits. Avoid '<', CR and NUL.
ALPHABET = "\t\n" + ''.join(chr(c) for c in range(32, 127) if c != ord('<'))
RADIX = len(ALPHABET)  # 96
ASCII_WORDS = RADIX ** 4
UNICODE_START = 0xA0

def encode_word(word):
    if word < ASCII_WORDS:
        digits = []
        for _ in range(4):
            word, digit = divmod(word, RADIX)
            digits.append(ALPHABET[digit])
        return ''.join(reversed(digits))
    group, pair = divmod(word - ASCII_WORDS, RADIX ** 2)
    letter, position = divmod(group, 3)
    high, low = divmod(pair, RADIX)
    digits = [ALPHABET[high], ALPHABET[low]]
    digits.insert(position, chr(UNICODE_START + letter))
    return ''.join(digits)

def encode_payload(data):
    words = []
    pending = bits = 0
    for byte in data:
        pending |= byte << bits
        bits += 8
        if bits >= 27:
            words.append(encode_word(pending & ((1 << 27) - 1)))
            pending >>= 27
            bits -= 27
    if bits:
        words.append(encode_word(pending))
    return ''.join(words)

def decode_payload(text, length):
    values = {c: i for i, c in enumerate(ALPHABET)}
    pos = pending = bits = 0
    output = bytearray()
    while pos < len(text):
        word = group = 0
        for digit in range(4):
            char = text[pos]
            pos += 1
            if ord(char) >= UNICODE_START:
                group = ASCII_WORDS + ((ord(char) - UNICODE_START) * 3 + digit) * RADIX ** 2
            else:
                word = word * RADIX + values[char]
            if group and digit == 2:
                break
        pending |= (group + word) << bits
        bits += 27
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
  for(let pos=0;pos<payload.length;){
    let word=0, group=0;
    for(let digit=0;digit<4;digit++){
      const c=payload.charCodeAt(pos++);
      if(c>=160)group=96**4+((c-160)*3+digit)*96**2;
      else word=word*96+lookup[c];
      if(group && digit===2)break;
    }
    // A word plus up to seven carry bits exceeds JavaScript's bitwise width.
    pending+=(group+word)*2**bits;
    bits+=27;
    while(bits>=8 && out<bytes.length){
      bytes[out++]=pending%256;
      pending=Math.floor(pending/256);
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
            + f"const GAME_APP_VERSION='{version}';const ALPHABET={json.dumps(ALPHABET)};"
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
