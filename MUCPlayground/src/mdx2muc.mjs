// node mdx2muc.mjs song.mdx [song.muc [scc|opll|auto [always|never]]]   converts an MDX file (MXDRV, Sharp X68000) to a MUC with
// MUCPlayground's converter (../mdx-to-muc.js) and prints its report. The PDX file the song
// names is looked for next to it (whatever the case of its name); its samples become a PCM
// bank, written next to the MUC under the name its #pcm line has. The MUC is written as UTF-8;
// MUCPlayground itself saves Shift-JIS (convert with iconv -f UTF-8 -t CP932 for the MSX tools).
import fs from 'node:fs';
import path from 'node:path';
import { parseMdx } from '../mdx-file.js';
import { mdxToMuc } from '../mdx-to-muc.js';

// scc / opll: where the FM tracks beyond six go - the SCC, or (one of them) the MSX-MUSIC with a
// voice of its own; without it the converter chooses.
// always / never: the ADPCM samples that sound like the OPNA's drums on its rhythm part whenever
// there are any, or never; without it only where the song gains by it.
const [input, output, spare, drums] = process.argv.slice(2);
if (!input) { console.error('usage: node mdx2muc.mjs song.mdx [song.muc [scc|opll|auto [always|never]]]'); process.exit(2); }
try {
  const bytes = new Uint8Array(fs.readFileSync(input));
  const name = parseMdx(bytes).pdx, dir = path.dirname(input);
  const want = name ? name.replace(/\.pdx$/i, '').toLowerCase() + '.pdx' : '';
  const found = want ? fs.readdirSync(dir).find((f) => f.toLowerCase() === want) : null;
  const r = mdxToMuc(bytes, { fileName: path.basename(input), pdx: found ? new Uint8Array(fs.readFileSync(path.join(dir, found))) : null, spare: spare === 'scc' || spare === 'opll' ? spare : 'auto', drums: drums === 'always' || drums === 'never' ? drums : 'auto' });;
  if (output) fs.writeFileSync(output, r.text);
  else process.stdout.write(r.text);
  if (r.pcm) fs.writeFileSync(path.join(output ? path.dirname(output) : dir, r.pcm.name), r.pcm.bytes);
  // samples that did not fit the bank: as WAV files next to it, to be cut and put in by hand
  for (const l of r.pcm?.leftOut || []) fs.writeFileSync(path.join(output ? path.dirname(output) : dir, l.name), l.bytes);
  if (r.pcm?.leftOut.length) console.error(`PCM: ${r.pcm.leftOut.length} sample(s) are not in the bank and silent (see the MUC's top comment): ${r.pcm.leftOut.map((l) => l.name).join(', ')}`);
  const { timeline, ...report } = r.report;
  console.error(JSON.stringify(report));
} catch (e) {
  console.error('error: ' + e.message);
  process.exit(1);
}
