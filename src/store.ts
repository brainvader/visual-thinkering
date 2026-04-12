// src/store.ts
import { create } from 'zustand';
import {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    addEdge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';
import { TypeDBNodeData, TypeDBEdgeData, TypeDBMetaType } from '@/types';

interface GraphState {
    nodes: Node<TypeDBNodeData>[];
    edges: Edge<TypeDBEdgeData>[];
    narration: string;
    onNodesChange: OnNodesChange<Node<TypeDBNodeData>>;
    onEdgesChange: OnEdgesChange<Edge<TypeDBEdgeData>>;
    onConnect: OnConnect;
    setNodes: (nodes: Node<TypeDBNodeData>[]) => void;
    deleteNode: (nodeId: string) => void;
    addNode: (type: TypeDBMetaType, position: { x: number; y: number }) => string;
    updateNodeLabel: (nodeId: string, label: string) => void;
    setNarration: (text: string) => void;
}

export const useStore = create<GraphState>((set, get) => ({
    nodes: [
        {
            id: crypto.randomUUID(),
            data: { label: 'Entity', typeDBType: 'entity', isAbstract: false },
            position: { x: 250, y: 150 },
            // typeDBType を React Flow の type に使うことで Custom Node が描画される
            type: 'entity',
        },
    ],
    edges: [],
    narration: '',

    onNodesChange: (changes: NodeChange<Node<TypeDBNodeData>>[]) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
    },

    onEdgesChange: (changes: EdgeChange<Edge<TypeDBEdgeData>>[]) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
    },

    onConnect: (connection: Connection) => {
        set({ edges: addEdge(connection, get().edges) });
    },

    setNodes: (nodes: Node<TypeDBNodeData>[]) => set({ nodes }),

    deleteNode: (nodeId: string) => {
        set({
            nodes: get().nodes.filter((n) => n.id !== nodeId),
            // ノード削除時に接続するエッジも削除
            edges: get().edges.filter(
                (e) => e.source !== nodeId && e.target !== nodeId
            ),
        });
    },

    addNode: (type: TypeDBMetaType, position: { x: number; y: number }) => {
        // 先頭を大文字にして初期ラベルを生成（例: "entity" → "Entity"）
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        const newNode: Node<TypeDBNodeData> = {
            id: crypto.randomUUID(),
            data: {
                label,
                typeDBType: type,
                isAbstract: false,
            },
            position,
            // typeDBType を node の type に使うことで nodeTypes のマッピングが機能する
            type,
        };
        set({ nodes: [...get().nodes, newNode] });
        return newNode.id;
    },

    updateNodeLabel: (nodeId: string, label: string) => {
        // 対象ノードのラベルのみ更新。他のフィールドは変更しない
        set({
            nodes: get().nodes.map((n) =>
                n.id === nodeId
                    ? { ...n, data: { ...n.data, label } }
                    : n
            ),
        });
    },

    setNarration: (text: string) => set({ narration: text }),
}));