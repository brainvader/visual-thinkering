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

// SVG defs に登録する中空三角マーカーの ID
const MARKER_ID = 'sub-edge-marker';

export function SubEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
}: SubEdgeProps) {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            {/* SVG defs: 中空三角マーカーを定義する */}
            {/* React Flow は複数エッジで同一 defs が重複しても問題ない */}
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
                    {/* UML 継承の中空三角（塗りなし・枠線あり） */}
                    <polygon
                        points="0,0 12,6 0,12"
                        fill="white"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    />
                </marker>
            </defs>
            <BaseEdge
                id={id}
                path={edgePath}
                style={{
                    ...style,
                    stroke: 'var(--color-muted-foreground, #94a3b8)',
                    strokeDasharray: '5 3',
                }}
                markerEnd={`url(#${MARKER_ID})`}
            />
        </>
    );
}