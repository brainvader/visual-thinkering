// src/components/edges/index.ts
// edgeTypes を一箇所にまとめて export
// GraphCanvas の ReactFlow に渡すことで型ごとのカスタム描画が有効になる
import { RoleEdge } from './RoleEdge';
import { SubEdge } from './SubEdge';

export const edgeTypes = {
    role: RoleEdge,
    // sub: 同 typeDBType 同士の継承エッジ（UML中空三角矢印）
    sub: SubEdge,
};