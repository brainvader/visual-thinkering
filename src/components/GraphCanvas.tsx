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
    addNode: (type: TypeDBMetaType, position: { x: number; y: number }) => void;
    onNodeAdded?: (node: Node<TypeDBNodeData>) => void;
}

// useReactFlow は ReactFlowProvider の内側でしか使えないため、
// 内部コンポーネントとして分離する
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

    // 右クリック時のスクリーン座標を一時保持（UIの一時状態のためローカル state で管理）
    const [contextMenuScreenPos, setContextMenuScreenPos] = useState<{
        x: number;
        y: number;
    } | null>(null);

    // 右クリック時にスクリーン座標を記録する
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        setContextMenuScreenPos({ x: e.clientX, y: e.clientY });
    }, []);

    // Quick Add: 右クリック座標をフロー座標に変換してノードを追加
    const handleAddNode = useCallback(
        (type: TypeDBMetaType) => {
            // 座標が未記録の場合はキャンバス中央にフォールバック
            const screenPos = contextMenuScreenPos ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            const flowPos = screenToFlowPosition(screenPos);
            addNode(type, flowPos);

            // 追加後すぐに選択状態にするため、追加されたノードを通知
            // （store 側で nodes の末尾に追加されるため、呼び出し元で取得）
            onNodeAdded?.(nodes[nodes.length - 1]);
        },
        [contextMenuScreenPos, screenToFlowPosition, addNode, onNodeAdded, nodes]
    );

    return (
        <div className="relative h-full w-full bg-white" onContextMenu={handleContextMenu}>
            <ContextMenu>
                {/* block クラスを追加して領域を確保 */}
                <ContextMenuTrigger className="block h-full w-full">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
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
                            {/* ノード選択中: ノードアクション */}
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
                            {/* ノード未選択: Quick Add */}
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

                    {/* VS Code 連携（将来実装） */}
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