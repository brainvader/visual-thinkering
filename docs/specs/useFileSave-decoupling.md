# Spec: useFileSave フックの Zustand 依存排除（Callback-based Design）

> ステータス: **Ready**
> 対象ブランチ: `refactor/useFileSave-decouple-store`
> 関連ファイル: `src/hooks/useFileSave.ts`, `src/components/AppHeader.tsx`, `src/App.tsx`

---

## 概要

現在 `useFileSave.ts` は内部で `useStore.getState()` を直接呼び出し、`markClean()` と `setProjectMeta()` を実行している。
これは **フックが Zustand に強く依存** しており、テスト時の複雑性が増している。

本スペックでは、**保存後の処理を callback として外部から注入する設計** に変更し、
フックの責務を「ファイルI/O」に純化する。これにより：

- テスト時に `useStore` をモックせずに `useFileSave` の動作を検証可能
- フックとストアの境界が明確化
- 保存後のストア操作は呼び出し元（`App.tsx`）で一元管理

---

## スコープ

| 項目     | 内容                                                                      |
| -------- | ------------------------------------------------------------------------- |
| 変更対象 | `src/hooks/useFileSave.ts`（`useStore` 依存排除）                         |
| 新規追加 | `onSuccess` callback オプション                                           |
| 影響範囲 | `src/App.tsx`（callback 定義）、`src/components/AppHeader.tsx` （無変更） |
| 保持仕様 | 既存の `save()` / `saveAs()` の動作は完全に同一                           |

---

## 現在の問題点

### `useFileSave.ts` の現在のコード

```typescript
export function useFileSave(): UseFileSaveReturn {
  // ...
  const save = async () => {
    // ...
    await writeTextFile(targetPath, buildJson());
    const { projectName, projectDescription } = collectSaveData();
    afterSave(targetPath, projectName, projectDescription, setFilePath);
    // ↑ afterSave() が useStore.getState().markClean() を呼んでいる
  };

  const saveAs = async () => {
    // ...
    await writeTextFile(selected as string, buildJson(copyName));
    useStore.getState().setProjectMeta(copyName, projectDescription); // 直接呼び出し
    afterSave(selected as string, copyName, projectDescription, setFilePath);
  };
}
```

### 問題

1. `useStore` の import が必須 → テスト時に複雑なモック設定が必要
2. `afterSave()` 内で `markClean()` が暗黙的に実行 → 呼び出し元は制御不可
3. `setProjectMeta()` が `saveAs()` 内でハードコード → 柔軟性がない

---

## 解決案：Callback-based Design

### 修正後の `useFileSave.ts`

```typescript
import { useState } from "react";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { save as dialogSave } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { useRecentProjectsStore } from "@/store/recentProjectsStore";
import { nextCopyName } from "@/lib/copyName";
import { collectSaveData } from "@/store/selectors";
import { Node, Edge } from "@xyflow/react";
import { TypeDBNodeData, TypeDBEdgeData } from "@/types";

const SAVE_PATH_KEY = "vt-save-path";

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

// 保存成功時に呼び出されるコールバック型
interface SaveOptions {
  onSuccess?: (newPath: string, name: string, description: string) => void;
}

function buildJson(overrideName?: string): string {
  const { nodes, edges, narration, projectName, projectDescription } =
    collectSaveData();

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

// useStore の呼び出しを削除。callback を呼び出すのみ
function afterSave(
  targetPath: string,
  name: string,
  description: string,
  setFilePath: (path: string) => void,
  onSuccess?: (path: string, name: string, desc: string) => void,
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

  toast.success("保存しました", {
    description: targetPath,
    duration: 2000,
  });
}

export function useFileSave(options?: SaveOptions): UseFileSaveReturn {
  const [filePath, setFilePath] = useState<string | null>(() =>
    localStorage.getItem(SAVE_PATH_KEY),
  );

  const save = async () => {
    let targetPath = filePath;

    if (!targetPath) {
      const selected = await dialogSave({
        defaultPath: "default.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!selected) return;
      targetPath = selected as string;
    }

    try {
      await writeTextFile(targetPath, buildJson());
      const { projectName, projectDescription } = collectSaveData();
      afterSave(
        targetPath,
        projectName,
        projectDescription,
        setFilePath,
        options?.onSuccess,
      );
    } catch (error) {
      toast.error("保存に失敗しました", { description: String(error) });
    }
  };

  const saveAs = async () => {
    const { projectName, projectDescription } = collectSaveData();

    const existingNames = useRecentProjectsStore
      .getState()
      .recents.map((r) => r.name);
    const copyName = nextCopyName(projectName, existingNames);

    const defaultPath = filePath
      ? (filePath.split(/[\\/]/).pop() ?? "schema.json")
      : "schema.json";

    const selected = await dialogSave({
      defaultPath,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!selected) return;

    try {
      await writeTextFile(selected as string, buildJson(copyName));
      // callback で処理を委譲（setProjectMeta はここにはない）
      afterSave(
        selected as string,
        copyName,
        projectDescription,
        setFilePath,
        options?.onSuccess,
      );
    } catch (error) {
      toast.error("保存に失敗しました", { description: String(error) });
    }
  };

  return { save, saveAs, filePath };
}
```

