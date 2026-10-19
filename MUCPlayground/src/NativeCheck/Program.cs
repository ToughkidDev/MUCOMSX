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
CompileResult r = MucEngine.Compile(File.ReadAllBytes(path), Open);
Console.WriteLine($"compile {sw.ElapsedMilliseconds} ms, ok={r.Ok}, mub={r.Mub?.Length}");
foreach (var e in r.Errors) Console.WriteLine($"  error {e.Row}:{e.Col} {e.Text}");
foreach (var w in r.Warnings) Console.WriteLine($"  warn  {w.Row}:{w.Col} {w.Text}");
if (!r.Ok) return 1;
if (Environment.GetEnvironmentVariable("SAVE_MUB") is string mubPath) File.WriteAllBytes(mubPath, r.Mub);

MucPlayer player = new();
if (!player.Start(r.Mub, Open)) { Console.WriteLine("start failed: " + player.Error); return 1; }
Console.WriteLine($"chips: {player.Chips}  title: {player.Title}");

sw.Restart();
int total = (int)(seconds * MucEngine.SampleRate) * 2;
short[] pcm = new short[total];
const int chunk = 4096;
int done = 0;
while (done < total && !player.Stopped)
{
    int n = Math.Min(chunk, total - done);
    done += player.Render(pcm, done, n);
}
double ms = sw.Elapsed.TotalMilliseconds;
Console.WriteLine($"rendered {done / 2 / (double)MucEngine.SampleRate:F2}s in {ms:F0} ms ({done / 2 / (double)MucEngine.SampleRate / (ms / 1000):F1}x realtime), stopped={player.Stopped} {player.Error}");

using var f = File.Create(args[1]);
using var bw = new BinaryWriter(f);
bw.Write("RIFF"u8); bw.Write(36 + done * 2); bw.Write("WAVEfmt "u8); bw.Write(16); bw.Write((short)1); bw.Write((short)2);
bw.Write((int)MucEngine.SampleRate); bw.Write((int)MucEngine.SampleRate * 4); bw.Write((short)4); bw.Write((short)16);
bw.Write("data"u8); bw.Write(done * 2);
for (int i = 0; i < done; i++) bw.Write(pcm[i]);
return 0;
