// src/components/Sidebar.tsx
import { Node } from '@xyflow/react';
import { TypeDBNodeData } from '@/types';
import { Button } from '@/components/ui/button';

// Propsの型定義に deleteNode を追加
interface SidebarProps {
    selectedNode: Node<TypeDBNodeData> | null; // any を撲滅
    deleteNode: (id: string) => void;
}

export const Sidebar = ({ selectedNode, deleteNode }: SidebarProps) => {
    return (
        <aside className="w-64 border-l bg-card p-4">
            <h2 className="text-lg font-bold mb-4">Inspector</h2>

            {selectedNode ? (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">ID: {selectedNode.id}</p>
                    {/* 他の編集フィールドなど */}

                    <Button
                        variant="destructive"
                        className="w-full"
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