const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../dist'),c={window:{}};for(const f of ['facts.js','radio-clips.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const facts=c.window.LAKE_FACTS,clips=c.window.LAKE_RADIO_CLIPS;assert.equal(clips.length,facts.length);assert(facts[0].startsWith('R-O-V stands'));
for(const [i,clip] of clips.entries()){
 assert.equal(clip.text,facts[i]);assert(clip.profile.startsWith('kokoro-'),'Use the neural narrator, not the old system voice');const wav=fs.readFileSync(path.join(root,clip.src));assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');assert.equal(wav.readUInt16LE(22),1);assert.equal(wav.readUInt32LE(24),24000);assert.equal(wav.readUInt16LE(34),16);assert.equal(wav.readUInt32LE(40),wav.length-44);const duration=(wav.length-44)/48000;assert(Math.abs(duration-clip.duration)<.0001);assert(duration>1);let peak=0;for(let j=44;j<wav.length;j+=2)peak=Math.max(peak,Math.abs(wav.readInt16LE(j)));assert(peak>1000,'Speech must not be silent');
}
console.log('PASS: all '+clips.length+' neural recordings are valid non-silent mono WAVs with matching captions and durations; R-O-V is written as letters.');
