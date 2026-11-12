// Reads a file's notes from its chip writes (chip-notes.js) off the main thread: a long VGM
// takes a moment, which would otherwise hold up the page as the song starts.
//   in   { id, data: ArrayBuffer (a VGM, not compressed) }
//   out  { id, notes } or { id, error }
import { chipNotes } from './chip-notes.js';

onmessage = async (e) => {
  const { id, data } = e.data;
  try {
    postMessage({ id, notes: await chipNotes(new Uint8Array(data)) });
  } catch (error) {
    postMessage({ id, error: String(error?.message || error) });
  }
};
