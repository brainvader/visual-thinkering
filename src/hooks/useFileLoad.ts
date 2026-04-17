// src/hooks/useFileLoad.ts
//
// 起動時のファイル読み込みフック。
// vt-save-path が localStorage にあればそのファイルを、
// なければ同梱の resources/default.json を読み込み、ストアに展開する。

import { readTextFile } from '@tauri-apps/plugin-fs';
import { resolveResource } from '@tauri-apps/api/path';
import { useStore } from '@/store';

// ファイルフォーマットの型（useFileSave と対称）
interface SaveFileData {
    version: number;
    savedAt: string;
    nodes: unknown[];
    edges: unknown[];
    narration: string;
}

const SAVE_PATH_KEY = 'vt-save-path';

interface UseFileLoadReturn {
    load: () => Promise<void>;
}

export function useFileLoad(): UseFileLoadReturn {
    const load = async () => {
        try {
            // 保存済みパスを確認する
            const savedPath = localStorage.getItem(SAVE_PATH_KEY);

            let filePath: string;
            if (savedPath) {
                // 2回目以降：保存済みパスを使う
                filePath = savedPath;
            } else {
                // 初回：同梱の default.json を解決する
                filePath = await resolveResource('resources/default.json');
            }

            // ファイルを読み込んでパースする
            const raw = await readTextFile(filePath);
            const data: SaveFileData = JSON.parse(raw);

            useStore.setState({
                nodes: data.nodes as never,
                edges: data.edges as never,
                narration: data.narration,
            });

            // 読み込み完了時に dirty フラグをリセットする
            useStore.getState().markClean();

            // ストアに展開する（persist が自動的に localStorage に書き込む）
            useStore.setState({
                nodes: data.nodes as never,
                edges: data.edges as never,
                narration: data.narration,
            });
        } catch (error) {
            // 読み込み失敗時はストアの既存状態を保持する（何もしない）
            console.error('[useFileLoad] ファイルの読み込みに失敗しました:', error);
        }
    };

    return { load };
}