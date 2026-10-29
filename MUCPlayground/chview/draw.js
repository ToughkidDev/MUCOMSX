// MDPlayer's channel-view drawing (DrawBuff), ported from MDPlayer/MDPlayerx64/drawBuff.cs
// (MDPlayer by kuma4649, GPL-3.0). The functions keep MDPlayer's names, arguments and
// pixel positions so the panels look the same; MDPlayer's `ref` arguments are passed as
// an object and a property name (`o, 'note'`), and C# integer division is `div`.
// The bitmaps in this folder are MDPlayer's own resources.

const div = (a, b) => Math.trunc(a / b);

let rFont1, rFont2, rKBD, rVol, rPan, rPSGMode, rPSGEnv, rType, rNESDMC, rWavGraph;
export const images = {};

const NAMES = ['planeD', 'planeYM2610', 'planeYM2203', 'planeE', 'planeYM2413', 'planeAY8910', 'planeK051649', 'planeYM2612', 'planeSN76489',
  'rFont_01', 'rFont_02', 'rFont_03', 'rFont_04', 'rKBD_01', 'rVol_01', 'rPan_01', 'rPSGMode_01', 'rPSGMode_02',
  'rPSGEnv', 'rType_01', 'rType_02', 'rNESDMC', 'rWavGraph', 'rFader'];

let loading = null;
export function loadImages(base) {
  loading ||= Promise.all(NAMES.map(async (name) => {
    const blob = await (await fetch(new URL(name + '.png', base))).blob();
    images[name] = await createImageBitmap(blob);
  })).then(() => {
    const i = images;
    rFont1 = [i.rFont_01, i.rFont_02];
    rFont2 = [i.rFont_03, i.rFont_04];
    rKBD = [i.rKBD_01];
    rVol = [i.rVol_01];
    rPan = [i.rPan_01];
    rPSGMode = [i.rPSGMode_01, i.rPSGMode_02];
    rPSGEnv = i.rPSGEnv;
    rType = [i.rType_01, i.rType_02];
    rNESDMC = i.rNESDMC;
    rWavGraph = i.rWavGraph;
  });
  return loading;
}

// MDPlayer's FrameBuffer: a panel bitmap that the functions below copy sprite pieces onto.
export class FrameBuffer {
  constructor(plane) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = plane.width;
    this.canvas.height = plane.height;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(plane, 0, 0);
  }
  draw(x, y, src, srcWidth, imgX, imgY, imgWidth, imgHeight) {
    if (!src || imgWidth <= 0 || imgHeight <= 0) return;
    this.ctx.drawImage(src, imgX, imgY, imgWidth, imgHeight, x, y, imgWidth, imgHeight);
  }
}

const SEMITONES = [1.0, 1.05947557526183, 1.122467701246082, 1.189205718217262, 1.259918966439875, 1.334836786178427,
  1.414226741074841, 1.498318171393624, 1.587416864154117, 1.681828606375659, 1.781820961700176, 1.887776163901842];

export const Tables = {
  kbl: [0, 0, 2, 1, 4, 2, 6, 1, 8, 3, 12, 0, 14, 1, 16, 2, 18, 1, 20, 2, 22, 1, 24, 3],
  kbn: ['C ', 'C#', 'D ', 'D#', 'E ', 'F ', 'F#', 'G ', 'G#', 'A ', 'A#', 'B '],
  kbo: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'],
  hexCh: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'],
  // Note frequencies from C1; MDPlayer's last octave mixes *32 and *16, kept as is.
  freqTbl: (() => {
    const base = [261.6255653005986, 277.1826309768721, 293.6647679174076, 311.12698372208087, 329.6275569128699,
      349.2282314330039, 369.9944227116344, 391.99543598174927, 415.3046975799451, 440, 466.1637615180899, 493.8833012561241];
    const t = [];
    const mul = [1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8, 16];
    for (const m of mul) for (const f of base) t.push(Math.fround(f * m));
    const last = [32, 32, 32, 32, 32, 16, 16, 16, 16, 16, 16, 32];
    for (let i = 0; i < 12; i++) t.push(Math.fround(base[i] * last[i]));
    return t;
  })(),
  pcmMulTbl: [...SEMITONES.map((v) => v / 2), ...SEMITONES],
};

export const Common = {
  Range(n, min, max) { return n > max ? max : (n < min ? min : n); },
  searchYM2608Adpcm(freq) {
    let m = Infinity, n = 0;
    for (let i = 0; i < 12 * 8; i++) {
      const f = Tables.pcmMulTbl[i % 12 + 12] * Math.pow(2, div(i, 12) - 3);
      if (freq < f) break;
      n = i;
      const a = Math.abs(freq - f);
      if (m > a) { m = a; n = i; }
    }
    return n + 1;
  },
  searchSSGNote(freq) {
    let m = Infinity, n = 0;
    for (let i = 0; i < 12 * 8; i++) {
      const a = Math.abs(freq - Tables.freqTbl[i]);
      if (m > a) { m = a; n = i; }
    }
    return n;
  },
};

