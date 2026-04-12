// src/components/nodes/RelationNode.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RelationNode } from './RelationNode';
import type { NodeProps, Node as FlowNode } from '@xyflow/react';
import type { TypeDBNodeData } from '@/types';

// React Flow の NodeProps 最小モック
const makeProps = (label: string, selected = false): NodeProps<FlowNode<TypeDBNodeData>> => ({
    id: 'test-id',
    data: { label, typeDBType: 'relation', isAbstract: false },
    selected,
    type: 'relation',
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
    selectable: true,
    deletable: true,
    draggable: true,
});

describe('RelationNode', () => {
    it('ラベルが表示されること', () => {
        render(<RelationNode {...makeProps('Employment')} />);
        expect(screen.getByText('Employment')).toBeInTheDocument();
    });

    it('SVG polygon が描画されること', () => {
        const { container } = render(<RelationNode {...makeProps('Employment')} />);
        expect(container.querySelector('polygon')).toBeInTheDocument();
    });

    it('selected=true のときハイライト属性が付くこと', () => {
        const { container } = render(<RelationNode {...makeProps('Employment', true)} />);
        expect(container.firstChild).toHaveAttribute('data-selected', 'true');
    });

    it('selected=false のときハイライト属性が付かないこと', () => {
        const { container } = render(<RelationNode {...makeProps('Employment', false)} />);
        expect(container.firstChild).not.toHaveAttribute('data-selected', 'true');
    });
});