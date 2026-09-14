/**
 * Checks WCAG contrast for every theme in app/globals.css.
 *
 * The Light theme was previously unusable because components hardcoded
 * dark-theme greys, and nothing caught it. This does: run it after changing
 * any colour token.
 *
 *   node scripts/check-contrast.mjs
 *
 * Exits non-zero if any required pair falls below its threshold.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CSS = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'app',
  'globals.css'
);

/** Relative luminance per WCAG 2.1. */
function luminance([r, g, b]) {
  const chan = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Composites a foreground at `alpha` over an opaque background. */
function blend(fg, bg, alpha) {
  return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));
}

function parseThemes(css) {
  const themes = {};
  // Each [data-theme='x'] { ... } block, plus the :root default.
  const blockRe = /(:root(?:\s*,\s*\[data-theme='([\w-]+)'\])?|\[data-theme='([\w-]+)'\])\s*\{([^}]*)\}/g;
  let m;
  while ((m = blockRe.exec(css))) {
    const name = m[2] || m[3] || 'root';
    const body = m[4];
    const tokens = {};
    const varRe = /--stage-([\w]+)-rgb:\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g;
    let v;
    while ((v = varRe.exec(body))) {
      tokens[v[1]] = [Number(v[2]), Number(v[3]), Number(v[4])];
    }
    if (Object.keys(tokens).length) themes[name] = { ...(themes[name] || {}), ...tokens };
  }
  delete themes.root; // duplicate of dusk
  return themes;
}

// [foreground, background, minimum ratio, note]
// 4.5 is WCAG AA for body text; 3.0 is AA for large text and UI boundaries.
const CHECKS = [
  ['text', 'bg', 4.5],
  ['text', 'panel', 4.5],
  ['text', 'panel2', 4.5],
  ['muted', 'bg', 4.5],
  ['muted', 'panel', 4.5],
  ['muted', 'panel2', 4.5],
  ['subtle', 'bg', 3.0, 'tertiary text — non-essential only'],
  ['subtle', 'panel', 3.0, 'tertiary text — non-essential only'],
  ['accent', 'bg', 3.0],
  ['accent', 'panel', 3.0],
  ['success', 'panel', 3.0],
  ['warning', 'panel', 3.0],
  ['danger', 'panel', 3.0],
  ['borderStrong', 'panel', 1.4, 'must be visible as a boundary'],
];

const themes = parseThemes(fs.readFileSync(CSS, 'utf8'));
let failures = 0;

for (const [name, t] of Object.entries(themes)) {
  const rows = [];

  for (const [fg, bg, min, note] of CHECKS) {
    if (!t[fg] || !t[bg]) {
      rows.push([`${fg} on ${bg}`, 'MISSING', '', 'FAIL']);
      failures++;
      continue;
    }
    const ratio = contrast(t[fg], t[bg]);
    const ok = ratio >= min;
    if (!ok) failures++;
    rows.push([
      `${fg} on ${bg}`,
      ratio.toFixed(2),
      `>=${min.toFixed(1)}`,
      ok ? 'ok' : 'FAIL',
      note,
    ]);
  }

  // onAccent must read on an accent-filled button.
  if (t.onAccent && t.accent) {
    const ratio = contrast(t.onAccent, t.accent);
    const ok = ratio >= 4.5;
    if (!ok) failures++;
    rows.push(['onAccent on accent', ratio.toFixed(2), '>=4.5', ok ? 'ok' : 'FAIL']);
  }

  // The tinted active-row background used throughout the nav is
  // accentSoft at 15% over panel — check the accent text still reads on it.
  if (t.accentSoft && t.panel && t.accent) {
    const tinted = blend(t.accentSoft, t.panel, 0.15);
    const ratio = contrast(t.accent, tinted);
    const ok = ratio >= 3.0;
    if (!ok) failures++;
    rows.push(['accent on accentSoft/15', ratio.toFixed(2), '>=3.0', ok ? 'ok' : 'FAIL']);
  }

  const bad = rows.filter((r) => r[3] === 'FAIL');
  console.log(
    `\n${name.padEnd(6)} ${bad.length === 0 ? 'all pass' : `${bad.length} FAILING`}`
  );
  for (const [label, ratio, min, status, note] of rows) {
    if (status === 'FAIL') {
      console.log(
        `  ${status}  ${label.padEnd(26)} ${String(ratio).padStart(6)} (${min})${
          note ? `  — ${note}` : ''
        }`
      );
    }
  }
}

console.log(
  failures === 0
    ? '\nAll themes pass.\n'
    : `\n${failures} contrast failure(s).\n`
);
process.exit(failures === 0 ? 0 : 1);
