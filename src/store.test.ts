// src/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';

// 各テスト前にストアを既知の状態にリセット
const resetStore = () => {
    useStore.setState({
        nodes: [
            { id: '1', data: { label: 'Person', typeDBType: 'entity' }, position: { x: 0, y: 0 } },
            { id: '2', data: { label: 'Company', typeDBType: 'entity' }, position: { x: 100, y: 0 } },
        ],
        edges: [
            { id: 'e1-2', source: '1', target: '2', data: { role: 'employer' } },
        ],
        narration: '',
    });
};

describe('store: ノード操作', () => {
    beforeEach(resetStore);

    it('指定したIDのノードが削除されること', () => {
        useStore.getState().deleteNode('1');
        const { nodes } = useStore.getState();
        expect(nodes).toHaveLength(1);
        expect(nodes[0].id).toBe('2');
    });

    it('ノード削除時に接続するエッジも削除されること', () => {
        useStore.getState().deleteNode('1');
        const { edges } = useStore.getState();
        // ノード '1' に繋がるエッジ e1-2 も消えるはず
        expect(edges).toHaveLength(0);
    });

    it('存在しないIDを削除してもエラーにならないこと', () => {
        useStore.getState().deleteNode('999');
        expect(useStore.getState().nodes).toHaveLength(2);
    });

    it('setNodes でノードを一括置換できること', () => {
        useStore.getState().setNodes([
            { id: '99', data: { label: 'NewNode', typeDBType: 'relation' }, position: { x: 0, y: 0 } },
        ]);
        const { nodes } = useStore.getState();
        expect(nodes).toHaveLength(1);
        expect(nodes[0].id).toBe('99');
    });
});

describe('store: ナラティブ操作', () => {
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