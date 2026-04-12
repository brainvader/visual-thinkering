// src/components/NarrationPanel.tsx

import { useStore } from '@/store';
import { Textarea } from '@/components/ui/textarea';
import { ScrollText } from 'lucide-react';

export function NarrationPanel() {
    // narration はグローバル state（LLMAssistant からも参照される）
    const narration = useStore((s) => s.narration);
    const setNarration = useStore((s) => s.setNarration);

    return (
        <div className="flex h-full flex-col border-r bg-muted/20">
            {/* ヘッダー */}
            <div className="p-3 border-b bg-background/50 flex items-center gap-2">
                <ScrollText size={13} className="text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    User Narration
                </span>
            </div>

            {/* テキスト入力エリア */}
            <div className="flex-1 p-3 overflow-hidden">
                <Textarea
                    className="h-full w-full resize-none bg-transparent border-none
                     text-sm leading-relaxed text-foreground/80
                     focus-visible:ring-0 focus-visible:ring-offset-0
                     placeholder:text-muted-foreground/50"
                    placeholder={"ここにナラティブを入力してください...\n\n例）\n田中さんは東京大学の研究者で、AI倫理を専門としている。彼女は山田教授の研究室に所属しており..."}
                    value={narration}
                    onChange={(e) => setNarration(e.target.value)}
                />
            </div>

            {/* フッター: 文字数カウント */}
            {narration.length > 0 && (
                <div className="px-3 py-1.5 border-t bg-background/30">
                    <span className="text-[10px] text-muted-foreground/60">
                        {narration.length} 文字
                    </span>
                </div>
            )}
        </div>
    );
}