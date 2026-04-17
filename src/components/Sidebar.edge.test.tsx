// src/components/Sidebar.edge.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import type { Node, Edge } from '@xyflow/react';
import type { TypeDBNodeData, TypeDBEdgeData } from '@/types';

const mockEdge: Edge<TypeDBEdgeData> = {
    id: 'e-1',
    source: 'node-1',
    target: 'node-2',
    data: { role: 'employee' },
};

// 全 render 呼び出しで共通の必須 props をまとめたヘルパー
const defaultProps = {
    selectedNode: null as Node<TypeDBNodeData> | null,
    selectedEdge: null as Edge<TypeDBEdgeData> | null,
    deleteNode: vi.fn(),
    deleteEdge: vi.fn(),
    updateNodeLabel: vi.fn(),
    updateNodeValueType: vi.fn(),
    updateEdgeRole: vi.fn(),
    nodes: [],
    edges: [],
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Sidebar: エッジインスペクター', () => {
    it('selectedEdge が存在するときエッジインスペクターが表示されること', () => {
        render(<Sidebar {...defaultProps} selectedEdge={mockEdge} />);
        expect(screen.getByText(/edge id/i)).toBeInTheDocument();
    });

    it('ロール名入力フィールドに現在のロール名が表示されること', () => {
        render(<Sidebar {...defaultProps} selectedEdge={mockEdge} />);
        const input = screen.getByRole('textbox', { name: /role/i });
        expect(input).toHaveValue('employee');
    });

    it('Enter でロール名が確定されること', async () => {
        const mockUpdateRole = vi.fn();
        render(<Sidebar {...defaultProps} selectedEdge={mockEdge} updateEdgeRole={mockUpdateRole} />);
        const input = screen.getByRole('textbox', { name: /role/i });
        await userEvent.clear(input);
        await userEvent.type(input, 'worker');
        await userEvent.keyboard('{Enter}');
        expect(mockUpdateRole).toHaveBeenCalledWith('e-1', 'worker');
    });

    it('空文字列で Enter を押しても updateEdgeRole が呼ばれないこと', async () => {
        const mockUpdateRole = vi.fn();
        render(<Sidebar {...defaultProps} selectedEdge={mockEdge} updateEdgeRole={mockUpdateRole} />);
        const input = screen.getByRole('textbox', { name: /role/i });
        await userEvent.clear(input);
        await userEvent.keyboard('{Enter}');
        expect(mockUpdateRole).not.toHaveBeenCalled();
    });

    it('Escape でキャンセルされること', async () => {
        const mockUpdateRole = vi.fn();
        render(<Sidebar {...defaultProps} selectedEdge={mockEdge} updateEdgeRole={mockUpdateRole} />);
        const input = screen.getByRole('textbox', { name: /role/i });
        await userEvent.clear(input);
        await userEvent.type(input, 'changed');
        await userEvent.keyboard('{Escape}');
        expect(mockUpdateRole).not.toHaveBeenCalled();
        expect(input).toHaveValue('employee');
    });

    it('Delete ボタンで deleteEdge が呼ばれること', async () => {
        const mockDeleteEdge = vi.fn();
        render(<Sidebar {...defaultProps} selectedEdge={mockEdge} deleteEdge={mockDeleteEdge} />);
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
            <Sidebar {...defaultProps} selectedEdge={mockEdge} />
        );
        rerender(
            <Sidebar {...defaultProps} selectedEdge={anotherEdge} />
        );
        const input = screen.getByRole('textbox', { name: /role/i });
        expect(input).toHaveValue('employer');
    });

    it('selectedNode も selectedEdge も null のとき案内メッセージが表示されること', () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.getByText(/select a node or edge/i)).toBeInTheDocument();
    });
});