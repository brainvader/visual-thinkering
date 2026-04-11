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
    ContextMenuTrigger
} from "@/components/ui/context-menu";
import { Trash2, PlusCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GraphCanvasProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange<Node>; // <Node> を明示
    onEdgesChange: OnEdgesChange<Edge>; // <Edge> を明示
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

                <ContextMenuContent className="w-56">
                    {selectedNode ? (
                        <ContextMenuItem className="gap-2 text-red-500" onClick={deleteNode}>
                            <Trash2 size={14} /> Delete Node
                        </ContextMenuItem>
                    ) : (
                        <ContextMenuItem className="gap-2">
                            <PlusCircle size={14} /> Add New Entity
                        </ContextMenuItem>
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