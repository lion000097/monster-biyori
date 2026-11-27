"""Import the approved five-by-two treasure sheet into native transparent 64px cells."""
import argparse
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage


def native_cell(image):
    rgb = np.asarray(image).astype(np.int16)
    light = rgb.min(axis=2)
    chroma = rgb.max(axis=2) - light
    # Art is outlined; exclude the soft off-white cast shadows around each icon.
    ink = (light < 183) | ((chroma > 35) & (light < 228))
    close_to_ink = ndimage.distance_transform_edt(~ink) <= 4
    mask = ((light < 234) | (chroma > 19)) & close_to_ink
    mask = ndimage.binary_closing(mask, structure=np.ones((3, 3), dtype=bool))
    components, _ = ndimage.label(mask, structure=np.ones((3, 3), dtype=bool))
    areas = np.bincount(components.ravel())
    mask = (components != 0) & (areas[components] >= 15)
    # Keep pale gems opaque. Larger openings in a ring, crown or chime are see-through.
    holes, _ = ndimage.label(~mask)
    hole_sizes = np.bincount(holes.ravel())
    mask |= (holes != 0) & (hole_sizes[holes] < 120)
    rgba = image.convert('RGBA')
    rgba.putalpha(Image.fromarray(mask.astype('uint8') * 255))
    cropped = rgba.crop(rgba.getbbox())
    ratio = 56 / max(cropped.size)
    size = tuple(max(1, round(v * ratio)) for v in cropped.size)
    small = cropped.resize(size, Image.Resampling.LANCZOS)
    alpha = np.asarray(small.getchannel('A')) >= 124
    # Reduce only the opaque colors. Transparent pixels cannot consume palette slots.
    colors = np.asarray(small.convert('RGB'))[alpha]
    strip = Image.fromarray(colors.reshape((1, -1, 3))).quantize(48, method=Image.Quantize.MEDIANCUT,
                                                                  dither=Image.Dither.NONE).convert('RGB')
    pixels = np.zeros((size[1], size[0], 4), dtype=np.uint8)
    pixels[alpha, :3] = np.asarray(strip)[0]
    pixels[alpha, 3] = 255
    cell = Image.new('RGBA', (64, 64))
    cell.paste(Image.fromarray(pixels), ((64 - size[0]) // 2, (64 - size[1]) // 2))
    return cell


def main(source, destination):
    image = Image.open(source).convert('RGB')
    atlas = Image.new('RGBA', (5 * 64, 2 * 64))
    for row in range(2):
        for column in range(5):
            bounds = (round(column * image.width / 5), round(row * image.height / 2),
                      round((column + 1) * image.width / 5), round((row + 1) * image.height / 2))
            icon = native_cell(image.crop(bounds))
            atlas.paste(icon, (64 * column, 64 * row))
    atlas.save(destination, optimize=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    main(args.source, args.destination)
