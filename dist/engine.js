/* Deterministic ROV arcade rules. Costs and treatment effects are fictional game mechanics. */
(function(root){
'use strict';
const TOOLS={chemical:{name:'Chemical spray',key:'C',range:8,damage:180,radius:3.2,cost:95,cooldown:1.1,color:0x99e990},scraper:{name:'Scraper',key:'X',range:3,damage:45,radius:1.8,cost:3,cooldown:.20,color:0xffd074},hydro:{name:'Hydro blaster',key:'H',range:6,damage:120,radius:2.6,cost:40,cooldown:.75,color:0x70deff},edna:{name:'eDNA sample',key:'N',range:4.5,radius:4.5,cost:150,cooldown:1.5,color:0xb9a4ff}};
const BATTERY_RECHARGE_RATE=3;
const BATTERY_COST={scraper:.25,hydro:2.5,chemical:1.7,edna:1.2};
const PITCH_LIMIT=Math.PI/2;
const ROV_LENGTH=1,ROV_RADIUS=.32,ROV_HALF_SEGMENT=.18;
function rovSamples(p,d){return [-ROV_HALF_SEGMENT,0,ROV_HALF_SEGMENT].map(t=>({x:p.x+d.x*t,y:p.y+d.y*t,z:p.z+d.z*t}))}
const IDENTIFY_SECONDS=3,QUAGGA_POINTS=5;
const WILDLIFE_PENALTY={fish:2500,turtle:5000,jelly:2500,coral:1500,kelp:1500};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function levelSettings(level){return{half:20+level*5,count:Math.min(1500,240+(level-1)*80),zebraCount:Math.min(3000,600+(level-1)*200),clusterCount:Math.min(18,7+level-1),time:300+(level-1)*30,budget:4000+(level-1)*750}}
function rockBedLift(bed,x,z){const dx=x-bed.x,dz=z-bed.z,a=Math.atan2(dz,dx),boundary=1+.07*Math.sin(3*a+bed.phase)+.035*Math.cos(5*a-bed.phase),q=Math.hypot(dx,dz)/(bed.radius*boundary);return q>=1?0:bed.height*(1-q*q)**2+.025*Math.sin(x*5+bed.phase)*Math.cos(z*4)*(1-q)**2}
function visibleSegment(world,eye,target){for(let i=1;i<8;i++){const f=i/8,x=eye.x+(target.x-eye.x)*f,y=eye.y+(target.y-eye.y)*f,z=eye.z+(target.z-eye.z)*f;if(y<world.floor(x,z)+.025)return false}for(const r of world.rocks){const rx=r.r+.03,ry=r.r*.75+.03,ox=(eye.x-r.x)/rx,oy=(eye.y-r.y)/ry,oz=(eye.z-r.z)/rx,dx=(target.x-eye.x)/rx,dy=(target.y-eye.y)/ry,dz=(target.z-eye.z)/rx,A=dx*dx+dy*dy+dz*dz,B=2*(ox*dx+oy*dy+oz*dz),C=ox*ox+oy*oy+oz*oz-1,D=B*B-4*A*C;if(D>0&&A>0){const t=(-B-Math.sqrt(D))/(2*A);if(t>.001&&t<.98)return false}}return true}
function frontierDistance(front,p){return front.nx*p.x+front.nz*p.z-front.offset}
// Keep a connected surface route with a generous battery reserve, even when boosting.
const MAX_CHARGER_LEG=80;
function connectChargers(stations){
 const connected=[stations[0]],pending=stations.slice(1);
 while(pending.length){let best=Infinity,from,to,index=0;
  for(let i=0;i<pending.length;i++)for(const c of connected){const d=distance(c,pending[i]);if(d<best){best=d;from=c;to=pending[i];index=i}}
  const legs=Math.ceil(best/MAX_CHARGER_LEG);
  for(let j=1;j<legs;j++){const t=j/legs,relay={id:stations.length,x:from.x+(to.x-from.x)*t,y:-1.2,z:from.z+(to.z-from.z)*t,radius:3};stations.push(relay);connected.push(relay)}
  connected.push(to);pending.splice(index,1);
 }
 return stations;
}
function makeWorld(level,seed){
 const rand=rng(seed),settings=levelSettings(level),half=settings.half,phase=rand()*6.28;
 // A continuous shallow bowl: the slope begins at the center rather than at a steep rim.
 const baseFloor=(x,z)=>{const q=Math.hypot(x,z)/half,r=Math.min(1,q),ripples=(Math.sin(x*.12+phase)+Math.cos(z*.13-phase))*.18*(1-r);return -11.5*(1-Math.pow(r,1.5))+ripples+Math.max(0,q-1)*2};
 const rockBeds=[];const floor=(x,z)=>baseFloor(x,z)+rockBeds.reduce((height,bed)=>Math.max(height,rockBedLift(bed,x,z)),0);
 const frontAngle=(rand()-.5)*Math.PI*2,invasionFront={angle:frontAngle,nx:Math.sin(frontAngle),nz:Math.cos(frontAngle),offset:half*.04};const n=invasionFront,tangent={x:n.nz,z:-n.nx},startOffset=n.offset+4.8;
 const spawn={x:n.nx*startOffset,y:0,z:n.nz*startOffset};spawn.y=floor(spawn.x,spawn.z)+2.3;const clusters=[],rocks=[];
 // This plane is simulation data only: no wall, stripe, or sonar boundary is drawn.
 // Cluster centers have enough clearance that their entire colony stays on the invaded side.
 for(let i=0;i<settings.clusterCount;i++){let x,z,tries=0;do{const normalOffset=n.offset-3-(i===0?0:rand()*half*.38),lateral=i===0?0:(rand()-.5)*half*.90;x=n.nx*normalOffset+tangent.x*lateral;z=n.nz*normalOffset+tangent.z*lateral;tries++}while(tries<180&&clusters.some(c=>Math.hypot(x-c.x,z-c.z)<5.5));clusters.push({id:i,x,y:floor(x,z),z,radius:2.5})}
 for(let i=0;i<Math.min(22,9+level);i++){const radius=2.7+rand()*1.1;let x,z,tries=0;do{if(i===0){x=n.nx*(n.offset-2)+tangent.x*6;z=n.nz*(n.offset-2)+tangent.z*6}else{const a=rand()*6.28,r=half*(.22+Math.sqrt(rand())*.45);x=Math.cos(a)*r;z=Math.sin(a)*r}tries++}while(tries<150&&(Math.hypot(x-spawn.x,z-spawn.z)<5||clusters.some(c=>Math.hypot(x-c.x,z-c.z)<c.radius+radius*.5)||rockBeds.some(b=>Math.hypot(x-b.x,z-b.z)<(radius+b.radius)*.8)));rockBeds.push({id:i,x,z,radius,height:.22+rand()*.16,phase:rand()*6.28})}
 for(const c of clusters)c.y=floor(c.x,c.z);
 for(let i=0;i<12+level*2;i++){const a=rand()*6.28,r=Math.sqrt(rand())*half*.76,x=Math.cos(a)*r,z=Math.sin(a)*r,size=.55+rand()*1.1;if(Math.hypot(x-spawn.x,z-spawn.z)<5||clusters.some(c=>Math.hypot(x-c.x,z-c.z)<c.radius+size+1))continue;rocks.push({id:rocks.length,x,y:floor(x,z)+size*.35,z,r:size})}
 const mussels=[],count=settings.count,clusteredCount=Math.round(count*.85);
 while(mussels.length<count){const id=mussels.length,isStray=id>=clusteredCount,c=clusters[id%clusters.length];let x,z,tries=0;
  do{if(isStray){const a=(rand()-.5)*Math.PI,r=Math.sqrt(rand())*half*.76,normalOffset=n.offset-Math.cos(a)*r,lateral=Math.sin(a)*r;x=n.nx*normalOffset+tangent.x*lateral;z=n.nz*normalOffset+tangent.z*lateral}else{const a=rand()*6.28,r=Math.sqrt(rand())*c.radius;x=c.x+Math.cos(a)*r;z=c.z+Math.sin(a)*r}tries++}while(tries<100&&(rocks.some(k=>Math.hypot(x-k.x,z-k.z)<k.r+.3)||mussels.some(m=>Math.hypot(x-m.x,z-m.z)<.35)||(isStray&&clusters.some(k=>Math.hypot(x-k.x,z-k.z)<3))));
  mussels.push({id,x,y:floor(x,z)+.13,z,hp:100,maxHp:100,alive:true,species:'quagga',identifyProgress:0,identified:false,angle:rand()*6.28,scale:.85+rand()*.3,clusterId:isStray?null:c.id,stray:isStray});
 }
 // Quaggas may share hard substrate, but relocation must never cross the invisible invasion front.
 const invadedBeds=rockBeds.filter(b=>frontierDistance(n,b)<b.radius*.8);
 for(const [i,m] of mussels.filter(m=>m.stray).slice(0,Math.min(18,settings.count*.1)).entries()){const bed=invadedBeds[i%invadedBeds.length];if(!bed)continue;for(let attempt=0;attempt<120;attempt++){const a=rand()*6.28,r=Math.sqrt(rand())*bed.radius*.8,x=bed.x+Math.cos(a)*r,z=bed.z+Math.sin(a)*r;if(frontierDistance(n,{x,z})<=-.025&&rockBedLift(bed,x,z)>0){m.x=x;m.z=z;m.y=floor(x,z)+.13;m.rockBedId=bed.id;break}}}
 // Zebras attach only to the solid rocky bed patches, never to bare sand.
 for(let i=0;i<settings.zebraCount;i++){const bed=rockBeds[i%rockBeds.length];let x,z,tries=0;do{const a=rand()*6.28,r=Math.sqrt(rand())*bed.radius*.87;x=bed.x+Math.cos(a)*r;z=bed.z+Math.sin(a)*r;tries++}while(tries<60&&(rockBedLift(bed,x,z)<=.015||rocks.some(k=>Math.hypot(x-k.x,z-k.z)<k.r+.3)||mussels.some(m=>Math.hypot(x-m.x,z-m.z)<.22)));mussels.push({id:mussels.length,x,y:floor(x,z)+.13,z,hp:100,maxHp:100,alive:true,species:'zebra',rockBedId:bed.id,identifyProgress:0,identified:false,angle:rand()*6.28,scale:.85+rand()*.3,clusterId:null,stray:false})}
 const corals=[];for(let i=0;i<18;i++){const a=rand()*6.28,r=(.25+rand()*.46)*half,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.hypot(x-spawn.x,z-spawn.z)<4||rocks.some(k=>Math.hypot(x-k.x,z-k.z)<k.r+1.5)||clusters.some(c=>Math.hypot(x-c.x,z-c.z)<3.1))continue;corals.push({id:'coral-'+i,x,y:floor(x,z),z,r:.7+rand()*.3,height:1.2+rand()*.9})}
 const chargeStation={id:0,x:spawn.x,y:-1.2,z:spawn.z,radius:3},chargeStations=[chargeStation];
 // Add a station every five levels, keeping early lakes uncluttered.
 const extraChargers=Math.floor((level-1)/5);
 for(let i=0;i<extraChargers;i++){const a=frontAngle+Math.PI+i*Math.PI*(3-Math.sqrt(5)),r=half*.76*Math.sqrt((i+.5)/extraChargers);chargeStations.push({id:i+1,x:Math.sin(a)*r,y:-1.2,z:Math.cos(a)*r,radius:3})}
 connectChargers(chargeStations);
 const waterCells=[],cellStep=Math.max(1.5,half/22),cellHeight=1.5;
 for(let x=-half+cellStep/2;x<half;x+=cellStep)for(let z=-half+cellStep/2;z<half;z+=cellStep){if(Math.hypot(x,z)>=half)continue;const bottom=floor(x,z);for(let y=-cellHeight/2;y>bottom;y-=cellHeight)waterCells.push({x,y,z})}
 const cellVolume=cellStep*cellStep*cellHeight;
 return{corals,chargeStation,chargeStations,waterCells,cellVolume,waterVolume:waterCells.length*cellVolume,level,seed,half,area:Math.round(Math.PI*half*half),phase,floor,baseFloor,invasionFront,rockBeds,quaggaCount:settings.count,zebraCount:settings.zebraCount,spawn,clusters,mussels,rocks,wildlife:[]};
}
function toolDamage(id,dist){const t=TOOLS[id];if(!t||dist>t.range)return 0;return id==='scraper'?t.damage*(1-.8*clamp(dist/t.range,0,1)):t.damage}
class Game{
 constructor(seed=Date.now()>>>0){this.runSeed=seed;this.totalCleared=0;this.totalSpent=0;this.loadLevel(1)}
 loadLevel(level){this.training=false;this.level=level;this.world=makeWorld(level,(this.runSeed+level*7919)>>>0);this.pos={...this.world.spawn};this.yaw=this.world.invasionFront.angle;this.pitch=-.65;this.time=levelSettings(level).time;this.startTime=this.time;this.budget=levelSettings(level).budget;this.startBudget=this.budget;this.requiredCoverage=25;this.waterCoverage=0;this.sampledCells=new Set();this.sampleLocations=[];this.sampleRecords=[];this.quaggaSignals=0;this.noQuaggaSignals=0;this.sampleScore=0;this.removalTarget=Math.min(.95,.8+(level-1)*.025);this.requiredMussels=Math.ceil(this.world.quaggaCount*this.removalTarget);this.state='ready';this.selected='hydro';this.elapsed=0;this.nextFire=0;this.scans=0;this.identifiedQuaggas=0;this.identifiedZebras=0;this.zebrasRemoved=0;this.revealUntil=0;this.cleared=0;this.distance=0;this.events=[];this.failure='';this.wildlifePenalty=0;this.wildlifeKilled=0;this.impacts=0;this.maxImpacts=5;this.touchingRocks=new Set();this.lastCollision=-10;this.onFloor=false;this.battery=100;this.charging=false;this.lowBatteryWarned=false;this.exploded=false;this.touchingCoral=false;this.hullHealth=100;this.fouling=0;this.zebraExposure=0;this.nearbyZebras=0;this.births=0;this.broodClock=0;this.broodCredit={zebra:0,quagga:0};this.broodRand=rng(this.world.seed^92831);this.populationCap=Math.min(5500,this.world.mussels.length+1600);this.roll=0;this.runawayHeading=null;this.uncontrolled=false;this.spinDirection=0;this.spinRate=0;this.surgeSpeed=0;this.surgeDirection=null}
 event(type,data={}){this.events.push({type,...data})}
 start(){if(this.state==='ready'||this.state==='paused'){this.state='running';this.event('start')}}
 pause(){if(this.state==='running'){this.state='paused';this.event('pause')}}
 nearestCharger(){return this.world.chargeStations.reduce((best,c)=>Math.hypot(this.pos.x-c.x,this.pos.z-c.z)<Math.hypot(this.pos.x-best.x,this.pos.z-best.z)?c:best)}
 atCharger(){return this.pos.y>=-1.8&&this.world.chargeStations.some(c=>Math.hypot(this.pos.x-c.x,this.pos.z-c.z)<=c.radius)}
 drainBattery(amount){if(this.state!=='running'||this.training)return;this.battery=Math.max(0,this.battery-amount);if(this.battery<=0)this.fail('Battery depleted. The ROV exploded. Return to the surface charging station before power runs out.',true);else if(this.battery<=20&&!this.lowBatteryWarned){this.lowBatteryWarned=true;this.event('batteryLow')} }
 damageHull(amount,reason){if(this.state!=='running'||this.training)return;this.hullHealth=Math.max(0,this.hullHealth-amount);if(this.hullHealth<=0)this.fail(reason,true)}
 motorEfficiency(){return 1-this.fouling*.0065}
 tickFouling(dt){
  this.nearbyZebras=this.world.mussels.filter(m=>m.alive&&m.species==='zebra'&&distance(m,this.pos)<2.3).length;
  if(this.atCharger()){const dirty=this.fouling>0;this.fouling=Math.max(0,this.fouling-12*dt);this.zebraExposure=Math.max(0,this.zebraExposure-3*dt);if(dirty&&this.fouling===0)this.event('decontaminated');return}
  if(this.nearbyZebras){this.zebraExposure+=dt;if(this.zebraExposure>=6){const before=this.fouling;this.fouling=Math.min(100,this.fouling+dt*(1.5+Math.min(2.5,this.nearbyZebras*.08)));if(before===0)this.event('fouling')}}else this.zebraExposure=Math.max(0,this.zebraExposure-dt*2);
  if(this.fouling>0)this.damageHull(this.fouling*.04*dt,'Motor fouling destroyed the ROV. Young zebra mussels clogged the thrusters. Decontaminate at the surface station.');
 }
 tickReproduction(dt){
  this.broodClock+=dt;if(this.broodClock<4)return;const step=this.broodClock;this.broodClock=0;if(this.elapsed<20)return;
  const breeders={zebra:[],quagga:[]};for(const m of this.world.mussels){if(!m.alive)continue;if(m.bornAt!=null){m.growth=clamp((this.elapsed-m.bornAt)/36,0,1);if(m.growth<1)continue}else if(m.id%40!==0)continue;breeders[m.species].push(m)}
  for(const species of ['zebra','quagga']){const parents=breeders[species];if(!parents.length){this.broodCredit[species]=0;continue}this.broodCredit[species]+=parents.length*.018*step;let attempts=0;
   while(this.broodCredit[species]>=1&&this.world.mussels.length<this.populationCap&&attempts++<16){this.broodCredit[species]--;const r=this.broodRand,parent=parents[Math.floor(r()*parents.length)];let place=null;
    for(let i=0;i<24;i++){const a=r()*Math.PI*2,d=.3+r()*1.7,x=parent.x+Math.cos(a)*d,z=parent.z+Math.sin(a)*d;if(Math.hypot(x,z)>this.world.half*.8||this.world.floor(x,z)>-1.5)continue;if(species==='zebra'&&!this.world.rockBeds.some(b=>rockBedLift(b,x,z)>.015))continue;if(species==='quagga'&&frontierDistance(this.world.invasionFront,{x,z})>0)continue;if(this.world.rocks.some(k=>Math.hypot(x-k.x,z-k.z)<k.r+.3)||this.world.mussels.some(m=>m.alive&&Math.hypot(x-m.x,z-m.z)<.16))continue;place={x,y:this.world.floor(x,z)+.13,z};break}
    if(!place)continue;const m={...place,id:this.world.mussels.length,hp:100,maxHp:100,alive:true,species,identifyProgress:0,identified:false,angle:r()*Math.PI*2,scale:.85+r()*.3,clusterId:parent.clusterId,stray:true,rockBedId:parent.rockBedId,bornAt:this.elapsed,growth:0};this.world.mussels.push(m);this.births++;if(species==='quagga'){this.world.quaggaCount++;this.requiredMussels=Math.ceil(this.world.quaggaCount*this.removalTarget)}else this.world.zebraCount++;this.event('birth',{id:m.id});
   }
  }
 }
 adjustPitch(delta){if(this.uncontrolled)return;if(this.training){this.pitch=clamp(this.pitch+delta,-1.2,1.2);return}this.pitch+=delta;if(Math.abs(this.pitch)>=PITCH_LIMIT)this.loseControl(Math.sign(delta)||Math.sign(this.pitch))}
 loseControl(direction){if(this.uncontrolled||this.state!=='running')return;this.uncontrolled=true;this.charging=false;this.runawayHeading=this.yaw;this.spinDirection=direction;this.spinRate=1.05;this.surgeSpeed=8;const forward=this.direction(),vertical=clamp(forward.y,-.6,.6),horizontal=Math.sqrt(1-vertical*vertical),length=Math.hypot(forward.x,forward.z);this.surgeDirection={x:(length>.01?forward.x/length:-Math.sin(this.yaw))*horizontal,y:vertical,z:(length>.01?forward.z/length:-Math.cos(this.yaw))*horizontal};this.event('controlLost',{direction})}
 look(dx,dy){if(this.state!=='running'||this.uncontrolled)return;this.drainBattery((Math.abs(dx)+Math.abs(dy))*.0008);if(this.state!=='running')return;this.yaw-=dx*.003;this.adjustPitch(-dy*.003)}
 runawayCollision(p){const samples=rovSamples(p,this.direction());if(Math.hypot(p.x,p.z)>this.world.half*.88)return 'lakeshore';if(samples.some(s=>s.y<=this.world.floor(s.x,s.z)+.20))return 'lakebed';if(this.world.rocks.some(k=>samples.some(c=>((c.x-k.x)/(k.r+ROV_RADIUS))**2+((c.y-k.y)/(k.r*.75+.20))**2+((c.z-k.z)/(k.r+ROV_RADIUS))**2<1)))return 'rock';if(this.world.corals.some(c=>samples.some(s=>Math.hypot(s.x-c.x,s.z-c.z)<c.r+ROV_RADIUS&&s.y>c.y-.2&&s.y<c.y+c.height+.2)))return 'coral';return null}
 tickRunaway(dt){
  this.charging=false;this.spinRate+=3*dt;this.pitch+=this.spinDirection*this.spinRate*dt;this.surgeSpeed+=8*dt;
  const from={...this.pos},travel=this.surgeSpeed*dt,steps=Math.max(1,Math.ceil(travel/.1)),v=this.surgeDirection;
  for(let i=1;i<=steps;i++){const t=travel*i/steps,p={x:from.x+v.x*t,y:Math.min(-.22,from.y+v.y*t),z:from.z+v.z*t},obstacle=this.runawayCollision(p);if(obstacle){this.fail('Control lost at the 90-degree pitch limit.'+' The ROV struck the '+obstacle+' and exploded.',true);break}this.pos=p}
  const moved=distance(from,this.pos);this.distance+=moved;this.spend(moved*2.8);this.drainBattery(moved*.8);
  if(this.state==='running'){if(this.budget<=.001)this.fail('Mission budget exhausted during the runaway.');else if(this.time<=0)this.fail('Mission time expired.')}
 }

 direction(){return{x:-Math.sin(this.yaw)*Math.cos(this.pitch),y:Math.sin(this.pitch),z:-Math.cos(this.yaw)*Math.cos(this.pitch)}}
 spend(amount){if(this.training)return 0;const used=Math.min(this.budget,amount);this.budget=Math.max(0,this.budget-amount);this.totalSpent+=used;return used}
 aim(range=70,entities=this.world.mussels){const d=this.direction();let best=null,rank=-Infinity;for(const c of entities){if(!c.alive)continue;let dist=distance(this.pos,c),dot=((c.x-this.pos.x)*d.x+(c.y-this.pos.y)*d.y+(c.z-this.pos.z)*d.z)/(dist||1);if(dist<=range&&dot>.87){const score=dot-dist*.002;if(score>rank){rank=score;best={colony:c,distance:dist,dot}}}}return best}
 preview(id=this.selected){const tool=TOOLS[id],dir=this.direction();if(id==='edna')return{point:{...this.pos},hits:[],wildlife:[]};let target=this.aim(tool.range);{const vulnerable=id==='chemical'?this.world.wildlife:this.world.wildlife.filter(c=>c.kind==='fish');const friendly=this.aim(tool.range,vulnerable);if(friendly&&(!target||friendly.dot>target.dot+.015))target=friendly}
 let point=target?{x:target.colony.x,y:target.colony.y,z:target.colony.z}:null;
 if(!point){for(let t=.25;t<=tool.range;t+=.25){const p={x:this.pos.x+dir.x*t,y:this.pos.y+dir.y*t,z:this.pos.z+dir.z*t};if(p.y<=this.world.floor(p.x,p.z)+.15){point={x:p.x,y:this.world.floor(p.x,p.z)+.13,z:p.z};break}}}
 if(!point)point={x:this.pos.x+dir.x*tool.range,y:this.pos.y+dir.y*tool.range,z:this.pos.z+dir.z*tool.range};
 const inEffect=c=>{const d=distance(this.pos,c);return c.alive&&d<=tool.range&&distance(c,point)<=tool.radius&&((c.x-this.pos.x)*dir.x+(c.y-this.pos.y)*dir.y+(c.z-this.pos.z)*dir.z)>0};
 return{point,hits:this.world.mussels.filter(inEffect),wildlife:this.world.wildlife.filter(c=>(id==='chemical'||c.kind==='fish')&&inEffect(c))};
 }
 collide(rock){if(this.training)return;if(!this.touchingRocks.has(rock.id)&&this.elapsed-this.lastCollision>.7){this.impacts++;this.damageHull(20,this.impacts>=5?'ROV exploded after five rock impacts. Restart this level.':'ROV hull destroyed by rock impact and motor fouling. Restart this level.');this.lastCollision=this.elapsed;this.event('collision',{impacts:this.impacts});if(this.impacts>=5)this.fail('ROV exploded after five rock impacts. Restart this level.',true)}}
 tick(dt,input={}){
  if(this.state!=='running')return;dt=clamp(dt,0,.1);this.elapsed+=dt;this.time=Math.max(0,this.time-(this.training?0:dt));
  if(this.uncontrolled){this.tickRunaway(dt);return}
  if(!this.training){this.tickReproduction(dt);this.tickFouling(dt);}if(this.state!=='running')return;
  this.charging=this.atCharger();if(this.charging){this.battery=Math.min(100,this.battery+BATTERY_RECHARGE_RATE*dt);if(this.battery>25)this.lowBatteryWarned=false}else this.drainBattery(dt*.035);if(this.state!=='running')return;
  if(input.left||input.right||input.up||input.down)this.drainBattery(.18*dt);if(this.state!=='running')return;
  const turn=Number(!!input.left)-Number(!!input.right);this.yaw+=turn*1.35*dt;
  this.roll+=(turn*.20-this.roll)*(1-Math.exp(-5*dt));
  this.adjustPitch((Number(!!input.up)-Number(!!input.down))*1.05*dt);if(this.uncontrolled){this.tickRunaway(dt);return}
  const f=this.direction(),forward=Number(!!input.forward)-Number(!!input.back),side=Number(!!input.strafeRight)-Number(!!input.strafeLeft),vertical=Number(!!input.rise)-Number(!!input.sink);
  let dx=f.x*forward+Math.cos(this.yaw)*side,dy=f.y*forward+vertical,dz=f.z*forward-Math.sin(this.yaw)*side;
  const len=Math.hypot(dx,dy,dz);if(len>0){const travel=(input.boost?5.8:3.4)*this.motorEfficiency()*dt/Math.max(1,len);let p={x:this.pos.x+dx*travel,y:this.pos.y+dy*travel,z:this.pos.z+dz*travel};const horizontal=Math.hypot(p.x,p.z),edge=this.world.half*.88;if(horizontal>edge){p.x*=edge/horizontal;p.z*=edge/horizontal}
   const samples=rovSamples(p,f),bottom=Math.max(...samples.map(c=>this.world.floor(c.x,c.z)+.20-(c.y-p.y))),contact=p.y<=bottom;if(contact&&!this.onFloor)this.event('floor');this.onFloor=contact;p.y=clamp(p.y,bottom,-1.2);
   const contacts=this.world.rocks.filter(k=>rovSamples(p,f).some(c=>((c.x-k.x)/(k.r+ROV_RADIUS))**2+((c.y-k.y)/(k.r*.75+.20))**2+((c.z-k.z)/(k.r+ROV_RADIUS))**2<1));
   const coralContact=this.world.corals.some(c=>rovSamples(p,f).some(s=>Math.hypot(s.x-c.x,s.z-c.z)<c.r+ROV_RADIUS&&s.y>c.y-.2&&s.y<c.y+c.height+.2));if(coralContact){p={...this.pos};if(!this.touchingCoral)this.event('coralCollision')}this.touchingCoral=coralContact;
   if(contacts.length){for(const rock of contacts)this.collide(rock);p={...this.pos}}this.touchingRocks=new Set(contacts.map(k=>k.id));
   let moved=distance(this.pos,p),cost=moved*(input.boost?2.8:1.7);if(cost>this.budget&&cost>0){const ratio=this.budget/cost;p={x:this.pos.x+(p.x-this.pos.x)*ratio,y:this.pos.y+(p.y-this.pos.y)*ratio,z:this.pos.z+(p.z-this.pos.z)*ratio};moved*=ratio;cost=this.budget}this.pos=p;this.drainBattery(len*(input.boost?5.8:3.4)*dt/Math.max(1,len)*(input.boost?.8:.45));this.distance+=moved;this.spend(cost);
  }
  if(this.budget<=.001)this.fail('Mission budget exhausted.');else if(this.time<=0)this.fail('Mission time expired.');
 }
 observeMussels(dt,visibleIds){if(this.state!=='running')return;dt=clamp(dt,0,.1);for(const id of visibleIds){const m=this.world.mussels[id];if(!m||!m.alive||m.identified)continue;m.identifyProgress=Math.min(IDENTIFY_SECONDS,m.identifyProgress+dt);if(m.identifyProgress>=IDENTIFY_SECONDS-1e-8){m.identified=true;m.identifyProgress=IDENTIFY_SECONDS;if(m.species==='zebra')this.identifiedZebras++;else this.identifiedQuaggas++;this.event('identified',{id:m.id,species:m.species})}}}
 samplePreview(point=this.pos){const cells=[],r2=TOOLS.edna.radius**2;for(let i=0;i<this.world.waterCells.length;i++){if(this.sampledCells.has(i))continue;const c=this.world.waterCells[i];if((c.x-point.x)**2+(c.y-point.y)**2+(c.z-point.z)**2<=r2)cells.push(i)}return{cells,percent:cells.length/this.world.waterCells.length*100,volume:cells.length*this.world.cellVolume}}
 use(id=this.selected){
  if(this.state!=='running')return{ok:false,reason:'Start or resume your dive first.'};if(this.uncontrolled)return{ok:false,reason:'ROV out of control. Tools are offline.'};const tool=TOOLS[id];if(!tool)return{ok:false,reason:'Unknown tool.'};this.selected=id;
  if(this.elapsed<this.nextFire)return{ok:false,reason:'Tool cooling down.'};if(this.budget<tool.cost)return{ok:false,reason:'Not enough budget for '+tool.name+'.'};
  this.drainBattery(BATTERY_COST[id]);if(this.state!=='running')return{ok:false,reason:this.failure};
  this.spend(tool.cost);this.nextFire=this.elapsed+tool.cooldown;
  if(id==='edna'){const coverage=this.samplePreview();for(const i of coverage.cells)this.sampledCells.add(i);this.waterCoverage=this.sampledCells.size/this.world.waterCells.length*100;this.scans++;this.sampleLocations.push({...this.pos});const points=coverage.cells.length?Math.min(90,Math.round(coverage.percent*30)):0;this.sampleScore+=points;this.revealUntil=this.elapsed+40;const local=this.world.mussels.filter(c=>c.alive&&distance(c,this.pos)<=tool.radius),count=local.length,quaggaSignal=local.some(m=>m.species==='quagga');const babies=local.filter(m=>m.bornAt!=null&&this.elapsed-m.bornAt<36),babyCount=babies.length,babyQuaggas=babies.filter(m=>m.species==='quagga').length,babyZebras=babyCount-babyQuaggas;if(quaggaSignal)this.quaggaSignals++;else this.noQuaggaSignals++;this.sampleRecords.push({...this.pos,time:this.elapsed,quaggaSignal,babyCount,babyQuaggas,babyZebras,coverageGain:coverage.percent});this.event('scan',{count,babyCount,babyQuaggas,babyZebras,gain:coverage.percent,points,quaggaSignal});this.checkClear();if(this.budget<=0)this.fail('Mission budget exhausted.');return{ok:true,id,count,hit:false,gain:coverage.percent,coverage:this.waterCoverage,points,quaggaSignal,babyCount,babyQuaggas,babyZebras}}
  const field=this.preview(id),hits=[],killed=[],quaggaKilled=[],zebraKilled=[],damages=[];
  for(const m of field.hits){const amount=toolDamage(id,distance(this.pos,m));m.hp=Math.max(0,m.hp-amount);hits.push(m.id);damages.push({id:m.id,amount});if(m.hp<=.001){m.hp=0;m.alive=false;killed.push(m.id);if(m.species==='zebra'){this.zebrasRemoved++;zebraKilled.push(m.id)}else{this.cleared++;this.totalCleared++;quaggaKilled.push(m.id)}this.event('eliminate',{id:m.id,species:m.species||'quagga'})}}
  let penalty=0;for(const animal of field.wildlife){animal.hp=Math.max(0,animal.hp-(animal.kind==='fish'&&id!=='chemical'?animal.maxHp||100:tool.damage));if(animal.hp===0&&animal.alive){animal.alive=false;const loss=WILDLIFE_PENALTY[animal.kind]||2500;penalty+=loss;this.wildlifePenalty+=loss;this.wildlifeKilled++;this.event('wildlife',{kind:animal.kind,penalty:loss,id:animal.id})}}
  const result={ok:true,id,hit:hits.length>0,hits,killed,quaggaKilled,zebraKilled,damages,point:field.point,penalty};this.event('tool',result);this.checkClear();if(this.budget<=0)this.fail('Mission budget exhausted.');return result;
 }
 checkClear(){if(!this.training&&this.state==='running'&&this.cleared>=this.requiredMussels&&this.waterCoverage>=this.requiredCoverage){this.state='cleared';this.event('clear')}}
 fail(reason,explode=false){if(this.state!=='running'||this.training)return;this.failure=reason;this.exploded=explode;this.state='failed';this.event('fail',{reason,explode})}
 nextLevel(){if(this.state!=='cleared')return false;this.loadLevel(this.level+1);return true}
 ecosystemStatus(){
  const quaggas=this.world.mussels.filter(m=>m.species!=='zebra'),remaining=quaggas.filter(m=>m.alive).length,recovery=quaggas.length?1-remaining/quaggas.length:1;
  const fish=this.world.wildlife.filter(w=>w.kind==='fish'),fishAlive=fish.filter(w=>w.alive).length,fishVitality=fish.length?fish.reduce((sum,w)=>sum+(w.alive?clamp(w.hp/(w.maxHp||100),0,1):0),0)/fish.length:1;
  const habitat=this.world.wildlife.filter(w=>w.kind==='coral'||w.kind==='kelp'),habitatAlive=habitat.filter(w=>w.alive).length,habitatVitality=habitat.length?habitatAlive/habitat.length:1;
  // Arcade ecosystem index: invasive pressure limits recovery, while living fish and habitat set its ceiling.
  return{health:Math.round((25+75*recovery)*fishVitality*(.8+.2*habitatVitality)),recovery,fishTotal:fish.length,fishAlive,fishVitality,habitatTotal:habitat.length,habitatAlive,remainingQuaggas:remaining,totalQuaggas:quaggas.length};
 }
 get ecosystem(){return this.ecosystemStatus().health}
 score(){return Math.round(this.cleared*QUAGGA_POINTS+this.sampleScore+(this.state==='cleared'?this.budget*.4+this.time*2:0)-this.wildlifePenalty)}
}
root.ROVRules={MAX_CHARGER_LEG,connectChargers,PITCH_LIMIT,BATTERY_RECHARGE_RATE,ROV_LENGTH,ROV_RADIUS,ROV_HALF_SEGMENT,rovSamples,BATTERY_COST,IDENTIFY_SECONDS,QUAGGA_POINTS,frontierDistance,rockBedLift,visibleSegment,TOOLS,WILDLIFE_PENALTY,levelSettings,toolDamage,clamp,distance,rng,makeWorld,Game};
})(typeof module==='object'?module.exports:window);
