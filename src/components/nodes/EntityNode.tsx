// src/components/nodes/EntityNode.tsx
import { Handle, Position, NodeProps, Node as FlowNode } from '@xyflow/react';
import { TypeDBNodeData } from '@/types';

export function EntityNode({ data, selected }: NodeProps<FlowNode<TypeDBNodeData>>) {
    return (
        <div
            data-selected={selected ? 'true' : undefined}
            className={[
                // ベーススタイル: 角丸矩形
                'min-w-30 min-h-12 px-4 py-2',
                'flex items-center justify-center',
                'rounded-lg border-2 bg-blue-50',
                'text-sm font-medium text-blue-900',
                'cursor-default select-none',
                // 通常 / 選択時でボーダー色を切り替え
                selected
                    ? 'border-blue-700 shadow-[0_0_0_3px_rgba(59,130,246,0.3)]'
                    : 'border-blue-400',
            ].join(' ')}
        >
            {/* 上下左右それぞれに source/target の両方を配置
                id を付けて区別することで全方向から双方向接続が可能になる */}
            <Handle type="target" position={Position.Top} id="top-target" />
            <Handle type="source" position={Position.Top} id="top-source" />
            <Handle type="target" position={Position.Bottom} id="bottom-target" />
            <Handle type="source" position={Position.Bottom} id="bottom-source" />
            <Handle type="target" position={Position.Left} id="left-target" />
            <Handle type="source" position={Position.Left} id="left-source" />
            <Handle type="target" position={Position.Right} id="right-target" />
            <Handle type="source" position={Position.Right} id="right-source" />

            <span>{data.label}</span>
        </div>
    );
}