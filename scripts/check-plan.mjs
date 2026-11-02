// plan.yaml と各Markdownの対応チェック。エラーがあれば exit 1、警告は表示のみ。
import { readFileSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const plan = parse(readFileSync('curriculum/plan.yaml', 'utf-8'));
const errors = [];
const warns = [];
const squash = (s) => String(s).replace(/[\s『』「」]/g, '');

const split = (path) => {
  const t = readFileSync(path, 'utf-8');
  const m = t.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  return m ? { meta: parse(m[1]), body: m[2] } : { meta: null, body: t };
};

plan.lessons.forEach((l, i) => {
  const n = l.no;
  if (n !== i + 1) errors.push(`回番号が連番でない: ${n}`);
  if (!existsSync(l.file)) return errors.push(`第${n}回: ${l.file} がない`);
  const { meta, body } = split(l.file);
  if (!meta) return errors.push(`第${n}回: front matter がない`);
  for (const k of ['no', 'title', 'term', 'era']) if (meta[k] !== l[k]) errors.push(`第${n}回: ${k} が plan と不一致`);
  if (JSON.stringify(meta.labels) !== JSON.stringify(l.labels)) errors.push(`第${n}回: labels が plan と不一致`);
  if (body.match(/^# (.+)$/m)?.[1].trim() !== l.title) errors.push(`第${n}回: H1 が plan.title と不一致`);
  for (const need of ['授業の進め方', 'この回の演習', 'この記事の結論']) if (!body.includes(need)) errors.push(`第${n}回: 「${need}」がない`);

  const claim = /公開情報で確認しました/.test(body);
  if (/^verified/.test(l.fact_check) && !claim) warns.push(`第${n}回: fact_check=${l.fact_check} だが本文に「公開情報で確認しました」がない`);
  if (!/^verified/.test(l.fact_check) && claim) errors.push(`第${n}回: fact_check=${l.fact_check} なのに確認済みの文言がある`);

  const nx = plan.lessons[i + 1];
  if (nx) {
    const a = squash(l.next), b = squash(nx.theme.replace(/^.*?第\d+回\s*/, ''));
    if (!a.includes(b) && !b.includes(a)) warns.push(`第${n}回: 次回予告「${l.next}」と第${nx.no}回テーマ「${b}」の言い回しが違う`);
  }
});

for (const g of plan.gaiden) {
  if (!existsSync(g.file)) { errors.push(`外伝${g.no}: ${g.file} がない`); continue; }
  if (split(g.file).body.match(/^# (.+)$/m)?.[1].trim() !== g.title) errors.push(`外伝${g.no}: H1 が plan.title と不一致`);
}

warns.forEach((w) => console.warn('警告 ' + w));
errors.forEach((e) => console.error('エラー ' + e));
console.log(`\n${errors.length}件のエラー、${warns.length}件の警告`);
process.exit(errors.length ? 1 : 0);
