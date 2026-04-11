# Data Specification: Types & Schema

## 1. TypeScript Definitions

React Flowのカスタムノード・エッジに付与する、TypeDB 互換のメタデータ型定義です。

export type TypeDBMetaType = "entity" | "relation" | "attribute";

export interface TypeDBNodeData {
label: string;
typeDBType: TypeDBMetaType;
isAbstract?: boolean;
}

export interface TypeDBEdgeData {
role: string;
isKey?: boolean;
}

---

## 2. Single Source of Truth (JSON Example)

React Flow の initialNodes / initialEdges およびシリアライズの基準となるデータ構造です。

{
"nodes": [
{
"id": "node-entity-person",
"type": "typeDBEntity",
"position": { "x": 100, "y": 100 },
"data": {
"label": "person",
"typeDBType": "entity",
"isAbstract": false
}
},
{
"id": "node-relation-employment",
"type": "typeDBRelation",
"position": { "x": 400, "y": 150 },
"data": {
"label": "employment",
"typeDBType": "relation"
}
}
],
"edges": [
{
"id": "edge-person-employment",
"source": "node-entity-person",
"target": "node-relation-employment",
"type": "roleEdge",
"data": {
"role": "employee"
}
}
]
}

---

## 3. Structure Rules

1. Node Types: Entityは「矩形」、Relationは「菱形」として描画する。
2. Edge Types: すべて roleEdge とし、線上に data.role を表示・編集可能にする。
3. Validation: data.label は TypeQL の命名規約に従うこと。
