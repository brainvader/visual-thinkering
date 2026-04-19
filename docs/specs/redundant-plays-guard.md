# Spec: 冗長な plays エッジの接続禁止

> ステータス: **Draft**  
> ブランチ: `feat/redundant-plays-guard`  
> 関連ファイル:
>
> - `src/lib/connectionRules.ts`
> - `src/lib/connectionRules.test.ts`
> - `src/components/GraphCanvas.tsx`

---

## 概要

TypeDB ではサブタイプが親の `plays` を自動継承する。そのため、祖先型が既にある Relation の祖先型に plays エッジを持つ場合、子孫型から改めて plays エッジを張ることは冗長であるだけでなく、TypeDB の制約に反する可能性がある。

本機能は、そのような冗長な plays エッジの接続試行を `isValidConnection` レベルで即座に拒否する。

---

## 禁止すべき接続パターン

### 例

```
person  ──plays:employee──►  employment
  ↑ sub                           ↑ sub
worker                      contract-employment
```

- `person → employment`（role: employee）が既に存在する
- `worker sub person`、`contract-employment sub employment` の sub エッジが存在する
- この状態で `worker → contract-employment` の plays エッジを張ろうとする → **禁止**

TypeDB は `worker` が `person` のサブタイプであるため、`employment:employee` を自動的に plays できる。`contract-employment` は `employment` のサブタイプであるため、`employment:employee` は `contract-employment:employee` を含意する。よって手動で plays エッジを張ることは冗長かつ有害。

---

## 判定アルゴリズム

### 入力

| 引数         | 型                           | 説明                 |
| ------------ | ---------------------------- | -------------------- |
| `connection` | `Connection \| FlowEdge`     | 試みている新規接続   |
| `nodes`      | `FlowNode<TypeDBNodeData>[]` | 全ノード             |
| `edges`      | `Edge<TypeDBEdgeData>[]`     | 既存エッジ（全種類） |

### 手順

1. `source`（接続元）と `target`（接続先）の `typeDBType` を確認する
2. `source` が `entity` または `relation`、`target` が `relation` であること（plays 接続の前提）を確認する。それ以外は本ルールの対象外（既存ルールで処理）
3. `source` の **祖先ノード集合** `A_src` を求める（sub エッジを `source → target` 方向に遡る）
4. `target` の **祖先ノード集合** `A_tgt` を求める（同様）
5. 既存エッジの中から `edgeType !== 'sub'` かつ `edgeType !== 'owns'` のエッジ（= plays エッジ）を列挙する
6. いずれかの plays エッジについて、以下を両方満たすものが存在するか確認する：
   - `edge.source` が `A_src` に含まれる（接続元の祖先が plays の起点）
   - `edge.target` が `A_tgt` に含まれる（接続先の祖先が plays の終点）
7. 存在する → `false`（拒否）、存在しない → `true`（許可）

### 祖先集合の定義

```
ancestors(nodeId, edges) =
  { nodeId }
  ∪ ancestors(parent, edges)   // sub エッジ（source=child, target=parent）を辿る
```

sub エッジの方向: `source`（子） → `target`（親）

```typescript
// sub エッジで「子 → 親」を辿る
const subEdges = edges.filter((e) => e.data?.edgeType === "sub");
```

---

## シグネチャ変更

```typescript
// 変更前
export function isValidTypeDBConnection(
  connection: Connection | FlowEdge,
  nodes: FlowNode<TypeDBNodeData>[],
): boolean;

// 変更後
export function isValidTypeDBConnection(
  connection: Connection | FlowEdge,
  nodes: FlowNode<TypeDBNodeData>[],
  edges: Edge<TypeDBEdgeData>[], // 追加
): boolean;
```

`GraphCanvas.tsx` 側の呼び出しも更新する：

```typescript
isValidConnection={(connection) =>
    isValidTypeDBConnection(connection, nodes, edges)
}
```

---

## 既存ルールとの関係

本ルールは既存の型レベルチェック（`Attribute は接続元になれない` 等）の **後に** 追加する。既存ルールが `false` を返した時点で本ルールは評価しない。

```
[既存ルール] ノード未存在 / 自己ループ / Attribute起点 → false
     ↓（ここまで通過したとき）
[本ルール] 祖先チェーン × 既存 plays エッジ → false or true
```

---

## テスト方針（Red → Green）

### `src/lib/connectionRules.test.ts` への追加

#### 追加ユーティリティ

```typescript
const makeEdge = (
  id: string,
  source: string,
  target: string,
  edgeType: "role" | "sub" | "owns" = "role",
): Edge<TypeDBEdgeData> => ({
  id,
  source,
  target,
  data: { role: "employee", edgeType },
});
```

#### 拒否されるケース（本機能の核心）

```
- 直接の祖先への冗長 plays が拒否されること
  - person→employment が存在し、worker sub person / contract-employment sub employment のとき
  - worker→contract-employment が拒否される
- 片方のみ祖先関係では拒否されないこと
  - person→employment が存在し、worker sub person だが contract-employment の親がない場合
  - worker→contract-employment（別 relation）は許可される
- 自分自身も祖先集合に含まれること
  - person→employment が存在するとき、person→employment の二重接続は許可されない
  （※ React Flow の duplicate edge 防止とは別に、本ルールでも弾かれることを確認）
```

#### 許可されるケース

```
- edges が空のとき既存ルールに従い通常通り処理されること
- sub エッジのみ存在するとき plays チェックがスキップされること
- 祖先チェーンに plays の起点がないとき許可されること
```

#### 後方互換性（既存テストへの影響）

既存テストは `edges` として空配列 `[]` を渡すよう更新する。

---

## `GraphCanvas.tsx` への変更

```typescript
// 変更前
isValidConnection={(connection) =>
    isValidTypeDBConnection(connection, nodes)
}

// 変更後
isValidConnection={(connection) =>
    isValidTypeDBConnection(connection, nodes, edges)
}
```

---

## 考慮事項

- **多段継承**: `worker sub part-timer sub person` のような多段でも祖先集合の再帰探索で正しく処理される
- **循環 sub**: 循環継承はすでに `typeql.ts` の警告対象。本ルールでの対処は不要（循環時は探索が止まらないため、visited セットで無限ループを防ぐ）
- **edgeType の扱い**: `role`・`undefined`（旧データ互換）をともに plays として扱う。`sub` と `owns` は除外する
- **パフォーマンス**: 接続試行ごとに祖先集合を計算するが、グラフ規模が小さいため問題なし

---

## 実装順序

1. `docs/specs/redundant-plays-guard.md`（本ファイル） ← 完了
2. `src/lib/connectionRules.test.ts` — 新テストケース追加（Red）
3. `src/lib/connectionRules.ts` — `edges` 引数追加・祖先チェック実装（Green）
4. `src/components/GraphCanvas.tsx` — 呼び出し側に `edges` を渡す
5. `docs/STATUS.md` 更新
