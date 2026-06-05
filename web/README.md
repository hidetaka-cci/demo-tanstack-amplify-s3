# web

TanStack Router + Vite の SPA フロントエンド。CircleCI から S3 経由で Amplify Hosting にデプロイする。

## 前提

- Node.js 22+
- [pnpm](https://pnpm.io/)（`package.json` の `packageManager` フィールドでバージョン固定）

```bash
corepack enable
```

## ローカル開発

```bash
pnpm install
pnpm run dev
```

`http://localhost:3000` で起動する。

## ビルド・テスト・Lint

```bash
pnpm run build    # 本番ビルド（出力: dist/）
pnpm run preview  # ビルド成果物のプレビュー
pnpm run test     # Vitest
pnpm run lint     # Biome lint
pnpm run format   # Biome format
pnpm run check    # Biome check（lint + format）
```

## ルーティング

[TanStack Router](https://tanstack.com/router) のファイルベースルーティングを使用する。ルートは `src/routes/` に配置する。

- `src/routes/__root.tsx` — ルートレイアウト
- `src/routes/index.tsx` — `/`

新しいページを追加するには `src/routes/` にファイルを追加する。

## デプロイ

インフラのセットアップ（Amplify / CDK / CircleCI）はリポジトリルートの [README.md](../README.md) と [cdk/README.md](../cdk/README.md) を参照。

タグ `v*` を push すると CircleCI の deploy workflow が起動する。

```bash
git tag v1.0.0
git push origin v1.0.0
```

## スタック

- [TanStack Router](https://tanstack.com/router) — ルーティング
- [Vite](https://vite.dev/) — ビルド
- [Tailwind CSS](https://tailwindcss.com/) — スタイリング
- [Biome](https://biomejs.dev/) — Lint / Format
- [Vitest](https://vitest.dev/) — テスト
