const assert=require('node:assert/strict');const {ROVRules:R}=require('../dist/engine.js');
function setup(){const g=new R.Game(33);g.start();g.pos={x:0,y:-5,z:0};g.pitch=g.yaw=0;g.world.floor=()=>-12;g.world.mussels=[];g.world.wildlife=[];return g}
function animal(id,x,z,kind='fish'){return{id,kind,x,y:-5,z,hp:100,maxHp:100,alive:true}}
for(const id of ['hydro','scraper']){
 const g=setup(),range=R.TOOLS[id].range,z=-(range-.3);g.world.wildlife=[animal(0,0,z),animal(1,0,-range-.1),animal(2,0,1),animal(3,R.TOOLS[id].radius+1,z),animal(4,.1,z,'coral')];
 const cost=g.budget,battery=g.battery,result=g.use(id);
 assert(result.ok);assert.equal(g.world.wildlife[0].hp,0);assert(!g.world.wildlife[0].alive,id+' kills fish in one hit');
 assert(g.world.wildlife.slice(1).every(a=>a.alive),id+' respects range, facing, footprint, and other wildlife rules');assert.equal(result.penalty,2500);assert.equal(g.score(),-2500);assert.equal(g.wildlifeKilled,1);assert.equal(g.ecosystem,75);assert.equal(cost-g.budget,R.TOOLS[id].cost);assert.equal(battery-g.battery,R.BATTERY_COST[id]);
 g.elapsed=g.nextFire+1;g.use(id);assert.equal(g.wildlifePenalty,2500,'Dead fish do not produce repeated penalties');
}
let g=setup();g.world.wildlife=[animal(0,0,-2)];g.use('edna');assert(g.world.wildlife[0].alive,'Sampling is harmless');
console.log('PASS: hydro and scraper kill in-range fish, award wildlife penalty once, respect reach/area/facing, retain costs, and leave sampling harmless.');
