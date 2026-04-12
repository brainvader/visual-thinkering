import React from 'react';
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
} from '@xyflow/react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Trash2, ExternalLink, Box, Diamond, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GraphCanvasProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange<Node>;
    onEdgesChange: OnEdgesChange<Edge>;
    onConnect: OnConnect;
    onNodeClick: (event: React.MouseEvent, node: Node) => void;
    onPaneClick: () => void;
    selectedNode: Node | null;
    deleteNode: () => void;
}

export function GraphCanvas({
    nodes, edges, onNodesChange, onEdgesChange,
    onConnect, onNodeClick, onPaneClick,
    selectedNode, deleteNode
}: GraphCanvasProps) {
    return (
        <div className="relative h-full w-full bg-white">
            <ContextMenu>
                <ContextMenuTrigger className="h-full w-full">
                    <ReactFlowProvider>
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
                    </ReactFlowProvider>
                </ContextMenuTrigger>

                {/* コンテクストメニューのカスタマイズ */}
                <ContextMenuContent className="w-64 p-2">
                    {selectedNode ? (
                        <>
                            <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground">Node Actions</div>
                            <ContextMenuItem className="gap-2 text-red-500 focus:text-red-500" onClick={deleteNode}>
                                <Trash2 size={14} /> Delete Node
                            </ContextMenuItem>
                        </>
                    ) : (
                        <>
                            <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-muted-foreground mb-1">Quick Add</div>
                            {/* アイコン付きボタンのグリッド配置 */}
                            <div className="grid grid-cols-3 gap-1 mb-2">
                                <Button variant="outline" size="icon" className="h-12 w-full flex-col gap-1 text-[10px]" title="Entity">
                                    <Box size={16} className="text-blue-600" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-12 w-full flex-col gap-1 text-[10px]" title="Relation">
                                    <Diamond size={16} className="text-emerald-600" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-12 w-full flex-col gap-1 text-[10px]" title="Attribute">
                                    <CircleDot size={16} className="text-amber-600" />
                                </Button>
                            </div>
                        </>
                    )}
                </ContextMenuContent>
            </ContextMenu>

            <div className="absolute top-4 right-4 z-10">
                <Button variant="outline" size="sm" className="gap-2 bg-white/80 backdrop-blur">
                    <ExternalLink size={14} /> Open in VS Code
                </Button>
            </div>
        </div>
    );
}