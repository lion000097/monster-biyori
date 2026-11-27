"""Draw the ten 64px boss treasures for the later adventure areas."""
from PIL import Image, ImageDraw

GOLD = ('#594148', '#97634d', '#c68c56', '#ebbd75', '#fff0b4')
ROSE = ('#593c55', '#91556d', '#bc7888', '#e5a3a1', '#ffe1c5')
SEA = ('#334958', '#427680', '#65a49c', '#a1cbbb', '#e0eee0')
FIRE = ('#57404d', '#935451', '#c77b50', '#efa759', '#ffdf8a')
ICE = ('#40516c', '#637895', '#8ca9c4', '#b4d3dc', '#f1f3ec')
SKY = ('#514668', '#83729b', '#ad9fb5', '#e0bdc2', '#ffe7cb')


def relic(area, ultra):
    image = Image.new('RGBA', (64, 64))
    d = ImageDraw.Draw(image)

    def poly(points, fill, outline=None):
        d.polygon(points, fill=fill, outline=outline)
    def oval(box, fill, outline=None, width=1):
        d.ellipse(box, fill=fill, outline=outline, width=width)
    def jewel(x, y, r, palette):
        a, b, c, e, f = palette
        poly([(x, y-r), (x+r, y-2), (x+r-2, y+5), (x, y+r+2), (x-r+2, y+5), (x-r, y-2)], c, a)
        poly([(x-r+1, y-2), (x, y-r+1), (x+2, y-3), (x-3, y+2)], e)
        poly([(x+2, y-3), (x+r-1, y-2), (x+r-3, y+4), (x, y+r)], b)
        d.line((x-5, y-2, x-1, y-5), fill=f, width=2)
    def petal(x, y, palette):
        for dx, dy in ((0,-3),(3,-1),(2,2),(-2,2),(-3,-1)):
            oval((x+dx-2,y+dy-2,x+dx+2,y+dy+2),palette[3],palette[1])
        oval((x-1,y-1,x+1,y+1), GOLD[4])
    if area == 0 and not ultra:  # A horn with a small wildflower binding.
        poly([(13,44),(11,34),(13,24),(19,16),(29,11),(40,11),(49,17),(52,25),(50,32),(44,35),(38,33),(36,27),(40,23),(42,26),(40,29),(44,30),(46,26),(43,20),(36,17),(29,20),(25,26),(25,34),(30,41),(34,44),(29,52),(21,53)], GOLD[2],GOLD[0])
        d.arc((14,13,46,46),110,307,fill=GOLD[3],width=4)
        for x,y in ((17,29),(17,35),(19,42)):d.line((x,y,x+6,y-2),fill=GOLD[1],width=2)
        petal(30,45,ROSE)
    elif area == 0:  # Wreath with three bells.
        d.arc((9,12,54,49),0,360,fill=GOLD[0],width=6)
        d.arc((11,14,52,47),0,360,fill=GOLD[3],width=3)
        for x,y in ((13,27),(21,18),(33,14),(44,19),(52,28)):petal(x,y,ROSE)
        for x,y in ((18,40),(32,46),(46,40)):
            poly([(x-3,y),(x+3,y),(x+5,y+7),(x-5,y+7)],GOLD[3],GOLD[1]);oval((x-1,y+6,x+1,y+9),GOLD[2])
    elif area == 1 and not ultra:
        poly([(9,47),(14,34),(22,25),(31,18),(43,14),(51,17),(55,25),(51,31),(44,32),(38,28),(38,24),(44,21),(47,24),(43,27),(47,28),(50,24),(47,20),(41,19),(33,23),(32,29),(39,37),(35,43),(24,45),(13,52)], SEA[2],SEA[0])
        for x,y in ((14,42),(19,34),(24,29),(29,25)):d.line((x,y,x+8,y+6),fill=SEA[3],width=3)
        d.line((10,48,14,46,18,49,13,52),fill=GOLD[3],width=2)
    elif area == 1:
        poly([(8,40),(7,28),(13,21),(22,20),(32,15),(42,19),(50,20),(56,27),(55,38),(43,48),(22,48)],SEA[2],SEA[0])
        for x in (12,21,31,42,51):d.line((32,43,x,23 if x!=31 else 18),fill=SEA[4],width=2)
        poly([(7,37),(18,38),(32,43),(46,38),(56,35),(51,46),(37,52),(26,52),(13,46)],GOLD[2],GOLD[0])
        oval((22,24,42,44),SKY[3],SKY[1],2);oval((25,26,35,33),SKY[4]);oval((27,25,29,27),'#ffffff')
    elif area == 2 and not ultra:
        d.arc((23,7,41,27),172,365,fill=GOLD[0],width=4)
        poly([(17,24),(21,17),(43,17),(48,24),(44,27),(42,46),(46,49),(44,53),(19,53),(17,49),(21,45),(19,27)],GOLD[1],GOLD[0])
        poly([(23,26),(41,26),(39,45),(25,45)],FIRE[3],FIRE[0])
        jewel(32,35,6,FIRE);d.line((21,21,43,21),fill=GOLD[3],width=2);d.line((22,50,42,50),fill=GOLD[3],width=2)
    elif area == 2:
        for x,y,r in ((20,33,10),(44,31,11),(32,34,17)):
            poly([(x-r,y-7),(x-4,y-r-3),(x+r-3,y-r),(x+r,y+3),(x,y+r+1),(x-r+3,y+5)],FIRE[2],FIRE[0])
            poly([(x-r+2,y-7),(x-3,y-r-2),(x+3,y-4),(x-2,y+4)],FIRE[4])
            d.line((x+2,y-5,x+1,y+5,x,y+r-1),fill=FIRE[1],width=2)
        poly([(17,47),(25,45),(31,49),(41,44),(47,47),(40,53),(24,54)],GOLD[1],GOLD[0])
    elif area == 3 and not ultra:
        poly([(10,53),(17,40),(17,31),(22,23),(23,18),(31,19),(35,12),(43,14),(51,9),(52,18),(49,22),(49,28),(39,33),(36,40),(27,42),(19,47),(14,55)], ICE[2],ICE[0])
        d.line((13,52,23,38,33,30,47,16),fill=ICE[4],width=3)
        for x,y in ((24,36),(31,29),(38,23)):d.line((x,y,x+9,y-1),fill=ICE[3],width=2)
    elif area == 3:
        d.line((29,40,23,55),fill=GOLD[0],width=6);d.line((29,40,23,54),fill=GOLD[3],width=3)
        oval((15,7,49,43),ICE[2],ICE[0],2);oval((19,11,45,38),SKY[2],GOLD[3],2)
        for x,y in ((32,24),(39,15),(24,32)):
            d.line((x-4,y,x+4,y),fill=ICE[4]);d.line((x,y-4,x,y+4),fill=ICE[4])
        d.line((22,23,28,15),fill=ICE[3],width=2)
    elif not ultra:
        for flip in (False,True):
            def side(x):return 64-x if flip else x
            poly([(side(x),y) for x,y in [(7,17),(16,23),(27,25),(33,35),(28,43),(19,39),(12,34),(16,33),(9,27),(13,27)]],GOLD[3],GOLD[0])
            for x,y in ((11,23),(15,29),(20,34)):d.line((side(x),y,side(x+8),y+4),fill=GOLD[2],width=2)
        jewel(32,37,8,ROSE)
    else:
        poly([(7,18),(19,27),(22,15),(29,23),(33,8),(38,23),(44,16),(47,27),(57,18),(52,42),(44,47),(21,47),(13,42)],GOLD[2],GOLD[0])
        d.line((9,21,16,39,25,43,41,43,50,39,55,21),fill=GOLD[4],width=2)
        jewel(33,30,8,ROSE)
        for x in (19,47):oval((x-2,31,x+2,35),SEA[3],GOLD[1])
        d.line((20,46,44,46),fill=GOLD[1],width=3)
    return image
