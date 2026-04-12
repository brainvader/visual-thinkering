// src/components/Sidebar.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { TypeDBNodeData, TypeDBEdgeData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SidebarProps {
    selectedNode: Node<TypeDBNodeData> | null;
    selectedEdge: Edge<TypeDBEdgeData> | null;
    deleteNode: (id: string) => void;
    deleteEdge: (id: string) => void;
    updateNodeLabel: (nodeId: string, label: string) => void;
    updateEdgeRole: (edgeId: string, role: string) => void;
}

export const Sidebar = ({
    selectedNode,
    selectedEdge,
    deleteNode,
    deleteEdge,
    updateNodeLabel,
    updateEdgeRole,
}: SidebarProps) => {
    // ノードラベル編集用ローカル state
    const [editingLabel, setEditingLabel] = useState('');
    const originalLabelRef = useRef('');

    // エッジロール名編集用ローカル state
    const [editingRole, setEditingRole] = useState('');
    const originalRoleRef = useRef('');

    // selectedNode が切り替わったらラベル入力をリセット
    useEffect(() => {
        const label = selectedNode?.data.label ?? '';
        setEditingLabel(label);
        originalLabelRef.current = label;
    }, [selectedNode?.id]);

    // selectedEdge が切り替わったらロール名入力をリセット
    useEffect(() => {
        const role = selectedEdge?.data?.role ?? '';
        setEditingRole(role);
        originalRoleRef.current = role;
    }, [selectedEdge?.id]);

    // ラベル確定
    const handleLabelConfirm = useCallback(() => {
        if (!selectedNode) return;
        const trimmed = editingLabel.trim();
        if (!trimmed) return;
        if (trimmed === originalLabelRef.current) return;
        updateNodeLabel(selectedNode.id, trimmed);
        originalLabelRef.current = trimmed;
    }, [selectedNode, editingLabel, updateNodeLabel]);

    const handleLabelKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') { e.preventDefault(); handleLabelConfirm(); }
            if (e.key === 'Escape') { setEditingLabel(originalLabelRef.current); }
        },
        [handleLabelConfirm]
    );

    // ロール名確定
    const handleRoleConfirm = useCallback(() => {
        if (!selectedEdge) return;
        const trimmed = editingRole.trim();
        if (!trimmed) return;
        if (trimmed === originalRoleRef.current) return;
        updateEdgeRole(selectedEdge.id, trimmed);
        originalRoleRef.current = trimmed;
    }, [selectedEdge, editingRole, updateEdgeRole]);

    const handleRoleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') { e.preventDefault(); handleRoleConfirm(); }
            if (e.key === 'Escape') { setEditingRole(originalRoleRef.current); }
        },
        [handleRoleConfirm]
    );

    return (
        <aside className="h-full border-l bg-card p-4 flex flex-col gap-4">
            <h2 className="text-lg font-bold">Inspector</h2>

            {selectedNode ? (
                /* ノードインスペクター */
                <div className="flex flex-col gap-4">
                    <p className="text-xs text-muted-foreground font-mono">
                        ID: {selectedNode.id}
                    </p>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="node-label" className="text-xs font-medium">
                            Label
                        </Label>
                        <Input
                            id="node-label"
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            onKeyDown={handleLabelKeyDown}
                            placeholder="ノード名を入力..."
                            className="h-8 text-sm"
                            aria-label="label"
                        />
                        <p className="text-[10px] text-muted-foreground/70">
                            Enter で確定 / Esc でキャンセル
                        </p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Type</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted w-fit capitalize">
                            {selectedNode.data.typeDBType}
                        </span>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full mt-auto"
                        onClick={() => deleteNode(selectedNode.id)}
                    >
                        Delete Node
                    </Button>
                </div>
            ) : selectedEdge ? (
                /* エッジインスペクター */
                <div className="flex flex-col gap-4">
                    <p className="text-xs text-muted-foreground font-mono">
                        Edge ID: {selectedEdge.id}
                    </p>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="edge-role" className="text-xs font-medium">
                            Role
                        </Label>
                        <Input
                            id="edge-role"
                            value={editingRole}
                            onChange={(e) => setEditingRole(e.target.value)}
                            onKeyDown={handleRoleKeyDown}
                            placeholder="ロール名を入力（例: employee）"
                            className="h-8 text-sm"
                            aria-label="role"
                        />
                        <p className="text-[10px] text-muted-foreground/70">
                            Enter で確定 / Esc でキャンセル
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full mt-auto"
                        onClick={() => deleteEdge(selectedEdge.id)}
                    >
                        Delete Edge
                    </Button>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">Select a node or edge to edit</p>
            )}
        </aside>
    );
};