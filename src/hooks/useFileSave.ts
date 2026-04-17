// src/hooks/useFileSave.ts
//
// ファイル保存ロジックを担うカスタムフック。
// Tauri の fs / dialog プラグインを使い、JSONファイルへの書き出しを行う。
// 初回はダイアログでパスを選択、2回目以降は同パスへ上書きする。

import { useState } from 'react';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { save as dialogSave } from '@tauri-apps/plugin-dialog';
import { useStore } from '@/store';

// localStorage のキー定数
const SAVE_PATH_KEY = 'vt-save-path';

// ファイルに書き出す JSON の形式
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
    // 保存先パスを state で管理（localStorage から初期値を読み込む）
    const [filePath, setFilePath] = useState<string | null>(
        () => localStorage.getItem(SAVE_PATH_KEY)
    );

    const save = async () => {
        // ストアから現在の状態を取得する
        const { nodes, edges, narration } = useStore.getState();

        // 保存内容を組み立てる
        const data: SaveFileData = {
            version: 1,
            savedAt: new Date().toISOString(),
            nodes,
            edges,
            narration,
        };
        const json = JSON.stringify(data, null, 2);

        // パスが未設定の場合はダイアログを開く
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

        // ファイルに書き出す
        await writeTextFile(targetPath, json);

        // パスを記憶する
        localStorage.setItem(SAVE_PATH_KEY, targetPath);
        setFilePath(targetPath);
    };

    return { save, filePath };
}