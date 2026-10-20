using System.Diagnostics;
using MucPlayground;

// usage: NativeCheck <song.muc> <out.wav> [seconds]
string path = args[0];
double seconds = args.Length > 2 ? double.Parse(args[2]) : 60;
string dir = Path.GetDirectoryName(Path.GetFullPath(path));
Stream Open(string name)
{
    string p = Path.Combine(dir, name);
    return File.Exists(p) ? File.OpenRead(p) : null;
}

var sw = Stopwatch.StartNew();
CompileResult r = MucEngine.Compile(File.ReadAllBytes(path), Open, traceMsx: true);
Console.WriteLine($"compile {sw.ElapsedMilliseconds} ms, ok={r.Ok}, mub={r.Mub?.Length}");
foreach (var e in r.Errors) Console.WriteLine($"  error [{e.Code}] {e.Row}:{e.Col} {e.Text}");
foreach (var w in r.Warnings) Console.WriteLine($"  warn  [{w.Code}] {w.Row}:{w.Col} {w.Text}");
if (!r.Ok) return 1;
if (Environment.GetEnvironmentVariable("SAVE_MUB") is string mubPath) File.WriteAllBytes(mubPath, r.Mub);
if (Environment.GetEnvironmentVariable("VGM_OUT") is string vgmPath)
{
    var vsw = Stopwatch.StartNew();
    byte[] vgm = MucPlayer.ExportVgm(r.Mub, Open, 600, out string vgmError);
    Console.WriteLine($"vgm {vgm?.Length} bytes in {vsw.ElapsedMilliseconds} ms {vgmError}");
    if (vgm != null) File.WriteAllBytes(vgmPath, vgm);
}

MucPlayer player = new();
if (Environment.GetEnvironmentVariable("SPEED") is string speedText) player.Speed = double.Parse(speedText);
if (!player.Start(r, Open, Environment.GetEnvironmentVariable("NO_TRACE") == null)) { Console.WriteLine("start failed: " + player.Error); return 1; }
Console.WriteLine($"chips: {player.Chips}  title: {player.Title}");

sw.Restart();
int total = (int)(seconds * MucEngine.SampleRate) * 2;
short[] pcm = new short[total];
const int chunk = 4096;
int done = 0;
int lastLoop = -2;
while (done < total && !player.Stopped)
{
    int n = Math.Min(chunk, total - done);
    done += player.Render(pcm, done, n);
    if (Environment.GetEnvironmentVariable("SHOW_LOOPS") != null && player.LoopCount != lastLoop)
    {
        lastLoop = player.LoopCount;
        Console.WriteLine($"  loop counter {lastLoop} at {done / 2 / 44100.0:F2}s");
    }
}
double ms = sw.Elapsed.TotalMilliseconds;
if (Environment.GetEnvironmentVariable("SHOW_TRACE") is string show)
{
    string[] lines = File.ReadAllText(path).Replace("\r", "").Split('\n');
    for (int i = 0; i + 4 < player.Trace.Count && i < int.Parse(show) * 5; i += 5)
    {
        int row = player.Trace[i + 2], col = player.Trace[i + 3], len = player.Trace[i + 4];
        string line = row - 1 < lines.Length ? lines[row - 1] : "";
        string text = col - 1 < line.Length ? line.Substring(col - 1, Math.Min(Math.Max(len, 1), line.Length - col + 1)) : "?";
        Console.WriteLine($"  t={player.Trace[i] / 44100.0,6:F3}s key={player.Trace[i + 1],5} row={row,3} col={col,3} len={len,2} '{text}'");
    }
    Console.WriteLine($"  trace events: {player.Trace.Count / 5}");
}
Console.WriteLine($"rendered {done / 2 / (double)MucEngine.SampleRate:F2}s in {ms:F0} ms ({done / 2 / (double)MucEngine.SampleRate / (ms / 1000):F1}x realtime), stopped={player.Stopped} {player.Error}");

using var f = File.Create(args[1]);
using var bw = new BinaryWriter(f);
bw.Write("RIFF"u8); bw.Write(36 + done * 2); bw.Write("WAVEfmt "u8); bw.Write(16); bw.Write((short)1); bw.Write((short)2);
bw.Write((int)MucEngine.SampleRate); bw.Write((int)MucEngine.SampleRate * 4); bw.Write((short)4); bw.Write((short)16);
bw.Write("data"u8); bw.Write(done * 2);
for (int i = 0; i < done; i++) bw.Write(pcm[i]);
return 0;
