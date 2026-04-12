// src/App.edge.integration.test.tsx
// エッジ操作の統合テスト（failed tests）
// ← App.tsx に onEdgeClick / selectedEdge が未実装なので全件 fail する

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useStore } from './store';
import type { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';
import type { TypeDBNodeData, TypeDBEdgeData, TypeDBMetaType } from '@/types';

// react-resizable-panels モック
vi.mock('react-resizable-panels', () => ({
    PanelGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PanelResizeHandle: () => null,
}));
vi.mock('@/components/ui/resizable', () => ({
    ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ResizablePanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ResizableHandle: () => null,
}));
vi.mock('./components/NarrationPanel', () => ({
    NarrationPanel: () => <div data-testid="narration-panel-mock" />,
}));
vi.mock('./components/LLMAssistant', () => ({
    LLMAssistant: () => <div data-testid="llm-assistant-mock" />,
}));

// GraphCanvas モック — onEdgeClick も追加でキャプチャ
type GraphCanvasCallbacks = {
    onNodeClick: (node: FlowNode<TypeDBNodeData>) => void;
    onPaneClick: () => void;
    deleteNode: (id: string) => void;
    addNode: (type: TypeDBMetaType, position: { x: number; y: number }) => string;
    onNodeAdded: (nodeId: string) => void;
    onEdgeClick: (edge: FlowEdge<TypeDBEdgeData>) => void;
};

let capturedCallbacks: GraphCanvasCallbacks | null = null;

vi.mock('./components/GraphCanvas', () => ({
    GraphCanvas: (props: {
        onNodeClick: (e: unknown, node: FlowNode<TypeDBNodeData>) => void;
        onPaneClick: () => void;
        deleteNode: (id: string) => void;
        addNode: (type: TypeDBMetaType, position: { x: number; y: number }) => string;
        onNodeAdded?: (nodeId: string) => void;
        onEdgeClick?: (e: unknown, edge: FlowEdge<TypeDBEdgeData>) => void;
    }) => {
        capturedCallbacks = {
            onNodeClick: (node) => props.onNodeClick({} as unknown, node),
            onPaneClick: props.onPaneClick,
            deleteNode: props.deleteNode,
            addNode: props.addNode,
            onNodeAdded: props.onNodeAdded ?? (() => { }),
            onEdgeClick: (edge) => props.onEdgeClick?.({} as unknown, edge),
        };
        return <div data-testid="graph-canvas-mock" />;
    },
}));

const makeNode = (id: string, label: string): FlowNode<TypeDBNodeData> => ({
    id,
    data: { label, typeDBType: 'entity', isAbstract: false },
    position: { x: 0, y: 0 },
    type: 'entity',
});

const makeEdge = (id: string, role: string): FlowEdge<TypeDBEdgeData> => ({
    id,
    source: 'node-1',
    target: 'node-2',
    data: { role },
});

beforeEach(() => {
    capturedCallbacks = null;
    useStore.setState({
        nodes: [makeNode('node-1', 'Person'), makeNode('node-2', 'Employment')],
        edges: [makeEdge('edge-1', 'employee')],
        narration: '',
    });
});

describe('App: エッジ操作の統合テスト', () => {
    it('エッジクリック後に Sidebar にエッジインスペクターが表示されること', async () => {
        render(<App />);

        act(() => {
            capturedCallbacks!.onEdgeClick(makeEdge('edge-1', 'employee'));
        });

        // エッジインスペクターが表示される
        expect(await screen.findByRole('textbox', { name: /role/i })).toBeInTheDocument();
    });

    it('エッジクリック時にノードの選択が解除されること', async () => {
        render(<App />);

        // まずノードを選択
        act(() => {
            capturedCallbacks!.onNodeClick(makeNode('node-1', 'Person'));
        });
        await screen.findByRole('textbox', { name: /label/i });

        // エッジをクリック
        act(() => {
            capturedCallbacks!.onEdgeClick(makeEdge('edge-1', 'employee'));
        });

        // ノードインスペクターが消えてエッジインスペクターに切り替わる
        expect(screen.queryByRole('textbox', { name: /label/i })).toBeNull();
        expect(await screen.findByRole('textbox', { name: /role/i })).toBeInTheDocument();
    });

    it('エッジ削除後に Sidebar が閉じること', async () => {
        render(<App />);

        act(() => {
            capturedCallbacks!.onEdgeClick(makeEdge('edge-1', 'employee'));
        });
        await screen.findByRole('textbox', { name: /role/i });

        await userEvent.click(screen.getByRole('button', { name: /delete/i }));

        expect(screen.getByText(/select a node or edge/i)).toBeInTheDocument();
        expect(useStore.getState().edges).toHaveLength(0);
    });

    it('pane クリックでエッジの選択が解除されること', async () => {
        render(<App />);

        act(() => {
            capturedCallbacks!.onEdgeClick(makeEdge('edge-1', 'employee'));
        });
        await screen.findByRole('textbox', { name: /role/i });

        act(() => {
            capturedCallbacks!.onPaneClick();
        });

        expect(screen.getByText(/select a node or edge/i)).toBeInTheDocument();
    });
});