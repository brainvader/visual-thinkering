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
| State    | Zustand 5 + persist middleware        |
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
├── main.tsx                   # エントリーポイント・MemoryRouter・<Toaster /> 配置
├── App.tsx                    # エディタ本体：4パネルレイアウト・selectedNode/selectedEdge 管理
├── App.css                    # グローバルスタイル
├── store.ts                   # Zustand + persist（localStorage・作業バッファ）
├── types/index.ts             # TypeDB 型定義
├── vite-env.d.ts
├── pages/
│   ├── ProjectListPage.tsx    # プロジェクト一覧画面（path="/"）
│   └── EditorPage.tsx         # エディタ画面ラッパー（path="/editor"）
├── components/
│   ├── AppHeader.tsx          # ヘッダーバー：ファイル名・Save・Save As・一覧へ戻るボタン
│   ├── GraphCanvas.tsx        # React Flow キャンバス・カスタムコンテキストメニュー
│   ├── Sidebar.tsx            # Inspector/TypeQL の2タブ構成
│   ├── TypeQLPanel.tsx        # TypeQL 出力・シンタックスハイライト・Copy・警告
│   ├── NarrationPanel.tsx     # ナラティブ入力
│   ├── LLMAssistant.tsx       # LLM 命令インターフェース
│   ├── UnsavedDialog.tsx      # 未保存確認ダイアログ（3ボタン）
│   ├── ProjectCard.tsx        # 最近開いたプロジェクトのカード
│   ├── NewProjectDialog.tsx   # 新規プロジェクト作成ダイアログ
│   ├── nodes/                 # カスタムノード
│   │   ├── EntityNode.tsx     # 角丸矩形・青系
│   │   ├── RelationNode.tsx   # SVGひし形・緑系
│   │   ├── AttributeNode.tsx  # 楕円・橙系
│   │   └── index.ts           # nodeTypes export
│   ├── edges/
│   │   ├── RoleEdge.tsx       # カスタムエッジ
│   │   └── index.ts           # edgeTypes export
│   └── ui/                    # shadcn/ui プリミティブ
├── hooks/
│   ├── useFileSave.ts         # ファイル保存（addRecent()連携・name/description書き込み）
│   ├── useFileLoad.ts         # ファイル読み込み（open()追加・addRecent()連携）
│   ├── useCloseGuard.ts       # アプリ終了時の未保存確認（onCloseRequested 連携）
│   └── useOwnershipBounds.ts  # owns 関係のバウンディングボックス計算
├── store/
│   └── recentProjectsStore.ts # 最近開いたプロジェクト履歴（persist・最大10件）
├── lib/
│   ├── typeql.ts              # グラフ → TypeQL 変換
│   ├── connectionRules.ts     # TypeDB 接続制限（isValidTypeDBConnection）
│   └── utils.ts               # cn() ユーティリティ
└── test/setup.ts              # ResizeObserver class モック
```

## Architecture

### Layout (App.tsx) — ヘッダー + 4パネル構成

```
┌────────────────────────────────────────────────────────┐
│ AppHeader（ファイル名・保存ボタン）                     │
├──────────────┬─────────────────────────┬───────────────┤
│              │                         │               │
│  Narration   │      GraphCanvas        │   Sidebar     │
│  （語り入力） │      （知識グラフ）      │  （Inspector） │
│              ├─────────────────────────┤               │
│              │     LLMAssistant        │               │
└──────────────┴─────────────────────────┴───────────────┘
```

| Panel  | Size | Component                              |
| ------ | ---- | -------------------------------------- |
| Header | 40px | AppHeader                              |
| Left   | 20%  | NarrationPanel                         |
| Center | 60%  | GraphCanvas (75%) + LLMAssistant (25%) |
| Right  | 20%  | Sidebar                                |

**selectedNode / selectedEdge** は `App.tsx` の `useState` で管理（store に入れると React Flow の再レンダリングと干渉）。

## Data Persistence

### 2層構造

| 層           | 仕組み                                        | 役割                           |
| ------------ | --------------------------------------------- | ------------------------------ |
| 作業バッファ | Zustand `persist` → `visual-thinkering-graph` | 編集中の自動保存               |
| ファイル保存 | Tauri `fs` → JSON ファイル                    | 明示的な保存・プロジェクト共有 |

### 起動時フロー（useFileLoad）

```
localStorage に vt-save-path あり → そのファイルを読み込む
なし → resolveResource('resources/default.json') を読み込む
失敗 → ストアの既存状態を保持
```

### 保存フロー（useFileSave）

```
vt-save-path あり → 上書き保存 → toast.success
なし → ダイアログ → パスを vt-save-path に記憶 → 保存 → toast.success
失敗 → toast.error
```

### localStorage キー

| キー                      | 内容                                     |
| ------------------------- | ---------------------------------------- |
| `visual-thinkering-graph` | nodes / edges / narration の作業バッファ |
| `vt-save-path`            | 最後に保存したファイルの絶対パス         |

### ファイルフォーマット

```json
{
  "version": 1,
  "savedAt": "ISO8601",
  "nodes": [...],
  "edges": [...],
  "narration": "..."
}
```

### Tauri パーミッション（capabilities/default.json）

```json
"fs:allow-write-text-file", "fs:allow-read-text-file",
"fs:scope-app-recursive", "fs:scope-home-recursive",
"dialog:allow-save"
```

### isDirty フラグ

編集操作で `true`、保存・読み込み成功で `false` にリセットされる。`partialize` の対象外（localStorage に保存されない）。

| アクション                               | 効果                             |
| ---------------------------------------- | -------------------------------- |
| nodes/edges/narration の全変更アクション | `markDirty()` → `isDirty: true`  |
| `useFileSave.save()` 成功時              | `markClean()` → `isDirty: false` |
| `useFileLoad.load()` 完了時              | `markClean()` → `isDirty: false` |

`useCloseGuard` が `isDirty=true` のとき `onCloseRequested` を止め、`UnsavedDialog` を表示する。

## State

```typescript
interface TypeDBNodeData {
  label: string;
  typeDBType: TypeDBMetaType;
  isAbstract: boolean;
  valueType?: AttributeValueType;
  [key: string]: unknown;
}

