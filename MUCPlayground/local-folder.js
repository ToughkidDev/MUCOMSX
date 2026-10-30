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
    // 'last' for Folder…, and up to eight folders a dropped song may be in.
    const known = (await rememberedFolders()).filter((h) => h.name !== handle.name);
    const store = (await db()).transaction('handles', 'readwrite').objectStore('handles');
    store.put(handle, 'last');
    store.put([handle, ...known].slice(0, 8), 'all');
  } catch { /* not kept: picked again next time */ }
}
async function rememberedFolders() {
  try {
    const store = (await db()).transaction('handles', 'readonly').objectStore('handles');
    const get = (key) => new Promise((resolve) => { const r = store.get(key); r.onsuccess = () => resolve(r.result || null); r.onerror = () => resolve(null); });
    const all = (await get('all')) || [], last = await get('last');
    return last && !all.length ? [last] : all;
  } catch { return []; }
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

// ---------- the folder of a dropped song (Chromium) ----------
// A song dropped by itself comes without the files next to it. Chromium hands over a file
// handle for it (DataTransferItem.getAsFileSystemHandle); a folder allowed before that holds
// it finds its files without asking again, and the folder picker opens right in its folder.
//   { song: path of the song in `folder`, folder (only the song's own folder and below,
//     quick to list), root() -> the whole allowed folder, for files kept further up }
async function songIn(dir, parts) {
  let d = dir;
  for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p);
  return {
    song: parts[parts.length - 1],
    folder: await fromHandle(d),
    root: async () => ({ song: parts.join('/'), folder: await fromHandle(dir) }),
  };
}

// The allowed folder a dropped song is in: { found, needs } — `found` as above when the
// folder may be read now, else `needs`, a remembered folder holding it that has to be
// allowed again (with a click: allowFolder). null when no remembered folder holds it.
export async function folderOfSong(fileHandle) {
  if (!fileHandle) return null;
  for (const dir of await rememberedFolders()) {
    try {
      const parts = await dir.resolve(fileHandle);
      if (!parts) continue;
      if (await dir.queryPermission({ mode: 'read' }) === 'granted') return { found: await songIn(dir, parts) };
      return { needs: dir, parts };
    } catch { /* gone or not comparable */ }
  }
  return null;
}

// After a click: allows a remembered folder again, or picks the song's folder (the picker
// opens where the song is). Returns { song, folder, root } as above, or null.
export async function allowFolder(fileHandle, remembered) {
  if (remembered) {
    try {
      if (await remembered.needs.requestPermission({ mode: 'read' }) === 'granted') return songIn(remembered.needs, remembered.parts);
    } catch { /* fall back to the picker */ }
  }
  if (!window.showDirectoryPicker) return null;
  let dir;
  try { dir = await window.showDirectoryPicker({ id: 'mucplayground', mode: 'read', startIn: fileHandle || undefined }); }
  catch (e) { if (e.name === 'AbortError') return null; throw e; }
  await rememberFolder(dir);
  const parts = fileHandle ? await dir.resolve(fileHandle).catch(() => null) : null;
  if (parts) return songIn(dir, parts);
  // Not inside it: look the song up by name.
  const folder = await fromHandle(dir);
  const song = fileHandle ? findSong(folder, fileHandle.name) : null;
  return { song, folder, root: async () => ({ song, folder }) };
}
