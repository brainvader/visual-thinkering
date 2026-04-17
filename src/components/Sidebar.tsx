// src/components/Sidebar.tsx
// Inspector タブ（ノード/エッジ編集）と TypeQL タブの2タブ構成

import { useState, useEffect, useCallback, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { TypeDBNodeData, TypeDBEdgeData, AttributeValueType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TypeQLPanel } from './TypeQLPanel';

// TypeDB がサポートする value 型の選択肢
const VALUE_TYPE_OPTIONS: { value: AttributeValueType; label: string }[] = [
    { value: 'string', label: 'string' },
    { value: 'long', label: 'long' },
    { value: 'double', label: 'double' },
    { value: 'boolean', label: 'boolean' },
    { value: 'datetime', label: 'datetime' },
];

interface SidebarProps {
    selectedNode: Node<TypeDBNodeData> | null;
    selectedEdge: Edge<TypeDBEdgeData> | null;
    deleteNode: (id: string) => void;
    deleteEdge: (id: string) => void;
    updateNodeLabel: (nodeId: string, label: string) => void;
    // Attribute ノードの value 型更新
    updateNodeValueType: (nodeId: string, valueType: AttributeValueType) => void;
    updateEdgeRole: (edgeId: string, role: string) => void;
    // TypeQL タブ用
    nodes: Node<TypeDBNodeData>[];
    edges: Edge<TypeDBEdgeData>[];
}

export const Sidebar = ({
    selectedNode,
    selectedEdge,
    deleteNode,
    deleteEdge,
    updateNodeLabel,
    updateNodeValueType,
    updateEdgeRole,
    nodes,
    edges,
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

    // value 型変更：ドロップダウン選択は即時確定なので onValueChange で直接 dispatch する
    const handleValueTypeChange = useCallback(
        (value: string) => {
            if (!selectedNode) return;
            updateNodeValueType(selectedNode.id, value as AttributeValueType);
        },
        [selectedNode, updateNodeValueType]
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
        <aside className="h-full border-l bg-card flex flex-col">
            <Tabs defaultValue="inspector" className="flex flex-col h-full">
                <TabsList className="w-full rounded-none border-b justify-start px-2 h-9 bg-transparent">
                    <TabsTrigger value="inspector" className="text-xs h-7">Inspector</TabsTrigger>
                    <TabsTrigger value="typeql" className="text-xs h-7">TypeQL</TabsTrigger>
                </TabsList>

                {/* Inspector タブ */}
                <TabsContent value="inspector" className="flex-1 overflow-y-auto p-4 mt-0">
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
                                    autoComplete="off"
                                />
                                <p className="text-[10px] text-muted-foreground/70">
                                    Enter で確定 / Esc でキャンセル
                                </p>
                            </div>

                            {/* Attribute ノード選択時のみ value 型セレクトを表示 */}
                            {selectedNode.data.typeDBType === 'attribute' && (
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="value-type" className="text-xs font-medium">
                                        Value Type
                                    </Label>
                                    <Select
                                        value={selectedNode.data.valueType ?? 'string'}
                                        onValueChange={handleValueTypeChange}
                                    >
                                        <SelectTrigger
                                            id="value-type"
                                            className="h-8 text-sm"
                                            aria-label="value type"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {VALUE_TYPE_OPTIONS.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                    className="text-sm"
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

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
                                    autoComplete="off"
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
                </TabsContent>

                {/* TypeQL タブ */}
                <TabsContent value="typeql" className="flex-1 overflow-hidden mt-0">
                    <TypeQLPanel nodes={nodes} edges={edges} />
                </TabsContent>
            </Tabs>
        </aside>
    );
};