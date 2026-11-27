"""Draw the adventure panoramas and sprites at the game's native pixel size.

Run with Pillow: python3 tools/draw_adventure_art.py path/to/adventure-atlas.png
The PNG is embedded in both HTML editions so they can run offline.
"""
import argparse
from pathlib import Path
from random import Random

from PIL import Image, ImageDraw

WIDTH, HEIGHT = 608, 106

# Sky (high / low), distant ridge (light / shade), and ground (grass / shade / trail / light).
# Areas 1–10 follow the adventure menu; the final row is Yuguru's sanctuary.
LANDSCAPES = [
    ('#aad7df', '#dfedce', '#a2cbb0', '#83af90', '#a7b96d', '#819853', '#e2bf88', '#f0d6a0'),
    ('#85b1ab', '#c8d7ab', '#8bad92', '#638e77', '#82985d', '#5d7f53', '#bca17a', '#d7bc92'),
    ('#dda58e', '#f5d8aa', '#c78d78', '#a76a5e', '#b78864', '#976955', '#d4ad83', '#e8c599'),
    ('#b6ccc3', '#e6dfb3', '#a8b6a0', '#859886', '#a5a36e', '#838457', '#c8b08a', '#dfcb9f'),
    ('#9ac1dc', '#edf3e5', '#ccdee5', '#a0b9cf', '#dfe8dd', '#b0c5ce', '#ccd9dc', '#ecf0e5'),
    ('#5ca6b3', '#b9dad0', '#87c5bc', '#63aca9', '#8ab2a4', '#679f9c', '#c0ccb0', '#d9dec0'),
    ('#bccbaa', '#f3dd9c', '#bfbd80', '#a4a06a', '#b5a762', '#8c8a50', '#dcb286', '#f1cb95'),
    ('#9799bd', '#d9d4df', '#a3a6be', '#808aa2', '#a09e9f', '#767e94', '#bcb2b0', '#d5cbcf'),
    ('#6f82a9', '#b4bec8', '#a1aebc', '#7e9aab', '#849e8f', '#6b8890', '#b5b4a1', '#d3cdb0'),
    ('#666b9a', '#aeb4c6', '#8b96b0', '#737d9f', '#909aa0', '#6f7891', '#b5aba7', '#cfc5bf'),
    ('#8fb6ad', '#e5ddb0', '#a3bda1', '#7da18d', '#97a865', '#6c8b5d', '#cbb284', '#e5ce99'),
]
# The second atlas contains only the five later areas, so existing panorama
# coordinates and the raid props retain their original positions.
FRONTIER_LANDSCAPES = [
    ('#a6d1de', '#fff0c9', '#b8cba5', '#98b18b', '#a6b875', '#799767', '#ddc494', '#efd7a3'),
    ('#88c9db', '#f9e2b1', '#93baba', '#66a5ab', '#a9bb93', '#6e9f92', '#d7c9a3', '#efe3bc'),
    ('#514359', '#a17b75', '#80677b', '#66586f', '#9a807c', '#6f636a', '#b3957d', '#d2b292'),
    ('#9baecd', '#f0e1da', '#b4c0d0', '#879caf', '#ccdad7', '#95afb5', '#d5d9d2', '#f3ece0'),
    ('#c7abcf', '#ffdfae', '#c5b0b6', '#a998ab', '#a8b58c', '#829b82', '#d9c4a4', '#f4ddb4'),
]
LEAVES = ('#496e57', '#6e945b', '#91ad66', '#b7c777')
FOREST = ('#3d675c', '#507e64', '#71a16f', '#98b47b')
AMBER = ('#8a623d', '#b28040', '#d0a34c', '#e3be6a')
TREE = ('#52795a', '#76985d', '#a1b86f', '#c9cb7b')
STONE = ('#667669', '#889180', '#adb19a', '#d3cdb0')
ICE = ('#7799b6', '#9dbccc', '#cadde2', '#f3f3e5')


def polygon(draw, x, y, points, color, scale=1):
    draw.polygon([(x + round(dx * scale), y + round(dy * scale)) for dx, dy in points], fill=color)


def ridge(draw, points, color):
    draw.polygon([*points, (WIDTH - 1, HEIGHT - 1), (0, HEIGHT - 1)], fill=color)


