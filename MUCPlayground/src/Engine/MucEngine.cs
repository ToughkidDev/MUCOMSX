// MUCPlayground engine: compile MUC source and render it to PCM, entirely in memory.
//
// This is a trimmed copy of MDPlayer4Mac's MUC/MUB path (macos/MDPlayerCore/MusicEngine.cs
// LoadMub and Driver/MUCOM/MucomDotNET.cs). The compiler, MUCOM88 driver, MSX helpers and
// MDSound chip emulators are MDPlayer4Mac's own; what is left out here is the desktop
// player's UI bookkeeping (channel masks, LEDs, piano roll, real-chip output, fades), none
// of which changes the samples when it is idle.
using System.Reflection;
using System.Text;
using MDPlayer.Driver.MUCOM;
using mucomDotNET.Common;
using musicDriverInterface;

namespace MucPlayground;

public sealed record CompileMessage(int Row, int Col, string Text);

public sealed class CompileResult
{
    public byte[] Mub;
    public List<CompileMessage> Errors = new();
    public List<CompileMessage> Warnings = new();
    public bool Ok => Mub != null && Errors.Count == 0;
}

public static class MucEngine
{
    public const uint SampleRate = 44100;
    public const uint OpnaClock = 7_987_200;
    public const uint OpnbClock = 8_000_000;
    public const uint OpmClock = 3_579_545;

    static bool encodingsRegistered;
    static string loadedLanguage;

    // Shift-JIS and compiler messages need one-time setup in the browser. Calling again with
    // another language ("en" or "ja") reloads the compiler's messages.
    public static void Initialize(string language = null)
    {
        if (!encodingsRegistered)
        {
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
            encodingsRegistered = true;
        }
        language = language == "ja" ? "ja" : language == null && loadedLanguage != null ? loadedLanguage : "en";
        if (language == loadedLanguage) return;
        string name = language == "ja" ? "lang/mucomDotNETmessage.ja-JP.txt" : "lang/mucomDotNETmessage.txt";
        using Stream s = Resource(name) ?? Resource("lang/mucomDotNETmessage.txt");
        if (s != null)
        {
            using StreamReader r = new(s, Encoding.UTF8);
            msg.MakeMessageDic(r.ReadToEnd().Split('\n').Select(l => l.TrimEnd('\r')).ToArray());
        }
        loadedLanguage = language;
    }

    public static Encoding ShiftJis => Encoding.GetEncoding(932);

    static Stream Resource(string name)
        => typeof(MucEngine).Assembly.GetManifestResourceStream(name);

    // The YM2608 emulator asks for 2608_BD.WAV etc. by name.
    public static Stream OpenRhythm(string name)
    {
        string wanted = "rhythm/" + Path.GetFileName(name ?? "");
        string match = typeof(MucEngine).Assembly.GetManifestResourceNames()
            .FirstOrDefault(n => string.Equals(n, wanted, StringComparison.OrdinalIgnoreCase));
        return match == null ? null : Resource(match);
    }

