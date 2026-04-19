// src/store.abstract.test.ts
// updateNodeAbstract アクションと onConnect の sub エッジ判定テスト

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';

const resetStore = () => {
    useStore.setState({
        nodes: [
            { id: 'entity-1', data: { label: 'Person', typeDBType: 'entity', isAbstract: false }, position: { x: 0, y: 0 }, type: 'entity' },
            { id: 'entity-2', data: { label: 'Employee', typeDBType: 'entity', isAbstract: false }, position: { x: 100, y: 0 }, type: 'entity' },
            { id: 'relation-1', data: { label: 'Employment', typeDBType: 'relation', isAbstract: false }, position: { x: 0, y: 100 }, type: 'relation' },
            { id: 'attribute-1', data: { label: 'name', typeDBType: 'attribute', isAbstract: false }, position: { x: 0, y: 200 }, type: 'attribute' },
            { id: 'attribute-2', data: { label: 'full-name', typeDBType: 'attribute', isAbstract: false }, position: { x: 100, y: 200 }, type: 'attribute' },
        ],
        edges: [],
        narration: '',
        isDirty: false,
    });
};

// -----------------------------------------------
// updateNodeAbstract
// -----------------------------------------------
describe('store: updateNodeAbstract', () => {
    beforeEach(resetStore);

    it('isAbstract を true に更新できること', () => {
        useStore.getState().updateNodeAbstract('entity-1', true);
        const node = useStore.getState().nodes.find((n) => n.id === 'entity-1')!;
        expect(node.data.isAbstract).toBe(true);
    });

    it('isAbstract を false に戻せること', () => {
        useStore.getState().updateNodeAbstract('entity-1', true);
        useStore.getState().updateNodeAbstract('entity-1', false);
        const node = useStore.getState().nodes.find((n) => n.id === 'entity-1')!;
        expect(node.data.isAbstract).toBe(false);
    });

    it('他のノードには影響しないこと', () => {
        useStore.getState().updateNodeAbstract('entity-1', true);
        const other = useStore.getState().nodes.find((n) => n.id === 'entity-2')!;
        expect(other.data.isAbstract).toBe(false);
    });

    it('存在しない nodeId を渡してもエラーにならないこと', () => {
        expect(() => {
            useStore.getState().updateNodeAbstract('ghost-id', true);
        }).not.toThrow();
    });

    it('updateNodeAbstract 後に isDirty が true になること', () => {
        useStore.getState().updateNodeAbstract('entity-1', true);
        expect(useStore.getState().isDirty).toBe(true);
    });
});

// -----------------------------------------------
// onConnect: sub エッジの自動判定
// -----------------------------------------------
describe('store: onConnect — sub エッジの自動判定', () => {
    beforeEach(resetStore);

    it('Entity→Entity 接続のとき edgeType が "sub" になること', () => {
        useStore.getState().onConnect({
            source: 'entity-2',
            target: 'entity-1',
            sourceHandle: null,
            targetHandle: null,
        });
        const edge = useStore.getState().edges[0];
        expect(edge.data?.edgeType).toBe('sub');
    });

    it('Attribute→Attribute 接続のとき edgeType が "sub" になること', () => {
        useStore.getState().onConnect({
            source: 'attribute-2',
            target: 'attribute-1',
            sourceHandle: null,
            targetHandle: null,
        });
        const edge = useStore.getState().edges[0];
        expect(edge.data?.edgeType).toBe('sub');
    });

    it('Entity→Relation 接続のとき edgeType が "role" になること', () => {
        useStore.getState().onConnect({
            source: 'entity-1',
            target: 'relation-1',
            sourceHandle: null,
            targetHandle: null,
        });
        const edge = useStore.getState().edges[0];
        expect(edge.data?.edgeType).toBe('role');
    });

    it('Entity→Attribute 接続のとき edgeType が "role" になること', () => {
        useStore.getState().onConnect({
            source: 'entity-1',
            target: 'attribute-1',
            sourceHandle: null,
            targetHandle: null,
        });
        const edge = useStore.getState().edges[0];
        expect(edge.data?.edgeType).toBe('role');
    });

    it('sub エッジには markerEnd が設定されないこと', () => {
        useStore.getState().onConnect({
            source: 'entity-2',
            target: 'entity-1',
            sourceHandle: null,
            targetHandle: null,
        });
        const edge = useStore.getState().edges[0];
        expect(edge.markerEnd).toBeUndefined();
    });

    it('role エッジには markerEnd が設定されること', () => {
        useStore.getState().onConnect({
            source: 'entity-1',
            target: 'relation-1',
            sourceHandle: null,
            targetHandle: null,
        });
        const edge = useStore.getState().edges[0];
        expect(edge.markerEnd).toBeDefined();
    });
});