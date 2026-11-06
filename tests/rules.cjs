const assert=require('node:assert/strict');
const {ROVRules:R}=require('../dist/engine.js');
const mussel=(id,x,y,z)=>({id,x,y,z,hp:100,maxHp:100,alive:true});
function testGame(){const g=new R.Game(42);g.start();g.pos={x:0,y:-5,z:0};g.pitch=0;g.yaw=0;g.world.rocks=[];g.world.wildlife=[];g.world.floor=()=>-12;return g}
// Most mussels form loose colonies, with a small number of genuine strays.
for(let seed=1;seed<=40;seed++){
 const g=new R.Game(seed),w=g.world;assert.equal(w.mussels.length,840);assert.equal(w.quaggaCount,240);assert.equal(w.zebraCount,600);assert.equal(g.requiredMussels,192);assert.equal(g.requiredCoverage,25);assert.equal(g.budget,4000);assert.equal(g.time,300);assert(w.mussels.every(m=>m.hp===100));
 assert.equal(w.clusters.length,7);assert.equal(w.mussels.filter(m=>m.stray).length,36);
 for(const c of w.clusters){const members=w.mussels.filter(m=>m.clusterId===c.id);assert(members.length>=29&&members.length<=30);assert(members.every(m=>Math.hypot(m.x-c.x,m.z-c.z)<=2.501));assert(members.some(m=>Math.hypot(m.x-c.x,m.z-c.z)>1.6),'Colonies should be loosely spread, not tight piles')}
 assert(w.mussels.filter(m=>m.stray&&m.rockBedId===undefined).every(m=>w.clusters.every(c=>Math.hypot(m.x-c.x,m.z-c.z)>=3)));
 assert(w.mussels.some(m=>m.species==='quagga'&&m.rockBedId!==undefined),'Rocky substrate must not give away species');
 assert(w.mussels.filter(m=>m.species==='quagga').every(m=>R.frontierDistance(w.invasionFront,m)<=0),'Quaggas must stay strictly behind the hidden line');
 assert(w.mussels.filter(m=>m.species==='zebra').every(m=>{const bed=w.rockBeds[m.rockBedId];return bed&&R.rockBedLift(bed,m.x,m.z)>0&&Math.abs(m.y-w.floor(m.x,m.z)-.13)<1e-9}),'Every zebra must be attached to a rocky surface');
 const heights=[0,.2,.4,.6,.8,1].map(r=>w.baseFloor(w.half*r,0));for(let i=1;i<heights.length;i++)assert(heights[i]>heights[i-1]);
 const maxSlope=Math.max(...Array.from({length:50},(_,i)=>Math.abs(w.baseFloor(i/50*w.half+.05,0)-w.baseFloor(i/50*w.half,0))/.05));assert(maxSlope<.85,'No steep shoreline wall');
 const before=g.budget;g.start();g.tick(.1,{forward:true});assert(g.budget<before);g.pause();const time=g.time;g.tick(.1,{forward:true});assert.equal(g.time,time);
 g.loadLevel(2);assert(g.world.quaggaCount>240);assert(g.removalTarget>.8);assert(g.budget>4000);assert(g.time>300);
}
// Scraper has area damage, takes multiple hits, and loses damage with distance.
let g=testGame();g.world.mussels=[mussel(0,0,-5,-.6),mussel(1,.1,-5,-1.8),mussel(2,0,-5,-3.1)];let result=g.use('scraper');assert(result.hits.includes(0));assert(result.hits.includes(1));assert(!result.hits.includes(2));assert(g.world.mussels[0].hp<g.world.mussels[1].hp);assert(g.world.mussels[0].hp>0);assert.equal(g.cleared,0);assert(R.toolDamage('scraper',.5)>R.toolDamage('scraper',2.9));
// Hydro kills all in its footprint in one activation, but never beyond maximum reach.
g=testGame();g.world.mussels=[mussel(0,0,-5,-4),mussel(1,1,-5,-4),mussel(2,0,-5,-6.1)];result=g.use('hydro');assert.equal(result.killed.length,2);assert.equal(g.world.mussels[2].hp,100);assert.equal(g.startBudget-g.budget,40);
assert(R.TOOLS.chemical.range===8&&R.TOOLS.chemical.radius===3.2);assert(R.TOOLS.chemical.range>R.TOOLS.hydro.range);assert(R.TOOLS.chemical.damage>R.TOOLS.hydro.damage&&R.TOOLS.hydro.damage>R.TOOLS.scraper.damage);
// Actual wildlife dies once and causes an uncapped, severe, visible-in-score penalty.
g=testGame();g.world.mussels=[mussel(0,0,-5,-5)];g.world.wildlife=[{id:0,kind:'fish',x:.5,y:-5,z:-5,hp:100,alive:true},{id:1,kind:'turtle',x:-.5,y:-5,z:-5,hp:100,alive:true},{id:2,kind:'fish',x:0,y:-5,z:-8.1,hp:100,alive:true}];result=g.use('chemical');assert.equal(result.penalty,7500);assert.equal(g.wildlifeKilled,2);assert(!g.world.wildlife[0].alive);assert(g.world.wildlife[2].alive);assert(g.score()<0);g.elapsed=g.nextFire+1;g.use('chemical');assert.equal(g.wildlifePenalty,7500);
// Contact blocks movement without pushing upward; one continuous contact is one impact.
g=testGame();g.world.rocks=[{id:0,x:0,y:-5,z:-2,r:1}];g.pos={x:0,y:-5,z:-.6};g.tick(.1,{forward:true});assert.equal(g.impacts,1);assert.equal(g.pos.y,-5);for(let i=0;i<20;i++)g.tick(.1,{forward:true});assert.equal(g.impacts,1);
for(let hit=2;hit<=5;hit++){g.pos={x:5,y:-5,z:0};g.tick(.1,{forward:true});g.elapsed+=1;g.pos={x:0,y:-5,z:-.6};g.tick(.1,{forward:true});assert.equal(g.impacts,hit)}assert.equal(g.state,'failed');assert.match(g.failure,/five rock impacts/);g.loadLevel(1);assert.equal(g.impacts,0);
// The ROV can make real floor contact, with no artificial 1.8m hover cushion.
g=testGame();g.pos={x:0,y:-11.7,z:0};g.tick(.1,{sink:true});assert.equal(g.pos.y,-11.8);assert(g.events.some(e=>e.type==='floor'));assert.equal(g.impacts,0);
// Samples cover water volume, with overlap counted once and no repeat-sampling score farming.
g=new R.Game(7);g.start();assert(g.world.waterVolume>9000);assert(g.world.waterCells.every(c=>c.y<0&&c.y>g.world.floor(c.x,c.z)));
let sample=g.use('edna');assert(sample.gain>0&&sample.gain<5);const coverage=g.waterCoverage,score=g.sampleScore,cost=g.budget;g.elapsed=g.nextFire+1;sample=g.use('edna');assert.equal(sample.gain,0);assert.equal(g.waterCoverage,coverage);assert.equal(g.sampleScore,score);assert.equal(g.budget,cost-150);
g.pos={x:0,y:-5,z:0};g.elapsed=g.nextFire+1;sample=g.use('edna');assert(sample.gain>0);assert(g.waterCoverage>coverage);assert(g.waterCoverage<25);
// Partially overlapping spheres add only their newly represented water cells.
const overlap=new R.Game(8);overlap.start();overlap.pos={x:0,y:-5,z:0};const first=overlap.use('edna');overlap.pos.x=2;overlap.elapsed=overlap.nextFire+1;const second=overlap.use('edna');assert(second.gain>0&&second.gain<first.gain);assert(overlap.waterCoverage<first.gain*2);overlap.loadLevel(2);assert.equal(overlap.waterCoverage,0);assert.equal(overlap.sampledCells.size,0);
// Coverage alone cannot pass; the removal objective is also required.
g.waterCoverage=25;g.checkClear();assert.equal(g.state,'running');g.cleared=g.requiredMussels;g.waterCoverage=24.99;g.checkClear();assert.equal(g.state,'running');g.waterCoverage=25;g.checkClear();assert.equal(g.state,'cleared');
g=testGame();g.world.mussels=[];for(let i=0;i<20;i++){g.elapsed=g.nextFire+1;assert(g.use('scraper').ok)}assert.equal(g.budget,g.startBudget-60);g.budget=.01;g.tick(.1,{forward:true});assert.equal(g.state,'failed');
// Visible time accumulates per shell, survives looking away, and stops while paused.
const idGame=new R.Game(11);idGame.start();const q=idGame.world.mussels[0],z=idGame.world.mussels[240];
for(let i=0;i<10;i++)idGame.observeMussels(.1,[q.id]);const saved=q.identifyProgress;for(let i=0;i<30;i++)idGame.observeMussels(.1,[]);assert.equal(q.identifyProgress,saved);assert.equal(z.identifyProgress,0);
for(let i=0;i<19;i++)idGame.observeMussels(.1,[q.id]);assert(!q.identified,'Species must stay hidden before three seconds');idGame.pause();idGame.observeMussels(.1,[q.id]);assert(!q.identified);idGame.start();idGame.observeMussels(.1,[q.id]);assert(q.identified);assert.equal(q.identifyProgress,3);assert.equal(idGame.identifiedQuaggas,1);assert(!z.identified);for(let i=0;i<29;i++)idGame.observeMussels(.1,[z.id]);assert(!z.identified);idGame.observeMussels(.1,[z.id]);assert(z.identified);assert.equal(idGame.identifiedZebras,1);
// Boulders and terrain occlude visual identification.
const viewWorld={rocks:[],floor:()=>-12},eye={x:0,y:-5,z:0},visible={x:0,y:-5,z:-4};assert(R.visibleSegment(viewWorld,eye,visible));viewWorld.rocks=[{x:0,y:-5,z:-2,r:1}];assert(!R.visibleSegment(viewWorld,eye,visible));viewWorld.rocks=[];viewWorld.floor=()=>0;assert(!R.visibleSegment(viewWorld,eye,visible));
// Only quaggas award the reduced five points and count toward the goal; zebras are not wildlife.
g=testGame();g.world.mussels=[{...mussel(0,0,-5,-4),species:'quagga'},{...mussel(1,.5,-5,-4),species:'zebra'},{...mussel(2,1,-5,-4),species:'zebra'}];result=g.use('hydro');assert.equal(result.quaggaKilled.length,1);assert.equal(result.zebraKilled.length,2);assert.equal(g.cleared,1);assert.equal(g.zebrasRemoved,2);assert.equal(g.score(),5);assert.equal(g.wildlifePenalty,0);
idGame.loadLevel(2);assert.equal(idGame.world.mussels[0].identifyProgress,0);assert.equal(idGame.identifiedQuaggas,0);
// Local eDNA compares signal presence across an invisible invasion edge, without a movement wall.
const survey=new R.Game(31);survey.start();const front=survey.world.invasionFront;assert(Math.abs(R.frontierDistance(front,survey.pos)-4.8)<1e-8);const outside=survey.use('edna');assert.equal(outside.quaggaSignal,false);assert.equal(survey.noQuaggaSignals,1);
survey.pos={x:front.nx*(front.offset-1.5),z:front.nz*(front.offset-1.5),y:0};survey.pos.y=survey.world.floor(survey.pos.x,survey.pos.z)+2;survey.elapsed=survey.nextFire+1;const inside=survey.use('edna');assert.equal(inside.quaggaSignal,true);assert.equal(survey.quaggaSignals,1);assert.equal(survey.sampleRecords.length,2);assert(survey.sampleRecords[1].time>survey.sampleRecords[0].time);assert.equal(survey.sampleRecords[0].quaggaSignal,false);assert.equal(survey.sampleRecords[1].quaggaSignal,true);
survey.world.rocks=[];survey.pos={x:front.nx*(front.offset+.1),z:front.nz*(front.offset+.1),y:-5};survey.pitch=0;survey.yaw=front.angle;survey.tick(.1,{forward:true});assert(R.frontierDistance(front,survey.pos)<0,'ROV must cross freely');
for(let seed=1;seed<=8;seed++)for(const level of [2,5]){const w=R.makeWorld(level,seed);assert(w.mussels.filter(m=>m.species==='quagga').every(m=>R.frontierDistance(w.invasionFront,m)<=0))}
survey.loadLevel(2);assert.equal(survey.sampleRecords.length,0);assert.equal(survey.quaggaSignals,0);assert.equal(survey.noQuaggaSignals,0);
console.log('PASS: random invasion fronts; all quaggas confined to one side; free ROV crossing; positive/negative local sample records; rocky zebra habitat; persistent visual ID; quagga-only scoring; collisions; 25% unique water coverage.');
