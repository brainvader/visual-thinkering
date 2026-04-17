# Spec: グラフの永続化（localStorage）

> ステータス: **Draft**  
> 対象ブランチ: `feat/persistence`（予定）  
> 関連ファイル: `src/store.ts`

---

## 概要

アプリを閉じてもグラフの状態（nodes / edges / narration）が失われないよう、Zustand の `persist` ミドルウェアを使って localStorage に自動保存する。

---

## スコープ

| 対象           | 内容                                                         |
| -------------- | ------------------------------------------------------------ |
| 保存する状態   | `nodes`, `edges`, `narration`                                |
| 保存しない状態 | `onNodesChange` などのハンドラ関数（シリアライズ不可）       |
| 保存タイミング | state が変化するたびに自動保存（Zustand persist の標準動作） |
| ストレージ     | `localStorage`（Tauri WebView でも動作）                     |
| キー名         | `visual-thinkering-graph`                                    |

---

## 実装方針

Zustand の `persist` ミドルウェアを `create` にラップするだけで実現できる。

```typescript
import { persist, createJSONStorage } from 'zustand/middleware';

export const useStore = create<GraphState>()(
    persist(
        (set, get) => ({ ... }),
        {
            name: 'visual-thinkering-graph',
            storage: createJSONStorage(() => localStorage),
            // 関数はシリアライズできないため保存対象から除外する
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                narration: state.narration,
            }),
        }
    )
);
```

---

## マイグレーション方針

将来スキーマが変わったとき（例: `TypeDBNodeData` にフィールド追加）に備えて `version` を管理する。

```typescript
{
    name: 'visual-thinkering-graph',
    version: 1,
    migrate: (persistedState, version) => {
        // version 0 → 1 のマイグレーション例
        if (version === 0) {
            // 古い形式のデータを新形式に変換
        }
        return persistedState;
    },
}
```

---

### fitView の起動時挙動

復元後のビューポートは `useNodesInitialized()` + `nodes.length > 0` の両条件が揃ったときのみ実行される。ノードが0件の状態では実行しない（フラグが誤ってセットされるのを防ぐ）。

---

## 考慮事項

- **localStorage の容量制限**: ブラウザにより 5〜10MB。大規模グラフでは将来的に Tauri の `fs` プラグインへの移行を検討する（`docs/specs/persistence-file.md` として切り出す）
- **データ破損時のフォールバック**: `migrate` か `onRehydrateStorage` で壊れたデータを検出し初期状態にリセットする

---

## テスト方針（Red → Green）

### store.test.ts への追加

```
- アプリ再起動後（ストア再生成後）に nodes が復元されること
- narration が復元されること
- ハンドラ関数（onNodesChange など）は保存されないこと
```

※ localStorage のモックには `vitest` の `localStorage` グローバルをそのまま使える（jsdom が提供）
