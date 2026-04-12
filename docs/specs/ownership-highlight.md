# Spec: Ownership ハイライト（動的グループ表示）

> ステータス: **Draft**
> 対象ブランチ: `feat/ownership-highlight`（予定）
> 関連ファイル: `src/components/GraphCanvas.tsx`, `src/hooks/useOwnershipBounds.ts`

---

## 概要

ノードを選択したとき、そのノードと `owns` エッジで繋がっている Attribute ノードを薄い背景色の矩形で囲んで視覚的にグループを示す。Sub Flow（parentId）は使わず、SVG オーバーレイで描画するため既存の構造に影響しない。

---

## 動作仕様

### 表示トリガー

- Entity または Relation ノードを選択したとき、`owns` エッジで繋がる Attribute ノードが1件以上存在すれば矩形を表示する
- Attribute ノードを選択した場合は表示しない（Attribute は owns の対象であり起点ではない）
- ノード未選択時・エッジ選択時は表示しない

### 矩形の計算

選択ノード + 関連 Attribute ノード群の **バウンディングボックス** を計算して矩形を描画する。

```
矩形の左上 = min(全対象ノードの x, y) - padding
矩形の右下 = max(全対象ノードの x + width, y + height) + padding
padding = 20px
```

ノードが移動するたびに `onNodesChange` 経由で再計算されるため、**リアルタイムで縮小・拡大**する。

### スタイル

- 塗りつぶし: `rgba(59, 130, 246, 0.06)`（青系の非常に薄い色）
- ボーダー: なし
- 角丸: `12px`
- React Flow の `<svg>` レイヤー内に `<rect>` として描画する（ノードより背面に配置）

---

## 実装方針

### カスタムフック `useOwnershipBounds`

```typescript
// src/hooks/useOwnershipBounds.ts
// 選択ノードと関連 Attribute のバウンディングボックスを計算して返す

export function useOwnershipBounds(
  selectedNode: Node<TypeDBNodeData> | null,
  nodes: Node<TypeDBNodeData>[],
  edges: Edge<TypeDBEdgeData>[],
): { x: number; y: number; width: number; height: number } | null;
```

**計算手順:**

1. `selectedNode` が null または `typeDBType === 'attribute'` なら `null` を返す
2. `edges` から `source === selectedNode.id` かつ target の `typeDBType === 'attribute'` のエッジを抽出
3. 該当する Attribute ノードを取得
4. 対象ノードが0件なら `null` を返す
5. 選択ノード + 全 Attribute ノードの position と measured.width/height からバウンディングボックスを計算
6. padding を加えて返す

### GraphCanvas での描画

React Flow の `<svg>` 内に描画するには `useReactFlow` の座標系を使う。`ReactFlow` コンポーネントの子に SVG 要素を直接置くことで実現する。

```tsx
// GraphCanvas 内
const bounds = useOwnershipBounds(selectedNode, nodes, edges);

// ReactFlow の子として描画
{
  bounds && (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none", // クリックを透過させる
        zIndex: 0, // ノードより背面
      }}
    >
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        rx={12}
        fill="rgba(59, 130, 246, 0.06)"
      />
    </svg>
  );
}
```

---

## 考慮事項

- **座標系の変換**: React Flow のノード座標はフロー座標系。SVG オーバーレイもフロー座標系で描画する必要があるため、`useReactFlow` の viewport（zoom/pan）に応じた変換が必要
- **measured が undefined の場合**: ノードが初回レンダリング前は `measured` が undefined になることがある。その場合はデフォルトサイズ（120x48）でフォールバックする
- **複数選択は対象外**: 現状 `selectedNode` は単一選択のみ

---

## テスト方針（Red → Green）

### `src/hooks/useOwnershipBounds.test.ts`（新規）

純粋な計算ロジックとして切り出すのでモック不要。

```
- selectedNode が null のとき null を返すこと
- selectedNode が attribute のとき null を返すこと
- owns エッジが存在しないとき null を返すこと
- owns エッジが1件あるとき正しいバウンディングボックスを返すこと
- owns エッジが複数あるとき全ノードを包む矩形を返すこと
- padding が矩形に加算されること
- ノードが移動したとき矩形が再計算されること（座標変更後の結果を確認）
```
