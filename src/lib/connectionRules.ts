// src/lib/connectionRules.ts
import { Connection, Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';
import { TypeDBNodeData, TypeDBEdgeData } from '@/types';

/**
 * sub エッジを遡って祖先ノード ID の集合を返す。
 * 自身も含む（visited で循環を防ぐ）。
 *
 * sub エッジの方向: source（親） → target（子）
 */
function getAncestors(
    nodeId: string,
    subEdges: FlowEdge<TypeDBEdgeData>[],
    visited: Set<string> = new Set()
): Set<string> {
    if (visited.has(nodeId)) return visited;
    visited.add(nodeId);

    for (const edge of subEdges) {
        // target が自分 = 自分が子 → source（親）へ遡る
        if (edge.target === nodeId) {
            getAncestors(edge.source, subEdges, visited);
        }
    }

    return visited;
}

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
 *   祖先が既存 plays で繋がる場合 （冗長な継承 plays は TypeDB が自動解決するため不要）
 */
export function isValidTypeDBConnection(
    connection: Connection | FlowEdge,
    nodes: FlowNode<TypeDBNodeData>[],
    edges: FlowEdge<TypeDBEdgeData>[]
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

    // -----------------------------------------------
    // 冗長な plays エッジの検出
    // 接続元の祖先集合と接続先の祖先集合の間に
    // 既存 plays エッジが存在する場合は拒否する。
    // TypeDB はサブタイプの plays を自動継承するため、
    // 明示的な接続は冗長かつ有害になる。
    // -----------------------------------------------
    if (targetType === 'relation') {
        // sub エッジのみ抽出（祖先探索に使用）
        const subEdges = edges.filter((e) => e.data?.edgeType === 'sub');

        // plays エッジのみ抽出:
        //   sub でない かつ target ノードが relation のもの
        // （owns = target が attribute のため自然に除外される）
        const playsEdges = edges.filter((e) => {
            if (e.data?.edgeType === 'sub') return false;
            const tgt = nodes.find((n) => n.id === e.target);
            return tgt?.data.typeDBType === 'relation';
        });

        // connection.source はハンドル ID を含む場合があるため、
        // nodes.find で解決済みの sourceNode.id / targetNode.id を使う
        const srcAncestors = getAncestors(sourceNode.id, subEdges);
        const tgtAncestors = getAncestors(targetNode.id, subEdges);

        // 既存 plays エッジが祖先間に存在するか確認
        const isRedundant = playsEdges.some(
            (e) => srcAncestors.has(e.source) && tgtAncestors.has(e.target)
        );

        if (isRedundant) return false;
    }

    return true;
}