    // Same framing and normalization as MDPlayer4Mac's MucomDotNET.CompileMuc.
    public static CompileResult Compile(byte[] source, Func<string, Stream> openFile)
    {
        Initialize();
        CompileResult result = new();
        if (source != null)
        {
            int start = source.AsSpan().StartsWith(new byte[] { 0xef, 0xbb, 0xbf }) ? 3 : 0;
            int eof = Array.IndexOf(source, (byte)0x1a, start);
            int end = eof < 0 ? source.Length : eof;
            if (start != 0 || end != source.Length) source = source.AsSpan(start, end - start).ToArray();
        }
        if (source == null || source.Length == 0)
        {
            result.Errors.Add(new(-1, -1, "MUC source is empty."));
            return result;
        }

        try
        {
            if (MsxMucCompiler.IsNativeSource(source))
            {
                result.Mub = MsxMucCompiler.Compile(source, "song.muc", openFile);
                if (result.Mub == null) result.Errors.Add(new(-1, -1, "MUCOMSX native MSX compilation failed."));
                return result;
            }

            mucomDotNET.Compiler.Compiler compiler = new();
            compiler.Init();
            using MemoryStream input = new(NormalizeTrackDeclarationIndentation(source), writable: false);
            MmlDatum[] compiled = compiler.Compile(input, openFile);
            CompilerInfo info = compiler.GetCompilerInfo();
            if (info?.warningList != null)
                foreach (var w in info.warningList) result.Warnings.Add(new(w.Item1, w.Item2, w.Item3));
            if (info?.errorList != null)
                foreach (var e in info.errorList) result.Errors.Add(new(e.Item1, e.Item2, e.Item3));
            if (compiled == null && result.Errors.Count == 0)
                result.Errors.Add(new(-1, -1, "MUCOM88 compilation failed."));
            if (result.Errors.Count == 0)
                result.Mub = compiled.Select(d => d == null ? (byte)0 : (byte)d.dat).ToArray();
        }
        catch (Exception ex)
        {
            result.Mub = null;
            result.Errors.Add(new(-1, -1, ex.Message));
        }
        return result;
    }

    // Copied from MDPlayer4Mac's MucomDotNET: the upstream compiler only recognizes track
    // labels in column zero and splits lines on CRLF. Line count is preserved, so compiler
    // row numbers still point at the editor's lines.
    internal static byte[] NormalizeTrackDeclarationIndentation(byte[] source)
    {
        const string trackCharacters = "ABCDEFGHIJKLMNOPQRSTUVabcdefghijklmnopqrstuvWXYZwxyz";
        using MemoryStream result = new(source.Length);
        for (int position = 0; position < source.Length;)
        {
            int lineEnd = position;
            while (lineEnd < source.Length && source[lineEnd] != '\r' && source[lineEnd] != '\n') lineEnd++;
            int contentStart = position;
            while (contentStart < lineEnd && (source[contentStart] == (byte)' ' || source[contentStart] == (byte)'\t')) contentStart++;
            bool isTrackDeclaration = contentStart < lineEnd && source[contentStart] < 0x80
                && trackCharacters.IndexOf((char)source[contentStart]) >= 0;
            int copyStart = isTrackDeclaration ? contentStart : position;
            result.Write(source, copyStart, lineEnd - copyStart);
            if (lineEnd >= source.Length) break;
            if (source[lineEnd] == '\r')
            {
                result.WriteByte((byte)'\r');
                lineEnd++;
                if (lineEnd < source.Length && source[lineEnd] == '\n') lineEnd++;
            }
            else
            {
                lineEnd++;
                result.WriteByte((byte)'\r');
            }
            result.WriteByte((byte)'\n');
            position = lineEnd;
        }
        return result.ToArray();
    }

    public static bool IsMub(byte[] data)
        => data?.Length >= 4
            && ((data[0] == 'M' && data[1] == 'U' && (data[2] == 'C' || data[2] == 'B') && data[3] == '8')
                || (data[0] == 'm' && (data[1] == 'u' || data[1] == 's') && data[2] == 'P' && data[3] == 'b'));
}

// One playing song. Mirrors MusicEngine.LoadMub + MucomDotNET.init/oneFrameProc.
public sealed class MucPlayer
{
    MDSound.MDSound mds;
    mucomDotNET.Driver.Driver driver;
    MsxMubProfile msx;
    MsxSoundMapper mapper;

    public bool Stopped { get; private set; }
    public string Error { get; private set; } = "";
    public string Chips { get; private set; } = "";
    public string Title { get; private set; } = "";
    public string Composer { get; private set; } = "";
    public int LoopCount => driver == null ? 0 : Math.Max(0, driver.GetNowLoopCounter());

