const assert=require('node:assert/strict');
const {ROVRules:R}=require('../dist/engine.js');
function dive(){const g=new R.Game(73);g.start();g.pos={x:0,y:-5,z:0};g.world.floor=()=>-12;g.world.rocks=[];g.world.corals=[];g.pitch=0;g.yaw=0;return g}
let g=dive();g.tick(.1,{forward:true});assert(g.battery<99.9);const normal=100-g.battery;g=dive();g.tick(.1,{forward:true,boost:true});assert(100-g.battery>normal);
g=dive();g.tick(.1,{left:true});assert(g.battery<99.98);
for(const id of Object.keys(R.BATTERY_COST)){g=dive();assert(g.use(id).ok);assert.equal(g.battery,100-R.BATTERY_COST[id]);g.nextFire=0;g.battery=.01;assert.equal(g.use(id).ok,false);assert.equal(g.state,'failed');assert(g.exploded);assert.equal(g.battery,0)}
g=dive();g.battery=10;g.pos={...g.world.chargeStation};g.tick(.1);assert(g.charging);assert(Math.abs(g.battery-(10+R.BATTERY_RECHARGE_RATE*.1))<1e-9);assert.equal(R.BATTERY_RECHARGE_RATE,3);g.battery=99.9;g.tick(.1);assert.equal(g.battery,100);g.pos.y=-2;g.tick(.1);assert(!g.charging);assert(g.battery<100);
g=dive();g.battery=.001;g.tick(.1);assert.equal(g.state,'failed');assert(g.exploded);assert(g.events.some(e=>e.type==='fail'&&e.explode));g.loadLevel(1);assert.equal(g.battery,100);assert(!g.exploded);g.start();g.pause();g.tick(.1,{forward:true});assert.equal(g.battery,100);
g=dive();for(let i=0;i<5;i++){g.elapsed=i;g.collide({id:i})}assert.equal(g.state,'failed');assert(g.exploded);assert.equal(g.impacts,5);
g=dive();g.world.corals=[{x:0,y:-6,z:-.7,r:.7,height:2}];const before={...g.pos};g.tick(.1,{forward:true});assert.deepEqual(g.pos,before);assert.equal(g.impacts,0);assert(g.events.some(e=>e.type==='coralCollision'));assert(g.battery<100,'Pushing into an obstacle still uses thruster power');
for(let seed=1;seed<=15;seed++){g=new R.Game(seed);assert(g.world.corals.length>0);assert(g.world.corals.every(c=>Math.hypot(c.x-g.world.spawn.x,c.z-g.world.spawn.z)>=4));assert.equal(g.world.chargeStation.y,-1.2)}
console.log('PASS: action energy costs, boost, surface-only recharge and cap, empty-battery explosion, fifth-impact explosion, pause/retry reset, coral collision and spawn clearance.');
