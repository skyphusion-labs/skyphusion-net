#!/usr/bin/env node
// Drift check for the ask widget copy in public/ask-widget.js.
//
// The canonical widget is public/ask-widget.js in @skyphusion/search-mcp. This site keeps its
// own copy (vanilla, no build step) and DECLARES which canonical version it tracks in
// scripts/ask-widget.canonical.json. This script fetches that exact version from the npm
// registry (versions are immutable; never `latest`, never a branch) and fails unless the copy
// is byte-identical to it, or, when scripts/ask-widget.divergence.diff exists, byte-identical
// to the canonical with that committed patch applied. The patch is the whole waiver: keep it
// minimal and explain each hunk in the README section "Ask widget".
//
//   node scripts/check-ask-widget.mjs           check (exit 0 ok, 1 drift, 2 cannot check)
//   node scripts/check-ask-widget.mjs --fetch   print the canonical file at the declared version
//   node scripts/check-ask-widget.mjs --diff    print canonical -> copy as a unified diff
//                                               (regenerates the divergence file)
//
// Node built-ins plus the system tar, patch and diff only. No dependencies.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(root, "scripts/ask-widget.canonical.json");
const DIVERGENCE = join(root, "scripts/ask-widget.divergence.diff");
const COPY = join(root, "public/ask-widget.js");
const PACKAGE = "@skyphusion/search-mcp";
const IN_TARBALL = "package/public/ask-widget.js";

let tmp = null;

function finish(code) {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  process.exit(code);
}

function die(code, msg) {
  console.error("ask-widget drift check: " + msg);
  finish(code);
}

function declaredVersion() {
  if (!existsSync(MANIFEST)) die(2, "missing scripts/ask-widget.canonical.json (the copy must declare the canonical version it tracks)");
  let m;
  try {
    m = JSON.parse(readFileSync(MANIFEST, "utf8"));
  } catch (e) {
    die(2, "cannot parse scripts/ask-widget.canonical.json: " + e.message);
  }
  if (m.package !== PACKAGE) die(2, 'scripts/ask-widget.canonical.json "package" must be "' + PACKAGE + '"');
  if (typeof m.version !== "string" || !/^\d+\.\d+\.\d+$/.test(m.version)) {
    die(2, 'scripts/ask-widget.canonical.json "version" must be an exact x.y.z (no range, tag or "latest")');
  }
  return m.version;
}

async function fetchCanonical(version) {
  const url = "https://registry.npmjs.org/" + PACKAGE + "/-/search-mcp-" + version + ".tgz";
  let last = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) die(2, PACKAGE + "@" + version + " does not exist on the npm registry (" + url + ")");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const tgz = Buffer.from(await res.arrayBuffer());
      const t = spawnSync("tar", ["-xzOf", "-", IN_TARBALL], { input: tgz, maxBuffer: 16 * 1024 * 1024 });
      if (t.status !== 0 || !t.stdout.length) {
        die(2, "cannot extract " + IN_TARBALL + " from " + PACKAGE + "@" + version + ": " + String(t.stderr).trim());
      }
      return t.stdout;
    } catch (e) {
      last = e.message;
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
  die(2, "cannot fetch " + url + " after 3 attempts: " + last);
}

const mode = process.argv[2] || "";
if (!["", "--fetch", "--diff"].includes(mode)) die(2, "unknown argument " + mode);
if (!existsSync(COPY)) die(2, "missing public/ask-widget.js");

const version = declaredVersion();
const canonical = await fetchCanonical(version);
const copy = readFileSync(COPY);
tmp = mkdtempSync(join(tmpdir(), "ask-widget-"));
const canonicalFile = join(tmp, "canonical.js");
writeFileSync(canonicalFile, canonical);

if (mode === "--fetch") {
  process.stdout.write(canonical, () => finish(0));
} else if (mode === "--diff") {
  const d = spawnSync("diff", ["-u", "-L", "canonical", "-L", "copy", canonicalFile, COPY]);
  if (d.status === 2) die(2, "diff failed: " + String(d.stderr).trim());
  process.stdout.write(d.stdout, () => finish(0));
} else {
  const tag = PACKAGE + "@" + version;
  const identical = canonical.equals(copy);

  if (!existsSync(DIVERGENCE)) {
    if (identical) {
      console.log("ok: public/ask-widget.js is byte-identical to " + tag);
      finish(0);
    }
    const d = spawnSync("diff", ["-u", "-L", tag, "-L", "public/ask-widget.js", canonicalFile, COPY]);
    console.error(String(d.stdout).split("\n").slice(0, 60).join("\n"));
    die(1, "public/ask-widget.js differs from " + tag + " and no scripts/ask-widget.divergence.diff declares why. " +
      "Restore it (node scripts/check-ask-widget.mjs --fetch > public/ask-widget.js) or declare a minimal divergence.");
  }

  if (identical) {
    die(1, "scripts/ask-widget.divergence.diff exists but the copy equals " + tag + "; delete the stale divergence file");
  }
  const out = join(tmp, "patched.js");
  const p = spawnSync("patch", ["-F0", "-s", "-o", out, canonicalFile, DIVERGENCE]);
  if (p.status !== 0) {
    die(1, "scripts/ask-widget.divergence.diff does not apply cleanly to " + tag + ": " +
      (String(p.stdout) + String(p.stderr)).trim());
  }
  if (!readFileSync(out).equals(copy)) {
    const d = spawnSync("diff", ["-u", "-L", tag + " + divergence", "-L", "public/ask-widget.js", out, COPY]);
    console.error(String(d.stdout).split("\n").slice(0, 60).join("\n"));
    die(1, "public/ask-widget.js is not " + tag + " plus scripts/ask-widget.divergence.diff. " +
      "Update the divergence file (node scripts/check-ask-widget.mjs --diff > scripts/ask-widget.divergence.diff) only if the change is intended.");
  }
  const changed = readFileSync(DIVERGENCE, "utf8").split("\n").filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---) /.test(l)).length;
  console.log("ok: public/ask-widget.js is " + tag + " plus the declared divergence (" + changed + " changed lines)");
  finish(0);
}
