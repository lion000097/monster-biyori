const harness = require('./harness138.cjs');
async function main() {
  await require('./stability_dom138.cjs').run();
  await require('./collections138.cjs')(harness);
  await require('./save_dom138.cjs').run();
  console.log('PASS: all v1.13.8 integration regressions');
}
main().catch(error => { console.error(error); process.exit(1); });
