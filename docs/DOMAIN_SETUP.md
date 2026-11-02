# 公開URLの設定：lesson.liquid-block.com

サイトのアドレスは `https://lesson.liquid-block.com/`。`public/CNAME` と `astro.config.mjs` に設定済み。

## 手順
1. GitHubにこのリポジトリを作って push する（ブランチは main）
2. リポジトリの Settings → Pages → Source を「GitHub Actions」にする
3. Wixのドメイン管理（liquid-block.com → DNS設定）で、CNAMEレコードを1行足す
   - ホスト名：`lesson`
   - 値：`hideyoshi-cyber.github.io`
   - 既存のレコード（会社サイト、メール）は触らない
4. GitHub Pages の Custom domain に `lesson.liquid-block.com` を入れる。DNSの反映後（数分〜数時間）に「Enforce HTTPS」をオンにする
5. 動作確認後、会社のWixサイトから `https://lesson.liquid-block.com/` へのリンクを足す（任意）

## 注意
- 公開前の確認事項（CLAUDE.md「公開と運用の方針」）：教材を会社のサイトで公開してよいか、学校との契約の確認が未決
- Amazonアソシエイトには、公開後にこのURLを登録する
