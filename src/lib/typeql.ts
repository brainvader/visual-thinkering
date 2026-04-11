import { Node, Edge } from '@xyflow/react';
import { TypeDBNodeData, TypeDBEdgeData } from "../types"; // types.md で定義したインターフェース

export const generateTypeQL = (
    nodes: Node<TypeDBNodeData>[],
    edges: Edge<TypeDBEdgeData>[]
): string => {
    // 1. Entity 定義
    const entityQuery = nodes
        .filter((n) => n.data?.typeDBType === 'entity')
        .map((n) => `define ${n.data.label} sub entity;`)
        .join('\n');

    // 2. Relation 定義
    const relationQuery = nodes
        .filter((n) => n.data?.typeDBType === 'relation')
        .map((n) => {
            // 接続されているロールを取得
            const roles = edges
                .filter((e) => e.target === n.id)
                .map((e) => e.data?.role || 'unknown');

            const roleDef = roles.length > 0
                ? `, relates ${roles.join(', relates ')}`
                : '';

            return `define ${n.data.label} sub relation${roleDef};`;
        })
        .join('\n');

    // 3. Play 定義 (Entity と Relation の結合)
    const playQuery = edges
        .map((e) => {
            const sourceNode = nodes.find((n) => n.id === e.source);
            const targetNode = nodes.find((n) => n.id === e.target);

            if (sourceNode && targetNode && targetNode.data.typeDBType === 'relation') {
                return `${sourceNode.data.label} plays ${targetNode.data.label}:${e.data?.role};`;
            }
            return null;
        })
        .filter(Boolean)
        .join('\n');

    return `${entityQuery}\n\n${relationQuery}\n\n${playQuery}`;
};