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
  Edge,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ExternalLink, Box, Diamond, CircleDot } from "lucide-react";

// 初期状態
const initialNodes: Node[] = [
  { id: '1', type: 'default', data: { label: '雇用関係 (Employment)' }, position: { x: 250, y: 250 } },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // ノード選択時のイベント
  const onNodeClick = (_: React.MouseEvent, node: Node) => setSelectedNode(node);
  const onPaneClick = () => setSelectedNode(null);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <ResizablePanelGroup orientation="horizontal" className="flex-1">

        {/* 左: Scenario Tree */}
        <ResizablePanel defaultSize={15} minSize={10} className="bg-muted/20">
          <div className="flex h-full flex-col p-4">
            <h3 className="mb-4 text-xs font-bold uppercase text-muted-foreground">Scenario</h3>
            <div className="space-y-1">
              {['雇用契約_2026', 'リハビリ会議_A氏', '投資シナリオ_PLTR'].map((item) => (
                <div key={item} className="cursor-pointer rounded px-2 py-1 text-sm hover:bg-accent">
                  {item}.txt
                </div>
              ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* 中央: Graph Canvas */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <div className="relative h-full w-full">
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
                <Background variant={BackgroundVariant.Dots} />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </ReactFlowProvider>

            {/* 外部エディタ連携ボタン（浮遊） */}
            <div className="absolute top-4 right-4 z-10">
              <Button variant="secondary" size="sm" className="gap-2 shadow-md">
                <ExternalLink size={14} /> Open in VS Code
              </Button>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* 右: Integrated Sidebar (Palette & Inspector) */}
        <ResizablePanel defaultSize={20} minSize={15} className="bg-card">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">

              {/* Palette Section (常に表示、または非選択時に強調) */}
              <section>
                <h3 className="mb-3 text-xs font-bold uppercase text-muted-foreground">Palette</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" className="justify-start gap-2 h-12"><Box size={16} /> Entity (矩形)</Button>
                  <Button variant="outline" className="justify-start gap-2 h-12"><Diamond size={16} /> Relation (菱形)</Button>
                  <Button variant="outline" className="justify-start gap-2 h-12"><CircleDot size={16} /> Attribute (楕円)</Button>
                </div>
              </section>

              <Separator />

              {/* Inspector Section */}
              <section>
                <h3 className="mb-3 text-xs font-bold uppercase text-muted-foreground">Inspector</h3>
                {selectedNode ? (
                  <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="p-0 mb-4">
                      <CardTitle className="text-sm">Edit Node: {selectedNode.id}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Label</label>
                        <Input
                          value={(selectedNode.data.label as string) || ''}
                          onChange={(e) => {
                            const newLabel = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: newLabel } } : n));
                          }}
                        />
                      </div>
                      <Button className="w-full text-xs" variant="secondary">Add Attribute</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-xs text-center text-muted-foreground py-10">
                    キャンバス上の要素を選択して<br />詳細を編集
                  </p>
                )}
              </section>
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* 下: AI Chat Interface */}
      <div className="h-16 border-t bg-card px-4 flex items-center gap-4">
        <MessageSquare className="text-muted-foreground" size={20} />
        <Input
          placeholder="AIに指示（例：この図をTypeQLに変換して、または文章から図を作成して）"
          className="flex-1 bg-muted/50 border-none focus-visible:ring-1"
        />
        <Button size="sm">Execute</Button>
      </div>
    </div>
  );
}