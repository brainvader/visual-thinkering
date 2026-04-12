# Spec: 接続制限（TypeDB セマンティクスに基づく）

> ステータス: **Draft**  
> 依存スペック: `edge-role-editing.md`（ロール名が設定できる状態が前提）  
> 対象ブランチ: `feat/connection-rules`（予定）  
> 関連ファイル: `src/lib/connectionRules.ts`, `src/components/GraphCanvas.tsx`

---

## 概要

TypeDB のスキーマルールに基づき、意味のない接続を防ぐ。グラフキャンバス上で接続しようとしたとき、無効な組み合わせはエッジが作られない。

---

## TypeDB の接続ルール

| 接続元    | 接続先    | 許可 | TypeDB での意味                            |
| --------- | --------- | ---- | ------------------------------------------ |
| Entity    | Relation  | ✅   | Entity が Relation のロールを担う（plays） |
| Entity    | Attribute | ✅   | Entity が Attribute を所有する（owns）     |
| Relation  | Relation  | ✅   | ネストした Relation（TypeDB で合法）       |
| Relation  | Attribute | ✅   | Relation が Attribute を所有する（owns）   |
| Entity    | Entity    | ❌   | 直接接続は意味を持たない                   |
| Attribute | \*        | ❌   | Attribute は接続元になれない               |
| \*        | \* (self) | ❌   | 自己ループは禁止                           |

**ポイント:** `owns` の方向は「所有者 → Attribute」。Attribute は常に接続先（target）になる。

---

## 実装方針

React Flow の `isValidConnection` prop を使う。接続試行時に呼ばれるコールバックで、`false` を返すと接続がキャンセルされる。

```typescript
// src/lib/connectionRules.ts
export function isValidTypeDBConnection(
  connection: Connection,
  nodes: Node<TypeDBNodeData>[],
): boolean {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) return false;

  const sourceType = sourceNode.data.typeDBType;
  const targetType = targetNode.data.typeDBType;

  // 自己ループは禁止
  if (connection.source === connection.target) return false;

  // Attribute は接続元になれない
  if (sourceType === "attribute") return false;

  // Entity → Entity は禁止
  if (sourceType === "entity" && targetType === "entity") return false;

  return true;
}
```

```typescript
// GraphCanvas.tsx への追加
<ReactFlow
    isValidConnection={(connection) =>
        isValidTypeDBConnection(connection, nodes)
    }
    ...
/>
```

---

## ユーザーへのフィードバック

無効な接続を試みたとき、React Flow はデフォルトでドロップを無視するだけで何も表示しない。より分かりやすくするため、将来的にトーストでエラーを表示することを検討する（本スペックでは任意実装とする）。

---

## 考慮事項

- **Abstract の扱い**: `isAbstract: true` のノードへの接続は現時点では制限しない（将来の拡張候補）
- **既存エッジの検証**: ルール追加後も既存の不正エッジはそのまま残る

---

## テスト方針（Red → Green）

### `src/lib/connectionRules.test.ts`（新規）

純粋関数なのでモック不要。

```
許可されるケース:
- Entity → Relation が許可されること（plays）
- Entity → Attribute が許可されること（owns）
- Relation → Relation が許可されること（nested relation）
- Relation → Attribute が許可されること（owns）

拒否されるケース:
- Entity → Entity が拒否されること
- Attribute → Entity が拒否されること
- Attribute → Relation が拒否されること
- Attribute → Attribute が拒否されること
- 自己ループが拒否されること
- source ノードが見つからない場合が拒否されること
- target ノードが見つからない場合が拒否されること
```
