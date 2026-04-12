# CLAUDE.md — Visual Thinkering

> AIが毎回読む憲法。簡潔・高密度に保つこと。詳細は `docs/` を参照。

## Project

TypeDB スキーマをビジュアルに設計するデスクトップアプリ。React Flow キャンバスで Entity / Relation / Attribute を操作し、TypeQL スキーマ定義を生成する。LLM によるナラティブからの自動抽出を計画中。

## Tech Stack

| Layer    | Technology                            |
| -------- | ------------------------------------- |
| Frontend | React 19 + TypeScript 5.8 + Vite 7    |
| Desktop  | Tauri 2.x (Rust)                      |
| Graph    | @xyflow/react 12                      |
| State    | Zustand 5                             |
| UI       | shadcn/ui (Radix UI + Tailwind CSS 4) |
| Testing  | Vitest 4 + React Testing Library      |
| Pkg Mgr  | pnpm                                  |

## Commands

```bash
pnpm tauri dev    # 開発（ホットリロード）
pnpm build        # tsc + Vite ビルド
pnpm tauri build  # デスクトップアプリパッケージ
pnpm test         # Vitest (jsdom)
pnpm dlx shadcn@latest add <component>  # shadcn コンポーネント追加
```

## Directory Structure

```
src/
├── main.tsx              # エントリーポイント
├── App.tsx               # ルート：4パネルレイアウト
├── store.ts              # Zustand（nodes, edges, narration）
├── types/index.ts        # TypeDB 型定義
├── components/
│   ├── GraphCanvas.tsx   # React Flow キャンバス
│   ├── Sidebar.tsx       # ノードインスペクター
│   ├── NarrationPanel.tsx # ナラティブ入力
│   ├── LLMAssistant.tsx  # LLM 命令インターフェース
│   └── ui/               # shadcn/ui プリミティブ
├── lib/
│   ├── typeql.ts         # グラフ → TypeQL 変換
│   └── utils.ts          # cn() ユーティリティ
└── test/setup.ts         # ResizeObserver モック
docs/
├── ARCHITECTURE.md       # 設計決定の背景（→ 詳細はこちら）
├── TESTING.md            # テスト戦略（→ 詳細はこちら）
└── specs/                # 未実装機能のスペック（AIへの指示起点）
```

## Architecture

### Layout (App.tsx) — 4パネル構成

| Panel  | Size | Component                              |
| ------ | ---- | -------------------------------------- |
| Left   | 20%  | NarrationPanel                         |
| Center | 60%  | GraphCanvas (75%) + LLMAssistant (25%) |
| Right  | 20%  | Sidebar                                |

### State (store.ts)

**必ず個別セレクターで購読すること（無限ループ防止）:**

```typescript
// ✅ Good
const nodes = useStore((s) => s.nodes);

// ❌ Bad — React Flow と組み合わせると無限再レンダー
const store = useStore();
```

Store API: `nodes`, `edges`, `narration`, `onNodesChange`, `onEdgesChange`, `onConnect`, `setNodes`, `setNarration`, `deleteNode`

### Type System

```typescript
type TypeDBMetaType = "entity" | "relation" | "attribute";

interface TypeDBNodeData {
  label: string;
  typeDBType: TypeDBMetaType;
  isAbstract?: boolean;
  [key: string]: unknown; // React Flow の Record<string, unknown> 要件
}

interface TypeDBEdgeData {
  role: string;
  isKey?: boolean;
  [key: string]: unknown;
}
```

## Conventions

- **Path alias**: `@/` → `./src/`（すべての import で使用）
- **Comments**: コード内コメントは日本語で実装意図を記述
- **shadcn/ui**: style=`radix-nova`, icons=`lucide`, color=`neutral`
- **Rust**: 変更最小限。ロジックは React フロントエンドに置く
- **CSP**: `null`（開発柔軟性のため意図的に無効化）

## Testing Policy

詳細: [`docs/TESTING.md`](docs/TESTING.md)

- **新機能**: failed test → 実装（Red → Green）
- **バグ修正**: 再現テスト（failed）を先に書いてから修正
- **リファクタリング**: 先にテストで振る舞いを固める
- **テストファイル**: ソースと同階層に配置（例: `App.test.tsx`）

## Specs

未実装機能のスペックは [`docs/specs/`](docs/specs/) に置く。  
スペックを読んで「failed test を書き、それを通す実装を書く」フローで開発する。
