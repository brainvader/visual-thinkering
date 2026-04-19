// src/lib/connectionRules.ts
import { Connection, Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';
import { TypeDBNodeData } from '@/types';

/**
 * TypeDB のスキーマルールに基づいて接続の有効性を検証する。
 * React Flow の isValidConnection prop に渡して使う。
 * 引数は Connection または Edge<unknown> の union 型になる。
 *
 * 許可される接続:
 *   Entity    → Relation   （plays: Entity が Relation のロールを担う）
 *   Entity    → Attribute  （owns:  Entity が Attribute を所有する）
 *   Relation  → Relation   （nested relation / または sub 継承）
 *   Relation  → Attribute  （owns:  Relation が Attribute を所有する）
 *   Entity    → Entity     （sub:   継承。onConnect で edgeType='sub' を付与）
 *   Attribute → Attribute  （sub:   継承。onConnect で edgeType='sub' を付与）
 *
 * 禁止される接続:
 *   Attribute → Entity/Relation  （Attribute は sub 以外で接続元になれない）
 *   * → * (self)                 （自己ループは禁止）
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

    // 同 typeDBType 同士は sub（継承）エッジとして許可
    if (sourceType === targetType) return true;

    // Attribute は sub 以外で接続元になれない
    // （同 typeDBType = Attribute→Attribute は上の条件で許可済み）
    if (sourceType === 'attribute') return false;

    return true;
}