// plotWidth and the anchor use the pixels of the original square PNG for each view.
function travelerLotRect(b, meta, facing) {
  const plot = travelerPlots[b.type];
  const [anchorX, anchorY, plotWidth] = plot.views[validFacing(facing)];
  const center = projectGround(b.x + meta.w / 2, b.y + meta.h / 2);
  const scale = (meta.w + meta.h) * T / plotWidth;
  return {x: center.x - anchorX * scale, y: center.y - anchorY * scale,
          w: plot.size * scale, h: plot.size * scale};
}

const travelerPaving = new Map();
function drawTravelerPaving(b, meta) {
  const width = (meta.w + meta.h) * T;
  let tile = travelerPaving.get(width);
  if (!tile) {
    const density = 3;
    tile = document.createElement('canvas');
    tile.width = width * density;
    tile.height = tile.width / 2;
    const g = tile.getContext('2d');
    const flags = g.createImageData(tile.width, tile.height);
    const stone = [0xaaa58a, 0xc3b89a, 0xd4c6a6, 0xcbbc9e, 0xdacdb1];
    for (let y = 0; y < tile.height; y++) {
      for (let x = 0; x < tile.width; x++) {
        const sx = (x + .5) / density - width / 2;
        const sy = (y + .5) / density;
        if (Math.abs(sx) + 2 * Math.abs(sy - width / 4) > width / 2) continue;
        const u = Math.floor((sy + sx / 2) / 2), v = Math.floor((sy - sx / 2) / 2);
        const row = Math.floor(v / 4), column = Math.floor((u + row * 3) / 8);
        const seam = v % 4 === 0 || (u + row * 3) % 8 === 0;
        const color = stone[seam ? 0 : 1 + ((column * 11 + row * 7) % 4 + 4) % 4];
        const i = 4 * (y * tile.width + x);
        flags.data[i] = color >> 16;
        flags.data[i + 1] = color >> 8 & 255;
        flags.data[i + 2] = color & 255;
        flags.data[i + 3] = 255;
      }
    }
    g.putImageData(flags, 0, 0);
    travelerPaving.set(width, tile);
  }
  const center = projectGround(b.x + meta.w / 2, b.y + meta.h / 2);
  ctx.drawImage(tile, center.x - width / 2, center.y - width / 4, width, width / 2);
}
