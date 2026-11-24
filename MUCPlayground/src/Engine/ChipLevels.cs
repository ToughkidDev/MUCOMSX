namespace MucPlayground;

// Levels between the parts of one chip, set where MDSound would leave them equal.
//   OPNA (YM2608) SSG: on the real chip the SSG inside the OPNA sounds about 20% quieter
//   against its FM than MDSound's fmgen makes it, so it is turned down by 2 dB (fmgen's
//   SetVolumePSG is in 0.5 dB steps: -4 is 10^(-4/40) = 0.79 of the level, about 20% less).
//   fmgen sets it back only when the chip is initialised, so once after MDSound.Init.
public static class ChipLevels
{
    public const int OpnaSsg = -4;

    public static void Apply(MDSound.MDSound mds)
    {
        mds.SetVolumeYM2608PSG(0, OpnaSsg);
        mds.SetVolumeYM2608PSG(1, OpnaSsg);
    }
}
