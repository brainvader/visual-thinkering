import React, { useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, addEdge, Connection, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// 初期ノード（例：リハビリ会議の菱形）
const initialNodes = [
  { id: 'conf-1', type: 'default', data: { label: 'rehab-conference' }, position: { x: 250, y: 5 } },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'graph' | 'typeql'>('graph');
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);

  // 接続時のアクション（ここでTypeQL生成のフックを呼ぶ）
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
    console.log("New connection established:", params);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* タブ切り替えアイコンバー */}
      <div style={{ padding: '10px', background: '#333', display: 'flex', gap: '20px' }}>
        <button onClick={() => setActiveTab('graph')} style={{ opacity: activeTab === 'graph' ? 1 : 0.5 }}>
          🌐 Graph View
        </button>
        <button onClick={() => setActiveTab('typeql')} style={{ opacity: activeTab === 'typeql' ? 1 : 0.5 }}>
          📄 TypeQL View
        </button>
      </div>

      {/* メインコンテンツ */}
      <div style={{ flexGrow: 1 }}>
        {activeTab === 'graph' ? (
          <ReactFlow nodes={nodes} edges={edges} onConnect={onConnect} fitView>
            <Background />
            <Controls />
          </ReactFlow>
        ) : (
          <div style={{ padding: '20px', backgroundColor: '#1e1e1e', color: '#fff', height: '100%' }}>
            <pre>
              {`define\n  ${edges.map(e => `${e.source} plays ${e.target}:participant;`).join('\n  ')}`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}