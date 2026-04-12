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
import { TypeDBNodeData, TypeDBEdgeData } from '@/types';

interface GraphState {
    // Node / Edge にジェネリクスを付与
    nodes: Node<TypeDBNodeData>[];
    edges: Edge<TypeDBEdgeData>[];
    onNodesChange: OnNodesChange<Node<TypeDBNodeData>>;
    onEdgesChange: OnEdgesChange<Edge<TypeDBEdgeData>>;
    onConnect: OnConnect;
    setNodes: (nodes: Node<TypeDBNodeData>[]) => void;
    deleteNode: (nodeId: string) => void;
}

export const useStore = create<GraphState>((set, get) => ({
    nodes: [
        {
            id: '1',
            // TypeDBNodeData に準拠したデータ
            data: { label: 'Entity 1', typeDBType: 'entity' },
            position: { x: 250, y: 5 },
            type: 'default',
        },
    ],
    edges: [],
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
            edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        });
    },
}));