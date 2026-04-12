// src/lib/typeql.test.ts
import { describe, it, expect } from 'vitest';
import { generateTypeQL } from './typeql';
import type { Node, Edge } from '@xyflow/react';
import type { TypeDBNodeData, TypeDBEdgeData } from '@/types';

// テスト用ノード・エッジのファクトリ
const makeNode = (id: string, label: string, typeDBType: TypeDBNodeData['typeDBType']): Node<TypeDBNodeData> => ({
    id,
    data: { label, typeDBType },
    position: { x: 0, y: 0 },
});

const makeEdge = (id: string, source: string, target: string, role: string): Edge<TypeDBEdgeData> => ({
    id,
    source,
    target,
    data: { role },
});

describe('generateTypeQL', () => {
    it('entity ノードから define 文が生成されること', () => {
        const nodes = [makeNode('1', 'Person', 'entity')];
        const result = generateTypeQL(nodes, []);
        expect(result).toContain('define Person sub entity;');
    });

    it('relation ノードから define 文が生成されること', () => {
        const nodes = [makeNode('1', 'Employment', 'relation')];
        const result = generateTypeQL(nodes, []);
        expect(result).toContain('define Employment sub relation');
    });

    it('relation にエッジが繋がるとロールが含まれること', () => {
        const nodes = [
            makeNode('1', 'Person', 'entity'),
            makeNode('2', 'Employment', 'relation'),
        ];
        const edges = [makeEdge('e1', '1', '2', 'employee')];
        const result = generateTypeQL(nodes, edges);
        expect(result).toContain('relates employee');
    });

    it('entity の plays 文が生成されること', () => {
        const nodes = [
            makeNode('1', 'Person', 'entity'),
            makeNode('2', 'Employment', 'relation'),
        ];
        const edges = [makeEdge('e1', '1', '2', 'employee')];
        const result = generateTypeQL(nodes, edges);
        expect(result).toContain('Person plays Employment:employee');
    });

    it('ノードもエッジも空のとき空文字列に近い結果を返すこと', () => {
        const result = generateTypeQL([], []);
        // 空行のみで実質空
        expect(result.trim()).toBe('');
    });
});