def rolling_hills(draw, anchors, color):
    points = []
    for (x, y), (end_x, end_y) in zip(anchors, anchors[1:]):
        for px in range(x, end_x, 3):
            t = (px - x) / (end_x - x)
            points.append((px, round(y + (end_y - y) * t * t * (3 - 2 * t))))
    ridge(draw, [*points, anchors[-1]], color)


def cloud(draw, x, y, scale, high, low):
    polygon(draw, x, y, [(0, 8), (8, 8), (8, 5), (16, 5), (16, 2), (23, 2),
                         (23, 0), (38, 0), (38, 2), (49, 2), (49, 5), (57, 5),
                         (57, 8), (69, 8), (69, 10), (0, 10)], low, scale)
    polygon(draw, x, y, [(9, 7), (16, 7), (16, 4), (24, 4), (24, 1), (37, 1),
                         (37, 3), (48, 3), (48, 6), (56, 6), (56, 8), (9, 8)], high, scale)


def broadleaf(draw, x, y, scale, colors=LEAVES):
    dark, shade, base, light = colors
    def paint(color, points):
        polygon(draw, x, y, points, color, scale)

    paint('#645943', [(-7, 0), (-4, -4), (-3, -16), (-10, -25), (-7, -27),
                      (-2, -21), (4, -22), (9, -29), (12, -27), (5, -16),
                      (5, -5), (9, 0), (4, 1), (0, -1), (-5, 1)])
    paint('#9b7951', [(-4, -1), (-1, -7), (0, -24), (3, -22), (2, -6), (3, -2)])
    paint(dark, [(-21, -27), (-20, -33), (-16, -35), (-14, -40), (-8, -41),
                 (-5, -45), (3, -46), (9, -43), (16, -42), (19, -37),
                 (23, -33), (23, -28), (19, -23), (14, -22), (12, -18),
                 (4, -17), (0, -20), (-5, -19), (-9, -21), (-16, -21)])
    paint(shade, [(-19, -30), (-15, -35), (-10, -38), (1, -43), (11, -41),
                  (20, -35), (21, -29), (16, -25), (10, -24), (10, -20),
                  (4, -19), (-1, -23), (-11, -22), (-14, -26), (-19, -26)])
    paint(base, [(-17, -31), (-12, -37), (-7, -38), (-4, -43), (4, -44),
                 (10, -40), (16, -39), (19, -35), (14, -32), (14, -29),
                 (7, -27), (3, -30), (0, -26), (-6, -29), (-11, -27), (-15, -28)])
    paint(light, [(-9, -37), (-4, -40), (0, -42), (5, -41), (10, -38),
                  (5, -38), (1, -36), (-2, -37), (-5, -34), (-9, -34)])
    paint(light, [(-15, -33), (-11, -34), (-9, -32), (-14, -31)])
    paint(shade, [(10, -35), (15, -36), (18, -34), (15, -33)])


def pine(draw, x, y, size, colors=FOREST, snowy=False):
    dark, shade, base, light = colors
    polygon(draw, x, y, [(-2, 0), (-2, -13), (2, -13), (3, 0)], '#726654', size)
    for bottom, spread, top in [(-5, 14, -26), (-13, 11, -33), (-21, 8, -41)]:
        polygon(draw, x, y, [(0, top), (-3, top + 8), (-spread, bottom - 3),
                             (-spread, bottom), (-6, bottom - 1), (0, bottom + 2),
                             (7, bottom), (spread, bottom - 1), (5, top + 9), (2, top + 3)], dark, size)
        polygon(draw, x, y, [(0, top + 2), (-4, top + 10), (-spread + 2, bottom - 2),
                             (-5, bottom - 3), (0, bottom - 1), (5, bottom - 4),
                             (spread - 2, bottom - 3), (3, top + 9)], shade, size)
        polygon(draw, x, y, [(0, top + 3), (-4, top + 10), (-spread + 4, bottom - 4),
                             (-4, bottom - 6), (0, bottom - 4), (3, bottom - 7),
                             (1, top + 7)], light if snowy else base, size)


def rock(draw, x, y, size, colors=STONE):
    dark, shade, base, light = colors
    polygon(draw, x, y, [(-11, -2), (-9, -8), (-3, -11), (5, -11), (10, -7),
                         (13, -1), (7, 2), (-7, 2)], dark, size)
    polygon(draw, x, y, [(-10, -3), (-8, -8), (-1, -10), (5, -10), (10, -6),
                         (11, -2), (5, 0), (-6, 0)], shade, size)
    polygon(draw, x, y, [(-8, -8), (-2, -10), (5, -10), (8, -7), (4, -5),
                         (-4, -5), (-9, -6)], base, size)
    polygon(draw, x, y, [(-7, -8), (-1, -9), (5, -9), (6, -8), (0, -8), (-4, -7)], light, size)


