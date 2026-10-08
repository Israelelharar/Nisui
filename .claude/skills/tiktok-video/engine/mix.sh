#!/bin/bash
v=$1
ffmpeg -v error -y -i voice$v.m4a -i music$v.wav -i sfx$v.wav -filter_complex \
"[0:a]aresample=48000,asplit=2[vo][key];[1:a]volume=0.45[m];[m][key]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=300:makeup=1[md];[2:a]volume=0.55[s];[vo][md][s]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14:TP=-1.2:LRA=11[out]" \
-map "[out]" -ar 48000 -c:a aac -b:a 192k mix$v.m4a
