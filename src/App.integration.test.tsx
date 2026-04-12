// src/App.integration.test.tsx
//
// 統合テストの目的:
//   ユニットテストでは発見できない「コンポーネント間のつなぎ目」を検証する。
//   具体的には App.tsx が各コンポーネントに正しく props を接続しているかを確認する。
//
// モック戦略:
//   GraphCanvas は React Flow に強く依存しているため、
//   テスト用の薄いモックに差し替えて onNodeClick / onNodeAdded / deleteNode を
//   直接呼び出せるようにする。
//   これにより App.tsx のロジック（selectedNode の管理）だけを純粋にテストできる。

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useStore } from './store';
import type { Node as FlowNode } from '@xyflow/react';
import type { TypeDBNodeData, TypeDBMetaType } from '@/types';

// -----------------------------------------------
// GraphCanvas モック
// テスト内から onNodeClick / onNodeAdded / deleteNode を
// 呼び出せるようにするためのコールバック参照
// -----------------------------------------------
type GraphCanvasCallbacks = {
    onNodeClick: (node: FlowNode<TypeDBNodeData>) => void;
    onPaneClick: () => void;
    deleteNode: (id: string) => void;
    addNode: (type: TypeDBMetaType, position: { x: number; y: number }) => string;
    onNodeAdded: (nodeId: string) => void;
};

let capturedCallbacks: GraphCanvasCallbacks | null = null;

vi.mock('./components/GraphCanvas', () => ({
    GraphCanvas: (props: {
        onNodeClick: (e: unknown, node: FlowNode<TypeDBNodeData>) => void;
        onPaneClick: () => void;
        deleteNode: (id: string) => void;
        addNode: (type: TypeDBMetaType, position: { x: number; y: number }) => string;
        onNodeAdded?: (nodeId: string) => void;
    }) => {
        // App から渡された callbacks をキャプチャ
        capturedCallbacks = {
            onNodeClick: (node) => props.onNodeClick({} as unknown, node),
            onPaneClick: props.onPaneClick,
            deleteNode: props.deleteNode,
            addNode: props.addNode,
            onNodeAdded: props.onNodeAdded ?? (() => { }),
        };
        // キャンバスの代わりにダミー要素を表示
        return <div data-testid="graph-canvas-mock" />;
    },
}));

// NarrationPanel / LLMAssistant は今回のテスト対象外なのでシンプルにモック
vi.mock('./components/NarrationPanel', () => ({
    NarrationPanel: () => <div data-testid="narration-panel-mock" />,
}));
vi.mock('./components/LLMAssistant', () => ({
    LLMAssistant: () => <div data-testid="llm-assistant-mock" />,
}));

// -----------------------------------------------
// テスト用ノードファクトリ
// -----------------------------------------------
const makeNode = (id: string, label: string): FlowNode<TypeDBNodeData> => ({
    id,
    data: { label, typeDBType: 'entity', isAbstract: false },
    position: { x: 0, y: 0 },
    type: 'entity',
});

// -----------------------------------------------
// 各テスト前にストアとコールバックをリセット
// -----------------------------------------------
beforeEach(() => {
    capturedCallbacks = null;
    useStore.setState({
        nodes: [makeNode('node-1', 'Person')],
        edges: [],
        narration: '',
    });
});

// -----------------------------------------------
// 統合テスト
// ← App.tsx のつなぎ目ロジックが未実装・バグの場合に fail する
// -----------------------------------------------
describe('App: selectedNode の管理', () => {
    it('初期状態では Sidebar に "Select a node" メッセージが表示されること', () => {
        render(<App />);
        expect(screen.getByText(/select a node/i)).toBeInTheDocument();
    });

    it('onNodeClick でノードを選択すると Sidebar にラベル入力フィールドが表示されること', async () => {
        render(<App />);

        act(() => {
            capturedCallbacks!.onNodeClick(makeNode('node-1', 'Person'));
        });

        expect(await screen.findByRole('textbox', { name: /label/i })).toBeInTheDocument();
    });

    it('onNodeClick で選択後 onPaneClick するとインスペクターが閉じること', async () => {
        render(<App />);

        act(() => {
            capturedCallbacks!.onNodeClick(makeNode('node-1', 'Person'));
        });
        await screen.findByRole('textbox', { name: /label/i });

        act(() => {
            capturedCallbacks!.onPaneClick();
        });

        expect(screen.getByText(/select a node/i)).toBeInTheDocument();
    });

    it('deleteNode 後にインスペクターが閉じること', async () => {
        render(<App />);

        // まずノードを選択
        act(() => {
            capturedCallbacks!.onNodeClick(makeNode('node-1', 'Person'));
        });
        await screen.findByRole('textbox', { name: /label/i });

        // 削除
        act(() => {
            capturedCallbacks!.deleteNode('node-1');
        });

        // インスペクターが閉じる
        expect(screen.getByText(/select a node/i)).toBeInTheDocument();
    });

    it('deleteNode 後にストアからもノードが消えること', async () => {
        render(<App />);

        act(() => {
            capturedCallbacks!.onNodeClick(makeNode('node-1', 'Person'));
        });

        act(() => {
            capturedCallbacks!.deleteNode('node-1');
        });

        expect(useStore.getState().nodes).toHaveLength(0);
    });

    it('onNodeAdded 後に追加ノードが Sidebar に表示されること', async () => {
        render(<App />);

        // addNode でノードを追加してから onNodeAdded を呼ぶ
        let newNodeId: string;
        act(() => {
            newNodeId = capturedCallbacks!.addNode('relation', { x: 100, y: 100 });
        });

        act(() => {
            capturedCallbacks!.onNodeAdded(newNodeId!);
        });

        // 追加ノードのラベル "Relation" が Sidebar に表示される
        expect(await screen.findByRole('textbox', { name: /label/i })).toHaveValue('Relation');
    });
});

describe('App: Sidebar からのラベル編集', () => {
    it('ノード選択後に Sidebar からラベルを編集して Enter で確定できること', async () => {
        render(<App />);

        act(() => {
            capturedCallbacks!.onNodeClick(makeNode('node-1', 'Person'));
        });

        const input = await screen.findByRole('textbox', { name: /label/i });

        await userEvent.clear(input);
        await userEvent.type(input, 'Researcher');
        await userEvent.keyboard('{Enter}');

        expect(useStore.getState().nodes[0].data.label).toBe('Researcher');
    });

    it('Escape でラベル編集をキャンセルするとストアが更新されないこと', async () => {
        render(<App />);

        act(() => {
            capturedCallbacks!.onNodeClick(makeNode('node-1', 'Person'));
        });

        const input = await screen.findByRole('textbox', { name: /label/i });

        await userEvent.clear(input);
        await userEvent.type(input, 'Researcher');
        await userEvent.keyboard('{Escape}');

        // ストアは更新されていない
        expect(useStore.getState().nodes[0].data.label).toBe('Person');
    });

    it('Sidebar の Delete ボタンをクリックするとノードが削除されインスペクターが閉じること', async () => {
        render(<App />);

        act(() => {
            capturedCallbacks!.onNodeClick(makeNode('node-1', 'Person'));
        });
        await screen.findByRole('textbox', { name: /label/i });

        await userEvent.click(screen.getByRole('button', { name: /delete/i }));

        // インスペクターが閉じる
        expect(screen.getByText(/select a node/i)).toBeInTheDocument();
        // ストアからも消える
        expect(useStore.getState().nodes).toHaveLength(0);
    });
});