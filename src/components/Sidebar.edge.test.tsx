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
    data: { role: 'employee', edgeType: 'role' },
};

// 全 render 呼び出しで共通の必須 props をまとめたヘルパー
const defaultProps = {
    selectedNode: null as Node<TypeDBNodeData> | null,
    selectedEdge: null as Edge<TypeDBEdgeData> | null,
    deleteNode: vi.fn(),
    deleteEdge: vi.fn(),
    updateNodeLabel: vi.fn(),
    updateNodeValueType: vi.fn(),
    updateNodeAbstract: vi.fn(),
    updateEdgeRole: vi.fn(),
    nodes: [],
    edges: [],
};

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

const entityNode2: Node<TypeDBNodeData> = {
    id: 'node-entity-2',
    data: { label: 'Worker', typeDBType: 'entity', isAbstract: false },
    position: { x: 0, y: 0 },
    type: 'entity',
};

// Attribute へのエッジ（owns）
const ownsEdge: Edge<TypeDBEdgeData> = {
    id: 'e-owns',
    source: 'node-entity',
    target: 'node-attr',
    data: { role: '', edgeType: 'role' },
};

// 継承エッジ（sub）
const subEdge: Edge<TypeDBEdgeData> = {
    id: 'e-sub',
    source: 'node-entity-2',
    target: 'node-entity',
    data: { role: '', edgeType: 'sub' },
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

    it('Enter キーで確定すると updateEdgeRole が呼ばれること', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar {...defaultProps} selectedEdge={mockEdge} updateEdgeRole={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /role/i });

        await userEvent.clear(input);
        await userEvent.type(input, 'worker');
        await userEvent.keyboard('{Enter}');

        expect(mockUpdate).toHaveBeenCalledWith('e-1', 'worker');
    });

    it('Escape キーでキャンセルされること', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar {...defaultProps} selectedEdge={mockEdge} updateEdgeRole={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /role/i });

        await userEvent.clear(input);
        await userEvent.type(input, 'newrole');
        await userEvent.keyboard('{Escape}');

        expect(mockUpdate).not.toHaveBeenCalled();
        expect(input).toHaveValue('employee');
    });

    it('Delete ボタンで deleteEdge が呼ばれること', async () => {
        const mockDelete = vi.fn();
        render(<Sidebar {...defaultProps} selectedEdge={mockEdge} deleteEdge={mockDelete} />);
        await userEvent.click(screen.getByRole('button', { name: /delete/i }));
        expect(mockDelete).toHaveBeenCalledWith('e-1');
    });

    it('selectedEdge が切り替わるとロール名入力フィールドがリセットされること', () => {
        const anotherEdge: Edge<TypeDBEdgeData> = {
            id: 'e-3',
            source: 'node-2',
            target: 'node-3',
            data: { role: 'employer', edgeType: 'role' },
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
                selectedEdge={mockEdge}
                nodes={[]}
            />
        );
        expect(screen.getByRole('textbox', { name: /role/i })).toBeInTheDocument();
    });
});

describe('Sidebar: sub エッジ（継承）', () => {
    it('sub エッジ選択時に Role 入力フィールドが表示されないこと', () => {
        render(
            <Sidebar
                {...defaultProps}
                selectedEdge={subEdge}
                nodes={[entityNode, entityNode2]}
            />
        );
        expect(screen.queryByRole('textbox', { name: /role/i })).toBeNull();
    });

    it('sub エッジ選択時に Delete ボタンは表示されること', () => {
        render(
            <Sidebar
                {...defaultProps}
                selectedEdge={subEdge}
                nodes={[entityNode, entityNode2]}
            />
        );
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
});