// src/lib/connectionRules.test.ts
// isValidTypeDBConnection の failed test
// ← src/lib/connectionRules.ts が未実装なので全件 fail する

import { describe, it, expect } from 'vitest';
import { isValidTypeDBConnection } from './connectionRules';
import type { Connection, Node as FlowNode } from '@xyflow/react';
import type { TypeDBNodeData } from '@/types';

// -----------------------------------------------
// テスト用ノードファクトリ
// -----------------------------------------------
const makeNode = (
    id: string,
    typeDBType: TypeDBNodeData['typeDBType']
): FlowNode<TypeDBNodeData> => ({
    id,
    data: { label: id, typeDBType, isAbstract: false },
    position: { x: 0, y: 0 },
    type: typeDBType,
});

const makeConnection = (source: string, target: string): Connection => ({
    source,
    target,
    sourceHandle: null,
    targetHandle: null,
});

const nodes: FlowNode<TypeDBNodeData>[] = [
    makeNode('entity-1', 'entity'),
    makeNode('entity-2', 'entity'),
    makeNode('relation-1', 'relation'),
    makeNode('relation-2', 'relation'),
    makeNode('attribute-1', 'attribute'),
    makeNode('attribute-2', 'attribute'),
];

// -----------------------------------------------
// 許可されるケース
// -----------------------------------------------
describe('isValidTypeDBConnection: 許可されるケース', () => {
    it('Entity → Relation が許可されること（plays）', () => {
        expect(
            isValidTypeDBConnection(makeConnection('entity-1', 'relation-1'), nodes)
        ).toBe(true);
    });

    it('Entity → Attribute が許可されること（owns）', () => {
        expect(
            isValidTypeDBConnection(makeConnection('entity-1', 'attribute-1'), nodes)
        ).toBe(true);
    });

    it('Relation → Relation が許可されること（nested relation）', () => {
        expect(
            isValidTypeDBConnection(makeConnection('relation-1', 'relation-2'), nodes)
        ).toBe(true);
    });

    it('Relation → Attribute が許可されること（owns）', () => {
        expect(
            isValidTypeDBConnection(makeConnection('relation-1', 'attribute-1'), nodes)
        ).toBe(true);
    });
});

// -----------------------------------------------
// 拒否されるケース
// -----------------------------------------------
describe('isValidTypeDBConnection: 拒否されるケース', () => {
    it('Entity → Entity が拒否されること', () => {
        expect(
            isValidTypeDBConnection(makeConnection('entity-1', 'entity-2'), nodes)
        ).toBe(false);
    });

    it('Attribute → Entity が拒否されること', () => {
        expect(
            isValidTypeDBConnection(makeConnection('attribute-1', 'entity-1'), nodes)
        ).toBe(false);
    });

    it('Attribute → Relation が拒否されること', () => {
        expect(
            isValidTypeDBConnection(makeConnection('attribute-1', 'relation-1'), nodes)
        ).toBe(false);
    });

    it('Attribute → Attribute が拒否されること', () => {
        expect(
            isValidTypeDBConnection(makeConnection('attribute-1', 'attribute-2'), nodes)
        ).toBe(false);
    });

    it('自己ループが拒否されること', () => {
        expect(
            isValidTypeDBConnection(makeConnection('entity-1', 'entity-1'), nodes)
        ).toBe(false);
    });

    it('source ノードが見つからない場合が拒否されること', () => {
        expect(
            isValidTypeDBConnection(makeConnection('ghost', 'entity-1'), nodes)
        ).toBe(false);
    });

    it('target ノードが見つからない場合が拒否されること', () => {
        expect(
            isValidTypeDBConnection(makeConnection('entity-1', 'ghost'), nodes)
        ).toBe(false);
    });
});