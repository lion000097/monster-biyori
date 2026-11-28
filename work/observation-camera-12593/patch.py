from pathlib import Path
import re, sys
src,dst=map(Path,sys.argv[1:3])
s=src.read_bytes().decode()
for target in ("Ver.1.25.92 |","Ver.1.25.92 —","GAME_APP_VERSION='1.25.92'"):
    assert s.count(target)==1,target
    s=s.replace(target,target.replace('1.25.92','1.25.93'))
s=s.replace('コレクション実績と施設メニュー</footer>','おまかせ観察カメラの調整</footer>')
a=s.index('// Transient targets refer to live facilities.')
b=s.index("// A page's monotonic clock",a)
assert 'function manualCamera81()' in s[a:b]
s=s[:a]+Path(__file__).with_name('scene-camera.js').read_text()+s[b:]
dst.write_bytes(s.encode())
