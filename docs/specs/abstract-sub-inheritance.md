# Spec: Abstract型 & Sub継承エッジ

> ステータス: **Draft**
> ブランチ: `feat/abstract-sub-inheritance`
> 関連ファイル:
>
> - `src/types/index.ts`
> - `src/components/edges/SubEdge.tsx` （新規）
> - `src/components/edges/index.ts`
> - `src/components/nodes/EntityNode.tsx`
> - `src/components/nodes/RelationNode.tsx`
> - `src/components/nodes/AttributeNode.tsx`
> - `src/lib/connectionRules.ts`
> - `src/lib/typeql.ts`
> - `src/store.ts`

---

## 概要

TypeDB のサブタイプ（`sub`）と抽象型（`abstract`）をグラフ上で表現する。

- **`isAbstract` フラグ**: ノード単体のプロパティ。Inspector でトグル。
- **継承エッジ（`sub`）**: 同 `typeDBType` 同士を接続したとき自動的に `sub` エッジとして扱う。

---

## TypeDB セマンティクス

```typeql
# abstract: インスタンス化不可の基底型
person sub entity, abstract,
  owns name,
  owns age;

# sub: 継承（owns/plays を引き継ぐ）
employee sub person,
  owns salary;
```

- `sub` と `abstract` は独立した概念
- サブタイプは親の `owns` / `plays` / `relates` をすべて継承する
- `abstract` は必須ではない（具象型も `sub` できる）

---

## エッジ判定ルール

接続時に `sourceType === targetType` なら自動的に `sub` エッジとして扱う。

| 接続                | 判定     | TypeQL                         |
| ------------------- | -------- | ------------------------------ |
| Entity→Entity       | `sub` ✅ | `B sub A;`                     |
| Relation→Relation   | `sub` ✅ | `B sub A;`                     |
| Attribute→Attribute | `sub` ✅ | `B sub A, value <type>;`       |
| Entity→Relation     | `plays`  | 既存ルール                     |
| Entity→Attribute    | `owns`   | 既存ルール                     |
| Attribute→\*        | ❌ 禁止  | （Attribute→Attribute を除く） |

> **注意**: `connectionRules.ts` の `Entity→Entity 禁止` ルールを `sub` として解放する。

---

## ノードの `isAbstract` フラグ

- Inspector パネルのチェックボックスでトグル
- `store.ts` に `updateNodeAbstract(id, value)` アクションを追加
- `isAbstract: true` のとき TypeQL に `, abstract` を追記

---

## ビジュアル仕様

### Abstract バッジ

`isAbstract: true` のノードは右上に小さい `abstract` バッジを表示する。

```
┌──────────────────┐ ← abstract
│    Person        │
└──────────────────┘
```

### SubEdge スタイル

UML継承スタイルの中空三角矢印。既存の `RoleEdge`（実線＋ロール名）とは別の `edgeType`。

| 属性   | 値                               |
| ------ | -------------------------------- |
| 線種   | 実線                             |
| 矢印   | 中空三角（`markerEnd` カスタム） |
| ラベル | なし                             |
| 色     | `--color-muted-foreground`       |

---

## TypeQL 生成への変更

### `sub` エッジの処理

```typescript
// subMap: key=子ノードid, value=親ノードラベル
const subMap = new Map<string, string>();

// エッジ走査で同typeDBType同士は subMap に格納
if (sourceType === targetType) {
  subMap.set(edge.source, targetNode.data.label);
}
```

### 出力例

```typeql
define

  # Attribute 定義
  name sub attribute, value string;

  # Entity 定義
  person sub entity, abstract,
    owns name;

  employee sub person,
    owns salary;
```

### 出力順序（`sub` 追加後）

トポロジカルソートで親を先に出力する必要がある。循環継承はエラーとして警告に追加。

---

## `connectionRules.ts` の変更

```typescript
// 変更前: Entity→Entity は禁止
if (sourceType === "entity" && targetType === "entity") return false;

// 変更後: 同typeDBType は sub として許可
// Attribute→Attribute も許可（sub attribute）
if (sourceType === targetType) return true; // sub エッジとして許可
```

---

## `store.ts` の変更

```typescript
// 追加アクション
updateNodeAbstract: (id: string, isAbstract: boolean) => void;

// onConnect の変更: 同typeDBType同士は type: 'sub' を付与
const isSub = sourceNode.data.typeDBType === targetNode.data.typeDBType;
addEdge({ ...params, type: isSub ? 'sub' : 'role', data: { role: '' } });
```

---

## テスト方針（Red → Green）

### `src/lib/typeql.test.ts` への追加

```
sub エッジのテスト:
- Entity→Entity sub エッジが "B sub A" として出力されること
- abstract フラグが true のとき ", abstract" が含まれること
- abstract フラグが false のとき ", abstract" が含まれないこと
- sub エッジの親が先に定義されること（出力順序）
- Attribute→Attribute sub エッジが value 型を引き継ぐこと
- 循環継承（A sub B, B sub A）のとき警告が返されること
```

### `src/lib/connectionRules.test.ts` への追加

```
- Entity→Entity が許可されること（sub）
- Relation→Relation が許可されること（sub）
- Attribute→Attribute が許可されること（sub）
```

### `src/components/nodes/*.test.tsx` への追加

```
- isAbstract: true のとき "abstract" バッジが表示されること
- isAbstract: false のとき "abstract" バッジが非表示であること
```

---

## 実装順序

1. `src/types/index.ts` — `TypeDBEdgeType` 型追加
2. `src/lib/connectionRules.ts` — 同typeDBType許可ルール追加（テスト先行）
3. `src/lib/typeql.ts` — `sub` エッジ・`abstract` フラグ対応（テスト先行）
4. `src/store.ts` — `updateNodeAbstract` / `onConnect` 更新
5. `src/components/edges/SubEdge.tsx` — 新規コンポーネント
6. `src/components/edges/index.ts` — `SubEdge` 登録
7. `src/components/nodes/*.tsx` — Abstract バッジ追加
8. `src/components/Sidebar.tsx` — Inspector に `isAbstract` チェックボックス追加
9. `CLAUDE.md` / `docs/STATUS.md` / `docs/ARCHITECTURE.md` 更新
