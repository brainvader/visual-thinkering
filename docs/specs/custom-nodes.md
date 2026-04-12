# Spec: Custom Node ビジュアル

> ステータス: **Draft**
> 対象ブランチ: `feat/custom-nodes`（予定）
> 関連ファイル: `src/components/nodes/`, `src/components/GraphCanvas.tsx`, `src/store.ts`

---

## スコープ

TypeDB のメタ型ごとに異なる形状の Custom Node を実装する。

| 型          | 形状     | 実装方法                                         |
| ----------- | -------- | ------------------------------------------------ |
| `entity`    | 角丸矩形 | `border-radius` で CSS 実装                      |
| `relation`  | ひし形   | SVG `polygon` で実装、ラベル長に応じて動的サイズ |
| `attribute` | 楕円     | `border-radius: 50%` で CSS 実装                 |

表示内容は**ラベルのみ**（シンプル）。

---

## 1. ファイル構成

```
src/components/nodes/
├── EntityNode.tsx      # 角丸矩形
├── RelationNode.tsx    # ひし形（SVG）
├── AttributeNode.tsx   # 楕円
└── index.ts            # nodeTypes オブジェクトをまとめて export
```

---

## 2. 各ノードの仕様

### 共通仕様

- React Flow の `NodeProps<TypeDBNodeData>` を props として受け取る
- `Handle`（接続ポイント）を上下左右に配置する
- 選択状態（`selected`）のときにハイライト表示する
- ラベルは中央揃えで表示する

### EntityNode（角丸矩形）

```
┌──────────────┐
│    Person    │
└──────────────┘
```

- 最小幅: `120px`、最小高さ: `48px`
- padding: `8px 16px`
- border-radius: `8px`
- 色: 青系（`border: 2px solid #3b82f6`、背景 `#eff6ff`）
- 選択時: `border-color: #1d4ed8`、`box-shadow` でハイライト

### RelationNode（ひし形）

```
      ◇
   ╱     ╲
  ╱ Employment ╲
  ╲           ╱
   ╲         ╱
      ◇
```

- SVG の `polygon` で描画
- ラベルの実測幅（`useRef` + `getBoundingClientRect`）から動的にサイズ計算
- 幅 = `ラベル幅 + 80px`（余白）、高さ = `幅 * 0.6`（縦横比を固定）
- 色: 緑系（`fill: #f0fdf4`、`stroke: #22c55e`）
- 選択時: `stroke: #15803d`、`stroke-width` を太くする

### AttributeNode（楕円）

```
 ╭──────────╮
╱   label    ╲
╲            ╱
 ╰──────────╯
```

- 最小幅: `100px`、最小高さ: `48px`
- padding: `8px 20px`
- border-radius: `9999px`（完全な楕円）
- 色: 橙系（`border: 2px solid #f97316`、背景 `#fff7ed`）
- 選択時: `border-color: #c2410c`

---

## 3. React Flow への登録

```typescript
// src/components/nodes/index.ts
import { EntityNode } from "./EntityNode";
import { RelationNode } from "./RelationNode";
import { AttributeNode } from "./AttributeNode";

export const nodeTypes = {
  entity: EntityNode,
  relation: RelationNode,
  attribute: AttributeNode,
};
```

```typescript
// GraphCanvas.tsx
import { nodeTypes } from './nodes';

<ReactFlow
    nodeTypes={nodeTypes}  // ← 追加
    ...
/>
```

---

## 4. store.ts の変更

`addNode` で `type: 'default'` を `typeDBType` に変更する。

```typescript
// before
type: "default";

// after
type: type; // 'entity' | 'relation' | 'attribute'
```

既存の初期ノードも同様に修正する。

---

## 5. RelationNode のサイズ計算

ラベル長の動的計算には `useLayoutEffect` + `useRef` を使う。

```typescript
const labelRef = useRef<SVGTextElement>(null);
const [size, setSize] = useState({ width: 160, height: 96 });

useLayoutEffect(() => {
  if (!labelRef.current) return;
  const { width } = labelRef.current.getBoundingClientRect();
  const w = Math.max(160, width + 80);
  setSize({ width: w, height: w * 0.6 });
}, [data.label]);
```

---

## テスト方針（Red → Green）

### コンポーネントテスト

```
// EntityNode
- ラベルが表示されること
- selected=true のときハイライトクラスが付くこと

// RelationNode
- ラベルが表示されること
- SVG polygon が描画されること
- selected=true のときハイライトが付くこと

// AttributeNode
- ラベルが表示されること
- selected=true のときハイライトクラスが付くこと
```

### store.test.ts

```
- addNode('entity') で生成されたノードの type が 'entity' であること
- addNode('relation') で生成されたノードの type が 'relation' であること
- addNode('attribute') で生成されたノードの type が 'attribute' であること
```
