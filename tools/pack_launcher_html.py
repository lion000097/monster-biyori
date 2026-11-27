"""Pack one self-contained game HTML as a reversible, offline launcher document."""
import argparse
import base64
import binascii
import json
from pathlib import Path
import re
import struct
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
def dense_zlib(data):
    # libdeflate's level 12 emits an ordinary zlib stream for the existing launcher.
    import ctypes
    from ctypes.util import find_library

    name = find_library('deflate')
    if not name:
        raise RuntimeError('--dense requires libdeflate (libdeflate0 on Debian/Ubuntu)')
    lib = ctypes.CDLL(name)
    pointer = ctypes.c_void_p
    size = ctypes.c_size_t
    lib.libdeflate_alloc_compressor.argtypes = [ctypes.c_int]
    lib.libdeflate_alloc_compressor.restype = pointer
    lib.libdeflate_free_compressor.argtypes = [pointer]
    lib.libdeflate_free_compressor.restype = None
    lib.libdeflate_zlib_compress_bound.argtypes = [pointer, size]
    lib.libdeflate_zlib_compress_bound.restype = size
    lib.libdeflate_zlib_compress.argtypes = [pointer, pointer, size, pointer, size]
    lib.libdeflate_zlib_compress.restype = size
    compressor = lib.libdeflate_alloc_compressor(12)
    if not compressor:
        raise MemoryError('Could not allocate launcher compressor')
    try:
        out = ctypes.create_string_buffer(lib.libdeflate_zlib_compress_bound(compressor, len(data)))
        length = lib.libdeflate_zlib_compress(compressor, data, len(data), out, len(out))
        if not length:
            raise ValueError('Launcher compression failed')
        return out.raw[:length]
    finally:
        lib.libdeflate_free_compressor(compressor)


BINARY_MARKER = '@@RANCH_BINARY@@'
BINARY_BOOT = """
  const raw=inflateCharacter12523(bytes),view=new DataView(raw.buffer,raw.byteOffset,raw.byteLength);
  let cursor=4+view.getUint32(0,true);
  const template=new TextDecoder().decode(raw.subarray(4,cursor));
  const decoded=template.replace(/@@RANCH_BINARY@@/g,()=>{
    const length=view.getUint32(cursor,true);cursor+=4;
    const end=cursor+length,parts=[];
    if(end>raw.length)throw Error('Truncated launcher asset');
    // Only the final chunk can contain base64 padding.
    for(let i=cursor;i<end;i+=24576)
      parts.push(btoa(String.fromCharCode(...raw.subarray(i,Math.min(i+24576,end)))));
    cursor=end;
    return parts.join('');
  });
  if(cursor!==raw.length)throw Error('Unexpected launcher asset length');
"""


def compact_sprite_streams(source):
    """Re-encode just the two native indexed atlases; compare their pixel bytes."""
    def replace(match):
        bank = json.loads(match[2])
        for item in bank.values():
            old = base64.b64decode(item[2], validate=True)
            pixels = zlib.decompress(old)
            packed = dense_zlib(pixels)
            if len(packed) < len(old):
                if zlib.decompress(packed) != pixels:
                    raise ValueError('Native sprite pixels changed')
                item[2] = base64.b64encode(packed).decode('ascii')
        return match[1] + json.dumps(bank, ensure_ascii=False, separators=(',', ':')) + ';'
    return re.sub(r'^(const (?:townAtlases|treeCrownAtlases)=)(.+);$', replace, source, flags=re.M)


def bundle_assets(source):
    if BINARY_MARKER in source:
        raise ValueError('Ambiguous binary marker')
    assets = []
    def replace(match):
        encoded = match[0]
        try:
            raw = base64.b64decode(encoded, validate=True)
        except (ValueError, binascii.Error):
            return encoded
        if base64.b64encode(raw).decode('ascii') != encoded:
            return encoded
        assets.append(raw)
        return BINARY_MARKER
    template = re.sub(r'[A-Za-z0-9+/=]{1500,}', replace, source).encode()
    return b''.join(struct.pack('<I', len(part)) + part for part in [template, *assets])


def unbundle_assets(data):
    size = struct.unpack_from('<I', data)[0]
    cursor = 4 + size
    sections = data[4:cursor].decode().split(BINARY_MARKER)
    restored = [sections[0]]
    for text in sections[1:]:
        size = struct.unpack_from('<I', data, cursor)[0]
        cursor += 4
        restored.extend((base64.b64encode(data[cursor:cursor+size]).decode('ascii'), text))
        cursor += size
    if cursor != len(data):
        raise ValueError('Invalid asset bundle')
    return ''.join(restored)


def pack(source, dense=False, binary_assets=False):
    if binary_assets:
        source = compact_sprite_streams(source)
    version = re.search(r"GAME_APP_VERSION='([\d.]+)'", source)[1]
    start = source.index('/* Embedded, unmodified pako ')
    end = source.index('\n})();', source.index('  return module.exports.inflate;', start)) + len('\n})();')
    inflater = source[start:end]
    if MARKER in source or '</script' in inflater.lower():
        raise ValueError('Unsafe or ambiguous inflater marker')
    stripped = source[:start] + MARKER + source[end:]
    payload = bundle_assets(stripped) if binary_assets else stripped.encode()
    compressed = dense_zlib(payload) if dense else zlib.compress(payload, 9)
    data = encode_payload(compressed)
    raw = zlib.decompress(decode_payload(data, len(compressed)))
    restored = (unbundle_assets(raw) if binary_assets else raw.decode()).replace(MARKER, inflater)
    boot = BOOT.replace('const decoded=new TextDecoder().decode(inflateCharacter12523(bytes));', BINARY_BOOT) if binary_assets else BOOT
    if restored != source:
        raise ValueError('Launcher round trip changed the game')
    return ("<!doctype html><html lang=ja><meta charset=utf-8><title>もんすたー日和</title>"
            '<script type="application/octet-stream" id="ranch-payload">' + data + '</script>'
            '<script id="ranch-inflater">' + inflater + '</script><script>(()=>{'
            + f"const GAME_APP_VERSION='{version}';const ALPHABET={json.dumps(ALPHABET)};"
            + f"const PACKED_BYTES={len(compressed)};" + boot
            + '})();</script></html>')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    parser.add_argument('--dense', action='store_true', help='use libdeflate level 12 for a smaller offline HTML')
    parser.add_argument('--binary-assets', action='store_true',
                        help='store embedded base64 data as binary and recompress native pixel streams')
    args = parser.parse_args()
    data = pack(args.source.read_text(), args.dense, args.binary_assets).encode()
    if len(data) > 4 * 1024 * 1024:
        raise SystemExit(f'Launcher exceeds 4 MiB: {len(data):,} bytes')
    args.destination.write_bytes(data)
    print(f'{len(data):,} bytes')
