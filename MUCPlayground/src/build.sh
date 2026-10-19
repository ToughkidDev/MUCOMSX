#!/usr/bin/env bash
# Rebuilds MUCPlayground/engine (the WebAssembly engine) and MUCPlayground/samples.json.
#
# Needs the .NET 8 SDK with the wasm-tools workload:
#   dotnet workload install wasm-tools
#
# The compiler, driver and chip emulators come from MDPlayer4Mac, pinned below so the
# published engine always matches the commit it was tested against.
set -euo pipefail

MDP4MAC_REPO=https://github.com/ToughkidDev/MDPlayer4Mac.git
MDP4MAC_COMMIT=14cf7f084806bb5696e94c7d38cebe8e419e3c51

here="$(cd "$(dirname "$0")" && pwd)"
playground="$(dirname "$here")"
mdp="${MDP4MAC_DIR:-$playground/.mdplayer4mac}"

if [ ! -d "$mdp/.git" ]; then
  git clone --filter=blob:none "$MDP4MAC_REPO" "$mdp"
fi
git -C "$mdp" fetch --quiet origin "$MDP4MAC_COMMIT" || true
git -C "$mdp" checkout --quiet "$MDP4MAC_COMMIT"
git -C "$mdp" submodule update --init --depth 1 macos/ThirdParty/mucomDotNET

out="$(mktemp -d)"
trap 'rm -rf "$out"' EXIT
dotnet publish "$here/Web/MucPlaygroundWeb.csproj" -c Release -p:Mdp4MacDir="$mdp" -o "$out"

# Only what the browser loads: no precompressed copies or debug symbols.
rm -rf "$playground/engine"
mkdir -p "$playground/engine"
(cd "$out/wwwroot/_framework" && find . -type f ! -name '*.gz' ! -name '*.br' ! -name '*.pdb' -exec cp --parents {} "$playground/engine/" \;)

python3 "$here/make_samples.py" "$playground/../Samples/Muc" "$playground/samples.json"
echo "engine: $(du -sh "$playground/engine" | cut -f1)"