def ruins(draw, x, y):
    draw.rectangle((x - 24, y - 34, x - 18, y), fill='#7d8878')
    draw.rectangle((x + 18, y - 34, x + 24, y), fill='#7d8878')
    for side in (-1, 1):
        for row in range(4):
            bx, by = x + side * 21, y - row * 8
            draw.rectangle((bx - 4, by - 6, bx + 4, by), fill='#aeb099')
            draw.line((bx - 3, by - 6, bx + 2, by - 6), fill='#dcd1ad')
    polygon(draw, x, y, [(-27, -29), (-27, -37), (-19, -45), (-9, -50),
                         (10, -50), (20, -45), (27, -38), (27, -30),
                         (17, -30), (14, -37), (8, -41), (-8, -41),
                         (-14, -37), (-18, -30)], '#85917b')
    polygon(draw, x, y, [(-25, -34), (-23, -39), (-16, -45), (-7, -48),
                         (10, -48), (18, -44), (24, -38), (24, -35),
                         (20, -37), (16, -41), (8, -44), (-8, -44),
                         (-15, -41), (-20, -36)], '#c1bd9d')
    polygon(draw, x, y, [(-26, -31), (-24, -38), (-18, -42), (-15, -41),
                         (-18, -38), (-17, -35), (-21, -32), (-22, -26)], '#8f9e62')
    draw.line((x + 5, y - 47, x + 6, y - 43), fill='#8e927d')
    draw.line((x + 21, y - 26, x + 23, y - 24, x + 22, y - 20), fill='#7c8976')


def broken_columns(draw, x, y):
    for bx, height in [(x - 16, 13), (x + 6, 27), (x + 21, 18)]:
        draw.rectangle((bx - 3, y - height, bx + 4, y), fill='#7f8b77')
        for by in range(y, y - height, -6):
            draw.rectangle((bx - 4, by - 5, bx + 2, by - 1), fill='#aaad8c')
            draw.line((bx - 3, by - 5, bx + 2, by - 5), fill='#c8c3a3')
        draw.line((bx - 6, y - height, bx + 5, y - height), fill='#abaf89', width=2)
    rock(draw, x - 6, y, .55)


def mushroom(draw, x, y):
    draw.line((x, y - 5, x, y), fill='#e2c5a0', width=2)
    polygon(draw, x, y, [(-5, -4), (-4, -7), (-2, -8), (2, -8),
                         (5, -6), (5, -4), (2, -3), (-3, -3)], '#8f6151')
    draw.line((x - 3, y - 6, x + 3, y - 6), fill='#c88972')
    draw.point((x - 1, y - 7), fill='#eed3a9')


def wildflowers(draw, x, y, leaf, pink):
    for dx, height in [(-4, 4), (0, 6), (4, 3)]:
        draw.line((x + dx, y - height, x + dx, y - 1, x + dx + 1, y), fill=leaf)
        star(draw, x + dx, y - height, 1, pink if dx else '#f4e5b2')
        draw.point((x + dx, y - height), fill='#d69d63')


def aquatic_plant(draw, x, y, scale, colors):
    dark, base, light = colors
    polygon(draw, x, y, [(0, 0), (-2, -8), (-7, -13), (-8, -21), (-5, -19),
                         (-3, -13), (0, -10), (0, -16), (-3, -24), (-3, -30),
                         (0, -28), (2, -19), (3, -11), (6, -18), (8, -20),
                         (7, -13), (4, -8), (3, 0)], dark, scale)
    polygon(draw, x, y, [(1, -2), (0, -12), (-2, -21), (-2, -27), (-1, -25),
                         (1, -17), (3, -7), (6, -15), (6, -11), (3, -5), (2, -2)], base, scale)
    polygon(draw, x, y, [(-7, -19), (-5, -16), (-5, -13), (-7, -16)], light, scale)


def star(draw, x, y, radius, color):
    draw.line((x - radius, y, x + radius, y), fill=color)
    draw.line((x, y - radius, x, y + radius), fill=color)


