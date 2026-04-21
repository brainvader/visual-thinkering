import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { GraphCanvas } from './GraphCanvas';
import { useStore } from '@/store';
import { ReactFlowProvider } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import type { TypeDBNodeData, TypeDBEdgeData } from '@/types';

// react-resizable-panels をモック
vi.mock('react-resizable-panels', () => ({
    PanelGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PanelResizeHandle: () => null,
}));

// ResizablePanel をモック
vi.mock('@/components/ui/resizable', () => ({
    ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ResizablePanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ResizableHandle: () => null,
}));

const createMockNode = (id: string, label: string, type: 'entity' | 'relation' | 'attribute'): Node<TypeDBNodeData> => ({
    id,
    type,
    position: { x: 0, y: 0 },
    data: {
        label,
        typeDBType: type,
        isAbstract: false,
    },
});

describe('GraphCanvas: onNodeDragStop', () => {
    beforeEach(() => {
        useStore.setState({
            nodes: [createMockNode('node-1', 'Entity', 'entity')],
            edges: [],
            isDirty: false,
        });
    });

    it('onNodeDragStop ハンドラが提供されていること', () => {
        const mockNodes: Node<TypeDBNodeData>[] = [createMockNode('node-1', 'Entity', 'entity')];
        const mockEdges: Edge<TypeDBEdgeData>[] = [];

        const props = {
            nodes: mockNodes,
            edges: mockEdges,
            onNodesChange: vi.fn(),
            onEdgesChange: vi.fn(),
            onConnect: vi.fn(),
            onNodeClick: vi.fn(),
            onEdgeClick: vi.fn(),
            onPaneClick: vi.fn(),
            selectedNode: null,
            deleteNode: vi.fn(),
            deleteEdge: vi.fn(),
            addNode: vi.fn(),
            viewport: { x: 0, y: 0, zoom: 1 },
            setViewport: vi.fn(),
        };

        useStore.getState().markClean();
        expect(useStore.getState().isDirty).toBe(false);

        const { container } = render(
            <ReactFlowProvider>
                <GraphCanvas {...props} />
            </ReactFlowProvider>
        );

        expect(container).toBeTruthy();
    });
});

describe('GraphCanvas: isDirty 管理', () => {
    beforeEach(() => {
        useStore.setState({
            nodes: [
                createMockNode('node-1', 'Entity', 'entity'),
                createMockNode('node-2', 'Relation', 'relation'),
            ],
            edges: [],
            isDirty: false,
        });
    });

    it('ノード追加後に isDirty が true になること', () => {
        useStore.getState().addNode('attribute', { x: 100, y: 100 });
        expect(useStore.getState().isDirty).toBe(true);
    });

    it('ノード削除後に isDirty が true になること', () => {
        useStore.getState().markClean();
        useStore.getState().deleteNode('node-1');
        expect(useStore.getState().isDirty).toBe(true);
    });

    it('エッジ接続後に isDirty が true になること', () => {
        useStore.getState().markClean();
        useStore.getState().onConnect({
            source: 'node-1',
            target: 'node-2',
            sourceHandle: null,
            targetHandle: null,
        });
        expect(useStore.getState().isDirty).toBe(true);
    });

    it('ラベル更新後に isDirty が true になること', () => {
        useStore.getState().markClean();
        useStore.getState().updateNodeLabel('node-1', 'NewLabel');
        expect(useStore.getState().isDirty).toBe(true);
    });
});

describe('GraphCanvas: onNodesChange', () => {
    beforeEach(() => {
        useStore.setState({
            nodes: [createMockNode('node-1', 'Entity', 'entity')],
            edges: [],
            isDirty: false,
        });
    });

    it('onNodesChange で座標変更があっても isDirty は true にならないこと', () => {
        useStore.getState().markClean();
        useStore.getState().onNodesChange([
            { type: 'position', id: 'node-1', position: { x: 100, y: 100 } }
        ]);
        expect(useStore.getState().isDirty).toBe(false);
    });

    it('onNodesChange で選択フラグ変更があっても isDirty は true にならないこと', () => {
        useStore.getState().markClean();
        useStore.getState().onNodesChange([
            { type: 'select', id: 'node-1', selected: true }
        ]);
        expect(useStore.getState().isDirty).toBe(false);
    });
});