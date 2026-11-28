// Town-only visual state is keyed by the actor, never serialized into a save.
// Rows follow projectGround: front-right, back-right, back-left, front-left.
const townMotionSpecies = new Map(Object.entries(__TOWN_MOTION_DATA__));
const townMotionPoses = new WeakMap();
const townMotionGait = [1, 0, 2, 0];
const townMotionStepTiles = 0.145;

function townMotionAsset(monster) {
  return townMotionSpecies.get(SPECIES[monster.kind]?.id);
}

function townMotionPose(monster) {
  let pose = townMotionPoses.get(monster);
  if (!pose) {
    pose = {x: monster.x, y: monster.y, facing: 0, travel: 0, frame: 0};
    townMotionPoses.set(monster, pose);
  }
  return pose;
}

function townTravelFacing(dx, dy, previous) {
  const alongX = dx >= 0 ? 0 : 2;
  const alongY = dy >= 0 ? 3 : 1;
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (Math.abs(ax - ay) < Math.max(ax, ay) * 0.1 && (previous === alongX || previous === alongY)) return previous;
  return ax >= ay ? alongX : alongY;
}

function finishTownMotionStep(monster, dt) {
  const pose = townMotionPose(monster);
  const dx = monster.x - pose.x, dy = monster.y - pose.y;
  const distance = Math.hypot(dx, dy);
  // Discard corrections to a legal tile or a different room.
  if (!(distance > 1e-6 && distance <= Math.max(0.16, dt * 5))) {
    pose.frame = 0;
    pose.travel = 0;
    return;
  }
  pose.facing = townTravelFacing(dx, dy, pose.facing);
  pose.travel = (pose.travel + distance) % (townMotionStepTiles * townMotionGait.length);
  pose.frame = townMotionGait[Math.floor(pose.travel / townMotionStepTiles)];
}

const stepBeforeTownMotion = stepActors;
stepActors = function(dt) {
  for (const monster of state.monsters) {
    if (!townMotionAsset(monster)) continue;
    const pose = townMotionPose(monster);
    pose.x = monster.x;
    pose.y = monster.y;
  }
  stepBeforeTownMotion(dt);
  for (const monster of state.monsters) {
    if (townMotionAsset(monster)) finishTownMotionStep(monster, dt);
  }
};

function townMotionArt(monster, asset) {
  const pose = townMotionPose(monster);
  const tile = pose.facing * 3 + (state.speed > 0 ? pose.frame : 0);
  const key = tile + (monster.shiny ? 12 : 0);
  if (!asset.textures) {
    asset.textures = new Array(24);
    asset.indices = inflateCharacter12523(Uint8Array.from(atob(asset.pixels), c => c.charCodeAt(0)));
  }
  if (asset.textures[key]) return asset.textures[key];
  const side = asset.side, palette = monster.shiny ? asset.shiny : asset.normal;
  const area = side * side, start = tile * area;
  let rgba;
  const art = pixelSprite(side, side, g => {
    const image = g.createImageData(side, side);
    rgba = image.data;
    for (let i = 0; i < area; i++) {
      const index = asset.indices[start + i];
      if (!index) continue;
      const color = palette[index], at = i * 4;
      rgba[at] = color >> 16;
      rgba[at + 1] = (color >> 8) & 255;
      rgba[at + 2] = color & 255;
      rgba[at + 3] = 255;
    }
    g.putImageData(image, 0, 0);
  });
  characterPixels12523.set(art, rgba);
  asset.textures[key] = art;
  return art;
}

// One translucent, stationary pixel outline. Its flat base is registered with
// the same ground point as the fish and it disappears over actual pond tiles.
const townWaterBubble = pixelSprite(40, 40, g => {
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
    const nx = (x - 19.5) / 19.5, ny = (y - 19.5) / 19.5;
    const r = nx * nx + ny * ny;
    if (r >= 1) continue;
    g.fillStyle = r >= .90 ? '#518fa4c9' : r >= .81 ? '#c4f5f994' : '#a5e0ed34';
    g.fillRect(x, y, 1, 1);
  }
  g.fillStyle = '#e8fcf8e8';
  g.fillRect(7, 9, 2, 3);
  g.fillRect(9, 7, 3, 2);
  g.fillRect(12, 5, 3, 2);
  g.fillStyle = '#f2ffffb8';
  g.fillRect(31, 28, 2, 3);
});
