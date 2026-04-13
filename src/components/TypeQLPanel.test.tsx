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

describe('TypeQLPanel', () => {
    it('nodes/edges が渡されたとき TypeQL が表示されること', () => {
        render(<TypeQLPanel nodes={[person]} edges={[]} />);
        expect(screen.getByText(/define/i)).toBeInTheDocument();
        expect(screen.getByText(/Person sub entity/i)).toBeInTheDocument();
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

    it('ロール名が設定されているとき警告が表示されないこと', () => {
        const edge = makeEdge('e1', 'n1', 'n3', 'employee');
        render(<TypeQLPanel nodes={[person, employment]} edges={[edge]} />);
        expect(screen.queryByText(/ロール名が未設定/i)).toBeNull();
    });

    it('nodes が更新されたとき TypeQL が再生成されること', () => {
        const { rerender } = render(<TypeQLPanel nodes={[person]} edges={[]} />);
        expect(screen.getByText(/Person sub entity/i)).toBeInTheDocument();

        const company = makeNode('n4', 'Company', 'entity');
        rerender(<TypeQLPanel nodes={[person, company]} edges={[]} />);
        expect(screen.getByText(/Company sub entity/i)).toBeInTheDocument();
    });

    it('グラフが空のとき適切なメッセージが表示されること', () => {
        render(<TypeQLPanel nodes={[]} edges={[]} />);
        expect(screen.getByText(/ノードを追加/i)).toBeInTheDocument();
    });
});