// src/components/AppHeader.tsx
//
// アプリ上部のヘッダーバー。
// ファイル名の表示と保存ボタンを提供する。

import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
    // 現在の保存先パス（未設定時は null）
    filePath: string | null;
    onSave: () => void;
}

// パスからファイル名だけを取り出す（Windows / Unix 両対応）
function extractFileName(path: string): string {
    return path.split(/[\\/]/).pop() ?? path;
}

export function AppHeader({ filePath, onSave }: AppHeaderProps) {
    const fileName = filePath ? extractFileName(filePath) : null;

    return (
        <header className="flex h-10 items-center justify-between border-b bg-background px-4">
            {/* アプリ名 */}
            <span className="text-sm font-semibold text-foreground">
                visual-thinkering
            </span>

            {/* 現在のファイル名（未保存時はグレー表示） */}
            <span className="text-sm text-muted-foreground">
                {fileName ?? '未保存'}
            </span>

            {/* 保存ボタン */}
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