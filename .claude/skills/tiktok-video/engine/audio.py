import json, subprocess, numpy as np, soundfile as sf, glob
import sys
U=sys.argv[1] if len(sys.argv)>1 else './recordings/'
plan=json.load(open('plan.json')); SR=48000
PRE, POST, GAP_MAX, LINE_GAP = 0.07, 0.16, 0.12, 0.30
tl={}
for vid,v in plan.items():
    src=glob.glob(U+v['src']+'*.m4a')[0]
    subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-ac','1','-ar',str(SR),f'raw{vid}.wav'],check=True)
    a,_=sf.read(f'raw{vid}.wav',dtype='float32')
    out=[np.zeros(int(0.35*SR),dtype='float32')]; t=0.35; lines=[]; fade=int(0.012*SR)
    for li,(segs,text) in enumerate(v['lines']):
        if li: out.append(np.zeros(int(LINE_GAP*SR),dtype='float32')); t+=LINE_GAP
        ls=t
        for si,(s,e) in enumerate(segs):
            if si: out.append(np.zeros(int(GAP_MAX*SR),dtype='float32')); t+=GAP_MAX
            c=a[int(max(0,s-PRE)*SR):int(min(len(a)/SR,e+POST)*SR)].copy()
            c[:fade]*=np.linspace(0,1,fade); c[-fade:]*=np.linspace(1,0,fade)
            out.append(c); t+=len(c)/SR
        lines.append([round(ls,3),round(t-POST*0.6,3),text])
    out.append(np.zeros(int(1.6*SR),dtype='float32')); t+=1.6
    sf.write(f'cut{vid}.wav',np.concatenate(out),SR)
    subprocess.run(['ffmpeg','-v','error','-y','-i',f'cut{vid}.wav','-af','highpass=f=80,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-14:TP=-1.5:LRA=9','-ar','48000','-c:a','aac','-b:a','192k',f'voice{vid}.m4a'],check=True)
    tl[vid]={'duration':round(t,3),'lines':lines}
    print(vid, round(t,1),'s')
json.dump(tl,open('timeline.json','w'),ensure_ascii=False,indent=1)
