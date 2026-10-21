namespace MucPlayground;

// Per-channel volume, for the channel view's faders, on MDPlayer4Mac's mixer scale: -192 to
// +20 in 0.5 dB steps (MDSound's chip volume, 16384 * 10^(v / 40)), so -96 dB to +10 dB,
// with -192 meaning off. The emulators mix their channels inside, so a channel is made
// quieter or louder where a driver would do it: in the registers the song writes (louder
// only as far as a register can go; a level the song set to silence stays silent). FM: the carrier operators' TL (0.75 dB steps, by the channel's algorithm);
// SSG / PSG: the 4-bit level (about 3 dB steps; a channel on the hardware envelope can only
// be muted); OPNA rhythm and YM2610 ADPCM-A: each instrument's 5-bit level (0.75 dB; muting
// clears its L/R); ADPCM-B: the 8-bit level; OPLL: the 4-bit attenuation (3 dB steps); SCC:
// the 4-bit volume. The song's own values are kept, so a fader can always be moved back.
//
// Channels (fader numbers) per chip:
//   YM2608: 0-5 FM1-6, 6-8 SSG1-3, 9-14 rhythm BD SD TOP HH TOM RIM, 15 ADPCM
//   YM2610: 0-5 FM1-6, 6-8 SSG1-3, 9-14 ADPCM-A 1-6, 15 ADPCM-B
//   YM2151: 0-7 FM1-8      YM2413: 0-8 FM1-9, 9-13 rhythm BD SD TOM CYM HH
//   AY8910: 0-2            K051649: 0-4
public sealed class ChannelMixer
{
    public const int MinVolume = -192, MaxVolume = 20, Mute = MinVolume;
    public enum Chip { Opna, Opnb, Opm, Opll, Psg, Scc }

    sealed class State
    {
        public readonly int[] Reg = new int[512];
        public readonly bool[] Known = new bool[512];
        public readonly int[] Vol = new int[16];     // MDPlayer's mixer units (0.5 dB), Mute = off
    }

    readonly Dictionary<(Chip, int), State> states = new();
    readonly Dictionary<Chip, Action<int, int, int, int>> sinks = new();   // (id, port, addr, value) to the emulator
    bool active;

    public static bool TryParse(string name, out Chip chip)
    {
        switch (name)
        {
            case "YM2608": chip = Chip.Opna; return true;
            case "YM2610": chip = Chip.Opnb; return true;
            case "YM2151": chip = Chip.Opm; return true;
            case "YM2413": chip = Chip.Opll; return true;
            case "AY8910": chip = Chip.Psg; return true;
            case "K051649": chip = Chip.Scc; return true;
        }
        chip = Chip.Opna;
        return false;
    }

    public void Sink(Chip chip, Action<int, int, int, int> write) => sinks[chip] = write;

    State Get(Chip chip, int id)
    {
        if (!states.TryGetValue((chip, id), out State s)) states[(chip, id)] = s = new State();
        return s;
    }

    // A fader: -192 (off) to +20; 0 is the song as written.
    public void SetVolume(Chip chip, int id, int channel, int volume)
    {
        if (channel < 0 || channel >= 16) return;
        State s = Get(chip, id);
        s.Vol[channel] = Math.Clamp(volume, MinVolume, MaxVolume);
        active = states.Values.Any(x => x.Vol.Any(a => a != 0));
        // Everything that carries a level goes out again with the new setting (writing the
        // same value again changes nothing).
        if (!sinks.TryGetValue(chip, out var write)) return;
        for (int r = 0; r < 512; r++)
        {
            if (!s.Known[r]) continue;
            (int port, int a) = Where(chip, r);
            if (CarriesLevel(chip, port, a)) write(id, port, a, Out(chip, s, port, a, s.Reg[r]));
        }
    }

    // Where a register is kept: OPN / OPNA / OPNB port 0-1 and address; the SCC's volume
    // registers (port 2, channels 0-4) only.
    static int Index(Chip chip, int port, int address) => chip == Chip.Scc
        ? (port == 2 && address >= 0 && address < 5 ? address : -1)
        : (port & 1) << 8 | (address & 0xff);
    static (int port, int address) Where(Chip chip, int r) => chip == Chip.Scc ? (2, r) : (r >> 8, r & 0xff);

    // A register write of the song: remembered, and returned as the emulator should get it.
    public int Adjust(Chip chip, int id, int port, int address, int value)
    {
        int r = Index(chip, port, address);
        if (r < 0) return value;
        State s = Get(chip, id);
        s.Reg[r] = value;
        s.Known[r] = true;
        (port, address) = Where(chip, r);
        return active ? Out(chip, s, port, address, value) : value;
    }

    // After a write that decides which registers carry a channel's level (an FM algorithm,
    // OPLL rhythm mode): those go out again.
    public void After(Chip chip, int id, int port, int address)
    {
        if (!active || !sinks.TryGetValue(chip, out var write)) return;
        State s = Get(chip, id);
        void Again(int p, int a) { int r = p << 8 | a; if (s.Known[r]) write(id, p, a, Out(chip, s, p, a, s.Reg[r])); }
        switch (chip)
        {
            case Chip.Opna or Chip.Opnb when address >= 0xb0 && address <= 0xb2:
                for (int slot = 0; slot < 4; slot++) Again(port, 0x40 + slot * 4 + (address & 3));
                break;
            case Chip.Opm when address >= 0x20 && address <= 0x27:
                for (int slot = 0; slot < 4; slot++) Again(0, 0x60 + slot * 8 + (address & 7));
                break;
            case Chip.Opll when address == 0x0e:
                for (int a = 0x36; a <= 0x38; a++) Again(0, a);
                break;
        }
    }

