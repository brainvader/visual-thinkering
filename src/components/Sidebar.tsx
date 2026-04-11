import React from 'react';
import { Node } from '@xyflow/react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Box } from "lucide-react";

interface SidebarProps {
    selectedNode: Node | null;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export function Sidebar({ selectedNode, setNodes }: SidebarProps) {
    return (
        <ScrollArea className="h-full bg-white border-l">
            <div className="p-5 space-y-6">
                <section>
                    <h3 className="mb-4 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
                        Inspector
                    </h3>

                    {selectedNode ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-1 duration-200">
                            {/* 基本情報ラベル */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase">
                                    Label
                                </label>
                                <Input
                                    className="text-sm bg-zinc-50/50 border-zinc-200 focus:bg-white transition-colors"
                                    value={(selectedNode.data.label as string) || ''}
                                    onChange={(e) => {
                                        const newLabel = e.target.value;
                                        setNodes(nds => nds.map(n =>
                                            n.id === selectedNode.id
                                                ? { ...n, data: { ...n.data, label: newLabel } }
                                                : n
                                        ));
                                    }}
                                />
                            </div>

                            <Separator className="bg-zinc-100" />

                            {/* 追加のアクションなど */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase">
                                    Actions
                                </label>
                                <Button variant="outline" className="w-full text-xs justify-start gap-2 h-9 border-dashed text-zinc-500 hover:text-zinc-900">
                                    + Add Property
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="relative mb-4">
                                <Box size={40} className="text-zinc-200" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-1 h-1 bg-zinc-300 rounded-full animate-pulse" />
                                </div>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                キャンバス上の要素を選択して<br />
                                プロパティを編集
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </ScrollArea>
    );
}