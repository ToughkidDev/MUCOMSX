namespace MDPlayer.Driver.MUCOM
{
    // MsxMucCompiler calls this helper on MDPlayer4Mac's MucomDotNET adapter, which the
    // playground does not include; forward to the same code in MucEngine.
    internal static class MucomDotNET
    {
        internal static byte[] NormalizeTrackDeclarationIndentation(byte[] source)
            => MucPlayground.MucEngine.NormalizeTrackDeclarationIndentation(source);
    }
}
