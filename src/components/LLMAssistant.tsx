// src/components/LLMAssistant.tsx

import { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Trash2 } from 'lucide-react';

interface LLMAssistantProps {
    /** 命令文を送信する際のコールバック（将来の LLM API 呼び出し差し込み口） */
    onSendInstruction: (instruction: string) => void;
}

export function LLMAssistant({ onSendInstruction }: LLMAssistantProps) {
    // 入力テキストはローカル state で管理（グラフ状態とは独立）
    const [instruction, setInstruction] = useState('');

    const handleSend = useCallback(() => {
        const trimmed = instruction.trim();
        if (!trimmed) return;
        onSendInstruction(trimmed);
        setInstruction(''); // 送信後にクリア
    }, [instruction, onSendInstruction]);

    const handleClear = useCallback(() => {
        setInstruction('');
    }, []);

    // Cmd/Ctrl + Enter で送信
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    return (
        <div className="flex h-full flex-col border-t bg-background">
            {/* ヘッダー */}
            <div className="px-4 py-2 border-b bg-muted/30 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-muted-foreground">
                    LLM Assistant
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                    ⌘ + Enter で送信
                </span>
            </div>

            {/* 入力エリア */}
            <div className="flex-1 p-3 flex gap-3">
                <Textarea
                    className="flex-1 text-sm bg-muted/10 resize-none focus-visible:ring-1"
                    placeholder="「語り」からエンティティを抽出してグラフを更新して..."
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="flex flex-col gap-2">
                    <Button
                        size="sm"
                        className="gap-1.5 whitespace-nowrap"
                        disabled={!instruction.trim()}
                        onClick={handleSend}
                    >
                        <Send size={13} />
                        Send
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 whitespace-nowrap"
                        disabled={!instruction.trim()}
                        onClick={handleClear}
                    >
                        <Trash2 size={13} />
                        Clear
                    </Button>
                </div>
            </div>
        </div>
    );
}
