# Spec: TypeQL 出力パネル

> ステータス: **Implemented**
> 対象ブランチ: `feat/typeql-panel`（予定）
> 関連ファイル:
>
> - `src/lib/typeql.ts`（既存・要修正）
> - `src/lib/typeql.test.ts`（既存・要追加）
> - `src/components/TypeQLPanel.tsx`（新規）
> - `src/App.tsx`（パネル配置）

---

## 概要

グラフキャンバスで構築したスキーマをリアルタイムに TypeQL として表示する。ユーザーはグラフを操作しながら生成される TypeQL を確認でき、クリップボードへのコピーも可能。

---

## 表示場所

現在の4パネルレイアウトの **右パネル下部** または **Sidebar 内のタブ** に配置する。

```
┌──────────────┬────────────────────┬─────────────────┐
│ Narration    │ GraphCanvas        │ Sidebar         │
│              │                    │  Inspector      │
│              ├────────────────────│  ─────────────  │
│              │ LLM Assistant      │  TypeQL         │
└──────────────┴────────────────────┴─────────────────┘
```

Sidebar を「Inspector」と「TypeQL」の2タブ構成にする。

---

## TypeQL 生成ロジックの修正

現在の `generateTypeQL` は不完全。以下を修正する。

### 現状の問題点

```typescript
// 問題1: define キーワードが各行に付く（TypeQL は1つの define ブロックにまとめる）
`define ${n.data.label} sub entity;`

// 問題2: owns（Attribute 所有）が生成されない
// Entity → Attribute エッジが無視されている

// 問題3: Attribute 型定義が生成されない
// name sub attribute, value string; のような定義がない

// 問題4: ロール名が空のエッジを relates に含めてしまう
const roles = edges.filter(...).map((e) => e.data?.role || 'unknown');
```

### 修正後の出力例

```typeql
define

  # Entity 定義
  Person sub entity,
    owns name,
    plays Employment:employee;

  Company sub entity,
    owns name,
    plays Employment:employer;

  # Relation 定義
  Employment sub relation,
    relates employee,
    relates employer,
    owns start-date;

  # Attribute 定義
  name sub attribute, value string;
  start-date sub attribute, value datetime;
```

### 生成ルール

| エッジ                         | 生成される TypeQL                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Entity → Relation（role あり） | `Entity plays Relation:role;` を Entity 定義に追加 + `relates role` を Relation 定義に追加 |
| Entity → Relation（role なし） | スキップ（警告マーカーを表示）                                                             |
| Entity → Attribute             | `Entity owns Attribute;` を Entity 定義に追加                                              |
| Relation → Attribute           | `Relation owns Attribute;` を Relation 定義に追加                                          |

### Attribute の value 型

現状 `TypeDBNodeData` に value 型フィールドがない。TypeQL 出力では `value string` をデフォルトとする（将来 Sidebar で編集できるようにする）。

---

## UI 仕様

### TypeQL パネルコンポーネント

```
┌─ TypeQL ──────────────────────────────── [Copy] ┐
│ define                                           │
│                                                  │
│   Person sub entity,                             │
│     owns name,                                   │
│     plays Employment:employee;                   │
│                                                  │
│   ...                                            │
└──────────────────────────────────────────────────┘
```

- **リアルタイム更新**: `nodes` / `edges` が変わるたびに自動再生成
- **コピーボタン**: クリップボードにコピー、完了後アイコンが変わる（2秒後に戻る）
- **シンタックスハイライト**: TypeQL のキーワード（`define`, `sub`, `relates`, `plays`, `owns`）に色を付ける
- **警告表示**: ロール名未設定のエッジがある場合に警告メッセージを表示する

### 警告表示

以下の場合に警告を表示する：

| 条件                               | 警告メッセージ                                                        |
| ---------------------------------- | --------------------------------------------------------------------- |
| plays エッジにロール名が未設定     | `ロール名が未設定のエッジがあります（N件）`                           |
| ロール名が TypeQL キーワードと同名 | `ロール名 "X" は TypeQL のキーワードと同じです。別の名前を推奨します` |

**キーワード衝突の対象:** `define`, `sub`, `relates`, `plays`, `owns`, `entity`, `relation`, `attribute`, `value`, `string`, `type`

---

## Sidebar のタブ化

現状 Sidebar は Inspector のみ。TypeQL タブを追加する。

```tsx
// Sidebar のタブ構成
<Tabs defaultValue="inspector">
  <TabsList>
    <TabsTrigger value="inspector">Inspector</TabsTrigger>
    <TabsTrigger value="typeql">TypeQL</TabsTrigger>
  </TabsList>
  <TabsContent value="inspector">{/* 既存のインスペクター UI */}</TabsContent>
  <TabsContent value="typeql">
    <TypeQLPanel nodes={nodes} edges={edges} />
  </TabsContent>
</Tabs>
```

---

## ファイル構成

```
src/
├── lib/
│   ├── typeql.ts         ← 修正（生成ロジック改善）
│   └── typeql.test.ts    ← 追加（新ルールのテスト）
└── components/
    ├── Sidebar.tsx        ← 修正（タブ追加）
    └── TypeQLPanel.tsx    ← 新規
```

---

## テスト方針（Red → Green）

### `src/lib/typeql.test.ts`（既存に追加）

```
現状の修正:
- define ブロックが1つにまとまること
- ロール名なしエッジは relates に含まれないこと

新規追加:
- Entity → Attribute エッジが owns として出力されること
- Relation → Attribute エッジが owns として出力されること
- Attribute ノードが sub attribute として定義されること
- ロール名なしエッジに対して警告情報が返されること
- 複数の役割を持つ Relation が正しく relates を列挙すること
- グラフが空のとき空文字列を返すこと
```

### `src/components/TypeQLPanel.test.tsx`（新規）

```
- nodes/edges が渡されたとき TypeQL が表示されること
- Copy ボタンをクリックするとクリップボードにコピーされること
- ロール名未設定エッジがあるとき警告が表示されること
- nodes/edges が更新されたとき TypeQL が再生成されること
```
