---
name: web-polish
description: Standing rules for any website or web UI work - make it feel premium and handmade, never like "AI slop". Use before designing, restyling or adding any page, component, game or interaction, and before calling visual work done.
---

# Premium, handmade, never "AI slop"

These always apply to tthe site. Run through them while
designing and again before calling visual work done.

## 1. Research first
For any big visual or feature request, search the web for how the best products in that
genre do it (for example Animal Crossing, Neko Atsume or Finch for a cozy pet game). Apply
what you find, and cite the sources in the reply.

## 1b. When the owner chooses between looks, show a picker page
Always do it for design choices (themes, palettes, layouts, styles):
- Publish one artifact page that shows every option as a **real phone screen of the site** in
  that look, with real-looking content and the bottom bar. Not color chips or a written list.
- Number and name each option. Give each a one-line description and a light/dark plus glass/paper tag.
  Mark the current look and the one asked for with a badge.
- **Tap to pick, up to N.** Show a dots counter in a sticky bottom bar. Add a button that copies
  "בחרתי את ערכות: 2 (…), 4 (…)" so it can be pasted back.
- Include any must-have named, such as a light-blue theme.

## 2. Avoid the AI tells
- **No emoji as UI icons.** Draw SVG icons in one consistent style for the product. Emoji
  are fine inside text and content, not as buttons or labels.
- **No uniform grids** of identical cards or tiles. Create hierarchy: one big primary
  thing, smaller secondary ones, and varied sizes.
- **No default look:**
  - No purple-to-blue gradients.
  - No Inter-only typography. Pair a display face with a body face.
  - No `rounded-2xl shadow-lg` cards everywhere.
  - No colored left-border strips.
  - No tiny tracked-out uppercase "eyebrows".
  - No 01/02/03 numbering.
  - No cream-and-terracotta "tasteful default".
- **No identical fade-in on every element.** Motion must have a purpose.
- **Take the look from the product's own materials.** For a pet: wood shelves, a hutch
  card, polaroids, water glasses. Ask whether a design decision would fit any random site;
  if yes, rethink it.
- **Add small imperfection and texture:** slight rotations, tape, a dashed rule, faint
  film grain. Keep it subtle.
- **Write specific, warm, personal copy** in Hebrew. No generic marketing lines.
- **Cover every state:** visible keyboard focus, disabled, empty, loading and error.

## 3. Make it feel premium ("juice")
- **Every press gets feedback.** Use a small eased movement, a soft sound and a haptic tap.
  `src/lib/haptics.ts` `tap()` works on Android, and on iPhone through the hidden native
  switch trick.
- **Sound:**
  - Route everything through one master bus with gentle compression and a little reverb.
  - Vary pitch ±3% per play.
  - Use bell or soft timbres, never harsh beeps.
  - Collecting several things in a row climbs a scale.
  - A character "speaks" in small blips, animalese style.
  - Always provide mute.
- **Big moments get a ceremony:** a dimmed stage, slowly turning light, a medallion, rising
  bells. Small events get small notes.
- **Restraint:**
  - Slow, smooth spring motion.
  - Numbers count up.
  - Gold foil shimmer only on what is valuable (coins, XP).
  - Respect `prefers-reduced-motion`.

## 4. Verify before shipping
- Run `npm run build` and confirm it passes.
- Take Playwright screenshots at phone width (400px) and look at them. Chromium lives at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- Check that the console shows no errors.
- Say plainly what could not be tested in the sandbox: real sound, iPhone haptics, the
  microphone, the Vercel API.
