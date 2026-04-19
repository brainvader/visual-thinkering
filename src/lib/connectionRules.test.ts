// src/lib/connectionRules.test.ts

import { describe, it, expect } from 'vitest';
import { isValidTypeDBConnection } from './connectionRules';
import type { Connection, Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';
import type { TypeDBNodeData, TypeDBEdgeData } from '@/types';

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

// plays エッジ（role）または sub エッジを生成するファクトリ
const makeEdge = (
    id: string,
    source: string,
    target: string,
    edgeType: TypeDBEdgeData['edgeType'] = 'role'
): FlowEdge<TypeDBEdgeData> => ({
    id,
    source,
    target,
    data: { role: 'employee', edgeType },
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
// 許可されるケース（既存テスト: edges=[] を追加）
// -----------------------------------------------
describe('isValidTypeDBConnection: 許可されるケース', () => {
    it('Entity → Relation が許可されること（plays）', () => {
        expect(
            isValidTypeDBConnection(makeConnection('entity-1', 'relation-1'), nodes, [])
        ).toBe(true);
    });

    it('Entity → Attribute が許可されること（owns）', () => {
        expect(
            isValidTypeDBConnection(makeConnection('entity-1', 'attribute-1'), nodes, [])
        ).toBe(true);
    });

    it('Relation → Relation が許可されること（nested relation）', () => {
        expect(
            isValidTypeDBConnection(makeConnection('relation-1', 'relation-2'), nodes, [])
        ).toBe(true);
    });

    it('Relation → Attribute が許可されること（owns）', () => {
        expect(
            isValidTypeDBConnection(makeConnection('relation-1', 'attribute-1'), nodes, [])
        ).toBe(true);
    });

    // sub エッジ: 同 typeDBType 同士の接続は継承として許可
    it('Entity → Entity が許可されること（sub）', () => {
        expect(
            isValidTypeDBConnection(makeConnection('entity-1', 'entity-2'), nodes, [])
        ).toBe(true);
    });

    it('Relation → Relation が許可されること（sub）', () => {
        expect(
            isValidTypeDBConnection(makeConnection('relation-1', 'relation-2'), nodes, [])
        ).toBe(true);
    });

    it('Attribute → Attribute が許可されること（sub）', () => {
        expect(
            isValidTypeDBConnection(makeConnection('attribute-1', 'attribute-2'), nodes, [])
        ).toBe(true);
    });
});

// -----------------------------------------------
// 拒否されるケース（既存テスト: edges=[] を追加）
// -----------------------------------------------
describe('isValidTypeDBConnection: 拒否されるケース', () => {
    it('Attribute → Entity が拒否されること', () => {
        expect(
            isValidTypeDBConnection(makeConnection('attribute-1', 'entity-1'), nodes, [])
        ).toBe(false);
    });

    it('Attribute → Relation が拒否されること', () => {
        expect(
            isValidTypeDBConnection(makeConnection('attribute-1', 'relation-1'), nodes, [])
        ).toBe(false);
    });

    it('自己ループが拒否されること', () => {
        expect(
            isValidTypeDBConnection(makeConnection('entity-1', 'entity-1'), nodes, [])
        ).toBe(false);
    });

    it('source ノードが見つからない場合が拒否されること', () => {
        expect(
            isValidTypeDBConnection(makeConnection('ghost', 'entity-1'), nodes, [])
        ).toBe(false);
    });

    it('target ノードが見つからない場合が拒否されること', () => {
        expect(
            isValidTypeDBConnection(makeConnection('entity-1', 'ghost'), nodes, [])
        ).toBe(false);
    });
});

// -----------------------------------------------
// 冗長な plays エッジの拒否（新規テスト）
//
// 構造:
//   person ──plays──► employment
//     ↑ sub                ↑ sub
//   worker          contract-employment
// -----------------------------------------------
describe('isValidTypeDBConnection: 冗長な plays エッジの拒否', () => {
    // テスト用ノード
    const person = makeNode('person', 'entity');
    const worker = makeNode('worker', 'entity');
    const employment = makeNode('employment', 'relation');
    const contractEmployment = makeNode('contract-employment', 'relation');

    // person → employment の plays エッジ
    const playsEdge = makeEdge('e-plays', 'person', 'employment', 'role');
    // worker sub person の sub エッジ（source=親, target=子）
    const subWorker = makeEdge('e-sub-worker', 'person', 'worker', 'sub');
    // contract-employment sub employment の sub エッジ（source=親, target=子）
    const subContract = makeEdge('e-sub-contract', 'employment', 'contract-employment', 'sub');

    const inheritanceNodes = [person, worker, employment, contractEmployment];
    const inheritanceEdges = [playsEdge, subWorker, subContract];

    it('祖先型が既存 plays で繋がるとき子孫型の接続が拒否されること', () => {
        // worker → contract-employment は person → employment の冗長コピー
        expect(
            isValidTypeDBConnection(
                makeConnection('worker', 'contract-employment'),
                inheritanceNodes,
                inheritanceEdges
            )
        ).toBe(false);
    });

    it('接続元自身が plays 起点のとき同一 Relation への再接続が拒否されること', () => {
        // person → employment は既存エッジと完全一致（自身も祖先集合に含まれる）
        expect(
            isValidTypeDBConnection(
                makeConnection('person', 'employment'),
                inheritanceNodes,
                inheritanceEdges
            )
        ).toBe(false);
    });

    it('接続先の祖先が一致しないとき許可されること', () => {
        // worker → relation-1 は継承関係にない別の Relation → 許可
        const otherRelation = makeNode('other-relation', 'relation');
        expect(
            isValidTypeDBConnection(
                makeConnection('worker', 'other-relation'),
                [...inheritanceNodes, otherRelation],
                inheritanceEdges
            )
        ).toBe(true);
    });

    it('接続元の祖先が plays 起点でないとき許可されること', () => {
        // unrelated-entity は person と sub 関係にない → 許可
        const unrelated = makeNode('unrelated', 'entity');
        expect(
            isValidTypeDBConnection(
                makeConnection('unrelated', 'contract-employment'),
                [...inheritanceNodes, unrelated],
                inheritanceEdges
            )
        ).toBe(true);
    });

    it('plays エッジが存在しないとき通常通り許可されること', () => {
        // sub エッジのみ存在し plays なし → 型ルールのみで判定（許可）
        const subOnly = [subWorker, subContract];
        expect(
            isValidTypeDBConnection(
                makeConnection('worker', 'contract-employment'),
                inheritanceNodes,
                subOnly
            )
        ).toBe(true);
    });

    it('多段継承でも冗長接続が拒否されること', () => {
        // part-timer sub worker sub person の3段継承
        const partTimer = makeNode('part-timer', 'entity');
        // source=親(worker), target=子(part-timer)
        const subPartTimer = makeEdge('e-sub-part', 'worker', 'part-timer', 'sub');
        expect(
            isValidTypeDBConnection(
                makeConnection('part-timer', 'contract-employment'),
                [...inheritanceNodes, partTimer],
                [...inheritanceEdges, subPartTimer]
            )
        ).toBe(false);
    });
});