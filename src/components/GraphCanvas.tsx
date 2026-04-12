// src/components/GraphCanvas.tsx
import React, { useState, useCallback } from 'react';
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
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Trash2, ExternalLink, Box, Diamond, CircleDot } from 'lucide-react';
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
    onPaneClick: () => void;
    selectedNode: Node<TypeDBNodeData> | null;
    deleteNode: (id: string) => void;
    addNode: (type: TypeDBMetaType, position: { x: number; y: number }) => string;
    onNodeAdded?: (nodeId: string) => void;
}

// useReactFlow は ReactFlowProvider の内側でしか使えないため内部コンポーネントとして分離
function GraphCanvasInner({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onPaneClick,
    selectedNode,
    deleteNode,
    addNode,
    onNodeAdded,
}: GraphCanvasProps) {
    const { screenToFlowPosition } = useReactFlow();

    // 右クリック時のスクリーン座標を一時保持
    const [contextMenuScreenPos, setContextMenuScreenPos] = useState<{
        x: number;
        y: number;
    } | null>(null);

    // ContextMenu を key で再マウントすることで強制的に閉じる
    // Radix UI の ContextMenu は open props を受け付けないため、この方法で閉じる
    const [menuKey, setMenuKey] = useState(0);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        setContextMenuScreenPos({ x: e.clientX, y: e.clientY });
    }, []);

    // Quick Add: 座標変換 → ノード追加 → メニューを閉じる → 追加ノードを即選択
    const handleAddNode = useCallback(
        (type: TypeDBMetaType) => {
            const screenPos = contextMenuScreenPos ?? {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
            };
            const flowPos = screenToFlowPosition(screenPos);

            // addNode が新ノードの id を返すのでタイミング問題なく即選択できる
            const newNodeId = addNode(type, flowPos);

            // key を更新して ContextMenu を再マウント → 閉じる
            setMenuKey((k) => k + 1);

            // 追加したノードを即フォーカス
            onNodeAdded?.(newNodeId);
        },
        [contextMenuScreenPos, screenToFlowPosition, addNode, onNodeAdded]
    );

    return (
        <div className="relative h-full w-full bg-white" onContextMenu={handleContextMenu}>
            <ContextMenu key={menuKey}>
                <ContextMenuTrigger className="block h-full w-full">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background variant={BackgroundVariant.Dots} color="#e2e2e7" gap={20} />
                        <Controls />
                        <MiniMap style={{ backgroundColor: '#fff' }} nodeColor="#e2e2e7" />
                    </ReactFlow>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-64 p-2">
                    {selectedNode ? (
                        <>
                            <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground">
                                Node Actions
                            </div>
                            <ContextMenuItem
                                className="gap-2 text-red-500 focus:text-red-500"
                                onClick={() => deleteNode(selectedNode.id)}
                            >
                                <Trash2 size={14} /> Delete Node
                            </ContextMenuItem>
                        </>
                    ) : (
                        <>
                            <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground mb-1">
                                Quick Add
                            </div>
                            <div className="grid grid-cols-3 gap-1 mb-2">
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

                    <ContextMenuSeparator />

                    <ContextMenuItem className="gap-2 text-muted-foreground" disabled>
                        <ExternalLink size={14} /> Open in VS Code
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
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