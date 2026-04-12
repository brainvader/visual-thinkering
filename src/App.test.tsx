import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';

describe('Graph Store Logic', () => {
    // 各テストの前にストアをリセット（必要に応じて）
    beforeEach(() => {
        const { setNodes } = useStore.getState();
        setNodes([
            { id: '1', data: { label: 'Node A', typeDBType: 'entity' }, position: { x: 0, y: 0 }, type: 'entity' },
            { id: '2', data: { label: 'Node B', typeDBType: 'entity' }, position: { x: 0, y: 0 }, type: 'entity' },
        ]);
    });

    it('指定したIDのノードが正しく削除されること', () => {
        const { deleteNode } = useStore.getState();

        // ID '1' を削除
        deleteNode('1');

        const { nodes } = useStore.getState();

        // 残りは1つのはず
        expect(nodes).toHaveLength(1);
        expect(nodes[0].id).toBe('2');
    });

    it('存在しないIDを指定してもエラーにならないこと', () => {
        const { deleteNode } = useStore.getState();

        deleteNode('999');

        const { nodes } = useStore.getState();
        expect(nodes).toHaveLength(2);
    });
});