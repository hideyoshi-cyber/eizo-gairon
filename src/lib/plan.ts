import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { getCollection } from 'astro:content';

export interface Lesson {
  no: number; term: string; era: string; theme: string; title: string; works: string;
  homework: string; next: string; ladder_stage: string; labels: string[]; fact_check: string; file: string;
}
export interface Gaiden { no: number; title: string; file: string }

const plan = parse(readFileSync('curriculum/plan.yaml', 'utf-8'));
export const course = plan.course;
export const lessons: Lesson[] = plan.lessons;
export const gaiden: Gaiden[] = plan.gaiden;

export const pad = (n: number) => String(n).padStart(2, '0');
/** 4ブロック（1年前期=1 … 2年後期=4）。時代色はこの単位で付ける（era 文字列の揺れに依存しない） */
export const block = (no: number) => Math.min(4, Math.ceil(no / 15));
export const BLOCKS = [
  { n: 1, name: '2020年代', term: '1年前期', range: '第1〜15回', cls: 'e1' },
  { n: 2, name: '2010年代', term: '1年後期', range: '第16〜30回', cls: 'e2' },
  { n: 3, name: '2000年代', term: '2年前期', range: '第31〜45回', cls: 'e3' },
  { n: 4, name: '90年代と源流', term: '2年後期', range: '第46〜60回', cls: 'e4' },
];
/** 「第N回 …」の接頭辞を除いたテーマ名 */
export const themeName = (l: Lesson) => l.theme.replace(/^.*?第\d+回\s*/, '');

const pub = (e: { data: { visibility?: string } }) => e.data.visibility !== 'internal';
export const getPublic = async (name: 'lessons' | 'gaiden' | 'essays' | 'pages') =>
  (await getCollection(name)).filter(pub);
