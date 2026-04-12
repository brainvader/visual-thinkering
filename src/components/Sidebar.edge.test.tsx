// src/components/Sidebar.edge.test.tsx
// エッジインスペクターの failed test
// ← Sidebar に selectedEdge props と編集 UI が未実装なので全件 fail する

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import type { Edge } from '@xyflow/react';
import type { TypeDBEdgeData } from '@/types';

const mockEdge: Edge<TypeDBEdgeData> = {
    id: 'e-1',
    source: 'node-1',
    target: 'node-2',
    data: { role: 'employee' },
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Sidebar: エッジインスペクター', () => {
    it('selectedEdge が存在するときエッジインスペクターが表示されること', () => {
        render(
            <Sidebar
                selectedNode={null}
                selectedEdge={mockEdge}
                deleteNode={vi.fn()}
                deleteEdge={vi.fn()}
                updateNodeLabel={vi.fn()}
                updateEdgeRole={vi.fn()}
            />
        );
        // "Edge ID:" というラベルで特定する
        expect(screen.getByText(/edge id/i)).toBeInTheDocument();
    });

    it('ロール名入力フィールドに現在のロール名が表示されること', () => {
        render(
            <Sidebar
                selectedNode={null}
                selectedEdge={mockEdge}
                deleteNode={vi.fn()}
                deleteEdge={vi.fn()}
                updateNodeLabel={vi.fn()}
                updateEdgeRole={vi.fn()}
            />
        );
        const input = screen.getByRole('textbox', { name: /role/i });
        expect(input).toHaveValue('employee');
    });

    it('Enter でロール名が確定されること', async () => {
        const mockUpdateRole = vi.fn();
        render(
            <Sidebar
                selectedNode={null}
                selectedEdge={mockEdge}
                deleteNode={vi.fn()}
                deleteEdge={vi.fn()}
                updateNodeLabel={vi.fn()}
                updateEdgeRole={mockUpdateRole}
            />
        );
        const input = screen.getByRole('textbox', { name: /role/i });
        await userEvent.clear(input);
        await userEvent.type(input, 'worker');
        await userEvent.keyboard('{Enter}');
        expect(mockUpdateRole).toHaveBeenCalledWith('e-1', 'worker');
    });

    it('空文字列で Enter を押しても updateEdgeRole が呼ばれないこと', async () => {
        const mockUpdateRole = vi.fn();
        render(
            <Sidebar
                selectedNode={null}
                selectedEdge={mockEdge}
                deleteNode={vi.fn()}
                deleteEdge={vi.fn()}
                updateNodeLabel={vi.fn()}
                updateEdgeRole={mockUpdateRole}
            />
        );
        const input = screen.getByRole('textbox', { name: /role/i });
        await userEvent.clear(input);
        await userEvent.keyboard('{Enter}');
        expect(mockUpdateRole).not.toHaveBeenCalled();
    });

    it('Escape でキャンセルされること', async () => {
        const mockUpdateRole = vi.fn();
        render(
            <Sidebar
                selectedNode={null}
                selectedEdge={mockEdge}
                deleteNode={vi.fn()}
                deleteEdge={vi.fn()}
                updateNodeLabel={vi.fn()}
                updateEdgeRole={mockUpdateRole}
            />
        );
        const input = screen.getByRole('textbox', { name: /role/i });
        await userEvent.clear(input);
        await userEvent.type(input, 'changed');
        await userEvent.keyboard('{Escape}');
        expect(mockUpdateRole).not.toHaveBeenCalled();
        expect(input).toHaveValue('employee');
    });

    it('Delete ボタンで deleteEdge が呼ばれること', async () => {
        const mockDeleteEdge = vi.fn();
        render(
            <Sidebar
                selectedNode={null}
                selectedEdge={mockEdge}
                deleteNode={vi.fn()}
                deleteEdge={mockDeleteEdge}
                updateNodeLabel={vi.fn()}
                updateEdgeRole={vi.fn()}
            />
        );
        await userEvent.click(screen.getByRole('button', { name: /delete/i }));
        expect(mockDeleteEdge).toHaveBeenCalledWith('e-1');
    });

    it('selectedEdge が切り替わると入力フィールドがリセットされること', () => {
        const anotherEdge: Edge<TypeDBEdgeData> = {
            id: 'e-3',
            source: 'node-2',
            target: 'node-3',
            data: { role: 'employer' },
        };
        const { rerender } = render(
            <Sidebar
                selectedNode={null}
                selectedEdge={mockEdge}
                deleteNode={vi.fn()}
                deleteEdge={vi.fn()}
                updateNodeLabel={vi.fn()}
                updateEdgeRole={vi.fn()}
            />
        );
        rerender(
            <Sidebar
                selectedNode={null}
                selectedEdge={anotherEdge}
                deleteNode={vi.fn()}
                deleteEdge={vi.fn()}
                updateNodeLabel={vi.fn()}
                updateEdgeRole={vi.fn()}
            />
        );
        const input = screen.getByRole('textbox', { name: /role/i });
        expect(input).toHaveValue('employer');
    });

    it('selectedNode も selectedEdge も null のとき案内メッセージが表示されること', () => {
        render(
            <Sidebar
                selectedNode={null}
                selectedEdge={null}
                deleteNode={vi.fn()}
                deleteEdge={vi.fn()}
                updateNodeLabel={vi.fn()}
                updateEdgeRole={vi.fn()}
            />
        );
        expect(screen.getByText(/select a node or edge/i)).toBeInTheDocument();
    });
});