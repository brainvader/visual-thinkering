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
    // 各ノード・エッジの情報を事前に集計する
    // -----------------------------------------------

    // Entity/Relation が owns する Attribute ラベルを収集
    // key: ownerノードid, value: Attributeラベルの配列
    const ownsMap = new Map<string, string[]>();

    // Entity/Relation が plays するロール情報を収集
    // key: entityノードid, value: { relationLabel, role }[]
    const playsMap = new Map<string, { relationLabel: string; role: string }[]>();

    // Relation が relates するロール名を収集
    // key: relationノードid, value: role[]
    const relatesMap = new Map<string, string[]>();

    for (const edge of edges) {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (!sourceNode || !targetNode) continue;

        const sourceType = sourceNode.data.typeDBType;
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
                continue; // ロール名なしはスキップ
            }

            // plays マップに追加
            const playsList = playsMap.get(edge.source) ?? [];
            playsList.push({ relationLabel: targetNode.data.label, role });
            playsMap.set(edge.source, playsList);

            // relates マップに追加
            const relatesList = relatesMap.get(edge.target) ?? [];
            if (!relatesList.includes(role)) relatesList.push(role);
            relatesMap.set(edge.target, relatesList);
        }
    }

    // -----------------------------------------------
    // TypeQL 文字列を組み立てる
    // -----------------------------------------------
    const lines: string[] = ['define', ''];

    // Entity 定義
    const entityNodes = nodes.filter((n) => n.data.typeDBType === 'entity');
    if (entityNodes.length > 0) {
        lines.push('  # Entity 定義');
        for (const node of entityNodes) {
            const parts: string[] = [];
            const owns = ownsMap.get(node.id) ?? [];
            const plays = playsMap.get(node.id) ?? [];

            parts.push(`  ${node.data.label} sub entity`);
            for (const attr of owns) parts.push(`    owns ${attr}`);
            for (const p of plays) parts.push(`    plays ${p.relationLabel}:${p.role}`);

            lines.push(parts.join(',\n') + ';');
            lines.push('');
        }
    }

    // Relation 定義
    const relationNodes = nodes.filter((n) => n.data.typeDBType === 'relation');
    if (relationNodes.length > 0) {
        lines.push('  # Relation 定義');
        for (const node of relationNodes) {
            const parts: string[] = [];
            const relates = relatesMap.get(node.id) ?? [];
            const owns = ownsMap.get(node.id) ?? [];

            parts.push(`  ${node.data.label} sub relation`);
            for (const role of relates) parts.push(`    relates ${role}`);
            for (const attr of owns) parts.push(`    owns ${attr}`);

            lines.push(parts.join(',\n') + ';');
            lines.push('');
        }
    }

    // Attribute 定義
    const attributeNodes = nodes.filter((n) => n.data.typeDBType === 'attribute');
    if (attributeNodes.length > 0) {
        lines.push('  # Attribute 定義');
        for (const node of attributeNodes) {
            // value 型は将来 TypeDBNodeData に追加予定。現状は string をデフォルトとする
            lines.push(`  ${node.data.label} sub attribute, value string;`);
        }
        lines.push('');
    }

    const typeql = lines.join('\n').trimEnd();

    if (options?.includeWarnings) return { typeql, warnings };
    return typeql;
}