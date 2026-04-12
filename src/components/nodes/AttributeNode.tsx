// src/components/nodes/AttributeNode.tsx
import { Handle, Position, NodeProps, Node as FlowNode } from '@xyflow/react';
import { TypeDBNodeData } from '@/types';

export function AttributeNode({ data, selected }: NodeProps<FlowNode<TypeDBNodeData>>) {
    return (
        <div
            data-selected={selected ? 'true' : undefined}
            className={[
                // ベーススタイル: 楕円（border-radius を最大値にすることで楕円になる）
                'min-w-[100px] min-h-[48px] px-5 py-2',
                'flex items-center justify-center',
                'rounded-full border-2 bg-orange-50',
                'text-sm font-medium text-orange-900',
                'cursor-default select-none',
                // 通常 / 選択時でボーダー色を切り替え
                selected
                    ? 'border-orange-700 shadow-[0_0_0_3px_rgba(249,115,22,0.3)]'
                    : 'border-orange-400',
            ].join(' ')}
        >
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />

            <span>{data.label}</span>
        </div>
    );
}