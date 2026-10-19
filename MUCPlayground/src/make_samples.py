"""Lists the repository's sample songs for the playground's example menu.

usage: make_samples.py <Samples/Muc folder> <output samples.json>

Paths in the output are relative to MUCPlayground/, so the page can fetch them from the
same GitHub Pages site. Companion files (#voice / #pcm) are found by the page itself.
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

with open(out, "w", encoding="utf-8") as f:
    json.dump(groups, f, ensure_ascii=False, indent=1)
    f.write("\n")
