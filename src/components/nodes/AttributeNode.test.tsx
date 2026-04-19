// src/components/nodes/AttributeNode.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttributeNode } from './AttributeNode';
import type { NodeProps, Node as FlowNode } from '@xyflow/react';
import type { TypeDBNodeData } from '@/types';

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
    data: { label, typeDBType: 'attribute', isAbstract },
    selected,
    type: 'attribute',
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
    selectable: true,
    deletable: true,
    draggable: true,
});

describe('AttributeNode', () => {
    it('ラベルが表示されること', () => {
        render(<AttributeNode {...makeProps('name')} />);
        expect(screen.getByText('name')).toBeInTheDocument();
    });

    it('selected=true のときハイライト属性が付くこと', () => {
        const { container } = render(<AttributeNode {...makeProps('name', true)} />);
        expect(container.firstChild).toHaveAttribute('data-selected', 'true');
    });

    it('selected=false のときハイライト属性が付かないこと', () => {
        const { container } = render(<AttributeNode {...makeProps('name', false)} />);
        expect(container.firstChild).not.toHaveAttribute('data-selected', 'true');
    });

    it('isAbstract=true のとき "abstract" バッジが表示されること', () => {
        render(<AttributeNode {...makeProps('name', false, true)} />);
        expect(screen.getByText('abstract')).toBeInTheDocument();
    });

    it('isAbstract=false のとき "abstract" バッジが表示されないこと', () => {
        render(<AttributeNode {...makeProps('name', false, false)} />);
        expect(screen.queryByText('abstract')).toBeNull();
    });
});