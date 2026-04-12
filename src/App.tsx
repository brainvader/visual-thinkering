// src/App.tsx
import React, { useCallback } from 'react';
import { Node } from '@xyflow/react';
import { TypeDBNodeData } from '@/types';
import '@xyflow/react/dist/style.css';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

import { useStore } from './store';
import { GraphCanvas } from './components/GraphCanvas';
import { Sidebar } from './components/Sidebar';
import { NarrationPanel } from './components/NarrationPanel';
import { LLMAssistant } from './components/LLMAssistant';

export default function App() {
  // 無限ループ防止のため個別に state を取得
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const onNodesChange = useStore((s) => s.onNodesChange);
  const onEdgesChange = useStore((s) => s.onEdgesChange);
  const onConnect = useStore((s) => s.onConnect);
  const deleteNode = useStore((s) => s.deleteNode);
  const addNode = useStore((s) => s.addNode);
  const updateNodeLabel = useStore((s) => s.updateNodeLabel);
  const narration = useStore((s) => s.narration);

  // 選択中ノードはグラフ状態とは独立した UI の一時状態
  const [selectedNode, setSelectedNode] = React.useState<Node<TypeDBNodeData> | null>(null);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<TypeDBNodeData>) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // ノード追加直後に選択状態にする（Sidebar にすぐ反映）
  const onNodeAdded = useCallback(() => {
    // addNode は store の末尾に追加するため、最新の nodes から取得
    const latest = useStore.getState().nodes.at(-1) ?? null;
    setSelectedNode(latest);
  }, []);

  // LLM への命令送信（将来 narration + instruction を API に渡す）
  const handleSendInstruction = useCallback(
    (instruction: string) => {
      // TODO: LLM API に instruction + narration + nodes/edges を渡してグラフを更新
      console.log('[LLM] instruction:', instruction);
      console.log('[LLM] context (narration):', narration);
    },
    [narration]
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">

          {/* --- 左パネル: ユーザーの語り (Narration) --- */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <NarrationPanel />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* --- 中央パネル: グラフキャンバス + LLM アシスタント --- */}
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
                    addNode={addNode}
                    onNodeAdded={onNodeAdded}
                  />
                </main>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* --- 下部パネル: LLM インターフェース --- */}
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
              updateNodeLabel={updateNodeLabel}
            />
          </ResizablePanel>

        </ResizablePanelGroup>
      </div>
    </div>
  );
}