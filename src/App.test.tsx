import { describe, it, expect } from 'vitest';

// 将来的にロジックファイルへ切り出す想定の関数
const deleteNodeLogic = (nodes: any[], idToDelete: string) => {
    return nodes.filter((n) => n.id !== idToDelete);
};

describe('Graph Logic Test', () => {
    it('ノード削除の検証（わざと失敗させる）', () => {
        const mockNodes = [
            { id: '1', data: { label: 'Node A' } },
            { id: '2', data: { label: 'Node B' } },
        ];

        const result = deleteNodeLogic(mockNodes, '1');

        // 本来は result.length は 1 ですが、
        // テストが正しく動いている（失敗を検知できる）か確認するために 5 を期待させます
        expect(result).toHaveLength(5);
    });
});