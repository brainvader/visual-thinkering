import React from 'react';
import { Node } from '@xyflow/react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Box, Diamond, CircleDot } from "lucide-react";

interface SidebarProps {
    selectedNode: Node | null;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export function Sidebar({ selectedNode, setNodes }: SidebarProps) {
    return (
        <ScrollArea className="h-full bg-white border-l">
            <div className="p-5 space-y-8">
                <section>
                    <h3 className="mb-4 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Palette</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <Button variant="outline" className="justify-start gap-3 h-11 hover:bg-zinc-50">
                            <Box size={18} className="text-blue-600" /> Entity
                        </Button>
                        <Button variant="outline" className="justify-start gap-3 h-11 hover:bg-zinc-50">
                            <Diamond size={18} className="text-emerald-600" /> Relation
                        </Button>
                        <Button variant="outline" className="justify-start gap-3 h-11 hover:bg-zinc-50">
                            <CircleDot size={18} className="text-amber-600" /> Attribute
                        </Button>
                    </div>
                </section>

                <Separator />

                <section>
                    <h3 className="mb-4 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Inspector</h3>
                    {selectedNode ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase">Label</label>
                                <Input
                                    className="text-sm"
                                    value={(selectedNode.data.label as string) || ''}
                                    onChange={(e) => {
                                        const newLabel = e.target.value;
                                        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: newLabel } } : n));
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                            <Box size={40} className="mb-4" />
                            <p className="text-xs">ノードを選択して編集</p>
                        </div>
                    )}
                </section>
            </div>
        </ScrollArea>
    );
}