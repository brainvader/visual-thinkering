// src/components/AppHeader.tsx
//
// アプリ上部のヘッダーバー。
// ファイル名の表示・保存ボタンを提供する。
// onBack が渡された場合は「← 一覧へ」ボタンも表示する。

import { Save, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
    filePath: string | null;
    onSave: () => void;
    // エディタ画面でのみ渡す。未指定時はボタンを表示しない。
    onBack?: () => void;
}

// パスからファイル名だけを取り出す（Windows / Unix 両対応）
function extractFileName(path: string): string {
    return path.split(/[\\/]/).pop() ?? path;
}

export function AppHeader({ filePath, onSave, onBack }: AppHeaderProps) {
    const fileName = filePath ? extractFileName(filePath) : null;

    return (
        <header className="flex h-10 items-center justify-between border-b bg-background px-4">
            {/* 左側：戻るボタン（onBack がある場合のみ表示） */}
            <div className="flex items-center gap-2">
                {onBack && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={onBack}
                    >
                        <ChevronLeft size={14} />
                        一覧へ
                    </Button>
                )}
                <span className="text-sm font-semibold text-foreground">
                    visual-thinkering
                </span>
            </div>

            {/* 中央：現在のファイル名 */}
            <span className="text-sm text-muted-foreground">
                {fileName ?? '未保存'}
            </span>

            {/* 右側：保存ボタン */}
            <Button
                variant="ghost"
                size="icon"
                aria-label="Save"
                onClick={onSave}
            >
                <Save size={16} />
            </Button>
        </header>
    );
}