// src/lib/typeql.ts
// グラフ（nodes + edges）から TypeQL スキーマ定義文字列を生成する

import { Node, Edge } from '@xyflow/react';
import { TypeDBNodeData, TypeDBEdgeData } from '@/types';

export interface TypeQLWarning {
    edgeId: string;
    message: string;
}

export interface TypeQLResult {
    typeql: string;
    warnings: TypeQLWarning[];
}

interface GenerateOptions {
    includeWarnings?: boolean;
}

/**
 * グラフから TypeQL スキーマ定義を生成する。
 *
 * overload 1: generateTypeQL(nodes, edges) → string
 * overload 2: generateTypeQL(nodes, edges, { includeWarnings: true }) → TypeQLResult
 */
export function generateTypeQL(
    nodes: Node<TypeDBNodeData>[],
    edges: Edge<TypeDBEdgeData>[],
    options: { includeWarnings: true }
): TypeQLResult;
export function generateTypeQL(
    nodes: Node<TypeDBNodeData>[],
    edges: Edge<TypeDBEdgeData>[],
    options?: GenerateOptions
): string;
export function generateTypeQL(
    nodes: Node<TypeDBNodeData>[],
    edges: Edge<TypeDBEdgeData>[],
    options?: GenerateOptions
): string | TypeQLResult {
    const warnings: TypeQLWarning[] = [];

    if (nodes.length === 0) {
        if (options?.includeWarnings) return { typeql: '', warnings };
        return '';
    }

    // -----------------------------------------------
    // エッジを種別（sub / role）に分類して集計する
    // -----------------------------------------------

    // sub エッジ: key=子ノードid, value=親ノードid
    const subMap = new Map<string, string>();

    // Entity/Relation が owns する Attribute ラベルを収集
    const ownsMap = new Map<string, string[]>();

    // Entity/Relation が plays するロール情報を収集
    const playsMap = new Map<string, { relationLabel: string; role: string }[]>();

    // Relation が relates するロール名を収集
    const relatesMap = new Map<string, string[]>();

    const typeqlKeywords = [
        'define', 'sub', 'abstract', 'relates', 'plays', 'owns',
        'entity', 'relation', 'attribute', 'value', 'string', 'type',
    ];

    for (const edge of edges) {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (!sourceNode || !targetNode) continue;

        const edgeType = edge.data?.edgeType ?? 'role';

        if (edgeType === 'sub') {
            // sub エッジ: source が子、target が親
            subMap.set(edge.source, edge.target);
            continue;
        }

        // role エッジ以降の処理
        const targetType = targetNode.data.typeDBType;

        if (targetType === 'attribute') {
            // owns: Entity/Relation → Attribute
            const list = ownsMap.get(edge.source) ?? [];
            list.push(targetNode.data.label);
            ownsMap.set(edge.source, list);

        } else if (targetType === 'relation') {
            // plays: Entity/Relation → Relation（ロール名が必要）
            const role = edge.data?.role?.trim() ?? '';
            if (!role) {
                warnings.push({
                    edgeId: edge.id,
                    message: `エッジ "${sourceNode.data.label} → ${targetNode.data.label}" にロール名が設定されていません`,
                });
                continue;
            }

            // TypeQL キーワードと同名のロール名は警告する
            if (typeqlKeywords.includes(role)) {
                warnings.push({
                    edgeId: edge.id,
                    message: `ロール名 "${role}" は TypeQL のキーワードと同じです。別の名前を推奨します`,
                });
            }

            const playsList = playsMap.get(edge.source) ?? [];
            playsList.push({ relationLabel: targetNode.data.label, role });
            playsMap.set(edge.source, playsList);

            const relatesList = relatesMap.get(edge.target) ?? [];
            if (!relatesList.includes(role)) relatesList.push(role);
            relatesMap.set(edge.target, relatesList);
        }
    }

    // -----------------------------------------------
    // 循環継承の検出
    // -----------------------------------------------
    for (const [childId] of subMap) {
        // 祖先を辿って自分自身に戻らないか確認する
        const visited = new Set<string>();
        let current: string | undefined = childId;
        while (current !== undefined) {
            if (visited.has(current)) {
                warnings.push({
                    edgeId: childId,
                    message: `循環継承が検出されました（ノード "${nodes.find((n) => n.id === childId)?.data.label ?? childId}" を含む継承チェーン）`,
                });
                break;
            }
            visited.add(current);
            current = subMap.get(current);
        }
    }

    // -----------------------------------------------
    // sub エッジを考慮したトポロジカルソート
    // 親ノードを子ノードより先に出力する
    // -----------------------------------------------
    function topoSort(targetNodes: Node<TypeDBNodeData>[]): Node<TypeDBNodeData>[] {
        const sorted: Node<TypeDBNodeData>[] = [];
        const visited = new Set<string>();

        function visit(node: Node<TypeDBNodeData>) {
            if (visited.has(node.id)) return;
            visited.add(node.id);
            // 親ノードを先に処理する（循環は無視）
            const parentId = subMap.get(node.id);
            if (parentId) {
                const parentNode = targetNodes.find((n) => n.id === parentId);
                if (parentNode) visit(parentNode);
            }
            sorted.push(node);
        }

        for (const node of targetNodes) {
            visit(node);
        }
        return sorted;
    }

    // -----------------------------------------------
    // TypeQL 文字列を組み立てる（Attribute → Entity → Relation の順）
    // -----------------------------------------------
    const lines: string[] = ['define', ''];

    // Attribute 定義
    const attributeNodes = topoSort(nodes.filter((n) => n.data.typeDBType === 'attribute'));
    if (attributeNodes.length > 0) {
        lines.push('  # Attribute 定義');
        for (const node of attributeNodes) {
            const parentId = subMap.get(node.id);
            const parentNode = parentId ? nodes.find((n) => n.id === parentId) : undefined;
            // 親がある場合は "B sub ParentLabel" とし、ない場合は "B sub attribute"
            const subTarget = parentNode ? parentNode.data.label : 'attribute';
            const isAbstract = node.data.isAbstract ? ', abstract' : '';

            if (parentNode) {
                // sub 継承の場合は value を出力しない（親から継承）
                lines.push(`  ${node.data.label} sub ${subTarget}${isAbstract};`);
            } else {
                const vt = node.data.valueType ?? 'string';
                lines.push(`  ${node.data.label} sub attribute${isAbstract}, value ${vt};`);
            }
        }
        lines.push('');
    }

    // Entity 定義
    const entityNodes = topoSort(nodes.filter((n) => n.data.typeDBType === 'entity'));
    if (entityNodes.length > 0) {
        lines.push('  # Entity 定義');
        for (const node of entityNodes) {
            const parentId = subMap.get(node.id);
            const parentNode = parentId ? nodes.find((n) => n.id === parentId) : undefined;
            const subTarget = parentNode ? parentNode.data.label : 'entity';
            const isAbstract = node.data.isAbstract ? ', abstract' : '';

            const parts: string[] = [];
            const owns = ownsMap.get(node.id) ?? [];
            const plays = playsMap.get(node.id) ?? [];

            parts.push(`  ${node.data.label} sub ${subTarget}${isAbstract}`);
            for (const attr of owns) parts.push(`    owns ${attr}`);
            for (const p of plays) parts.push(`    plays ${p.relationLabel}:${p.role}`);

            lines.push(parts.join(',\n') + ';');
            lines.push('');
        }
    }

    // Relation 定義
    const relationNodes = topoSort(nodes.filter((n) => n.data.typeDBType === 'relation'));
    if (relationNodes.length > 0) {
        lines.push('  # Relation 定義');
        for (const node of relationNodes) {
            const parentId = subMap.get(node.id);
            const parentNode = parentId ? nodes.find((n) => n.id === parentId) : undefined;
            const subTarget = parentNode ? parentNode.data.label : 'relation';
            const isAbstract = node.data.isAbstract ? ', abstract' : '';

            const parts: string[] = [];
            const relates = relatesMap.get(node.id) ?? [];
            const owns = ownsMap.get(node.id) ?? [];

            parts.push(`  ${node.data.label} sub ${subTarget}${isAbstract}`);
            for (const role of relates) parts.push(`    relates ${role}`);
            for (const attr of owns) parts.push(`    owns ${attr}`);

            lines.push(parts.join(',\n') + ';');
            lines.push('');
        }
    }

    const typeql = lines.join('\n').trimEnd();

    if (options?.includeWarnings) return { typeql, warnings };
    return typeql;
}