// src/components/nodes/EntityNode.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EntityNode } from './EntityNode';
import type { NodeProps, Node as FlowNode } from '@xyflow/react';
import type { TypeDBNodeData } from '@/types';

// Handle は ReactFlowProvider なしでは動作しないためモックする
vi.mock('@xyflow/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@xyflow/react')>();
    return {
        ...actual,
        Handle: () => null,
    };
});

const makeProps = (
    label: string,
    selected = false,
    isAbstract = false
): NodeProps<FlowNode<TypeDBNodeData>> => ({
    id: 'test-id',
    data: { label, typeDBType: 'entity', isAbstract },
    selected,
    type: 'entity',
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
    selectable: true,
    deletable: true,
    draggable: true,
});

describe('EntityNode', () => {
    it('ラベルが表示されること', () => {
        render(<EntityNode {...makeProps('Person')} />);
        expect(screen.getByText('Person')).toBeInTheDocument();
    });

    it('selected=true のときハイライト属性が付くこと', () => {
        const { container } = render(<EntityNode {...makeProps('Person', true)} />);
        expect(container.firstChild).toHaveAttribute('data-selected', 'true');
    });

    it('selected=false のときハイライト属性が付かないこと', () => {
        const { container } = render(<EntityNode {...makeProps('Person', false)} />);
        expect(container.firstChild).not.toHaveAttribute('data-selected', 'true');
    });

    it('isAbstract=true のとき "abstract" バッジが表示されること', () => {
        render(<EntityNode {...makeProps('Person', false, true)} />);
        expect(screen.getByText('abstract')).toBeInTheDocument();
    });

    it('isAbstract=false のとき "abstract" バッジが表示されないこと', () => {
        render(<EntityNode {...makeProps('Person', false, false)} />);
        expect(screen.queryByText('abstract')).toBeNull();
    });
});