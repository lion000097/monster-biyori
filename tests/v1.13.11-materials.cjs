'use strict';
const {createHash} = require('node:crypto');
const {createCanvas, loadImage} = require('@napi-rs/canvas');
const {assert, open, persist, click, change, clone} = require('./harness138.cjs');

async function main() {
  const previous = await open('1.13.10');
  let storage, stock;
  try {
    const {f,w} = previous, s = f.state();
    s.materialSeen211 = [0,3,18,25];
    s.catalogSeen137.material = [0,3];
    s.materialStock211[0] = 0;
    s.materialStock211[18] = s.stock = 4;
    stock = clone(s.materialStock211);
    f.save(true); storage = persist(w);
  } finally { previous.close(); }

  const q = await open('1.13.11', storage, 'Object.assign(window.qa138,{materials:MATERIALS211});');
  try {
    const {d,w,f} = q;
    click(d,'[data-tab="bestiary"]');
    click(d,'[data-action="atlas"][data-id="material"]');
    const grid = d.querySelector('.material-grid');
    assert.equal(grid.children.length,30);
    assert.equal(grid.querySelectorAll('[data-material-art]').length,4);
    assert.equal(grid.querySelectorAll('.material-unknown').length,26);
    assert.deepEqual(clone(f.state().materialStock211),stock);
    assert.match(d.querySelector('.material-gallery').textContent,/発見 4 \/ 30種/);
    assert.doesNotMatch(d.querySelector('.material-gallery').textContent,/在庫/);
    change(w,'[data-v137-atlas-filter]','new');
    const visible = () => [...d.querySelectorAll('.material-card')].filter(card=>card.style.display!=='none');
    assert.deepEqual(visible().map(card=>card.querySelector('[data-material-art]').dataset.materialArt),['silk','firefly_dust']);
    change(w,'[data-v137-atlas-filter]','missing');
    assert.equal(visible().length,26); assert(visible().every(card=>!card.querySelector('[data-material-art]')));
    change(w,'[data-v137-atlas-filter]','all');

    const s = f.state();
    s.materialSeen211 = Array.from({length:f.materials.length},(_,i)=>i);
    f.render('bestiary');
    const cards = visible();
    const url = w.getComputedStyle(cards[0].querySelector('.material-pixel')).backgroundImage;
    const match = /^url\(["']?(data:image\/png;base64,[A-Za-z0-9+/=]+)["']?\)$/.exec(url);
    assert(match,'self-contained material atlas');
    const sheet = await loadImage(match[1]);
    const cell = 56;
    assert.deepEqual([sheet.width,sheet.height],[cell*6,cell*5]);
    const ctx = createCanvas(sheet.width,sheet.height).getContext('2d');
    ctx.drawImage(sheet,0,0);
    const distinct = new Set();
    for (const [id,card] of cards.entries()) {
      const [key,name] = f.materials[id], icon = card.querySelector('.material-pixel');
      assert.equal(icon.dataset.materialArt,key);
      assert.equal(card.querySelector('.treasure-name').textContent,name);
      const [x,y] = icon.style.backgroundPosition.split(/\s+/).map(parseFloat);
      assert.deepEqual([x,y],[(id%6)*20,Math.floor(id/6)*25]);
      const pixels = ctx.getImageData(x/20*cell,y/25*cell,cell,cell).data;
      let ink = 0;
      for (let a=3;a<pixels.length;a+=4) if(pixels[a]>=128) ink++;
      assert(ink>180 && ink<cell*cell*.86,'isolated, nonempty art: '+name);
      distinct.add(createHash('sha256').update(pixels).digest('hex'));
    }
    assert.equal(distinct.size,30,'30 distinct material drawings');
    console.log('PASS 30 named sprites and atlas frames, discovery/NEW/missing filters, zero-stock and 1.13.10 migration');
  } finally { q.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
