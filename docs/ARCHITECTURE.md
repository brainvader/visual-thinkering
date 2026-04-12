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
┌──────────────┬─────────────────────────┬──────────────┐
│              │                         │              │
│  Narration   │      GraphCanvas        │   Sidebar    │
│  （語り入力） │      （知識グラフ）      │  （Inspector）│
│              ├─────────────────────────┤              │
│              │     LLMAssistant        │              │
└──────────────┴─────────────────────────┴──────────────┘
```

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

## TypeQL 生成の現状と課題

`generateTypeQL(nodes, edges)` は現在シンプルな文字列生成のみ。

**現状の制約:**

- `isAbstract` フラグを使った抽象型定義が未実装
- Attribute の `owns` 定義が未実装
- 循環参照（Relation が別の Relation に relates する）の検出がない
- TypeQL の構文バリデーションなし

これらは `docs/specs/` にスペックを書いて順次実装する。

---

## 将来のロードマップ

詳細なスペックは `docs/specs/` に個別ファイルで管理する。

- `docs/specs/llm-integration.md` — ナラティブからノード自動抽出
- `docs/specs/typeql-export.md` — TypeQL ファイルへのエクスポート
- `docs/specs/typedb-connection.md` — TypeDB サーバーへの直接接続
- `docs/specs/schema-validation.md` — TypeQL 整合性チェック
