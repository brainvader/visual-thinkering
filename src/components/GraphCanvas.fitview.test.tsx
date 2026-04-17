// src/components/GraphCanvas.fitview.test.tsx
//
// fitView の起動時挙動を検証する。
// ノード0件のとき hasFitView フラグが立たないことを確認するバグ再現テスト。
//
// モック戦略:
//   @xyflow/react の useNodesInitialized / useReactFlow を差し替えて
//   GraphCanvasInner の副作用だけを純粋にテストする。

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// useNodesInitialized と fitView のモック関数
const mockFitView = vi.fn();
let mockNodesInitialized = false;

vi.mock('@xyflow/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@xyflow/react')>();
    return {
        ...actual,
        ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        ReactFlow: ({ children }: { children?: React.ReactNode }) => (
            <div data-testid="react-flow-mock">{children}</div>
        ),
        Background: () => null,
        Controls: () => null,
        MiniMap: () => null,
        Panel: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
        Handle: () => null,
        useReactFlow: () => ({
            screenToFlowPosition: vi.fn(),
            fitView: mockFitView,
        }),
        useViewport: () => ({ x: 0, y: 0, zoom: 1 }),
        // nodesInitialized はテストごとに差し替える
        useNodesInitialized: () => mockNodesInitialized,
        ConnectionMode: { Loose: 'loose' },
        BackgroundVariant: { Dots: 'dots' },
        Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
    };
});

// GraphCanvas 内で使う hooks・ライブラリをモック
vi.mock('@/hooks/useOwnershipBounds', () => ({
    useOwnershipBounds: () => null,
}));

vi.mock('@/lib/connectionRules', () => ({
    isValidTypeDBConnection: () => true,
}));

// GraphCanvas をモック後にインポート
import { GraphCanvas } from './GraphCanvas';
import type { Node, Edge } from '@xyflow/react';
import type { TypeDBNodeData, TypeDBEdgeData } from '@/types';

// テスト用ノードファクトリ
const makeNode = (id: string): Node<TypeDBNodeData> => ({
    id,
    type: 'entity',
    position: { x: 0, y: 0 },
    data: { label: 'Person', typeDBType: 'entity', isAbstract: false },
});

const defaultProps = {
    nodes: [] as Node<TypeDBNodeData>[],
    edges: [] as Edge<TypeDBEdgeData>[],
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onConnect: vi.fn(),
    onNodeClick: vi.fn(),
    onEdgeClick: vi.fn(),
    onPaneClick: vi.fn(),
    selectedNode: null,
    deleteNode: vi.fn(),
    deleteEdge: vi.fn(),
    addNode: vi.fn().mockReturnValue('new-id'),
    onNodeAdded: vi.fn(),
    // viewport / setViewport を追加
    viewport: { x: 0, y: 0, zoom: 1 },
    setViewport: vi.fn(),
};

beforeEach(() => {
    mockFitView.mockClear();
    mockNodesInitialized = false;
});

describe('GraphCanvas: 起動時 fitView', () => {
    it('ノード0件のとき nodesInitialized が true になっても fitView を呼ばないこと', () => {
        // ノード0件 + initialized = true → fitView は呼ばれないはず
        mockNodesInitialized = true;

        render(<GraphCanvas {...defaultProps} nodes={[]} />);

        expect(mockFitView).not.toHaveBeenCalled();
    });

    it('ノードあり + nodesInitialized=true のとき fitView を1回だけ呼ぶこと', () => {
        mockNodesInitialized = true;

        render(<GraphCanvas {...defaultProps} nodes={[makeNode('n1')]} />);

        expect(mockFitView).toHaveBeenCalledTimes(1);
        expect(mockFitView).toHaveBeenCalledWith({ padding: 0.5 });
    });

    it('nodesInitialized=false のときは fitView を呼ばないこと', () => {
        mockNodesInitialized = false;

        render(<GraphCanvas {...defaultProps} nodes={[makeNode('n1')]} />);

        expect(mockFitView).not.toHaveBeenCalled();
    });
});