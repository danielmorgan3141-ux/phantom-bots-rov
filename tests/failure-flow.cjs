const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {ROVRules:R}=require('../dist/engine.js');
const source=fs.readFileSync(require.resolve('../dist/app.js'),'utf8');
function fn(name){const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?source.indexOf('\nif(init())',start):end)}
function setup(){const g=new R.Game(12);g.start();g.events=[];let starts=0,results=0;const node={textContent:'',classList:{add(){},remove(){}}};const c={tutorial:null,game:g,keys:new Set(),document:{hidden:false},requestAnimationFrame(){},lastTime:0,lastHud:0,performance:{now:()=>0},narrator:{stop(){},setPaused(){},tick(){}},$:()=>node,toast(){},updateHUD(){},updateTutorial(){},updateTutorialPointers(){},updateCamera(){},observeVisible(){},animateWorld(){},renderer:{render(){}},scene:{},camera:{},visualTime:0,explosionAge:-1,impactUntil:0,penaltyUntil:0};c.startExplosion=()=>{starts++;c.explosionAge=0};c.showResult=()=>{results++};vm.createContext(c);vm.runInContext(fn('fire')+'\n'+fn('processEvents')+'\n'+fn('frame'),c);return{g,c,starts:()=>starts,results:()=>results}}
for(const cause of ['tool','look','idle','rock','runaway']){const t=setup();t.g.battery=.001;
 if(cause==='tool'){t.c.fire('hydro');assert.equal(t.g.state,'failed')}
 if(cause==='look')t.g.look(20,0);
 if(cause==='runaway'){t.g.battery=100;t.g.pos={x:0,y:-5,z:0};t.g.world.half=3;t.g.world.floor=()=>-100;t.g.world.rocks=[];t.g.world.corals=[];t.g.pitch=Math.PI/2+.05;t.g.loseControl(1)}
 if(cause==='rock'){t.g.impacts=4;t.g.elapsed=5;t.g.collide({id:99})}
 for(let frame=1;frame<=65;frame++)t.c.frame(frame*50);
 assert.equal(t.g.state,'failed',cause);assert.equal(t.starts(),1,cause+' must trigger exactly one explosion');assert.equal(t.results(),1,cause+' must open the defeat screen after the explosion');
}
console.log('PASS: tool, mouse-look, idle battery depletion , fifth rock impact, and vertical runaway all reach the defeat screen after one explosion.');
