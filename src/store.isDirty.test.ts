// src/store.isDirty.test.ts
//
// isDirty フラグのテスト（Red → Green）
// 編集操作で dirty になり、保存・読み込みで clean に戻ることを検証する

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';

beforeEach(() => {
    useStore.setState({
        nodes: [
            {
                id: 'node-1',
                data: { label: 'Person', typeDBType: 'entity', isAbstract: false },
                position: { x: 0, y: 0 },
                type: 'entity',
            },
            {
                id: 'node-2',
                data: { label: 'Relation', typeDBType: 'relation', isAbstract: false },
                position: { x: 100, y: 0 },
                type: 'relation',
            },
        ],
        edges: [],
        narration: '',
        isDirty: false,
    });
});

describe('store: isDirty の初期値', () => {
    it('初期値は false であること', () => {
        expect(useStore.getState().isDirty).toBe(false);
    });
});

describe('store: markDirty / markClean', () => {
    it('markDirty() を呼ぶと true になること', () => {
        useStore.getState().markDirty();
        expect(useStore.getState().isDirty).toBe(true);
    });

    it('markClean() を呼ぶと false に戻ること', () => {
        useStore.getState().markDirty();
        useStore.getState().markClean();
        expect(useStore.getState().isDirty).toBe(false);
    });
});

describe('store: 編集アクションで isDirty が true になること', () => {
    it('addNode 後に true になること', () => {
        useStore.getState().addNode('attribute', { x: 200, y: 0 });
        expect(useStore.getState().isDirty).toBe(true);
    });

    it('deleteNode 後に true になること', () => {
        useStore.getState().deleteNode('node-1');
        expect(useStore.getState().isDirty).toBe(true);
    });

    it('updateNodeLabel 後に true になること', () => {
        useStore.getState().updateNodeLabel('node-1', 'Employee');
        expect(useStore.getState().isDirty).toBe(true);
    });

    it('updateNodeValueType 後に true になること', () => {
        useStore.getState().updateNodeValueType('node-1', 'string');
        expect(useStore.getState().isDirty).toBe(true);
    });

    it('onConnect 後に true になること', () => {
        useStore.getState().onConnect({
            source: 'node-1',
            target: 'node-2',
            sourceHandle: null,
            targetHandle: null,
        });
        expect(useStore.getState().isDirty).toBe(true);
    });

    it('updateEdgeRole 後に true になること', () => {
        // エッジを事前に追加する
        useStore.getState().onConnect({
            source: 'node-1',
            target: 'node-2',
            sourceHandle: null,
            targetHandle: null,
        });
        useStore.getState().markClean(); // 一度クリーンに戻す

        const edgeId = useStore.getState().edges[0].id;
        useStore.getState().updateEdgeRole(edgeId, 'employee');
        expect(useStore.getState().isDirty).toBe(true);
    });

    it('deleteEdge 後に true になること', () => {
        // エッジを事前に追加する
        useStore.getState().onConnect({
            source: 'node-1',
            target: 'node-2',
            sourceHandle: null,
            targetHandle: null,
        });
        useStore.getState().markClean(); // 一度クリーンに戻す

        const edgeId = useStore.getState().edges[0].id;
        useStore.getState().deleteEdge(edgeId);
        expect(useStore.getState().isDirty).toBe(true);
    });

    it('setNarration 後に true になること', () => {
        useStore.getState().setNarration('田中さんは研究者です。');
        expect(useStore.getState().isDirty).toBe(true);
    });
});