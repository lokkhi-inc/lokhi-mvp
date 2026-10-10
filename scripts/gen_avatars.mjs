/**
 * Lokhi — profile avatar generator.
 *
 * Generates one DiceBear "Personas" SVG per archetype (see APP_DATA.avatars
 * in app-data.js) and writes them into lokhi-assets/avatars/, the avatar
 * library folder the app loads from at runtime. This is an offline,
 * build-time step — the shipped app never calls DiceBear or any other
 * service at runtime, it only ever loads the static SVGs committed here.
 *
 * Not part of the app's own dependency tree (this project has no
 * package.json / build step by design). To regenerate:
 *   cd /tmp && mkdir dicebear-gen && cd dicebear-gen
 *   npm init -y && npm install @dicebear/core@9.4.3 @dicebear/personas@9.4.3
 *   node /path/to/lokhi/scripts/gen_avatars.mjs
 *
 * Run from a directory that has @dicebear/core and @dicebear/personas
 * installed (see above) — it resolves them via normal Node module lookup.
 */
import { createAvatar } from "@dicebear/core";
import * as personas from "@dicebear/personas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "lokhi-assets", "avatars");

// Must match the `id`s in APP_DATA.avatars (app-data.js) — one deterministic
// seed per archetype so everyone classified as "Explorer" sees the same
// avatar, and it stays stable across sessions.
const ARCHETYPE_SEEDS = [
  "explorer", "strategist", "builder", "dreamer",
  "adventurer", "investor", "creator", "custom"
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const seed of ARCHETYPE_SEEDS) {
  const avatar = createAvatar(personas, {
    seed,
    backgroundColor: ["transparent"] // sits inside the app's own tinted circular badge
  });
  const svg = avatar.toString();
  const outPath = path.join(OUT_DIR, `${seed}.svg`);
  fs.writeFileSync(outPath, svg);
  console.log("wrote", outPath);
}
