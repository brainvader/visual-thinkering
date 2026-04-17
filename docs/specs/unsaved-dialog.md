# Spec: 未保存確認ダイアログ

> ステータス: **Draft**
> 対象ブランチ: `feat/unsaved-dialog`
> 関連ファイル: `src/store.ts`, `src/hooks/useCloseGuard.ts`, `src/components/UnsavedDialog.tsx`, `src/App.tsx`

---

## 概要

未保存の変更がある状態でアプリを閉じようとしたとき、確認ダイアログを表示する。
ユーザーは「保存して閉じる」「保存せずに閉じる」「キャンセル」の3択から選べる。

---

## スコープ

| 項目             | 内容                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `isDirty` フラグ | 最後の保存・読み込み以降に nodes / edges / narration が変化したか |
| トリガー         | Tauri の `onCloseRequested` イベント                              |
| ダイアログ       | React 側のカスタムダイアログ（shadcn/ui `AlertDialog`）           |
| 選択肢           | 「保存して閉じる」「保存せずに閉じる」「キャンセル」              |

---

## isDirty フラグの設計

### store.ts への追加

```typescript
interface GraphState {
    // ...既存フィールド
    isDirty: boolean;
    markDirty: () => void;
    markClean: () => void;
}

// 初期値
isDirty: false,

// アクション
markDirty: () => set({ isDirty: true }),
markClean: () => set({ isDirty: false }),
```

`isDirty` は UI の一時状態であり、localStorage への保存対象から**除外する**（`partialize` で除外済みのため変更不要）。

### dirty になるタイミング

nodes / edges / narration を変更するすべてのアクションの末尾で `markDirty()` を呼ぶ。

| アクション            | dirty 化                      |
| --------------------- | ----------------------------- |
| `addNode`             | ✅                            |
| `deleteNode`          | ✅                            |
| `updateNodeLabel`     | ✅                            |
| `updateNodeValueType` | ✅                            |
| `onConnect`           | ✅                            |
| `updateEdgeRole`      | ✅                            |
| `deleteEdge`          | ✅                            |
| `setNarration`        | ✅                            |
| `onNodesChange`       | ✅（position など移動も含む） |

### clean になるタイミング

| タイミング                  | 処理          |
| --------------------------- | ------------- |
| `useFileSave.save()` 成功時 | `markClean()` |
| `useFileLoad.load()` 完了時 | `markClean()` |

---

## コンポーネント設計

### `src/components/UnsavedDialog.tsx`（新規）

```typescript
interface UnsavedDialogProps {
  open: boolean;
  onSaveAndClose: () => void;
  onDiscardAndClose: () => void;
  onCancel: () => void;
}
```

shadcn/ui の `AlertDialog` を使用。

```
┌──────────────────────────────────────────────────────┐
│ 未保存の変更があります                                │
│                                                      │
│ 閉じる前に保存しますか？                             │
│                                                      │
│ [キャンセル]  [破棄して閉じる]  [保存して閉じる]     │
└──────────────────────────────────────────────────────┘
```

### `src/hooks/useCloseGuard.ts`（新規）

```typescript
function useCloseGuard(options: { onRequestClose: () => void }): void;
```

- Tauri の `onCloseRequested` を購読する
- `isDirty` が `false` → そのままウィンドウを閉じる（`event.preventDefault()` しない）
- `isDirty` が `true` → `event.preventDefault()` でウィンドウを止め、`onRequestClose()` を呼んでダイアログを表示させる

### `src/App.tsx` への変更

```typescript
// ダイアログの表示状態を管理する
const [closeDialogOpen, setCloseDialogOpen] = useState(false);

useCloseGuard({
  onRequestClose: () => setCloseDialogOpen(true),
});
```

---

## テスト方針（Red → Green）

### `src/store.isDirty.test.ts`（新規）

```
isDirty フラグ
  - 初期値は false であること
  - addNode 後に true になること
  - deleteNode 後に true になること
  - updateNodeLabel 後に true になること
  - onConnect 後に true になること
  - setNarration 後に true になること
  - markClean() を呼ぶと false に戻ること
```

### `src/components/UnsavedDialog.test.tsx`（新規）

```
UnsavedDialog
  - open=true のとき表示されること
  - open=false のとき表示されないこと
  - 「保存して閉じる」クリックで onSaveAndClose が呼ばれること
  - 「破棄して閉じる」クリックで onDiscardAndClose が呼ばれること
  - 「キャンセル」クリックで onCancel が呼ばれること
```

### `src/hooks/useCloseGuard.test.ts`（新規）

```
useCloseGuard
  - isDirty=false のとき onCloseRequested で preventDefault されないこと
  - isDirty=true のとき onCloseRequested で preventDefault されること
  - isDirty=true のとき onRequestClose が呼ばれること
```

---

## 実装順序

1. `store.ts` に `isDirty` / `markDirty` / `markClean` を追加
2. 各アクションに `markDirty()` を追加
3. `useFileSave.save()` / `useFileLoad.load()` に `markClean()` を追加
4. `UnsavedDialog` コンポーネント
5. `useCloseGuard` フック
6. `App.tsx` に統合
7. `STATUS.md` 更新

---

## 対象外

- プロジェクト切り替え時の未保存確認（プロジェクト管理スペックで対応）
