// src/components/nodes/AttributeNode.tsx
import { Handle, Position, NodeProps, Node as FlowNode } from '@xyflow/react';
import { TypeDBNodeData } from '@/types';

export function AttributeNode({ data, selected }: NodeProps<FlowNode<TypeDBNodeData>>) {
    return (
        <div
            data-selected={selected ? 'true' : undefined}
            className={[
                // ベーススタイル: 楕円（border-radius を最大値にすることで楕円になる）
                'relative min-w-25 min-h-12 px-5 py-2',
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
            {/* abstract フラグが true のとき右上にバッジを表示する */}
            {data.isAbstract && (
                <span className="
                    absolute -top-2 -right-2
                    px-1 py-0
                    text-[9px] font-mono font-semibold
                    bg-orange-100 border border-orange-400
                    text-orange-600
                    rounded
                    leading-tight
                    select-none
                ">
                    abstract
                </span>
            )}

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