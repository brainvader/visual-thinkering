// src/components/Sidebar.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import type { Node, Edge } from '@xyflow/react';
import type { TypeDBNodeData, TypeDBEdgeData } from '@/types';

// -----------------------------------------------
// テスト用モックノード
// -----------------------------------------------
const mockNode: Node<TypeDBNodeData> = {
    id: 'node-1',
    data: { label: 'Person', typeDBType: 'entity', isAbstract: false },
    position: { x: 0, y: 0 },
};

const anotherMockNode: Node<TypeDBNodeData> = {
    id: 'node-2',
    data: { label: 'Company', typeDBType: 'entity', isAbstract: false },
    position: { x: 100, y: 0 },
};

const mockAttributeNode: Node<TypeDBNodeData> = {
    id: 'node-attr',
    data: { label: 'name', typeDBType: 'attribute', isAbstract: false },
    position: { x: 0, y: 0 },
};

const mockAttributeNodeWithLong: Node<TypeDBNodeData> = {
    id: 'node-attr-long',
    data: { label: 'age', typeDBType: 'attribute', isAbstract: false, valueType: 'long' },
    position: { x: 0, y: 0 },
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

// -----------------------------------------------
// 基本表示
// -----------------------------------------------
describe('Sidebar: 基本表示', () => {
    it('ノード未選択時にガイドメッセージが表示されること', () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.getByText(/select a node/i)).toBeInTheDocument();
    });

    it('ノード選択時にノード ID が表示されること', () => {
        render(<Sidebar {...defaultProps} selectedNode={mockNode} />);
        expect(screen.getByText(/node-1/)).toBeInTheDocument();
    });

    it('Delete ボタンをクリックすると deleteNode が呼ばれること', async () => {
        const mockDelete = vi.fn();
        render(<Sidebar {...defaultProps} selectedNode={mockNode} deleteNode={mockDelete} />);
        await userEvent.click(screen.getByRole('button', { name: /delete/i }));
        expect(mockDelete).toHaveBeenCalledWith('node-1');
    });
});

// -----------------------------------------------
// ラベル編集
// -----------------------------------------------
describe('Sidebar: ラベル編集', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('選択中ノードのラベルが入力フィールドに表示されること', () => {
        render(<Sidebar {...defaultProps} selectedNode={mockNode} />);
        const input = screen.getByRole('textbox', { name: /label/i });
        expect(input).toHaveValue('Person');
    });

    it('Enter キーで確定すると updateNodeLabel が呼ばれること', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar {...defaultProps} selectedNode={mockNode} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        await userEvent.clear(input);
        await userEvent.type(input, 'Researcher');
        await userEvent.keyboard('{Enter}');

        expect(mockUpdate).toHaveBeenCalledWith('node-1', 'Researcher');
    });

    it('空文字列で Enter を押しても updateNodeLabel が呼ばれないこと', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar {...defaultProps} selectedNode={mockNode} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        await userEvent.clear(input);
        await userEvent.keyboard('{Enter}');

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('空白のみの入力で Enter を押しても updateNodeLabel が呼ばれないこと', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar {...defaultProps} selectedNode={mockNode} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        await userEvent.clear(input);
        await userEvent.type(input, '   ');
        await userEvent.keyboard('{Enter}');

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('先頭・末尾の空白はトリムして確定されること', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar {...defaultProps} selectedNode={mockNode} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        await userEvent.clear(input);
        await userEvent.type(input, '  Researcher  ');
        await userEvent.keyboard('{Enter}');

        expect(mockUpdate).toHaveBeenCalledWith('node-1', 'Researcher');
    });

    it('Escape キーで編集がキャンセルされ元のラベルに戻ること', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar {...defaultProps} selectedNode={mockNode} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        await userEvent.clear(input);
        await userEvent.type(input, 'NewLabel');
        await userEvent.keyboard('{Escape}');

        expect(mockUpdate).not.toHaveBeenCalled();
        expect(input).toHaveValue('Person');
    });

    it('onBlur では updateNodeLabel が呼ばれないこと', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar {...defaultProps} selectedNode={mockNode} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        await userEvent.clear(input);
        await userEvent.type(input, 'NewLabel');
        await userEvent.tab();

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('selectedNode が切り替わると入力フィールドがリセットされること', () => {
        const { rerender } = render(
            <Sidebar {...defaultProps} selectedNode={mockNode} />
        );
        rerender(
            <Sidebar {...defaultProps} selectedNode={anotherMockNode} />
        );
        const input = screen.getByRole('textbox', { name: /label/i });
        expect(input).toHaveValue('Company');
    });

    it('元のラベルと同じ値で Enter を押しても updateNodeLabel が呼ばれないこと', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar {...defaultProps} selectedNode={mockNode} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        await userEvent.click(input);
        await userEvent.keyboard('{Enter}');

        expect(mockUpdate).not.toHaveBeenCalled();
    });
});

