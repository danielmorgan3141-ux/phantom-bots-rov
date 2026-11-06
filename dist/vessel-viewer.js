/* Interactive equipment inspection, using the user’s Phantom Bots reference at one metre overall. */
(function(root){
'use strict';const T=root.THREE,V=root.LakeVisuals;
class VesselViewer{
 constructor(canvas,host,onSelect){
  this.canvas=canvas;this.host=host;this.onSelect=onSelect;this.yaw=-.7;this.pitch=.24;this.distance=1.3;this.active=false;this.drag=null;this.cutaway=true;
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;
  this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(40,1,.01,30);this.scene.add(new T.HemisphereLight(0xd8fff2,0x294958,2.5));for(const [x,y,z,color,power] of [[-2,3,-2,0xe6fff1,3],[2,1,2,0x67d8f0,2]]){const l=new T.DirectionalLight(color,power);l.position.set(x,y,z);this.scene.add(l)}
  const reference=buildPhantomVessel();this.rov=reference.model;this.equipment=reference.equipment;this.scene.add(this.rov);this.hull=this.rov.userData.hull;this.internal=this.rov.userData.internal;
  this.boxes=[];this.setCutaway(true);this.select(0);
  canvas.addEventListener('pointerdown',e=>{this.drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!this.drag||e.pointerId!==this.drag.id)return;this.yaw+=(e.clientX-this.drag.x)*.009;this.pitch=Math.max(-1.2,Math.min(1.2,this.pitch+(e.clientY-this.drag.y)*.008));this.drag.x=e.clientX;this.drag.y=e.clientY});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>this.drag=null);
  canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(e.deltaY>0?1.1:.9)},{passive:false});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Home'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')this.yaw-=.15;if(e.key==='ArrowRight')this.yaw+=.15;if(e.key==='ArrowUp')this.pitch=Math.min(1.2,this.pitch+.1);if(e.key==='ArrowDown')this.pitch=Math.max(-1.2,this.pitch-.1);if(e.key==='+'||e.key==='=')this.zoom(.9);if(e.key==='-')this.zoom(1.1);if(e.key==='Home')this.reset()});
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);
 }
 setCutaway(value){this.cutaway=value;this.internal.visible=value;this.hull.visible=!value;for(const part of this.rov.userData.cutawayPanels)part.visible=value;for(const cover of this.rov.userData.covers)cover.visible=!value;for(const box of this.boxes)box.visible=!this.equipment[this.selected].internal||value}
 select(index){this.selected=index;for(const box of this.boxes){this.scene.remove(box);box.geometry.dispose();box.material.dispose()}this.boxes=[];this.rov.updateMatrixWorld(true);for(const object of this.equipment[index].objects){if(!object)continue;const box=new T.BoxHelper(object,0xb6f6d4);box.visible=!this.equipment[index].internal||this.cutaway;this.scene.add(box);this.boxes.push(box)}this.onSelect?.(this.equipment[index],index)}
 zoom(factor){this.distance=Math.max(.9,Math.min(3,this.distance*factor))}
 reset(){this.yaw=-.7;this.pitch=.24;this.distance=1.3}
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix()}
 start(){if(this.active)return;this.active=true;this.resize();let previous=performance.now();const frame=now=>{if(!this.active)return;const dt=Math.min((now-previous)/1000,.05);previous=now;const distance=this.distance*Math.max(1,.8/this.camera.aspect);this.camera.position.set(Math.sin(this.yaw)*Math.cos(this.pitch)*distance,Math.sin(this.pitch)*distance,-Math.cos(this.yaw)*Math.cos(this.pitch)*distance);this.camera.lookAt(0,0,0);for(const p of this.rov.userData.props){if(p.userData.vertical)p.rotation.y+=dt*2;else p.rotation.z+=dt*2}this.renderer.render(this.scene,this.camera);const pos=this.rov.userData.body.localToWorld(new T.Vector3(...this.equipment[this.selected].anchor)).project(this.camera);const label=this.host.querySelector('.vessel-pin');if(label){label.style.left=Math.max(8,Math.min(92,(pos.x*.5+.5)*100))+'%';label.style.top=Math.max(8,Math.min(88,(-pos.y*.5+.5)*100))+'%';label.textContent=this.equipment[this.selected].name+(!this.cutaway&&this.equipment[this.selected].internal?' (inside)':'')}requestAnimationFrame(frame)};requestAnimationFrame(frame)}
 stop(){this.active=false;this.drag=null}
}
root.VesselViewer=VesselViewer;
})(window);