    public bool Start(byte[] mub, Func<string, Stream> openFile)
    {
        MucEngine.Initialize();
        Stopped = false;
        Error = "";
        if (!MucEngine.IsMub(mub)) { Fail("Not a MUB."); return false; }

        try { msx = MsxMubProfile.HasMagic(mub) ? MsxMubProfile.Parse(mub) : null; }
        catch (FormatException e) { Fail(e.Message); return false; }

        bool[] used = msx == null ? GetUsedChips(mub)
            : new[] { msx.UsesOpna || msx.SccSsg, false, false, false, false };
        MDSound.ym2608 ym2608 = new();
        MDSound.ym2610 ym2610 = new();
        List<MDSound.MDSound.Chip> chips = new();
        List<string> names = new();
        if (used[0]) { chips.Add(Ym2608(ym2608, 0)); names.Add("YM2608"); }
        if (used[1]) { chips.Add(Ym2608(ym2608, 1)); names.Add("YM2608 #2"); }
        if (used[2]) { chips.Add(Ym2610(ym2610, 0)); names.Add("YM2610"); }
        if (used[3]) { chips.Add(Ym2610(ym2610, 1)); names.Add("YM2610 #2"); }
        if (used[4])
        {
            uint clock = GetOpmClock(mub);
            MDSound.ym2151 opm = new();
            chips.Add(new() { type = MDSound.MDSound.enmInstrumentType.YM2151, ID = 0, Instrument = opm,
                Update = opm.Update, Start = opm.Start, Stop = opm.Stop, Reset = opm.Reset,
                SamplingRate = clock / 64, Volume = 0, Clock = clock });
            names.Add("YM2151");
        }
        if (msx != null)
        {
            if (msx.UsesOpll)
            {
                MDSound.emu2413 opll = new();
                chips.Add(new() { type = MDSound.MDSound.enmInstrumentType.YM2413emu, ID = 0, Instrument = opll,
                    Update = opll.Update, Start = opll.Start, Stop = opll.Stop, Reset = opll.Reset,
                    SamplingRate = MucEngine.SampleRate, Volume = 0, Clock = 3_579_545 });
                names.Add("YM2413 (MSX-MUSIC)");
            }
            if (msx.UsesPsg)
            {
                MDSound.ay8910 ay = new();
                chips.Add(new() { type = MDSound.MDSound.enmInstrumentType.AY8910, ID = 0, Instrument = ay,
                    Update = ay.Update, Start = ay.Start, Stop = ay.Stop, Reset = ay.Reset,
                    SamplingRate = MucEngine.SampleRate, Volume = 0, Clock = 1_789_773 / 2 });
                names.Add("AY8910 (MSX PSG)");
            }
            if (msx.UsesScc)
            {
                MDSound.K051649 scc = new();
                chips.Add(new() { type = MDSound.MDSound.enmInstrumentType.K051649, ID = 0, Instrument = scc,
                    Update = scc.Update, Start = scc.Start, Stop = scc.Stop, Reset = scc.Reset,
                    SamplingRate = MucEngine.SampleRate, Volume = 0, Clock = 1_789_773 });
                names.Add(msx.UsesSccPlus ? "SCC+" : "SCC");
            }
        }
        if (chips.Count == 0 && msx?.HasOpnaSequence == true)
        {
            chips.Add(Ym2608(ym2608, 0));
            names.Add("YM2608 (timing only)");
        }
        if (chips.Count == 0) { Fail("This MUB uses no supported sound chip."); return false; }

        mds = new MDSound.MDSound(MucEngine.SampleRate, 2048, null);
        mds.Init(MucEngine.SampleRate, 2048, chips.ToArray());
        Chips = string.Join(" + ", names);

        try
        {
            byte[] data = mub;
            if (msx != null)
            {
                mapper = new MsxSoundMapper(
                    (r, v) => mds.WriteYM2413emu(0, (byte)r, (byte)v),
                    (r, v) => mds.WriteAY8910(0, (byte)r, (byte)v),
                    (r, v) => mds.WriteYM2608(0, 0, (byte)r, (byte)v),
                    WriteScc);
                data = msx.SequencerData;
            }
            ReadTags(data);
            driver = new mucomDotNET.Driver.Driver();
            List<ChipAction> actions = new()
            {
                new Action(WriteOpna1, null),
                new Action(WriteOpna2, null),
                new Action(v => { if (Ok(v)) mds.WriteYM2610(0, (byte)v.port, (byte)v.address, (byte)v.data); }, (d, t) => Adpcm(0, d, t)),
                new Action(v => { if (Ok(v)) mds.WriteYM2610(1, (byte)v.port, (byte)v.address, (byte)v.data); }, (d, t) => Adpcm(1, d, t)),
                new Action(v => { if (v != null && v.address >= 0 && v.data >= 0) mds.WriteYM2151(0, (byte)v.address, (byte)v.data); }, null),
            };
            MmlDatum[] source = data.Select(b => new MmlDatum(b)).ToArray();
            driver.Init(actions, source, openFile, new object[] { false, true, false, "song.muc" });
            driver.StartRendering((int)MucEngine.SampleRate, new[]
            {
                Tuple.Create("", (int)MucEngine.OpnaClock),
                Tuple.Create("", (int)MucEngine.OpnaClock),
                Tuple.Create("", (int)MucEngine.OpnbClock),
                Tuple.Create("", (int)MucEngine.OpnbClock),
                Tuple.Create("", (int)GetOpmClock(mub)),
            });
            if (msx != null)
            {
                driver.ConfigureMsx(msx.Capabilities, mapper.Upload, msx.RawFlags.HasValue);
                mapper.Start(msx.NativeGroup, msx.SccSsg, msx.RawFlags);
            }
            driver.MusicSTART(0);
            return true;
        }
        catch (Exception e)
        {
            Fail(e.Message);
            return false;
        }
    }

