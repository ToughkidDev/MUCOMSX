using System.Runtime.InteropServices.JavaScript;
using System.Text;
using System.Text.Json;
using MDPlayer;

namespace MucPlayground;

// Same surface as the MUC engine's Interop (Start / Render / Status / Stop), so the
// page's worker drives both the same way.
public static partial class Interop
{
    static MusicEngineSession session;
    static short[] pcm = new short[0];

    public static void Main() { }

    // MDPlayer's VGM path looks for the YM2608 rhythm samples (2608_BD.WAV ...) next to the
    // song file. The browser has no disk, so put them in a folder of the in-memory file
    // system and load every VGM as if it came from there.
    const string SongFolder = "/vgm";
    const string SongPath = SongFolder + "/song.vgm";

    [JSExport]
    public static void Init(string language)
    {
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        Directory.CreateDirectory(SongFolder);
        var assembly = typeof(Interop).Assembly;
        foreach (string name in assembly.GetManifestResourceNames().Where(n => n.StartsWith("rhythm/")))
        {
            using Stream s = assembly.GetManifestResourceStream(name);
            using FileStream f = File.Create(Path.Combine(SongFolder, name.Substring("rhythm/".Length)));
            s.CopyTo(f);
        }
    }

    // A .vgm or gzip-compressed .vgz file.
    [JSExport]
    public static string StartFile(byte[] data)
    {
        string error = "";
        levels.Clear();
        rendered = 0;
        try { session = VgmEngine.Load(data, 2048, SongPath); }
        catch (Exception e) { session = null; error = e.Message; }
        if (session == null && error == "") error = "Not a VGM file this player supports.";
        GD3 tag = session?.Driver.GD3;
        return Json(w =>
        {
            w.WriteBoolean("ok", session != null);
            w.WriteString("error", error);
            w.WriteString("chips", session?.DescribeActiveChips() ?? "");
            w.WriteString("title", First(tag?.TrackName, tag?.TrackNameJ));
            w.WriteString("composer", First(tag?.Composer, tag?.ComposerJ));
        });
    }

    static string First(params string[] values) => values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v)) ?? "";

    // Interleaved 16-bit stereo at 44100 Hz; empty when the song has ended.
    [JSExport]
    public static byte[] Render(int frames)
    {
        if (session == null || session.Driver.Stopped) return new byte[0];
        if (pcm.Length < frames * 2) pcm = new short[frames * 2];
        // In slices, so the channel view's level meters are sampled about every 12 ms.
        int n = 0;
        while (n < frames * 2)
        {
            int got = session.RenderSamplesWithMasterVolume(pcm, n, Math.Min(1024, frames * 2 - n));
            if (got <= 0) break;
            n += got;
            rendered += got / 2;
            LogLevels();
        }
        byte[] bytes = new byte[Math.Max(0, n) * 2];
        Buffer.BlockCopy(pcm, 0, bytes, 0, bytes.Length);
        return bytes;
    }

    [JSExport]
    public static int[] TakeTrace() => new int[0];

    // The emulators' live output levels for MDPlayer4Mac's OPNA/OPNB meters: groups of
    // frame, VGM command of the chip (0x56 YM2608, 0x58 YM2610), chip id, key mask, then the
    // left and right levels of sources 1-4. Same layout as the MUC engine's.
    static readonly List<int> levels = new();
    static long rendered;

    // Both chips of a dual-chip VGM share one MDSound instrument, whose levels are indexed
    // by chip id.
    static void LogLevels()
    {
        MDSound.MDSound mds = session.Mds;
        Vgm vgm = session.Driver as Vgm;
        if (mds == null) return;
        if (session.ChipClocks.ContainsKey(MDSound.MDSound.enmInstrumentType.YM2608))
        {
            int[][][] l = mds.getYM2608VisVolume(0);
            for (int id = 0; id < (vgm?.YM2608DualChipFlag == true ? 2 : 1); id++)
                Add(0x56, id, mds.getYM2608RhythmKeyMask(0, (byte)id), l != null && id < l.Length ? l[id] : null);
        }
        if (session.ChipClocks.ContainsKey(MDSound.MDSound.enmInstrumentType.YM2610))
        {
            int[][][] l = mds.getYM2610VisVolume(0);
            for (int id = 0; id < (vgm?.YM2610DualChipFlag == true ? 2 : 1); id++)
                Add(0x58, id, mds.getYM2610AdpcmAKeyMask(0, (byte)id), l != null && id < l.Length ? l[id] : null);
        }
    }

    static void Add(int command, int id, int mask, int[][] l)
    {
        if (l == null || l.Length < 5 || l.Skip(1).Take(4).Any(v => v == null || v.Length < 2)) return;
        levels.Add((int)rendered);
        levels.Add(command);
        levels.Add(id);
        levels.Add(mask);
        for (int source = 1; source <= 4; source++)
        {
            levels.Add(l[source][0]);
            levels.Add(l[source][1]);
        }
    }

    [JSExport]
    public static int[] TakeLevels()
    {
        int[] events = levels.ToArray();
        levels.Clear();
        return events;
    }

    [JSExport]
    public static string Status() => Json(w =>
    {
        w.WriteBoolean("stopped", session?.Driver.Stopped ?? true);
        w.WriteNumber("loop", (int)(session?.Driver.vgmCurLoop ?? 0));
        w.WriteString("error", "");
    });

    [JSExport]
    public static void Stop() => session = null;

    static string Json(Action<Utf8JsonWriter> body)
    {
        using MemoryStream ms = new();
        using (Utf8JsonWriter w = new(ms))
        {
            w.WriteStartObject();
            body(w);
            w.WriteEndObject();
        }
        return Encoding.UTF8.GetString(ms.ToArray());
    }
}
