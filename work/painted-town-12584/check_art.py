"""Verify the completeness and ground registration of the painted town sheets."""
import hashlib
from pathlib import Path
import numpy as np
from PIL import Image
from register import ROOT, SIZES, TYPES

for name in TYPES:
    width,depth=SIZES.get(name,(2,2))
    n=64*(width+depth)
    with Image.open(ROOT/'assets/town-axis/painted'/f'{name}.webp') as sheet:
        assert sheet.size==(4*n,n),name
        views=[]
        for face in range(4):
            drawing=sheet.crop((face*n,0,(face+1)*n,n))
            views.append(hashlib.sha256(drawing.tobytes()).digest())
            alpha=np.asarray(drawing.getchannel('A'))
            y,x=np.nonzero(alpha>0)
            front=(depth if face%2 else width)*n/(width+depth)
            assert len(x)>n*n/5 and np.all(y+.5<=n-1-np.abs(x+.5-front)/2),(name,face)
        assert len(set(views))==4,name
print('15 paintings, 60 distinct views and all projected ground edges passed.')
