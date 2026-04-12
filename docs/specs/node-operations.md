# Spec: ノード操作

> ステータス: **Draft**
> 対象ブランチ: `feat/node-operations`（予定）
> 関連ファイル: `store.ts`, `GraphCanvas.tsx`, `Sidebar.tsx`

---

## スコープ

| 操作       | トリガー                                           | 本スペックの対象                         |
| ---------- | -------------------------------------------------- | ---------------------------------------- |
| ノード追加 | 右クリックメニュー → Entity / Relation / Attribute | ✅                                       |
| ラベル編集 | Sidebar のインスペクター                           | ✅                                       |
| ノード削除 | コンテキストメニュー / Sidebar                     | 既存実装・変更なし                       |
| ノード移動 | ドラッグ                                           | React Flow デフォルト・変更なし          |
| 永続化     | —                                                  | 別スペック（`persistence.md`）に切り出し |

---

## 1. ノード追加

### 概要

キャンバスを右クリックして開くコンテキストメニューから、TypeDB のメタ型（Entity / Relation / Attribute）を選んでノードを追加する。

### 振る舞い

1. ユーザーがキャンバス上（ノード以外の領域）を右クリックする
2. コンテキストメニューが開く（既存 UI）
3. Quick Add セクションの Entity / Relation / Attribute ボタンをクリックする
4. **右クリックした座標**に新しいノードが生成される
5. 生成されたノードが自動的に `selectedNode` にセットされる（Sidebar に即反映）

### ノードの初期値

| フィールド        | 値                                                                  |
| ----------------- | ------------------------------------------------------------------- |
| `id`              | `crypto.randomUUID()` で生成                                        |
| `data.label`      | `"Entity"` / `"Relation"` / `"Attribute"`（固定、すぐ編集する前提） |
| `data.typeDBType` | `"entity"` / `"relation"` / `"attribute"`                           |
| `data.isAbstract` | `false`                                                             |
| `position`        | 右クリック時のフロー座標（後述）                                    |
| `type`            | `"default"`                                                         |

### 座標変換

React Flow の `useReactFlow().screenToFlowPosition()` を使い、スクリーン座標をフロー座標に変換する。

```
右クリック時の MouseEvent.clientX / clientY
  → screenToFlowPosition({ x, y })
  → Node の position に設定
```

**座標の保持:** `GraphCanvas` コンポーネント内部の `useState` で右クリック座標を一時保持する（UIの一時状態であり、永続化・グローバル管理は不要）。

```ts
// GraphCanvas 内部
const [contextMenuPosition, setContextMenuPosition] = useState<{
  x: number;
  y: number;
} | null>(null);
```

### store への追加

```ts
// store.ts に追加する API
addNode(type: TypeDBMetaType, position: { x: number; y: number }): void
```

実装イメージ:

```ts
addNode: (type, position) => {
  const newNode: Node<TypeDBNodeData> = {
    id: crypto.randomUUID(),
    data: {
      label: type.charAt(0).toUpperCase() + type.slice(1), // "entity" → "Entity"
      typeDBType: type,
      isAbstract: false,
    },
    position,
    type: 'default',
  };
  set({ nodes: [...get().nodes, newNode] });
},
```

---

## 2. ラベル編集

### 概要

Sidebar のインスペクターに表示されるテキスト入力フィールドからノードのラベルを変更する。

### 振る舞い

1. ユーザーがキャンバス上のノードをクリックし、`selectedNode` にセットされる
2. Sidebar のインスペクターに現在のラベルが入力フィールドとして表示される
3. ユーザーが入力フィールドを編集する
4. **Enter キー押下** → ラベルを確定、ストアに反映
5. **Escape キー押下** → 編集をキャンセル、元のラベルに戻す
6. **フォーカスが外れた場合（onBlur）** → 何もしない（Enter による明示的な確定のみ有効）

### ローカル state による編集管理

確定前にストアを汚さないため、編集中のテキストは Sidebar 内のローカル state で管理する。

```ts
// Sidebar 内部
const [editingLabel, setEditingLabel] = useState(selectedNode.data.label);

// selectedNode が切り替わったら編集中テキストをリセット
useEffect(() => {
  setEditingLabel(selectedNode?.data.label ?? "");
}, [selectedNode?.id]);
```

### バリデーション

| 条件                   | 動作                                                     |
| ---------------------- | -------------------------------------------------------- |
| 空文字列（トリム後）   | Enter を押しても確定しない                               |
| 先頭・末尾の空白       | トリムして確定                                           |
| 変更なし（元と同じ値） | ストアへの書き込みをスキップ（無駄な再レンダリング防止） |

### store への追加

```ts
// store.ts に追加する API
updateNodeLabel(nodeId: string, label: string): void
```

実装イメージ:

```ts
updateNodeLabel: (nodeId, label) => {
  set({
    nodes: get().nodes.map((n) =>
      n.id === nodeId
        ? { ...n, data: { ...n.data, label } }
        : n
    ),
  });
},
```

---

## 影響するファイル

| ファイル                         | 変更内容                                                |
| -------------------------------- | ------------------------------------------------------- |
| `src/store.ts`                   | `addNode` / `updateNodeLabel` を追加                    |
| `src/components/GraphCanvas.tsx` | 右クリック座標の取得・`addNode` 呼び出しをボタンに接続  |
| `src/components/Sidebar.tsx`     | ラベル編集フィールド（Enter/Escape ハンドリング）を追加 |

---

## テスト方針（Red → Green）

実装前に以下の failed test を書くこと。

### store のユニットテスト（`store.test.ts`）

```
- addNode を呼ぶとノードが1件追加されること
- addNode で生成されるノードの typeDBType が正しいこと
- addNode で生成されるノードの position が引数と一致すること
- addNode で生成される id が UUID 形式であること
- updateNodeLabel でラベルが更新されること
- updateNodeLabel は他のノードに影響しないこと
- 存在しない nodeId を渡しても updateNodeLabel がエラーにならないこと
```

### コンポーネントテスト（`Sidebar.test.tsx`）

```
- selectedNode が存在するとき、ラベル入力フィールドに現在のラベルが表示されること
- 入力を変更して Enter を押すと updateNodeLabel が呼ばれること
- 空文字列で Enter を押しても updateNodeLabel が呼ばれないこと
- Escape を押すと入力が元のラベルに戻ること
- selectedNode が切り替わると入力フィールドがリセットされること
```

---

## 未解決事項

- [ ] ノード追加後、自動的に Sidebar のラベル入力フィールドにフォーカスを当てるか？（UX改善候補）
- [ ] 同一ラベルのノードを複数作成することを許可するか？（TypeDB的には問題ないが混乱を招く可能性）
