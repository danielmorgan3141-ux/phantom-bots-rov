/* Generate neural male narration locally. No text is sent to a speech service.
 * Setup: npm install --prefix .narration-runtime kokoro-js@1.2.1
 * Model and voice: Kokoro-82M (Apache-2.0), https://github.com/hexgrad/kokoro
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtimeRequire=createRequire(path.join(root,'.narration-runtime/package.json'));
const transformersModule=await import(pathToFileURL(runtimeRequire.resolve('@huggingface/transformers')));
const env=transformersModule.env||transformersModule.default.env;
env.cacheDir=path.join(root,'.narration-runtime/models');
const kokoroModule=await import(pathToFileURL(runtimeRequire.resolve('kokoro-js')));
const KokoroTTS=kokoroModule.KokoroTTS||kokoroModule.default.KokoroTTS;
const c={window:{}};vm.runInNewContext(await fs.readFile(path.join(root,'dist/facts.js'),'utf8'),c);
const facts=c.window.LAKE_FACTS,profile='kokoro-michael-neural-v1',voice='am_michael';
console.log('Loading local neural speech model (first run downloads model files)...');
const tts=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'fp32',device:'cpu',progress_callback:p=>{if(p.status==='done')console.log('Model ready: '+p.file)}});
function spokenText(text){return text.replace(/\bR-?O-?V\b/g,'are oh vee').replace(/\beDNA\b/g,'ee dee en ay')}
function writeWav(samples,rate){const b=Buffer.alloc(44+samples.length*2);b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples.length*2,40);for(let i=0;i<samples.length;i++)b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),44+i*2);return b}
const prior={window:{}};try{vm.runInNewContext(await fs.readFile(path.join(root,'dist/radio-clips.js'),'utf8'),prior)}catch{}
const existing=prior.window.LAKE_RADIO_CLIPS||[];
const entries=[];
for(let i=0;i<facts.length;i++){
 const text=facts[i],src='audio/neural-'+String(i+1).padStart(2,'0')+'-'+createHash('sha256').update(profile+text).digest('hex').slice(0,8)+'.wav';
 const cached=existing[i];if(cached?.profile===profile&&cached.text===text&&cached.src===src){try{await fs.access(path.join(root,'dist',src));entries.push(cached);continue}catch{}}
 // Sentence chunks prevent long facts from being cut off at the model token limit.
 const sentences=spokenText(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[spokenText(text)],chunks=[];
 for(const sentence of sentences){const audio=await tts.generate(sentence.trim(),{voice,speed:1});chunks.push(audio.audio,new Float32Array(2400))}
 const length=chunks.reduce((n,a)=>n+a.length,0),samples=new Float32Array(length);let offset=0;for(const chunk of chunks){samples.set(chunk,offset);offset+=chunk.length}
 await fs.writeFile(path.join(root,'dist',src),writeWav(samples,24000));entries.push({profile,text,src,duration:length/24000});console.log('Rendered natural male fact '+(i+1)+'/'+facts.length);
}
await fs.writeFile(path.join(root,'dist/radio-clips.js'),'/* Locally generated neural male narration: Kokoro-82M, am_michael. */\nwindow.LAKE_RADIO_CLIPS='+JSON.stringify(entries)+';\n');
await fs.copyFile(path.join(root,'dist',entries[0].src),path.join(root,'natural-neural-voice-preview.wav'));
console.log('Neural narration manifest and preview saved.');
