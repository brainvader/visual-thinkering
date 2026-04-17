// src/hooks/useFileSave.ts
//
// ファイル保存ロジックを担うカスタムフック。
// 保存成功・失敗時に Sonner トーストで通知する。

import { useState } from 'react';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { save as dialogSave } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import { useStore } from '@/store';

const SAVE_PATH_KEY = 'vt-save-path';

interface SaveFileData {
    version: number;
    savedAt: string;
    nodes: unknown[];
    edges: unknown[];
    narration: string;
}

interface UseFileSaveReturn {
    save: () => Promise<void>;
    filePath: string | null;
}

export function useFileSave(): UseFileSaveReturn {
    const [filePath, setFilePath] = useState<string | null>(
        () => localStorage.getItem(SAVE_PATH_KEY)
    );

    const save = async () => {
        const { nodes, edges, narration } = useStore.getState();

        const data: SaveFileData = {
            version: 1,
            savedAt: new Date().toISOString(),
            nodes,
            edges,
            narration,
        };
        const json = JSON.stringify(data, null, 2);

        let targetPath = filePath;

        if (!targetPath) {
            const selected = await dialogSave({
                defaultPath: 'default.json',
                filters: [{ name: 'JSON', extensions: ['json'] }],
            });

            // キャンセルされた場合は何もしない
            if (!selected) return;

            targetPath = selected;
        }

        try {
            await writeTextFile(targetPath, json);
            localStorage.setItem(SAVE_PATH_KEY, targetPath);
            setFilePath(targetPath);

            await writeTextFile(targetPath, json);
            localStorage.setItem(SAVE_PATH_KEY, targetPath);
            setFilePath(targetPath);

            // 保存成功時に dirty フラグをリセットする
            useStore.getState().markClean();

            // フルパスをトーストに表示する
            toast.success('保存しました', {
                description: targetPath,
                duration: 2000,
            });
        } catch (error) {
            toast.error('保存に失敗しました', {
                description: String(error),
            });
        }
    };

    return { save, filePath };
}