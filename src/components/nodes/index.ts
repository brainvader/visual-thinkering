// src/components/nodes/index.ts
// nodeTypes を一箇所にまとめて export
// GraphCanvas の ReactFlow に渡すことで型ごとのカスタム描画が有効になる
import { EntityNode } from './EntityNode';
import { RelationNode } from './RelationNode';
import { AttributeNode } from './AttributeNode';

export const nodeTypes = {
    entity: EntityNode,
    relation: RelationNode,
    attribute: AttributeNode,
};