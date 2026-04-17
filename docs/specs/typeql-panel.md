# Spec: TypeQL 出力パネル

> ステータス: **Implemented**
> 関連ファイル:
>
> - `src/lib/typeql.ts`
> - `src/lib/typeql.test.ts`
> - `src/components/TypeQLPanel.tsx`
> - `src/components/Sidebar.tsx`
> - `src/App.tsx`

---

## 概要

グラフキャンバスで構築したスキーマをリアルタイムに TypeQL として表示する。ユーザーはグラフを操作しながら生成される TypeQL を確認でき、クリップボードへのコピーも可能。

---

## 表示場所

Sidebar を「Inspector」と「TypeQL」の2タブ構成にする。

```
┌──────────────┬────────────────────┬─────────────────┐
│ Narration    │ GraphCanvas        │ Sidebar         │
│              │                    │  Inspector      │
│              ├────────────────────│  ─────────────  │
│              │ LLM Assistant      │  TypeQL         │
└──────────────┴────────────────────┴─────────────────┘
```

---

## TypeQL 生成ロジック

`generateTypeQL(nodes, edges, options?)` でグラフから TypeQL を生成する。

### 出力例

```typeql
define

  # Attribute 定義（依存される側を先に定義）
  name sub attribute, value string;
  start-date sub attribute, value datetime;
  age sub attribute, value long;

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
```

### 生成ルール

| エッジ                         | 生成される TypeQL                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Entity → Relation（role あり） | `Entity plays Relation:role;` を Entity 定義に追加 + `relates role` を Relation 定義に追加 |
| Entity → Relation（role なし） | スキップ（警告マーカーを表示）                                                             |
| Entity → Attribute             | `Entity owns Attribute;` を Entity 定義に追加                                              |
| Relation → Attribute           | `Relation owns Attribute;` を Relation 定義に追加                                          |

### Attribute の value 型

`TypeDBNodeData.valueType` フィールドを参照する。未指定の場合は `"string"` にフォールバック（localStorage からの旧データとの後方互換）。

```typescript
type AttributeValueType = "string" | "long" | "double" | "boolean" | "datetime";

// 生成コード
const vt = node.data.valueType ?? "string";
lines.push(`  ${node.data.label} sub attribute, value ${vt};`);
```

Sidebar の Inspector タブで Attribute ノード選択時にセレクトから変更できる。変更は即時反映（Enter 確定不要）。

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

### Sidebar Inspector — value 型セレクト

Attribute ノード選択時、Label フィールドの下に表示する。

```
Label:  [name          ]
        Enter で確定 / Esc でキャンセル

Value:  [string        ▼]   ← Attribute 選択時のみ表示
```

- shadcn/ui の `<Select>` を使用
- 選択肢: `string` / `long` / `double` / `boolean` / `datetime`
- 変更は即時 store に反映（ドロップダウン選択 = 意図の確定）
- Entity / Relation ノード選択時は表示しない

### 警告表示

以下の場合に警告を表示する：

| 条件                               | 警告メッセージ                                                        |
| ---------------------------------- | --------------------------------------------------------------------- |
| plays エッジにロール名が未設定     | `ロール名が未設定のエッジがあります（N件）`                           |
| ロール名が TypeQL キーワードと同名 | `ロール名 "X" は TypeQL のキーワードと同じです。別の名前を推奨します` |

**キーワード衝突の対象:** `define`, `sub`, `relates`, `plays`, `owns`, `entity`, `relation`, `attribute`, `value`, `string`, `type`

---

## ファイル構成

```
src/
├── types/index.ts             ← AttributeValueType 型、TypeDBNodeData.valueType フィールド
├── store.ts                   ← updateNodeValueType アクション
├── lib/
│   ├── typeql.ts              ← valueType を参照した Attribute 定義生成
│   └── typeql.test.ts         ← valueType 対応テスト（makeNode に extra 引数追加）
└── components/
    ├── Sidebar.tsx            ← value 型セレクト（Attribute 選択時のみ表示）
    ├── Sidebar.test.tsx       ← defaultProps ヘルパー導入、valueType テスト追加
    ├── Sidebar.edge.test.tsx  ← defaultProps ヘルパーに updateNodeValueType を追加
    └── TypeQLPanel.tsx        ← 変更なし
```

---

## テスト方針

### `src/lib/typeql.test.ts`

- `makeNode` に `extra: Partial<TypeDBNodeData>` 引数を追加
- `valueType` 未指定のとき `value string` がデフォルトで付くこと
- `valueType: 'long'` のとき `value long` が出力されること（double / boolean / datetime も同様）
- 複数の Attribute が異なる value 型を持てること

### `src/components/Sidebar.test.tsx`

- Attribute ノード選択時に Value Type セレクトが表示されること
- Entity ノード選択時に Value Type セレクトが表示されないこと
- `valueType` 未指定のとき `string` がデフォルト選択されていること
- `valueType: 'long'` のノードのとき `long` が選択されていること
- セレクト変更後の表示追従（`rerender` で検証）

> **Radix UI Select と jsdom の制約:**
> `<SelectContent>` はポータルに描画されるため、`userEvent.click` でオプションを選択できない。
> `onValueChange` コールバックの呼び出し検証は `rerender` で `selectedNode.data.valueType` を
> 変更した際の表示追従で代替する。実際の store 更新は `store.test.ts` で担保する。
