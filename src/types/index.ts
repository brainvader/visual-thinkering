// src/types/index.ts
export type TypeDBMetaType = "entity" | "relation" | "attribute";

// TypeDB がサポートする primitive value 型
export type AttributeValueType = "string" | "long" | "double" | "boolean" | "datetime";

// エッジの種別: role（owns/plays）または sub（継承）
export type TypeDBEdgeType = "role" | "sub";

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
    // エッジ種別: 同 typeDBType 同士の接続は "sub"、それ以外は "role"
    // 未設定時は "role" として扱う（後方互換）
    edgeType?: TypeDBEdgeType;
    isKey?: boolean;
    [key: string]: unknown;
}