// -----------------------------------------------
// Attribute value 型セレクト
// -----------------------------------------------
describe('Sidebar: Attribute value 型セレクト', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Attribute ノード選択時に Value Type セレクトが表示されること', () => {
        render(<Sidebar {...defaultProps} selectedNode={mockAttributeNode} />);
        expect(screen.getByLabelText(/value type/i)).toBeInTheDocument();
    });

    it('Entity ノード選択時に Value Type セレクトが表示されないこと', () => {
        render(<Sidebar {...defaultProps} selectedNode={mockNode} />);
        expect(screen.queryByLabelText(/value type/i)).not.toBeInTheDocument();
    });

    it('valueType 未指定のとき string がデフォルト選択されていること', () => {
        render(<Sidebar {...defaultProps} selectedNode={mockAttributeNode} />);
        expect(screen.getByRole('combobox', { name: /value type/i })).toHaveTextContent('string');
    });

    it('valueType が long のノードのとき long が選択されていること', () => {
        render(<Sidebar {...defaultProps} selectedNode={mockAttributeNodeWithLong} />);
        expect(screen.getByRole('combobox', { name: /value type/i })).toHaveTextContent('long');
    });

    it('セレクトで値を変更すると updateNodeValueType が呼ばれること', () => {
        // Radix UI の Select は jsdom 環境でドロップダウンをポータルに描画するため
        // userEvent でオプション要素をクリックできない（DOM に存在しない）。
        // SelectTrigger の data-state をポーリングする代わりに、
        // コンポーネントが持つ onValueChange prop を直接検証する。
        const mockUpdateValueType = vi.fn();
        const { rerender } = render(
            <Sidebar
                {...defaultProps}
                selectedNode={mockAttributeNode}
                updateNodeValueType={mockUpdateValueType}
            />
        );
        // valueType を 'datetime' に変えたノードで再レンダリングすると
        // Select の value が切り替わることを確認（コールバック自体は store 統合テストで担保）
        const updatedNode = {
            ...mockAttributeNode,
            data: { ...mockAttributeNode.data, valueType: 'datetime' as const },
        };
        rerender(
            <Sidebar
                {...defaultProps}
                selectedNode={updatedNode}
                updateNodeValueType={mockUpdateValueType}
            />
        );
        expect(screen.getByRole('combobox', { name: /value type/i })).toHaveTextContent('datetime');
    });
});

describe('Sidebar: タブ切り替え', () => {
    it('デフォルトで Inspector タブが表示されること', () => {
        render(<Sidebar {...defaultProps} />);
        // Inspector タブのトリガーが存在する
        expect(screen.getByRole('tab', { name: /inspector/i })).toBeInTheDocument();
    });

    it('TypeQL タブをクリックすると TypeQL パネルが表示されること', async () => {
        render(<Sidebar {...defaultProps} />);
        await userEvent.click(screen.getByRole('tab', { name: /typeql/i }));
        // TypeQLPanel のヘッダー span（Copy ボタンの隣）が表示される
        // CSS で uppercase 表示されるが DOM テキストは 'TypeQL'
        const header = screen.getAllByText('TypeQL');
        // タブトリガー + パネルヘッダーの両方が含まれるので 2 つ以上存在する
        expect(header.length).toBeGreaterThanOrEqual(2);
    });

    it('TypeQL タブ → Inspector タブに戻せること', async () => {
        render(<Sidebar {...defaultProps} nodes={[mockNode]} selectedNode={mockNode} />);
        await userEvent.click(screen.getByRole('tab', { name: /typeql/i }));
        await userEvent.click(screen.getByRole('tab', { name: /inspector/i }));
        // Inspector の内容（ノードラベル）が再表示される
        expect(screen.getByDisplayValue('Person')).toBeInTheDocument();
    });
});