import json,sys,numpy as np,soundfile as sf
import os; Y=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'../..')); sys.path.insert(0,Y+'/pipeline')
from kokoro_onnx import Kokoro
from music import music_track
SR=24000; FPS=30
k=Kokoro(Y+'/.models/kokoro-v1.0.onnx',Y+'/.models/voices-v1.0.bin')
V={'A':('af_heart',0.95),'B':('am_michael',0.98)}
sc=json.load(open('script.json'))
aud=[np.zeros(int(0.4*SR),np.float32)]; t=0.4; out=[]; env={'A':[], 'B':[]}
spk_track={'A':[],'B':[]}
for l in sc['lines']:
    if l['sp']=='-':
        d=l['pause']; aud.append(np.zeros(int(d*SR),np.float32)); out.append({**l,'start':t,'end':t+d}); t+=d; continue
    s,_=k.create(l['en'],voice=V[l['sp']][0],speed=V[l['sp']][1],lang='en-us'); s=s.astype(np.float32)
    out.append({**l,'start':round(t,3),'end':round(t+len(s)/SR,3)}); aud.append(s); t+=len(s)/SR
    g=np.zeros(int(0.35*SR),np.float32); aud.append(g); t+=0.35
aud.append(np.zeros(int(1.5*SR),np.float32)); total=t+1.5
v=np.concatenate(aud); sf.write('out/voice.wav',v,SR)
# per-frame mouth envelope per speaker
n=int(total*FPS); hop=SR//FPS; m={'A':[0]*n,'B':[0]*n}
for l in out:
    if l['sp']=='-': continue
    for f in range(int(l['start']*FPS), min(n,int(l['end']*FPS))):
        seg=v[f*hop:(f+1)*hop]; r=float(np.sqrt(np.mean(seg**2))) if len(seg) else 0
        m[l['sp']][f]=round(min(1,r*9),3)
tm={'total':total,'scenes':[{'start':0,'end':total,'lines':[{'start':l['start'],'end':l['end']} for l in out if l['sp']!='-']}]}
sf.write('out/music.wav',music_track(total,tm,['cards'],SR,level_db=-33),SR)
json.dump({'total':round(total,3),'fps':FPS,'lines':out,'mouth':m},open('out/timeline.json','w'),ensure_ascii=False)
print(total)