    static bool CarriesLevel(Chip chip, int port, int a) => chip switch
    {
        Chip.Opna => (a >= 0x40 && a <= 0x4f) || (port == 0 && ((a >= 8 && a <= 10) || (a >= 0x18 && a <= 0x1d))) || (port == 1 && a == 0x0b),
        Chip.Opnb => (a >= 0x40 && a <= 0x4f) || (port == 0 && ((a >= 8 && a <= 10) || a == 0x1b)) || (port == 1 && a >= 0x08 && a <= 0x0d),
        Chip.Opm => a >= 0x60 && a <= 0x7f,
        Chip.Opll => a >= 0x30 && a <= 0x38,
        Chip.Psg => a >= 8 && a <= 10,
        Chip.Scc => port == 2 && a < 5,
        _ => false,
    };

    int Out(Chip chip, State s, int port, int a, int v)
    {
        switch (chip)
        {
            case Chip.Opna:
            case Chip.Opnb:
                if (a >= 0x40 && a <= 0x4f && (a & 3) != 3)
                {
                    int alg = s.Reg[port << 8 | 0xb0 | (a & 3)] & 7;
                    return Carrier(alg, (a >> 2) & 3) ? Tl(v, s.Vol[port * 3 + (a & 3)]) : v;
                }
                if (port == 0 && a >= 8 && a <= 10) return Level4(v, s.Vol[6 + a - 8]);
                if (chip == Chip.Opna)
                {
                    if (port == 0 && a >= 0x18 && a <= 0x1d) return Level5(v, s.Vol[9 + a - 0x18]);
                    if (port == 1 && a == 0x0b) return Linear(v, 255, s.Vol[15]);
                }
                else
                {
                    if (port == 1 && a >= 0x08 && a <= 0x0d) return Level5(v, s.Vol[9 + a - 0x08]);
                    if (port == 0 && a == 0x1b) return Linear(v, 255, s.Vol[15]);
                }
                return v;
            case Chip.Opm:
                if (a >= 0x60 && a <= 0x7f)
                {
                    int ch = a & 7, alg = s.Reg[0x20 | ch] & 7;
                    return Carrier(alg, (a - 0x60) >> 3) ? Tl(v, s.Vol[ch]) : v;
                }
                return v;
            case Chip.Opll:
                if (a >= 0x30 && a <= 0x38)
                {
                    int ch = a - 0x30;
                    if ((s.Reg[0x0e] & 0x20) == 0 || ch < 6) return (v & 0xf0) | Att4(v & 15, s.Vol[ch]);
                    int hi = v >> 4 & 15, lo = v & 15;
                    if (ch == 6) lo = Att4(lo, s.Vol[9]);
                    else if (ch == 7) { hi = Att4(hi, s.Vol[13]); lo = Att4(lo, s.Vol[10]); }
                    else { hi = Att4(hi, s.Vol[11]); lo = Att4(lo, s.Vol[12]); }
                    return hi << 4 | lo;
                }
                return v;
            case Chip.Psg:
                return a >= 8 && a <= 10 ? Level4(v, s.Vol[a - 8]) : v;
            case Chip.Scc:
                return port == 2 && a < 5 ? Linear(v & 15, 15, s.Vol[a]) | (v & 0xf0) : v;
        }
        return v;
    }

    // Operator slot in register order (OP1, OP3, OP2, OP4; OPM M1, M2, C1, C2) is a carrier.
    static bool Carrier(int alg, int slot)
    {
        int op = slot switch { 0 => 1, 1 => 3, 2 => 2, _ => 4 };
        return alg switch
        {
            <= 3 => op == 4,
            4 => op == 2 || op == 4,
            5 or 6 => op != 1,
            _ => true,
        };
    }

    static bool Off(int vol) => vol <= MinVolume;
    // Register steps of `db` dB for a fader value (positive: quieter).
    static int Steps(int vol, double db) => (int)Math.Round(-vol / 2.0 / db);
    static int Tl(int v, int vol)
    {
        int tl = v & 0x7f;
        if (Off(vol)) return (v & 0x80) | 127;
        if (tl == 127) return v;          // the song's silence
        return (v & 0x80) | Math.Clamp(tl + Steps(vol, 0.75), 0, 127);
    }
    static int Level4(int v, int vol)
    {
        if (Off(vol)) return v & 0xe0;
        if ((v & 0x10) != 0 || (v & 15) == 0) return v;    // on the envelope, or silent: as it is
        return (v & ~15) | Math.Clamp((v & 15) - Steps(vol, 3), 0, 15);
    }
    static int Level5(int v, int vol) => Off(vol) ? 0 : (v & 0xc0) | Math.Clamp((v & 31) - Steps(vol, 0.75), 0, 31);
    static int Att4(int x, int vol) => Off(vol) ? 15 : Math.Clamp(x + Steps(vol, 3), 0, 15);
    static int Linear(int v, int max, int vol) => Off(vol) ? 0 : Math.Clamp((int)Math.Round(v * Math.Pow(10, vol / 40.0)), 0, max);
}
