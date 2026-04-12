# Spec: 接続制限（TypeDB セマンティクスに基づく）

> ステータス: **Draft**  
> 依存スペック: `edge-role-editing.md`（ロール名が設定できる状態が前提）  
> 対象ブランチ: `feat/connection-rules`（予定）  
> 関連ファイル: `src/store.ts`, `src/components/GraphCanvas.tsx`, `src/lib/connectionRules.ts`

---

## 概要

TypeDB のスキーマルールに基づき、意味のない接続を防ぐ。グラフキャンバス上で接続しようとしたとき、無効な組み合わせはエッジが作られない（またはエラーを表示する）。

---

## TypeDB の接続ルール

| 接続元    | 接続先              | 許可 | 意味                                       |
| --------- | ------------------- | ---- | ------------------------------------------ |
| Entity    | Relation            | ✅   | Entity が Relation のロールを担う（plays） |
| Relation  | Relation            | ✅   | ネストした Relation（TypeDB で合法）       |
| Entity    | Entity              | ❌   | 直接接続は意味を持たない                   |
| Attribute | Entity              | ✅   | Entity が Attribute を所有する（owns）     |
| Attribute | Relation            | ✅   | Relation が Attribute を所有する（owns）   |
| Attribute | Attribute           | ❌   | Attribute 同士の接続は不正                 |
| Any       | Attribute（target） | ✅   | Attribute は所有される側になれる           |

---

## 実装方針

React Flow の `isValidConnection` prop を使う。接続試行時に呼ばれるコールバックで、`false` を返すと接続がキャンセルされる。

```typescript
// src/lib/connectionRules.ts
import { Connection } from "@xyflow/react";
import { Node } from "@xyflow/react";
import { TypeDBNodeData } from "@/types";

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

  // 禁止パターン
  if (sourceType === "entity" && targetType === "entity") return false;
  if (sourceType === "attribute" && targetType === "attribute") return false;
  if (sourceType === "attribute" && targetType === "relation") return false;
  if (sourceType === "attribute" && targetType === "entity") return false;

  return true;
}
```

```typescript
// GraphCanvas.tsx
import { isValidTypeDBConnection } from '@/lib/connectionRules';

<ReactFlow
    isValidConnection={(connection) =>
        isValidTypeDBConnection(connection, nodes)
    }
    ...
/>
```

---

## ユーザーへのフィードバック

無効な接続を試みたとき、React Flow はデフォルトでドロップを無視するだけで何も表示しない。より分かりやすくするため、無効時にツールチップかトーストでエラーを表示することを検討する（本スペックでは任意実装とする）。

---

## 考慮事項

- **Abstract の扱い**: `isAbstract: true` のノードへの接続は現時点では制限しない（将来の拡張候補）
- **既存エッジの検証**: ルール追加後も既存の不正エッジはそのまま残る。将来的にバリデーション表示を追加する

---

## テスト方針（Red → Green）

### `src/lib/connectionRules.test.ts`（新規）

純粋関数なのでモック不要。

```
- Entity → Relation の接続が許可されること
- Entity → Entity の接続が拒否されること
- Attribute → Attribute の接続が拒否されること
- Attribute → Entity の接続が拒否されること（ownershipの方向は逆）
- Entity → Attribute の接続が許可されること
- Relation → Relation の接続が許可されること
- 自己ループが拒否されること
- ノードが見つからない場合は拒否されること
```
