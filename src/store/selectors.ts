// src/store/selectors.ts

import { GraphState, useStore } from '@/store';

// ファイル保存時に必要なデータをすべて集約する
export function collectSaveData() {
    const { nodes, edges, narration, projectName, projectDescription } =
        useStore.getState();
    return { nodes, edges, narration, projectName, projectDescription };
}

// canvas 状態のセレクタ（コンポーネントの購読用）
export const selectCanvas = (s: GraphState) => ({
    nodes: s.nodes,
    edges: s.edges,
    viewport: s.viewport,
});

// narration のセレクタ
export const selectNarration = (s: GraphState) => s.narration;

// project メタのセレクタ
export const selectProjectMeta = (s: GraphState) => ({
    projectName: s.projectName,
    projectDescription: s.projectDescription,
});

// ui 状態のセレクタ
export const selectIsDirty = (s: GraphState) => s.isDirty;