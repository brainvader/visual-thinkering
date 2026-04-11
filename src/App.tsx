import React, { useCallback, useState } from 'react';
import { useNodesState, useEdgesState, addEdge, Connection, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 分割したコンポーネントをインポート
import { GraphCanvas } from './components/GraphCanvas';
import { Sidebar } from './components/Sidebar';

const initialNodes: Node[] = [
  { id: '1', type: 'default', data: { label: '雇用関係 (Employment)' }, position: { x: 250, y: 250 } },
];

const initialEdges: Edge[] = [];


export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const onNodeClick = (_: React.MouseEvent, node: Node) => setSelectedNode(node);
  const onPaneClick = () => setSelectedNode(null);

  const deleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes]);

  return (
    <div className="h-screen w-full flex flex-col bg-zinc-50 text-zinc-900">
      <ResizablePanelGroup orientation="horizontal" className="flex-1">

        {/* Scenario Tree */}
        <ResizablePanel defaultSize={15} minSize={10} className="bg-white border-r">
          <div className="p-4">
            <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Scenario</h3>
            {/* ここも必要に応じてコンポーネント化 */}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-200" />

        {/* Graph Area */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <GraphCanvas
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onNodeClick={onNodeClick}
            onPaneClick={onPaneClick} selectedNode={selectedNode}
            deleteNode={deleteNode}
          />
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-200" />

        {/* Sidebar Area */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <Sidebar selectedNode={selectedNode} setNodes={setNodes} />
        </ResizablePanel>

      </ResizablePanelGroup>

      {/* Chat Interface */}
      <div className="h-16 border-t bg-white px-6 flex items-center gap-4">
        <MessageSquare className="text-blue-600" size={20} />
        <Input placeholder="AIに指示を出す..." className="flex-1 border-none bg-zinc-100/50" />
        <Button size="sm" className="bg-zinc-900 text-white px-6">Execute</Button>
      </div>
    </div>
  );
}