    // Interleaved stereo 16-bit; count is the number of shorts (two per frame).
    public int Render(short[] buffer, int offset, int count)
    {
        if (mds == null) return 0;
        return mds.Update(buffer, offset, count, OneFrame);
    }

    void OneFrame()
    {
        if (Stopped || driver == null) return;
        try
        {
            driver.Rendering();
            if (driver.GetStatus() < 1) { Silence(); Stopped = true; }
        }
        catch (Exception e)
        {
            Fail(e.Message);
        }
    }

    public void Stop()
    {
        if (driver == null) return;
        try { driver.MusicSTOP(); } catch { }
        Silence();
        Stopped = true;
    }

    void Fail(string message)
    {
        Error = message;
        Silence();
        Stopped = true;
    }

    MDSound.MDSound.Chip Ym2608(MDSound.ym2608 instrument, int id) => new()
    {
        type = MDSound.MDSound.enmInstrumentType.YM2608, ID = (byte)id, Instrument = instrument,
        Update = instrument.Update, Start = instrument.Start, Stop = instrument.Stop, Reset = instrument.Reset,
        SamplingRate = 55467, Volume = 0, Clock = MucEngine.OpnaClock,
        Option = new object[] { (Func<string, Stream>)MucEngine.OpenRhythm },
    };

    MDSound.MDSound.Chip Ym2610(MDSound.ym2610 instrument, int id) => new()
    {
        type = MDSound.MDSound.enmInstrumentType.YM2610, ID = (byte)id, Instrument = instrument,
        Update = instrument.Update, Start = instrument.Start, Stop = instrument.Stop, Reset = instrument.Reset,
        SamplingRate = 55467, Volume = 0, Clock = MucEngine.OpnbClock,
    };

    static bool Ok(ChipDatum v) => v != null && v.port >= 0 && v.address >= 0 && v.data >= 0;

    void WriteOpna1(ChipDatum v)
    {
        if (!Ok(v)) return;
        if (msx?.SccSsg == true && v.port == 0 && v.address < 14) mapper.WriteSsg(v.address, v.data);
        else mds.WriteYM2608(0, (byte)v.port, (byte)v.address, (byte)v.data);
    }

    void WriteOpna2(ChipDatum v)
    {
        if (!Ok(v)) return;
        if (msx != null)
        {
            if (msx.NativeGroup)
            {
                if (v.port == 0 && v.address == 191 && (v.data & 4) != 0
                    && (!msx.UsesScc || ((v.data & 8) != 0) != msx.UsesSccPlus))
                    throw new FormatException("Raw SCC target differs from the declared transport profile.");
                mapper.WriteNative(v.port, v.address, v.data);
            }
        }
        else mds.WriteYM2608(1, (byte)v.port, (byte)v.address, (byte)v.data);
    }

