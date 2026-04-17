// src/components/edges/index.ts
// edgeTypes を一箇所にまとめて export
// GraphCanvas の ReactFlow に渡すことで型ごとのカスタム描画が有効になる
import { RoleEdge } from './RoleEdge';

export const edgeTypes = {
    role: RoleEdge,
};