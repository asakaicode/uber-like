# Uber-like

Uber Eats 風フードデリバリーアプリ（モノレポ）。

## 構成

| App | Port | 説明 |
|-----|------|------|
| `apps/user` | 3000 | ユーザーアプリ |
| `apps/restaurant` | 3001 | 店舗アプリ |
| `apps/driver` | 3002 | ドライバーアプリ |
| `apps/api` | 4000 | GraphQL API |
| `services/dispatcher` | — | 配車ワーカー |
| `services/ortools-matcher` | 5001 | OR-Tools 最適化（Python） |

## Docker で起動（推奨）

すべてのアプリを Docker Compose で一括起動できます。

```bash
# 全サービスをビルド & 起動（DB マイグレーション + seed も自動実行）
pnpm docker:up

# ログ確認
pnpm docker:logs

# 停止
pnpm docker:down
```

起動後のアクセス先:

| サービス | URL |
|----------|-----|
| ユーザーアプリ | http://localhost:3000 |
| 店舗アプリ | http://localhost:3001 |
| ドライバーアプリ | http://localhost:3002 |
| GraphQL API | http://localhost:4000/graphql |

Docker Compose 構成:

```
postgres / redis
    ↓
  migrate (db push + seed, 1回実行)
    ↓
  api / dispatcher
    ↓
  user / restaurant / driver (nginx)
```

オプションサービス:

```bash
# ローカル OSRM（事前に scripts/setup-osrm.sh を実行）
docker compose --profile osrm up -d osrm

# OR-Tools マッチャー
docker compose --profile ortools up -d ortools-matcher
```

## ローカル開発

```bash
pnpm install
cp .env.example .env

docker compose up -d postgres redis
pnpm db:push && pnpm db:seed

pnpm --filter @uber-like/api dev
pnpm --filter @uber-like/dispatcher dev
pnpm dev
```

## テストアカウント

| ロール | Email | Password |
|--------|-------|----------|
| ユーザー | customer@example.com | password123 |
| 店舗 | restaurant1@example.com | password123 |
| ドライバー | driver1@example.com | password123 |

## OSRM（ルーティング）

開発初期は公開 OSRM デモ (`router.project-osrm.org`) をフォールバックとして利用します。

ローカル OSRM を使う場合:

```bash
chmod +x scripts/setup-osrm.sh
./scripts/setup-osrm.sh
docker compose --profile osrm up -d osrm
```

## ディレクトリ構成

```
apps/
  api/          GraphQL API（resolvers/auth|order|delivery|subscription）
  user/         ユーザー SPA
  restaurant/   店舗 SPA
  driver/       ドライバー SPA（hooks/ + components/ に分割済み）
packages/
  database/     Prisma クライアント・スキーマ
  geo/          OSRM ルーティング共通ライブラリ（@uber-like/geo）
  shared/       共有 enum・定数（isomorphic）
  web/          フロント共通ユーティリティ（gql/useSubscription/LoginForm 等）
services/
  dispatcher/   配車ワーカー（BullMQ + OR-Tools）
  ortools-matcher/  OR-Tools 最適化（Python）
```

## GraphQL コード生成

スキーマ変更やクエリ追加後は codegen を再実行:

```bash
pnpm codegen
```

生成ファイル:
- `apps/api/src/generated/resolver-types.ts` — サーバーリゾルバー型
- `packages/web/src/gql/` — フロント用 TypedDocumentNode + 型定義

## 技術スタック

- **Frontend**: React, TanStack Router/Query, Vite, Leaflet (OSM), nginx (Docker)
- **Backend**: Node.js, GraphQL Yoga, Prisma, PostgreSQL, Redis, BullMQ
- **Codegen**: @graphql-codegen/cli（client-preset + typescript-resolvers）
- **Infra**: Docker Compose
