import React, { useCallback } from 'react';
import { Node } from '@xyflow/react';
import { TypeDBNodeData } from '@/types';
import '@xyflow/react/dist/style.css';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";

import { useStore } from './store';
import { GraphCanvas } from './components/GraphCanvas';
import { Sidebar } from './components/Sidebar';
import { LLMAssistant } from './components/LLMAssistant';
import { NarrationPanel } from './components/NarrationPanel';

export default function App() {
  // 無限ループ防止のため個別に state を取得
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);
  const deleteNode = useStore((state) => state.deleteNode);

  const [selectedNode, setSelectedNode] = React.useState<Node<TypeDBNodeData> | null>(null);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<TypeDBNodeData>) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // 将来 LLM API を呼び出す箇所。今は console.log で受け取るだけ
  const handleSendInstruction = useCallback((instruction: string) => {
    // TODO: LLM API に instruction + 現在の nodes/edges を渡してグラフを更新する
    console.log('[LLM] instruction:', instruction);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">

      {/* メインエリア（上部） */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">

          {/* --- 左パネル: ユーザーの語り (Narration) --- */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <NarrationPanel />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* --- 中央パネル: グラフキャンバス --- */}
          <ResizablePanel defaultSize={60}>
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize={75}>
                <main className="relative h-full w-full">
                  <GraphCanvas
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    selectedNode={selectedNode}
                    deleteNode={deleteNode}
                  />
                </main>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* JSX 内、LLMインターフェースパネル部分を置き換え */}
              <ResizablePanel defaultSize={25} minSize={10}>
                <LLMAssistant onSendInstruction={handleSendInstruction} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* --- 右パネル: インスペクター (Sidebar) --- */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <Sidebar
              selectedNode={selectedNode}
              deleteNode={deleteNode}
            />
          </ResizablePanel>

        </ResizablePanelGroup>
      </div>
    </div>
  );
}