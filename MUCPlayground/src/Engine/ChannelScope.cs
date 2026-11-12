// Per-channel output for the page's oscilloscope view. Nothing is emulated twice: after each
// output sample the chip emulators' own per-channel state is read, the value each channel
// is producing at that moment:
//   YM2608 FM      the carrier operators' last output (fmgen Operator.out_; which operators
//                  are carriers comes from the algorithm written to $B0–$B2)
//   YM2608 SSG,    the tone counter's square and the channel's level, or the noise and
//   AY8910 (PSG)   envelope generators, as fmgen's PSG.Mix combines them
//   YM2608 rhythm  the six drums' current samples, summed (one part, G)
//   YM2608 ADPCM   the ADPCM-B output
//   YM2413         emu2413's ch_out (melody channels; the rhythm channels summed)
//   K051649 (SCC)  the wave RAM at the channel's counter, times its volume
// and, for VGM files (MDPlayer's own VGM path, the same MDSound cores):
//   YM2203 / YM2610 FM, SSG and ADPCM-B as on the YM2608 (fmgen OPN / OPNB)
//   YM2151         fmgen OPM's carriers
//   YM2612         the Gens core's channel output (OUTd); channel 6 its DAC when enabled
//   SN76489        each channel's value before panning (Channels[])
// The fields are the emulators' internals, found once by reflection when playback starts
// (only the few values that are plain numbers are read through reflection per sample).
// Samples are kept at every second output sample (22,050 Hz) while the view is open.
using System.Reflection;
using Channel4 = MDSound.fmgen.fmgen.Channel4;
using Psg = MDSound.fmgen.PSG;
using OpnaRhythm = MDSound.fmgen.OPNA.Rhythm;

namespace MucPlayground;

sealed class ChannelScope
{
    public const int Decimate = 2;
    public sealed record Probe(string Name, string Chip, Func<int> Read);

    public readonly List<Probe> Probes = new();
    readonly List<short> data = new();
    readonly List<Action> prepare = new();   // once per kept sample, before the probes
    int phase;
    long firstFrame = -1;                    // the output frame of the first sample in data

    const BindingFlags Any = BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.DeclaredOnly;

    static FieldInfo FieldOf(Type t, string name)
    {
        for (; t != null; t = t.BaseType) { var f = t.GetField(name, Any); if (f != null) return f; }
        return null;
    }
    static object Get(object o, string name) => o == null ? null : FieldOf(o.GetType(), name)?.GetValue(o);

    // Called once per output sample while playing; keeps every Decimate-th.
    public void Capture(long frame)
    {
        if (++phase < Decimate) return;
        phase = 0;
        if (data.Count == 0) firstFrame = frame;
        foreach (var p in prepare) p();
        foreach (var p in Probes)
        {
            int v;
            try { v = p.Read(); } catch { v = 0; }
            data.Add((short)Math.Clamp(v, short.MinValue, short.MaxValue));
        }
    }

    // The samples kept since the last call: one value per probe for each kept sample, and
    // the output frame of the first.
    public short[] Take(out long frame)
    {
        frame = firstFrame;
        var a = data.ToArray();
        data.Clear();
        return a;
    }

    // ---------- YM2608 (fmgen OPNA) ----------
    // algo: the algorithm of each FM channel (0–5), kept by the engine from $B0–$B2 writes.
    public void AddOpna(MDSound.ym2608 instrument, int id, int[] algo, string prefix)
    {
        if (Get(instrument, "chip") is not Array chips || chips.GetValue(id) is not object opna) return;
        if (Get(opna, "ch") is Channel4[] ch)
        {
            string[] names = { "A", "B", "C", "H", "I", "J" };
            for (int c = 0; c < 6; c++)
            {
                int k = c;
                Probes.Add(new(prefix + names[k], "FM", () => Carriers(ch[k], algo[k])));
            }
        }
        if (Get(opna, "psg") is Psg psg) AddPsg(psg, new[] { prefix + "D", prefix + "E", prefix + "F" }, "SSG");
        AddOpnaRest(opna, prefix + "G", prefix + "K");
    }

