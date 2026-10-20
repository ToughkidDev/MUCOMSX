using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using MDPlayer.Driver.MUCOM;
using mucomDotNET.Driver;
using musicDriverInterface;

namespace MucPlayground;

// Source positions for MUCOMSX songs (MSXA-K, SCCA-E, #SSGExtend). MDPlayer4Mac's
// MsxMucCompiler rewrites the text before compiling it (MSX parts become L..V, SCC parts are
// compiled one by one as D, a tempo line and a #driver line are added) and packs the result
// as msPb bytes, so the positions the compiler records are lost. This repeats those steps
// while keeping a map from each rewritten line back to the editor's line, then lays the
// compiler's data (which carries the positions) over the packed pages. Pages whose bytes do
// not match what MsxMucCompiler produced are left without positions, so a change upstream can
// only cost the highlight, never change what plays.
static class MsxTrace
{
    // One line of rewritten text: the editor row it came from (0 = added) and how far its
    // columns are from the editor's (editor column = column + Shift).
    sealed record Line(string Text, int Row, int Shift);

    static readonly Regex NativeLine = new(@"(?m)^[ \t]*MSX([A-K0-9]+)(?=[ \t])", RegexOptions.CultureInvariant);
    static readonly Regex MusicLine = new(@"(?m)^[ \t]*(?:(?:MSX)?(?:[A-Va-z][0-9]*)+|SCC(?:[A-E][0-9]?)+)[ \t]", RegexOptions.CultureInvariant);
    static readonly Regex SccLine = new(@"(?m)^[ \t]*SCC((?:[A-E][0-9]?)+)(?=[ \t])", RegexOptions.CultureInvariant);
    const string TrackCharacters = "ABCDEFGHIJKLMNOPQRSTUVabcdefghijklmnopqrstuvWXYZwxyz";

    static readonly MethodInfo ExtractScc = typeof(MsxMucCompiler).GetMethod("ExtractScc", BindingFlags.NonPublic | BindingFlags.Static);
    static readonly MethodInfo NormalizeWaves = typeof(MsxMucCompiler).GetMethod("NormalizeWaves", BindingFlags.NonPublic | BindingFlags.Static);

    static string[] SplitLines(string text) => text.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n');

    // Lines kept by a step that only drops or replaces whole lines: matched in order.
    static List<Line> Follow(List<Line> before, string after)
    {
        List<Line> result = new();
        int at = 0;
        foreach (string text in SplitLines(after))
        {
            int found = -1;
            for (int i = at; i < before.Count; i++)
                if (before[i].Text == text) { found = i; break; }
            if (found >= 0) { result.Add(before[found]); at = found + 1; }
            else result.Add(new Line(text, 0, 0));
        }
        return result;
    }

    static string Join(List<Line> lines) => string.Join("\r\n", lines.Select(l => l.Text));

    // The data for the driver: one MmlDatum per byte of `packed`, carrying source positions
    // where they could be recovered; null when nothing could be.
    public static MmlDatum[] Build(byte[] source, byte[] packed, Func<string, Stream> openFile)
    {
        try { return BuildCore(source, packed, openFile); }
        catch { return null; }
    }

