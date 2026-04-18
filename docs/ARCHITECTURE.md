# ARCHITECTURE.md — 設計決定の背景

> 対象読者: 人間の開発者  
> 「なぜこうなっているか」を記録する文書。「何をすべきか」は [`CLAUDE.md`](../CLAUDE.md) を参照。

---

## コンセプト

**ナラティブ（語り）→ 構造的知識（グラフ）への昇華**

人間が自然言語で語る思考や経験を、TypeDB のセマンティクス（Entity / Relation / Attribute / Role）に基づく知識グラフとして外在化するツール。「書き留める」のではなく「考える構造そのものを作る」。

---

## 技術選定の理由

### Tauri（not Electron）

Electron はランタイムに Chromium + Node.js を丸ごとバンドルするため、インストールサイズが 100MB を超える。Tauri はシステムの WebView を利用するため数 MB に収まる。「思考を邪魔しないツール」には軽量さが必要という判断。

Rust バックエンドは現時点では最小限（`greet` コマンドのみ）。将来的に TypeDB への接続や重い処理をバックエンドに移すための布石として保持している。

### Zustand（not Redux / Jotai）

React Flow との統合において、Zustand の `useStore` で個別セレクターを使う形が最もシンプルに無限ループを回避できる（→ CLAUDE.md の State セクション参照）。Redux は過剰、Jotai はアトムの粒度管理が React Flow と相性が悪かった。

### shadcn/ui（not MUI / Chakra）

コピーペーストベースのコンポーネントライブラリ。依存をアプリ側に取り込む設計なので、Tailwind CSS 4 との統合が素直。デザイントークンの制御が完全に手元にある。

### TypeDB セマンティクスを型システムに反映

```typescript
type TypeDBMetaType = "entity" | "relation" | "attribute";
```

グラフのノードが TypeDB の概念と 1:1 で対応するよう型を設計している。これにより `generateTypeQL()` が型安全に TypeQL を生成できる。`any` を使わないことがこの設計の守り方。

---

## 4パネルレイアウトの設計意図

```
┌────────────────────────────────────────────────────────┐
│ AppHeader（ファイル名・Save・Save As ボタン）            │
├──────────────┬─────────────────────────┬───────────────┤
│              │                         │               │
│  Narration   │      GraphCanvas        │   Sidebar     │
│  （語り入力） │      （知識グラフ）      │  （Inspector） │
│              ├─────────────────────────┤               │
│              │     LLMAssistant        │               │
└──────────────┴─────────────────────────┴───────────────┘
```

- **ヘッダー（AppHeader）**: ファイル名表示・Save（上書き）・Save As（別名保存）
- **左（Narration）**: 原材料。ユーザーの思考の原文
- **中央上（GraphCanvas）**: 生成物。構造化された知識
- **中央下（LLMAssistant）**: 変換器。語りからグラフへの橋渡し
- **右（Sidebar）**: 精錬器。選択中ノードの詳細編集

この配置は「左から右へ、原材料が構造に変換される」という認知的な流れを体現している。

---

## 状態管理の設計

`narration`（テキスト）をグローバルストアに置いた理由：

```
NarrationPanel ──→ store.narration ←── LLMAssistant
（書き込み）                              （参照）
```

LLM に命令を送る際、「現在のナラティブ」をコンテキストとして渡す必要がある。`NarrationPanel` と `LLMAssistant` は異なるパネルに存在するため、props バケツリレーではなくストアを経由する。

`selectedNode` だけがローカル state（`App.tsx` の `useState`）なのは、グラフのグローバル状態とは独立した「UIの一時的な選択状態」だから。Zustand に入れると React Flow の再レンダリングと干渉するリスクがある。

---

## データ永続化の設計

### localStorage の役割（作業バッファ）

Zustand の `persist` ミドルウェアにより、編集中のスキーマ（nodes / edges / narration）は `visual-thinkering-graph` キーへ自動的に書き込まれる。これはクラッシュ時の復元を含む「作業バッファ」として機能する。

