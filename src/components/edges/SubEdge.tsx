// src/components/edges/SubEdge.tsx
// UML継承スタイルの中空三角矢印エッジ（sub: 継承関係を表す）

import {
    BaseEdge,
    EdgeProps,
    getBezierPath,
    Edge,
} from '@xyflow/react';
import { TypeDBEdgeData } from '@/types';

type SubEdgeProps = EdgeProps<Edge<TypeDBEdgeData>>;

const MARKER_ID = 'sub-edge-marker';
const MARKER_ID_SELECTED = 'sub-edge-marker-selected';

export function SubEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    selected,
}: SubEdgeProps) {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // 選択状態でストローク色・太さを切り替える
    const strokeColor = selected ? '#1d4ed8' : 'var(--color-muted-foreground, #94a3b8)';
    const strokeWidth = selected ? 2.5 : 1.5;
    const markerId = selected ? MARKER_ID_SELECTED : MARKER_ID;

    return (
        <>
            {/* SVG defs: 通常時と選択時で色が異なる中空三角マーカーを定義する */}
            <defs>
                <marker
                    id={MARKER_ID}
                    markerWidth="12"
                    markerHeight="12"
                    refX="10"
                    refY="6"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                >
                    <polygon
                        points="0,0 12,6 0,12"
                        fill="white"
                        stroke="var(--color-muted-foreground, #94a3b8)"
                        strokeWidth="1.5"
                    />
                </marker>
                <marker
                    id={MARKER_ID_SELECTED}
                    markerWidth="12"
                    markerHeight="12"
                    refX="10"
                    refY="6"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                >
                    {/* 選択時は矢印も青色にする */}
                    <polygon
                        points="0,0 12,6 0,12"
                        fill="white"
                        stroke="#1d4ed8"
                        strokeWidth="1.5"
                    />
                </marker>
            </defs>
            <BaseEdge
                id={id}
                path={edgePath}
                style={{
                    ...style,
                    stroke: strokeColor,
                    strokeWidth,
                    strokeDasharray: '5 3',
                }}
                markerEnd={`url(#${markerId})`}
            />
        </>
    );
}