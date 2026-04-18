// src/store/recentProjectsStore.ts
// 最近開いたプロジェクトの履歴を管理する Zustand ストア

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 履歴エントリの型定義
export interface RecentProject {
    filePath: string;    // ファイルの絶対パス
    name: string;        // プロジェクト名（JSON の name フィールド）
    description: string; // 概要（JSON の description フィールド）
    lastOpenedAt: string; // ISO 8601
}

interface RecentProjectsStore {
    recents: RecentProject[];
    addRecent: (entry: RecentProject) => void;
    removeRecent: (filePath: string) => void;
}

// 履歴の最大件数
const MAX_RECENTS = 10;

export const useRecentProjectsStore = create<RecentProjectsStore>()(
    persist(
        (set) => ({
            recents: [],

            // 追加：同一パスは先頭に移動し、最大件数を超えたら古いものを除去
            addRecent: (entry) =>
                set((state) => {
                    const filtered = state.recents.filter(
                        (r) => r.filePath !== entry.filePath
                    );
                    const next = [entry, ...filtered];
                    return { recents: next.slice(0, MAX_RECENTS) };
                }),

            // 削除：filePath が一致するエントリを除去（ファイル自体は削除しない）
            removeRecent: (filePath) =>
                set((state) => ({
                    recents: state.recents.filter((r) => r.filePath !== filePath),
                })),
        }),
        {
            name: 'vt-recent-projects',
            storage: createJSONStorage(() => localStorage),
        }
    )
);