def frontier_landmarks(draw, area):
    rng = Random(area * 19)
    if area == 11:
        leaves = ('#966e77', '#b57f92', '#d59aa1', '#efbdb3')
        for x in (39, 158, 272, 458, 547):
            broadleaf(draw, x, 70, .7 + rng.random() * .32, leaves)
        for x in range(5, WIDTH, 17):
            wildflowers(draw, x, 75 + x % 3, '#73936a', '#ae9dcc' if x % 2 else '#e9a9a3')
    elif area == 12:
        draw.rectangle((0, 54, WIDTH, 67), fill='#81bcba')
        for _ in range(60):
            x, y = rng.randrange(WIDTH), rng.randrange(56, 68)
            draw.line((x, y, x + rng.randrange(3, 16), y), fill='#bbdaca')
        for x in (39, 153, 242, 374, 529):
            rock(draw, x, 70, .85, ('#638e92', '#77aba5', '#9cc6b4', '#d7e2bf'))
            rock(draw, x + 13, 72, .37)
        for x in (80, 325, 548):
            polygon(draw, x, 59, [(0, 0), (7, -14), (7, 0)], '#f4dfbe')
            draw.line((x + 8, 45, x + 8, 61), fill='#8f806f')
            draw.line((x - 3, 61, x + 12, 61), fill='#a68d72', width=2)
    elif area == 13:
        for x in (34, 118, 208, 285, 437, 532):
            rock(draw, x, 73, 1.2, ('#574a5e', '#736273', '#947a86', '#b69895'))
            for dx, h in [(-7, 10), (0, 21), (7, 13)]:
                polygon(draw, x + dx, 69, [(-4, 0), (-5, -h + 5), (0, -h), (4, -h + 5), (3, 0)], '#d39664')
                polygon(draw, x + dx, 69, [(0, -h), (3, -h + 5), (2, -1), (0, -4)], '#f4c57e')
        for x in (0, 113, 215, 346, 469, 584):
            polygon(draw, x, 0, [(-18, 0), (-5, 7), (1, 17), (6, 5), (22, 0)], '#6a556c')
    elif area == 14:
        for x in range(14, WIDTH, 27):
            pine(draw, x, 72 + x % 3, rng.uniform(.45, 1.15), ICE, snowy=True)
        for x in (81, 195, 344, 551):
            rock(draw, x, 74, .67, ICE)
        for _ in range(52):
            draw.point((rng.randrange(WIDTH), rng.randrange(4, 64)), fill='#f0efdf')
    else:
        for x, y in [(29, 48), (138, 51), (251, 40), (382, 55), (527, 45)]:
            polygon(draw, x, y, [(-20, 0), (-9, 6), (-2, 14), (3, 8), (15, 4), (22, 0)], '#a797a4')
            polygon(draw, x, y, [(-21, 0), (-14, -4), (8, -5), (20, -2), (22, 0), (6, 2), (-12, 2)], '#bec5a2')
            pine(draw, x + 2, y - 2, .27, ('#8b9d93', '#9cab92', '#b5ba95', '#dad1a5'))
        for x in (63, 260, 443):
            broken_columns(draw, x, 73)
        for x in (16, 87, 141, 300, 385, 512, 571):
            wildflowers(draw, x, 75, '#8b9e73', '#e6b69a')


