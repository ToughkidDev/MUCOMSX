// The ADPCM bank a MUB carries, and the same MUB without it. MucoMSX's MUC2MUB puts the
// #pcm file into the MUB only with /P; without it the MUB has no PCM block and the player
// (MUBPLAY, MUBScope, MDPlayer4Mac) reads the file its #pcm tag names from the MUB's folder
// (MUCOMPCM.BIN for a #pcm without a name). The PCM block is the file's own bytes.
//   MUB8 / MUC8  header: data 0x04/0x08, tags 0x0C/0x10, PCM 0x14/0x18 (offset, size)
//   muPb         mucomDotNET's paged layout (MUBHeader.cs): PCM set sizes after the
//                instrument sizes, PCM data after the instruments, tags at 0x12/0x16
//   msPb         MUCOMSX's MSX scores use the muPb layout too
//
// mubPcm(bytes) -> null when the MUB has no PCM, else
//   { kind, pcm: Uint8Array, withoutPcm(): Uint8Array }

const u16 = (b, o) => b[o] | (b[o + 1] << 8);
const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
const put32 = (b, o, v) => { b[o] = v & 255; b[o + 1] = (v >>> 8) & 255; b[o + 2] = (v >>> 16) & 255; b[o + 3] = (v >>> 24) & 255; };
const magic = (b) => String.fromCharCode(b[0], b[1], b[2], b[3]);


function mub8(bytes) {
  const pcmOffset = u32(bytes, 0x14), pcmSize = u32(bytes, 0x18);
  if (!pcmSize || pcmOffset + pcmSize > bytes.length) return null;
  return {
    kind: 'mub8',
    pcm: bytes.slice(pcmOffset, pcmOffset + pcmSize),
    withoutPcm() {
      const out = new Uint8Array(bytes.length - pcmSize);
      out.set(bytes.subarray(0, pcmOffset));
      out.set(bytes.subarray(pcmOffset + pcmSize), pcmOffset);
      // the PCM fields cleared; anything that came after the block moves up
      put32(out, 0x14, 0); put32(out, 0x18, 0);
      for (const at of [0x04, 0x0c]) if (u32(out, at) >= pcmOffset + pcmSize) put32(out, at, u32(out, at) - pcmSize);
      return out;
    },
  };
}

function paged(bytes) {
  const chips = bytes[0x09], parts = u16(bytes, 0x0a), pages = u16(bytes, 0x0c), insts = u16(bytes, 0x0e), pcms = u16(bytes, 0x10);
  const tagOffset = u32(bytes, 0x12);
  let p = 0x22;
  for (let c = 0; c < chips; c++) {
    p += 2 + 4 * 5;
    p += 1;                               // part count
    p += 1 + 2 * bytes[p];                // instrument numbers
    p += 1 + 2 * bytes[p];                // PCM numbers
  }
  p += parts;                             // pages per part
  let pageBytes = 0;
  for (let i = 0; i < pages; i++, p += 8) pageBytes += u32(bytes, p);
  let instBytes = 0;
  for (let i = 0; i < insts; i++, p += 4) instBytes += u32(bytes, p);
  const sizeFields = [];
  let pcmBytes = 0;
  for (let i = 0; i < pcms; i++, p += 4) { sizeFields.push(p); pcmBytes += u32(bytes, p); }
  const pcmStart = p + pageBytes + instBytes;
  if (!pcmBytes || pcmStart + pcmBytes > bytes.length) return null;
  return {
    kind: magic(bytes) === 'msPb' ? 'mspb' : 'mupb',
    pcm: bytes.slice(pcmStart, pcmStart + pcmBytes),
    withoutPcm() {
      const out = new Uint8Array(bytes.length - pcmBytes);
      out.set(bytes.subarray(0, pcmStart));
      out.set(bytes.subarray(pcmStart + pcmBytes), pcmStart);
      for (const at of sizeFields) put32(out, at, 0);
      if (tagOffset >= pcmStart + pcmBytes) put32(out, 0x12, tagOffset - pcmBytes);
      return out;
    },
  };
}

export function mubPcm(bytes) {
  if (!bytes || bytes.length < 0x22) return null;
  const m = magic(bytes);
  try {
    if (m === 'MUB8' || m === 'MUC8') return mub8(bytes);
    if (m === 'muPb' || m === 'msPb') return paged(bytes);
  } catch { /* not a layout this reads */ }
  return null;
}
