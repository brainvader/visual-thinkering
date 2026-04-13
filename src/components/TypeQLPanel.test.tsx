// src/components/TypeQLPanel.test.tsx
// ← TypeQLPanel.tsx が未実装なので全件 fail する

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TypeQLPanel } from './TypeQLPanel';
import type { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';
import type { TypeDBNodeData, TypeDBEdgeData } from '@/types';

// clipboard モック
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
    },
});

const makeNode = (
    id: string,
    label: string,
    typeDBType: TypeDBNodeData['typeDBType']
): FlowNode<TypeDBNodeData> => ({
    id,
    data: { label, typeDBType, isAbstract: false },
    position: { x: 0, y: 0 },
    type: typeDBType,
});

const makeEdge = (
    id: string,
    source: string,
    target: string,
    role = ''
): FlowEdge<TypeDBEdgeData> => ({
    id,
    source,
    target,
    data: { role },
});

const person = makeNode('n1', 'Person', 'entity');
const name = makeNode('n2', 'name', 'attribute');
const employment = makeNode('n3', 'Employment', 'relation');

beforeEach(() => {
    vi.clearAllMocks();
});

// highlight() がテキストを複数の span に分割するため
// getByText の代わりに container.textContent で検証する
function getTextContent(container: HTMLElement): string {
    return container.textContent ?? '';
}

describe('TypeQLPanel', () => {
    it('nodes/edges が渡されたとき TypeQL が表示されること', () => {
        const { container } = render(<TypeQLPanel nodes={[person]} edges={[]} />);
        const text = getTextContent(container);
        expect(text).toContain('define');
        expect(text).toContain('Person');
        expect(text).toContain('sub');
        expect(text).toContain('entity');
    });

    it('Copy ボタンが表示されること', () => {
        render(<TypeQLPanel nodes={[person]} edges={[]} />);
        expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('Copy ボタンをクリックするとクリップボードにコピーされること', async () => {
        render(<TypeQLPanel nodes={[person]} edges={[]} />);
        await userEvent.click(screen.getByRole('button', { name: /copy/i }));
        expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            expect.stringContaining('Person sub entity')
        );
    });

    it('ロール名未設定エッジがあるとき警告が表示されること', () => {
        const edge = makeEdge('e1', 'n1', 'n3', ''); // ロール名なし
        render(<TypeQLPanel nodes={[person, employment]} edges={[edge]} />);
        expect(screen.getByText(/ロール名が未設定/i)).toBeInTheDocument();
    });

    it('ロール名が TypeQL キーワードと同名のとき警告が表示されること', () => {
        const edge = makeEdge('e1', 'n1', 'n3', 'plays');
        render(<TypeQLPanel nodes={[person, employment]} edges={[edge]} />);
        expect(screen.getByText(/TypeQL のキーワード/i)).toBeInTheDocument();
    });

    it('ロール名が設定されているとき警告が表示されないこと', () => {
        const edge = makeEdge('e1', 'n1', 'n3', 'employee');
        render(<TypeQLPanel nodes={[person, employment]} edges={[edge]} />);
        expect(screen.queryByText(/ロール名が未設定/i)).toBeNull();
    });

    it('nodes が更新されたとき TypeQL が再生成されること', () => {
        const company = makeNode('n4', 'Company', 'entity');
        const { container, rerender } = render(<TypeQLPanel nodes={[person]} edges={[]} />);
        expect(getTextContent(container)).toContain('Person');

        rerender(<TypeQLPanel nodes={[person, company]} edges={[]} />);
        expect(getTextContent(container)).toContain('Company');
    });

    it('グラフが空のとき適切なメッセージが表示されること', () => {
        render(<TypeQLPanel nodes={[]} edges={[]} />);
        expect(screen.getByText(/ノードを追加/i)).toBeInTheDocument();
    });
});