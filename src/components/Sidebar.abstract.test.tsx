// src/components/Sidebar.abstract.test.tsx
// isAbstract チェックボックスのテスト

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import type { Node, Edge } from '@xyflow/react';
import type { TypeDBNodeData, TypeDBEdgeData } from '@/types';

const makeNode = (isAbstract: boolean): Node<TypeDBNodeData> => ({
    id: 'node-1',
    data: { label: 'Person', typeDBType: 'entity', isAbstract },
    position: { x: 0, y: 0 },
});

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

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Sidebar: Abstract チェックボックス', () => {
    it('ノード選択時に Abstract チェックボックスが表示されること', () => {
        render(<Sidebar {...defaultProps} selectedNode={makeNode(false)} />);
        expect(screen.getByRole('checkbox', { name: /abstract/i })).toBeInTheDocument();
    });

    it('isAbstract=false のときチェックボックスが未チェックであること', () => {
        render(<Sidebar {...defaultProps} selectedNode={makeNode(false)} />);
        expect(screen.getByRole('checkbox', { name: /abstract/i })).not.toBeChecked();
    });

    it('isAbstract=true のときチェックボックスがチェック済みであること', () => {
        render(<Sidebar {...defaultProps} selectedNode={makeNode(true)} nodes={[makeNode(true)]} />);
        expect(screen.getByRole('checkbox', { name: /abstract/i })).toBeChecked();
    });

    it('チェックボックスをクリックすると updateNodeAbstract が呼ばれること', async () => {
        const mockUpdate = vi.fn();
        render(
            <Sidebar
                {...defaultProps}
                selectedNode={makeNode(false)}
                updateNodeAbstract={mockUpdate}
            />
        );
        await userEvent.click(screen.getByRole('checkbox', { name: /abstract/i }));
        expect(mockUpdate).toHaveBeenCalledWith('node-1', true);
    });

    it('チェック済みをクリックすると false で呼ばれること', async () => {
        const mockUpdate = vi.fn();
        render(
            <Sidebar
                {...defaultProps}
                selectedNode={makeNode(true)}
                nodes={[makeNode(true)]}
                updateNodeAbstract={mockUpdate}
            />
        );
        await userEvent.click(screen.getByRole('checkbox', { name: /abstract/i }));
        expect(mockUpdate).toHaveBeenCalledWith('node-1', false);
    });

    it('ノード未選択時は Abstract チェックボックスが表示されないこと', () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.queryByRole('checkbox', { name: /abstract/i })).toBeNull();
    });
});