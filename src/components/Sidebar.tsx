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
    updateNodeValueType: (nodeId: string, valueType: AttributeValueType) => void;
    updateNodeAbstract: (nodeId: string, isAbstract: boolean) => void;
    updateEdgeRole: (edgeId: string, role: string) => void;
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
    updateNodeAbstract,
    updateEdgeRole,
    nodes,
    edges,
}: SidebarProps) => {
    const currentNode = selectedNode
        ? (nodes.find((n) => n.id === selectedNode.id) ?? selectedNode)
        : null;

    const [editingLabel, setEditingLabel] = useState('');
    const originalLabelRef = useRef('');
    const [editingRole, setEditingRole] = useState('');
    const originalRoleRef = useRef('');

    useEffect(() => {
        const label = selectedNode?.data.label ?? '';
        setEditingLabel(label);
        originalLabelRef.current = label;
    }, [selectedNode?.id]);

    useEffect(() => {
        const role = selectedEdge?.data?.role ?? '';
        setEditingRole(role);
        originalRoleRef.current = role;
    }, [selectedEdge?.id]);

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

    const handleValueTypeChange = useCallback(
        (value: string) => {
            if (!selectedNode) return;
            updateNodeValueType(selectedNode.id, value as AttributeValueType);
        },
        [selectedNode, updateNodeValueType]
    );

    const handleAbstractChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!selectedNode) return;
            updateNodeAbstract(selectedNode.id, e.target.checked);
        },
        [selectedNode, updateNodeAbstract]
    );

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

    // owns エッジ（Attribute への接続）か判定する
    const isOwnsEdge = selectedEdge
        ? nodes.find((n) => n.id === selectedEdge.target)?.data.typeDBType === 'attribute'
        : false;

    // sub エッジ（継承）か判定する。role の概念がないため Role フィールドを非表示にする
    const isSubEdge = selectedEdge?.data?.edgeType === 'sub';

    return (
        <aside className="h-full border-l bg-card flex flex-col">
            <Tabs defaultValue="inspector" className="flex flex-col h-full">
                <TabsList className="w-full rounded-none border-b justify-start px-2 h-9 bg-transparent">
                    <TabsTrigger value="inspector" className="text-xs h-7">Inspector</TabsTrigger>
                    <TabsTrigger value="typeql" className="text-xs h-7">TypeQL</TabsTrigger>
                </TabsList>

                <TabsContent value="inspector" className="flex-1 overflow-y-auto p-4 mt-0">
                    {selectedNode ? (
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

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="node-abstract"
                                    checked={currentNode?.data.isAbstract ?? false}
                                    onChange={handleAbstractChange}
                                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                                    aria-label="abstract"
                                />
                                <Label htmlFor="node-abstract" className="text-xs font-medium cursor-pointer">
                                    Abstract
                                </Label>
                            </div>

                            {currentNode?.data.typeDBType === 'attribute' && (
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="value-type" className="text-xs font-medium">
                                        Value Type
                                    </Label>
                                    <Select
                                        value={currentNode?.data.valueType ?? 'string'}
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
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

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
                        <div className="flex flex-col gap-4">
                            <p className="text-xs text-muted-foreground font-mono">
                                Edge ID: {selectedEdge.id}
                            </p>
                            {/* owns エッジまたは sub エッジの場合は Role 入力欄を非表示にする */}
                            {!isOwnsEdge && !isSubEdge && (
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
                            )}
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

                <TabsContent value="typeql" className="flex-1 overflow-hidden mt-0">
                    <TypeQLPanel nodes={nodes} edges={edges} />
                </TabsContent>
            </Tabs>
        </aside>
    );
};