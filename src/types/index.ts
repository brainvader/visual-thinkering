// src/types/index.ts
export type TypeDBMetaType = "entity" | "relation" | "attribute";

// TypeDB がサポートする primitive value 型
export type AttributeValueType = "string" | "long" | "double" | "boolean" | "datetime";

export interface TypeDBNodeData {
    label: string;
    typeDBType: TypeDBMetaType;
    isAbstract?: boolean;
    // Attribute ノードの value 型（未指定時は "string" をデフォルトとする）
    valueType?: AttributeValueType;
    // React Flow の Record<string, unknown> 要件を満たすインデックスシグネチャ
    [key: string]: unknown;
}

export interface TypeDBEdgeData {
    role: string;
    isKey?: boolean;
    [key: string]: unknown;
}