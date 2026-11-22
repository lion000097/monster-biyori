'use strict';
const {assert, open}=require('./harness138.cjs');
const hook=`Object.assign(window.qa138,{
  scenario(){
    state.hour=18;state.zones=[0,1,4,5];state.buildings=[];state.paths=['5,7','6,7','7,7'];
    state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];state.ponds=[];state.clearedPonds=state.paths.slice();state.clearedScenery=state.paths.slice();
    weatherInfo=()=>({name:'晴れ'});
    const [a,b]=state.monsters;
    state.monsters=[a,b];
    Object.assign(a,{x:5,y:7,path:[],indoorRest:null,ranchTarget200:null});
    Object.assign(b,{x:6,y:7,path:[],indoorRest:null,ranchTarget200:null});
    const A=monsterWalkTimer139(a),B=monsterWalkTimer139(b);
    const funds=[state.coins,state.food,state.magic,state.stock];
    b.path=[[7,7]];if(startDuskSit(a,A))throw Error('Should not interrupt a route');b.path=[];
    if(!startDuskSit(a,A)||A.pastime.scene!==B.pastime.scene)throw Error('Two idle neighbors should sit together');
    const scene=A.pastime.scene;
    if(!advanceMonsterPastime(a,3)||!advanceMonsterPastime(b,3)||scene.remaining!==4)throw Error('Shared clock ticked twice');
    if(advanceMonsterPastime(a,5)||A.pastime||B.pastime||startDuskSit(a,A))throw Error('Should end together and not repeat on the same day');
    state.day++;if(!startDuskSit(a,A))throw Error('Should be available next evening');
    b.path=[[7,7]];
    if(advanceMonsterPastime(a,1)||!b.path.length||B.pastime)throw Error('Should immediately yield to a new route');
    state.day++;b.path=[];state.hour=20;weatherInfo=()=>({name:'雨'});if(startDuskSit(a,A))throw Error('Should not sit in the rain');
    weatherInfo=()=>({name:'晴れ'});if(!startDuskSit(a,A))throw Error('Could not sit before bedtime');
    state.hour=21;if(advanceMonsterPastime(a,1)||A.pastime||B.pastime)throw Error('Should clear both slots at bedtime');
    return [funds,[state.coins,state.food,state.magic,state.stock]];
  }
});`;
(async()=>{
  const game=await open('working',{},hook);
  try{
    const [before,after]=game.f.scenario();
    assert.deepEqual(JSON.stringify(before),JSON.stringify(after),'No resources awarded or spent');
    console.log('PASS adjacent pair, shared clock, rain/bedtime gate, routing priority, no resource change');
  }finally{game.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