### ファイル保存・読み込みのフロー

```
アプリ起動
    ↓
localStorage に vt-save-path があるか？
    ├─ Yes → そのパスの JSON を readTextFile → ストアに展開
    └─ No  → resolveResource('resources/default.json') → ストアに展開

編集中
    → persist により localStorage へ自動同期（作業バッファ）

保存（Ctrl+S / Save ボタン）
    ├─ vt-save-path あり → writeTextFile で上書き
    └─ vt-save-path なし → save ダイアログ → パス記憶 → writeTextFile

名前をつけて保存（Save As ボタン）
    → 常に save ダイアログを開く
    → プロジェクト名に連番サフィックスを付与（"HR管理 001" など）
    → 新パスを vt-save-path に上書き記憶
    → store.projectName をコピー名に更新
```

### ファイルフォーマット（JSON）

```json
{
  "version": 1,
  "savedAt": "ISO8601",
  "name": "プロジェクト名",
  "description": "説明文",
  "nodes": [...],
  "edges": [...],
  "narration": "..."
}
```

localStorage の `persist` フォーマット（`{ state: {...}, version: N }`）とは意図的に分離している。前者はファイル交換用、後者は Zustand の内部キャッシュ用。

`name` / `description` は後から追加されたフィールドのため、旧ファイルには存在しない場合がある。`useFileLoad` 側でファイル名をフォールバック値として使う後方互換処理が入っている。

### Save As のコピー名ロジック（src/lib/copyName.ts）

```
nextCopyName("HR管理", ["HR管理 001", "HR管理 002"]) → "HR管理 003"
```

`recentProjectsStore` の `name` 一覧を走査して最大番号を検出し、+1 した3桁ゼロ埋め番号をサフィックスとして付与する純粋関数。一覧上でコピー元と区別できるようにする目的。

### localStorage キー一覧

| キー                      | 内容                                     |
| ------------------------- | ---------------------------------------- |
| `visual-thinkering-graph` | nodes / edges / narration の作業バッファ |
| `vt-save-path`            | 最後に保存したファイルの絶対パス         |
| `vt-recent-projects`      | 最近開いたファイルの履歴（最大10件）     |

### resources/default.json

`src-tauri/resources/default.json` としてアプリに同梱するサンプル兼初期データ。`tauri.conf.json` の `bundle.resources` に登録することでビルド時にバンドルされる。`vt-save-path` が未設定の初回起動時に読み込まれる。

### 将来の拡張（未実装）

- **デフォルト保存先**: dev/build 環境を切り替えつつ `appDataDir` または `documentDir` を自動選択する仕組み（現在はダイアログのみ）

---

## TypeQL 生成の現状と課題

`generateTypeQL(nodes, edges)` は現在シンプルな文字列生成のみ。

**現状の制約:**

- `isAbstract` フラグを使った抽象型定義が未実装
- 循環参照（Relation が別の Relation に relates する）の検出がない
- TypeQL の構文バリデーションなし

これらは `docs/specs/` にスペックを書いて順次実装する。

---

## 将来のロードマップ

詳細なスペックは `docs/specs/` に個別ファイルで管理する。

- `docs/specs/llm-integration.md` — ナラティブからノード自動抽出
- `docs/specs/typedb-connection.md` — TypeDB サーバーへの直接接続
- `docs/specs/schema-validation.md` — TypeQL 整合性チェック

---

## 未決定事項（保留）

### スキーマグラフとデータグラフの分離

**背景:** TypeDB は「スキーマ（型の定義）」と「データ（実際のインスタンス）」の2層構造を持つ。

```
スキーマ: Person sub entity, owns name;
データ:   $p isa Person, has name "田中太郎";
```

visual-thinkering は現在スキーマ設計に特化しているが、将来的にデータ入力・可視化も扱うかどうかが未決定。

**現時点の方針:** visual-thinkering は「ナラティブ → TypeQL スキーマ設計」という独自の価値に集中し、TypeDB Studio との分業を前提とする方向で検討中。
