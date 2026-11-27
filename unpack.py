from pathlib import Path
import sys,re,zlib
sys.path.insert(0,'tools')
from pack_launcher_html import decode_payload,MARKER
s=Path(sys.argv[1]).read_text()
p=re.search(r'id="ranch-payload">(.*?)</script>',s,re.S)[1]
i=re.search(r'id="ranch-inflater">(.*?)</script>',s,re.S)[1]
n=int(re.search(r'PACKED_BYTES=(\d+)',s)[1])
Path(sys.argv[2]).write_text(zlib.decompress(decode_payload(p,n)).decode().replace(MARKER,i))
