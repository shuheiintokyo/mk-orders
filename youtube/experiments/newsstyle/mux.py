import json,sys,os,numpy as np,soundfile as sf,subprocess
d=os.path.join(os.path.dirname(os.path.abspath(__file__)),'out')+'/'; tl=json.load(open(d+'timeline.json'))
v,sr=sf.read(d+'voice.wav'); m,_=sf.read(d+'music.wav')
if v.ndim>1: v=v.mean(1)
if m.ndim>1: m=m.mean(1)
n=max(len(v),len(m)); mix=np.zeros(n); mix[:len(v)]+=v; mix[:len(m)]+=m
# sting: soft swell into a bell-like chord hit (synthesised)
st=[l for l in tl['lines'] if l['shot']=='sting'][0]['start']
T=np.arange(int(sr*2.6))/sr; sw=np.zeros_like(T)
for f in (220,277.2,329.6,440):
    sw+=np.sin(2*np.pi*f*T+2*np.sin(2*np.pi*f*2*T)*np.exp(-T*3))
env=np.where(T<.35,(T/.35)**2,np.exp(-(T-.35)*2.2)); sw*=env
noise=np.random.default_rng(1).standard_normal(len(T)); noise=np.convolve(noise,np.ones(40)/40,'same')*np.where(T<.35,T/.35,0)*np.exp(-T*1.5)
s=(sw/4+noise*.6)*.18; i=int((st-.25)*sr); mix[i:i+len(s)]+=s[:max(0,n-i)]
sf.write(d+'mix.wav',mix,sr)
for vid,out in [(sys.argv[1],sys.argv[2])]:
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',vid,'-i',d+'mix.wav','-af','loudnorm=I=-14:TP=-1.5','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-shortest',out],check=True)
