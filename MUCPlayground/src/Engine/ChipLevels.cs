namespace MucPlayground;

using Kind = MDSound.MDSound.enmInstrumentType;

// Chip levels, set from outside the engine (MUCPlayground's chip-levels.js), so they can be
// changed without rebuilding it. Applied once after MDSound.Init to every song, on MDPlayer's
// mixer scale (0.5 dB steps, -192 off, +20 at most) with the MDSound setters MDPlayer4Mac's
// Balance settings use: a whole chip (SetVolume) or one part of it (SetVolumeYM2608PSG …).
// The emulators set these back only when a chip is initialised.
//   Set("YM2608 SSG=-4;YM2413=-2")
public static class ChipLevels
{
    static readonly List<(Kind kind, string part, int volume)> levels = new();

    // The parts each chip has (MDSound's per-part setters).
    static readonly Dictionary<Kind, Dictionary<string, Action<MDSound.MDSound, byte, int>>> parts = new()
    {
        [Kind.YM2608] = new() { ["FM"] = (m, i, v) => m.SetVolumeYM2608FM(i, v), ["SSG"] = (m, i, v) => m.SetVolumeYM2608PSG(i, v),
                                ["RHYTHM"] = (m, i, v) => m.SetVolumeYM2608Rhythm(i, v), ["ADPCM"] = (m, i, v) => m.SetVolumeYM2608Adpcm(i, v) },
        [Kind.YM2610] = new() { ["FM"] = (m, i, v) => m.SetVolumeYM2610FM(i, v), ["SSG"] = (m, i, v) => m.SetVolumeYM2610PSG(i, v),
                                ["ADPCMA"] = (m, i, v) => m.SetVolumeYM2610AdpcmA(i, v), ["ADPCMB"] = (m, i, v) => m.SetVolumeYM2610AdpcmB(i, v) },
        [Kind.YM2203] = new() { ["FM"] = (m, i, v) => m.SetVolumeYM2203FM(i, v), ["SSG"] = (m, i, v) => m.SetVolumeYM2203PSG(i, v) },
        [Kind.YM2612] = new() { ["FM"] = (m, i, v) => m.SetVolumeYM2612FM(i, v), ["DAC"] = (m, i, v) => m.SetVolumeYM2612DAC(i, v) },
        [Kind.Y8950] = new() { ["FM"] = (m, i, v) => m.SetVolumeY8950FM(i, v), ["ADPCM"] = (m, i, v) => m.SetVolumeY8950Adpcm(i, v) },
    };

    // Entries that are not understood are left out; the result lists the ones taken.
    public static string Set(string spec)
    {
        levels.Clear();
        var taken = new List<string>();
        foreach (string entry in (spec ?? "").Split(';', '\n'))
        {
            string[] kv = entry.Split('=');
            if (kv.Length != 2 || !int.TryParse(kv[1].Trim(), out int volume)) continue;
            string[] name = kv[0].Trim().ToUpperInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (name.Length is < 1 or > 2 || !Enum.TryParse(name[0], true, out Kind kind)) continue;
            string part = name.Length == 2 ? (name[1] == "PSG" ? "SSG" : name[1]) : "";
            if (part != "" && !(parts.TryGetValue(kind, out var p) && p.ContainsKey(part))) continue;
            volume = Math.Clamp(volume, -192, 20);
            levels.Add((kind, part, volume));
            taken.Add($"{kind}{(part == "" ? "" : " " + part)}={volume}");
        }
        return string.Join(";", taken);
    }

    public static void Apply(MDSound.MDSound mds)
    {
        foreach (var (kind, part, volume) in levels)
        {
            if (part == "") { mds.SetVolume(kind, volume); continue; }
            for (byte id = 0; id < 2; id++) parts[kind][part](mds, id, volume);
        }
    }
}
