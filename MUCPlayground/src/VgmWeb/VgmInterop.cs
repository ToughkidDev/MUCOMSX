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
        int n = session.RenderSamplesWithMasterVolume(pcm, 0, frames * 2);
        byte[] bytes = new byte[Math.Max(0, n) * 2];
        Buffer.BlockCopy(pcm, 0, bytes, 0, bytes.Length);
        return bytes;
    }

    [JSExport]
    public static int[] TakeTrace() => new int[0];

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