// ---- DrawBuff ----
export function Ch3YM2608(screen, ch, om$o, om$k, nm, oe$o, oe$k, ne, tp) {

    if (om$o[om$k] == nm && oe$o[oe$k] == ne)
    {
        return;
    }

    Ch3YM2612_P(screen, 1, 8 + ch * 8, ch, nm == null ? false : !!nm, ne, tp);
    om$o[om$k] = nm;
    oe$o[oe$k] = ne;
}
export function ChYM2608(screen, ch, om$o, om$k, nm, tp) {

    if (om$o[om$k] == nm)
    {
        return;
    }

    ChYM2608_P(screen, 1, 8 + ch * 8, ch, nm == null ? false : !!nm, tp);
    om$o[om$k] = nm;
}
export function ChYM2608Rhythm(screen, ch, om$o, om$k, nm, tp) {

    if (om$o[om$k] == nm)
    {
        return;
    }

    ChYM2608Rhythm_P(screen, 0, 8 * 14, ch, nm == null ? false : !!nm, tp);
    om$o[om$k] = nm;
}
export function Efrq(screen, x, y, oefrq$o, oefrq$k, nefrq) {
    if (oefrq$o[oefrq$k] == nefrq)
    {
        return;
    }

    x *= 4;
    y *= 4;
    drawFont4(screen, x, y, 0, String(nefrq).padStart(5, '0'));

    oefrq$o[oefrq$k] = nefrq;
}
export function Etype(screen, x, y, oetype$o, oetype$k, netype) {
    if (oetype$o[oetype$k] == netype)
    {
        return;
    }

    x *= 4;
    y *= 4;

    drawEtypeP(screen, x, y, netype);
    oetype$o[oetype$k] = netype;
}
export function InstOPNA(screen, x, y, c, oi, ni) {
    let sx = (c % 3) * 4 * 25 + x;
    let sy = (div(c, 3)) * 8 * 6 + y;

    for (let j = 0; j < 4; j++)
    {
        for (let i = 0; i < 11; i++)
        {
            if (oi[i + j * 11] != ni[i + j * 11])
            {
                drawFont4Int(screen, sx + i * 8 + (i > 5 ? 4 : 0), sy + j * 8, 0, (i == 5) ? 3 : 2, ni[i + j * 11]);
                oi[i + j * 11] = ni[i + j * 11];
            }
        }
    }

    if (oi[44] != ni[44])
    {
        drawFont4Int(screen, sx + 8 * 4, sy - 16, 0, 2, ni[44]);
        oi[44] = ni[44];
    }
    if (oi[45] != ni[45])
    {
        drawFont4Int(screen, sx + 8 * 6, sy - 16, 0, 2, ni[45]);
        oi[45] = ni[45];
    }
    if (oi[46] != ni[46])
    {
        drawFont4Int(screen, sx + 8 * 8 + 4, sy - 16, 0, 2, ni[46]);
        oi[46] = ni[46];
    }
    if (oi[47] != ni[47])
    {
        drawFont4Int(screen, sx + 8 * 11, sy - 16, 0, 2, ni[47]);
        oi[47] = ni[47];
    }
}
export function KeyBoardOPNA(screen, x, y, ot$o, ot$k, nt, tp) {
    if (ot$o[ot$k] == nt) return;

    let kx = 0;
    let kt = 0;

    if (ot$o[ot$k] >= 0 && ot$o[ot$k] < 12 * 8)
    {
        kx = Tables.kbl[(ot$o[ot$k] % 12) * 2] + div(ot$o[ot$k], 12) * 28;
        kt = Tables.kbl[(ot$o[ot$k] % 12) * 2 + 1];
        drawKbn(screen, x + kx, y, kt, tp);
    }

    if (nt >= 0 && nt < 12 * 8)
    {
        kx = Tables.kbl[(nt % 12) * 2] + div(nt, 12) * 28;
        kt = Tables.kbl[(nt % 12) * 2 + 1] + 4;
        drawKbn(screen, x + kx, y, kt, tp);
    }

    drawFont8(screen, 296 + x, y, 1, "   ");

    if (nt >= 0)
    {
        drawFont8(screen, 296 + x, y, 1, Tables.kbn[nt % 12]);
        if (div(nt, 12) < 10)
        {
            drawFont8(screen, 312 + x, y, 1, Tables.kbo[div(nt, 12)]);
        }
    }

    ot$o[ot$k] = nt;
}
export function LfoFrq(screen, x, y, olfofrq$o, olfofrq$k, nlfofrq) {
    if (olfofrq$o[olfofrq$k] == nlfofrq)
    {
        return;
    }

    drawFont4Int(screen, x, y, 0, 1, nlfofrq);

    olfofrq$o[olfofrq$k] = nlfofrq;
}
export function LfoSw(screen, x, y, olfosw$o, olfosw$k, nlfosw) {
    if (olfosw$o[olfosw$k] == nlfosw)
    {
        return;
    }

    drawFont4(screen, x, y, 0, nlfosw ? "ON " : "OFF");

    olfosw$o[olfosw$k] = nlfosw;
}
export function Nfrq(screen, x, y, onfrq$o, onfrq$k, nnfrq) {
    if (onfrq$o[onfrq$k] == nnfrq)
    {
        return;
    }

    x *= 4;
    y *= 4;
    drawFont4Int(screen, x, y, 0, 2, nnfrq);

    onfrq$o[onfrq$k] = nnfrq;
}
export function Pan(screen, x, y, ot$o, ot$k, nt, otp$o, otp$k, ntp) {

    if (ot$o[ot$k] == nt && otp$o[otp$k] == ntp)
    {
        return;
    }

    drawPanP(screen, x, y, nt, ntp);
    ot$o[ot$k] = nt;
    otp$o[otp$k] = ntp;
}
export function PanYM2608Rhythm(screen, c, ot$o, ot$k, nt, otp$o, otp$k, ntp) {

    if (ot$o[ot$k] == nt && otp$o[otp$k] == ntp)
    {
        return;
    }

    drawPanP(screen, c * 4 * 15 + 12, 8 * 14, nt, ntp);
    ot$o[ot$k] = nt;
    otp$o[otp$k] = ntp;
}
export function Slot(screen, x, y, os$o, os$k, ns) {
    if (os$o[os$k] == ns) return;

    screen.draw(x + 0, y, rNESDMC, 64, ((ns & 1) != 0 ? 1 : 0) * 4 + 32, 0, 4, 8);
    screen.draw(x + 4, y, rNESDMC, 64, ((ns & 2) != 0 ? 1 : 0) * 4 + 32, 0, 4, 8);
    screen.draw(x + 8, y, rNESDMC, 64, ((ns & 4) != 0 ? 1 : 0) * 4 + 32, 0, 4, 8);
    screen.draw(x + 12, y, rNESDMC, 64, ((ns & 8) != 0 ? 1 : 0) * 4 + 32, 0, 4, 8);

    os$o[os$k] = ns;
}
export function TnOPNA(screen, x, y, c, ot$o, ot$k, nt, otp$o, otp$k, ntp) {

    if (ot$o[ot$k] == nt && otp$o[otp$k] == ntp)
    {
        return;
    }

    drawTnP(screen, x * 4 + 1, y * 4 + c * 8, nt, ntp);
    ot$o[ot$k] = nt;
    otp$o[otp$k] = ntp;
}
export function Volume(screen, x, y, c, ov$o, ov$k, nv, tp) {
    if (ov$o[ov$k] == nv) return;

    let t = 0;
    let sy = 0;
    if (c == 1 || c == 2) { t = 4; }
    if (c == 2) { sy = 4; }
    //y = (y + 1) * 8;

    for (let i = 0; i <= 19; i++)
    {
        VolumeP(screen, x + i * 2, y + sy, (1 + t), tp);
    }

    for (let i = 0; i <= nv; i++)
    {
        VolumeP(screen, x + i * 2, y + sy, i > 17 ? (2 + t) : (0 + t), tp);
    }

    ov$o[ov$k] = nv;

}
export function VolumeShort(screen, x, y, c, ov$o, ov$k, nv, tp) {
    if (ov$o[ov$k] == nv) return;

    //let t = 0;
    //let sy = 0;
    //if (c == 1 || c == 2) { t = 4; }
    //if (c == 2) { sy = 4; }
    //y = (y + 1) * 8;

    //for (let i = 0; i <= 19; i++)
    //{
    //    VolumeP(screen, 256 + i * 2, y + sy, (1 + t), tp);
    //}

    //for (let i = 0; i <= nv; i++)
    //{
    //    VolumeP(screen, 256 + i * 2, y + sy, i > 17 ? (2 + t) : (0 + t), tp);
    //}

    let t = 0;
    let sy = 0;
    if (c == 1 || c == 2) { t = 4; }
    if (c == 2) { sy = 4; }
    //y = (y + 1) * 8;

    for (let i = 0; i <= 15; i++)
    {
        VolumeP(screen, x + i * 2, y + sy, (1 + t), tp);
    }

    for (let i = 0; i <= nv; i++)
    {
        VolumeP(screen, x + i * 2, y + sy, i > 13 ? (2 + t) : (0 + t), tp);
    }

    ov$o[ov$k] = nv;

}
export function VolumeYM2608Rhythm(screen, x, c, ov$o, ov$k, nv, tp) {
    if (ov$o[ov$k] == nv) return;

    let t = 0;
    let sy = 0;
    if (c == 1 || c == 2) { t = 4; }
    if (c == 2) { sy = 4; }
    x = x * 4 * 15 + 20;

    for (let i = 0; i <= 19; i++)
    {
        VolumeP(screen, x + i * 2, sy + 8 * 14, (1 + t), tp);
    }

    for (let i = 0; i <= nv; i++)
    {
        VolumeP(screen, x + i * 2, sy + 8 * 14, i > 17 ? (2 + t) : (0 + t), tp);
    }

    ov$o[ov$k] = nv;

}
export function drawNESSw(screen, x, y, os$o, os$k, ns) {
    if (os$o[os$k] == ns) return;

    screen.draw(x, y, rNESDMC, 64, (ns ? 1 : 0) * 4 + 32, 0, 4, 8);

    os$o[os$k] = ns;
}
export function font4Hex12Bit(screen, x, y, t, on$o, on$k, nn) {
    if (on$o[on$k] == nn) return;

    drawFont4Hex12Bit(screen, x, y, t, nn);
    on$o[on$k] = nn;
}
export function font4Hex16Bit(screen, x, y, t, on$o, on$k, nn) {
    if (on$o[on$k] == nn) return;

    drawFont4Hex16Bit(screen, x, y, t, nn);
    on$o[on$k] = nn;
}
export function font4HexByte(screen, x, y, t, on$o, on$k, nn) {
    if (on$o[on$k] == nn) return;

    drawFont4HexByte(screen, x, y, t, nn);
    on$o[on$k] = nn;
}
export function font4Int2(screen, x, y, t, k, on$o, on$k, nn) {
    if (on$o[on$k] == nn) return;

    drawFont4Int2(screen, x, y, t, k, nn);
    on$o[on$k] = nn;
}
export function font4Int3(screen, x, y, t, k, on$o, on$k, nn) {
    if (on$o[on$k] == nn) return;

    drawFont4Int3(screen, x, y, t, k, nn);
    on$o[on$k] = nn;
}
export function screenInitYM2608(screen, tp) {
    //YM2608
    for (let y = 0; y < 6 + 3 + 3 + 1; y++)
    {

        drawFont8(screen, 328 + 1, y * 8 + 8, 1, "   ");
        for (let i = 0; i < 96; i++)
        {
            let kx = Tables.kbl[(i % 12) * 2] + div(i, 12) * 28;
            let kt = Tables.kbl[(i % 12) * 2 + 1];
            drawKbn(screen, 33 + kx, y * 8 + 8, kt, tp);
        }

        if (y < 13)
        {
            ChYM2608_P(screen, 1, y * 8 + 8, y, false, tp);
        }

        if (y < 6 || y == 12)
        {
            drawPanP(screen, 25, y * 8 + 8, 3, tp);
        }

        let d = 99;
        if (y > 5 && y < 9)
        {
            Volume(screen, 272 + 1, 8 + y * 8, 0, { v: d }, 'v', 0, tp);
        }
        else
        {
            Volume(screen, 272 + 1, 8 + y * 8, 1, { v: d }, 'v', 0, tp);
            d = 99;
            Volume(screen, 272 + 1, 8 + y * 8, 2, { v: d }, 'v', 0, tp);
        }
    }

    for (let y = 0; y < 6; y++)
    {
        let d = 99;
        PanYM2608Rhythm(screen, y, { v: d }, 'v', 3, { v: d }, 'v', tp);
        d = 99;
        VolumeYM2608Rhythm(screen, y, 1, { v: d }, 'v', 0, tp);
        d = 99;
        VolumeYM2608Rhythm(screen, y, 2, { v: d }, 'v', 0, tp);
    }
}
export function Ch3YM2610(screen, ch, om$o, om$k, nm, oe$o, oe$k, ne, tp) {

    if (om$o[om$k] == nm && oe$o[oe$k] == ne)
    {
        return;
    }

    Ch3YM2612_P(screen, 1, 8 + ch * 8, ch, nm == null ? false : !!nm, ne, tp);
    om$o[om$k] = nm;
    oe$o[oe$k] = ne;
}
export function ChYM2610(screen, ch, om$o, om$k, nm, tp) {

    if (om$o[om$k] == nm)
    {
        return;
    }

    ChYM2610_P(screen, 1, 8 + ch * 8, ch, nm == null ? false : !!nm, tp);
    om$o[om$k] = nm;
}
export function ChYM2610Rhythm(screen, ch, om$o, om$k, nm, tp) {

    if (om$o[om$k] == nm)
    {
        return;
    }

    ChYM2610Rhythm_P(screen, 1, 8 * 13, ch, nm == null ? false : !!nm, tp);
    om$o[om$k] = nm;
}
export function ChYM2610_P(screen, x, y, ch, mask, tp) {
    if (screen == null) return;

    if (ch < 6)
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 0, 0, 16, 8);
        drawFont8(screen, x + 16, y, mask ? 1 : 0, String(1 + ch));
    }
    else if (ch < 9)
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 32, 0, 16, 8);
        drawFont8(screen, x + 16, y, mask ? 1 : 0, String(1 + ch - 6));
    }
    else if (ch < 12)
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 32 * (ch - 8), 24, 32, 8);
    }
    else
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 88, 0, 24, 8);
    }
}
export function PanYM2610Rhythm(screen, c, ot$o, ot$k, nt, otp$o, otp$k, ntp) {

    if (ot$o[ot$k] == nt && otp$o[otp$k] == ntp)
    {
        return;
    }

    drawPanP(screen, c * 4 * 15 + 17, 8 * 13, nt, ntp);
    ot$o[ot$k] = nt;
    otp$o[otp$k] = ntp;
}
export function VolumeYM2610Rhythm(screen, x, c, ov$o, ov$k, nv, tp) {

    if (ov$o[ov$k] == nv) return;

    let t = 0;
    let sy = 0;
    if (c == 1 || c == 2) { t = 4; }
    if (c == 2) { sy = 4; }
    x = x * 4 * 15 + 6 * 4 + 1;

    for (let i = 0; i <= 19; i++)
    {
        VolumeP(screen, x + i * 2, sy + 8 * 13, (1 + t), tp);
    }

    for (let i = 0; i <= nv; i++)
    {
        VolumeP(screen, x + i * 2, sy + 8 * 13, i > 17 ? (2 + t) : (0 + t), tp);
    }

    ov$o[ov$k] = nv;

}
export function drawFont8(screen, x, y, t, msg) {
    if (screen == null)
    {
        return;
    }

    for (const c of msg)
    {
        let cd = c.charCodeAt(0) - 65 + 0x20 + 1;
        screen.draw(x, y, rFont1[t], 128, (cd % 16) * 8, (div(cd, 16)) * 8, 8, 8);
        x += 8;
    }
}
export function drawKbn(screen, x, y, t, tp) {
    if (screen == null)
    {
        return;
    }

    switch (t)
    {
        case 0:
            screen.draw(x, y, rKBD[tp], 32, 0, 0, 4, 8);
            break;
        case 1:
            screen.draw(x, y, rKBD[tp], 32, 4, 0, 3, 8);
            break;
        case 2:
            screen.draw(x, y, rKBD[tp], 32, 8, 0, 4, 8);
            break;
        case 3:
            screen.draw(x, y, rKBD[tp], 32, 12, 0, 4, 8);
            break;
        case 4:
            screen.draw(x, y, rKBD[tp], 32, 0 + 16, 0, 4, 8);
            break;
        case 5:
            screen.draw(x, y, rKBD[tp], 32, 4 + 16, 0, 3, 8);
            break;
        case 6:
            screen.draw(x, y, rKBD[tp], 32, 8 + 16, 0, 4, 8);
            break;
        case 7:
            screen.draw(x, y, rKBD[tp], 32, 12 + 16, 0, 4, 8);
            break;
    }
}
export function drawPanP(screen, x, y, t, tp) {
    if (screen == null) return;
    screen.draw(x, y, rPan[tp], 32, 8 * t, 0, 8, 8);
}
export function Ch3YM2203(screen, ch, om$o, om$k, nm, oe$o, oe$k, ne, tp) {

    if (om$o[om$k] == nm && oe$o[oe$k] == ne)
    {
        return;
    }

    Ch3YM2612_P(screen, 0, 8 + ch * 8, ch, nm == null ? false : !!nm, ne, tp);
    om$o[om$k] = nm;
    oe$o[oe$k] = ne;
}
export function ChYM2203(screen, ch, om$o, om$k, nm, tp) {

    if (om$o[om$k] == nm)
    {
        return;
    }

    ChYM2203_P(screen, 0, 8 + ch * 8, ch, nm == null ? false : !!nm, tp);
    om$o[om$k] = nm;
}
export function Inst(screen, x, y, c, oi, ni) {
    let sx = (c % 3) * 8 * 13 + x * 8;
    let sy = (div(c, 3)) * 8 * 6 + 8 * y;

    for (let j = 0; j < 4; j++)
    {
        for (let i = 0; i < 11; i++)
        {
            if (oi[i + j * 11] != ni[i + j * 11])
            {
                drawFont4Int(screen, sx + i * 8 + (i > 5 ? 4 : 0), sy + j * 8, 0, (i == 5) ? 3 : 2, ni[i + j * 11]);
                oi[i + j * 11] = ni[i + j * 11];
            }
        }
    }

    if (oi[44] != ni[44])
    {
        drawFont4Int(screen, sx + 8 * 4, sy - 16, 0, 2, ni[44]);
        oi[44] = ni[44];
    }
    if (oi[45] != ni[45])
    {
        drawFont4Int(screen, sx + 8 * 6, sy - 16, 0, 2, ni[45]);
        oi[45] = ni[45];
    }
    if (oi[46] != ni[46])
    {
        drawFont4Int(screen, sx + 8 * 8 + 4, sy - 16, 0, 2, ni[46]);
        oi[46] = ni[46];
    }
    if (oi[47] != ni[47])
    {
        drawFont4Int(screen, sx + 8 * 11, sy - 16, 0, 2, ni[47]);
        oi[47] = ni[47];
    }
}
export function Inst_2(screen, x, y, c, oi, ni, ot, nt) {
    let sx = (c % 3) * 8 * 13 + x * 8;
    let sy = (div(c, 3)) * 8 * 6 + 8 * y;

    for (let j = 0; j < 4; j++)
    {
        for (let i = 0; i < 11; i++)
        {
            if (oi[i + j * 11] != ni[i + j * 11] || ot[i + j * 11] != nt[i + j * 11])
            {
                drawFont4Int(screen, sx + i * 8 + (i > 5 ? 4 : 0), sy + j * 8, nt[i + j * 11], (i == 5) ? 3 : 2, ni[i + j * 11]);
                oi[i + j * 11] = ni[i + j * 11];
                ot[i + j * 11] = nt[i + j * 11];
            }
        }
    }

    if (oi[44] != ni[44] || ot[44] != nt[44])
    {
        drawFont4Int(screen, sx + 8 * 4, sy - 16, nt[44], 2, ni[44]);
        oi[44] = ni[44];
        ot[44] = nt[44];
    }
    if (oi[45] != ni[45] || ot[45] != nt[45])
    {
        drawFont4Int(screen, sx + 8 * 6, sy - 16, nt[45], 2, ni[45]);
        oi[45] = ni[45];
        ot[45] = nt[45];
    }
    if (oi[46] != ni[46] || ot[46] != nt[46])
    {
        drawFont4Int(screen, sx + 8 * 8 + 4, sy - 16, nt[46], 2, ni[46]);
        oi[46] = ni[46];
        ot[46] = nt[46];
    }
    if (oi[47] != ni[47] || ot[47] != nt[47])
    {
        drawFont4Int(screen, sx + 8 * 11, sy - 16, nt[47], 2, ni[47]);
        oi[47] = ni[47];
        ot[47] = nt[47];
    }
}
export function Tn(screen, x, y, c, ot$o, ot$k, nt, otp$o, otp$k, ntp) {

    if (ot$o[ot$k] == nt && otp$o[otp$k] == ntp)
    {
        return;
    }

    drawTnP(screen, x * 4, y * 4 + c * 8, nt, ntp);
    ot$o[ot$k] = nt;
    otp$o[otp$k] = ntp;
}
export function screenInitYM2203(screen, tp) {
    if (screen == null) return;

    //YM2203
    for (let y = 0; y < 3 + 3 + 3; y++)
    {

        drawFont8(screen, 296 + 32, y * 8 + 8, 1, "   ");
        for (let i = 0; i < 96; i++)
        {
            let kx = Tables.kbl[(i % 12) * 2] + div(i, 12) * 28;
            let kt = Tables.kbl[(i % 12) * 2 + 1];
            drawKbn(screen, 32 + kx, y * 8 + 8, kt, tp);
        }

        let d = 99;
        Volume(screen, 272, 8 + y * 8, 0, { v: d }, 'v', 0, tp);

        if (y < 9)
        {
            ChYM2203_P(screen, 0, y * 8 + 8, y, false, tp);
        }
    }

}
export function AmdYM2151(screen, oamd$o, oamd$k, namd) {
    if (oamd$o[oamd$k] == namd)
    {
        return;
    }

    let x = 4 * 66 + 1;
    let y = 8 * 26;
    drawFont4Int(screen, x, y, 0, 3, namd);

    oamd$o[oamd$k] = namd;
}
export function ChYM2151(screen, ch, om$o, om$k, nm, tp) {

    if (om$o[om$k] == nm)
    {
        return;
    }

    ChYM2151_P(screen, 1, 8 + ch * 8, ch, nm == null ? false : !!nm, tp);
    om$o[om$k] = nm;
}
export function ChYM2151_P(screen, x, y, ch, mask, tp) {
    if (screen == null) return;

    screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 0, 0, 16, 8);
    drawFont8(screen, x + 16, y, mask ? 1 : 0, String(1 + ch));
}
export function InstOPM(screen, x, y, c, oi, ni) {
    let sx = (c % 3) * 27 * 4 + x;
    let sy = (div(c, 3)) * 8 * 6 + 8 * y;

    for (let j = 0; j < 4; j++)
    {
        for (let i = 0; i < 11; i++)
        {
            if (oi[i + j * 11] != ni[i + j * 11])
            {
                drawFont4Int(screen, sx + i * 8 + (i > 5 ? 4 : 0), sy + j * 8, 0, (i == 5) ? 3 : 2, ni[i + j * 11]);
                oi[i + j * 11] = ni[i + j * 11];
            }
        }
    }

    if (oi[44] != ni[44])
    {
        drawFont4Int(screen, sx + 8 * 4, sy - 16, 0, 2, ni[44]);
        oi[44] = ni[44];
    }
    if (oi[45] != ni[45])
    {
        drawFont4Int(screen, sx + 8 * 6, sy - 16, 0, 2, ni[45]);
        oi[45] = ni[45];
    }
    if (oi[46] != ni[46])
    {
        drawFont4Int(screen, sx + 8 * 8 + 4, sy - 16, 0, 2, ni[46]);
        oi[46] = ni[46];
    }
    if (oi[47] != ni[47])
    {
        drawFont4Int(screen, sx + 8 * 11, sy - 16, 0, 2, ni[47]);
        oi[47] = ni[47];
    }
}
export function KcYM2151(screen, ch, ok$o, ok$k, nk) {
    if (ok$o[ok$k] == nk)
    {
        return;
    }

    let x = 78 * 4 +1;
    let y = ch * 8 + 8;
    drawFont4HexByte(screen, x, y, 0, nk);
    ok$o[ok$k] = nk;
}
export function KeyBoardOPM(screen, ch, ot$o, ot$k, nt, tp) {
    if (ot$o[ot$k] == nt) return;

    let kx = 0;
    let kt = 0;

    let y = (ch + 1) * 8;

    if (ot$o[ot$k] >= 0 && ot$o[ot$k] < 12 * 8)
    {
        kx = Tables.kbl[(ot$o[ot$k] % 12) * 2] + div(ot$o[ot$k], 12) * 28;
        kt = Tables.kbl[(ot$o[ot$k] % 12) * 2 + 1];
        drawKbn(screen, 33 + kx, y, kt, tp);
    }

    if (nt >= 0 && nt < 12 * 8)
    {
        kx = Tables.kbl[(nt % 12) * 2] + div(nt, 12) * 28;
        kt = Tables.kbl[(nt % 12) * 2 + 1] + 4;
        drawKbn(screen, 33 + kx, y, kt, tp);
    }

    drawFont8(screen, 82 * 4 + 1, y, 1, "   ");

    if (nt >= 0)
    {
        drawFont8(screen, 82 * 4 + 1, y, 1, Tables.kbn[nt % 12]);
        if (div(nt, 12) < 10)
        {
            drawFont8(screen, 86 * 4 + 1, y, 1, Tables.kbo[div(nt, 12)]);
        }
    }

    ot$o[ot$k] = nt;
}
export function KfYM2151(screen, ch, ok$o, ok$k, nk) {
    if (ok$o[ok$k] == nk)
    {
        return;
    }

    let x = 80 * 4 + 1;
    let y = ch * 8 + 8;
    drawFont4HexByte(screen, x, y, 0, nk);
    ok$o[ok$k] = nk;
}
export function LfoSyncYM2151(screen, olfosync$o, olfosync$k, nlfosync) {
    if (olfosync$o[olfosync$k] == nlfosync)
    {
        return;
    }

    let x = 4 * 83+1;
    let y = 8 * 25;
    drawFont4Int(screen, x, y, 0, 1, nlfosync);

    olfosync$o[olfosync$k] = nlfosync;
}
export function LfrqYM2151(screen, olfrq$o, olfrq$k, nlfrq) {
    if (olfrq$o[olfrq$k] == nlfrq)
    {
        return;
    }

    let x = 4 * 66 + 1;
    let y = 8 * 24;
    drawFont4Int(screen, x, y, 0, 3, nlfrq);

    olfrq$o[olfrq$k] = nlfrq;
}
export function NeYM2151(screen, one$o, one$k, nne) {
    if (one$o[one$k] == nne)
    {
        return;
    }

    let x = 4 * 67+1;
    let y = 8 * 22;
    drawFont4Int(screen, x, y, 0, 1, nne);

    one$o[one$k] = nne;
}
export function NfrqYM2151(screen, onfrq$o, onfrq$k, nnfrq) {
    if (onfrq$o[onfrq$k] == nnfrq)
    {
        return;
    }

    let x = 4 * 67 + 1;
    let y = 8 * 23;
    drawFont4Int(screen, x, y, 0, 2, nnfrq);

    onfrq$o[onfrq$k] = nnfrq;
}
export function PmdYM2151(screen, opmd$o, opmd$k, npmd) {
    if (opmd$o[opmd$k] == npmd)
    {
        return;
    }

    let x = 4 * 66 + 1;
    let y = 8 * 25;
    drawFont4Int(screen, x, y, 0, 3, npmd);

    opmd$o[opmd$k] = npmd;
}
export function WaveFormYM2151(screen, owaveform$o, owaveform$k, nwaveform) {
    if (owaveform$o[owaveform$k] == nwaveform)
    {
        return;
    }

    let x = 4 * 83+1;
    let y = 8 * 24;
    drawFont4Int(screen, x, y, 0, 1, nwaveform);

    owaveform$o[owaveform$k] = nwaveform;
}
export function ChYM2413(screen, ch, om$o, om$k, nm, tp) {

    if (om$o[om$k] == nm)
    {
        return;
    }

    ChYM2413_P(screen, 0, ch < 9 ? (8 + ch * 8) : (8 + 9 * 8), ch, nm == null ? false : !!nm, tp);
    om$o[om$k] = nm;
}
export function KeyBoard(screen, y, ot$o, ot$k, nt, tp) {
    if (ot$o[ot$k] == nt) return;

    let kx = 0;
    let kt = 0;

    y = (y + 1) * 8;

    if (ot$o[ot$k] >= 0 && ot$o[ot$k] < 12 * 8)
    {
        kx = Tables.kbl[(ot$o[ot$k] % 12) * 2] + div(ot$o[ot$k], 12) * 28;
        kt = Tables.kbl[(ot$o[ot$k] % 12) * 2 + 1];
        drawKbn(screen, 32 + kx, y, kt, tp);
    }

    if (nt >= 0 && nt < 12 * 8)
    {
        kx = Tables.kbl[(nt % 12) * 2] + div(nt, 12) * 28;
        kt = Tables.kbl[(nt % 12) * 2 + 1] + 4;
        drawKbn(screen, 32 + kx, y, kt, tp);
    }

    drawFont8(screen, 296, y, 1, "   ");

    if (nt >= 0)
    {
        drawFont8(screen, 296, y, 1, Tables.kbn[nt % 12]);
        if (div(nt, 12) < 10)
        {
            drawFont8(screen, 312, y, 1, Tables.kbo[div(nt, 12)]);
        }
    }

    ot$o[ot$k] = nt;
}
export function SUSFlag(screen, x, y, t, oi$o, oi$k, ni) {
    if (oi$o[oi$k] != ni)
    {
        drawFont4(screen, x * 4, y * 4, t, ni == 0 ? "-" : "*");
        oi$o[oi$k] = ni;
    }
}
export function VolumeXY(screen, x, y, c, ov$o, ov$k, nv, tp) {
    if (ov$o[ov$k] == nv) return;

    let t = 0;
    let sy = 0;
    if (c == 1 || c == 2) { t = 4; }
    if (c == 2) { sy = 4; }

    y *= 4;
    x *= 4;

    for (let i = 0; i <= 19; i++)
    {
        VolumeP(screen, x + i * 2, y + sy, (1 + t), tp);
    }

    for (let i = 0; i <= nv; i++)
    {
        VolumeP(screen, x + i * 2, y + sy, i > 17 ? (2 + t) : (0 + t), tp);
    }

    ov$o[ov$k] = nv;

}
export function drawInstNumber(screen, x, y, oi$o, oi$k, ni) {
    if (oi$o[oi$k] != ni)
    {
        drawFont4Int(screen, x * 4, y * 4, 0, 2, ni);
        oi$o[oi$k] = ni;
    }
}
export function ChAY8910(screen, ch, om$o, om$k, nm, tp) {

    if (om$o[om$k] == nm)
    {
        return;
    }

    ChAY8910_P(screen, 0, 8 + ch * 8, ch, nm == null ? false : !!nm, tp);
    om$o[om$k] = nm;
}
export function KeyBoardDCSG(screen, x, y, ot$o, ot$k, nt, tp) {
    if (ot$o[ot$k] == nt) return;

    let kx ;
    let kt ;

    if (ot$o[ot$k] >= 0 && ot$o[ot$k] < 12 * 8)
    {
        kx = Tables.kbl[(ot$o[ot$k] % 12) * 2] + div(ot$o[ot$k], 12) * 28;
        kt = Tables.kbl[(ot$o[ot$k] % 12) * 2 + 1];
        drawKbn(screen, x + kx, y, kt, tp);
    }

    if (nt >= 0 && nt < 12 * 8)
    {
        kx = Tables.kbl[(nt % 12) * 2] + div(nt, 12) * 28;
        kt = Tables.kbl[(nt % 12) * 2 + 1] + 4;
        drawKbn(screen, x + kx, y, kt, tp);
    }

    drawFont8(screen, 288 + x, y, 1, "   ");

    if (nt >= 0)
    {
        drawFont8(screen, 288 + x, y, 1, Tables.kbn[nt % 12]);
        if (div(nt, 12) < 10)
        {
            drawFont8(screen, 304 + x, y, 1, Tables.kbo[div(nt, 12)]);
        }
    }

    ot$o[ot$k] = nt;
}
export function ToneNoise(screen, x, y, c, ot$o, ot$k, nt, otp$o, otp$k, ntp) {

    if (ot$o[ot$k] == nt && otp$o[otp$k] == ntp)
    {
        return;
    }

    ToneNoiseP(screen, x * 4, y * 4 + c * 8, nt, ntp);
    ot$o[ot$k] = nt;
    otp$o[otp$k] = ntp;
}
export function drawFont4(screen, x, y, t, msg) {
    if (screen == null) return;

    for (const c of msg)
    {
        let cd = c.charCodeAt(0) - 65 + 0x20 + 1;
        screen.draw(x, y, rFont2[t], 128, (cd % 32) * 4, (div(cd, 32)) * 8, 4, 8);
        x += 4;
    }
}
export function ChK051649(screen, ch, om$o, om$k, nm, tp) {

    if (om$o[om$k] == nm)
    {
        return;
    }

    ChK051649_P(screen, 0, 8 + ch * 8, ch, nm == null ? false : !!nm, tp);
    om$o[om$k] = nm;
}
export function WaveFormToK051649(screen, c, oi$o, oi$k, ni) {
    for (let i = 0; i < 32; i++)
    {
        if (oi$o[oi$k][i] == ni[i]) continue;

        let n = (div(ni[i], 8)) + 16;
        let x = c % 3;
        x = x * 104 + i + 4;
        let y = div(c, 3);
        y = y * 48 + 80;

        let m = 0;
        m = (n > 7) ? 8 : n;
        screen.draw(x, y, rWavGraph, 64, m, 0, 1, 8);
        m = (n > 15) ? 8 : ((n - 8) < 0 ? 0 : (n - 8));
        screen.draw(x, y - 8, rWavGraph, 64, m, 0, 1, 8);
        m = (n > 23) ? 8 : ((n - 16) < 0 ? 0 : (n - 16));
        screen.draw(x, y - 16, rWavGraph, 64, m, 0, 1, 8);
        m = (n > 31) ? 8 : ((n - 24) < 0 ? 0 : (n - 24));
        screen.draw(x, y - 23, rWavGraph, 64, m + 1, 0, 1, 7);

        oi$o[oi$k][i] = ni[i];
    }
}
export function font4Hex4Bit(screen, x, y, t, on$o, on$k, nn) {
    if (on$o[on$k] == nn) return;

    drawFont4Hex4Bit(screen, x, y, t, nn);
    on$o[on$k] = nn;
}
export function screenInitK051649(screen) {
    for (let ch = 0; ch < 5; ch++)
    {
        for (let ot = 0; ot < 12 * 8; ot++)
        {
            let kx = Tables.kbl[(ot % 12) * 2] + div(ot, 12) * 28;
            let kt = Tables.kbl[(ot % 12) * 2 + 1];
            drawKbn(screen, 32 + kx, ch * 8 + 8, kt, 0);
        }
        drawFont8(screen, 296, ch * 8 + 8, 1, "   ");
    }
}
export function Ch3YM2612_P(screen, x, y, ch, mask, ex, tp) {
    if (!ex)
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 0, 0, 16, 8);
        drawFont8(screen, x + 16, y, mask ? 1 : 0, String(ch + 1));
    }
    else
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 0, 24, 24, 8);
    }
}
export function ChYM2608_P(screen, x, y, ch, mask, tp) {
    if (screen == null) return;

    if (ch < 6)
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 0, 0, 16, 8);
        drawFont8(screen, x + 16, y, mask ? 1 : 0, String(1 + ch));
    }
    else if (ch < 9)
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 32, 0, 16, 8);
        drawFont8(screen, x + 16, y, mask ? 1 : 0, String(1 + ch - 6));
    }
    else if (ch < 12)
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 32 * (ch - 8), 24, 32, 8);
    }
    else
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 64, 0, 24, 8);
    }
}
export function ChYM2608Rhythm_P(screen, x, y, ch, mask, tp) {
    if (screen == null) return;
    switch (ch)
    {
        case 0:
            drawFont4(screen, x + 0 * 4, y, mask ? 1 : 0, "B");
            break;
        case 1:
            drawFont4(screen, x + 15 * 4, y, mask ? 1 : 0, "S");
            break;
        case 2:
            drawFont4(screen, x + 30 * 4, y, mask ? 1 : 0, "C");
            break;
        case 3:
            drawFont4(screen, x + 45 * 4, y, mask ? 1 : 0, "H");
            break;
        case 4:
            drawFont4(screen, x + 60 * 4, y, mask ? 1 : 0, "T");
            break;
        case 5:
            drawFont4(screen, x + 75 * 4, y, mask ? 1 : 0, "R");
            break;
    }
}
export function drawEtypeP(screen, x, y, t) {
    if (screen == null) return;
    screen.draw(x, y, rPSGEnv, 128, 8 * t, 0, 8, 8);
    drawFont4Int2(screen, x + 12, y, 0, 2, t);
}
export function drawFont4Int(screen, x, y, t, k, num) {
    if (screen == null) return;

    let n ;
    if (k == 3)
    {
        let f = false;
        n = div(num, 100);
        num -= n * 100;
        n = (n > 9) ? 0 : n;
        if (n != 0)
        {
            screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);
            if (n != 0) { f = true; }
        }
        else
        {
            screen.draw(x, y, rFont2[t], 128, 0, 0, 4, 8);
        }

        n = div(num, 10);
        num -= n * 10;
        x += 4;
        if (n != 0 || f)
        {
            screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);
            if (n != 0) { f = true; }
        }
        else
        {
            screen.draw(x, y, rFont2[t], 128, 0, 0, 4, 8);
        }

        n = div(num, 1);
        x += 4;
        screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);
        return;
    }

    n = div(num, 10);
    num -= n * 10;
    n = (n > 9) ? 0 : n;
    if (n != 0)
    {
        screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);
    }
    else
    {
        screen.draw(x, y, rFont2[t], 128, 0, 0, 4, 8);
    }

    n = div(num, 1);
    x += 4;
    screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);
}
export function drawTnP(screen, x, y, t, tp) {
    if (screen == null) return;
    screen.draw(x, y, rPSGMode[tp], 32, 8 * t, 0, 8, 8);
}
export function VolumeP(screen, x, y, t, tp) {
    if (screen == null) return;
    screen.draw(x, y, rVol[tp], 32, 2 * t, 0, 2, 8 - (div(t, 4)) * 4);
}
export function drawFont4Hex12Bit(screen, x, y, t, num) {
    if (screen == null) return;

    let n ;
    num = Common.Range(num & 0xffff, 0, 0xfff);

    n = div(num, 0x100);
    num -= n * 0x100;
    n = (n > 0xf) ? 0 : n;
    drawFont4(screen, x, y, t, Tables.hexCh[n]);

    n = div(num, 0x10);
    num -= n * 0x10;
    n = (n > 0xf) ? 0 : n;
    x += 4;
    drawFont4(screen, x, y, t, Tables.hexCh[n]);

    n = div(num, 1);
    x += 4;
    drawFont4(screen, x, y, t, Tables.hexCh[n]);

    return;
}
export function drawFont4Hex16Bit(screen, x, y, t, num) {
    if (screen == null) return;

    let n ;
    num = Common.Range(num & 0xffff, 0, 0xffff);

    n = div(num, 0x1000);
    num -= n * 0x1000;
    n = (n > 0xf) ? 0 : n;
    drawFont4(screen, x, y, t, Tables.hexCh[n]);

    n = div(num, 0x100);
    num -= n * 0x100;
    n = (n > 0xf) ? 0 : n;
    x += 4;
    drawFont4(screen, x, y, t, Tables.hexCh[n]);

    n = div(num, 0x10);
    num -= n * 0x10;
    n = (n > 0xf) ? 0 : n;
    x += 4;
    drawFont4(screen, x, y, t, Tables.hexCh[n]);

    n = div(num, 1);
    x += 4;
    drawFont4(screen, x, y, t, Tables.hexCh[n]);

    return;
}
export function drawFont4HexByte(screen, x, y, t, num) {
    if (screen == null) return;

    let n ;
    num = Common.Range(num & 0xff, 0, 255);

    n = div(num, 0x10);
    num -= n * 0x10;
    n = (n > 0xf) ? 0 : n;
    drawFont4(screen, x, y, t, Tables.hexCh[n]);

    n = div(num, 1);
    x += 4;
    drawFont4(screen, x, y, t, Tables.hexCh[n]);

    return;
}
export function drawFont4Int2(screen, x, y, t, k, num) {
    if (screen == null) return;

    let n ;
    if (k == 3)
    {
        n = div(num, 100);
        num -= n * 100;
        n = (n > 9) ? 0 : n;
        screen.draw(x, y, rFont2[t], 128, (n * 4 + 64), 0, 4, 8);

        n = div(num, 10);
        num -= n * 10;
        x += 4;
        screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);

        n = div(num, 1);
        x += 4;
        screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);
        return;
    }

    n = div(num, 10);
    num -= n * 10;
    n = (n > 9) ? 0 : n;
    screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);

    n = div(num, 1);
    x += 4;
    screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);
}
export function drawFont4Int3(screen, x, y, t, k, num) {
    if (screen == null) return;

    let n ;
    if (k == 3)
    {
        n = div(num, 100);
        num -= n * 100;
        n = (n > 9) ? 0 : n;
        screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);

        n = div(num, 10);
        num -= n * 10;
        x += 4;
        screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);

        n = div(num, 1);
        x += 4;
        screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);
        return;
    }

    n = div(num, 10);
    num -= n * 10;
    n = (n > 9) ? 0 : n;
    screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);

    n = div(num, 1);
    x += 4;
    screen.draw(x, y, rFont2[t], 128, n * 4 + 64, 0, 4, 8);
}
export function ChYM2610Rhythm_P(screen, x, y, ch, mask, tp) {
    if (screen == null) return;

    switch (ch)
    {
        case 0:
            drawFont4(screen, x + 15 * 0 * 4, y, mask ? 1 : 0, "A1");
            break;
        case 1:
            drawFont4(screen, x + 15 * 1 * 4 + 4, y, mask ? 1 : 0, "2");
            break;
        case 2:
            drawFont4(screen, x + 15 * 2 * 4 + 4, y, mask ? 1 : 0, "3");
            break;
        case 3:
            drawFont4(screen, x + 15 * 3 * 4 + 4, y, mask ? 1 : 0, "4");
            break;
        case 4:
            drawFont4(screen, x + 15 * 4 * 4 + 4, y, mask ? 1 : 0, "5");
            break;
        case 5:
            drawFont4(screen, x + 15 * 5 * 4 + 4, y, mask ? 1 : 0, "6");
            break;
    }
}
export function ChYM2203_P(screen, x, y, ch, mask, tp) {
    if (screen == null) return;

    if (ch < 3)
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 0, 0, 16, 8);
        drawFont8(screen, x + 16, y, mask ? 1 : 0, String(1 + ch));
    }
    else if (ch < 6)
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 32, 0, 16, 8);
        drawFont8(screen, x + 16, y, mask ? 1 : 0, String(1 + ch - 3));
    }
    else if (ch < 9)
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 32 * (ch - 5), 24, 32, 8);
    }
    else
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 0, 0, 24, 8);
    }
}
export function ChYM2413_P(screen, x, y, ch, mask, tp) {
    if (screen == null) return;

    if (ch < 9)
    {
        screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 0, 0, 16, 8);
        drawFont8(screen, x + 16, y, mask ? 1 : 0, String(1 + ch));
    }
    else
    {
        switch (ch)
        {
            case 9:
                drawFont4(screen, (ch - 9) * 4 * 15 + 4 * 4, y, mask ? 1 : 0, "BD");
                break;
            case 10:
                drawFont4(screen, (ch - 9) * 4 * 15 + 4 * 4, y, mask ? 1 : 0, "SD");
                break;
            case 11:
                drawFont4(screen, (ch - 9) * 4 * 15 + 4 * 4, y, mask ? 1 : 0, "TM");
                break;
            case 12:
                drawFont4(screen, (ch - 9) * 4 * 15 + 3 * 4, y, mask ? 1 : 0, "CYM");// 3 character
                break;
            case 13:
                drawFont4(screen, (ch - 9) * 4 * 15 + 4 * 4, y, mask ? 1 : 0, "HH");
                break;
        }
    }
}
export function ChAY8910_P(screen, x, y, ch, mask, tp) {
    if (screen == null) return;

    screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 32, 0, 16, 8);
    drawFont8(screen, x + 16, y, mask ? 1 : 0, String(1 + ch));
}
export function ToneNoiseP(screen, x, y, t, tp) {
    if (screen == null) return;
    screen.draw(x, y, rPSGMode[tp], 32, 8 * t, 0, 8, 8);
}
export function ChK051649_P(screen, x, y, ch, mask, tp) {
    if (screen == null) return;

    screen.draw(x, y, rType[tp * 2 + (mask ? 1 : 0)], 128, 112, 0, 16, 8);
    drawFont8(screen, x + 16, y, mask ? 1 : 0, String(1 + ch));
}
export function drawFont4Hex4Bit(screen, x, y, t, num) {
    if (screen == null) return;

    let n ;
    num = Common.Range(num & 0xff, 0, 15);

    n = num;
    drawFont4(screen, x, y, t, Tables.hexCh[n]);

    return;
}


// MDChipParams.Channel: what a panel shows for one channel. -1 means "not drawn yet".
export class Channel {
  constructor() {
    Object.assign(this, {
      pan: -1, panL: -1, panR: -1, pantp: -1, note: -1, volume: -1, volumeL: -1, volumeR: -1,
      volumeRL: -1, volumeRR: -1, freq: -1, mask: false, slot: 0, kc: -1, kf: -1, tn: 0, ex: false, tntp: -1,
    });
    this.inst = new Array(67).fill(-1);
  }
}

export const channels = (n) => Array.from({ length: n }, () => new Channel());

// MDPlayer4Mac's PixelScreen.ReorderRowsFrom: moves whole background rows (with their
// labels) so a panel can list channels in a different order.
export function reorderRows(screen, plane, firstRowY, rowHeight, sourceRows) {
  sourceRows.forEach((src, dst) => {
    screen.draw(0, firstRowY + dst * rowHeight, plane, plane.width, 0, firstRowY + src * rowHeight, plane.width, rowHeight);
  });
}
