"""Pack one self-contained game HTML as a reversible, offline launcher document."""
import argparse
import base64
import binascii
from collections import Counter
import json
from pathlib import Path
import re
import struct
import subprocess
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


WORD_PATTERN = re.compile(r'[A-Za-z_$][A-Za-z0-9_$]{3,}')
WORD_MARKER = '\x01'

def compact_words(template):
    """Use a reversible shared dictionary beyond DEFLATE's sliding window."""
    if WORD_MARKER in template:
        raise ValueError('Ambiguous launcher dictionary marker')
    frequency = Counter(WORD_PATTERN.findall(template))
    words = sorted((word for word, count in frequency.items() if len(word) <= 80 and count > 3),
                   key=lambda word: (-(len(word)-3)*(frequency[word]-1), word))[:1200]
    codes = {word: WORD_MARKER + chr(256+i) for i, word in enumerate(words)}
    return ','.join(words) + '\n' + WORD_PATTERN.sub(lambda m: codes.get(m[0],m[0]), template)

def expand_words(packed):
    header, body = packed.split('\n', 1)
    words = header.split(',')
    return re.sub(WORD_MARKER + r'([\u0100-\u05af])', lambda m: words[ord(m[1])-256], body)

def bundle_assets(source, dictionary=False):
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
    template = re.sub(r'[A-Za-z0-9+/=]{1500,}', replace, source)
    template = (compact_words(template) if dictionary else template).encode()
    return b''.join(struct.pack('<I', len(part)) + part for part in [template, *assets])


def unbundle_assets(data, dictionary=False):
    size = struct.unpack_from('<I', data)[0]
    cursor = 4 + size
    template = data[4:cursor].decode()
    sections = (expand_words(template) if dictionary else template).split(BINARY_MARKER)
    restored = [sections[0]]
    for text in sections[1:]:
        size = struct.unpack_from('<I', data, cursor)[0]
        cursor += 4
        restored.extend((base64.b64encode(data[cursor:cursor+size]).decode('ascii'), text))
        cursor += size
    if cursor != len(data):
        raise ValueError('Invalid asset bundle')
    return ''.join(restored)


def pack(source, dense=False, binary_assets=False, dictionary=False, zstd_pack=False, wide_words=False,
         zstd_level=19, embedded_inflater=False):
    if dictionary and not binary_assets:
        raise ValueError('--word-dictionary requires --binary-assets')
    if embedded_inflater and not zstd_pack:
        raise ValueError('--embedded-inflater requires the separate Zstandard decoder')
    if binary_assets:
        source = compact_sprite_streams(source)
    version = re.search(r"GAME_APP_VERSION='([\d.]+)'", source)[1]
    start = source.index('/* Embedded, unmodified pako ')
    end = source.index('\n})();', source.index('  return module.exports.inflate;', start)) + len('\n})();')
    inflater = source[start:end]
    if MARKER in source or '</script' in inflater.lower():
        raise ValueError('Unsafe or ambiguous inflater marker')
    # The Zstandard boot can decompress the complete game, including its sprite inflater.
    stripped = source if embedded_inflater else source[:start] + MARKER + source[end:]
    payload = bundle_assets(stripped, dictionary) if binary_assets else stripped.encode()
    if zstd_pack:
        compressed = subprocess.run(['zstd', '-q', '--ultra', f'-{zstd_level}', '-c'], input=payload, capture_output=True, check=True).stdout
    else:
        compressed = dense_zlib(payload) if dense else zlib.compress(payload, 9)
    if wide_words:
        import launcher_utf8_words
        data = launcher_utf8_words.encode(compressed)
        encoded = launcher_utf8_words.decode(data, len(compressed))
    else:
        data = encode_payload(compressed)
        encoded = decode_payload(data, len(compressed))
    raw = (subprocess.run(['zstd', '-q', '-d', '-c'], input=encoded, capture_output=True, check=True).stdout
           if zstd_pack else zlib.decompress(encoded))
    restored = (unbundle_assets(raw, dictionary) if binary_assets else raw.decode()).replace(MARKER, inflater)
    boot = BOOT
    if wide_words:
        start = boot.index('  const lookup=')
        end = boot.index('  const decoded=', start)
        boot = boot[:start] + (Path(__file__).parent/'launcher_utf8_words.js').read_text() + boot[end:]
    boot = boot.replace('const decoded=new TextDecoder().decode(inflateCharacter12523(bytes));', BINARY_BOOT) if binary_assets else boot
    if dictionary:
        boot = boot.replace('const template=new TextDecoder().decode(raw.subarray(4,cursor));',
                            r"""const packedText=new TextDecoder().decode(raw.subarray(4,cursor));
  const endHeader=packedText.indexOf('\n'), words=packedText.slice(0,endHeader).split(',');
  const template=packedText.slice(endHeader+1).replace(/\x01([\u0100-\u05af])/g,(_,code)=>words[code.charCodeAt(0)-256]);""")
    if restored != source:
        raise ValueError('Launcher round trip changed the game')
    decoder = ''
    if zstd_pack:
        vendor = Path(__file__).parent / 'vendor'
        license_text = (vendor / 'fzstd-0.1.1.LICENSE').read_text()
        script = (vendor / 'fzstd-0.1.1.js').read_text()
        decoder = '<script>/* fzstd 0.1.1\n' + license_text + '\n*/\n' + script + '</script>'
        boot = boot.replace('inflateCharacter12523(bytes)', 'window.fzstd.decompress(bytes)')
    inflater_tag = '<script id="ranch-inflater">' + inflater + '</script>'
    if embedded_inflater:
        inflater_tag = ''
        boot = boot.replace("const inflateSource=document.getElementById('ranch-inflater').textContent;\n", '')
        boot = boot.replace("const html=decoded.replace('@@LAUNCHER_INFLATER_SOURCE@@',()=>inflateSource);", "const html=decoded;")
    return ("<!doctype html><html lang=ja><meta charset=utf-8><title>もんすたー日和</title>"
            '<script type="application/octet-stream" id="ranch-payload">' + data + '</script>'
            + decoder + inflater_tag + '<script>(()=>{'
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
    parser.add_argument('--word-dictionary', action='store_true', help='losslessly encode repeated game identifiers')
    parser.add_argument('--zstd', action='store_true', help='use Zstandard with the bundled offline decoder')
    parser.add_argument('--zstd-level', type=int, choices=range(1,23), default=19, help='Zstandard compression level (default: 19)')
    parser.add_argument('--wide-words', action='store_true', help='store 64-bit words in nine UTF-8 bytes')
    parser.add_argument('--embedded-inflater', action='store_true', help='compress the game sprite inflater inside a Zstandard payload')
    args = parser.parse_args()
    data = pack(args.source.read_text(), args.dense, args.binary_assets, args.word_dictionary, args.zstd,
                args.wide_words, args.zstd_level, args.embedded_inflater).encode()
    if len(data) > 4 * 1024 * 1024:
        raise SystemExit(f'Launcher exceeds 4 MiB: {len(data):,} bytes')
    args.destination.write_bytes(data)
    print(f'{len(data):,} bytes')
