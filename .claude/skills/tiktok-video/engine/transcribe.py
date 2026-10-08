import sherpa_onnx, soundfile as sf, numpy as np, json, glob, os, subprocess, re
d='sherpa-onnx-whisper-turbo/'
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=d+'turbo-encoder.int8.onnx', decoder=d+'turbo-decoder.int8.onnx', tokens=d+'turbo-tokens.txt', language='he', task='transcribe', num_threads=8)
out={}
for f in sorted(glob.glob('audio/*.wav')):
    log = subprocess.run(['ffmpeg','-i',f,'-af','silencedetect=noise=-35dB:d=0.13','-f','null','-'],capture_output=True,text=True).stderr
    starts=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',log)]
    ends=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',log)]
    audio, sr = sf.read(f, dtype='float32'); dur=len(audio)/sr
    # speech segments = gaps between silences
    segs=[]; t=0.0
    sil=list(zip(starts,ends+[dur]*(len(starts)-len(ends))))
    for s,e in sil:
        if s-t>0.15: segs.append((t,s))
        t=e
    if dur-t>0.15: segs.append((t,dur))
    res=[]
    for a,b in segs:
        st=rec.create_stream(); st.accept_waveform(sr, audio[int(max(0,a-0.25)*sr):int(min(dur,b+0.35)*sr)]); rec.decode_stream(st)
        res.append([round(a,2),round(b,2),st.result.text.strip()])
    out[os.path.basename(f)]=res
    print('==',os.path.basename(f),round(dur,1))
    for r in res: print(' ',r)
json.dump(out,open('segs.json','w'),ensure_ascii=False,indent=1)
