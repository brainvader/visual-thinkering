import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  MessageSquare,
  ExternalLink,
  Box,
  Diamond,
  CircleDot,
  Trash2,
  PlusCircle
} from "lucide-react";

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'default',
    data: { label: '雇用関係 (Employment)' },
    position: { x: 250, y: 250 },
  },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => setSelectedNode(node);
  const onPaneClick = () => setSelectedNode(null);

  const deleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes]);

  return (
    // 'dark' クラスを削除し、標準的なライトモードの背景 (bg-white/zinc-50) に変更
    <div className="h-screen w-full flex flex-col bg-zinc-50 text-zinc-900">
      <ResizablePanelGroup orientation="horizontal" className="flex-1">

        {/* 左: Scenario */}
        <ResizablePanel defaultSize={15} minSize={10} className="bg-white border-r">
          <div className="flex h-full flex-col p-4">
            <h3 className="mb-4 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Scenario</h3>
            <div className="space-y-1">
              {['雇用契約_2026', 'リハビリ会議_A氏', '投資シナリオ_PLTR'].map((item) => (
                <div key={item} className="cursor-pointer rounded px-2 py-2 text-sm hover:bg-zinc-100 transition-colors">
                  {item}.txt
                </div>
              ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-200" />

        {/* 中央: Graph Canvas */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <ContextMenu>
            <ContextMenuTrigger className="h-full w-full">
              <div className="relative h-full w-full bg-white">
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
                    {/* 背景のドットを少し見えやすく調整 */}
                    <Background variant={BackgroundVariant.Dots} color="#e2e2e7" gap={20} />
                    <Controls />
                    <MiniMap
                      style={{ backgroundColor: '#fff' }}
                      nodeColor="#e2e2e7"
                    />
                  </ReactFlow>
                </ReactFlowProvider>

                <div className="absolute top-4 right-4 z-10">
                  <Button variant="outline" size="sm" className="gap-2 bg-white/80 backdrop-blur">
                    <ExternalLink size={14} /> Open in VS Code
                  </Button>
                </div>
              </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-56">
              {selectedNode ? (
                <ContextMenuItem className="gap-2" onClick={deleteNode}>
                  <Trash2 size={14} className="text-red-500" /> Delete Node
                </ContextMenuItem>
              ) : (
                <ContextMenuItem className="gap-2">
                  <PlusCircle size={14} /> Add New Entity
                </ContextMenuItem>
              )}
            </ContextMenuContent>
          </ContextMenu>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-200" />

        {/* 右: Integrated Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} className="bg-white border-l">
          <ScrollArea className="h-full">
            <div className="p-5 space-y-8">
              <section>
                <h3 className="mb-4 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Palette</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" className="justify-start gap-3 h-11 hover:bg-zinc-50">
                    <Box size={18} className="text-blue-600" /> Entity (矩形)
                  </Button>
                  <Button variant="outline" className="justify-start gap-3 h-11 hover:bg-zinc-50">
                    <Diamond size={18} className="text-emerald-600" /> Relation (菱形)
                  </Button>
                  <Button variant="outline" className="justify-start gap-3 h-11 hover:bg-zinc-50">
                    <CircleDot size={18} className="text-amber-600" /> Attribute (楕円)
                  </Button>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="mb-4 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Inspector</h3>
                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Label</label>
                      <Input
                        className="text-sm"
                        value={(selectedNode.data.label as string) || ''}
                        onChange={(e) => {
                          const newLabel = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: newLabel } } : n));
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <Box size={40} className="mb-4" />
                    <p className="text-xs">ノードを選択して編集</p>
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* 下: AI Chat Interface */}
      <div className="h-16 border-t bg-white px-6 flex items-center gap-4">
        <MessageSquare className="text-blue-600" size={20} />
        <Input
          placeholder="AIに指示を出す..."
          className="flex-1 border-none bg-zinc-100/50 focus-visible:ring-0"
        />
        <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800 px-6">Execute</Button>
      </div>
    </div>
  );
}