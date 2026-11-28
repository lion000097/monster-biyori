// All four approved images use the same stone footprint and ground centre.
function travelerLotRect(b, meta) {
  const {size, anchor, span} = travelerPlots[b.type];
  const center = projectGround(b.x + meta.w / 2, b.y + meta.h / 2);
  const scale = (meta.w + meta.h) * T / span;
  return {x: center.x - anchor[0] * scale, y: center.y - anchor[1] * scale,
          w: size * scale, h: size * scale};
}
