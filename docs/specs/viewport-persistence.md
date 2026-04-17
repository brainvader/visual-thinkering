# Spec: Viewport の永続化

> ステータス: **Done**
> 対象ブランチ: `fix/viewport-persistence`
> 関連ファイル: `src/store.ts`, `src/components/GraphCanvas.tsx`

---

## 概要

アプリ再起動後、前回終了時のキャンバス位置・ズームレベル（viewport）をそのまま復元する。

---

## 問題の背景

`nodes` / `edges` は localStorage に保存されているが、**viewport（x/y/zoom）は保存対象外**だった。
さらに起動時に `fitView` を実行していたため、前回の表示位置ではなく「全ノードが収まる位置」に強制移動していた。

---

## スコープ

| 対象             | 内容                                         |
| ---------------- | -------------------------------------------- |
| 追加する保存対象 | `viewport: { x, y, zoom }`                   |
| 保存タイミング   | `onMoveEnd`（pan/zoom 操作完了時）           |
| 復元方法         | `ReactFlow` の `defaultViewport` prop に渡す |
| 初回起動時       | viewport 未保存 → `fitView` を1回実行        |
| `fitView` ボタン | Controls に残す（手動リセット用）            |

---

## 実装方針

### 1. store.ts

`viewport` を state に追加し、`partialize` の保存対象に含める。

```typescript
interface GraphState {
    // ...既存フィールド
    viewport: Viewport; // { x: number; y: number; zoom: number }
    setViewport: (viewport: Viewport) => void;
}

// 初期値
viewport: { x: 0, y: 0, zoom: 1 },

// アクション
setViewport: (viewport) => set({ viewport }),

// partialize に追加
partialize: (state) => ({
    nodes: state.nodes,
    edges: state.edges,
    narration: state.narration,
    viewport: state.viewport,
}),
```

### 2. GraphCanvas.tsx

#### 起動時 fitView ロジックの変更

- `hasFitView` ref を廃止
- viewport が**デフォルト値（初回起動）**のときのみ `fitView` を実行
  - 判定: `store.viewport.x === 0 && store.viewport.y === 0 && store.viewport.zoom === 1` かつ `nodes.length > 0`
  - ただしユーザーが意図的に原点・zoom=1 に戻した場合も考慮し、**初回フラグ**で1回のみ実行する

#### `defaultViewport` で復元

```tsx
<ReactFlow
    defaultViewport={viewport}  // 保存済み viewport を初期値として渡す
    onMoveEnd={(_event, vp) => setViewport(vp)}  // 移動・ズーム完了時に保存
    // fitView prop は削除
    ...
/>
```

#### `fitView` の実行条件

```typescript
// viewport が未保存（初回起動）かつノードありのときのみ実行
const isDefaultViewport =
  viewport.x === 0 && viewport.y === 0 && viewport.zoom === 1;

useEffect(() => {
  if (
    nodesInitialized &&
    nodes.length > 0 &&
    isDefaultViewport &&
    !hasFitView.current
  ) {
    fitView({ padding: 0.5 });
    hasFitView.current = true;
  }
}, [nodesInitialized, nodes.length, isDefaultViewport, fitView]);
```

---

## persist version

viewport フィールドを追加するため、`version` を `2 → 3` に上げる。
migrate で旧データに `viewport` デフォルト値を付与する。

```typescript
version: 3,
migrate: (persistedState: unknown, version: number) => {
    const state = persistedState as Partial<GraphState>;
    if (version < 3) {
        state.viewport = { x: 0, y: 0, zoom: 1 };
    }
    return state;
},
```

---

## テスト方針（Red → Green）

### `src/store.persist.test.ts` への追加

```
- viewport が localStorage に保存されること
- setViewport で更新した値が保存されること
- 旧バージョン（version < 3）のデータを migrate したとき viewport が補完されること
```

---

## 考慮事項

- `defaultViewport` は**初期マウント時のみ**有効。再レンダリングでは無視されるため viewport の「戻り」は発生しない
- `onMoveEnd` は連続パン中には発火しない（完了時のみ）ため、過度な localStorage 書き込みを避けられる
