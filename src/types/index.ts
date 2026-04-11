// src/types/index.ts
export type TypeDBMetaType = "entity" | "relation" | "attribute";

export interface TypeDBNodeData {
    label: string;
    typeDBType: TypeDBMetaType;
    isAbstract?: boolean;
    // 以下を追加することで Record<string, unknown> の要件を満たします
    [key: string]: unknown;
}

export interface TypeDBEdgeData {
    role: string;
    isKey?: boolean;
    // 以下を追加
    [key: string]: unknown;
}