def landmarks(draw, area):
    if area >= 11:
        frontier_landmarks(draw, area)
        return
    if area in (0, 1, 6, 10):
        colors = {0: LEAVES, 1: FOREST, 6: AMBER, 10: TREE}[area]
        for x, y, size in [(39, 70, .72), (79, 69, .56), (158, 68, .62),
                           (247, 74, 1.15), (274, 72, .69), (423, 69, .81),
                           (511, 73, 1.02), (557, 68, .63)]:
            if area == 0 and x in (158, 274, 557):
                continue
            broadleaf(draw, x, y, size, colors)
        if area == 10:
            polygon(draw, 317, 77, [(-44, 0), (-27, -6), (-13, -18), (-11, -46), (9, -49),
                                    (14, -17), (30, -6), (44, -3), (23, 0), (5, -4), (-12, 0)], '#685f44')
            polygon(draw, 317, 77, [(-35, -1), (-18, -12), (-6, -29), (-6, -46), (0, -42),
                                    (2, -19), (9, -9), (20, -6), (1, -7), (-13, -3)], '#a08652')
            broadleaf(draw, 301, 58, 1.22, TREE)
            broadleaf(draw, 337, 61, 1.08, TREE)
            broadleaf(draw, 318, 53, 1.14, TREE)
            for x, y in [(238, 38), (269, 25), (292, 43), (311, 29), (354, 36), (383, 47), (398, 63)]:
                star(draw, x, y, 2, '#f5de8c')
        if area == 1:
            for x, size in [(9, .91), (119, .83), (222, .99), (347, .98), (388, .72), (593, .90)]:
                pine(draw, x, 68 + x % 6, size)
            for x in (68, 178, 192, 294, 334, 440, 455, 540):
                mushroom(draw, x, 74 + x % 3)
        if area in (0, 6, 10):
            for x in (17, 97, 172, 198, 304, 416, 463, 532):
                wildflowers(draw, x, 74 + x % 3, colors[0], '#dfac8b')
        if area in (0, 6):
            for x in (102, 118, 134, 343, 359, 375, 391, 577, 593):
                y = 65 + (x % 3)
                draw.line((x, y + 4, x + 15, y + 4), fill='#9e8154', width=3)
                draw.line((x, y + 3, x + 15, y + 3), fill='#c9a46c')
                draw.line((x, y, x, y + 9), fill='#8d794e', width=3)
                draw.line((x, y, x, y + 7), fill='#d5b37d')
    elif area == 2:
        rock_colors = ('#8f6352', '#ac7a62', '#c29472', '#e5b990')
        for x, y, size in [(36, 71, 1.4), (118, 69, .5), (201, 73, 1.7),
                           (226, 73, .7), (340, 71, .8), (446, 72, 1.5), (563, 69, 1)]:
            rock(draw, x, y, size, rock_colors)
    elif area == 3:
        ruins(draw, 249, 72)
        for x in (90, 470):
            broken_columns(draw, x, 72)
        for x in (104, 153, 216, 288, 358, 530):
            rock(draw, x, 72 + x % 3, .8)
    elif area == 4:
        for x, size in [(12, .71), (46, 1.03), (69, .81), (162, .61),
                        (228, 1.05), (257, .89), (366, .76), (464, 1.08), (494, .85), (577, .9)]:
            pine(draw, x, 68 + x % 6, size, ICE, snowy=True)
        for x in (125, 310, 406, 527, 553):
            rock(draw, x, 73, .68, ICE)
    elif area == 5:
        for x, y, size in [(16, 73, 1), (38, 73, .8), (119, 71, .72),
                           (231, 73, 1.2), (254, 74, .8), (383, 75, 1.1),
                           (472, 70, .88), (562, 74, 1.15)]:
            aquatic_plant(draw, x, y, size, ('#548f8e', '#66a599', '#9ac7a4'))
            rock(draw, x + 8, y, .62, ('#649798', '#81b2a8', '#a6c8ad', '#c3debb'))
        for x in (83, 176, 277, 354, 455, 528):
            aquatic_plant(draw, x, 72, .8, ('#a88b89', '#c39f94', '#e6bdab'))
        for x, y in [(46, 26), (114, 42), (240, 32), (301, 20), (374, 47), (480, 23), (559, 34)]:
            draw.ellipse((x, y, x + 5, y + 5), outline='#c7e4d6')
            draw.point((x + 8, y - 5), fill='#e0ebce')
    elif area == 7:
        for x in (31, 109, 234, 280, 425, 546):
            rock(draw, x, 74, (x % 3 + 4) / 4, ('#6e758c', '#8791a5', '#a8a8b9', '#cac4d0'))
    elif area == 8:
        for x in (23, 55, 117, 188, 239, 328, 371, 436, 480, 551, 585):
            aquatic_plant(draw, x, 74, .45 + (x % 5) * .12, ('#557c7d', '#74988a', '#bdbb8f'))
        for x, y in [(91, 50), (147, 59), (267, 47), (350, 56), (401, 48), (523, 41), (578, 50)]:
            star(draw, x, y, 1, '#ede2a8')
    else:
        # The dome and brass telescope are silhouetted against the evening sky.
        x = 275
        draw.rectangle((x - 24, 51, x + 24, 71), fill='#747794')
        draw.rectangle((x - 21, 54, x + 21, 69), fill='#a19ba5')
        polygon(draw, x, 51, [(-27, 0), (-24, -8), (-18, -15), (-8, -18), (8, -18),
                              (18, -15), (24, -8), (27, 0)], '#646889')
        polygon(draw, x, 51, [(-23, -3), (-19, -10), (-11, -15), (3, -16),
                              (1, -13), (-6, -10), (-9, -3)], '#9095b1')
        polygon(draw, x, 40, [(0, -2), (24, -19), (28, -14), (4, 4)], '#c4a98a')
        draw.line((x + 2, 38, x + 24, 23), fill='#e1c9a3', width=2)
        draw.line((x - 27, 51, x + 27, 51), fill='#d0b99d', width=2)
        draw.rectangle((x - 4, 58, x + 4, 71), fill='#6e708b')
        draw.rectangle((x - 2, 60, x + 1, 66), fill='#dfc89e')
        for dx in (-15, 15):
            draw.rectangle((x + dx - 2, 56, x + dx + 2, 63), fill='#777689')
            draw.line((x + dx, 57, x + dx, 61), fill='#e1cba2', width=2)
        for px in (106, 165, 370, 473, 563):
            rock(draw, px, 73, 1, ('#727689', '#8c8ea0', '#a6a7b4', '#bcb6bc'))