    void AddOpnaRest(object opna, string rhythmName, string adpcmName)
    {
        if (Get(opna, "rhythm") is Array rhythm)
        {
            var drums = new OpnaRhythm[rhythm.Length];
            for (int i = 0; i < drums.Length; i++) drums[i] = (OpnaRhythm)rhythm.GetValue(i);
            Probes.Add(new(rhythmName, "RHY", () =>
            {
                int s = 0;
                foreach (var r in drums) if (r.sample != null && r.pos < r.size && r.pos / 1024 < r.sample.Length) s += r.sample[r.pos / 1024] * (127 - Math.Clamp((int)r.level, 0, 127)) >> 7;
                return s;
            }));
        }
        var adpcm = FieldOf(opna.GetType(), "adpcmout");
        if (adpcm != null) Probes.Add(new(adpcmName, "ADPCM", () => (int)adpcm.GetValue(opna)));
    }

    // The carriers of each algorithm (fmgen's operator order), summed.
    static int Carriers(Channel4 ch, int algo)
    {
        var op = ch.op;
        return algo switch
        {
            < 4 => op[3].out_,
            4 => op[1].out_ + op[3].out_,
            5 or 6 => op[1].out_ + op[2].out_ + op[3].out_,
            _ => op[0].out_ + op[1].out_ + op[2].out_ + op[3].out_,
        };
    }

    // ---------- fmgen PSG: YM2608 SSG and the MSX's AY8910 ----------
    void AddPsg(Psg psg, string[] names, string chip)
    {
        if (Get(psg, "reg") is not byte[] reg || Get(psg, "olevel") is not uint[] olevel
            || Get(psg, "scount") is not uint[] scount || Get(psg, "speriod") is not uint[] speriod) return;
        var noisetable = Get(psg, "noisetable") as uint[];
        var ncountF = FieldOf(psg.GetType(), "ncount");
        var ecountF = FieldOf(psg.GetType(), "ecount");
        var envelopF = FieldOf(psg.GetType(), "envelop");
        int noise = 0;
        uint env = 0;
        // noise and envelope are shared by the three channels: read once per sample
        prepare.Add(() =>
        {
            int r7 = ~reg[7];
            if ((r7 & 0x38) != 0 && noisetable != null && ncountF != null)
            {
                uint n = (uint)ncountF.GetValue(psg);
                noise = (int)(noisetable[(n >> (Psg.noiseshift + Psg.oversampling + 6)) & (Psg.noisetablesize - 1)]
                    >> (int)((n >> (Psg.noiseshift + Psg.oversampling + 1)) & 31)) & 1;
            }
            if (((reg[8] | reg[9] | reg[10]) & 0x10) != 0 && ecountF != null && envelopF?.GetValue(psg) is uint[] envelop && envelop.Length > 0)
            {
                uint e = (uint)ecountF.GetValue(psg);
                env = envelop[(e >> (Psg.envshift + Psg.oversampling)) % (uint)envelop.Length];
            }
        });
        for (int c = 0; c < 3; c++)
        {
            int k = c;
            Probes.Add(new(names[k], chip, () =>
            {
                int r7 = ~reg[7];
                bool tone = (r7 & (1 << k)) != 0 && speriod[k] <= (1u << Psg.toneshift);
                bool nois = (r7 & (8 << k)) != 0;
                if (!tone && !nois) return 0;
                int bit = (tone ? (int)(scount[k] >> (Psg.toneshift + Psg.oversampling)) & 1 : 0) | (nois ? noise : 0);
                int level = (int)((reg[8 + k] & 0x10) != 0 ? env : olevel[k]) >> 2;
                return bit != 0 ? level : -level;
            }));
        }
    }

    public void AddAy8910(MDSound.ay8910 instrument, int id = 0, string[] names = null)
    {
        if (Get(instrument, "chip") is Array chips && chips.GetValue(id) is Psg psg)
            AddPsg(psg, names ?? new[] { "MSXD", "MSXE", "MSXF" }, "PSG");
    }

    // ---------- YM2413 (emu2413) ----------
    // names: the melody channels (six on the MSX, nine for a VGM), then the drums.
    public void AddOpll(MDSound.emu2413 instrument, int id = 0, string[] names = null)
    {
        if (Get(instrument, "opll_") is not Array chips || chips.GetValue(id) is not object opll || Get(opll, "ch_out") is not short[] chOut) return;
        names ??= new[] { "MSXA", "MSXB", "MSXC", "MSXH", "MSXI", "MSXJ", "MSXG" };
        int melody = names.Length - 1;
        for (int c = 0; c < melody; c++)
        {
            int k = c;
            Probes.Add(new(names[k], "OPLL", () => chOut[k] * 4));
        }
        // with nine melody channels the drums are what is past them, while rhythm mode is on
        int drumsFrom = Math.Max(6, melody);
        Probes.Add(new(names[melody], "DRUM", () =>
        {
            int s = 0;
            for (int i = drumsFrom; i < chOut.Length; i++) s += chOut[i];
            return s * 4;
        }));
    }

