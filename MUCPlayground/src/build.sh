#!/usr/bin/env bash
# Rebuilds MUCPlayground/engine and engine-vgm (the WebAssembly engines) and samples.json.
#
# Needs the .NET 8 SDK with the wasm-tools workload:
#   dotnet workload install wasm-tools
#
# The compiler, driver and chip emulators come from MDPlayer4Mac, pinned below so the
# published engine always matches the commit it was tested against.
set -euo pipefail

MDP4MAC_REPO=https://github.com/ToughkidDev/MDPlayer4Mac.git
MDP4MAC_COMMIT=f1397f67c2d46ce10a3344698d471b72675ef6f0   # v0.2.8

here="$(cd "$(dirname "$0")" && pwd)"
playground="$(dirname "$here")"
mdp="${MDP4MAC_DIR:-$playground/.mdplayer4mac}"

if [ ! -d "$mdp/.git" ]; then
  git clone --filter=blob:none "$MDP4MAC_REPO" "$mdp"
fi
git -C "$mdp" fetch --quiet origin "$MDP4MAC_COMMIT" || true
git -C "$mdp" checkout --quiet --force "$MDP4MAC_COMMIT"
# MDPlayerCore (VGM playback) also references the other drivers' projects; trimming drops them.
git -C "$mdp" submodule update --init --depth 1

out="$(mktemp -d)"
trap 'rm -rf "$out"' EXIT

# Publishes a browser project and copies only what the browser loads (no precompressed
# copies or debug symbols) into MUCPlayground/<folder>.
publish() {
  # A stale incremental build can leave the trimmed assemblies inconsistent, so start clean.
  rm -rf "$here"/*/obj "$here"/*/bin
  dotnet publish "$here/$1" -c Release -p:Mdp4MacDir="$mdp" -o "$out/$2"
  rm -rf "$playground/$2"
  mkdir -p "$playground/$2"
  (cd "$out/$2/wwwroot/_framework" && find . -type f ! -name '*.gz' ! -name '*.br' ! -name '*.pdb' -exec cp --parents {} "$playground/$2/" \;)
}

publish Web/MucPlaygroundWeb.csproj engine          # MUC editor, MUB playback, exports
publish VgmWeb/VgmPlaygroundWeb.csproj engine-vgm   # VGM/VGZ playback, loaded on first use

python3 "$here/make_samples.py" "$playground/../Samples/Muc" "$playground/samples.json"
echo "engine: $(du -sh "$playground/engine" | cut -f1), engine-vgm: $(du -sh "$playground/engine-vgm" | cut -f1)"
