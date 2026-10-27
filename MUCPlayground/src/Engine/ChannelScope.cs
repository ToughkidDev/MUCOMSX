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
        if (Get(opna, "rhythm") is Array rhythm)
        {
            var drums = new OpnaRhythm[rhythm.Length];
            for (int i = 0; i < drums.Length; i++) drums[i] = (OpnaRhythm)rhythm.GetValue(i);
            Probes.Add(new(prefix + "G", "RHY", () =>
            {
                int s = 0;
                foreach (var r in drums) if (r.sample != null && r.pos < r.size && r.pos / 1024 < r.sample.Length) s += r.sample[r.pos / 1024] * (127 - Math.Clamp((int)r.level, 0, 127)) >> 7;
                return s;
            }));
        }
        var adpcm = FieldOf(opna.GetType(), "adpcmout");
        if (adpcm != null) Probes.Add(new(prefix + "K", "ADPCM", () => (int)adpcm.GetValue(opna)));
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

    public void AddAy8910(MDSound.ay8910 instrument)
    {
        if (Get(instrument, "chip") is Array chips && chips.GetValue(0) is Psg psg)
            AddPsg(psg, new[] { "MSXD", "MSXE", "MSXF" }, "PSG");
    }

    // ---------- YM2413 (emu2413) ----------
    public void AddOpll(MDSound.emu2413 instrument)
    {
        if (Get(instrument, "opll_") is not Array chips || chips.GetValue(0) is not object opll || Get(opll, "ch_out") is not short[] chOut) return;
        string[] names = { "MSXA", "MSXB", "MSXC", "MSXH", "MSXI", "MSXJ" };
        for (int c = 0; c < 6; c++)
        {
            int k = c;
            Probes.Add(new(names[k], "OPLL", () => chOut[k] * 4));
        }
        Probes.Add(new("MSXG", "DRUM", () =>
        {
            int s = 0;
            for (int i = 6; i < chOut.Length; i++) s += chOut[i];
            return s * 4;
        }));
    }

    // ---------- K051649 / K052539 (SCC, SCC+) ----------
    public void AddScc(MDSound.K051649 instrument)
    {
        var state = instrument.GetK051649_State(0);
        if (state?.channel_list == null) return;
        string[] names = { "SCCA", "SCCB", "SCCC", "SCCD", "SCCE" };
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
}