    static MmlDatum[] BuildCore(byte[] source, byte[] packed, Func<string, Stream> openFile)
    {
        if (ExtractScc == null || NormalizeWaves == null) return null;
        string ascii = Encoding.Latin1.GetString(source);
        bool native = NativeLine.IsMatch(ascii);
        bool scc = SccLine.IsMatch(ascii);
        string[] original = SplitLines(ascii);
        List<Line> lines = original.Select((t, i) => new Line(t, i + 1, 0)).ToList();

        Dictionary<int, byte[]> waves = new();
        List<string>[] sccRows = Enumerable.Range(0, 5).Select(_ => new List<string>()).ToArray();
        // Where each SCC channel's rows came from: editor row and the shift of their columns.
        List<(int Row, int Shift)>[] sccFrom = Enumerable.Range(0, 5).Select(_ => new List<(int, int)>()).ToArray();
        if (scc)
        {
            string extracted = (string)ExtractScc.Invoke(null, new object[] { ascii, openFile, waves, sccRows });
            for (int i = 0; i < original.Length; i++)
            {
                Match track = SccLine.Match(original[i]);
                if (!track.Success) continue;
                int body = track.Index + track.Length;
                foreach (Match selector in Regex.Matches(track.Groups[1].Value, @"([A-E])([0-9]?)"))
                    // "SCCAB body" becomes "D<page>body": editor column = column - 1 - page digits + body.
                    sccFrom[selector.Groups[1].Value[0] - 'A'].Add((i + 1, body - 1 - selector.Groups[2].Value.Length));
            }
            lines = Follow(lines, extracted);
            native = true;
        }
        // MSXA.. become L.. (the indent and "MSX" go, so later columns move left).
        lines = lines.Select(l =>
        {
            Match m = NativeLine.Match(l.Text);
            if (!m.Success) return l;
            string parts = new(m.Groups[1].Value.Select(c => c is >= 'A' and <= 'K' ? (char)(c + 11) : c).ToArray());
            // The whole match (indent and "MSX") is replaced by the part letters.
            return l with { Text = parts + l.Text.Substring(m.Index + m.Length), Shift = l.Shift + m.Groups[1].Index - m.Index };
        }).ToList();
        lines = lines.Select(l => Regex.IsMatch(l.Text, @"(?i)^#driver") ? l with { Text = "" } : l).ToList();
        lines = Follow(lines, (string)NormalizeWaves.Invoke(null, new object[] { Join(lines) }));
        // Text appended as "\r\nX\r\n" adds the line X and an empty one.
        int first = lines.FindIndex(l => MusicLine.IsMatch(l.Text));
        if (first >= 0) lines.Insert(first, new Line("A t225", 0, 0));
        else if (scc) { lines.Add(new Line("A t225", 0, 0)); lines.Add(new Line("", 0, 0)); }
        if (scc && !lines.Any(l => NativeLine.IsMatch(l.Text)) && !lines.Any(l => Regex.IsMatch(l.Text, @"^[L-V][0-9]*[ \t]")))
        {
            lines.Add(new Line("L ; extended directory", 0, 0)); lines.Add(new Line("", 0, 0));
        }
        List<Line> input = new() { new Line("#driver mucomDotNET", 0, 0) };
        input.AddRange(lines);

        MmlDatum[] output = Compile(input, openFile);
        if (output == null) return null;
        MupbInfo mupb = new MUBHeader(output, mucomDotNET.Common.myEncoding.Default).mupb;
        if (mupb == null) return null;

        // The pages MsxMucCompiler packs, part by part (0-10 OPNA, 11-21 MSX, 22-26 SCC).
        List<MupbInfo.PageDefine>[] parts = Enumerable.Range(0, 55).Select(_ => new List<MupbInfo.PageDefine>()).ToArray();
        for (int c = 0; c < Math.Min(2, mupb.chips.Length); c++)
            for (int p = 0; p < mupb.chips[c].parts.Length; p++)
                if (c == 0 || native && p != 10) parts[c * 11 + p].AddRange(mupb.chips[c].parts[p].pages);

        if (scc)
        {
            // Everything but the music rows (macros included, so their notes keep their rows).
            List<Line> common = lines.Where(l => !MusicLine.IsMatch(l.Text)).ToList();
            for (int ch = 0; ch < 5; ch++)
            {
                if (sccRows[ch].Count == 0) continue;
                List<Line> isolated = new() { new Line("#driver mucomDotNET", 0, 0) };
                isolated.AddRange(common);
                isolated.Add(new Line("L ; extended directory", 0, 0));
                for (int j = 0; j < sccRows[ch].Count; j++)
                {
                    var from = j < sccFrom[ch].Count ? sccFrom[ch][j] : (0, 0);
                    isolated.Add(new Line(sccRows[ch][j], from.Item1, from.Item2));
                }
                int channel = ch;
                MupbInfo one = mucomDotNET.Compiler.Muc88.CompileScc(waves, () =>
                {
                    MmlDatum[] bytes = Compile(isolated, openFile, sccChannel: channel);
                    return bytes == null ? null : new MUBHeader(bytes, mucomDotNET.Common.myEncoding.Default).mupb;
                });
                if (one == null) continue;
                foreach (var page in one.chips[0].parts[3].pages)
                {
                    if (page.length > 1)
                    {
                        page.data = new[] { new MmlDatum(0xf0), new MmlDatum(0) }.Concat(page.data).ToArray();
                        page.length += 2;
                    }
                    parts[22 + ch].Add(page);
                }
            }
        }
        return Lay(packed, parts);
    }

