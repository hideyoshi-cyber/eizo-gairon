// Markdownを書き換えずに、変換で崩れた書式をビルド時に整える remark プラグイン。
// 事実・主張の文面には触らない（リンク先の置換、囲みの付与、重複する見出し・ラベルの非表示のみ）。
import { readFileSync } from 'node:fs';
import { visit } from 'unist-util-visit';

const PAGE_ROUTES = {
  sheet: 'analysis-sheet', about: 'about', studios: 'studios', timeline: 'timeline',
  syllabus: 'syllabus', glossary: 'glossary', books: 'books', links: 'links',
};

export function resolveAnchor(hash, base) {
  const b = base.endsWith('/') ? base : base + '/';
  let m;
  if ((m = hash.match(/^lesson-(\d+)$/))) return `${b}lessons/${m[1].padStart(2, '0')}/`;
  if ((m = hash.match(/^gaiden-(\d+)$/))) return `${b}gaiden/${m[1].padStart(2, '0')}/`;
  if (hash === 'essay-01') return `${b}essays/01-seekbar/`;
  if (PAGE_ROUTES[hash]) return `${b}${PAGE_ROUTES[hash]}/`;
  return null;
}


/** 個別の動画URL（YouTube／Vimeo）だけを埋め込みURLにする。検索結果ページは埋め込めないので null */
export function embedUrl(url) {
  let m;
  if ((m = url.match(/^https:\/\/(?:www\.)?youtube\.com\/watch\?(?:[^#]*&)?v=([\w-]{11})/)) || (m = url.match(/^https:\/\/youtu\.be\/([\w-]{11})/))) {
    return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  }
  if ((m = url.match(/^https:\/\/vimeo\.com\/(\d+)(?:[/?#]|$)/))) return `https://player.vimeo.com/video/${m[1]}`;
  return null;
}

const text = (n) => (n.value ?? (n.children ?? []).map(text).join(''));

export function remarkEizo(opts = {}) {
  const base = opts.base ?? '/';
  const tag = process.env.AMAZON_TAG_ENABLED === '1' ? 'vjku-22' : null; // 先生が「サイトを登録した」と言うまでOFF
  return (tree, file) => {
    const fm = file.data?.astro?.frontmatter ?? {};

    // 1. サイト内アンカーを実URLへ／Amazonタグ（既定OFF）
    visit(tree, 'link', (node) => {
      if (node.url.startsWith('#')) {
        const r = resolveAnchor(node.url.slice(1), base);
        if (r) node.url = r;
      } else if (tag && /^https:\/\/www\.amazon\.co\.jp\//.test(node.url)) {
        const u = new URL(node.url); u.searchParams.set('tag', tag); node.url = u.toString();
      }
    });

    const kids = tree.children;

    // 2. 先頭の見出し重複を隠す（記事の見出し・種別行はレイアウト側で描く）
    const h1 = kids.findIndex((n) => n.type === 'heading' && n.depth === 1);
    if (h1 > 0 && kids.slice(0, h1).every((n) => n.type === 'paragraph')) kids.splice(0, h1);
    const h1b = kids.findIndex((n) => n.type === 'heading' && n.depth === 1);
    if (h1b === 0) kids.splice(0, 1);

    // 3. 末尾のラベル一覧（front matterのlabelsと同じもの）を隠す
    const last = kids[kids.length - 1];
    if (last?.type === 'list' && Array.isArray(fm.labels)) {
      const items = last.children.map((li) => text(li).trim());
      if (items.length === fm.labels.length && items.every((t, i) => t === String(fm.labels[i]))) kids.pop();
    }

    // 4. 「みんなの気づき」が未記入のプレースホルダだけなら、節ごと隠す
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (n.type === 'heading' && n.depth === 2 && text(n).trim() === 'みんなの気づき') {
        let j = i + 1;
        while (j < kids.length && !(kids[j].type === 'heading' && kids[j].depth <= 2)) j++;
        const body = kids.slice(i + 1, j);
        const lists = body.filter((x) => x.type === 'list');
        if (lists.length && lists.every((l) => l.children.every((li) => /^\[授業後に/.test(text(li).trim())))) {
          kids.splice(i, j - i); i--;
        }
      }
    }

    // 4b. 「今日観た作品／宿題／次回」を3列のボックスにまとめる
    {
      const isLabel = (n) => n.type === 'paragraph' && n.children[0]?.type === 'strong' && ['今日観た作品', '宿題', '次回'].includes(text(n.children[0]).trim());
      const a = kids.findIndex((n) => isLabel(n) && text(n.children[0]).trim() === '今日観た作品');
      const b = kids.findIndex((n, i) => i > a && n.type === 'paragraph' && n.children[0]?.type === 'strong' && text(n.children[0]).trim() === 'この記事の結論');
      if (a >= 0 && b > a) {
        const seg = kids.slice(a, b);
        const groups = [];
        for (const n of seg) { if (isLabel(n)) groups.push([]); groups[groups.length - 1].push(n); }
        const divs = groups.map((g) => ({ type: 'blockquote', children: g, data: { hName: 'div' } }));
        kids.splice(a, b - a, { type: 'blockquote', children: divs, data: { hName: 'aside', hProperties: { className: ['today'] } } });
      }
    }

    // 4c. 「（図：figures/xxx.svg）」＋次の行の「図N　説明」を、図（figure）にする
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (n.type !== 'paragraph') continue;
      const m = text(n).match(/^（図：(figures\/[\w.-]+\.svg)）\n?([\s\S]*)$/);
      if (!m) continue;
      let svg;
      try { svg = readFileSync(m[1], 'utf-8').replace(/<metadata>[\s\S]*?<\/metadata>/, ''); } catch { continue; }
      const cap = m[2].trim().replace(/&/g, '&amp;').replace(/</g, '&lt;');
      kids[i] = { type: 'html', value: `<figure class="fig-wrap">${svg}${cap ? `<figcaption class="src">${cap}</figcaption>` : ''}</figure>` };
    }

    // 5. 結論の囲み、演習の囲み
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (n.type !== 'paragraph') continue;
      const first = n.children[0];
      if (first?.type === 'strong') {
        const label = text(first).trim();
        if (label === 'この記事の結論') {
          kids[i] = { type: 'blockquote', children: [n], data: { hName: 'aside', hProperties: { className: ['callout', 'conclusion'] } } };
        } else if (label === 'この回の演習') {
          let j = i + 1;
          while (j < kids.length && kids[j].type !== 'heading') j++;
          const inner = kids.splice(i, j - i);
          kids.splice(i, 0, { type: 'blockquote', children: inner, data: { hName: 'aside', hProperties: { className: ['callout', 'exercise'] } } });
        }
      }
    }

    // 6. 参照動画／書棚のカード（「▶」リンク始まりの入れ子リスト）を整える
    visit(tree, 'list', (list) => {
      const cards = list.children.filter((li) => {
        const p = li.children?.[0];
        return p?.type === 'paragraph' && p.children?.[0]?.type === 'link' && /^▶$/.test(text(p.children[0]).trim());
      });
      if (cards.length) {
        list.data = { hProperties: { className: ['cards', 'video-cards'] } };
        for (const li of list.children) {
          const link = li.children?.[0]?.children?.[0];
          const h3 = li.children?.find((c) => c.type === 'heading');
          if (link && h3) {
            h3.children = [{ type: 'link', url: link.url, children: h3.children }];
            li.children.splice(0, 1);
            const src = embedUrl(link.url);
            if (src) {
              const title = text(h3).replace(/"/g, '&quot;');
              li.children.unshift({ type: 'html', value: `<div class="video-embed"><iframe src="${src}" title="${title}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>` });
            }
          }
          li.data = { hProperties: { className: ['card'] } };
        }
      } else if (list.children.length && list.children.every((li) => li.children?.some((c) => c.type === 'heading' && c.depth === 3))) {
        list.data = { hProperties: { className: ['cards'] } };
        for (const li of list.children) li.data = { hProperties: { className: ['card'] } };
      }
    });
  };
}
