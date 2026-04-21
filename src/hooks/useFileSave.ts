// src/hooks/useFileSave.ts

import { useState } from 'react';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { save as dialogSave } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import { useRecentProjectsStore } from '@/store/recentProjectsStore';
import { nextCopyName } from '@/lib/copyName';
import { collectSaveData } from '@/store/selectors';
import { Node, Edge } from '@xyflow/react';
import { TypeDBNodeData, TypeDBEdgeData } from '@/types';

const SAVE_PATH_KEY = 'vt-save-path';

// 2. 保存データの型を定義しておくと安全です
interface SaveData {
    version: number;
    savedAt: string;
    name: string;
    description: string;
    nodes: Node<TypeDBNodeData>[];
    edges: Edge<TypeDBEdgeData>[];
    narration: string;
}

// 保存成功時に呼び出されるコールバック型
interface SaveOptions {
    onSuccess?: (newPath: string, name: string, description: string) => void;
}

interface UseFileSaveReturn {
    save: () => Promise<void>;
    saveAs: () => Promise<void>;
    filePath: string | null;
}

function buildJson(overrideName?: string): string {
    const { nodes, edges, narration, projectName, projectDescription } = collectSaveData();

    const data: SaveData = {
        version: 1,
        savedAt: new Date().toISOString(),
        name: overrideName ?? projectName,
        description: projectDescription,
        nodes,
        edges,
        narration,
    };

    return JSON.stringify(data, null, 2);
}

// useStore への直接的な依存を排除。callback を呼び出すのみ
function afterSave(
    targetPath: string,
    name: string,
    description: string,
    setFilePath: (path: string) => void,
    onSuccess?: (newPath: string, name: string, description: string) => void
): void {
    localStorage.setItem(SAVE_PATH_KEY, targetPath);
    setFilePath(targetPath);

    useRecentProjectsStore.getState().addRecent({
        filePath: targetPath,
        name,
        description,
        lastOpenedAt: new Date().toISOString(),
    });

    // 外部に後処理を委譲（useStore の呼び出しはここにはない）
    onSuccess?.(targetPath, name, description);

    toast.success('保存しました', {
        description: targetPath,
        duration: 2000,
    });
}

export function useFileSave(options?: SaveOptions): UseFileSaveReturn {
    const [filePath, setFilePath] = useState<string | null>(
        () => localStorage.getItem(SAVE_PATH_KEY)
    );

    const save = async () => {
        let targetPath = filePath;

        if (!targetPath) {
            const selected = await dialogSave({
                defaultPath: 'default.json',
                filters: [{ name: 'JSON', extensions: ['json'] }],
            });
            if (!selected) return;
            targetPath = selected as string; // 型の微調整
        }

        try {
            await writeTextFile(targetPath, buildJson());
            const { projectName, projectDescription } = collectSaveData();
            afterSave(targetPath, projectName, projectDescription, setFilePath, options?.onSuccess);
        } catch (error) {
            toast.error('保存に失敗しました', { description: String(error) });
        }
    };

    const saveAs = async () => {
        const { projectName, projectDescription } = collectSaveData();

        const existingNames = useRecentProjectsStore.getState().recents.map(r => r.name);
        const copyName = nextCopyName(projectName, existingNames);

        const defaultPath = filePath
            ? filePath.split(/[\\/]/).pop() ?? 'schema.json'
            : 'schema.json';

        const selected = await dialogSave({
            defaultPath,
            filters: [{ name: 'JSON', extensions: ['json'] }],
        });
        if (!selected) return;

        try {
            await writeTextFile(selected as string, buildJson(copyName));
            // callback で処理を委譲（setProjectMeta はここにはない）
            afterSave(selected as string, copyName, projectDescription, setFilePath, options?.onSuccess);
        } catch (error) {
            toast.error('保存に失敗しました', { description: String(error) });
        }
    };

    return { save, saveAs, filePath };
}