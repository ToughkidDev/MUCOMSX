// node mgs2muc.mjs song.mgs [song.muc]   converts an MGS file to a MUC with MUCPlayground's
// converter (../mgs-to-muc.js) and prints its report. The MUC is written as UTF-8; MUCPlayground
// itself saves Shift-JIS (convert with iconv -f UTF-8 -t CP932 for the MSX tools).
import fs from 'node:fs';
import path from 'node:path';
import { mgsToMuc } from '../mgs-to-muc.js';

const [input, output] = process.argv.slice(2);
if (!input) { console.error('usage: node mgs2muc.mjs song.mgs [song.muc]'); process.exit(2); }
try {
  const r = mgsToMuc(new Uint8Array(fs.readFileSync(input)), { fileName: path.basename(input) });
  if (output) fs.writeFileSync(output, r.text);
  else process.stdout.write(r.text);
  console.error(JSON.stringify(r.report));
} catch (e) {
  console.error('error: ' + e.message);
  process.exit(1);
}
