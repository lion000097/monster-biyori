const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require(process.env.MONSTER_QA_JSDOM || 'jsdom');
const { createCanvas, Image } = require('@napi-rs/canvas');
const ROOT = path.resolve(__dirname, '..');
const KEY = 'monster_biyori_save_v1';
const BACKUPS = 'monster_biyori_backups_v113';
const native = new WeakMap();
const clone = value => JSON.parse(JSON.stringify(value));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function backing(el) {
  let c = native.get(el);
  if (!c || c.width !== el.width || c.height !== el.height) {
    c = createCanvas(el.width, el.height);
    const ctx = c.getContext('2d'), original = ctx.drawImage.bind(ctx);
    ctx.drawImage = (source, ...args) => original(native.get(source) || source, ...args);
    native.set(el, c);
  }
  return c;
}
const HOOK = `
window.qa138={
 state:()=>state, save, load, saveBackup213, backupList213, restore213, importSave,
 render:(next)=>{if(next)tab=next;renderUI(true)},
 selectMonster:(id)=>{selectedMonster=id;tab='monster';renderUI(true)},
 animate:(now)=>animate(now), tick, chooseExpedition, advanceExpeditionClock,
 startAdventure, stageLabel, expeditionGoal213, monsterLimit, monsterTreeLimit135,
 partWithMonster171, shopQueueSpots212, registerRelics192, TREASURE_ITEMS, RELIC_START192,
 timing:()=>({frameAt,tickAccum,motionBuffer137,battleElapsed199,uiAt,savingAt}),
 setTiming:(values)=>{
  if(values.tickAccum!==undefined)tickAccum=values.tickAccum;
  if(values.frameAt!==undefined)frameAt=values.frameAt;
  if(values.uiAt!==undefined)uiAt=values.uiAt;
  if(values.savingAt!==undefined)savingAt=values.savingAt;
  if(values.motionBuffer137!==undefined)motionBuffer137=values.motionBuffer137;
 },
 hatch:(egg)=>typeof hatchStatus138==='function'?hatchStatus138(egg):null,
 favorite:(id,action)=>typeof toggleMonsterCollection138==='function'&&toggleMonsterCollection138(id,action),
 ready:()=>!!(colorIndices&&lionReady)
};
`;
async function open(version = '1.13.8', storage = {}) {
  let file = path.join(ROOT, 'releases', version, 'game.html');
  if (!fs.existsSync(file) && version === '1.13.7') file = path.join(ROOT, 'base', 'game137.html');
  const html = fs.readFileSync(file, 'utf8');
  const marker = '})();\n</script>';
  assert.equal(html.split(marker).length, 2, 'one bootstrap IIFE');
  const errors = [], frames = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(String(error.stack || error)));
  console.on('error', (...items) => errors.push(items.join(' ')));
  const dom = new JSDOM(html.replace(marker, HOOK + '\n' + marker), {
    url: `https://monster-biyori-qa.invalid/releases/${version}/game.html`,
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: console,
    beforeParse(w) {
      w.Image = Image;
      w.HTMLCanvasElement.prototype.getContext = function () { return backing(this).getContext('2d'); };
      w.requestAnimationFrame = fn => { frames.push(fn); return frames.length; };
      w.confirm = () => true;
      for (const [key, value] of Object.entries(storage)) w.localStorage.setItem(key, value);
    }
  });
  const w = dom.window, d = w.document;
  for (let i = 0; i < 80 && !w.qa138?.ready() && !errors.length; i++) await wait(25);
  assert.deepEqual(errors, [], 'startup console errors');
  assert(w.qa138?.ready(), 'embedded character assets decoded');
  return { dom, w, d, f: w.qa138, errors, frames, close() { assert.deepEqual(errors, []); w.close(); } };
}
function persist(w) { return Object.fromEntries(Object.keys(w.localStorage).map(key => [key, w.localStorage.getItem(key)])); }
function click(d, selector) { const node = d.querySelector(selector); assert(node, selector); node.click(); return node; }
function change(w, selector, value) {
  const node = typeof selector === 'string' ? w.document.querySelector(selector) : selector;
  assert(node, String(selector)); node.value = value;
  node.dispatchEvent(new w.Event('change', { bubbles: true })); return node;
}
function advance(f, seconds) { for (let left = seconds; left > 1e-8; left -= 0.1) f.animate(f.timing().frameAt + Math.min(0.1, left) * 1000); }
function near(actual, expected) { assert(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`); }
module.exports = { fs, path, assert, ROOT, KEY, BACKUPS, clone, wait, open, persist, click, change, advance, near, backing };
