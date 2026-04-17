// src/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    Edge,
    EdgeChange,
    Node,
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
    isDirty: boolean;
    markDirty: () => void;
    markClean: () => void;
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

            onNodesChange: (changes) => {
                set({ nodes: applyNodeChanges(changes, get().nodes) });
                get().markDirty();
            },

            onEdgesChange: (changes: EdgeChange<Edge<TypeDBEdgeData>>[]) => {
                set({ edges: applyEdgeChanges(changes, get().edges) });
            },

            onConnect: (connection) => {
                set({ edges: addEdge({ ...connection, type: 'role', markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 } }, get().edges) });
                get().markDirty();
            },

            setNodes: (nodes) => set({ nodes }),

            deleteNode: (nodeId) => {
                set({
                    nodes: get().nodes.filter((n) => n.id !== nodeId),
                    edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
                });
                get().markDirty();
            },

            addNode: (type, position) => {
                const id = crypto.randomUUID();
                const label = type.charAt(0).toUpperCase() + type.slice(1);
                set({ nodes: [...get().nodes, { id, data: { label, typeDBType: type, isAbstract: false }, position, type }] });
                get().markDirty();
                return id;
            },

            updateNodeLabel: (nodeId, label) => {
                set({ nodes: get().nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, label } } : n) });
                get().markDirty();
            },

            // Attribute ノードの value 型を更新する
            // 即時反映（Enter 確定不要）: ドロップダウン選択 = 意図の確定
            updateNodeValueType: (nodeId, valueType) => {
                set({ nodes: get().nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, valueType } } : n) });
                get().markDirty();
            },

            setNarration: (text) => {
                set({ narration: text });
                get().markDirty();
            },

            setViewport: (viewport) => set({ viewport }),

            updateEdgeRole: (edgeId, role) => {
                set({ edges: get().edges.map((e) => e.id === edgeId ? { ...e, data: { ...e.data, role } } : e) });
                get().markDirty();
            },

            deleteEdge: (edgeId) => {
                set({ edges: get().edges.filter((e) => e.id !== edgeId) });
                get().markDirty();
            },

            isDirty: false,
            markDirty: () => set({ isDirty: true }),
            markClean: () => set({ isDirty: false }),
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