    // ---------- K051649 / K052539 (SCC, SCC+) ----------
    public void AddScc(MDSound.K051649 instrument, int id = 0, string[] names = null)
    {
        var state = instrument.GetK051649_State((byte)id);
        if (state?.channel_list == null) return;
        names ??= new[] { "SCCA", "SCCB", "SCCC", "SCCD", "SCCE" };
        for (int c = 0; c < 5; c++)
        {
            int k = c;
            Probes.Add(new(names[k], "SCC", () =>
            {
                var v = state.channel_list[k];
                if (v == null || v.frequency <= 8 || v.key == 0) return 0;
                return v.waveram[(int)((v.counter >> 16) & 0x1f)] * v.volume * 16;
            }));
        }
    }

    // ---------- VGM files: chips the MUC engine does not use ----------
    // The algorithm of an fmgen channel, read now and then (it changes with $B0 writes).
    static readonly FieldInfo AlgoField = typeof(Channel4).GetField("algo_", BindingFlags.Instance | BindingFlags.NonPublic);

    void AddFmgenChannels(Channel4[] ch, int[] indices, string[] names)
    {
        int[] algo = new int[ch.Length];
        int count = 0;
        prepare.Add(() =>
        {
            if ((count++ & 63) != 0 || AlgoField == null) return;
            for (int i = 0; i < ch.Length; i++) algo[i] = ch[i] == null ? 7 : (int)AlgoField.GetValue(ch[i]);
        });
        for (int i = 0; i < indices.Length; i++)
        {
            int k = indices[i];
            if (k >= ch.Length || ch[k] == null) continue;
            Probes.Add(new(names[i], "FM", () => Carriers(ch[k], algo[k])));
        }
    }

    // fmgen OPN (YM2203), OPNA (YM2608) and OPNB (YM2610): FM, SSG, and the YM2608's rhythm
    // and ADPCM or the YM2610's ADPCM-B. prefix names the chip when the song has several.
    public void AddFmgenOpn(object instrument, int id, string prefix)
    {
        if (Get(instrument, "chip") is not Array chips || chips.GetValue(id) is not object opn) return;
        bool opna = opn is MDSound.fmgen.OPNA, opnb = opn is MDSound.fmgen.OPNB;
        if (Get(opn, "ch") is Channel4[] ch)
        {
            // the YM2610's four FM channels are 2, 3, 5 and 6 of the six
            int[] indices = opnb ? new[] { 1, 2, 4, 5 } : opna ? new[] { 0, 1, 2, 3, 4, 5 } : new[] { 0, 1, 2 };
            AddFmgenChannels(ch, indices, indices.Select((k, i) => $"{prefix}FM{i + 1}").ToArray());
        }
        if (Get(opn, "psg") is Psg psg) AddPsg(psg, new[] { prefix + "SSG1", prefix + "SSG2", prefix + "SSG3" }, "SSG");
        if (opna) AddOpnaRest(opn, prefix + "RHY", prefix + "ADPCM");
        else if (opnb)
        {
            var adpcm = FieldOf(opn.GetType(), "adpcmout");
            if (adpcm != null) Probes.Add(new(prefix + "ADPCMB", "ADPCM", () => (int)adpcm.GetValue(opn)));
        }
    }

    // fmgen OPM (YM2151): eight FM channels.
    public void AddOpm(object instrument, int id, string prefix)
    {
        if (Get(instrument, "chip") is not Array chips || chips.GetValue(id) is not object opm || Get(opm, "ch") is not Channel4[] ch) return;
        int[] indices = { 0, 1, 2, 3, 4, 5, 6, 7 };
        AddFmgenChannels(ch, indices, indices.Select((k) => $"{prefix}FM{k + 1}").ToArray());
    }