### 呼び出し元（App.tsx）での使用例

```typescript
// App.tsx

const { markClean, setProjectMeta } = useStore();

const { save, saveAs, filePath } = useFileSave({
  onSuccess: (newPath, name, description) => {
    // 保存成功後の Zustand 操作をここで実行
    markClean();
    setProjectMeta(name, description);
  },
});
```

---

## 変更点の詳細

### `useFileSave.ts`

| 項目                           | 変更前                                      | 変更後                                           |
| ------------------------------ | ------------------------------------------- | ------------------------------------------------ |
| `useStore` import              | ✅ あり（直接呼び出し）                     | ❌ なし                                          |
| `SaveOptions` インターフェース | なし                                        | 追加（`onSuccess?: (path, name, desc) => void`） |
| `afterSave()` シグネチャ       | 4 引数                                      | 5 引数（`onSuccess` callback を追加）            |
| `afterSave()` 内の処理         | `markClean()` + `setProjectMeta()` 呼び出し | callback 呼び出しのみ                            |
| `save()` / `saveAs()` の動作   | 完全に同一（外部からの見た目では無変更）    | 完全に同一                                       |

### `App.tsx`

| 項目                               | 変更前                 | 変更後                                       |
| ---------------------------------- | ---------------------- | -------------------------------------------- |
| `useFileSave` の呼び出し           | `useFileSave()`        | `useFileSave({ onSuccess: (...) => {...} })` |
| `markClean()` / `setProjectMeta()` | フック内で暗黙実行     | callback 内で明示実行                        |
| 可読性                             | フック内の処理が不透明 | ストア操作の場所が明確化                     |

### `AppHeader.tsx`

変更なし（引数・戻り値は同じ）。

---

## テスト方針

### `useFileSave.ts` のテスト：callback なし版

```typescript
const { save, saveAs, filePath } = useFileSave();
// → onSuccess が呼ばれないため、markClean() は実行されない
// → 期待値: toast が出る、localStorage が更新される、だが isDirty は true のまま
```

### `useFileSave.ts` のテスト：callback あり版

```typescript
const mockOnSuccess = vi.fn();
const { save, saveAs } = useFileSave({ onSuccess: mockOnSuccess });

// save() / saveAs() 実行後：
// → mockOnSuccess が (path, name, description) で呼ばれていることを検証
// → toast / localStorage / addRecent は常に実行
```

### `App.tsx` の統合テスト（既存のテストを確認・必要に応じて修正）

```typescript
// App.tsx では save() / saveAs() 後に markClean() + setProjectMeta() が実行されていることを検証
// → isDirty が false になることを確認
// → projectName が更新されていることを確認
```

---

## 実装順序

1. **仕様確認** ← 現在位置
2. **テスト実装** → `useFileSave.test.ts` に callback を含むテストを追加（Red phase）
3. **コード実装** → `useFileSave.ts` を修正（Green phase）
4. **コンポーネント修正** → `App.tsx` で callback 定義（Refactor phase）
5. **既存テスト修正** → 他のテストファイルで `useFileSave()` 呼び出し側に `onSuccess` が必要かどうか確認
6. **コミット** → メッセージ作成
7. **STATUS.md 更新**

---

## 対象外

- `useFileLoad` の refactoring（別スペック）
- その他フック（`useCloseGuard` など）の refactoring
- `recentProjectsStore` の変更
