import sherpa_onnx, soundfile as sf, sys
d='sherpa-onnx-whisper-turbo/'
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=d+'turbo-encoder.int8.onnx', decoder=d+'turbo-decoder.int8.onnx', tokens=d+'turbo-tokens.txt', language='he', task='transcribe', num_threads=8)
for spec in sys.argv[1:]:
    f,a,b=spec.split(':'); a=float(a); b=float(b)
    au,sr=sf.read(f'audio/{f}.wav',dtype='float32')
    import numpy as np
    x=np.concatenate([au[int(a*sr):int(b*sr)], np.zeros(sr,dtype='float32')])
    st=rec.create_stream(); st.accept_waveform(sr,x); rec.decode_stream(st); print(spec, '|', st.result.text)
