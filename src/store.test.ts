// src/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';

// -----------------------------------------------
// 各テスト前にストアを既知の状態にリセット
// -----------------------------------------------
const resetStore = () => {
    useStore.setState({
        nodes: [
            {
                id: 'node-1',
                data: { label: 'Person', typeDBType: 'entity' },
                position: { x: 0, y: 0 },
            },
            {
                id: 'node-2',
                data: { label: 'Company', typeDBType: 'entity' },
                position: { x: 100, y: 0 },
            },
        ],
        edges: [
            { id: 'e1-2', source: 'node-1', target: 'node-2', data: { role: 'employer' } },
        ],
        narration: '',
    });
};

// -----------------------------------------------
// 既存: ノード削除
// -----------------------------------------------
describe('store: deleteNode', () => {
    beforeEach(resetStore);

    it('指定した ID のノードが削除されること', () => {
        useStore.getState().deleteNode('node-1');
        const { nodes } = useStore.getState();
        expect(nodes).toHaveLength(1);
        expect(nodes[0].id).toBe('node-2');
    });

    it('ノード削除時に接続するエッジも削除されること', () => {
        useStore.getState().deleteNode('node-1');
        expect(useStore.getState().edges).toHaveLength(0);
    });

    it('存在しない ID を削除してもエラーにならないこと', () => {
        useStore.getState().deleteNode('999');
        expect(useStore.getState().nodes).toHaveLength(2);
    });
});

// -----------------------------------------------
// 新規: ノード追加（addNode）
// ← store.ts に addNode が未実装なので全件 fail する
// -----------------------------------------------
describe('store: addNode', () => {
    beforeEach(resetStore);

    it('addNode を呼ぶとノードが 1 件追加されること', () => {
        useStore.getState().addNode('entity', { x: 200, y: 200 });
        expect(useStore.getState().nodes).toHaveLength(3);
    });

    it('追加されたノードの typeDBType が引数と一致すること', () => {
        useStore.getState().addNode('relation', { x: 0, y: 0 });
        const added = useStore.getState().nodes.at(-1)!;
        expect(added.data.typeDBType).toBe('relation');
    });

    it('追加されたノードの position が引数と一致すること', () => {
        useStore.getState().addNode('attribute', { x: 123, y: 456 });
        const added = useStore.getState().nodes.at(-1)!;
        expect(added.position).toEqual({ x: 123, y: 456 });
    });

    it('追加されたノードの id が UUID v4 形式であること', () => {
        useStore.getState().addNode('entity', { x: 0, y: 0 });
        const added = useStore.getState().nodes.at(-1)!;
        // UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        expect(added.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
    });

    it('entity を追加したとき初期ラベルが "Entity" であること', () => {
        useStore.getState().addNode('entity', { x: 0, y: 0 });
        const added = useStore.getState().nodes.at(-1)!;
        expect(added.data.label).toBe('Entity');
    });

    it('relation を追加したとき初期ラベルが "Relation" であること', () => {
        useStore.getState().addNode('relation', { x: 0, y: 0 });
        const added = useStore.getState().nodes.at(-1)!;
        expect(added.data.label).toBe('Relation');
    });

    it('attribute を追加したとき初期ラベルが "Attribute" であること', () => {
        useStore.getState().addNode('attribute', { x: 0, y: 0 });
        const added = useStore.getState().nodes.at(-1)!;
        expect(added.data.label).toBe('Attribute');
    });

    it('isAbstract の初期値が false であること', () => {
        useStore.getState().addNode('entity', { x: 0, y: 0 });
        const added = useStore.getState().nodes.at(-1)!;
        expect(added.data.isAbstract).toBe(false);
    });

    it('複数回追加しても id がすべて異なること', () => {
        useStore.getState().addNode('entity', { x: 0, y: 0 });
        useStore.getState().addNode('entity', { x: 0, y: 0 });
        useStore.getState().addNode('entity', { x: 0, y: 0 });
        const ids = useStore.getState().nodes.map((n) => n.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });
});

// -----------------------------------------------
// 新規: ラベル編集（updateNodeLabel）
// ← store.ts に updateNodeLabel が未実装なので全件 fail する
// -----------------------------------------------
describe('store: updateNodeLabel', () => {
    beforeEach(resetStore);

    it('指定した nodeId のラベルが更新されること', () => {
        useStore.getState().updateNodeLabel('node-1', 'Researcher');
        const node = useStore.getState().nodes.find((n) => n.id === 'node-1')!;
        expect(node.data.label).toBe('Researcher');
    });

    it('他のノードのラベルには影響しないこと', () => {
        useStore.getState().updateNodeLabel('node-1', 'Researcher');
        const other = useStore.getState().nodes.find((n) => n.id === 'node-2')!;
        expect(other.data.label).toBe('Company');
    });

    it('存在しない nodeId を渡してもエラーにならないこと', () => {
        expect(() => {
            useStore.getState().updateNodeLabel('ghost-id', 'Ghost');
        }).not.toThrow();
    });

    it('存在しない nodeId を渡してもノード数が変わらないこと', () => {
        useStore.getState().updateNodeLabel('ghost-id', 'Ghost');
        expect(useStore.getState().nodes).toHaveLength(2);
    });

    it('typeDBType など他のフィールドは変更されないこと', () => {
        useStore.getState().updateNodeLabel('node-1', 'NewLabel');
        const node = useStore.getState().nodes.find((n) => n.id === 'node-1')!;
        expect(node.data.typeDBType).toBe('entity');
    });
});

// -----------------------------------------------
// 既存: narration
// -----------------------------------------------
describe('store: narration', () => {
    beforeEach(resetStore);

    it('setNarration でテキストが更新されること', () => {
        useStore.getState().setNarration('田中さんは研究者です。');
        expect(useStore.getState().narration).toBe('田中さんは研究者です。');
    });

    it('空文字列をセットできること', () => {
        useStore.getState().setNarration('何かテキスト');
        useStore.getState().setNarration('');
        expect(useStore.getState().narration).toBe('');
    });
});

describe('store: isDirty', () => {
    beforeEach(resetStore);

    it('初期値は false であること', () => {
        expect(useStore.getState().isDirty).toBe(false);
    });

    it('markDirty() で true になること', () => {
        useStore.getState().markDirty();
        expect(useStore.getState().isDirty).toBe(true);
    });

    it('markClean() で false に戻ること', () => {
        useStore.getState().markDirty();
        useStore.getState().markClean();
        expect(useStore.getState().isDirty).toBe(false);
    });

    it('onNodesChange で座標変更があっても isDirty は変わらないこと', () => {
        useStore.getState().markClean();
        useStore.getState().onNodesChange([
            { type: 'position', id: 'node-1', position: { x: 150, y: 100 } }
        ]);
        expect(useStore.getState().isDirty).toBe(false);
    });

    it('onConnect でエッジ接続時に isDirty が true になること', () => {
        useStore.getState().markClean();
        useStore.getState().onConnect({
            source: 'node-1',
            target: 'node-2',
            sourceHandle: null,
            targetHandle: null,
        });
        expect(useStore.getState().isDirty).toBe(true);
    });

    it('deleteEdge 後に isDirty が true になること', () => {
        useStore.getState().markClean();
        useStore.getState().deleteEdge('e1-2');
        expect(useStore.getState().isDirty).toBe(true);
    });
});