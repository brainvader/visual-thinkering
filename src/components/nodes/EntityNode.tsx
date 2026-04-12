// src/components/nodes/EntityNode.tsx
import { Handle, Position, NodeProps, Node as FlowNode } from '@xyflow/react';
import { TypeDBNodeData } from '@/types';

export function EntityNode({ data, selected }: NodeProps<FlowNode<TypeDBNodeData>>) {
    return (
        <div
            data-selected={selected ? 'true' : undefined}
            className={[
                // ベーススタイル: 角丸矩形
                'min-w-[120px] min-h-[48px] px-4 py-2',
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
            {/* 上下左右にハンドル（接続ポイント）を配置 */}
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />

            <span>{data.label}</span>
        </div>
    );
}