from pathlib import Path
import re,subprocess
from launcher_utf8_words import decode
from pack_launcher_html import unbundle_assets
b=Path('launcher-baseline.html').read_text()
raw=b.split('id="ranch-payload">',1)[1].split('</script>',1)[0]
n=int(re.search(r'const PACKED_BYTES=(\d+)',b)[1])
d=subprocess.run(['zstd','-qd'],input=decode(raw,n),capture_output=True,check=True).stdout
s=unbundle_assets(d,dictionary=True)
assert "GAME_APP_VERSION='1.25.81'" in s
Path('launcher-source-baseline.html').write_text(s)