def panorama(area, palette):
    sky, horizon, distant, near, ground, ground_shade, trail, trail_light = palette
    rng = Random(area)
    scene = Image.new('RGB', (WIDTH, HEIGHT), sky)
    draw = ImageDraw.Draw(scene)
    high = bytes.fromhex(sky[1:])
    low = bytes.fromhex(horizon[1:])
    for y in range(12, 65):
        ratio = ((y - 12) // 4 * 4) / 52
        tone = tuple(round(a + (b - a) * ratio) for a, b in zip(high, low))
        draw.line((0, y, WIDTH - 1, y), fill=tone)
    if area == 13:
        for x in range(-19, WIDTH, 54):
            polygon(draw, x, 0, [(-10, 0), (12, 0), (4, 8), (0, 15), (-3, 6)], '#5b4c62')
    elif area == 15:
        draw.ellipse((263, 16, 295, 48), fill='#ffedc2')
        for x, y in ((36, 24), (155, 16), (352, 26), (496, 18)):
            cloud(draw, x, y, .79, '#fce5c8', '#e6c4bf')
    elif area == 5:
        for x in (-30, 72, 179, 278, 387, 484, 595):
            polygon(draw, x, 0, [(0, 0), (15, 0), (69, 59), (43, 59)], '#9ed0c4')
        for x in range(0, WIDTH, 41):
            y = 5 + (x % 4)
            draw.line((x, y, x + 24, y), fill='#cae4d5')
    elif area in (8, 9):
        moon_x, moon_y = (255, 27) if area == 8 else (343, 22)
        draw.ellipse((moon_x - 12, moon_y - 12, moon_x + 12, moon_y + 12), fill='#c6c4ba')
        draw.ellipse((moon_x - 9, moon_y - 9, moon_x + 9, moon_y + 9), fill='#f5e4b2')
        draw.line((moon_x - 8, moon_y + 3, moon_x + 2, moon_y + 3), fill='#ead5a5')
        for x in range(12, WIDTH, 29):
            star(draw, x + rng.randrange(-9, 10), rng.randrange(7, 42), 1 if x % 3 == 0 else 0, '#e5dec0')
    else:
        for x, y, size in [(5, 15, 1.16), (126, 9, .85), (310, 15, 1.28),
                           (453, 22, .89), (539, 8, .94)]:
            cloud(draw, x, y, size, horizon, distant)
    tall = area in (2, 4, 7, 13, 14)
    distant_points = [(x, rng.randrange(21, 41) if i % 2 else rng.randrange(43, 54))
                      for i, x in enumerate(range(0, WIDTH + 25, 32))]
    if tall:
        ridge(draw, distant_points, distant)
    else:
        distant_points = [(x, 33 + y // 2) for x, y in distant_points]
        rolling_hills(draw, distant_points, distant)
    if area == 2:
        polygon(draw, 251, 60, [(-97, 0), (-52, -13), (-25, -32), (-14, -42), (8, -42),
                                (22, -27), (45, -13), (80, 0)], '#a56c5d')
        polygon(draw, 251, 60, [(-67, 0), (-40, -14), (-14, -42), (-5, -37),
                                (-22, -22), (-24, -12), (-39, 0)], '#bb826a')
        draw.line((247, 18, 249, 23, 258, 29, 265, 43, 280, 54), fill='#e5a077', width=3)
        cloud(draw, 217, 7, .64, '#e7b59b', '#cb9282')
    if area in (4, 14):
        for x, y in distant_points[1::2]:
            polygon(draw, x, y, [(0, 0), (10, 8), (16, 13), (9, 12), (4, 9),
                                 (-1, 11), (-5, 7), (-11, 9)], '#e7f0ed')
    if area in (0, 1, 4, 6, 10):
        colors = (distant, near, distant, horizon)
        for x in range(-5, WIDTH, 12):
            pine(draw, x + rng.randrange(-5, 6), 60 + rng.randrange(-5, 6),
                 rng.randrange(17, 36) / 100, colors, snowy=area == 4)
    if area == 7:
        ridge(draw, [(0, 50), (32, 53), (53, 55), (88, 42), (95, 38),
                     (141, 38), (169, 47), (177, 58), (223, 54), (262, 41),
                     (279, 34), (327, 34), (343, 40), (352, 60), (401, 57),
                     (439, 47), (457, 38), (499, 38), (522, 46), (574, 55), (608, 55)], near)
        polygon(draw, 194, 17, [(0, 0), (5, 0), (1, 8), (7, 8), (-2, 20),
                                (0, 11), (-6, 11)], '#f2ddb8')
    else:
        hill_line = [(x, rng.randrange(54, 63) if i % 2 else rng.randrange(48, 54))
                     for i, x in enumerate(range(0, WIDTH + 25, 38))]
        rolling_hills(draw, hill_line, near)
    if area == 8:
        draw.rectangle((0, 59, WIDTH, 75), fill='#8ea9ae')
        for i in range(30):
            x, y = rng.randrange(WIDTH), rng.randrange(60, 75)
            draw.line((x, y, x + rng.randrange(3, 17), y), fill='#b8c8bc')
        for y, half in [(60, 15), (62, 26), (65, 19), (68, 37), (71, 29)]:
            draw.line((255 - half, y, 255 + half, y), fill='#d3d4b5')

    bank = [(x, rng.randrange(68 if area == 8 else 63, 75)) for x in range(0, WIDTH + 16, 16)]
    ridge(draw, bank, ground)
    draw.line(bank, fill=ground_shade, width=2)
    landmarks(draw, area)
    trail_top = [(x, rng.randrange(75, 80)) for x in range(0, WIDTH + 16, 16)]
    trail_bottom = [(x, rng.randrange(95, 99)) for x in range(0, WIDTH + 16, 16)]
    draw.polygon([*trail_top, *trail_bottom[::-1]], fill=trail)
    draw.line(trail_top, fill=trail_light, width=2)
    draw.line(trail_bottom, fill=ground_shade, width=2)
    for x in range(2, WIDTH, 9):
        px = x + rng.randrange(-2, 3)
        y = rng.randrange(79, 94)
        draw.line((px, y, px + rng.randrange(1, 5), y), fill=trail_light)
        draw.point((px + 1, y + 2), fill=ground_shade)
    for x in range(0, WIDTH, 10):
        px = x + rng.randrange(-3, 4)
        y = rng.choice([rng.randrange(70, 76), rng.randrange(100, 106)])
        if area in (2, 3, 4, 7, 9):
            draw.line((px - 1, y, px + 2, y), fill=ground_shade)
            draw.point((px + 1, y - 1), fill=trail_light)
        else:
            draw.line((px - 2, y - 2, px, y, px + 1, y - 3), fill=ground_shade)
            if x % 3 == 0:
                draw.point((px + 1, y - 4), fill='#f4e2a4' if x % 4 else '#e2ac94')
    if area in (0, 6, 10, 11, 15):
        for x in (29, 77, 141, 210, 291, 377, 451, 492, 566):
            wildflowers(draw, x, 104 + x % 3, ground_shade, '#e6a48e')
    if area == 1:
        for x in (103, 269, 373, 497, 584):
            mushroom(draw, x, 106)
    return scene


def goal_flag():
    sprite = Image.new('RGBA', (46, 57))
    d = ImageDraw.Draw(sprite)
    rock(d, 9, 54, .65)
    d.rectangle((7, 4, 11, 53), fill='#664c3b')
    d.line((8, 5, 8, 51), fill='#c0955d')
    d.line((9, 7, 9, 51), fill='#9e6e49')
    d.ellipse((6, 0, 12, 6), fill='#7b5536')
    d.ellipse((7, 1, 11, 5), fill='#e7b65f')
    d.point((8, 2), fill='#fff0ab')
    panel = [(10, 8), (16, 9), (23, 9), (29, 7), (37, 7), (45, 9), (41, 17),
             (45, 25), (38, 24), (31, 24), (24, 26), (16, 26), (10, 24)]
    d.polygon(panel, fill='#49735d', outline='#314b46')
    d.polygon([(12, 12), (20, 13), (28, 11), (37, 10), (42, 11),
               (38, 13), (30, 14), (22, 16), (12, 15)], fill='#557f62')
    d.line((12, 10, 17, 11, 23, 11, 30, 9, 39, 9, 43, 10), fill='#a9bd7d')
    d.line((12, 22, 17, 24, 23, 24, 31, 22, 41, 22), fill='#84a66f')
    d.line((11, 9, 11, 24), fill='#e2b15c')
    d.line((9, 10, 13, 10), fill='#f4d183')
    d.line((9, 21, 13, 21), fill='#e2b15c')
    digits = ('010 0110 0110 110001', '110 1001 1001 110010', '010 1001 1001 000100',
              '010 1001 1001 001000', '010 1001 1001 001000', '010 1001 1001 010011',
              '111 0110 0110 100011')
    for row, line in enumerate(digits):
        for col, pixel in enumerate(line):
            if pixel == '1':
                d.point((15 + col, 14 + row), fill='#fff2c5')
    d.line((5, 49, 6, 51, 6, 54), fill='#7c985b')
    d.point((4, 49), fill='#dfbb76')
    return sprite


def chest(opened):
    sprite = Image.new('RGBA', (32, 32))
    d = ImageDraw.Draw(sprite)
    outline, dark, wood, lit = '#593f36', '#84533d', '#ab6e46', '#cc8d56'
    brass, gold, shine = '#b57b40', '#e4b46b', '#ffe09b'
    if opened:
        d.polygon([(3, 18), (3, 9), (6, 5), (10, 3), (24, 3), (28, 6),
                   (29, 12), (27, 19)], fill=dark, outline=outline)
        d.polygon([(5, 15), (5, 9), (9, 6), (24, 5), (27, 7), (27, 15)], fill=wood)
        d.line((6, 9, 10, 6, 24, 5, 27, 7), fill=gold)
        d.polygon([(6, 14), (10, 10), (24, 8), (26, 11), (25, 16)], fill='#623f39')
        d.polygon([(3, 17), (8, 13), (25, 13), (30, 17), (28, 22), (5, 22)], fill=brass, outline=outline)
        d.polygon([(6, 17), (9, 15), (24, 15), (27, 17), (26, 19), (7, 19)], fill='#473a38')
    else:
        d.polygon([(2, 19), (2, 14), (5, 10), (10, 8), (24, 8), (28, 10),
                   (30, 14), (30, 19)], fill=dark, outline=outline)
        d.polygon([(4, 15), (6, 11), (10, 9), (23, 9), (27, 11), (28, 15)], fill=lit)
        d.line((5, 14, 26, 14), fill=wood)
        d.line((8, 10, 6, 14, 6, 17), fill=gold, width=2)
        d.line((23, 9, 25, 12, 25, 17), fill=gold, width=2)

    d.polygon([(2, 18), (30, 18), (29, 28), (26, 30), (5, 30), (2, 27)],
              fill=wood, outline=outline)
    d.rectangle((4, 21, 28, 24), fill=lit)
    d.line((4, 26, 27, 26), fill=dark, width=2)
    d.line((4, 19, 28, 19), fill=gold)
    d.line((5, 20, 5, 28, 26, 28, 27, 27, 27, 20), fill=brass, width=2)
    d.point((6, 26), fill=shine)
    d.point((26, 26), fill=shine)
    d.rectangle((13, 18, 18, 24), fill=brass, outline=outline)
    d.rectangle((14, 18, 17, 23), fill=gold)
    d.line((14, 19, 17, 19), fill=shine)
    d.line((16, 21, 16, 22), fill=outline)
    return sprite


def adventure_atlas():
    atlas = Image.new('RGBA', (WIDTH, HEIGHT * len(LANDSCAPES) + 57))
    for i, palette in enumerate(LANDSCAPES):
        atlas.paste(panorama(i, palette), (0, i * HEIGHT))
    y = HEIGHT * len(LANDSCAPES)
    atlas.paste(goal_flag(), (0, y))
    atlas.paste(chest(False), (46, y))
    atlas.paste(chest(True), (78, y))
    return atlas


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    adventure_atlas().save(args.output, optimize=True)
