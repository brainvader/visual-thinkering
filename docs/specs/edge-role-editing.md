# Spec: エッジのロール名編集

> ステータス: **Draft**  
> 対象ブランチ: `feat/edge-role-editing`（予定）  
> 関連ファイル: `src/store.ts`, `src/components/Sidebar.tsx`, `src/components/GraphCanvas.tsx`

---

## 概要

TypeDB では Relation ノードへの接続に「ロール名」が必要。

```typeql
Employment relates employee, relates employer;
Person plays Employment:employee;
Company plays Employment:employer;
```

現状エッジは作成できるが `role` フィールドが空のまま正しい TypeQL が生成されない。エッジをクリックして Sidebar でロール名を編集できるようにする。

---

## スコープ

| 操作         | トリガー                 | 対象                           |
| ------------ | ------------------------ | ------------------------------ |
| エッジ選択   | エッジをクリック         | `selectedEdge` state をセット  |
| ロール名編集 | Sidebar のインスペクター | テキスト入力フィールド         |
| 確定         | Enter キー               | ストアに反映                   |
| キャンセル   | Escape キー              | 元のロール名に戻す             |
| エッジ削除   | Sidebar の Delete ボタン | エッジのみ削除（ノードは残る） |

---

## 状態管理

`selectedEdge` を `App.tsx` のローカル state として追加する（`selectedNode` と同じ方針）。

```typescript
const [selectedEdge, setSelectedEdge] =
  React.useState<Edge<TypeDBEdgeData> | null>(null);
```

エッジをクリックしたときにノードの選択を解除し、エッジを選択状態にする（同時選択はしない）。

---

## store への追加 API

```typescript
updateEdgeRole(edgeId: string, role: string): void
deleteEdge(edgeId: string): void
```

---

## Sidebar の変更

`selectedNode` と `selectedEdge` のどちらかが存在するときインスペクターを表示する。

```
selectedNode が存在 → ノードインスペクター（現状）
selectedEdge が存在 → エッジインスペクター（新規）
両方 null          → "Select a node or edge to edit"
```

### エッジインスペクターの表示内容

| フィールド    | 内容                                                  |
| ------------- | ----------------------------------------------------- |
| Edge ID       | 表示のみ                                              |
| Role          | 編集可能テキスト入力（Enter確定 / Escape キャンセル） |
| Delete ボタン | エッジを削除                                          |

### バリデーション

- 空文字列は確定しない
- 先頭・末尾の空白はトリム
- 変更なしの Enter はスキップ

---

## GraphCanvas の変更

React Flow の `onEdgeClick` を追加する。

```typescript
onEdgeClick: (event: React.MouseEvent, edge: Edge<TypeDBEdgeData>) => void;
```

エッジクリック時：

1. `selectedNode` を null にリセット
2. `selectedEdge` をセット

---

## エッジのビジュアル

選択中のエッジにロール名をラベルとして表示する。未設定の場合は空表示（エラー表示はしない）。

```typescript
// エッジデータ例
{
    id: 'e1-2',
    source: 'node-1',
    target: 'node-2',
    data: { role: 'employee' },
    label: 'employee',  // React Flow の label prop で表示
}
```

---

## テスト方針（Red → Green）

### store.test.ts

```
- updateEdgeRole でロール名が更新されること
- updateEdgeRole は他のエッジに影響しないこと
- deleteEdge でエッジが削除されること
- 存在しない edgeId を渡してもエラーにならないこと
```

### Sidebar.test.tsx

```
- selectedEdge が存在するときエッジインスペクターが表示されること
- ロール名入力フィールドに現在のロール名が表示されること
- Enter でロール名が確定されること
- Escape でキャンセルされること
- Delete ボタンで deleteEdge が呼ばれること
```

### App.integration.test.tsx

```
- エッジクリック後に Sidebar にエッジインスペクターが表示されること
- エッジ削除後に Sidebar が閉じること
```
