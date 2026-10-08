/**
 * A tiny ZIP writer with no dependencies, used twice: at build time
 * (vite.config.ts packs the whole project into /backup/project-source.zip)
 * and in the admin's browser (the backup button adds today's data to that zip).
 */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipInput {
  name: string;
  data: Uint8Array;
  /** The same bytes, raw-deflated, when the caller can compress (Node at build time). */
  deflated?: Uint8Array;
}

const enc = new TextEncoder();

function dosTime(d: Date) {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

/** Local headers + data for each file, and the matching central directory records. */
function encode(files: ZipInput[], startOffset: number, when = new Date()) {
  const { time, date } = dosTime(when);
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = startOffset;
  for (const f of files) {
    const name = enc.encode(f.name);
    const useDeflate = !!f.deflated && f.deflated.length < f.data.length;
    const body = useDeflate ? f.deflated! : f.data;
    const crc = crc32(f.data);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8 names (Hebrew)
    lv.setUint16(8, useDeflate ? 8 : 0, true);
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, body.length, true);
    lv.setUint32(22, f.data.length, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, useDeflate ? 8 : 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, body.length, true);
    cv.setUint32(24, f.data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);

    locals.push(local, body);
    centrals.push(central);
    offset += local.length + body.length;
  }
  return { locals, centrals, end: offset };
}

function eocd(count: number, cdSize: number, cdOffset: number) {
  const e = new Uint8Array(22);
  const v = new DataView(e.buffer);
  v.setUint32(0, 0x06054b50, true);
  v.setUint16(8, count, true);
  v.setUint16(10, count, true);
  v.setUint32(12, cdSize, true);
  v.setUint32(16, cdOffset, true);
  return e;
}

const concat = (parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};
const size = (parts: Uint8Array[]) => parts.reduce((s, p) => s + p.length, 0);

export function buildZip(files: ZipInput[]) {
  const { locals, centrals, end } = encode(files, 0);
  return concat([...locals, ...centrals, eocd(files.length, size(centrals), end)]);
}

/**
 * Adds files to an existing zip without unpacking it: the new entries go
 * between the old data and the old central directory, then a new directory
 * and end record are written.
 */
export function appendToZip(zip: Uint8Array, files: ZipInput[]) {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let e = zip.length - 22;
  while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('not a zip file');
  const count = v.getUint16(e + 10, true);
  const cdSize = v.getUint32(e + 12, true);
  const cdOffset = v.getUint32(e + 16, true);
  const { locals, centrals, end } = encode(files, cdOffset);
  return concat([
    zip.subarray(0, cdOffset),
    ...locals,
    zip.subarray(cdOffset, cdOffset + cdSize),
    ...centrals,
    eocd(count + files.length, cdSize + size(centrals), end),
  ]);
}
