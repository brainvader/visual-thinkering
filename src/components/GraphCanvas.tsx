// src/components/GraphCanvas.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TypeDBNodeData, TypeDBEdgeData, TypeDBMetaType } from '@/types';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    ReactFlowProvider,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    Node,
    Edge,
    useReactFlow,
} from '@xyflow/react';
import { Trash2, ExternalLink, Box, Diamond, CircleDot, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
// nodeTypes はモジュールレベルの定数を import する
// コンポーネント内で定義すると再レンダリングのたびに再生成され React Flow が無視する
import { nodeTypes } from './nodes';

interface GraphCanvasProps {
    nodes: Node<TypeDBNodeData>[];
    edges: Edge<TypeDBEdgeData>[];
    onNodesChange: OnNodesChange<Node<TypeDBNodeData>>;
    onEdgesChange: OnEdgesChange<Edge<TypeDBEdgeData>>;
    onConnect: OnConnect;
    onNodeClick: (event: React.MouseEvent, node: Node<TypeDBNodeData>) => void;
    onEdgeClick?: (event: React.MouseEvent, edge: Edge<TypeDBEdgeData>) => void;
    onPaneClick: () => void;
    selectedNode: Node<TypeDBNodeData> | null;
    deleteNode: (id: string) => void;
    deleteEdge?: (id: string) => void;
    addNode: (type: TypeDBMetaType, position: { x: number; y: number }) => string;
    onNodeAdded?: (nodeId: string) => void;
}

// コンテキストメニューの状態
// mode: 'node' → Node Actions、'edge' → Edge Actions、'canvas' → Quick Add
interface ContextMenuState {
    x: number;
    y: number;
    mode: 'node' | 'edge' | 'canvas';
    targetNode: Node<TypeDBNodeData> | null;
    targetEdge: Edge<TypeDBEdgeData> | null;
}

// useReactFlow は ReactFlowProvider の内側でしか使えないため内部コンポーネントとして分離
function GraphCanvasInner({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
    deleteNode,
    deleteEdge,
    addNode,
    onNodeAdded,
}: GraphCanvasProps) {
    const { screenToFlowPosition } = useReactFlow();
    const menuRef = useRef<HTMLDivElement>(null);

    // カスタムコンテキストメニューの状態
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    // 外側クリックでメニューを閉じる
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setContextMenu(null);
        };
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // ノード上で右クリック → Node Actions
    const handleNodeContextMenu = useCallback(
        (e: React.MouseEvent, node: Node<TypeDBNodeData>) => {
            e.preventDefault();
            e.stopPropagation();
            onNodeClick(e, node);
            setContextMenu({
                x: e.clientX,
                y: e.clientY,
                mode: 'node',
                targetNode: node,
                targetEdge: null,
            });
        },
        [onNodeClick]
    );

    // エッジ上で右クリック → Edge Actions
    // エッジを選択状態にしてからメニューを表示する
    const handleEdgeContextMenu = useCallback(
        (e: React.MouseEvent, edge: Edge<TypeDBEdgeData>) => {
            e.preventDefault();
            e.stopPropagation();
            // 右クリックしたエッジを即選択状態にする
            onEdgeClick?.(e, edge);
            setContextMenu({
                x: e.clientX,
                y: e.clientY,
                mode: 'edge',
                targetNode: null,
                targetEdge: edge,
            });
        },
        [onEdgeClick]
    );

    // キャンバス空白で右クリック → Quick Add
    const handlePaneContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
        (e as React.MouseEvent).preventDefault?.();
        setContextMenu({
            x: (e as MouseEvent).clientX,
            y: (e as MouseEvent).clientY,
            mode: 'canvas',
            targetNode: null,
            targetEdge: null,
        });
    }, []);

    // Quick Add
    const handleAddNode = useCallback(
        (type: TypeDBMetaType) => {
            if (!contextMenu) return;
            const flowPos = screenToFlowPosition({ x: contextMenu.x, y: contextMenu.y });
            const newNodeId = addNode(type, flowPos);
            setContextMenu(null);
            onNodeAdded?.(newNodeId);
        },
        [contextMenu, screenToFlowPosition, addNode, onNodeAdded]
    );

    // Delete Node
    const handleDeleteNode = useCallback(() => {
        if (!contextMenu?.targetNode) return;
        deleteNode(contextMenu.targetNode.id);
        setContextMenu(null);
    }, [contextMenu, deleteNode]);

    // Delete Edge
    const handleDeleteEdge = useCallback(() => {
        if (!contextMenu?.targetEdge) return;
        deleteEdge?.(contextMenu.targetEdge.id);
        setContextMenu(null);
    }, [contextMenu, deleteEdge]);

    // Edit Role（エッジをクリック選択してSidebarで編集するため、メニューを閉じるだけ）
    const handleEditRole = useCallback(() => {
        setContextMenu(null);
    }, []);

    return (
        <div className="relative h-full w-full bg-white">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={() => {
                    setContextMenu(null);
                    onPaneClick();
                }}
                onNodeContextMenu={handleNodeContextMenu}
                onEdgeContextMenu={handleEdgeContextMenu}
                onPaneContextMenu={handlePaneContextMenu}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.5 }}
            >
                <Background variant={BackgroundVariant.Dots} color="#e2e2e7" gap={20} />
                <Controls />
                <MiniMap style={{ backgroundColor: '#fff' }} nodeColor="#e2e2e7" />
            </ReactFlow>

            {/* カスタムコンテキストメニュー */}
            {contextMenu && (
                <div
                    ref={menuRef}
                    className="fixed z-50 min-w-48 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.mode === 'node' ? (
                        <>
                            {/* ノード上での右クリック: Node Actions */}
                            <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground">
                                Node Actions
                            </div>
                            <button
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 outline-none"
                                onClick={handleDeleteNode}
                            >
                                <Trash2 size={14} /> Delete Node
                            </button>
                        </>
                    ) : contextMenu.mode === 'edge' ? (
                        <>
                            {/* エッジ上での右クリック: Edge Actions */}
                            <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground">
                                Edge Actions
                            </div>
                            {/* ロール名編集: Sidebar にフォーカスが移るためメニューを閉じるだけ */}
                            <button
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted outline-none"
                                onClick={handleEditRole}
                            >
                                <PencilLine size={14} /> Edit Role
                            </button>
                            <button
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 outline-none"
                                onClick={handleDeleteEdge}
                            >
                                <Trash2 size={14} /> Delete Edge
                            </button>
                        </>
                    ) : (
                        <>
                            {/* キャンバス空白での右クリック: Quick Add */}
                            <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground">
                                Quick Add
                            </div>
                            <div className="grid grid-cols-3 gap-1 p-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-full flex-col gap-1 text-[10px]"
                                    title="Entity"
                                    onClick={() => handleAddNode('entity')}
                                >
                                    <Box size={16} className="text-blue-600" />
                                    <span>Entity</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-full flex-col gap-1 text-[10px]"
                                    title="Relation"
                                    onClick={() => handleAddNode('relation')}
                                >
                                    <Diamond size={16} className="text-emerald-600" />
                                    <span>Relation</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-full flex-col gap-1 text-[10px]"
                                    title="Attribute"
                                    onClick={() => handleAddNode('attribute')}
                                >
                                    <CircleDot size={16} className="text-amber-600" />
                                    <span>Attr</span>
                                </Button>
                            </div>
                        </>
                    )}

                    <div className="my-1 h-px bg-border" />

                    <button
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted outline-none cursor-not-allowed opacity-50"
                        disabled
                    >
                        <ExternalLink size={14} /> Open in VS Code
                    </button>
                </div>
            )}
        </div>
    );
}

// ReactFlowProvider でラップして export
export function GraphCanvas(props: GraphCanvasProps) {
    return (
        <ReactFlowProvider>
            <GraphCanvasInner {...props} />
        </ReactFlowProvider>
    );
}