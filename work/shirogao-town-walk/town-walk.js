// Shirogao's street poses. The original portrait, combat art and bathing scene
// use their own renderers. Rows are front-right, back-right, back-left, front-left.
const shirogaoTownPoses = new WeakMap();
const shirogaoTownTextures = new Map();
const shirogaoGait = [1, 0, 2, 0];
const shirogaoStepTiles = 0.145;
const shirogaoTownPalette = __SHIROGAO_PALETTE__;
const shirogaoTownData = '__SHIROGAO_PIXELS__';
let shirogaoTownPixels;

function shirogaoTownPose(monster) {
  let pose = shirogaoTownPoses.get(monster);
  if (!pose) {
    pose = { x: monster.x, y: monster.y, facing: 0, travel: 0, frame: 0 };
    shirogaoTownPoses.set(monster, pose);
  }
  return pose;
}

function shirogaoTravelFacing(dx, dy, last) {
  // projectGround maps +x to screen front-right and +y to front-left.
  const alongX = dx >= 0 ? 0 : 2;
  const alongY = dy >= 0 ? 3 : 1;
  const ax = Math.abs(dx), ay = Math.abs(dy);
  // Stay with the previous facing near a diagonal tie on free-moving courtyards.
  if (Math.abs(ax - ay) < Math.max(ax, ay) * 0.1 && (last === alongX || last === alongY)) return last;
  return ax >= ay ? alongX : alongY;
}

function finishShirogaoStep(monster, dt) {
  const p = shirogaoTownPose(monster);
  const dx = monster.x - p.x, dy = monster.y - p.y;
  const distance = Math.hypot(dx, dy);
  // Repositioning into a valid tile or an indoor scene is not a footstep.
  if (!(distance > 1e-6 && distance <= Math.max(0.16, dt * 5))) {
    p.travel = 0;
    p.frame = 0;
    return;
  }
  p.facing = shirogaoTravelFacing(dx, dy, p.facing);
  p.travel = (p.travel + distance) % (shirogaoStepTiles * shirogaoGait.length);
  p.frame = shirogaoGait[Math.floor(p.travel / shirogaoStepTiles)];
}

// Sample the authoritative simulation, including facility paths and each fast-
// forward substep. Repainting, camera motion and old saves need no special data.
const stepBeforeShirogaoWalk = stepActors;
stepActors = function(dt) {
  for (const m of state.monsters) {
    if (m.kind !== shirogaoKind) continue;
    const p = shirogaoTownPose(m);
    p.x = m.x;
    p.y = m.y;
  }
  stepBeforeShirogaoWalk(dt);
  for (const m of state.monsters) {
    if (m.kind === shirogaoKind) finishShirogaoStep(m, dt);
  }
};

function shirogaoTownArt(monster) {
  const p = shirogaoTownPose(monster);
  const frame = state.speed > 0 ? p.frame : 0;
  const tile = p.facing * 3 + frame;
  const key = tile + (monster.shiny ? 12 : 0);
  let art = shirogaoTownTextures.get(key);
  if (art) return art;
  if (!shirogaoTownPixels) {
    shirogaoTownPixels = inflateCharacter12523(Uint8Array.from(atob(shirogaoTownData), c => c.charCodeAt(0)));
  }
  let rgba;
  art = pixelSprite(64, 64, g => {
    const image = g.createImageData(64, 64);
    rgba = image.data;
    const start = tile * 64 * 64;
    for (let i = 0; i < 64 * 64; i++) {
      const index = shirogaoTownPixels[start + i];
      if (!index) continue;
      const color = shirogaoTownPalette[index];
      let red = color >> 16, blue = color & 255;
      // The same channel swap as the existing normal / shiny lion portrait.
      if (monster.shiny && blue - red >= 24) [red, blue] = [blue, red];
      const at = 4 * i;
      rgba[at] = red;
      rgba[at + 1] = (color >> 8) & 255;
      rgba[at + 2] = blue;
      rgba[at + 3] = 255;
    }
    g.putImageData(image, 0, 0);
  });
  characterPixels12523.set(art, rgba);
  shirogaoTownTextures.set(key, art);
  return art;
}
