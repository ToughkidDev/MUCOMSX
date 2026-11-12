"""Lists the repository's sample songs for the playground's example menu.

usage: make_samples.py <Samples/Muc folder> <output samples.json>

Paths in the output are relative to MUCPlayground/, so the page can fetch them from the
same GitHub Pages site. Companion files (#voice / #pcm) are found by the page itself.
The VGMs folder next to Samples/Muc (Samples/VGMs/<album>/…, .vgm / .vgz / .mub) is listed
too, every folder in it that holds songs, after the MUC folders.
"""
import json
import os
import sys

root, out = sys.argv[1], sys.argv[2]
groups = []
for system in sorted(os.listdir(root)):
    system_dir = os.path.join(root, system)
    if not os.path.isdir(system_dir):
        continue
    for game in sorted(os.listdir(system_dir)):
        game_dir = os.path.join(system_dir, game)
        if not os.path.isdir(game_dir):   # notes such as a licence text next to the folders
            continue
        songs = sorted(f for f in os.listdir(game_dir) if f.lower().endswith(".muc"))
        if songs:
            groups.append({
                "name": game,
                "dir": "../Samples/Muc/%s/%s/" % (system, game),
                "songs": songs,
            })

vgms = os.path.join(os.path.dirname(os.path.normpath(root)), "VGMs")
if os.path.isdir(vgms):
    for here, dirs, names in sorted(os.walk(vgms)):
        dirs.sort()
        songs = sorted(f for f in names if f.lower().endswith((".vgm", ".vgz", ".mub")))
        if songs:
            rel = os.path.relpath(here, vgms).replace(os.sep, "/")
            groups.append({
                "name": os.path.basename(here),
                "dir": "../Samples/VGMs/%s/" % rel if rel != "." else "../Samples/VGMs/",
                "songs": songs,
            })

with open(out, "w", encoding="utf-8") as f:
    json.dump(groups, f, ensure_ascii=False, indent=1)
    f.write("\n")
