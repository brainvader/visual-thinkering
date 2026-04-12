// src/components/Sidebar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import type { Node } from '@xyflow/react';
import type { TypeDBNodeData } from '@/types';

const mockNode: Node<TypeDBNodeData> = {
    id: 'node-1',
    data: { label: 'Person', typeDBType: 'entity' },
    position: { x: 0, y: 0 },
};

describe('Sidebar', () => {
    it('ノード未選択時にガイドメッセージが表示されること', () => {
        render(<Sidebar selectedNode={null} deleteNode={vi.fn()} />);
        expect(screen.getByText(/select a node/i)).toBeInTheDocument();
    });

    it('ノード選択時にノードIDが表示されること', () => {
        render(<Sidebar selectedNode={mockNode} deleteNode={vi.fn()} />);
        expect(screen.getByText(/node-1/)).toBeInTheDocument();
    });

    it('Delete ボタンをクリックすると deleteNode が呼ばれること', async () => {
        const mockDelete = vi.fn();
        render(<Sidebar selectedNode={mockNode} deleteNode={mockDelete} />);
        await userEvent.click(screen.getByRole('button', { name: /delete/i }));
        expect(mockDelete).toHaveBeenCalledWith('node-1');
    });
});