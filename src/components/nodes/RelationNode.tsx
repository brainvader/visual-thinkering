// src/components/nodes/RelationNode.tsx
import { useRef, useState, useLayoutEffect } from 'react';
import { Handle, Position, NodeProps, Node as FlowNode } from '@xyflow/react';
import { TypeDBNodeData } from '@/types';

export function RelationNode({ data, selected }: NodeProps<FlowNode<TypeDBNodeData>>) {
    const labelRef = useRef<SVGTextElement>(null);

    // ラベル実測幅からひし形サイズを動的計算
    const [size, setSize] = useState({ width: 160, height: 96 });

    useLayoutEffect(() => {
        if (!labelRef.current) return;
        const { width } = labelRef.current.getBoundingClientRect();
        // ラベル幅 + 余白でひし形の幅を決定、縦横比 0.6 で高さを算出
        const w = Math.max(160, width + 80);
        setSize({ width: w, height: Math.round(w * 0.6) });
    }, [data.label]);

    const { width, height } = size;
    const cx = width / 2;
    const cy = height / 2;

    // ひし形の4頂点（上・右・下・左）
    const points = `${cx},0 ${width},${cy} ${cx},${height} 0,${cy}`;

    return (
        // SVG コンテナ: React Flow はこの要素のサイズを基準にノードを配置する
        <div
            data-selected={selected ? 'true' : undefined}
            style={{ width, height }}
            className="relative cursor-default select-none"
        >
            <Handle type="target" position={Position.Top} style={{ top: 0 }} />
            <Handle type="source" position={Position.Bottom} style={{ bottom: 0 }} />
            <Handle type="target" position={Position.Left} style={{ left: 0 }} />
            <Handle type="source" position={Position.Right} style={{ right: 0 }} />

            <svg
                width={width}
                height={height}
                className="overflow-visible"
            >
                <polygon
                    points={points}
                    fill="#f0fdf4"
                    stroke={selected ? '#15803d' : '#22c55e'}
                    strokeWidth={selected ? 2.5 : 2}
                    // 選択時に外側グロー
                    filter={selected ? 'drop-shadow(0 0 4px rgba(34,197,94,0.5))' : undefined}
                />
                {/* ラベルをひし形中央に配置 */}
                <text
                    ref={labelRef}
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={14}
                    fontWeight={500}
                    fill="#14532d"
                    className="select-none"
                >
                    {data.label}
                </text>
            </svg>
        </div>
    );
}