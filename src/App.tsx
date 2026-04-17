// src/App.tsx
import React, { useEffect, useCallback } from 'react';
import { AppHeader } from './AppHeader';
import { useFileSave } from './hooks/useFileSave';
import { useFileLoad } from '@/hooks/useFileLoad';
import { Node, Edge } from '@xyflow/react';
import { TypeDBNodeData, TypeDBEdgeData } from '@/types';
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
import { useCloseGuard } from './hooks/useCloseGuard';
import { UnsavedDialog } from './components/UnsavedDialog';
import { getCurrentWindow } from '@tauri-apps/api/window';

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
  const updateNodeValueType = useStore((s) => s.updateNodeValueType);
  const updateEdgeRole = useStore((s) => s.updateEdgeRole);
  const deleteEdge = useStore((s) => s.deleteEdge);
  const narration = useStore((s) => s.narration);
  const viewport = useStore((s) => s.viewport);
  const setViewport = useStore((s) => s.setViewport);

  // 選択状態はグラフ状態とは独立した UI の一時状態
  // ノードとエッジは同時選択しない
  const [selectedNode, setSelectedNode] = React.useState<Node<TypeDBNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = React.useState<Edge<TypeDBEdgeData> | null>(null);

  // ファイル保存フック
  const { save, filePath } = useFileSave();
  const { load } = useFileLoad();

  const [closeDialogOpen, setCloseDialogOpen] = React.useState(false);

  // アプリ終了時の未保存確認
  useCloseGuard({
    onRequestClose: () => setCloseDialogOpen(true),
  });


  // アプリ起動時にファイルを読み込む
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<TypeDBNodeData>) => {
    setSelectedNode(node);
    setSelectedEdge(null); // エッジ選択を解除
  }, []);

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge<TypeDBEdgeData>) => {
    setSelectedEdge(edge);
    setSelectedNode(null); // ノード選択を解除
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // 削除後にインスペクターも閉じる
  const handleDeleteNode = useCallback((nodeId: string) => {
    deleteNode(nodeId);
    setSelectedNode(null);
  }, [deleteNode]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    deleteEdge(edgeId);
    setSelectedEdge(null);
  }, [deleteEdge]);

  // ノード追加直後に選択状態にする
  const onNodeAdded = useCallback((nodeId: string) => {
    const node = useStore.getState().nodes.find((n) => n.id === nodeId) ?? null;
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  // LLM への命令送信
  const handleSendInstruction = useCallback(
    (instruction: string) => {
      console.log('[LLM] instruction:', instruction);
      console.log('[LLM] context (narration):', narration);
    },
    [narration]
  );

  // Ctrl+S でファイル保存を発火する
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      save();
    }
  }, [save]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      {/* ヘッダーバーを最上部に追加 */}
      <AppHeader filePath={filePath} onSave={save} />

      {/* 未保存確認ダイアログ */}
      <UnsavedDialog
        open={closeDialogOpen}
        onSaveAndClose={async () => {
          await save();
          getCurrentWindow().close();
        }}
        onDiscardAndClose={() => {
          getCurrentWindow().close();
        }}
        onCancel={() => setCloseDialogOpen(false)}
      />

      {/* 既存の4パネルレイアウト（変更なし） */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">

          <ResizablePanel defaultSize={20} minSize={15}>
            <NarrationPanel />
          </ResizablePanel>

          <ResizableHandle withHandle />

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
                    onEdgeClick={onEdgeClick}
                    onPaneClick={onPaneClick}
                    selectedNode={selectedNode}
                    deleteNode={handleDeleteNode}
                    deleteEdge={handleDeleteEdge}
                    addNode={addNode}
                    onNodeAdded={onNodeAdded}
                    viewport={viewport}
                    setViewport={setViewport}
                  />
                </main>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={25} minSize={10}>
                <LLMAssistant onSendInstruction={handleSendInstruction} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={20} minSize={15}>
            <Sidebar
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              deleteNode={handleDeleteNode}
              deleteEdge={handleDeleteEdge}
              updateNodeLabel={updateNodeLabel}
              updateNodeValueType={updateNodeValueType}
              updateEdgeRole={updateEdgeRole}
              nodes={nodes}
              edges={edges}
            />
          </ResizablePanel>

        </ResizablePanelGroup>
      </div>
    </div>
  );
}