---
name: tiktok-video
description: The owner's standing settings for making TikTok / Reels marketing videos (vertical 1080x1920, Hebrew, his own voice-over, fast "crazy" motion-graphics edit built around the product's real screens). Use whenever asked to make, edit or redo a promo / marketing / TikTok / Reels / Shorts video, or to write a script for one.
---

# TikTok videos, the owner's way

The owner approved this workflow and look on 2026-10-09 for the couple-site videos. Use it as the default for every
promo video unless he asks otherwise. Talk to him in Hebrew only.

## 1. Order of work
1. **Script first.** Write 3–5 short scripts (20–40s each) in natural spoken Hebrew, in his voice, first person.
   - Hook in the first line.
   - Close with "הקישור בביו".
   - Save them to `סרטונים/תסריטים.md` with "מה לומר" and "מה רואים" for each.
   - Ask him to record each one separately and send the files.
   - Ask whether to show a price. **His answer so far: no price in videos.** "בהודעה פרטית".
2. **He records, I edit.** His own voice is the voice-over. Never replace it with TTS unless he asks.
3. Videos go to a folder named **`סרטונים`** in the product repo, together with `פוסטים.md`, which holds a caption and
   hashtags per video plus upload tips. Send the mp4s with SendUserFile.

## 2. Contact details (end card and post captions)
- WhatsApp: **054-6631352**, link https://wa.me/972546631352
- Or a DM on TikTok.
- Never put a price in a video.

## 3. The look: a fast "crazy" edit, always about the product
His reference was a fast motion-graphics reel. Keep **every** shot about the product: real screenshots, real features.
- **Cuts:** one every ~1–1.5s, on spoken-line starts and mid-line.
  - Every cut gets a camera shake, a white flash, a 3–4 frame RGB/hue glitch with skew, and sometimes a light streak
    wiping across.
- **Full-bleed color blocks** in the product's palette, changing every cut. For the couple site: wine `#C2385A`, pink
  `#FF4F8B`, butter `#FFE7B8`, teal `#17837D`, purple `#6B4BC4`, orange `#E8692C`, night `#15111F`, gold glow `#ffd36b`.
- **Scene vocabulary** (`engine/stage.html`):
  - `ring`: 3D rotating cylinder of feature words around a glowing center title. Use it for the hook.
  - `block`: color block, huge headline sliding in, plus one of:
    - a screenshot card flying in, in 3D
    - a fan of polaroids
    - a round pet portrait with an elastic pop
    - sticker chips ("07:30", "+100 מתנה מ…")
  - `phone`: a 3D phone rising with the real screen, headline on top.
  - `big`: one giant glowing word with a chromatic punch. It can count up ("יום 1 → 365").
  - `particles`: ~1400 dots forming a heart, beating, then exploding.
  - `wall`: a 3D tilted wall of 25 product screens ("לזוגות אחרים").
  - `end`: the seal, fireworks, "אתר משלכם / עם הסיפור שלכם" and the WhatsApp number. No captions on the end card.
- **Type:**
  - Secular One for the giant words.
  - Playpen Sans Hebrew (hand) for the second line.
  - Frank Ruhl Libre 900 where needed.
  - All fonts come from @fontsource files (OFL).
- **Captions:** always on, because people watch muted.
  - 2–3 words at a time, Secular One 84px, white with a thick dark stroke.
  - The spoken word is highlighted in gold, or ice-blue for the pet video.
  - Placed around y≈1270–1490.
- **Safe zones:**
  - Nothing important in the top 150px or the bottom ~380px.
  - Keep clear of the right edge, where TikTok's buttons are.
- **Pets / characters always with open eyes.** Shoot several frames and pick open-eyed ones. He rejected a
  blinking/squinting shot.
- Earlier, calmer version (paper, phone mockup, gentle pans, `stage.html` of v1) was "cute" but not enough. Default to the
  crazy edit.

## 4. Sound
- His voice:
  - High-pass 80Hz, light denoise, compression, loudnorm −14 LUFS.
  - Cut flubs and repeats.
  - Tighten pauses to ~0.3s between lines.
- **Beat and SFX are synthesized by me, never downloaded** (no copyright risk) — `engine/music.py`:
  - The beat: 128bpm, Am–F–C–G, kick/clap/hats, off-beat bass, a little pluck.
  - On every cut: a whoosh into it, then a sub-boom plus crack.
  - On the end card: sparkles.
- Mix (`engine/mix.sh`):
  - Music at 0.45, side-chain ducked under the voice.
  - SFX at 0.55.
  - Final loudnorm −14 LUFS, TP −1.2.
- Tell him to listen before posting (sound can't be heard in the sandbox). He can also add TikTok-library music in the app
  at ~10%.

## 5. Copyright
- Only original or open-licensed material: our own drawings and screenshots, OFL fonts, ISC/MIT code, public-domain tunes.
- No memes, no movie characters, no brand names or logos, and no downloaded music or stock.
- Use a made-up demo couple / demo data, never real private people.

## 6. Pipeline (engine/)
Work in a scratch folder. Copy `engine/*` and `fonts/` (woff2 from `node_modules/@fontsource/{secular-one,
frank-ruhl-libre,playpen-sans-hebrew,assistant}`) next to `shots/` (screenshots) and `photos/`.

1. **Screenshots.**
   - Run the product (`npm run dev`) and take Playwright shots at 400×860, `deviceScaleFactor: 3` (1200×2580).
   - Shoot every state needed: welcome, home, notes, gallery, book, night, birthday (`?at=`), pet rooms per species
     (`?species=`), gift opening, admin.
2. **Transcribe** to find which file is which and where each line sits.
   - Hugging Face is blocked from the sandbox. Use the sherpa-onnx Whisper **turbo** model from GitHub releases
     (`k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-turbo.tar.bz2`), with
     `pip install sherpa-onnx soundfile numpy scipy` in a venv.
   - `transcribe.py` splits on silence (ffmpeg silencedetect) and transcribes each piece.
   - `transcribe_range.py file:a:b` checks a range.
3. `plan.json`: per video, the source file prefix and `lines: [[[[start,end],…], "the script text for captions"], …]`
   (skip flubbed ranges). Then run `audio.py <recordings dir>`. It writes `voiceN.m4a` and `timeline.json` with the new
   line times.
4. `specs.mjs` (see `specs.example.mjs`): the scenes per video, timed with `L(line, fraction)`.
5. `node render.mjs N still t1 t2 …` renders contact-sheet stills. Look at them before the full render.
6. `node render.mjs N video` renders 30fps JPEG frames and writes `cutsN.json`. Run the 4 videos in parallel.
7. `python music.py N`, then `./mix.sh N`.
8. Encode:
   ```bash
   ffmpeg -framerate 30 -i f2_N/%05d.jpg -i mixN.m4a -c:v libx264 -preset slow -crf 18 \
     -pix_fmt yuv420p -c:a copy -shortest -movflags +faststart out.mp4
   ```
9. Check a tile sheet of the final mp4 (`fps=1.5,scale=180:320,tile=8x4`), then send the files and commit them to
   `סרטונים/`.
