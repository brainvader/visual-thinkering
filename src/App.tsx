import React, { useCallback } from 'react';
import '@xyflow/react/dist/style.css';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";

import { useStore } from './store';
import { GraphCanvas } from './components/GraphCanvas';
import { Sidebar } from './components/Sidebar';

export default function App() {
  // 無限ループ防止のため個別に state を取得
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);
  const deleteNode = useStore((state) => state.deleteNode);

  const [selectedNode, setSelectedNode] = React.useState<any>(null);

  const onNodeClick = useCallback((_event: any, node: any) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">

      {/* メインエリア（上部） */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">

          {/* --- 左パネル: ユーザーの語り (Narration) --- */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="flex h-full flex-col border-r bg-muted/20">
              <div className="p-3 border-b bg-background/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                User Narration
              </div>
              <div className="flex-1 p-4 overflow-y-auto prose prose-sm dark:prose-invert">
                {/* ここにユーザーのテキストデータを流し込みます */}
                <p className="text-sm leading-relaxed text-foreground/80">
                  ここにユーザーの語り（ナラティブ）が表示されます。
                  ストーリーの断片や、抽出されたテキストがここに並びます。
                </p>
              </div>
            </div>
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

              {/* --- 下部パネル (フッター): LLM インターフェース --- */}
              <ResizablePanel defaultSize={25} minSize={10}>
                <div className="flex h-full flex-col border-t bg-background">
                  <div className="px-4 py-2 border-b bg-muted/30 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-muted-foreground">LLM Assistant</span>
                  </div>
                  <div className="flex-1 p-3 flex gap-3">
                    <textarea
                      className="flex-1 p-2 text-sm border rounded bg-muted/10 resize-none focus:ring-1 focus:ring-primary outline-none"
                      placeholder="「語り」からエンティティを抽出してグラフを更新して..."
                    />
                    <div className="flex flex-col gap-2">
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                        Send Instruction
                      </button>
                      <button className="px-4 py-2 border rounded text-xs font-medium hover:bg-muted transition-colors whitespace-nowrap">
                        Clear Context
                      </button>
                    </div>
                  </div>
                </div>
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