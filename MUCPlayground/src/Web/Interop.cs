using System.Runtime.InteropServices.JavaScript;
using System.Text;
using System.Text.Json;

namespace MucPlayground;

// The JavaScript-facing surface. Results are JSON strings so the worker gets plain objects.
public static partial class Interop
{
    static readonly Dictionary<string, byte[]> files = new(StringComparer.OrdinalIgnoreCase);
    static byte[] mub;
    static MucPlayer player;
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
        mub = r.Ok ? r.Mub : null;
        return Json(w =>
        {
            w.WriteBoolean("ok", r.Ok);
            w.WriteNumber("size", r.Mub?.Length ?? 0);
            Messages(w, "errors", r.Errors);
            Messages(w, "warnings", r.Warnings);
        });
    }

    [JSExport]
    public static byte[] GetMub() => mub;

    [JSExport]
    public static string Start()
    {
        player = new MucPlayer();
        bool ok = mub != null && player.Start(mub, Open);
        return Json(w =>
        {
            w.WriteBoolean("ok", ok);
            w.WriteString("error", mub == null ? "Nothing compiled." : player.Error);
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
