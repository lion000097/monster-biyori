"""Add Rui's twelve town frames to a game containing the approved monster gait."""
import argparse
import base64
import json
import zlib
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent


def sheet():
    with Image.open(HERE / "rui.png") as atlas:
        if atlas.mode != "P" or atlas.size != (192, 256) or atlas.info.get("transparency") != 0:
            raise ValueError("Rui must have twelve indexed 64px frames with transparent index zero")
        frames = [atlas.crop((x, y, x + 64, y + 64)).tobytes()
                  for y in range(0, 256, 64) for x in range(0, 192, 64)]
        pixels = b"".join(frames)
        colors = bytes(atlas.getpalette())
        palette = [int.from_bytes(colors[i:i + 3], "big") for i in range(0, (1+max(pixels))*3, 3)]
        return json.dumps(dict(side=64, motion="walk", normal=palette,
                               pixels=base64.b64encode(zlib.compress(pixels, 9)).decode()), separators=(",", ":"))


def build(source, destination):
    game = source.read_bytes().decode()
    declaration = (HERE / "citizen-motion.js").read_text().replace("__RUI_SHEET__", sheet())
    before = """  for (const resident of state.staff) {
    if (!townResidentSheet(resident)) continue;
    const pose = townMotionPose(resident);
    pose.x = resident.x;
    pose.y = resident.y;
  }
  stepBeforeTownMotion(dt);
  for (const resident of state.staff) {
    if (townResidentSheet(resident)) finishTownMotionStep(resident, dt);
  }"""
    edits = {
        "const townMotionPoses = new WeakMap();": declaration + "\nconst townMotionPoses = new WeakMap();",
        "const motionAsset=monster && townMotionAsset(o);":
            "const motionAsset=monster ? townMotionAsset(o) : (resident ? townResidentSheet(o) : null);",
        "function drawMapActor(o,monster,now,star=null,origin=null)":
            "function drawMapActor(o,monster,now,star=null,origin=null,resident=(!monster && state.staff.includes(o)))",
        "drawMapActor(o,monster,now,shootingStar,origin)":
            "drawMapActor(o,monster,now,shootingStar,origin,source===state.staff)",
        "  stepBeforeTownMotion(dt);": before,
    }
    for old, new in edits.items():
        if game.count(old) != 1:
            raise ValueError("Expected one town integration point: " + old)
        game = game.replace(old, new, 1)
    destination.write_bytes(game.encode())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    build(args.source, args.destination)
