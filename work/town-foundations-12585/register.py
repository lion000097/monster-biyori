"""Fit the illustrated bases to the ground projection; never count a paved tile as support."""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image
import seating
from scipy.ndimage import gaussian_filter1d, map_coordinates, maximum_filter1d, median_filter

ROOT = Path(__file__).resolve().parents[2]
CONTACTS = json.loads(Path(__file__).with_name('contacts.json').read_text())
SUPPORTS = json.loads(Path(__file__).with_name('supports.json').read_text())


def silhouette(image):
    alpha = np.asarray(image.getchannel('A'))
    return np.where(alpha > 127, np.arange(image.height)[:, None] + .5, 0).max(axis=0)


def geometry(image, anchors, size):
    """Return inverse sample coordinates; the three landmarks are left, near and right."""
    w, h = image.size
    left, front, right = np.array(anchors) * w / 100
    # Reserve room for the sign or roof projecting beyond the base at either end.
    contact_x = np.array([left, front, right])
    contact_y = np.interp(contact_x, np.arange(w)+.5,
                          median_filter(silhouette(image), size=3))
    x = np.arange(size) + .5
    # A shop with a recessed side wing is a rectangle inside its square lot.
    # Fit its two visible returns separately and keep the side wall's windows
    # and wheels proportional. Ground coordinates (u,v) span 0..1 on each axis.
    lengths = np.array([front-left, right-front])
    spans = (lengths/max(lengths))**.38
    # Constrain the actual overhang, including the hanging sign on the short side.
    left_extent = -.21*(spans[0]-spans[1]) + spans[0]*.5*(1+left/lengths[0])
    right_extent = .21*(spans[0]-spans[1]) + spans[1]*.5*(1+(w-right)/lengths[1])
    spans *= min(.965,.491/left_extent,.491/right_extent)
    u1, v1 = spans + .58*(1-spans)
    corner_x = (.5 + (u1-v1)/2)*size
    corner_y = (.5 + (u1+v1)/4)*size
    sx = np.where(x < corner_x, front+(x-corner_x)*(front-left)/(.5*spans[0]*size),
                  front+(x-corner_x)*(right-front)/(.5*spans[1]*size))
    floor = np.interp(sx, contact_x, contact_y)
    for pick, a, b in [(sx<left, 0, 1), (sx>right, 1, 2)]:
        floor[pick] = contact_y[a] + (sx[pick]-contact_x[a]) * (
            contact_y[b]-contact_y[a]) / (contact_x[b]-contact_x[a])
    far = size/2 + abs(x-size/2)/2
    near = size - abs(x-size/2)/2
    target = corner_y - abs(x-corner_x)/2
    # Keep the sill, crates and steps in relief. Only curb local deviations that
    # would put real supports outside the far or near edge. Suspended signs keep
    # their original height relative to their wall.
    bottom = np.interp(sx, np.arange(w)+.5, gaussian_filter1d(silhouette(image), .9))
    scale = min(.93, .93*h/w)*size/h
    contact = (sx>=left) & (sx<=right) & (bottom>h*.72)
    normal = target + scale*(bottom-floor)
    padding = np.minimum(3.2, (near-far)*.30)
    adjust = np.clip(normal, far+padding, near-padding)-normal
    target += gaussian_filter1d(np.where(contact, adjust, 0.), 1.1)
    # A rounded stone corner can be just one source column wide. Preserve the
    # corner itself while moving its support inside the front edge.
    local_max = np.interp(sx, np.arange(w)+.5, maximum_filter1d(silhouette(image), 3))
    excess = target + scale*(local_max-floor) - (near-2.5)
    target -= maximum_filter1d(np.maximum(excess,0.), 3)
    # Warp the lower walls gently while preserving the roof elevation, the
    # vertical timber lines and the original shading of the source painting.
    top = max(.021*size, max(target)-.013*size-scale*contact_y[1])
    y = np.arange(size)[:,None]+.5
    progress = np.clip(((y-top)/(target-top)-.38)/.62, 0, 1)
    blend = progress**2*(3-2*progress)
    sy = (y-top-blend*(target-top-scale*floor))/scale
    return sx, sy


def register(image, anchors, size):
    sx, sy = geometry(image, anchors, size)
    # Premultiplied colour avoids pale fringes on dark roads at night.
    premultiplied = np.asarray(image.convert('RGBa'), dtype=np.float32)
    indices = np.stack((sy-.5, np.broadcast_to(sx-.5,sy.shape)))
    data = np.stack([map_coordinates(premultiplied[:,:,i], indices, order=1,
                                     mode='constant', cval=0, prefilter=False)
                     for i in range(4)], axis=2)
    return Image.fromarray(data.clip(0,255).astype('uint8'),'RGBa').convert('RGBA')


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--sources',type=Path,default=Path(__file__).with_name('masters'),
                    help='Lossless sheets containing four trimmed paintings in equal cells')
    ap.add_argument('--only',nargs='+',choices=[*CONTACTS,*SUPPORTS])
    ap.add_argument('--output',type=Path,default=ROOT/'assets/town-axis/painted')
    args=ap.parse_args()
    args.output.mkdir(exist_ok=True,parents=True)
    for key in args.only or [*CONTACTS,*SUPPORTS]:
        n=384 if key in ('starTerrace','guild212') else 256
        sheet=Image.new('RGBA',(n*4,n))
        with Image.open(args.sources/f'{key}.webp') as master:
            cell = master.width//4
            frames=[master.crop((face*cell,0,(face+1)*cell,master.height)) for face in range(4)]
            if key in CONTACTS:
                views=[register(frame.crop(frame.getchannel('A').getbbox()),anchors,n)
                       for frame,anchors in zip(frames,CONTACTS[key])]
            else:
                placements=seating.fit(frames,SUPPORTS[key])
                views=[seating.apply(frame,placement) for frame,placement in zip(frames,placements)]
            for face, view in enumerate(views):
                sheet.paste(view,(face*n,0))
        sheet.save(args.output/f'{key}.webp', lossless=True, method=6, exact=True)

if __name__=='__main__':
    main()
