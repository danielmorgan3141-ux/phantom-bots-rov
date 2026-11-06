/* Original procedural visual models inspired by the public Lake-Patrol reference.
 * This module changes appearance and animation only; mission rules remain in engine.js.
 * Reference: https://github.com/penguinyou88/Lake-Patrol
 */
(function(root){
'use strict';
const T=root.THREE,TAU=Math.PI*2;
const smooth=(dt,k)=>1-Math.exp(-dt*k),limit=(x,a,b)=>Math.max(a,Math.min(b,x));
const standard=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.55,...extra});
function part(parent,geometry,material,position=[0,0,0],name=''){const m=new T.Mesh(geometry,material);m.position.set(...position);m.name=name;parent.add(m);return m}
function paintedTexture(kind){const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');
 if(kind==='hull'){
  // Keep the hull clean: capsule UVs distort lettering and panel-line decals.
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,256);
 }else{
  const gradient=ctx.createLinearGradient(0,0,512,0);gradient.addColorStop(0,'#6d7334');gradient.addColorStop(.28,'#a9a955');gradient.addColorStop(.52,'#dcd29d');gradient.addColorStop(.75,'#b5ad65');gradient.addColorStop(1,'#626f36');ctx.fillStyle=gradient;ctx.fillRect(0,0,512,256);
  for(let i=0;i<7;i++){const y=32+i*30;ctx.fillStyle='#344d31aa';ctx.beginPath();ctx.moveTo(0,y-7);ctx.bezierCurveTo(165,y-3,355,y-10,512,y-5);ctx.lineTo(512,y+7);ctx.bezierCurveTo(350,y+13,160,y+6,0,y+9);ctx.closePath();ctx.fill()}
  ctx.strokeStyle='#f3e5b730';ctx.lineWidth=.8;for(let row=0;row<24;row++)for(let col=0;col<42;col++){ctx.beginPath();ctx.arc(col*13+(row%2)*6,row*12,5,0,Math.PI);ctx.stroke()}
 }
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return tex;
}
function hullTexture(){return paintedTexture('hull')}
function perchTexture(){return paintedTexture('perch')}
function buildROV({hullMap=null}={}){
 const root=new T.Group(),body=new T.Group();root.name='Phantom survey ROV';root.add(body);
 const white=standard(0xe5eee9,{map:hullMap,metalness:.42,roughness:.3}),dark=standard(0x203846,{metalness:.7,roughness:.32}),orange=standard(0xed9140,{metalness:.2}),cyan=standard(0x5cdbe9,{emissive:0x2196b0,emissiveIntensity:.8,metalness:.4}),glass=new T.MeshPhysicalMaterial({color:0x14475b,metalness:.5,roughness:.1,clearcoat:1,transparent:true,opacity:.87});
 const hull=part(body,new T.CapsuleGeometry(.55,2.3,10,28),white,[0,0,0],'paneled hull');hull.rotation.x=Math.PI/2;
 part(body,new T.BoxGeometry(.24,.10,1.55),dark,[0,.54,.12],'dorsal equipment spine');
 for(const side of [-1,1]){part(body,new T.BoxGeometry(.035,.06,1.85),cyan,[side*.54,.08,0],'cyan side strip');part(body,new T.BoxGeometry(.07,.075,2.6),dark,[side*.6,-.61,.05],'landing skid');part(body,new T.BoxGeometry(.065,.4,.12),dark,[side*.6,-.41,.75]);part(body,new T.BoxGeometry(.065,.4,.12),dark,[side*.6,-.41,-.7])}
 const dome=part(body,new T.SphereGeometry(.5,24,16),glass,[0,.01,-1.25],'camera dome');dome.scale.set(1,1,.68);
 const lens=part(body,new T.CylinderGeometry(.13,.13,.15,20),dark,[0,.015,-1.6]);lens.rotation.x=Math.PI/2;const cameraGlass=part(body,new T.CircleGeometry(.095,20),cyan,[0,.015,-1.685],'nose camera lens');cameraGlass.rotation.y=Math.PI;
 const tail=part(body,new T.ConeGeometry(.37,.58,24),orange,[0,0,1.7],'orange tail cone');tail.rotation.x=Math.PI/2;
 for(let i=0;i<4;i++){const frame=new T.Group();frame.position.z=1.4;frame.rotation.z=i*Math.PI/2+Math.PI/4;const fin=part(frame,new T.BoxGeometry(.055,.57,.46),orange,[0,.52,0],'tail fin');fin.rotation.x=-.12;body.add(frame)}
 const props=[];
 for(const side of [-1,1]){
  const pod=new T.Group();pod.position.set(side*.91,-.02,.5);body.add(pod);part(pod,new T.BoxGeometry(.38,.08,.16),dark,[-side*.2,0,0]);part(pod,new T.TorusGeometry(.26,.064,10,28),dark,[0,0,0],'thruster duct');part(pod,new T.TorusGeometry(.26,.018,6,28),cyan,[0,0,-.05],'illuminated thruster rim');
  const rotor=new T.Group();rotor.name='three-blade rotor';for(let j=0;j<3;j++){const b=part(rotor,new T.BoxGeometry(.43,.045,.045),white);b.rotation.z=j*TAU/3}part(rotor,new T.SphereGeometry(.075,12,8),dark);pod.add(rotor);props.push(rotor);
 }
 for(const z of [-.55,.7]){const housing=part(body,new T.TorusGeometry(.15,.04,8,20),dark,[0,.57,z],'vertical thruster');housing.rotation.x=Math.PI/2;const rotor=part(body,new T.BoxGeometry(.23,.025,.04),white,[0,.59,z]);rotor.userData.vertical=true;props.push(rotor)}
 const tool=part(body,new T.CylinderGeometry(.08,.13,.63,16),dark,[0,-.5,-1.13],'under-nose intervention nozzle');tool.rotation.x=Math.PI/2;
 const tip=new T.Object3D();tip.position.set(0,-.5,-1.49);body.add(tip);const toolGlow=part(body,new T.TorusGeometry(.084,.018,6,16),cyan,[0,-.5,-1.47],'tool indicator');
 for(const side of [-1,1]){const lamp=part(body,new T.CylinderGeometry(.105,.12,.17,16),dark,[side*.39,-.13,-1.15]);lamp.rotation.x=Math.PI/2;const face=part(body,new T.CircleGeometry(.081,16),new T.MeshBasicMaterial({color:0xe5fff1}),[side*.39,-.13,-1.24],'headlamp');face.rotation.y=Math.PI}
 const led=part(body,new T.SphereGeometry(.065,10,8),new T.MeshBasicMaterial({color:0x8ef4c5}),[0,.61,.42],'status light');
 const foulingShells=[],foulMat=standard(0x94866b,{roughness:.78});for(let i=0;i<20;i++){const side=i%2?1:-1,a=i*2.399,patch=new T.Group();patch.position.set(side*.91+Math.cos(a)*.23,Math.sin(a)*.23,.46+(i%3)*.035);patch.rotation.z=a;for(const half of [-1,1]){const shell=part(patch,new T.SphereGeometry(.05,10,8),foulMat,[half*.018,0,0],'attached zebra juvenile');shell.scale.set(.6,.75,1.35)}patch.visible=false;body.add(patch);foulingShells.push(patch)}
 root.userData={body,props,foulingShells,toolTip:tip,toolGlow,led,roll:0,pulse:0,pulseColor:new T.Color(0x70deff),thrust:0};
 // One world unit is one metre; preserve every part's original proportions.
 const dimensions=new T.Box3().setFromObject(root).getSize(new T.Vector3());root.scale.setScalar(1/dimensions.z);root.userData.lengthMeters=1;return root;
}
function buildPilotTools(){
 const g=new T.Group(),white=standard(0xe6eee9,{metalness:.38,roughness:.3}),dark=standard(0x233d49,{metalness:.65,roughness:.3}),lit=standard(0x5ad8e4,{emissive:0x1498b3,emissiveIntensity:.6}),jaws=[],tips=[];
 for(const side of [-1,1]){
  const tool=new T.Group();tool.position.set(side*.62,-.48,-1.23);tool.rotation.y=side*-.10;g.add(tool);part(tool,new T.BoxGeometry(.19,.17,.63),white,[0,0,.05],'pilot tool housing');part(tool,new T.BoxGeometry(.025,.025,.38),lit,[side*.1,.03,.05]);const barrel=part(tool,new T.CylinderGeometry(.055,.07,.48,12),dark,[0,-.02,-.48]);barrel.rotation.x=Math.PI/2;part(tool,new T.TorusGeometry(.06,.012,6,16),lit,[0,-.02,-.725]);
  if(side===-1)for(const sign of [-1,1]){const joint=new T.Group();joint.position.set(sign*.065,-.01,-.58);const finger=part(joint,new T.BoxGeometry(.035,.07,.27),dark,[0,0,-.12]);finger.rotation.y=-sign*.18;tool.add(joint);jaws.push({joint,sign})}
  const tip=new T.Object3D();tip.position.set(0,-.02,-.77);tool.add(tip);tips.push(tip);
 }
 const vial=part(g,new T.CylinderGeometry(.045,.045,.24,12),new T.MeshPhysicalMaterial({color:0x95d7ce,transparent:true,opacity:.55,roughness:.1}),[-.49,-.37,-1.18],'eDNA cartridge');vial.rotation.z=-.2;
 g.userData={jaws,tips,pulse:0,lit,toolId:'hydro',vial};return g;
}
function finShape(points){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return new T.ShapeGeometry(shape)}
function buildPerch({map=null}={}){
 const g=new T.Group(),skin=standard(0xffffff,{map,roughness:.43,metalness:.12}),fin=standard(0xc59a4a,{side:T.DoubleSide,transparent:true,opacity:.8,roughness:.65}),darkFin=standard(0x6a7138,{side:T.DoubleSide,roughness:.7});g.name='Yellow perch';
 const bodyGeo=new T.SphereGeometry(.5,24,16);bodyGeo.rotateX(Math.PI/2);bodyGeo.scale(.34,.47,1.14);part(g,bodyGeo,skin,[0,0,0],'barred perch body');
 const tail=new T.Group();tail.position.z=.48;g.add(tail);const tailMesh=part(tail,finShape([[0,0],[.35,.26],[.24,.08],[.15,0],[.24,-.08],[.35,-.26]]),fin,[0,0,0],'forked caudal fin');tailMesh.rotation.y=-Math.PI/2;
 const dorsal=part(g,finShape([[0,0],[.05,.12],[.11,.06],[.17,.2],[.23,.13],[.29,.24],[.35,.15],[.43,.14],[.47,0]]),darkFin,[0,.18,-.21],'spiny dorsal fin');dorsal.rotation.y=-Math.PI/2;
 const pectorals=[];for(const side of [-1,1]){const f=part(g,finShape([[0,0],[.18,-.06],[.25,-.17],[.04,-.12]]),fin,[side*.15,-.025,-.16],'pectoral fin');f.rotation.y=side*Math.PI/2;pectorals.push({mesh:f,side});const iris=part(g,new T.SphereGeometry(.042,12,8),standard(0xc6b976),[side*.128,.055,-.415],'eye iris');iris.scale.z=.7;part(g,new T.SphereGeometry(.025,10,8),standard(0x10212a,{roughness:.15}),[side*.151,.058,-.42],'pupil')}
 const belly=part(g,new T.SphereGeometry(.2,16,10),standard(0xd5c99d),[0,-.11,-.23],'pale lower jaw');belly.scale.set(.62,.5,1.16);
 g.userData={tail,pectorals,body:g.children[0]};return g;
}
// Sculpted fish share the perch's fin and tail rig, with distinct silhouettes and markings.
function buildFish({map=null,species='perch'}={}){
 if(species==='perch')return buildPerch({map});
 const g=buildPerch({map:null}),u=g.userData,body=u.body;
 const palettes={bluegill:[0x82a8a0,0xceb879,0x587d85],trout:[0xb5c6b2,0xe3d8ba,0x718d83],pike:[0x8b9e65,0xd7d4a9,0x71834d]};const colors=palettes[species]||palettes.bluegill;
 g.name={bluegill:'Bluegill sunfish',trout:'Lake trout',pike:'Northern pike'}[species];body.material.color.setHex(colors[0]);
 const geo=body.geometry,positions=geo.attributes.position;
 for(let i=0;i<positions.count;i++){const z=positions.getZ(i);const color=new T.Color(colors[z<-.3?0:1]).lerp(new T.Color(colors[0]),Math.max(0,Math.min(1,positions.getY(i)*2+.6)));if(!geo.attributes.color)geo.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(positions.count*3),3));geo.attributes.color.setXYZ(i,color.r,color.g,color.b)}body.material.vertexColors=true;
 if(species==='bluegill'){g.scale.set(1.35,1.5,.88);for(const side of [-1,1]){const cheek=part(g,new T.SphereGeometry(.052,16,10),standard(0x243f49),[side*.15,.025,-.26],'dark blue gill cover');cheek.scale.set(.22,1,1.25)}}
 if(species==='trout'){g.scale.set(.93,.87,1.28);for(let i=0;i<32;i++){const z=-.32+(i%8)*.095+Math.sin(i*3.7)*.025,y=-.03+Math.floor(i/8)*.052+Math.sin(i*7.1)*.018,side=i%2?1:-1;const spot=part(g,new T.SphereGeometry(.014,8,6),standard(0x405d55),[side*.155,y,z],'trout speckle');spot.scale.x=.3}for(const side of [-1,1]){const stripe=part(g,new T.SphereGeometry(.5,20,12),standard(0xb58c92,{transparent:true,opacity:.4}),[side*.13,.005,0],'rose lateral stripe');stripe.scale.set(.035,.06,.85)}}
 if(species==='pike'){g.scale.set(.83,.8,1.65);const snout=part(g,new T.SphereGeometry(.17,20,12),standard(colors[0]),[0,-.015,-.48],'long tapered pike snout');snout.scale.set(.65,.52,1.3);for(let i=0;i<24;i++){const side=i%2?1:-1,z=-.3+(i%6)*.12,y=-.08+Math.floor(i/6)*.055+Math.sin(i*4.1)*.018;const mark=part(g,new T.SphereGeometry(.025,8,6),standard(0xc8cf9c),[side*.15,y,z],'pale pike markings');mark.scale.set(.2,.4,1)}}
 g.userData.species=species;return g;
}
function createSchool(center,rand){return{center:{...center},rx:3+rand()*2.5,rz:2.8+rand()*2.8,speed:.10+rand()*.06,phase:rand()*TAU,dir:rand()<.5?-1:1}}
function buildGrass(rand){
 const g=new T.Group(),count=24+Math.floor(rand()*10),geometry=new T.PlaneGeometry(.095,1,1,8);geometry.translate(0,.5,0);const p=geometry.attributes.position;for(let i=0;i<p.count;i++){const t=p.getY(i);p.setX(i,p.getX(i)*(1-t*.88));p.setZ(i,Math.sin(t*Math.PI)*.07)}geometry.computeVertexNormals();
 const material=standard(rand()<.5?0x527c43:0x709154,{roughness:.75,side:T.DoubleSide}),phase=rand()*TAU;
 material.onBeforeCompile=shader=>{shader.uniforms.modelTime={value:0};shader.uniforms.modelPhase={value:phase};shader.vertexShader='uniform float modelTime;\nuniform float modelPhase;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat leafTip = position.y * position.y;\nfloat bladePhase = modelPhase + instanceMatrix[3].x*2.7 + instanceMatrix[3].z*1.9;\ntransformed.x += sin(modelTime*1.15 + bladePhase)*.17*leafTip;\ntransformed.z += cos(modelTime*.9 + bladePhase)*.11*leafTip;');material.userData.windUniforms=shader.uniforms};
 const blades=new T.InstancedMesh(geometry,material,count),dummy=new T.Object3D();blades.name='current-swept ribbon grass';for(let i=0;i<count;i++){const a=rand()*TAU,r=Math.sqrt(rand())*.52;dummy.position.set(Math.cos(a)*r,0,Math.sin(a)*r);dummy.rotation.set((rand()-.5)*.3,rand()*TAU,(rand()-.5)*.3);dummy.scale.set(.8+rand()*.5,.7+rand()*1.35,1);dummy.updateMatrix();blades.setMatrixAt(i,dummy.matrix)}blades.instanceMatrix.needsUpdate=true;g.add(blades);g.userData={windMaterial:material,blades};return g;
}
function buildBuoy(){const g=new T.Group();part(g,new T.CylinderGeometry(.36,.48,.44,20),standard(0xe4ede6,{metalness:.25}),[0,0,0]);part(g,new T.TorusGeometry(.42,.07,8,24),standard(0xee9441),[0,-.04,0]).rotation.x=Math.PI/2;part(g,new T.CylinderGeometry(.025,.03,.95,8),standard(0x354f58),[0,.65,0]);const lamp=part(g,new T.SphereGeometry(.07,12,8),new T.MeshBasicMaterial({color:0x74e6f0}),[0,1.15,0]);g.userData={lamp,baseY:-.28};return g}
function fireVisual(rov,arms,id,color){rov.userData.pulse=1;rov.userData.pulseColor.setHex(color);arms.userData.pulse=1;arms.userData.toolId=id;arms.userData.lit.color.setHex(color);arms.userData.lit.emissive.setHex(color)}
function animateVehicle(rov,arms,dt,time,input){
 const u=rov.userData,amount=input.moving?1:0;u.thrust+=(amount-u.thrust)*smooth(dt,7);u.pulse=Math.max(0,u.pulse-dt*3.6);const bank=limit(-input.turn*.16-input.strafe*.13,-.25,.25);if(Number.isFinite(input.roll))u.roll=input.roll;else u.roll+=(bank-u.roll)*smooth(dt,5);u.body.rotation.z=u.roll;u.body.position.y=Math.sin(time*1.3)*.015;for(const p of u.props){if(p.userData.vertical)p.rotation.y+=(.7+u.thrust*22)*(input.motorEfficiency??1)*dt;else p.rotation.z+=(.9+u.thrust*30)*(input.motorEfficiency??1)*(input.reverse?-1:1)*dt}u.toolGlow.material.color.copy(u.pulseColor);u.toolGlow.material.emissive.copy(u.pulseColor);u.toolGlow.material.emissiveIntensity=.4+u.pulse*2;u.led.material.color.setHex(input.impacts>=3?0xffa26b:0x89efca);
 for(let i=0;i<u.foulingShells.length;i++)u.foulingShells[i].visible=i<Math.ceil((input.fouling||0)/5);
 const a=arms.userData;a.pulse=Math.max(0,a.pulse-dt*5);arms.position.y=Math.sin(time*1.3)*.007;arms.position.z=a.pulse*.035;for(const jaw of a.jaws)jaw.joint.rotation.y=jaw.sign*(a.toolId==='scraper'?.12+Math.sin(time*27)*a.pulse*.25:.1);a.lit.emissiveIntensity=.45+a.pulse*1.8;
}
function fadeGroup(group,tint,opacity){group.traverse(o=>{if(!o.isMesh)return;const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){if(m.color)m.color.lerp(tint,.06);m.transparent=true;m.opacity=opacity}})}
function animateOrganism(w,dt,time,player,world){
 const g=w.group;if(!w.entity.alive){w.deathAge=(w.deathAge||0)+dt;g.visible=w.deathAge<3.3;if(w.kind==='fish'){g.rotation.z+=(Math.PI-g.rotation.z)*smooth(dt,2);g.position.y=Math.min(-.55,g.position.y+dt*.23)}else{g.scale.y=Math.max(.2,1-w.deathAge*.22)}fadeGroup(g,new T.Color(0x69746f),Math.max(0,1-w.deathAge/3.3));return}
 g.visible=true;if(w.stationary){for(const b of g.userData.branches||[])b.pivot.rotation.z=Math.sin(time*.85+b.phase)*.025;const uniforms=g.userData.windMaterial?.userData.windUniforms;if(uniforms)uniforms.modelTime.value=time;return}
 const tempo=w.recovery==null?1:.65+.35*w.recovery;w.swimTime=(w.swimTime||0)+dt*tempo;const s=w.school,t=w.swimTime*s.speed*s.dir+s.phase-w.lag;const desired=new T.Vector3(s.center.x+Math.cos(t)*s.rx+w.offset.x,s.center.y+Math.sin(t*1.8)*.4+w.offset.y,s.center.z+Math.sin(t)*s.rz+w.offset.z);
 const away=new T.Vector3().subVectors(g.position,new T.Vector3(player.x,player.y,player.z)),d=away.length();if(d<4.2&&d>.01)w.flee.addScaledVector(away.normalize(),(4.2-d)*dt*2.1);w.flee.multiplyScalar(Math.exp(-dt*.85));desired.add(w.flee);
 const radius=Math.hypot(desired.x,desired.z),edge=world.half*.79;if(radius>edge){desired.x*=edge/radius;desired.z*=edge/radius}
 for(const r of world.rocks){const delta=desired.clone().sub(new T.Vector3(r.x,r.y,r.z)),dist=delta.length();if(dist<r.r+.65&&dist>.01)desired.addScaledVector(delta.normalize(),r.r+.65-dist)}desired.y=limit(desired.y,Math.min(-1.05,world.floor(desired.x,desired.z)+1.0),-1.0);
 const previous=g.position.clone();g.position.lerp(desired,smooth(dt,2.8));g.position.y=Math.max(g.position.y,Math.min(-1.0,world.floor(g.position.x,g.position.z)+.8));const v=g.position.clone().sub(previous);w.velocity.lerp(v.clone().multiplyScalar(1/Math.max(dt,.001)),smooth(dt,5));if(w.velocity.lengthSq()>.0001){g.rotation.order='YXZ';g.rotation.y=Math.atan2(-w.velocity.x,-w.velocity.z);g.rotation.x=Math.atan2(w.velocity.y,Math.hypot(w.velocity.x,w.velocity.z));g.rotation.z=Math.sin(time*.9+w.phase)*.045}
 w.wag+=dt*(7+w.velocity.length()*2.7)*tempo;g.userData.tail.rotation.y=Math.sin(w.wag)*.38;for(const f of g.userData.pectorals)f.mesh.rotation.z=f.side*(.15+Math.sin(w.wag*.7)*.12);
}
function buildCoral(rand){
 const g=new T.Group(),branches=[],palette=[0xd98779,0xa59ac7,0xd2aa71,0x87afaa],color=new T.Color(palette[Math.floor(rand()*palette.length)]),material=standard(color,{roughness:.67}),tipMat=standard(color.clone().lerp(new T.Color(0xffe9d0),.45),{roughness:.6});
 // Tapered tubes follow curved centerlines, with smooth normals and no angular joints.
 function branch(parent,points,radius,mat=material){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),geo=new T.TubeGeometry(curve,12,radius,8,false),a=geo.attributes.position;
  for(let j=0;j<=12;j++){const t=j/12,center=curve.getPointAt(t),taper=1-t*.45;for(let k=0;k<=8;k++){const i=j*9+k;a.setXYZ(i,center.x+(a.getX(i)-center.x)*taper,center.y+(a.getY(i)-center.y)*taper,center.z+(a.getZ(i)-center.z)*taper)}}geo.computeVertexNormals();const mesh=part(parent,geo,mat,undefined,'curved coral branch'),end=curve.getPoint(1);part(parent,new T.SphereGeometry(radius*.55,10,8),mat,[end.x,end.y,end.z],'rounded coral tip');return mesh}
 const fan=rand()<.45,count=fan?5:7;
 for(let i=0;i<count;i++){const pivot=new T.Group();g.add(pivot);const angle=i/count*TAU+rand()*.35,x=fan?(i/(count-1)-.5)*1.2:Math.cos(angle)*.24,z=fan?(rand()-.5)*.1:Math.sin(angle)*.24,h=.65+rand()*.3;branch(pivot,[[fan?0:x*.3,0,z*.3],[x*.5,h*.3,z*.65],[x,h*.68,z],[x*1.45,h,z*1.35]],.075);
  for(let j=0;j<4;j++){const t=.35+j*.14,side=j%2?1:-1,dx=fan?side*.18:Math.cos(angle+side*.9)*.2,dz=fan?(rand()-.5)*.045:Math.sin(angle+side*.9)*.2,base=[x*t,t*h,z*t],end=[x*t+dx,t*h+.22+rand()*.1,z*t+dz];branch(pivot,[base,[base[0]+dx*.35,base[1]+.12,base[2]+dz*.35],end],.037);branch(pivot,[end,[end[0]+dx*.12,end[1]+.045,end[2]+dz*.12],[end[0]+dx*.16,end[1]+.06,end[2]+dz*.16]],.018,tipMat)}branches.push({pivot,phase:rand()*TAU})}
 const base=part(g,new T.SphereGeometry(.3,20,12),material,[0,.035,0],'encrusting coral base');base.scale.set(1,.2,1);const bounds=new T.Box3().setFromObject(g),growth=new T.Group();for(const child of [...g.children])growth.add(child);growth.scale.y=1/bounds.max.y;g.add(growth);g.userData.branches=branches;return g;
}

root.LakeVisuals={hullTexture,perchTexture,buildROV,buildPilotTools,buildPerch,buildFish,createSchool,buildGrass,buildCoral,buildBuoy,fireVisual,animateVehicle,animateOrganism};
})(typeof globalThis!=='undefined'?globalThis:window);
