"""Prepare the self-contained colour preview and the original-size silhouette for each painting."""
import io, json, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt
here=Path(__file__).resolve().parent
art=here.parents[1]/'assets/town-axis/painted'
dest=here/'launcher'
dest.mkdir(exist_ok=True)
quality=int(sys.argv[1]) if len(sys.argv)>1 else 45
def prepare(key):
    with Image.open(art/(key+'.png')) as source:
        master=source.convert('RGBA')
    n=master.height
    rgba=np.array(master)
    a=rgba[:,:,3]
    quant=(np.rint(a.astype('float32')*7/255)*255/7).round().astype('uint8')
    quant[(a>0)&(quant==0)]=6
    assert np.array_equal(a>0,quant>0) and np.array_equal(a>=128,quant>=128)
    mask=Image.new('RGBA',master.size,'black')
    mask.putalpha(Image.fromarray(quant))
    maskfile=dest/(key+'-mask.webp');mask.save(maskfile,lossless=True,exact=True,method=6)
    check=Image.open(maskfile).convert('RGBA').getchannel('A')
    assert check.tobytes()==quant.tobytes()
    size=n//4
    colors=Image.new('RGB',(size*4,size))
    for f in range(4):
        frame=rgba[:,f*n:(f+1)*n];valid=frame[:,:,3]>=96
        dist,idx=distance_transform_edt(~valid,return_indices=True)
        extended=frame[:,:,:3][tuple(idx)].copy()
        extended[dist>14]=[112,91,72]
        colors.paste(Image.fromarray(extended).resize((size,size),Image.Resampling.LANCZOS),(f*size,0))
    pic=dest/(key+'-color.webp');colors.save(pic,quality=quality,method=6)
    print(key,maskfile.stat().st_size,pic.stat().st_size,flush=True)
with ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(prepare,json.loads((here/'frames.json').read_text())))
