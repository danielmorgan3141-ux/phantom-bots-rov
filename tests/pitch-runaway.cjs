const assert=require('node:assert/strict');const {ROVRules:R}=require('../dist/engine.js');
function dive(){const g=new R.Game(42);g.start();g.pos={x:0,y:-10,z:0};g.yaw=0;g.world.half=1000;g.world.floor=()=>-1000;g.world.rocks=[];g.world.corals=[];g.budget=100000;return g}
for(const sign of [-1,1]){
 let g=dive();g.pitch=sign*(Math.PI/2-.02);g.tick(.01);assert(!g.uncontrolled,'Pitch below 90 degrees remains controllable');g.tick(.05,sign>0?{up:true}:{down:true});assert(g.uncontrolled);assert.equal(g.spinDirection,sign);assert(Math.abs(g.pitch)>=Math.PI/2);assert.equal(g.events.filter(e=>e.type==='controlLost').length,1);
 const yaw=g.yaw,spin=g.spinRate,speed=g.surgeSpeed,pitch=g.pitch,origin={...g.pos},heading={...g.surgeDirection};g.tick(.1,{left:true,up:sign<0,down:sign>0,back:true,sink:true});assert.equal(g.yaw,yaw,'Steering cannot recover a runaway');assert(sign*(g.pitch-pitch)>0);assert(g.spinRate>spin);assert(g.surgeSpeed>speed);assert.deepEqual(g.surgeDirection,heading,'Travel direction is latched while the body spins');const movement={x:g.pos.x-origin.x,y:g.pos.y-origin.y,z:g.pos.z-origin.z},length=Math.hypot(movement.x,movement.y,movement.z);assert((movement.x*heading.x+movement.y*heading.y+movement.z*heading.z)/length>.999999);
 assert(!g.use('hydro').ok);const frozen={pos:{...g.pos},pitch:g.pitch,speed:g.surgeSpeed};g.pause();g.tick(.1,{up:true});assert.deepEqual(g.pos,frozen.pos);assert.equal(g.pitch,frozen.pitch);assert.equal(g.surgeSpeed,frozen.speed);g.start();g.tick(.1);assert(g.surgeSpeed>frozen.speed);
 g.loadLevel(1);assert(!g.uncontrolled);assert.equal(g.spinRate,0);assert.equal(g.surgeDirection,null);
}
function runaway(sign=1){const g=dive();g.pitch=sign*(Math.PI/2+.05);g.loseControl(sign);return g}
for(const kind of ['rock','coral','lakebed','lakeshore']){
 const g=runaway(kind==='lakebed'?-1:1),v=g.surgeDirection;if(kind==='rock'){g.world.rocks=[{id:1,x:v.x*2,y:g.pos.y+v.y*2,z:v.z*2,r:.3}];g.surgeSpeed=200}
 if(kind==='coral')g.world.corals=[{id:'c',x:v.x*2,y:g.pos.y+v.y*2-.5,z:v.z*2,r:.6,height:1.3}];
 if(kind==='lakebed')g.world.floor=()=>-10.35;
 if(kind==='lakeshore')g.world.half=3;
 for(let i=0;i<100&&g.state==='running';i++)g.tick(.05);
 assert.equal(g.state,'failed',kind+' must end the level');assert(g.exploded,kind+' must explode on the first impact');assert(g.pos.y>=g.world.floor(g.pos.x,g.pos.z)+.19,'Crash stays at the last safe position, not underground');assert(g.failure.includes(kind));assert.equal(g.events.filter(e=>e.type==='fail').length,1);assert(g.impacts<5,'Runaway crash does not require five impacts');if(kind==='rock')assert(R.distance({x:0,y:-10,z:0},g.pos)<3,'Fast movement must not tunnel through a small rock');
}
// Safe pitch is allowed, but reaching the exact cutoff triggers immediately with no correction window.
for(const pitch of [-1.5,-.8,0,.8,1.5]){const g=dive();g.pitch=pitch;g.tick(.05);assert(!g.uncontrolled);assert.equal(g.pitch,pitch)}
for(const sign of [-1,1]){const g=dive();g.pitch=sign*Math.PI/2;g.tick(.01);assert(g.uncontrolled,'Reaching exactly ±90 must trigger immediately');const pitch=g.pitch;g.tick(.01,sign>0?{down:true}:{up:true});assert(sign*(g.pitch-pitch)>0,'Opposite input cannot correct it after the cutoff');assert(Math.hypot(g.surgeDirection.x,g.surgeDirection.z)>=.79,'Near-vertical trigger still has a horizontal surge toward a collision')}
console.log('PASS: immediate ±90-degree runaway triggers, accelerating spin and fixed-direction surge, ignored controls, pause/retry, and first-hit explosions on rock/coral/lakebed/lakeshore without tunneling.');
