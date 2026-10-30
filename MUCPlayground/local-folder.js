// Songs from a folder on this computer: a page cannot read the files next to a file you
// pick, but it can read a folder you pick (or drop). A folder here is
//   { name, entries: [{ path, get() -> Promise<File> }], handle? }
// with paths relative to the folder ("sub/SONG.MUC"). Chromium's directory handles can be
// kept (IndexedDB) so the same folder opens again after one permission click.

const MAX_FILES = 20000;

// Picks a folder: the File System Access picker where there is one (Chromium), else a
// <input webkitdirectory> (Safari, Firefox), which hands over every file in it.
export async function pickFolder(input) {
  if (window.showDirectoryPicker) {
    let handle;
    try { handle = await window.showDirectoryPicker({ id: 'mucplayground', mode: 'read' }); }
    catch (e) { if (e.name === 'AbortError') return null; throw e; }
    await rememberFolder(handle);
    return fromHandle(handle);
  }
  return new Promise((resolve) => {
    input.value = '';
    input.onchange = () => resolve(fromFileList(input.files));
    // No change event when the picker is cancelled: an unused promise is harmless.
    input.click();
  });
}

export async function fromHandle(handle) {
  const entries = [];
  const walk = async (dir, prefix, depth) => {
    for await (const [name, h] of dir.entries()) {
      if (entries.length >= MAX_FILES) return;
      if (h.kind === 'file') entries.push({ path: prefix + name, get: () => h.getFile() });
      else if (depth < 6 && !name.startsWith('.')) await walk(h, prefix + name + '/', depth + 1);
    }
  };
  await walk(handle, '', 0);
  return { name: handle.name, entries, handle };
}

export function fromFileList(list) {
  const all = [...list];
  if (!all.length) return null;
  const first = all[0].webkitRelativePath || all[0].name;
  const name = first.includes('/') ? first.slice(0, first.indexOf('/')) : '';
  const entries = all.slice(0, MAX_FILES).map((f) => {
    const rel = f.webkitRelativePath || f.name;
    return { path: name && rel.startsWith(name + '/') ? rel.slice(name.length + 1) : rel, get: async () => f };
  });
  return { name, entries };
}

// A folder dropped on the page: the drop's items must be read before the event handler
// awaits anything, so this takes the entries (webkitGetAsEntry) the handler collected.
export async function fromDropEntries(dirEntries) {
  const entries = [];
  const readAll = (dir) => new Promise((resolve, reject) => {
    const reader = dir.createReader(), out = [];
    const more = () => reader.readEntries((batch) => { if (!batch.length) resolve(out); else { out.push(...batch); more(); } }, reject);
    more();
  });
  const walk = async (entry, prefix, depth) => {
    if (entries.length >= MAX_FILES) return;
    if (entry.isFile) { entries.push({ path: prefix + entry.name, get: () => new Promise((res, rej) => entry.file(res, rej)) }); return; }
    if (depth > 6 || entry.name.startsWith('.')) return;
    for (const child of await readAll(entry)) await walk(child, depth === 0 && dirEntries.length === 1 ? '' : prefix + entry.name + '/', depth + 1);
  };
  for (const d of dirEntries) await walk(d, '', 0);
  return { name: dirEntries.map((d) => d.name).join(', '), entries };
}

// ---------- finding a song's files ----------
const dirOf = (path) => path.slice(0, path.lastIndexOf('/') + 1);
const baseOf = (path) => path.slice(path.lastIndexOf('/') + 1).toLowerCase();

// The folder's file a song refers to as `ref`: next to the song (any case), else the only
// file of that name in the folder, else one in a folder that also holds a file named like
// the song. null when there is none.
export function findRef(folder, songPath, ref) {
  const want = ref.replace(/\\/g, '/').split('/').pop().toLowerCase();
  const near = songPath !== null ? dirOf(songPath).toLowerCase() : null;
  if (near !== null) {
    const hit = folder.entries.find((e) => e.path.toLowerCase() === near + want);
    if (hit) return hit;
  }
  const named = folder.entries.filter((e) => baseOf(e.path) === want);
  if (named.length <= 1) return named[0] || null;
  return named.find((e) => near !== null && dirOf(e.path).toLowerCase().startsWith(near)) || named[0];
}

// The song (by file name) in the folder: the path, or null.
export function findSong(folder, name) {
  const want = name.toLowerCase();
  const hits = folder.entries.filter((e) => baseOf(e.path) === want);
  return hits.length === 1 ? hits[0].path : null;
}

// ---------- the remembered folder (Chromium) ----------
const db = () => new Promise((resolve, reject) => {
  const r = indexedDB.open('mucplayground-folder', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('handles');
  r.onsuccess = () => resolve(r.result);
  r.onerror = () => reject(r.error);
});
async function rememberFolder(handle) {
  try {
    const store = (await db()).transaction('handles', 'readwrite').objectStore('handles');
    store.put(handle, 'last');
  } catch { /* not kept: picked again next time */ }
}
export async function rememberedFolder() {
  try {
    const store = (await db()).transaction('handles', 'readonly').objectStore('handles');
    return await new Promise((resolve) => { const r = store.get('last'); r.onsuccess = () => resolve(r.result || null); r.onerror = () => resolve(null); });
  } catch { return null; }
}
// The remembered folder, if it may be read: without asking (ask = false: only when already
// allowed), or asking (needs a click to have just happened).
export async function openRemembered(ask) {
  const handle = await rememberedFolder();
  if (!handle?.queryPermission) return null;
  let state = await handle.queryPermission({ mode: 'read' });
  if (state !== 'granted' && ask) {
    try { state = await handle.requestPermission({ mode: 'read' }); } catch { state = 'denied'; }
  }
  return state === 'granted' ? fromHandle(handle) : null;
}
