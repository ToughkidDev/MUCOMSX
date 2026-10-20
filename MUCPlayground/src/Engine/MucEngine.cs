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

// Code is the compiler's message id (E0498, W0408 ...) when it could be identified.
public sealed record CompileMessage(int Row, int Col, string Text, string Code = "");

public sealed class CompileResult
{
    public byte[] Mub;
    // The compiler's own output, which still carries each byte's source position. For
    // MUCOMSX native MSX songs (an msPb container) it is rebuilt by MsxTrace when asked
    // for, and null when the positions could not be recovered.
    internal MmlDatum[] Data;
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

    // The compiler reports message text only. Recover its id by matching the text against
    // the message templates, so the page can explain each one in detail.
    static List<(string Code, System.Text.RegularExpressions.Regex Pattern, int Length)> templates;
    static readonly System.Text.RegularExpressions.Regex Position =
        new(@"^\[(?:row|行):\s*-?\d+\s*(?:column|桁):\s*-?\d+\]\s*", System.Text.RegularExpressions.RegexOptions.Compiled);

    public static string IdentifyCode(string text)
    {
        if (string.IsNullOrEmpty(text)) return "";
        if (templates == null)
        {
            templates = new();
            foreach (string name in new[] { "lang/mucomDotNETmessage.txt", "lang/mucomDotNETmessage.ja-JP.txt" })
            {
                using Stream s = Resource(name);
                if (s == null) continue;
                using StreamReader r = new(s, Encoding.UTF8);
                foreach (string raw in r.ReadToEnd().Split('\n'))
                {
                    string line = raw.TrimEnd('\r');
                    int eq = line.IndexOf('=');
                    if (eq < 5 || !(line[0] == 'E' || line[0] == 'W') || !char.IsDigit(line[1])) continue;
                    string code = line[..eq], template = line[(eq + 1)..].Replace("\\r", "\r").Replace("\\n", "\n").Trim();
                    if (code is "E0300" or "E0000" || template.Length == 0) continue;
                    string pattern = "^" + System.Text.RegularExpressions.Regex.Escape(template).Replace("\\{", "{");
                    pattern = System.Text.RegularExpressions.Regex.Replace(pattern, @"\{\d+\}", "(.*?)") + "$";
                    templates.Add((code, new(pattern, System.Text.RegularExpressions.RegexOptions.Singleline), template.Length));
                }
            }
            templates.Sort((a, b) => b.Length.CompareTo(a.Length));   // most specific first
        }
        string body = Position.Replace(text, "").Trim();
        foreach (var t in templates)
            if (t.Pattern.IsMatch(body)) return t.Code;
        return "";
    }

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
    public static CompileResult Compile(byte[] source, Func<string, Stream> openFile, bool traceMsx = false)
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
                else if (traceMsx) result.Data = MsxTrace.Build(source, result.Mub, openFile);
                return result;
            }

            mucomDotNET.Compiler.Compiler compiler = new();
            compiler.Init();
            using MemoryStream input = new(NormalizeTrackDeclarationIndentation(source), writable: false);
            MmlDatum[] compiled = compiler.Compile(input, openFile);
            CompilerInfo info = compiler.GetCompilerInfo();
            if (info?.warningList != null)
                foreach (var w in info.warningList) result.Warnings.Add(new(w.Item1, w.Item2, w.Item3, IdentifyCode(w.Item3)));
            if (info?.errorList != null)
                foreach (var e in info.errorList) result.Errors.Add(new(e.Item1, e.Item2, e.Item3, IdentifyCode(e.Item3)));
            if (compiled == null && result.Errors.Count == 0)
                result.Errors.Add(new(-1, -1, "MUCOM88 compilation failed."));
            if (result.Errors.Count == 0)
            {
                result.Mub = compiled.Select(d => d == null ? (byte)0 : (byte)d.dat).ToArray();
                result.Data = compiled.Select(d => d ?? new MmlDatum(0)).ToArray();
            }
        }
        catch (Exception ex)
        {
            result.Mub = null;
            result.Errors.Add(new(-1, -1, ex.Message));
        }
        return result;
    }

    // Some failures (a crash on l0, an unexpected character) come with no position at all.
    // Find the first line that triggers the same message by compiling the song with every
    // later line blanked, binary-searching on how many lines are kept. Returns the 1-based
    // line, or 0 if the failure cannot be reproduced that way.
    public static int LocateFailure(string text, string message, Func<string, Stream> openFile)
    {
        string[] lines = (text ?? "").Split('\n');
        bool Fails(int kept)
        {
            string partial = string.Join("\n", lines.Select((l, i) => i < kept ? l : ""));
            return Compile(ShiftJis.GetBytes(partial), openFile).Errors.Any(e => e.Text == message);
        }
        if (lines.Length == 0 || !Fails(lines.Length)) return 0;
        int lo = 1, hi = lines.Length;
        while (lo < hi)
        {
            int mid = (lo + hi) / 2;
            if (Fails(mid)) hi = mid; else lo = mid + 1;
        }
        return lo;
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
    long frame;
    VgmWriter vgm;          // only while exporting
    double speedDue;        // driver steps owed (Speed per output sample)

    // Playback speed (0.25–2): the driver's timers run this many steps per output sample,
    // so the tempo changes and the pitch does not. Exports always run at 1.
    public double Speed { get; set; } = 1;

    // Where each channel is in the source, as the driver plays it: flat groups of
    // frame, channel key, row, column, length. Only changes are recorded.
    public readonly List<int> Trace = new();
    readonly Dictionary<int, long> lastPosition = new();

    // Every chip write while playing, for the page's channel view: pairs of frame and
    // VGM command << 24 | port << 16 | address << 8 | value (port is only used for SCC).
    // Not kept while exporting.
    public readonly List<int> ChipLog = new();

    // The emulators' live output levels for MDPlayer4Mac's OPNA/OPNB meters, sampled while
    // rendering: groups of frame, VGM command of the chip (0x56 YM2608, 0x58 YM2610), chip
    // id, key mask (rhythm or ADPCM-A), then the left and right levels of sources 1-4
    // (FM, SSG, rhythm / ADPCM-A, ADPCM / ADPCM-B).
    public readonly List<int> VisLog = new();
    MDSound.ym2608 opna;
    MDSound.ym2610 opnb;
    readonly List<(int Command, int Id)> visChips = new();

    public bool Stopped { get; private set; }
    // A MUCOMSX song (msPb): its second chip's parts are MSXA.., the third's SCCA..
    public bool Msx => msx != null;
    public string Error { get; private set; } = "";
    public string Chips { get; private set; } = "";
    // The chips in VGM terms for the channel view: "type:id:clock" joined by ';'.
    public string ChipList { get; private set; } = "";
    public string Title { get; private set; } = "";
    public string Composer { get; private set; } = "";
    public int LoopCount => driver == null ? 0 : Math.Max(0, driver.GetNowLoopCounter());

    // Plays a fresh compile. With trace on, the driver is given the compiler's own data
    // (identical bytes) so it can report source positions in Trace.
    public bool Start(CompileResult compiled, Func<string, Stream> openFile, bool trace = true)
        => Start(compiled.Mub, openFile, trace ? compiled.Data : null);

    public bool Start(byte[] mub, Func<string, Stream> openFile) => Start(mub, openFile, null);

    bool Start(byte[] mub, Func<string, Stream> openFile, MmlDatum[] traced)
    {
        MucEngine.Initialize();
        Stopped = false;
        Error = "";
        frame = 0;
        Trace.Clear();
        lastPosition.Clear();
        ChipLog.Clear();
        VisLog.Clear();
        visChips.Clear();
        if (!MucEngine.IsMub(mub)) { Fail("Not a MUB."); return false; }

        try { msx = MsxMubProfile.HasMagic(mub) ? MsxMubProfile.Parse(mub) : null; }
        catch (FormatException e) { Fail(e.Message); return false; }

        bool[] used = msx == null ? GetUsedChips(mub)
            : new[] { msx.UsesOpna || msx.SccSsg, false, false, false, false };
        MDSound.ym2608 ym2608 = opna = new();
        MDSound.ym2610 ym2610 = opnb = new();
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
        foreach (MDSound.MDSound.Chip c in chips)
        {
            if (c.type == MDSound.MDSound.enmInstrumentType.YM2608) visChips.Add((0x56, c.ID));
            if (c.type == MDSound.MDSound.enmInstrumentType.YM2610) visChips.Add((0x58, c.ID));
        }
        ChipList = string.Join(";", chips.Select(c => c.type switch
        {
            MDSound.MDSound.enmInstrumentType.YM2608 => $"YM2608:{c.ID}:{MucEngine.OpnaClock}",
            MDSound.MDSound.enmInstrumentType.YM2610 => $"YM2610:{c.ID}:{MucEngine.OpnbClock}",
            MDSound.MDSound.enmInstrumentType.YM2151 => $"YM2151:{c.ID}:{c.Clock}",
            MDSound.MDSound.enmInstrumentType.YM2413emu => $"YM2413:{c.ID}:{VgmWriter.OplClock}",
            MDSound.MDSound.enmInstrumentType.AY8910 => $"AY8910:{c.ID}:{VgmWriter.PsgClock}",
            MDSound.MDSound.enmInstrumentType.K051649 => $"K051649:{c.ID}:{VgmWriter.SccClock}",
            _ => "",
        }).Where(t => t != ""));
        if (vgm != null)
        {
            foreach (MDSound.MDSound.Chip c in chips)
            {
                switch (c.type)
                {
                    case MDSound.MDSound.enmInstrumentType.YM2608: vgm.Ym2608 = MucEngine.OpnaClock; vgm.SecondYm2608 |= c.ID == 1; break;
                    case MDSound.MDSound.enmInstrumentType.YM2610: vgm.Ym2610 = MucEngine.OpnbClock; vgm.SecondYm2610 |= c.ID == 1; break;
                    case MDSound.MDSound.enmInstrumentType.YM2151: vgm.Ym2151 = c.Clock; break;
                    case MDSound.MDSound.enmInstrumentType.YM2413emu: vgm.Ym2413 = VgmWriter.OplClock; break;
                    case MDSound.MDSound.enmInstrumentType.AY8910: vgm.Ay8910 = VgmWriter.PsgClock; break;
                    case MDSound.MDSound.enmInstrumentType.K051649: vgm.K051649 = VgmWriter.SccClock; vgm.SccPlus = msx?.UsesSccPlus == true; break;
                }
            }
        }

        try
        {
            byte[] data = mub;
            if (msx != null)
            {
                mapper = new MsxSoundMapper(Opll, Psg, (r, v) => Opna(0, 0, r, v), WriteScc);
                data = msx.SequencerData;
            }
            ReadTags(data);
            driver = new mucomDotNET.Driver.Driver();
            List<ChipAction> actions = new()
            {
                new Action(WriteOpna1, null),
                new Action(WriteOpna2, null),
                new Action(v => { Track(v); if (Ok(v)) Opnb(0, v.port, v.address, v.data); }, (d, t) => Adpcm(0, d, t)),
                new Action(v => { Track(v); if (Ok(v)) Opnb(1, v.port, v.address, v.data); }, (d, t) => Adpcm(1, d, t)),
                new Action(v => { Track(v); if (v != null && v.address >= 0 && v.data >= 0) Opm(v.address, v.data); }, null),
            };
            MmlDatum[] source = data.Select(b => new MmlDatum(b)).ToArray();
            // The traced data where its bytes are the ones played (an msPb container's
            // sequencer copy differs from it in a few header bytes).
            if (traced != null && traced.Length == data.Length)
                for (int i = 0; i < data.Length; i++)
                    if (traced[i] != null && (byte)traced[i].dat == data[i]) source[i] = traced[i];
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
                driver.ConfigureMsx(msx.Capabilities, mapper.Upload, msx.RawFlags.HasValue, (ch, address, value) =>
                {
                    if (traced != null) TrackScc();
                    mapper.WriteSccNative(ch, address, value);
                });
                mapper.Start(msx.NativeGroup, msx.SccSsg, msx.RawFlags, msx.DedicatedScc);
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
        if (vgm != null || visChips.Count == 0) return mds.Update(buffer, offset, count, OneFrame);
        // In slices, so the level meters are sampled about every 12 ms.
        int done = 0;
        while (done < count)
        {
            int n = mds.Update(buffer, offset + done, Math.Min(1024, count - done), OneFrame);
            if (n <= 0) break;
            done += n;
            LogLevels();
        }
        return done;
    }

    void LogLevels()
    {
        foreach ((int command, int id) in visChips)
        {
            int[][][] levels = command == 0x56 ? opna.visVolume : opnb.visVolume;
            if (levels == null || id >= levels.Length || levels[id] == null || levels[id].Length < 5) continue;
            int[][] l = levels[id];
            VisLog.Add((int)frame);
            VisLog.Add(command);
            VisLog.Add(id);
            VisLog.Add(command == 0x56 ? opna.GetRhythmKeyMask((byte)id) : opnb.GetAdpcmAKeyMask((byte)id));
            for (int source = 1; source <= 4; source++)
            {
                VisLog.Add(l[source][0]);
                VisLog.Add(l[source][1]);
            }
        }
    }

    void OneFrame()
    {
        if (Stopped || driver == null) return;
        try
        {
            speedDue += vgm != null ? 1 : Speed;
            while (speedDue >= 1)
            {
                speedDue -= 1;
                driver.Rendering();
                if (driver.GetStatus() < 1) break;
            }
            frame++;
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

    // Dedicated SCC parts (msPb0102) write through a callback without the command being
    // played, so read it from the driver's work area.
    static readonly System.Reflection.FieldInfo DriverWork = typeof(mucomDotNET.Driver.Driver)
        .GetField("work", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

    void TrackScc()
    {
        if (DriverWork?.GetValue(driver) is mucomDotNET.Driver.Work w && w.crntMmlDatum is MmlDatum m) Track(m);
    }

    void Track(ChipDatum v)
    {
        if (v?.addtionalData is MmlDatum m) Track(m);
    }

    void Track(MmlDatum m)
    {
        if (m.linePos == null) return;
        LinePos lp = m.linePos;
        if (lp.row <= 0) return;
        int key = lp.chipNumber * 1000 + lp.ch;
        long position = ((long)lp.row << 20) | ((long)lp.col << 8) | (uint)Math.Min(255, Math.Max(0, lp.length));
        if (lastPosition.TryGetValue(key, out long last) && last == position) return;
        lastPosition[key] = position;
        Trace.Add((int)frame);
        Trace.Add(key);
        Trace.Add(lp.row);
        Trace.Add(lp.col);
        Trace.Add(lp.length);
    }

    void WriteOpna1(ChipDatum v)
    {
        Track(v);
        if (!Ok(v)) return;
        if (msx?.SccSsg == true && v.port == 0 && v.address < 14) mapper.WriteSsg(v.address, v.data);
        else Opna(0, v.port, v.address, v.data);
    }

    void WriteOpna2(ChipDatum v)
    {
        Track(v);
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
        else Opna(1, v.port, v.address, v.data);
    }

    // Every chip write passes through here: to the emulators, and to the VGM log when exporting.
    void Opna(int chip, int port, int address, int value)
    {
        mds.WriteYM2608((byte)chip, (byte)port, (byte)address, (byte)value);
        vgm?.Write(frame, chip == 0 ? 0x56 + port : 0xa6 + port, address, value);
        if (port == 0 || address != 0x08) Log(chip == 0 ? 0x56 + port : 0xa6 + port, 0, address, value);
    }

    void Opnb(int chip, int port, int address, int value)
    {
        mds.WriteYM2610((byte)chip, (byte)port, (byte)address, (byte)value);
        vgm?.Write(frame, chip == 0 ? 0x58 + port : 0xa8 + port, address, value);
        Log(chip == 0 ? 0x58 + port : 0xa8 + port, 0, address, value);
    }

    void Opm(int address, int value)
    {
        mds.WriteYM2151(0, (byte)address, (byte)value);
        vgm?.Write(frame, 0x54, address, value);
        Log(0x54, 0, address, value);
    }

    void Opll(int address, int value)
    {
        mds.WriteYM2413emu(0, (byte)address, (byte)value);
        vgm?.Write(frame, 0x51, address, value);
        Log(0x51, 0, address, value);
    }

    void Psg(int address, int value)
    {
        mds.WriteAY8910(0, (byte)address, (byte)value);
        vgm?.Write(frame, 0xa0, address, value);
        Log(0xa0, 0, address, value);
    }

    void WriteScc(int port, int address, int value)
    {
        mds.WriteK051649(0, port * 2, (byte)address);
        mds.WriteK051649(0, port * 2 + 1, (byte)value);
        vgm?.WriteScc(frame, port, address, value);
        Log(0xd2, port, address, value);
    }

    void Log(int command, int port, int address, int value)
    {
        if (vgm != null) return;
        ChipLog.Add((int)frame);
        ChipLog.Add(command << 24 | (port & 0xff) << 16 | (address & 0xff) << 8 | (value & 0xff));
    }

    void Adpcm(int chip, byte[] data, int type)
    {
        if (data == null) return;
        if (type == 0) mds.WriteYM2610_SetAdpcmA((byte)chip, data);
        else mds.WriteYM2610_SetAdpcmB((byte)chip, data);
        vgm?.WriteRom(frame, type == 0 ? (byte)0x82 : (byte)0x83, data, chip == 1);
    }

    // Runs the driver without synthesizing audio and logs every chip write as VGM.
    // A looping song is written up to the end of its second pass, with the VGM loop
    // point where the first loop back happens, so the loop section is exactly one pass.
    public static byte[] ExportVgm(byte[] mub, Func<string, Stream> openFile, int maxSeconds, out string error)
    {
        MucPlayer p = new() { vgm = new VgmWriter() };
        if (!p.Start(mub, openFile, null)) { error = p.Error; return null; }
        long limit = (long)maxSeconds * MucEngine.SampleRate;
        bool looped = false;
        while (!p.Stopped && p.frame < limit)
        {
            p.OneFrame();
            int loop = p.LoopCount;
            if (loop >= 1 && !looped) { p.vgm.MarkLoop(p.frame); looped = true; }
            if (loop >= 2) break;
        }
        error = p.Error;
        return p.vgm.Finish(p.frame, p.Title, p.Composer);
    }

    void Silence()
    {
        if (mds == null || msx == null || mapper == null) return;
        try
        {
            for (int ch = 0; ch < 6; ch++) Opna(0, 0, 0x28, ch < 3 ? ch : ch + 1);
            Opna(0, 1, 0x00, 0x01);
            Opna(0, 0, 0x10, 0xbf);
            Opna(0, 0, 0x07, 0x3f);
            for (int ch = 0; ch < 3; ch++) Opna(0, 0, 0x08 + ch, 0);
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

