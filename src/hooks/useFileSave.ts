// src/hooks/useFileSave.ts
//
// ファイル保存ロジックを担うカスタムフック。
// save()   : パスが記憶済みなら上書き、なければダイアログを開く
// saveAs() : 常にダイアログを開き、コピー名（連番）で保存してパスを更新する
// 保存成功・失敗時に Sonner トーストで通知する。

import { useState } from 'react';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { save as dialogSave } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import { useStore } from '@/store';
import { useRecentProjectsStore } from '@/store/recentProjectsStore';
import { nextCopyName } from '@/lib/copyName';

const SAVE_PATH_KEY = 'vt-save-path';

interface UseFileSaveReturn {
    save: () => Promise<void>;
    saveAs: () => Promise<void>;
    filePath: string | null;
}

// 保存するデータを組み立てて JSON 文字列を返す（name を上書き可能）
function buildJson(overrideName?: string): string {
    const { nodes, edges, narration, projectName, projectDescription } =
        useStore.getState();

    return JSON.stringify(
        {
            version: 1,
            savedAt: new Date().toISOString(),
            name: overrideName ?? projectName,
            description: projectDescription,
            nodes,
            edges,
            narration,
        },
        null,
        2
    );
}

// 書き込み成功後の共通後処理
function afterSave(
    targetPath: string,
    name: string,
    description: string,
    setFilePath: (path: string) => void
): void {
    localStorage.setItem(SAVE_PATH_KEY, targetPath);
    setFilePath(targetPath);
    useStore.getState().markClean();

    useRecentProjectsStore.getState().addRecent({
        filePath: targetPath,
        name,
        description,
        lastOpenedAt: new Date().toISOString(),
    });

    toast.success('保存しました', {
        description: targetPath,
        duration: 2000,
    });
}

export function useFileSave(): UseFileSaveReturn {
    const [filePath, setFilePath] = useState<string | null>(
        () => localStorage.getItem(SAVE_PATH_KEY)
    );

    // パスが記憶済みなら上書き、なければダイアログを開く
    const save = async () => {
        let targetPath = filePath;

        if (!targetPath) {
            const selected = await dialogSave({
                defaultPath: 'default.json',
                filters: [{ name: 'JSON', extensions: ['json'] }],
            });
            if (!selected) return;
            targetPath = selected;
        }

        const { projectName, projectDescription } = useStore.getState();

        try {
            await writeTextFile(targetPath, buildJson());
            afterSave(targetPath, projectName, projectDescription, setFilePath);
        } catch (error) {
            toast.error('保存に失敗しました', { description: String(error) });
        }
    };

    // 常にダイアログを開き、コピー名（連番）で保存してパスを更新する
    const saveAs = async () => {
        const { projectName, projectDescription } = useStore.getState();

        // recentProjects の name 一覧から次のコピー名を生成する
        const existingNames = useRecentProjectsStore.getState().recents.map(r => r.name);
        const copyName = nextCopyName(projectName, existingNames);

        // 現在のファイル名をデフォルトパスに使う
        const defaultPath = filePath
            ? filePath.split(/[\\/]/).pop() ?? 'schema.json'
            : 'schema.json';

        const selected = await dialogSave({
            defaultPath,
            filters: [{ name: 'JSON', extensions: ['json'] }],
        });
        if (!selected) return;

        try {
            await writeTextFile(selected, buildJson(copyName));
            // store の projectName をコピー名に更新する
            useStore.getState().setProjectMeta(copyName, projectDescription);
            afterSave(selected, copyName, projectDescription, setFilePath);
        } catch (error) {
            toast.error('保存に失敗しました', { description: String(error) });
        }
    };

    return { save, saveAs, filePath };
}