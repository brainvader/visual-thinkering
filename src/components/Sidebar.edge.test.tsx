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

// テストデータ追加
const attributeNode: Node<TypeDBNodeData> = {
    id: 'node-attr',
    data: { label: 'name', typeDBType: 'attribute', isAbstract: false },
    position: { x: 0, y: 0 },
    type: 'attribute',
};

const entityNode: Node<TypeDBNodeData> = {
    id: 'node-entity',
    data: { label: 'Person', typeDBType: 'entity', isAbstract: false },
    position: { x: 0, y: 0 },
    type: 'entity',
};

// Attribute へのエッジ（owns）
const ownsEdge: Edge<TypeDBEdgeData> = {
    id: 'e-owns',
    source: 'node-entity',
    target: 'node-attr',
    data: { role: '' },
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


describe('Sidebar: owns エッジ（Attribute への接続）', () => {
    it('接続先が Attribute のとき Role 入力フィールドが表示されないこと', () => {
        render(
            <Sidebar
                {...defaultProps}
                selectedEdge={ownsEdge}
                nodes={[entityNode, attributeNode]}
            />
        );
        expect(screen.queryByRole('textbox', { name: /role/i })).toBeNull();
    });

    it('接続先が Attribute のとき Delete ボタンは表示されること', () => {
        render(
            <Sidebar
                {...defaultProps}
                selectedEdge={ownsEdge}
                nodes={[entityNode, attributeNode]}
            />
        );
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('接続先が Relation のとき Role 入力フィールドが表示されること', () => {
        render(
            <Sidebar
                {...defaultProps}
                selectedEdge={mockEdge} // target: node-2 は nodes に含まれないため entity 扱い
                nodes={[]}
            />
        );
        expect(screen.getByRole('textbox', { name: /role/i })).toBeInTheDocument();
    });
});