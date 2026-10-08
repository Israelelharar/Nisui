import fs from 'node:fs';
const TL = JSON.parse(fs.readFileSync(new URL('./timeline.json', import.meta.url)));
const S = (n) => `shots/${n}.png`;
const PH = (n) => `photos/${n}.webp`;
const WINE = '#C2385A', PINK = '#FF4F8B', BUTTER = '#FFE7B8', TEAL = '#17837D', PURPLE = '#6B4BC4', ORANGE = '#E8692C', NIGHT = '#15111F', GOLD = '#ffd36b', ICE = '#9fe8ff';
const pet = (sp) => ({ img: S(`sp-${sp}`) });
const WALL = ['home', 'letters', 'gallery', 'book', 'night', 'pet-room', 'dates', 'birthday', 'us', 'day100', 'note-open', 'pet-kitchen'].map(S);
const PHOTOS = ['sunset-beach', 'selfie', 'ferris-wheel', 'rain-umbrella', 'rooftop-stars'].map(PH);

export function spec(v) {
  const { lines, duration } = TL[v];
  const L = (i, f = 0) => Math.max(0, lines[i][0] - 0.12 + f * (lines[i][1] - lines[i][0]));
  let sc, hl = GOLD;
  if (v === '1') sc = [
    { t: 0, kind: 'ring', words: ['פתק כל בוקר', 'תמונות', 'הספר שלנו', 'חיה קטנה', 'עמוד לילה', 'הפתעות'], center: 'אתר שלם', sub: 'רק בשבילה', subAt: L(0, .62), accent: PINK, glow: '#4a1027' },
    { t: L(1), kind: 'block', bg: WINE, fg: '#fff', accent: GOLD, h1: ['פתק חדש', 'כל בוקר'], bgWord: 'בוקר', card: { img: S('note-open'), x: 260, y: 600, w: 600, h: 1040, scroll: 220, rot: -5 }, chips: [{ text: '07:30', x: 90, y: 700, at: .35, bg: GOLD, rot: -8 }, { text: 'נפתח לך היום 💌', x: 520, y: 1560, at: .55, rot: 4 }], streak: GOLD },
    { t: L(2), kind: 'block', bg: BUTTER, fg: '#1a1015', accent: WINE, h1: ['כל התמונות', 'שלכם'], photos: PHOTOS, in: 'wipe' },
    { t: L(3), kind: 'phone', bg: NIGHT, fg: '#fff', accent: '#7b8cff', accent2: GOLD, h1: ['הספר', 'של הסיפור שלכם'], img: S('book'), in: 'zoom' },
    { t: L(4), kind: 'block', bg: TEAL, fg: '#fff', accent: BUTTER, h1: ['חיה קטנה', 'שהיא מגדלת'], pet: pet('bunny'), bgWord: 'פופקורן' },
    { t: L(4, .5), kind: 'block', bg: PINK, fg: '#fff', accent: BUTTER, h1: ['מתנות', 'מהטלפון שלך'], card: { img: S('gift-900'), x: 240, y: 560, w: 600, h: 1060, scroll: 230, rot: 6 }, chips: [{ text: '+100 🥕 מתנה מיואב', x: 90, y: 1540, at: .35, bg: GOLD }], in: 'spin' },
    { t: L(5), kind: 'big', word: 'יום #', counter: [1, 365], color: GOLD, glow: '#5a1430', size: 250, streak: '#fff' },
    { t: L(6), kind: 'particles', text: 'לכל זוג', color: PINK, boomAt: 1.25 },
    { t: L(6, .72), kind: 'wall', imgs: WALL, h1: ['לזוגות', 'אחרים'], accent: GOLD, in: 'zoom' },
    { t: L(7), kind: 'end', noCap: true, streak: GOLD },
  ];
  if (v === '2') { hl = '#ff9cc0'; sc = [
    { t: 0, kind: 'big', word: 'מתנה?', color: '#ff7aa8', glow: '#4a1027', size: 320 },
    { t: L(0, .55), kind: 'ring', words: ['השם שלה', 'התמונות שלכם', 'פתק כל בוקר', 'יום הולדת', 'הפתעות', 'לתמיד'], center: 'שלא תשכח', accent: GOLD, glow: '#3a1022', in: 'zoom' },
    { t: L(1), kind: 'big', word: '7 ימים', color: '#b9a8b0', glow: '#221a20', size: 260, sub: 'וזה נובל 🥀' },
    { t: L(1, .72), kind: 'big', word: 'לתמיד', color: GOLD, glow: '#5a1430', size: 300, streak: GOLD },
    { t: L(2), kind: 'phone', bg: WINE, fg: '#fff', accent: GOLD, h1: ['בוקר אור,', 'נועה'], img: S('home') },
    { t: L(2, .38), kind: 'block', bg: BUTTER, fg: '#1a1015', accent: WINE, h1: ['התמונות', 'שלכם'], photos: PHOTOS, in: 'wipe' },
    { t: L(2, .72), kind: 'block', bg: PURPLE, fg: '#fff', accent: GOLD, h1: ['פתק ממך', 'כל בוקר'], card: { img: S('note-open'), x: 260, y: 600, w: 600, h: 1040, scroll: 220, rot: -5 }, in: 'spin' },
    { t: L(3), kind: 'phone', bg: ORANGE, fg: '#fff', accent: BUTTER, h1: ['יום הולדת', 'שמח 🎂'], img: S('birthday') },
    { t: L(3, .5), kind: 'phone', bg: TEAL, fg: '#fff', accent: BUTTER, h1: ['100 ימים', 'ביחד'], img: S('day100'), in: 'zoom' },
    { t: L(4), kind: 'particles', text: 'זוכר הכל', color: PINK, textTop: 1080 },
    { t: L(5), kind: 'phone', bg: PURPLE, fg: '#fff', accent: GOLD, h1: ['ואתה', 'מנהל הכל'], img: S('admin'), streak: GOLD },
    { t: L(6), kind: 'block', bg: PINK, fg: '#fff', accent: BUTTER, h1: ['הפתעות', 'בלחיצה'], card: { img: S('gift-900'), x: 240, y: 560, w: 600, h: 1060, scroll: 230, rot: 6 }, chips: [{ text: 'משנה ✏️', x: 80, y: 640, at: .15, bg: GOLD, rot: -6 }, { text: 'מוסיף ✨', x: 90, y: 860, at: .4, rot: 5 }, { text: 'שולח 🎁', x: 70, y: 1080, at: .65, bg: GOLD, rot: -4 }], in: 'spin' },
    { t: L(7), kind: 'end', noCap: true, streak: GOLD },
  ]; }
  if (v === '3') sc = [
    { t: 0, kind: 'big', word: '07:30', color: GOLD, glow: '#5a2a10', size: 300, sub: 'בוקר' },
    { t: L(1), kind: 'phone', bg: WINE, fg: '#fff', accent: GOLD, h1: ['היא פותחת', 'את האתר'], imgs: [S('welcome-500'), S('welcome-900'), S('welcome-1400'), S('welcome-end')], img: S('welcome-500'), streak: GOLD },
    { t: L(2), kind: 'phone', bg: ORANGE, fg: '#fff', accent: BUTTER, h1: ['בוקר אור,', 'נועה'], img: S('home'), in: 'spin' },
    { t: L(3), kind: 'block', bg: PURPLE, fg: '#fff', accent: GOLD, h1: ['פתק', 'חדש'], bgWord: 'פתק', card: { img: S('note-open'), x: 260, y: 600, w: 600, h: 1040, scroll: 220, rot: -5 }, chips: [{ text: '07:32', x: 90, y: 700, at: .3, bg: GOLD, rot: -8 }] },
    { t: L(4), kind: 'block', bg: BUTTER, fg: '#1a1015', accent: WINE, h1: ['תמונה', 'של היום'], photos: PHOTOS.slice(0, 3), chips: [{ text: '12:15', x: 90, y: 1580, at: .3, bg: WINE, fg: '#fff', rot: 6 }], in: 'wipe' },
    { t: L(5), kind: 'phone', bg: TEAL, fg: '#fff', accent: BUTTER, h1: ['פרק', 'חדש בספר'], img: S('book'), in: 'zoom' },
    { t: L(6), kind: 'phone', bg: NIGHT, fg: '#fff', accent: '#7b8cff', accent2: GOLD, h1: ['22:40', 'לילה טוב 🌙'], img: S('night'), streak: '#9fb6ff' },
    { t: L(7), kind: 'wall', imgs: WALL, h1: ['ומחר', 'משהו אחר'], accent: GOLD, in: 'zoom' },
    { t: L(8), kind: 'end', noCap: true, streak: GOLD },
  ];
  if (v === '4') { hl = ICE; sc = [
    { t: 0, kind: 'block', bg: TEAL, fg: '#fff', accent: BUTTER, h1: ['יש לה', 'ארנבון'], pet: pet('bunny'), bgWord: 'פופקורן' },
    { t: L(1), kind: 'big', word: 'לא אמיתי', color: ICE, glow: '#0f2a3a', size: 230 },
    { t: L(2), kind: 'phone', bg: ORANGE, fg: '#fff', accent: BUTTER, h1: ['הוא גר', 'באתר'], img: S('pet-room'), in: 'zoom' },
    { t: L(3), kind: 'phone', bg: PINK, fg: '#fff', accent: BUTTER, h1: ['מאכילה,', 'משחקת'], imgs: [S('pet-kitchen'), S('pet-play')], img: S('pet-kitchen'), in: 'spin' },
    { t: L(3, .72), kind: 'big', word: 'גדל!', color: GOLD, glow: '#5a2a10', size: 320 },
    { t: L(4), kind: 'big', word: 'ואני?', color: PINK, glow: '#4a1027', size: 300 },
    { t: L(5), kind: 'phone', bg: PURPLE, fg: '#fff', accent: GOLD, h1: ['מתנות', 'מהטלפון'], img: S('admin-pet'), streak: GOLD },
    { t: L(6), kind: 'block', bg: WINE, fg: '#fff', accent: GOLD, h1: ['דינג!', 'מתנה מיואב'], card: { img: S('gift-900'), x: 240, y: 560, w: 600, h: 1060, scroll: 230, rot: 6 }, chips: [{ text: '+100 🥕', x: 90, y: 700, at: .25, bg: GOLD, rot: -8 }], in: 'spin' },
    { t: L(7), kind: 'block', bg: TEAL, fg: '#fff', accent: BUTTER, h1: ['ארנבון', ''], pet: pet('bunny') },
    { t: L(7, .3), kind: 'block', bg: ORANGE, fg: '#fff', accent: BUTTER, h1: ['חתול', ''], pet: pet('cat'), in: 'wipe' },
    { t: L(7, .55), kind: 'block', bg: PURPLE, fg: '#fff', accent: BUTTER, h1: ['כלבלב', ''], pet: pet('dog'), in: 'spin' },
    { t: L(7, .8), kind: 'block', bg: PINK, fg: '#fff', accent: BUTTER, h1: ['שרקן', ''], pet: pet('guineaPig'), in: 'zoom' },
    { t: L(8), kind: 'end', noCap: true, streak: GOLD },
  ]; }
  sc.forEach((s, i) => { s.dur = (sc[i + 1]?.t ?? duration) - s.t; });
  return { lines, duration, scenes: sc, hl };
}
