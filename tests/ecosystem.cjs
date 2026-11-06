const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');const {ROVRules:R}=require('../dist/engine.js');
const game=new R.Game(42);game.start();game.pos={x:0,y:-5,z:0};game.pitch=game.yaw=0;game.world.floor=()=>-12;
game.world.mussels=Array.from({length:10},(_,i)=>({id:i,species:'quagga',x:i?20:0,y:-5,z:-2,hp:100,maxHp:100,alive:true}));game.world.wildlife=Array.from({length:4},(_,i)=>({id:i,kind:'fish',x:20,y:-5,z:0,hp:100,maxHp:100,alive:true}));
const nodes=new Map();function $(id){if(!nodes.has(id))nodes.set(id,{textContent:'',style:{},attributes:{},classes:new Set(),setAttribute(k,v){this.attributes[k]=v},classList:{toggle(k,v){if(v)nodes.get(id).classes.add(k);else nodes.get(id).classes.delete(k)}}});return nodes.get(id)}
const source=fs.readFileSync(require.resolve('../dist/app.js'),'utf8'),start=source.indexOf('function updateEcosystemHUD('),end=source.indexOf('\nfunction ',start+1),context={game,R,$,performance:{now:()=>10},penaltyUntil:0};vm.createContext(context);vm.runInContext(source.slice(start,end),context);
context.updateEcosystemHUD();assert.equal(game.ecosystem,25);assert.equal($('ecoState').textContent,'STRESSED');assert.equal($('ecoLosses').textContent,'4 / 4 fish alive');
game.use('hydro');assert(game.ecosystem>25,'Actual removal improves the ecosystem immediately');assert.equal(game.ecosystemStatus().remainingQuaggas,9);
for(const m of game.world.mussels)m.alive=false;assert.equal(game.ecosystem,100,'Full removal with all fish surviving gives full recovery');context.updateEcosystemHUD();assert.equal($('ecoRecovery').textContent,'100% quaggas removed · recovery');assert.equal($('ecoState').textContent,'HEALTHY');
// Actual population and vitality, not a fixed subtraction per kill.
game.world.wildlife[0].alive=false;game.world.wildlife[0].hp=0;context.updateEcosystemHUD();assert.equal(game.ecosystem,75);assert.equal($('ecoValue').textContent,'75%');assert.equal($('ecoBar').style.width,'75%');assert.equal($('ecoTrack').attributes['aria-valuenow'],'75');assert.equal($('ecoLosses').textContent,'3 / 4 fish alive');
game.world.wildlife[1].hp=50;assert(game.ecosystem<75,'Fish vitality is represented even before death');for(const f of game.world.wildlife){f.alive=false;f.hp=0}assert.equal(game.ecosystem,0);context.updateEcosystemHUD();assert.equal($('ecoState').textContent,'NO FISH REMAIN');
// Equal survival fractions behave equally for different fish populations.
function population(total){game.world.wildlife=Array.from({length:total},(_,i)=>({kind:'fish',alive:i>=total/2,hp:i>=total/2?100:0,maxHp:100}));return game.ecosystem}
assert.equal(population(4),population(40));assert.equal(population(40),50);
game.world.wildlife.push({kind:'coral',alive:false,hp:0});assert(game.ecosystem<50,'Destroyed native habitat reduces recovery potential');
const before=game.ecosystem;game.world.mussels.push({species:'zebra',alive:false});assert.equal(game.ecosystem,before,'Zebra removal does not replace this mission’s quagga objective');game.loadLevel(1);assert.equal(game.ecosystem,25);assert.equal(game.ecosystemStatus().recovery,0);
console.log('PASS: stressed start, actual quagga removal drives recovery, fish survival and vitality determine health proportionally, habitat loss matters, HUD updates, and new levels reset invasion pressure.');
