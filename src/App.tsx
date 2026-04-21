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

interface AppProps {
  onBack?: () => void;
}

export default function App({ onBack }: AppProps) {
  // Store から必要な状態とアクションを抽出
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
  const viewport = useStore((s) => s.viewport);
  const setViewport = useStore((s) => s.setViewport);
  const isDirty = useStore((s) => s.isDirty);
  const markClean = useStore((s) => s.markClean);
  const markDirty = useStore((s) => s.markDirty);
  const setProjectMeta = useStore((s) => s.setProjectMeta);
  const updateNodeAbstract = useStore((s) => s.updateNodeAbstract);

  const [selectedNode, setSelectedNode] = React.useState<Node<TypeDBNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = React.useState<Edge<TypeDBEdgeData> | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = React.useState(false);

  // 1. useFileSave の設定
  // useStore への依存を解消し、callback でストアを更新するように修正
  const { save, saveAs, filePath } = useFileSave({
    onSuccess: (_, name, description) => {
      markClean();
      setProjectMeta(name, description);
    },
  });

  const { load } = useFileLoad();

  // アプリ終了時の未保存確認
  useCloseGuard({
    onRequestClose: () => {
      if (isDirty) {
        setCloseDialogOpen(true);
      } else {
        getCurrentWindow().close();
      }
    },
  });

  // 初期読み込み
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<TypeDBNodeData>) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge<TypeDBEdgeData>) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    deleteNode(nodeId);
    setSelectedNode(null);
  }, [deleteNode]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    deleteEdge(edgeId);
    setSelectedEdge(null);
  }, [deleteEdge]);

  const onNodeAdded = useCallback((nodeId: string) => {
    const node = useStore.getState().nodes.find((n) => n.id === nodeId) ?? null;
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const handleSendInstruction = useCallback(
    (instruction: string) => {
      console.log('[LLM] instruction:', instruction);
    },
    []
  );

  // 2. ショートカットキーのイベントハンドラ
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      save(); // ここで useFileSave の save を実行
    }
  }, [save]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      <AppHeader
        filePath={filePath}
        onSave={save}
        onSaveAs={saveAs}
        onBack={onBack}
      />

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
                    // 3. スペックに基づき、ドラッグ終了時に markDirty を実行
                    onNodeDragStop={() => markDirty()}
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
              updateNodeAbstract={updateNodeAbstract}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}