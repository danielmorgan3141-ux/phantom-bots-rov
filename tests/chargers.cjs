const assert=require('node:assert/strict'),{ROVRules:R}=require('../dist/engine.js');
for(const level of [1,5,6,10,11,25,50,100]){
 const g=new R.Game(31);g.loadLevel(level);g.start();
 assert(g.world.chargeStations.length>=1+Math.floor((level-1)/5));
 const reached=new Set([g.world.chargeStations[0]]);
 for(let pass=0;pass<g.world.chargeStations.length;pass++)for(const c of g.world.chargeStations)if([...reached].some(a=>R.distance(a,c)<=R.MAX_CHARGER_LEG+1e-8))reached.add(c);
 assert.equal(reached.size,g.world.chargeStations.length,`Level ${level}: all chargers must be reachable through safe hops`);
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

// Exercise a maximum-length hop through actual movement and battery rules.
const travel=new R.Game(31);travel.loadLevel(25);travel.start();travel.pitch=0;travel.pos={x:-40,y:-1.2,z:0};travel.yaw=-Math.PI/2;travel.world.chargeStations=[{x:-40,y:-1.2,z:0,radius:3},{x:40,y:-1.2,z:0,radius:3}];
for(let i=0;i<138;i++)travel.tick(.1,{forward:true,boost:true});
assert.equal(travel.state,'running');assert(travel.atCharger());assert(travel.battery>30,'An 80 m boosted hop leaves a usable reserve');
