// src/components/nodes/AttributeNode.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttributeNode } from './AttributeNode';
import type { NodeProps, Node as FlowNode } from '@xyflow/react';
import type { TypeDBNodeData } from '@/types';

// React Flow の NodeProps 最小モック
const makeProps = (label: string, selected = false): NodeProps<FlowNode<TypeDBNodeData>> => ({
    id: 'test-id',
    data: { label, typeDBType: 'attribute', isAbstract: false },
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
});