    // Compiles rewritten lines and moves each recorded position back to the editor's line.
    static MmlDatum[] Compile(List<Line> lines, Func<string, Stream> openFile, int sccChannel = -1)
    {
        // The compiler drops the indentation before a part name; columns follow.
        List<Line> indented = lines.Select(l =>
        {
            int ws = 0;
            while (ws < l.Text.Length && (l.Text[ws] == ' ' || l.Text[ws] == '\t')) ws++;
            return ws < l.Text.Length && l.Text[ws] < 0x80 && TrackCharacters.IndexOf(l.Text[ws]) >= 0 ? l with { Shift = l.Shift + ws } : l;
        }).ToList();
        byte[] input = MucEngine.NormalizeTrackDeclarationIndentation(Encoding.Latin1.GetBytes(Join(lines)));
        mucomDotNET.Compiler.Compiler compiler = new();
        compiler.Init();
        using MemoryStream stream = new(input, false);
        MmlDatum[] output = compiler.Compile(stream, openFile);
        CompilerInfo info = compiler.GetCompilerInfo();
        if (output == null || info?.errorList?.Count > 0) return null;
        HashSet<LinePos> done = new(ReferenceEqualityComparer.Instance);
        foreach (MmlDatum d in output)
        {
            LinePos lp = d?.linePos;
            if (lp == null || !done.Add(lp)) continue;
            Line from = lp.row >= 1 && lp.row <= indented.Count ? indented[lp.row - 1] : null;
            if (from == null || from.Row == 0) { lp.row = 0; continue; }
            lp.row = from.Row;
            lp.col += from.Shift;
            if (sccChannel >= 0) { lp.chipNumber = 2; lp.ch = sccChannel * 10 + lp.ch % 10; }
        }
        return output;
    }

    // Lays the pages over the msPb bytes, using the directory the way MsxMubProfile reads it.
    static MmlDatum[] Lay(byte[] packed, List<MupbInfo.PageDefine>[] parts)
    {
        MmlDatum[] result = packed.Select(b => new MmlDatum(b)).ToArray();
        int at = 8;
        uint Read(int size)
        {
            uint v = size == 1 ? packed[at] : size == 2 ? BitConverter.ToUInt16(packed, at) : BitConverter.ToUInt32(packed, at);
            at += size;
            return v;
        }
        Read(1); Read(1); Read(2);
        int pages = (int)Read(2), instruments = (int)Read(2), pcms = (int)Read(2);
        Read(4); Read(4); Read(4); Read(4);
        for (int c = 0; c < 5; c++)
        {
            Read(2); Read(4); Read(4); Read(4); Read(4); Read(4); Read(1);
            int inst = (int)Read(1);
            for (int i = 0; i < inst; i++) Read(2);
            int pcm = (int)Read(1);
            for (int i = 0; i < pcm; i++) Read(2);
        }
        int[] counts = new int[55];
        for (int i = 0; i < 55; i++) counts[i] = (int)Read(1);
        uint[] sizes = new uint[pages];
        for (int i = 0; i < pages; i++) { sizes[i] = Read(4); Read(4); }
        for (int i = 0; i < instruments + pcms; i++) Read(4);
        int page = 0, laid = 0;
        for (int part = 0; part < 55; part++)
            for (int k = 0; k < counts[part]; k++, page++)
            {
                int size = (int)sizes[page];
                MmlDatum[] data = k < parts[part].Count ? parts[part][k].data : null;
                if (data != null && data.Length == size && at + size <= packed.Length
                    && Enumerable.Range(0, size).All(i => data[i] != null && (byte)data[i].dat == packed[at + i]))
                {
                    Array.Copy(data, 0, result, at, size);
                    laid++;
                }
                at += size;
            }
        return laid > 0 ? result : null;
    }
}
