// src/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    MarkerType,
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
    updateEdgeRole: (edgeId: string, role: string) => void;
    deleteEdge: (edgeId: string) => void;
}

export const useStore = create<GraphState>()(
    persist(
        (set, get) => ({
            nodes: [
                {
                    id: crypto.randomUUID(),
                    data: { label: 'Entity', typeDBType: 'entity', isAbstract: false },
                    position: { x: 0, y: 0 },
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
                set({
                    edges: addEdge(
                        {
                            ...connection,
                            // 接続方向が分かるよう矢印マーカーを付与する
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                width: 20,
                                height: 20,
                            },
                        },
                        get().edges
                    ),
                });
            },

            setNodes: (nodes: Node<TypeDBNodeData>[]) => set({ nodes }),

            deleteNode: (nodeId: string) => {
                set({
                    nodes: get().nodes.filter((n) => n.id !== nodeId),
                    edges: get().edges.filter(
                        (e) => e.source !== nodeId && e.target !== nodeId
                    ),
                });
            },

            addNode: (type: TypeDBMetaType, position: { x: number; y: number }) => {
                const label = type.charAt(0).toUpperCase() + type.slice(1);
                const newNode: Node<TypeDBNodeData> = {
                    id: crypto.randomUUID(),
                    data: { label, typeDBType: type, isAbstract: false },
                    position,
                    type,
                };
                set({ nodes: [...get().nodes, newNode] });
                return newNode.id;
            },

            updateNodeLabel: (nodeId: string, label: string) => {
                set({
                    nodes: get().nodes.map((n) =>
                        n.id === nodeId
                            ? { ...n, data: { ...n.data, label } }
                            : n
                    ),
                });
            },

            setNarration: (text: string) => set({ narration: text }),

            // エッジのロール名を更新する
            updateEdgeRole: (edgeId: string, role: string) => {
                set({
                    edges: get().edges.map((e) =>
                        e.id === edgeId
                            ? { ...e, data: { ...e.data, role }, label: role }
                            : e
                    ),
                });
            },

            // エッジを削除する（接続先ノードは残る）
            deleteEdge: (edgeId: string) => {
                set({
                    edges: get().edges.filter((e) => e.id !== edgeId),
                });
            },
        }),
        {
            name: 'visual-thinkering-graph',
            storage: createJSONStorage(() => localStorage),
            version: 1,
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                narration: state.narration,
            }),
        }
    )
);