    // MDSound's YM2612 (the Gens core): each channel's output; channel 6 is the DAC while
    // it is enabled. The chip object is looked up each time (a reset makes a new one).
    public void AddYm2612(MDSound.ym2612 instrument, int id, string prefix)
    {
        if (instrument.YM2612_Chip == null || id >= instrument.YM2612_Chip.Length) return;
        for (int c = 0; c < 6; c++)
        {
            int k = c;
            Probes.Add(new($"{prefix}FM{k + 1}", "FM", () =>
            {
                var chip = instrument.YM2612_Chip[id];
                if (chip == null) return 0;
                if (k == 5 && chip.DAC != 0) return chip.DACdata;
                return chip.CHANNEL[k].OUTd;
            }));
        }
    }

    // MDSound's SN76489: three tone channels and the noise, before the stereo is applied.
    public void AddSn76489(MDSound.sn76489 instrument, int id, string prefix)
    {
        if (instrument.SN76489_Chip == null || id >= instrument.SN76489_Chip.Length) return;
        string[] names = { "PSG1", "PSG2", "PSG3", "NOISE" };
        for (int c = 0; c < 4; c++)
        {
            int k = c;
            Probes.Add(new(prefix + names[k], "PSG", () => instrument.SN76489_Chip[id]?.Channels[k] ?? 0));
        }
    }

    // Every chip of a VGM file that has probes, in the channel view's order, from the
    // instruments MDSound plays (its private chip list).
    public void AddMdsound(MDSound.MDSound mds)
    {
        if (Get(mds, "insts") is not MDSound.MDSound.Chip[] insts) return;
        var types = insts.Where((c) => c != null).Select((c) => Kind(c.type)).Where((k) => k != null).Distinct().ToList();
        bool many = types.Count > 1;
        foreach (var c in insts.Where((c) => c != null).OrderBy((c) => Order(c.type)).ThenBy((c) => c.ID))
        {
            string kind = Kind(c.type);
            if (kind == null) continue;
            bool twice = insts.Count((x) => x != null && Kind(x.type) == kind) > 1;
            string prefix = (many ? kind : "") + (twice ? $"#{c.ID + 1}" : "") + (many || twice ? " " : "");
            int id = c.ID;
            try
            {
                switch (c.Instrument)
                {
                    case MDSound.ym2608 or MDSound.ym2610 or MDSound.ym2203: AddFmgenOpn(c.Instrument, id, prefix); break;
                    case MDSound.ym2151 opm: AddOpm(opm, id, prefix); break;
                    case MDSound.ym2612 opn2: AddYm2612(opn2, id, prefix); break;
                    case MDSound.sn76489 dcsg: AddSn76489(dcsg, id, prefix); break;
                    case MDSound.ay8910 ay: AddAy8910(ay, id, new[] { prefix + "PSG1", prefix + "PSG2", prefix + "PSG3" }); break;
                    case MDSound.emu2413 opll: AddOpll(opll, id, Enumerable.Range(1, 9).Select((n) => $"{prefix}FM{n}").Append(prefix + "RHY").ToArray()); break;
                    case MDSound.K051649 scc: AddScc(scc, id, Enumerable.Range(1, 5).Select((n) => $"{prefix}SCC{n}").ToArray()); break;
                }
            }
            catch { /* a chip whose insides are not as expected: no scope for it */ }
        }
    }

    static string Kind(MDSound.MDSound.enmInstrumentType t) => t switch
    {
        MDSound.MDSound.enmInstrumentType.YM2608 => "OPNA",
        MDSound.MDSound.enmInstrumentType.YM2610 => "OPNB",
        MDSound.MDSound.enmInstrumentType.YM2203 => "OPN",
        MDSound.MDSound.enmInstrumentType.YM2151 => "OPM",
        MDSound.MDSound.enmInstrumentType.YM2612 => "OPN2",
        MDSound.MDSound.enmInstrumentType.SN76489 => "DCSG",
        MDSound.MDSound.enmInstrumentType.AY8910 => "PSG",
        MDSound.MDSound.enmInstrumentType.YM2413emu => "OPLL",
        MDSound.MDSound.enmInstrumentType.K051649 => "SCC",
        _ => null,
    };
    // FM first, then PSG-type chips, then wave / PCM (as the channel view stacks them).
    static int Order(MDSound.MDSound.enmInstrumentType t) => Kind(t) switch
    {
        "OPM" => 0, "OPN2" => 1, "OPLL" => 2, "OPN" => 3, "OPNA" => 4, "OPNB" => 5, "DCSG" => 6, "PSG" => 7, "SCC" => 8, _ => 9,
    };
}
