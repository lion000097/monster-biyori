"""Seat intact illustrated facilities on the ground using their real supporting edges."""
import numpy as np
from PIL import Image


def fit(views, supports):
    """Use one scale in all four orientations, preserving rails, legs and curved steps."""
    fits=[]
    scales=[1.]
    for image, spans in zip(views,supports):
        size=image.height
        alpha=np.asarray(image.getchannel('A'))
        bottom=np.where(alpha>127,np.arange(size)[:,None]+.5,0).max(axis=0)
        cols=np.concatenate([np.arange(start,end+1) for start,end in spans])
        x=(cols+.5)/size
        y=bottom[cols]/size
        # Inverse of the game's two ground axes. The plot spans 0..1 in u and v.
        u=2*y-1+x-.5
        v=2*y-1-x+.5
        um=(u.min()+u.max())/2
        vm=(v.min()+v.max())/2
        anchor_x=.5+(um-vm)/2
        anchor_y=.5+(um+vm)/4
        y_ink,x_ink=np.nonzero(alpha>0)
        x_ink=(x_ink+.5)/size
        y_ink=(y_ink+.5)/size
        scales.extend((.968/np.ptp(u),.968/np.ptp(v),
                       .495/max(abs(x_ink-anchor_x)),.745/(anchor_y-y_ink.min()),
                       .248/(y_ink.max()-anchor_y)))
        fits.append((anchor_x,anchor_y))
    scale=min(scales)
    return [(scale,.5-scale*x,.75-scale*y) for x,y in fits]


def apply(image, placement):
    scale,dx,dy=placement
    size=image.height
    if abs(scale-1)+abs(dx)+abs(dy)<1e-9:
        return image.copy()
    inverse=(1/scale,0,-dx*size/scale,0,1/scale,-dy*size/scale)
    return image.convert('RGBa').transform(image.size,Image.Transform.AFFINE,inverse,
                                            Image.Resampling.BICUBIC).convert('RGBA')