    void WriteScc(int port, int address, int value)
    {
        mds.WriteK051649(0, port * 2, (byte)address);
        mds.WriteK051649(0, port * 2 + 1, (byte)value);
    }

    void Adpcm(int chip, byte[] data, int type)
    {
        if (data == null) return;
        if (type == 0) mds.WriteYM2610_SetAdpcmA((byte)chip, data);
        else mds.WriteYM2610_SetAdpcmB((byte)chip, data);
    }

    void Silence()
    {
        if (mds == null || msx == null || mapper == null) return;
        try
        {
            for (int ch = 0; ch < 6; ch++) mds.WriteYM2608(0, 0, 0x28, (byte)(ch < 3 ? ch : ch + 1));
            mds.WriteYM2608(0, 1, 0x00, 0x01);
            mds.WriteYM2608(0, 0, 0x10, 0xbf);
            mds.WriteYM2608(0, 0, 0x07, 0x3f);
            for (int ch = 0; ch < 3; ch++) mds.WriteYM2608(0, 0, (byte)(0x08 + ch), 0);
            if (msx.NativeGroup) mapper.StopNative();
            if (msx.UsesScc) mapper.StopScc();
        }
        catch { }
    }

    void ReadTags(byte[] data)
    {
        try
        {
            GD3Tag tag = new mucomDotNET.Driver.Driver().GetGD3TagInfo(data);
            Title = Tag(tag, enmTag.Title);
            Composer = Tag(tag, enmTag.Composer);
        }
        catch { }
    }

    static string Tag(GD3Tag tag, enmTag key)
        => tag?.dicItem != null && tag.dicItem.TryGetValue(key, out string[] v) && v.Length > 0 ? v[0] : "";

    // MUB/MUC8 is one OPNA; muPb keeps the five-target layout OPNA #1/#2, OPNB #1/#2, OPM.
    static bool[] GetUsedChips(byte[] data)
    {
        bool[] result = new bool[5];
        if (!(data[0] == 'm' && data[1] == 'u' && data[2] == 'P' && data[3] == 'b')) { result[0] = true; return result; }
        try
        {
            MmlDatum[] source = data.Select(b => new MmlDatum(b)).ToArray();
            mucomDotNET.Driver.MUBHeader header = new(source, myEncoding.Default);
            if (header.mupb?.chips == null) return result;
            for (int chip = 0; chip < Math.Min(result.Length, header.mupb.chips.Length); chip++)
            {
                var definition = header.mupb.chips[chip];
                result[chip] = definition?.parts?.Any(p => p?.pages?.Any(page => page?.length > 1) == true) == true;
            }
        }
        catch { result[0] = true; }
        return result;
    }

    static uint GetOpmClock(byte[] data)
    {
        try
        {
            string text = MucEngine.ShiftJis.GetString(data);
            if (text.IndexOf("#opmclockmode x68000", StringComparison.OrdinalIgnoreCase) >= 0
                || text.IndexOf("#opmclockmode x68k", StringComparison.OrdinalIgnoreCase) >= 0
                || text.IndexOf("#opmclockmode 4000000", StringComparison.OrdinalIgnoreCase) >= 0)
                return 4_000_000;
        }
        catch { }
        return MucEngine.OpmClock;
    }

    sealed class Action : ChipAction
    {
        readonly Action<ChipDatum> write;
        readonly Action<byte[], int> writePcm;
        public Action(Action<ChipDatum> write, Action<byte[], int> writePcm) => (this.write, this.writePcm) = (write, writePcm);
        public override string GetChipName() => "MUCPlayground";
        public override void WriteRegister(ChipDatum value) => write?.Invoke(value);
        public override void WritePCMData(byte[] data, int startAddress, int endAddress) => writePcm?.Invoke(data, startAddress);
        public override void WaitSend(long elapsed, int size) { }
    }
}

