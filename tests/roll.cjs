const assert=require('node:assert/strict');const {ROVRules:R}=require('../dist/engine.js');
function dive(){const g=new R.Game(7);g.start();g.world.half=1000;g.world.floor=()=>-100;g.world.rocks=[];g.world.corals=[];g.pos={x:0,y:-5,z:0};g.pitch=0;g.budget=100000;return g}
for(const side of ['left','right']){
 const sign=side==='left'?1:-1,g=dive(),yaw=g.yaw;
 for(let i=0;i<120;i++)g.tick(.05,{[side]:true});
 assert(!g.uncontrolled,'Sustained horizontal turns must remain controllable');assert(sign*(g.yaw-yaw)>Math.PI*2);assert(sign*g.roll>0);assert(Math.abs(g.roll)<=.201,'Side tilt remains a small bank');assert.equal(g.pitch,0);
 const heading=g.yaw;for(let i=0;i<60;i++)g.tick(.05);assert(Math.abs(g.roll)<.001,'Bank levels automatically');assert.equal(g.yaw,heading);assert.equal(g.state,'running');
 g.pitch=Math.PI/2-.01;g.tick(.05,{up:true});assert(g.uncontrolled,'Original vertical cutoff remains');assert.equal(g.runawayHeading,heading);const initial=g.pitch;g.tick(.05,{down:true});assert(g.pitch>initial,'Vertical runaway is still irreversible');
 g.loadLevel(1);assert(!g.uncontrolled);assert.equal(g.roll,0);
}
console.log('PASS: unlimited ordinary steering, small auto-leveling side bank, and preserved immediate vertical runaway.');
