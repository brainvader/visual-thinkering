// src/components/edges/RoleEdge.tsx
// エッジ中央にロール名を常時表示するカスタムエッジコンポーネント

import {
    BaseEdge,
    EdgeLabelRenderer,
    EdgeProps,
    getBezierPath,
    Edge,
} from '@xyflow/react';
import { TypeDBEdgeData } from '@/types';

type RoleEdgeProps = EdgeProps<Edge<TypeDBEdgeData>>;

export function RoleEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    data,
}: RoleEdgeProps) {
    // ベジェ曲線のパスと中点座標を取得する
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // ロール名が未設定の場合はラベルを表示しない
    const role = data?.role?.trim() ?? '';

    return (
        <>
            <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
            {role && (
                <EdgeLabelRenderer>
                    {/* エッジ中央に pill スタイルのラベルを配置する */}
                    {/* absolute 配置のため EdgeLabelRenderer の transform を使用 */}
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        <span className="
                            inline-block
                            px-1.5 py-0.5
                            text-[10px] font-mono
                            bg-background
                            border border-border
                            rounded-full
                            text-muted-foreground
                            leading-tight
                            select-none
                        ">
                            {role}
                        </span>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}