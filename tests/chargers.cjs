const assert=require('node:assert/strict'),{ROVRules:R}=require('../dist/engine.js');
for(const level of [1,2,5,10,25]){
 const g=new R.Game(31);g.loadLevel(level);g.start();
 assert.equal(g.world.chargeStations.length,level+1);
 assert.equal(g.world.chargeStations[0],g.world.chargeStation);
 for(const station of g.world.chargeStations){
  assert(Math.hypot(station.x,station.z)<g.world.half);
  assert(g.world.floor(station.x,station.z)<-1.8);
  g.pos={...station};assert.equal(g.nearestCharger(),station);assert(g.atCharger());
  g.battery=50;g.fouling=10;g.tick(.1);assert(g.charging);assert.equal(g.battery,50.3);assert(g.fouling<10);
  g.pos.y=-2;assert(!g.atCharger(),'Must be near the surface at every station');
 }
 const positions=g.world.chargeStations.map(s=>[s.x,s.z]);g.loadLevel(level);assert.deepEqual(g.world.chargeStations.map(s=>[s.x,s.z]),positions);
}
console.log('PASS: increasing, deterministic, lake-distributed chargers; nearest-station selection; surface-only recharge and cleaning at every station.');
