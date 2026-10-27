// Share links. The page has no server, so a link carries the song itself:
//   ?sample=Muc/…/SONG.muc   a repository sample, opened as it is (its voice / PCM files
//                            come from the same folder)
//   ?ex=demo | ?ex=template | ?ex=extScc …  a built-in example or template, unedited
//   #s=…                     anything else: the text, compressed, with the repository paths
//                            of attached files that came from the repository and the bytes
//                            of small files that did not
// The #s= payload is JSON { v, n: name, t: text, f: [[name, repo path]], d: [[name, base64]] },
// deflated (raw) and written in base64url; links made where CompressionStream is missing
// start with "j" and hold the JSON uncompressed.

export const EMBED_LIMIT = 24 * 1024;   // bytes of attached files a link may carry

const b64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toUrl = (s) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromUrl = (s) => s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);

async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

export async function encodeSong({ name, text, repoFiles = [], embedded = [] }) {
  const json = JSON.stringify({ v: 1, n: name, t: text, f: repoFiles.map((f) => [f.name, f.path]), d: embedded.map((f) => [f.name, b64(new Uint8Array(f.data))]) });
  const raw = new TextEncoder().encode(json);
  if (typeof CompressionStream === 'function') return 'z' + toUrl(b64(await pipe(raw, new CompressionStream('deflate-raw'))));
  return 'j' + toUrl(b64(raw));
}

export async function decodeSong(payload) {
  const kind = payload[0], bytes = unb64(fromUrl(payload.slice(1)));
  let raw;
  if (kind === 'z') raw = await pipe(bytes, new DecompressionStream('deflate-raw'));
  else if (kind === 'j') raw = bytes;
  else throw new Error('unknown link format');
  const o = JSON.parse(new TextDecoder().decode(raw));
  if (o.v !== 1 || typeof o.t !== 'string') throw new Error('unknown link version');
  return {
    name: typeof o.n === 'string' ? o.n : 'SONG.MUC',
    text: o.t,
    repoFiles: Array.isArray(o.f) ? o.f.filter((x) => Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string').map(([n, path]) => ({ name: n, path })) : [],
    embedded: Array.isArray(o.d) ? o.d.filter((x) => Array.isArray(x) && typeof x[0] === 'string').map(([n, d]) => ({ name: n, data: unb64(d).buffer })) : [],
  };
}

// What a page address asks for: { sample }, { example }, { payload } or null.
export function sharedRequest(loc) {
  const q = new URLSearchParams(loc.search);
  if (q.get('sample')) return { sample: q.get('sample') };
  if (/^(?:demo|template|ext[A-Z][a-z]+)$/.test(q.get('ex') || '')) return { example: q.get('ex') };
  const h = /^#s=([A-Za-z0-9_-]+)$/.exec(loc.hash);
  if (h) return { payload: h[1] };
  return null;
}

// The address of this page without what a share link added.
export function pageBase(loc) {
  return loc.origin + loc.pathname;
}
