// src/store.edge.test.ts
// エッジ操作（updateEdgeRole / deleteEdge）の failed test
// ← store.ts に updateEdgeRole / deleteEdge が未実装なので全件 fail する

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';

const resetStore = () => {
    useStore.setState({
        nodes: [
            { id: 'node-1', data: { label: 'Person', typeDBType: 'entity' }, position: { x: 0, y: 0 }, type: 'entity' },
            { id: 'node-2', data: { label: 'Employment', typeDBType: 'relation' }, position: { x: 100, y: 0 }, type: 'relation' },
            { id: 'node-3', data: { label: 'Company', typeDBType: 'entity' }, position: { x: 200, y: 0 }, type: 'entity' },
        ],
        edges: [
            { id: 'e1', source: 'node-1', target: 'node-2', data: { role: 'employee' } },
            { id: 'e2', source: 'node-3', target: 'node-2', data: { role: 'employer' } },
        ],
        narration: '',
    });
};

describe('store: updateEdgeRole', () => {
    beforeEach(resetStore);

    it('指定した edgeId のロール名が更新されること', () => {
        useStore.getState().updateEdgeRole('e1', 'worker');
        const edge = useStore.getState().edges.find((e) => e.id === 'e1')!;
        expect(edge.data?.role).toBe('worker');
    });

    it('他のエッジには影響しないこと', () => {
        useStore.getState().updateEdgeRole('e1', 'worker');
        const other = useStore.getState().edges.find((e) => e.id === 'e2')!;
        expect(other.data?.role).toBe('employer');
    });

    it('存在しない edgeId を渡してもエラーにならないこと', () => {
        expect(() => {
            useStore.getState().updateEdgeRole('ghost-id', 'role');
        }).not.toThrow();
    });

    it('存在しない edgeId を渡してもエッジ数が変わらないこと', () => {
        useStore.getState().updateEdgeRole('ghost-id', 'role');
        expect(useStore.getState().edges).toHaveLength(2);
    });

    it('role 以外のフィールドは変更されないこと', () => {
        useStore.getState().updateEdgeRole('e1', 'worker');
        const edge = useStore.getState().edges.find((e) => e.id === 'e1')!;
        expect(edge.source).toBe('node-1');
        expect(edge.target).toBe('node-2');
    });
});

describe('store: deleteEdge', () => {
    beforeEach(resetStore);

    it('指定した edgeId のエッジが削除されること', () => {
        useStore.getState().deleteEdge('e1');
        expect(useStore.getState().edges).toHaveLength(1);
        expect(useStore.getState().edges[0].id).toBe('e2');
    });

    it('ノードは削除されないこと', () => {
        useStore.getState().deleteEdge('e1');
        expect(useStore.getState().nodes).toHaveLength(3);
    });

    it('存在しない edgeId を渡してもエラーにならないこと', () => {
        expect(() => {
            useStore.getState().deleteEdge('ghost-id');
        }).not.toThrow();
    });

    it('存在しない edgeId を渡してもエッジ数が変わらないこと', () => {
        useStore.getState().deleteEdge('ghost-id');
        expect(useStore.getState().edges).toHaveLength(2);
    });
});