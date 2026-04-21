// src/hooks/useFileSave.ts

import { useState } from 'react';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { save as dialogSave } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import { useRecentProjectsStore } from '@/store/recentProjectsStore';
import { nextCopyName } from '@/lib/copyName';
import { collectSaveData } from '@/store/selectors';
import { useStore } from '@/store';
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
            afterSave(targetPath, projectName, projectDescription, setFilePath);
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
            useStore.getState().setProjectMeta(copyName, projectDescription);
            afterSave(selected as string, copyName, projectDescription, setFilePath);
        } catch (error) {
            toast.error('保存に失敗しました', { description: String(error) });
        }
    };

    return { save, saveAs, filePath };
}