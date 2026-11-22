'use strict';

// The tree and adventure estimates deliberately share one real-game runner.
// Usage: node tests/simulate-tree-1.24.16.cjs [seeds] [max-hours] [visit-minutes] [output-json]
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const [seeds='7,23,91',hours='100',minutes='10',output=path.join(__dirname,'results','tree-simulation-1.24.16.json')]=process.argv.slice(2);
const run=spawnSync(process.execPath,[path.join(__dirname,'simulate-adventure-1.24.16.cjs'),seeds,hours,minutes,output,'--stop-at-tree'],{stdio:'inherit',env:process.env});
if(run.error)throw run.error;
process.exitCode=run.status??1;
