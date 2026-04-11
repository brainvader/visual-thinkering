# データ構造仕様 (MVP)

## React Flow Node Data

| ノード型         | Data プロパティ     | 説明                              |
| :--------------- | :------------------ | :-------------------------------- |
| `typeDBEntity`   | `{ label: string }` | 矩形。TypeDB の Entity に対応。   |
| `typeDBRelation` | `{ label: string }` | 菱形。TypeDB の Relation に対応。 |

## React Flow Edge Data

- **Type**: `roleEdge`
- **Data**: `{ role: string }` (例: participant, owner)

## TypeScript 型定義 (src/types/graph.ts 予定)

```typescript
export type TypeDBMetaType = "entity" | "relation";

export interface VisualNodeData {
  label: string;
  typeDBType: TypeDBMetaType;
}

export interface RoleEdgeData {
  role: string;
}
```
