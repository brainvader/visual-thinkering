// src/hooks/useOwnershipBounds.ts
import { useMemo } from 'react';
import type { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';
import type { TypeDBNodeData, TypeDBEdgeData } from '@/types';

const PADDING = 20;
// measured が undefined のときのデフォルトサイズ
const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 48;

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * 選択ノードと owns エッジで繋がる Attribute ノード群の
 * バウンディングボックスを計算する純粋関数。
 * テスト可能にするため hooks から切り出している。
 */
export function calculateOwnershipBounds(
    selectedNode: FlowNode<TypeDBNodeData> | null,
    nodes: FlowNode<TypeDBNodeData>[],
    edges: FlowEdge<TypeDBEdgeData>[]
): BoundingBox | null {
    if (!selectedNode) return null;
    if (selectedNode.data.typeDBType === 'attribute') return null;

    // nodes 配列から id で引き直すことで常に最新の position/measured を使う
    const currentSelectedNode = nodes.find((n) => n.id === selectedNode.id);
    if (!currentSelectedNode) return null;

    // 選択ノードから出る owns エッジ（target が attribute）を抽出
    const ownedAttributeIds = edges
        .filter((e) => e.source === currentSelectedNode.id)
        .map((e) => e.target)
        .filter((targetId) => {
            const targetNode = nodes.find((n) => n.id === targetId);
            return targetNode?.data.typeDBType === 'attribute';
        });

    if (ownedAttributeIds.length === 0) return null;

    // 対象ノード = 選択ノード（最新）+ 関連 Attribute ノード
    const targetNodes = [
        currentSelectedNode,
        ...ownedAttributeIds
            .map((id) => nodes.find((n) => n.id === id))
            .filter((n): n is FlowNode<TypeDBNodeData> => n !== undefined),
    ];

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of targetNodes) {
        const w = node.measured?.width ?? DEFAULT_WIDTH;
        const h = node.measured?.height ?? DEFAULT_HEIGHT;
        const { x, y } = node.position;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
    }

    return {
        x: minX - PADDING,
        y: minY - PADDING,
        width: maxX - minX + PADDING * 2,
        height: maxY - minY + PADDING * 2,
    };
}

/**
 * React コンポーネントで使う hooks 版。
 * nodes/edges/selectedNode が変わったときのみ再計算する。
 */
export function useOwnershipBounds(
    selectedNode: FlowNode<TypeDBNodeData> | null,
    nodes: FlowNode<TypeDBNodeData>[],
    edges: FlowEdge<TypeDBEdgeData>[]
): BoundingBox | null {
    return useMemo(
        () => calculateOwnershipBounds(selectedNode, nodes, edges),
        // selectedNode の position/measured も含めて監視する
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            selectedNode?.id,
            selectedNode?.position.x,
            selectedNode?.position.y,
            selectedNode?.measured?.width,
            selectedNode?.measured?.height,
            // 関連ノードの position と measured が変わったときに再計算
            JSON.stringify(nodes.map((n) => ({ id: n.id, pos: n.position, m: n.measured }))),
            // エッジ構成が変わったときに再計算
            JSON.stringify(edges.map((e) => ({ s: e.source, t: e.target }))),
        ]
    );
}