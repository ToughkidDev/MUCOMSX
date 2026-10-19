using System.Text;

namespace MucPlayground;

// Minimal VGM 1.71 writer for the chips MUCPlayground drives. Commands and clocks follow
// the VGM specification; timing is in 44100 Hz samples, the same clock the driver runs on.
public sealed class VgmWriter
{
    public const uint OplClock = 3_579_545;
    public const uint PsgClock = 1_789_773;     // real MSX PSG clock (MDSound's AY core takes half)
    public const uint SccClock = 1_789_773;

    readonly MemoryStream data = new();
    long lastFrame;
    long loopFrame = -1;
    long loopOffset = -1;

    // Clocks written to the header; zero means the chip is absent.
    public uint Ym2608, Ym2610, Ym2151, Ym2413, Ay8910, K051649;
    public bool SecondYm2608, SecondYm2610, SccPlus;

    public void Wait(long frame)
    {
        long n = frame - lastFrame;
        lastFrame = frame;
        while (n > 0)
        {
            if (n == 735) { data.WriteByte(0x62); return; }
            if (n == 882) { data.WriteByte(0x63); return; }
            if (n <= 16) { data.WriteByte((byte)(0x70 + n - 1)); return; }
            int step = (int)Math.Min(n, 65535);
            data.WriteByte(0x61);
            data.WriteByte((byte)step);
            data.WriteByte((byte)(step >> 8));
            n -= step;
        }
    }

    public void Write(long frame, int command, int address, int value)
    {
        Wait(frame);
        data.WriteByte((byte)command);
        data.WriteByte((byte)address);
        data.WriteByte((byte)value);
    }

    // K051649 / K052539: D2 pp aa dd.
    public void WriteScc(long frame, int port, int address, int value)
    {
        Wait(frame);
        data.WriteByte(0xd2);
        data.WriteByte((byte)port);
        data.WriteByte((byte)address);
        data.WriteByte((byte)value);
    }

    // YM2610 ADPCM-A (0x82) / ADPCM-B (0x83) ROM image, loaded whole at address 0.
    public void WriteRom(long frame, byte type, byte[] rom, bool second)
    {
        Wait(frame);
        int size = rom.Length + 8;
        data.WriteByte(0x67);
        data.WriteByte(0x66);
        data.WriteByte(type);
        data.Write(BitConverter.GetBytes(second ? size | unchecked((int)0x80000000) : size));
        data.Write(BitConverter.GetBytes(rom.Length));
        data.Write(BitConverter.GetBytes(0));
        data.Write(rom);
    }

    public void MarkLoop(long frame)
    {
        Wait(frame);
        loopFrame = frame;
        loopOffset = data.Length;
    }

    public byte[] Finish(long endFrame, string title, string composer)
    {
        Wait(endFrame);
        data.WriteByte(0x66);

        byte[] gd3 = Gd3(title, composer);
        const int headerSize = 0x100;
        byte[] body = data.ToArray();
        byte[] file = new byte[headerSize + body.Length + gd3.Length];
        void U32(int at, long v) => BitConverter.GetBytes((uint)v).CopyTo(file, at);

        Encoding.ASCII.GetBytes("Vgm ").CopyTo(file, 0);
        U32(0x04, file.Length - 0x04);
        U32(0x08, 0x171);
        U32(0x10, Ym2413);
        U32(0x14, headerSize + body.Length - 0x14);
        U32(0x18, endFrame);
        if (loopOffset >= 0)
        {
            U32(0x1c, headerSize + loopOffset - 0x1c);
            U32(0x20, endFrame - loopFrame);
        }
        U32(0x24, 60);
        U32(0x30, Ym2151);
        U32(0x34, headerSize - 0x34);
        U32(0x48, Ym2608 | (SecondYm2608 ? 0x4000_0000u : 0));
        // MUCOM's OPNB parts use all six FM channels, which only the YM2610B has.
        U32(0x4c, Ym2610 == 0 ? 0 : Ym2610 | 0x8000_0000u | (SecondYm2610 ? 0x4000_0000u : 0));
        U32(0x74, Ay8910);
        file[0x79] = 0x01;                                  // AY8910 legacy output flag
        U32(0x9c, K051649 == 0 ? 0 : K051649 | (SccPlus ? 0x8000_0000u : 0));
        body.CopyTo(file, headerSize);
        gd3.CopyTo(file, headerSize + body.Length);
        return file;
    }

    static byte[] Gd3(string title, string composer)
    {
        // Track, game, system and author, each in English then Japanese; date; converter; notes.
        string[] fields = { title ?? "", title ?? "", "", "", "", "", composer ?? "", composer ?? "", "", "MUCPlayground", "" };
        using MemoryStream text = new();
        foreach (string f in fields)
        {
            text.Write(Encoding.Unicode.GetBytes(f));
            text.Write(new byte[2]);
        }
        byte[] strings = text.ToArray();
        using MemoryStream gd3 = new();
        gd3.Write(Encoding.ASCII.GetBytes("Gd3 "));
        gd3.Write(BitConverter.GetBytes(0x100));
        gd3.Write(BitConverter.GetBytes(strings.Length));
        gd3.Write(strings);
        return gd3.ToArray();
    }
}
