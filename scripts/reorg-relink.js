#!/usr/bin/env node
/**
 * reorg-relink.js — rewrite backtick file references in LIVE docs after the repo reorg
 * Plan: docs/planning/PLAN_RepoReorg_20261017.md §5 step 3
 *
 * Usage:
 *   node scripts/reorg-relink.js            rewrite references (prints per-file counts)
 *   node scripts/reorg-relink.js --check    report unresolved backtick references, no writes
 *
 * Rules:
 *   - Only backtick spans are touched: `NAME.md`, `./NAME.md`, `old/dir/NAME.md`
 *   - A span is rewritten when it matches a manifest old path, or the basename of a
 *     moved file (only if that basename is unique in the manifest)
 *   - New value is the repo-root-relative path; a leading "./" is preserved
 *   - docs/archive/, appscript_files/archive/ and the reorg plan/manifest are frozen (not rewritten)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'docs/planning/REORG_MANIFEST.tsv');
const PRE_REORG_REV = '757a9d3';  // last commit before the moves
const CHECK_ONLY = process.argv.includes('--check');

// Live files whose references must keep working
const LIVE_ROOT_FILES = ['Claude.md', 'README.md', 'Gemini.md', 'REF_SessionLog.md'];
const LIVE_DIRS = ['docs/reference', 'docs/guides', 'docs/design', 'docs/planning', 'docs/backups'];
const FROZEN = ['docs/planning/PLAN_RepoReorg_20261017.md', 'docs/planning/REORG_MANIFEST.tsv'];
const REF_PATTERN = /`(\.\/)?([^`\n]+?\.(?:md|txt|js|html|sh|json))`/g;

// --- Load manifest: old path -> new path, plus unique basename -> new path ---
const byOldPath = new Map();
const byBasename = new Map();
fs.readFileSync(MANIFEST, 'utf8').split(/\r?\n/).forEach(line => {
  if (!line || line.startsWith('#')) return;
  const [oldPath, newPath] = line.split('\t');
  byOldPath.set(oldPath, newPath);
  const base = path.basename(oldPath);
  byBasename.set(base, byBasename.has(base) ? null : newPath);  // null = ambiguous
});

function listLiveFiles() {
  const files = LIVE_ROOT_FILES.filter(f => fs.existsSync(path.join(ROOT, f)));
  LIVE_DIRS.forEach(dir => {
    fs.readdirSync(path.join(ROOT, dir)).forEach(f => files.push(dir + '/' + f));
  });
  fs.readdirSync(path.join(ROOT, 'appscript_files'))
    .filter(f => f.endsWith('.md'))
    .forEach(f => files.push('appscript_files/' + f));
  return files.filter(f => !FROZEN.includes(f) && fs.statSync(path.join(ROOT, f)).isFile());
}

function resolveNewPath(ref) {
  if (byOldPath.has(ref)) return byOldPath.get(ref);
  if (!ref.includes('/') && byBasename.get(ref)) return byBasename.get(ref);
  return null;
}

function existsFrom(file, ref) {
  return fs.existsSync(path.join(ROOT, ref)) || fs.existsSync(path.join(ROOT, path.dirname(file), ref));
}

// --- Check mode: unresolved references, split into caused-by-move vs pre-existing ---
if (CHECK_ONLY) {
  // Pre-reorg tree, limited to files the manifest moved (refs to anything else were never ours to break)
  const movedBefore = new Set(
    execSync(`git ls-tree -r --name-only ${PRE_REORG_REV}`, { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .filter(f => byOldPath.has(f))
  );
  const movedBasenames = new Set([...movedBefore].map(f => path.basename(f)));
  let broken = 0;
  let preExisting = 0;

  listLiveFiles().forEach(file => {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const match of text.matchAll(REF_PATTERN)) {
      const ref = match[2];
      if (/[<>*{}]/.test(ref) || existsFrom(file, ref)) continue;  // skip templates/globs
      const existedBefore = movedBefore.has(ref) || (!ref.includes('/') && movedBasenames.has(ref));
      if (existedBefore) {
        broken++;
        console.log(`BROKEN BY REORG  ${file}: \`${ref}\``);
      } else {
        preExisting++;
      }
    }
  });

  console.log(`\nBroken by reorg: ${broken} | pre-existing dangling refs (ignored): ${preExisting}`);
  process.exit(broken > 0 ? 1 : 0);
}

// --- Rewrite mode ---
let total = 0;
listLiveFiles().forEach(file => {
  const fullPath = path.join(ROOT, file);
  const original = fs.readFileSync(fullPath, 'utf8');
  let count = 0;

  const updated = original.replace(REF_PATTERN, (span, dotSlash, ref) => {
    const newPath = resolveNewPath(ref);
    if (!newPath || newPath === ref) return span;
    count++;
    return '`' + (dotSlash || '') + newPath + '`';
  });

  if (count > 0) {
    fs.writeFileSync(fullPath, updated);
    console.log(`${String(count).padStart(4)}  ${file}`);
    total += count;
  }
});
console.log(`\nRewrote ${total} references`);
