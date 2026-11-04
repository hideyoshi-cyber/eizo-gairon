// figures/lessons と figures/gaiden のSVGを検査する（docs/FIGURE_STYLE.md の規則）。エラーがあれば exit 1。
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const errors = [];
const dirs = ['figures/lessons', 'figures/gaiden'];
const files = dirs.filter(existsSync).flatMap((d) => readdirSync(d).filter((f) => f.endsWith('.svg')).map((f) => join(d, f).replace(/\\/g, '/')));
const idsSeen = new Map();

for (const f of files) {
  const s = readFileSync(f, 'utf-8');
  const name = f.split('/').pop().replace('.svg', '');
  const err = (m) => errors.push(`${f}: ${m}`);
  if (!/^\s*<svg\b/.test(s) || !/<\/svg>\s*$/.test(s)) err('<svg> で始まり </svg> で終わっていない');
  if (!/viewBox="0 0 560 \d+"/.test(s)) err('viewBox が "0 0 560 H" でない');
  const h = Number((s.match(/viewBox="0 0 560 (\d+)"/) ?? [])[1]);
  if (/image$/.test(name) && h !== 315) err('イラストの viewBox 高さが315でない');
  if (/diagram$/.test(name) && h > 700) err('図式の高さが700を超える');
  for (const bad of [/<script/i, /<foreignObject/i, /xlink:href/i, /\bhref=/i, /<image\b/i, /@import/i, /url\(\s*['"]?https?:/i, /<\?xml/i]) if (bad.test(s)) err(`禁止: ${bad}`);
  if (!/role="img"/.test(s) || !/<title\b/.test(s) || !/<desc\b/.test(s) || !/aria-labelledby=/.test(s)) err('role/aria-labelledby/title/desc がない');
  const ids = [...s.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of ids) { if (idsSeen.has(id)) err(`id「${id}」が ${idsSeen.get(id)} と重複`); idsSeen.set(id, f); }
  const label = s.match(/aria-labelledby="([^"]+)"/)?.[1].split(/\s+/) ?? [];
  for (const l of label) if (!ids.includes(l)) err(`aria-labelledby の ${l} に対応する id がない`);
  const nn = name.replace(/-(image|diagram)$/, '').replace(/^/, '');
  const cls = [...s.matchAll(/\.(fig-[\w-]+)/g)].map((m) => m[1]);
  const want = (/gaiden/.test(f) ? 'fig-g' : 'fig-l') + nn + (name.endsWith('image') ? 'i' : 'd');
  if (!/class="fig-/.test(s) || !s.includes(`class="${want}"`)) err(`ルート <svg> に class="${want}" がない`);
  if (cls.some((c) => c !== want)) err(`クラス名が ${want} で始まっていない`);
  // 色：固定色は var() のフォールバックの中だけ
  const stripped = s.replace(/var\(--[\w-]+,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(OK)');
  if (/#[0-9a-fA-F]{3,8}\b/.test(stripped.replace(/&#\d+;/g, ''))) err('var() の外に固定色がある');
  // 文字：1行28字以内、12px以上
  for (const m of s.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)) {
    const t = m[1].replace(/<[^>]+>/g, '').trim();
    if ([...t].length > 28) err(`文字が28字を超える: 「${t.slice(0, 20)}…」(${[...t].length}字)`);
  }
  for (const m of s.matchAll(/font:\s*\d+\s+(\d+(?:\.\d+)?)px/g)) if (Number(m[1]) < 12) err(`12px未満のフォント: ${m[1]}px`);
  // text 要素のはみ出し（x + 概算幅 が 548 を超える）
  for (const m of s.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    const x = Number((m[1].match(/\bx="(-?[\d.]+)"/) ?? [])[1] ?? NaN);
    const anchor = (m[1].match(/text-anchor="(\w+)"/) ?? [])[1];
    const t = m[2].replace(/<[^>]+>/g, '').trim();
    if (Number.isNaN(x) || anchor === 'middle' || anchor === 'end') continue;
    const w = [...t].reduce((a, c) => a + (c.charCodeAt(0) > 255 ? 1 : 0.55), 0) * 15;
    if (x + w > 552) err(`右にはみ出す恐れ: 「${t.slice(0, 16)}…」 x=${x} 概算幅=${Math.round(w)}`);
  }
}
errors.forEach((e) => console.error('エラー ' + e));
console.log(`${files.length}ファイル、${errors.length}件のエラー`);
process.exit(errors.length ? 1 : 0);
