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
    Viewport,
    addEdge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';
import { TypeDBNodeData, TypeDBEdgeData, TypeDBMetaType, AttributeValueType } from '@/types';

interface GraphState {
    nodes: Node<TypeDBNodeData>[];
    edges: Edge<TypeDBEdgeData>[];
    narration: string;
    viewport: Viewport;
    onNodesChange: OnNodesChange<Node<TypeDBNodeData>>;
    onEdgesChange: OnEdgesChange<Edge<TypeDBEdgeData>>;
    onConnect: OnConnect;
    setNodes: (nodes: Node<TypeDBNodeData>[]) => void;
    deleteNode: (nodeId: string) => void;
    addNode: (type: TypeDBMetaType, position: { x: number; y: number }) => string;
    updateNodeLabel: (nodeId: string, label: string) => void;
    // Attribute ノードの value 型を更新する
    updateNodeValueType: (nodeId: string, valueType: AttributeValueType) => void;
    setNarration: (text: string) => void;
    setViewport: (viewport: Viewport) => void;
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
            viewport: { x: 0, y: 0, zoom: 1 },

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
                            type: 'role',
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

            setNodes: (nodes) => set({ nodes }),

            deleteNode: (nodeId) => {
                set({
                    // 指定ノードと、そのノードに接続するエッジを同時に削除する
                    nodes: get().nodes.filter((n) => n.id !== nodeId),
                    edges: get().edges.filter(
                        (e) => e.source !== nodeId && e.target !== nodeId
                    ),
                });
            },

            addNode: (type, position) => {
                const id = crypto.randomUUID();
                const label = type.charAt(0).toUpperCase() + type.slice(1);
                const newNode: Node<TypeDBNodeData> = {
                    id,
                    data: { label, typeDBType: type, isAbstract: false },
                    position,
                    type,
                };
                set({ nodes: [...get().nodes, newNode] });
                return id;
            },

            updateNodeLabel: (nodeId, label) => {
                set({
                    nodes: get().nodes.map((n) =>
                        n.id === nodeId
                            ? { ...n, data: { ...n.data, label } }
                            : n
                    ),
                });
            },

            // Attribute ノードの value 型を更新する
            // 即時反映（Enter 確定不要）: ドロップダウン選択 = 意図の確定
            updateNodeValueType: (nodeId, valueType) => {
                set({
                    nodes: get().nodes.map((n) =>
                        n.id === nodeId
                            ? { ...n, data: { ...n.data, valueType } }
                            : n
                    ),
                });
            },

            setNarration: (text) => set({ narration: text }),

            setViewport: (viewport) => set({ viewport }),

            updateEdgeRole: (edgeId, role) => {
                set({
                    edges: get().edges.map((e) =>
                        e.id === edgeId
                            ? { ...e, data: { ...e.data, role } }
                            : e
                    ),
                });
            },

            deleteEdge: (edgeId) => {
                set({
                    edges: get().edges.filter((e) => e.id !== edgeId),
                });
            },
        }),
        {
            name: 'visual-thinkering-graph',
            version: 2,
            storage: createJSONStorage(() => localStorage),
            // 関数はシリアライズ不可なので除外する
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                narration: state.narration,
                viewport: state.viewport,
            }),
        }
    )
);