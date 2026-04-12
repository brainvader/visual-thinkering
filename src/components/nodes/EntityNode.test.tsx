// src/components/nodes/EntityNode.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EntityNode } from './EntityNode';
import type { NodeProps, Node as FlowNode } from '@xyflow/react';
import type { TypeDBNodeData } from '@/types';

// React Flow の NodeProps 最小モック
const makeProps = (label: string, selected = false): NodeProps<FlowNode<TypeDBNodeData>> => ({
    id: 'test-id',
    data: { label, typeDBType: 'entity', isAbstract: false },
    selected,
    type: 'entity',
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
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
});