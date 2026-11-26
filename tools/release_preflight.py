"""Validate the game, updater manifest and ZIP before publishing.

Directory check: python tools/release_preflight.py --root .
Git check: python tools/release_preflight.py --commit HEAD
Guarded publication: python tools/release_preflight.py --commit HEAD --push origin
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import sys
from zipfile import ZipFile, BadZipFile

MAX_BYTES = 4 * 1024 * 1024
PAGES = 'https://lion000097.github.io/monster-biyori'
PATTERN = r'\d+\.\d+\.\d+'

def require(ok, message):
    if not ok:
        raise ValueError(message)

def check(read):
    manifest = json.loads(read('latest.json'))
    require(isinstance(manifest,dict),'latest.json is not an object')
    version = manifest.get('version')
    require(isinstance(version,str) and re.fullmatch(PATTERN,version),'invalid latest.json version')
    require(manifest.get('min_launcher_version') == '1.1.0','launcher 1.1.0 compatibility must be kept')
    release = f'releases/{version}'
    require(manifest.get('html_url') == f'{PAGES}/{release}/launcher-game.html','unexpected launcher update URL')
    compact = read(f'{release}/launcher-game.html')
    require(0 < len(compact) <= MAX_BYTES,
            f'launcher HTML: {len(compact):,} bytes; limit {MAX_BYTES:,} bytes')
    digest = hashlib.sha256(compact).hexdigest()
    require(manifest.get('sha256') == digest,'launcher HTML SHA-256 differs from latest.json')
    web = read('game.html')
    require(web == read(f'{release}/game.html'),'root and versioned game.html differ')
    token = f"GAME_APP_VERSION='{version}'".encode('ascii')
    require(token in web and token in compact,'game HTML version does not match latest.json')
    with ZipFile(io.BytesIO(read(f'{release}/monster-biyori-{version}.zip'))) as z:
        names = z.namelist()
        require(len(set(names)) == len(names),'duplicate ZIP entries')
        require(z.read('game.html') == compact,'ZIP game.html differs from the launcher HTML')
        corrupt = z.testzip()
        require(corrupt is None,f'ZIP entry failed CRC: {corrupt}')
    return version,len(compact),digest

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--root',type=Path)
    mode.add_argument('--commit')
    parser.add_argument('--push',metavar='REMOTE',help='after passing, publish the verified commit to main')
    args = parser.parse_args()
    if args.push and (not args.commit or args.push.startswith('-')):
        parser.error('--push requires a commit and a remote name')
    try:
        if args.commit:
            # Resolve the ref once so a concurrent local checkout or commit does not change the published revision.
            commit = subprocess.check_output(['git','rev-parse','--verify','--end-of-options',args.commit+'^{commit}'],text=True).strip()
            read=lambda name:subprocess.check_output(['git','show',f'{commit}:{name}'])
        else:
            read=lambda name:(args.root/name).read_bytes()
        version,size,digest=check(read)
        print(f'PASS {version}: launcher {size:,} / {MAX_BYTES:,} bytes; SHA-256 {digest}',flush=True)
        if args.push:
            subprocess.run(['git','push',args.push,f'{commit}:refs/heads/main'],check=True)
        return 0
    except (OSError, ValueError, KeyError, TypeError, BadZipFile, subprocess.CalledProcessError) as error:
        print(f'RELEASE BLOCKED: {error}',file=sys.stderr)
        return 1

if __name__=='__main__':
    sys.exit(main())
