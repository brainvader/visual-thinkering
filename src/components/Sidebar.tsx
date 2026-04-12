// src/components/Sidebar.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Node } from '@xyflow/react';
import { TypeDBNodeData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SidebarProps {
    selectedNode: Node<TypeDBNodeData> | null;
    deleteNode: (id: string) => void;
    updateNodeLabel: (nodeId: string, label: string) => void;
}

export const Sidebar = ({ selectedNode, deleteNode, updateNodeLabel }: SidebarProps) => {
    // 確定前の編集中テキストはローカル state で管理（ストアを汚さない）
    const [editingLabel, setEditingLabel] = useState('');
    // キャンセル時に元の値に戻すための参照
    const originalLabelRef = useRef('');

    // selectedNode が切り替わったら編集中テキストをリセット
    useEffect(() => {
        const label = selectedNode?.data.label ?? '';
        setEditingLabel(label);
        originalLabelRef.current = label;
    }, [selectedNode?.id]);

    const handleConfirm = useCallback(() => {
        if (!selectedNode) return;
        const trimmed = editingLabel.trim();
        // 空文字列は確定しない
        if (!trimmed) return;
        // 元のラベルと同じなら無駄な更新をスキップ
        if (trimmed === originalLabelRef.current) return;
        updateNodeLabel(selectedNode.id, trimmed);
        // 確定後に originalLabel を更新
        originalLabelRef.current = trimmed;
    }, [selectedNode, editingLabel, updateNodeLabel]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
            }
            if (e.key === 'Escape') {
                // 編集をキャンセルして元のラベルに戻す
                setEditingLabel(originalLabelRef.current);
            }
        },
        [handleConfirm]
    );

    return (
        <aside className="h-full border-l bg-card p-4 flex flex-col gap-4">
            <h2 className="text-lg font-bold">Inspector</h2>

            {selectedNode ? (
                <div className="flex flex-col gap-4">
                    {/* ノード情報 */}
                    <p className="text-xs text-muted-foreground font-mono">
                        ID: {selectedNode.id}
                    </p>

                    {/* ラベル編集フィールド */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="node-label" className="text-xs font-medium">
                            Label
                        </Label>
                        <Input
                            id="node-label"
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            onKeyDown={handleKeyDown}
                            // onBlur では確定しない（Enter による明示的な確定のみ有効）
                            placeholder="ノード名を入力..."
                            className="h-8 text-sm"
                            aria-label="label"
                        />
                        <p className="text-[10px] text-muted-foreground/70">
                            Enter で確定 / Esc でキャンセル
                        </p>
                    </div>

                    {/* TypeDB メタ型バッジ */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Type</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted w-fit capitalize">
                            {selectedNode.data.typeDBType}
                        </span>
                    </div>

                    {/* 削除ボタン */}
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full mt-auto"
                        onClick={() => deleteNode(selectedNode.id)}
                    >
                        Delete Node
                    </Button>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">Select a node to edit</p>
            )}
        </aside>
    );
};