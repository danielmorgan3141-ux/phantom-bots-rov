const assert=require('node:assert/strict');
const {FactNarrator}=require('../dist/narration.js');
class Utterance{constructor(text){this.text=text}}
const spoken=[],captions=[];let paused=0,resumed=0;
const speech={speak:u=>spoken.push(u),cancel(){},pause(){paused++},resume(){resumed++}};
const n=new FactNarrator({facts:['First test fact.','Second test fact.','Third test fact.'],speech,Utterance,onFact:f=>captions.push(f.text)});
n.start();assert.equal(spoken.length,1);assert.equal(captions[0],'First test fact.');n.tick(100);assert.equal(spoken.length,1,'Real speech advances only on completion');spoken[0].onend();assert.equal(spoken.length,2,'Next fact begins directly inside completion callback');assert.equal(captions[1],'Second test fact.');n.setPaused(true);assert.equal(paused,1);n.setPaused(false);assert.equal(resumed,1);
const stale=spoken[1];n.start();stale.onend();assert.equal(n.index,0,'A canceled utterance must not advance a new dive');n.setMuted(true);let index=n.index;n.setPaused(true);n.tick(100);assert.equal(n.index,index);n.setPaused(false);n.tick(100);assert.equal(n.index,index+1);n.setMuted(false);assert.equal(spoken.at(-1).text,'Second test fact.');spoken.at(-1).onerror();n.tick(100);assert.equal(n.index,2);n.stop();assert(!n.active);
const empty=new FactNarrator({facts:[],speech,Utterance});empty.start();assert(!empty.active);
console.log('PASS: synchronized captions, immediate sequential speech, pause/resume, restart cancellation, mute, speech-error fallback, and empty fact list.');
const {preferredNarrationVoice}=require('../dist/narration.js');
const natural={name:'Microsoft Aria Online (Natural)',lang:'en-US'};
assert.equal(preferredNarrationVoice([{name:'eSpeak',lang:'en-US'},natural,{name:'Default',lang:'en-US'}]),natural);
assert.equal(preferredNarrationVoice([{name:'French Natural',lang:'fr-FR'}]),undefined);
console.log('PASS: natural English voices preferred over robotic/default voices.');
class RadioAudio{constructor(src){this.src=src;this.played=0;this.paused=0}play(){this.played++;return Promise.resolve()}pause(){this.paused++}}
const radio=new FactNarrator({facts:['Radio one','Radio two'],speech,Utterance,Audio:RadioAudio,clips:[{text:'Radio one',src:'one.wav',duration:3},{text:'Radio two',src:'two.wav',duration:4}]});
radio.start();assert.equal(radio.audio.src,'one.wav');const first=radio.audio;radio.tick(999);assert.equal(radio.index,0,'Radio clips advance on audio completion, not a guessed timer');radio.setPaused(true);assert.equal(first.paused,1);radio.setPaused(false);assert.equal(first.played,2);first.onended();assert.equal(radio.audio.src,'two.wav');radio.setMuted(true);assert.equal(radio.audio,null);assert(radio.fallback);radio.setMuted(false);assert.equal(radio.audio.src,'two.wav');radio.audio.onerror();assert.equal(radio.audio,null);assert(radio.fallback);radio.stop();assert(!radio.active);
console.log('PASS: radio playback, sequential completion, pause/resume, mute, and audio-error fallback.');

const acronym=new FactNarrator({facts:['R-O-V stands for remotely operated vehicle. ROV uses eDNA.'],speech,Utterance});acronym.start();assert.equal(spoken.at(-1).text,'are oh vee stands for remotely operated vehicle. are oh vee uses ee dee en ay.');acronym.stop();console.log('PASS: R-O-V, ROV, and eDNA are spoken as letter names in fallback narration.');
