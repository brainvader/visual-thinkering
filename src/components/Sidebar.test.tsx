// src/components/Sidebar.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import type { Node } from '@xyflow/react';
import type { TypeDBNodeData } from '@/types';

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

// -----------------------------------------------
// 既存: ノード未選択 / 削除
// -----------------------------------------------
describe('Sidebar: 基本表示', () => {
    it('ノード未選択時にガイドメッセージが表示されること', () => {
        render(<Sidebar selectedNode={null} deleteNode={vi.fn()} updateNodeLabel={vi.fn()} />);
        expect(screen.getByText(/select a node/i)).toBeInTheDocument();
    });

    it('ノード選択時にノード ID が表示されること', () => {
        render(<Sidebar selectedNode={mockNode} deleteNode={vi.fn()} updateNodeLabel={vi.fn()} />);
        expect(screen.getByText(/node-1/)).toBeInTheDocument();
    });

    it('Delete ボタンをクリックすると deleteNode が呼ばれること', async () => {
        const mockDelete = vi.fn();
        render(<Sidebar selectedNode={mockNode} deleteNode={mockDelete} updateNodeLabel={vi.fn()} />);
        await userEvent.click(screen.getByRole('button', { name: /delete/i }));
        expect(mockDelete).toHaveBeenCalledWith('node-1');
    });
});

// -----------------------------------------------
// 新規: ラベル編集
// ← Sidebar に updateNodeLabel prop と編集 UI が未実装なので全件 fail する
// -----------------------------------------------
describe('Sidebar: ラベル編集', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('選択中ノードのラベルが入力フィールドに表示されること', () => {
        render(<Sidebar selectedNode={mockNode} deleteNode={vi.fn()} updateNodeLabel={vi.fn()} />);
        const input = screen.getByRole('textbox', { name: /label/i });
        expect(input).toHaveValue('Person');
    });

    it('Enter キーで確定すると updateNodeLabel が呼ばれること', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar selectedNode={mockNode} deleteNode={vi.fn()} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        // 既存テキストをクリアして新しい値を入力
        await userEvent.clear(input);
        await userEvent.type(input, 'Researcher');
        await userEvent.keyboard('{Enter}');

        expect(mockUpdate).toHaveBeenCalledWith('node-1', 'Researcher');
    });

    it('空文字列で Enter を押しても updateNodeLabel が呼ばれないこと', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar selectedNode={mockNode} deleteNode={vi.fn()} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        await userEvent.clear(input);
        await userEvent.keyboard('{Enter}');

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('空白のみの入力で Enter を押しても updateNodeLabel が呼ばれないこと', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar selectedNode={mockNode} deleteNode={vi.fn()} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        await userEvent.clear(input);
        await userEvent.type(input, '   ');
        await userEvent.keyboard('{Enter}');

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('先頭・末尾の空白はトリムして確定されること', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar selectedNode={mockNode} deleteNode={vi.fn()} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        await userEvent.clear(input);
        await userEvent.type(input, '  Researcher  ');
        await userEvent.keyboard('{Enter}');

        expect(mockUpdate).toHaveBeenCalledWith('node-1', 'Researcher');
    });

    it('Escape キーで編集がキャンセルされ元のラベルに戻ること', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar selectedNode={mockNode} deleteNode={vi.fn()} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        await userEvent.clear(input);
        await userEvent.type(input, 'NewLabel');
        await userEvent.keyboard('{Escape}');

        // updateNodeLabel は呼ばれない
        expect(mockUpdate).not.toHaveBeenCalled();
        // 入力フィールドが元のラベルに戻っている
        expect(input).toHaveValue('Person');
    });

    it('onBlur では updateNodeLabel が呼ばれないこと', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar selectedNode={mockNode} deleteNode={vi.fn()} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        await userEvent.clear(input);
        await userEvent.type(input, 'NewLabel');
        // tab でフォーカスを外す
        await userEvent.tab();

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('selectedNode が切り替わると入力フィールドがリセットされること', () => {
        const { rerender } = render(
            <Sidebar selectedNode={mockNode} deleteNode={vi.fn()} updateNodeLabel={vi.fn()} />
        );
        // 別ノードに切り替え
        rerender(
            <Sidebar selectedNode={anotherMockNode} deleteNode={vi.fn()} updateNodeLabel={vi.fn()} />
        );
        const input = screen.getByRole('textbox', { name: /label/i });
        expect(input).toHaveValue('Company');
    });

    it('元のラベルと同じ値で Enter を押しても updateNodeLabel が呼ばれないこと', async () => {
        const mockUpdate = vi.fn();
        render(<Sidebar selectedNode={mockNode} deleteNode={vi.fn()} updateNodeLabel={mockUpdate} />);
        const input = screen.getByRole('textbox', { name: /label/i });

        // 何も変えずに Enter
        await userEvent.click(input);
        await userEvent.keyboard('{Enter}');

        expect(mockUpdate).not.toHaveBeenCalled();
    });
});