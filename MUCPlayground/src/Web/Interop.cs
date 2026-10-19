using System.Runtime.InteropServices.JavaScript;
using System.Text;
using System.Text.Json;

namespace MucPlayground;

// The JavaScript-facing surface. Results are JSON strings so the worker gets plain objects.
public static partial class Interop
{
    static readonly Dictionary<string, byte[]> files = new(StringComparer.OrdinalIgnoreCase);
    static CompileResult compiled;
    static MucPlayer player;
    static string exportError = "";
    static short[] pcm = new short[0];

    public static void Main() { }

    [JSExport]
    public static void Init(string language) => MucEngine.Initialize(language);

    // Companion files the song asks for by name (#voice, #pcm, ...).
    [JSExport]
    public static void SetFile(string name, byte[] data) => files[Path.GetFileName(name)] = data;

    [JSExport]
    public static void RemoveFile(string name) => files.Remove(Path.GetFileName(name));

    [JSExport]
    public static void ClearFiles() => files.Clear();

    // For saving: MUCOMSX on the MSX reads Shift-JIS (plain ASCII is unchanged).
    [JSExport]
    public static byte[] EncodeShiftJis(string text) => MucEngine.ShiftJis.GetBytes(text ?? "");

    static Stream Open(string name)
        => name != null && files.TryGetValue(Path.GetFileName(name.Replace('\\', '/')), out byte[] d) ? new MemoryStream(d, false) : null;

    // MUC text from the editor. MUCOM88 reads Shift-JIS, so encode before compiling.
    [JSExport]
    public static string Compile(string text)
    {
        player?.Stop();
        player = null;
        CompileResult r = MucEngine.Compile(MucEngine.ShiftJis.GetBytes(text ?? ""), Open);
        compiled = r.Ok ? r : null;
        return Json(w =>
        {
            w.WriteBoolean("ok", r.Ok);
            w.WriteNumber("size", r.Mub?.Length ?? 0);
            Messages(w, "errors", r.Errors);
            Messages(w, "warnings", r.Warnings);
        });
    }

    // Plays a compiled .mub file directly (no source, so no position trace).
    [JSExport]
    public static string StartFile(byte[] data)
    {
        player?.Stop();
        compiled = null;
        player = new MucPlayer();
        bool ok = player.Start(data, Open);
        return Json(w =>
        {
            w.WriteBoolean("ok", ok);
            w.WriteString("error", ok ? "" : player.Error);
            w.WriteString("chips", player.Chips);
            w.WriteString("title", player.Title);
            w.WriteString("composer", player.Composer);
        });
    }

    [JSExport]
    public static string Start()
    {
        player = new MucPlayer();
        bool ok = compiled != null && player.Start(compiled, Open);
        return Json(w =>
        {
            w.WriteBoolean("ok", ok);
            w.WriteString("error", compiled == null ? "Nothing compiled." : player.Error);
            w.WriteString("chips", player.Chips);
            w.WriteString("title", player.Title);
            w.WriteString("composer", player.Composer);
        });
    }

    // Renders up to `frames` stereo frames as little-endian 16-bit PCM. An empty result means the song ended.
    [JSExport]
    public static byte[] Render(int frames)
    {
        if (player == null || player.Stopped) return new byte[0];
        if (pcm.Length < frames * 2) pcm = new short[frames * 2];
        int n = player.Render(pcm, 0, frames * 2);
        byte[] bytes = new byte[n * 2];
        Buffer.BlockCopy(pcm, 0, bytes, 0, bytes.Length);
        return bytes;
    }

    // Source positions reached since the last call: groups of frame, channel key, row,
    // column, length. Frames count from the start of the song, like the PCM.
    [JSExport]
    public static int[] TakeTrace()
    {
        if (player == null || player.Trace.Count == 0) return new int[0];
        int[] events = player.Trace.ToArray();
        player.Trace.Clear();
        return events;
    }

    // Exports compile the given text on their own, leaving the song that is playing alone.
    // Null means it failed; ExportError says why.
    [JSExport]
    public static byte[] ExportMub(string text)
    {
        CompileResult r = MucEngine.Compile(MucEngine.ShiftJis.GetBytes(text ?? ""), Open);
        exportError = r.Ok ? "" : string.Join("\n", r.Errors.Select(e => e.Text));
        return r.Ok ? r.Mub : null;
    }

    [JSExport]
    public static byte[] ExportVgm(string text, int maxSeconds)
    {
        CompileResult r = MucEngine.Compile(MucEngine.ShiftJis.GetBytes(text ?? ""), Open);
        if (!r.Ok) { exportError = string.Join("\n", r.Errors.Select(e => e.Text)); return null; }
        byte[] vgm = MucPlayer.ExportVgm(r.Mub, Open, maxSeconds, out string error);
        exportError = error ?? "";
        return vgm;
    }

    [JSExport]
    public static string ExportError() => exportError;

    [JSExport]
    public static string Status()
        => Json(w =>
        {
            w.WriteBoolean("stopped", player?.Stopped ?? true);
            w.WriteNumber("loop", player?.LoopCount ?? 0);
            w.WriteString("error", player?.Error ?? "");
        });

    [JSExport]
    public static void Stop() { player?.Stop(); player = null; }

    // Trimmed WebAssembly builds disable reflection-based JsonSerializer, so write by hand.
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

    static void Messages(Utf8JsonWriter w, string name, List<CompileMessage> list)
    {
        w.WriteStartArray(name);
        foreach (CompileMessage m in list)
        {
            w.WriteStartObject();
            w.WriteNumber("row", m.Row);
            w.WriteNumber("col", m.Col);
            w.WriteString("text", m.Text);
            w.WriteEndObject();
        }
        w.WriteEndArray();
    }
}
