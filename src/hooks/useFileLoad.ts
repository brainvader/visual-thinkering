// src/hooks/useFileLoad.ts
//
// 起動時のファイル読み込みフック。
// vt-save-path が localStorage にあればそのファイルを、
// なければ同梱の resources/default.json を読み込み、ストアに展開する。
// open() はファイルを開くダイアログを表示し、選択されたファイルを読み込む。

import { readTextFile } from '@tauri-apps/plugin-fs';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
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
    open: () => Promise<void>;
}

// ファイルパスからデータを読み込んでストアに展開する共通処理
async function loadFromPath(filePath: string): Promise<void> {
    const raw = await readTextFile(filePath);
    const data: SaveFileData = JSON.parse(raw);

    useStore.setState({
        nodes: data.nodes as never,
        edges: data.edges as never,
        narration: data.narration,
    });

    // 読み込み完了時に dirty フラグをリセットする
    useStore.getState().markClean();
}

export function useFileLoad(): UseFileLoadReturn {
    // 起動時の読み込み：vt-save-path があればそのファイルを、なければ default.json を読む
    const load = async () => {
        try {
            const savedPath = localStorage.getItem(SAVE_PATH_KEY);
            const filePath = savedPath
                ? savedPath
                : await resolveResource('resources/default.json');

            await loadFromPath(filePath);
        } catch (error) {
            // 読み込み失敗時はストアの既存状態を保持する（何もしない）
            console.error('[useFileLoad] ファイルの読み込みに失敗しました:', error);
        }
    };

    // ファイルを開くダイアログを表示し、選択されたファイルを読み込む
    const open = async () => {
        try {
            const selected = await openDialog({
                multiple: false,
                filters: [{ name: 'JSON', extensions: ['json'] }],
            });

            // キャンセル時は null が返る
            if (!selected) return;

            const filePath = selected as string;
            await loadFromPath(filePath);

            // 開いたパスを記憶する
            localStorage.setItem(SAVE_PATH_KEY, filePath);
        } catch (error) {
            console.error('[useFileLoad] ファイルを開く操作に失敗しました:', error);
        }
    };

    return { load, open };
}