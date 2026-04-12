import React, { useCallback } from 'react';
import '@xyflow/react/dist/style.css';

import { useStore } from './store';
import { GraphCanvas } from './components/GraphCanvas';
import { Sidebar } from './components/Sidebar';

// セレクタを使用して、必要な状態だけを抽出（最適化）
const selector = (state: any) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  deleteNode: state.deleteNode,
});

export default function App() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    deleteNode
  } = useStore(selector);

  // ノードがクリックされた時の処理などは App レベルで管理してもOK
  const [selectedNode, setSelectedNode] = React.useState(null);

  const onNodeClick = useCallback((_event: any, node: any) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="flex h-screen w-screen">
      <div className="flex-1 relative">
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
      </div>

      <Sidebar
        selectedNode={selectedNode}
        deleteNode={deleteNode}
      />

      {/* デバッグ用にストアの状態を Vitest 以外でも確認したい場合はここに Controls 等を配置 */}
    </div>
  );
}