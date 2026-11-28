"""Encode eight compressed bytes into nine UTF-8 bytes safe inside HTML raw text."""
ASCII = tuple(chr(i) for i in range(1, 128) if i not in (13, 60))
ASCII_INDEX = {ord(c): i for i, c in enumerate(ASCII)}
ALPHABET_SIZES = (125, 1920, 61438, 1048576)
WAYS = [1]
for length in range(1, 10):
    WAYS.append(sum(count*WAYS[length-width] for width,count in enumerate(ALPHABET_SIZES,1) if width<=length))
assert WAYS[9] >= 1 << 64

def encode(data):
    output = []
    for start in range(0, len(data), 8):
        value = int.from_bytes(data[start:start+8], 'little')
        remaining = 9
        while remaining:
            for width, count in enumerate(ALPHABET_SIZES, 1):
                suffix = WAYS[remaining-width]
                if value >= count*suffix:
                    value -= count*suffix
                    continue
                digit, value = divmod(value, suffix)
                if width == 1:
                    character = ASCII[digit]
                else:
                    code = (0,0,128,2048,65536)[width]+digit
                    character = chr(code+2048 if width==3 and code>=0xd800 else code)
                output.append(character)
                remaining -= width
                break
    return ''.join(output)

def decode(encoded, length):
    output = bytearray()
    remaining = 9
    value = 0
    for c in encoded:
        code = ord(c)
        width = 1 if code<128 else 2 if code<2048 else 3 if code<65536 else 4
        digit = ASCII_INDEX[code] if width==1 else code-(0,0,128,2048,65536)[width]-(2048 if width==3 and code>=0xe000 else 0)
        for k in range(1,width):
            value += ALPHABET_SIZES[k-1]*WAYS[remaining-k]
        remaining -= width
        value += digit*WAYS[remaining]
        if not remaining:
            output.extend(value.to_bytes(8,'little'))
            value = 0
            remaining = 9
    if remaining != 9 or not length<=len(output)<length+8:
        raise ValueError('Truncated launcher payload')
    return bytes(output[:length])