// エッジの種別: role（owns/plays）または sub（継承）
type TypeDBEdgeType = "role" | "sub";

interface TypeDBEdgeData {
  role: string;
  edgeType?: TypeDBEdgeType; // 未設定時は 'role' として扱う
  isKey?: boolean;
  [key: string]: unknown;
}
```

**NodeProps の型引数:** `NodeProps<Node<TypeDBNodeData>>`（`Node` は `@xyflow/react` の `Node` を `FlowNode` として alias）

### TypeQL 生成（lib/typeql.ts）

`generateTypeQL(nodes, edges, options?)` でグラフから TypeQL を生成する。

- **出力順**: Attribute → Entity → Relation（依存関係の解決）
- **overload**: `{ includeWarnings: true }` を渡すと `{ typeql, warnings }` を返す
- **警告対象**: ロール名未設定エッジ、TypeQL キーワードと同名のロール名

### GraphCanvas の fitView

localStorage 復元後は `useNodesInitialized()` でノード測定完了を検知してから `fitView()` を実行する。`fitView` prop では復元直後のサイズ未計測状態で実行されるため機能しない。

各ノードの Handle パターン（上下左右 × source/target の8ソケット）:

```tsx
<Handle type="target" position={Position.Top}    id="top-target" />
<Handle type="source" position={Position.Top}    id="top-source" />
// ... 同様に Bottom / Left / Right
```

**RelationNode のみ SVG ひし形を使用。** 他は div ベース。

### GraphCanvas の主要設定

```tsx
<ReactFlow
  nodeTypes={nodeTypes} // モジュールレベル定数（再生成禁止）
  connectionMode={ConnectionMode.Loose}
  isValidConnection={(c) => isValidTypeDBConnection(c, nodes)}
  fitView
  fitViewOptions={{ padding: 0.5 }}
/>
```

**コンテキストメニュー:** Radix UI ContextMenu を廃止。カスタムポップアップ（`onNodeContextMenu` / `onPaneContextMenu` / `onEdgeContextMenu`）で実装。

## TypeDB セマンティクス（更新）

既存テーブルを以下に置き換え:

| エッジ方向                 | `edgeType` | 意味                         |
| -------------------------- | ---------- | ---------------------------- |
| Entity → Relation          | `role`     | plays（ロール名必須）        |
| Entity → Attribute         | `role`     | owns                         |
| Relation → Attribute       | `role`     | owns                         |
| Relation → Relation        | `role`     | nested relation / または sub |
| Entity → Entity            | `sub`      | 継承（B sub A）              |
| Relation → Relation (同)   | `sub`      | 継承（B sub A）              |
| Attribute → Attribute      | `sub`      | 継承（B sub A）              |
| Attribute → \*（上記以外） | —          | ❌ 禁止                      |

> `sub` エッジは **接続時に同 `typeDBType` を自動判定** して付与される。

## Conventions

- **Path alias**: `@/` → `./src/`
- **Comments**: コード内コメントは日本語で実装意図を記述
- **shadcn/ui**: style=`radix-nova`, icons=`lucide`, color=`neutral`
- **Rust**: 変更最小限。ロジックは React フロントエンドに置く
- **nodeTypes / edgeTypes**: 必ずモジュールレベルで定義（コンポーネント内で定義すると再レンダリングで無効化される）
- **Tauri API モック**: テストでは `vi.mock('@tauri-apps/plugin-fs', ...)` 等で差し替える
- **vi.mock ホイスティング**: ファクトリ内でモジュールスコープの変数を参照できない。戻り値は `beforeEach` で `vi.mocked().mockResolvedValue()` により設定する

## Testing Policy

詳細: [`docs/TESTING.md`](docs/TESTING.md)

- **新機能**: failed test → 実装（Red → Green）
- **バグ修正**: 再現テスト（failed）を先に書いてから修正
- **テストファイル**: ソースと同階層に配置
- **Handle モック**: ノードテストでは `vi.mock('@xyflow/react', ...)` で `Handle: () => null` に差し替え
- **ResizeObserver モック**: `setup.ts` で class 構文で定義（`vi.fn()` では `new` できない）

## ⚠️ やってはいけないこと

- `useStore()` でストア全体を購読しない（無限ループ）
- `nodeTypes` / `edgeTypes` をコンポーネント内で定義しない（React Flow が無視する）
- `selectedNode` を store に入れない（React Flow の再レンダリングと干渉）
- ノード全体を Handle に置き換える実装（Easy Connect）は RelationNode の SVG と干渉するため保留
- `vi.mock` ファクトリ内でモジュールスコープの変数を参照しない（ホイスティングにより未初期化エラー）
- `tauri.conf.json` に `closeRequestedEvent` を追加しない（Tauri 2 では不要・エラーになる）
- `getCurrentWindow().close()` には `core:window:allow-destroy` パーミッションが必要
- `connectionRules.ts` で `Entity→Entity` を無条件に禁止しない（`sub` エッジとして許可されるため）

## Specs

実装状況: [`docs/STATUS.md`](docs/STATUS.md)
機能仕様: [`docs/specs/`](docs/specs/)

スペックを読んで「failed test を書き、それを通す実装を書く」フローで開発する。
