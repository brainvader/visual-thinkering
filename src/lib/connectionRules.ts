// src/lib/connectionRules.ts
import { Connection, Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';
import { TypeDBNodeData } from '@/types';

/**
 * TypeDB のスキーマルールに基づいて接続の有効性を検証する。
 * React Flow の isValidConnection prop に渡して使う。
 * 引数は Connection または Edge<unknown> の union 型になる。
 *
 * 許可される接続:
 *   Entity    → Relation  （plays: Entity が Relation のロールを担う）
 *   Entity    → Attribute （owns:  Entity が Attribute を所有する）
 *   Relation  → Relation  （nested relation: TypeDB で合法）
 *   Relation  → Attribute （owns:  Relation が Attribute を所有する）
 *
 * 禁止される接続:
 *   Entity    → Entity    （直接接続は意味を持たない）
 *   Attribute → *         （Attribute は接続元になれない）
 *   * → * (self)          （自己ループは禁止）
 */
export function isValidTypeDBConnection(
    connection: Connection | FlowEdge,
    nodes: FlowNode<TypeDBNodeData>[]
): boolean {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    // ノードが見つからない場合は拒否
    if (!sourceNode || !targetNode) return false;

    // 自己ループは禁止
    if (connection.source === connection.target) return false;

    const sourceType = sourceNode.data.typeDBType;
    const targetType = targetNode.data.typeDBType;

    // Attribute は接続元になれない（owns の方向は所有者 → Attribute）
    if (sourceType === 'attribute') return false;

    // Entity → Entity は直接接続不可
    if (sourceType === 'entity' && targetType === 'entity') return false;

    return true;
}