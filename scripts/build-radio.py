"""Legacy system-voice renderer. Use build-neural-facts.mjs for the current natural narration."""
from pathlib import Path
import array,json,math,random,subprocess,tempfile,wave
ROOT=Path(__file__).resolve().parents[1]
PROFILE='natural-male-facts-v6'
facts=json.loads(subprocess.check_output(['node','-e',"const fs=require('fs'),vm=require('vm'),c={window:{}};vm.runInNewContext(fs.readFileSync('dist/facts.js','utf8'),c);process.stdout.write(JSON.stringify(c.window.LAKE_FACTS))"],cwd=ROOT))
existing_path=ROOT/'dist'/'radio-clips.js'
existing=[]
if existing_path.exists():
 existing=json.loads(existing_path.read_text().split('window.LAKE_RADIO_CLIPS=',1)[1].rstrip(';\n'))
entries=[]
with tempfile.TemporaryDirectory() as tmp:
 for i,text in enumerate(facts):
  if i<len(existing) and existing[i]['text']==text and existing[i].get('profile')==PROFILE and (ROOT/'dist'/existing[i]['src']).exists():
   entries.append(existing[i]);continue
  raw=Path(tmp)/'voice.aiff';pcm=Path(tmp)/'voice.wav';txt=Path(tmp)/'fact.txt';spoken=text.replace('eDNA','E D N A').replace('R-O-V','are oh vee').replace('ROV','are oh vee')
  txt.write_text(spoken)
  subprocess.run(['say','-v','Daniel','-r','178','-f',str(txt),'-o',str(raw)],check=True)
  subprocess.run(['afconvert','-f','WAVE','-d','LEI16@22050',str(raw),str(pcm)],check=True)
  with wave.open(str(pcm),'rb') as f:
   assert f.getnchannels()==1
   samples=array.array('h',f.readframes(f.getnframes()));rate=f.getframerate()
  # Fuller male narration with only a light communications filter.
  hp=1/(1+2*math.pi*90/rate);lp=1-math.exp(-2*math.pi*4500/rate);prev=high=high2=prevhigh=low=low2=0.;filtered=[]
  for value in samples:
   x=value/32768;high=hp*(high+x-prev);prev=x;high2=hp*(high2+high-prevhigh);prevhigh=high;low+=lp*(high2-low);low2+=lp*(low-low2);filtered.append(x*.75+low2*.25)
  peak=max(max(map(abs,filtered)),.01);rand=random.Random(91+i);out=array.array('h')
  def append(v):out.append(round(max(-.95,min(.95,v))*32767))
  for j in range(int(rate*.035)):
   envelope=math.sin(math.pi*j/(rate*.035))**2;append((rand.uniform(-1,1)*.025)*envelope)
  # Keep the male voice at its natural pitch.
  pitch=1.0
  for j in range(int((len(filtered)-1)/pitch)):
   position=j*pitch;index=int(position);blend=position-index
   v=filtered[index]*(1-blend)+filtered[index+1]*blend
   append(math.tanh(v/peak*1.1)*.90+rand.uniform(-1,1)*.0007)
  for j in range(int(rate*.035)):
   envelope=(1-j/(rate*.035))**2;append(rand.uniform(-1,1)*.02*envelope)
  import hashlib
  name=f'fact-{i+1:02}-{hashlib.sha256((PROFILE+text).encode()).hexdigest()[:8]}.wav'
  with wave.open(str(ROOT/'dist'/'audio'/name),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes(out.tobytes())
  entries.append({'profile':PROFILE,'text':text,'src':'audio/'+name,'duration':len(out)/rate})
  print(f'Rendered radio fact {i+1}/{len(facts)}',flush=True)
(ROOT/'dist'/'radio-clips.js').write_text('/* Generated local radio narration; regenerate with scripts/build-radio.py. */\nwindow.LAKE_RADIO_CLIPS='+json.dumps(entries)+';\n')
