# Spec: 名前をつけて保存（Save As）

> ステータス: **Ready**
> 対象ブランチ: `feat/file-save-as`
> 関連ファイル: `src/hooks/useFileSave.ts`, `src/components/AppHeader.tsx`, `src/App.tsx`

---

## 概要

現在開いているファイルとは別のパスに、常にダイアログを経由して保存する。
保存後は新しいパスを `vt-save-path` として記憶し、以降の Ctrl+S 上書き対象も切り替わる。

---

## スコープ

| 項目         | 内容                                                                   |
| ------------ | ---------------------------------------------------------------------- |
| 保存対象     | `nodes`, `edges`, `narration`, `projectName`, `projectDescription`     |
| ファイル形式 | JSON（拡張子 `.json`、既存フォーマットと同一）                         |
| トリガー     | AppHeader の「Save As」ボタン                                          |
| ダイアログ   | 毎回 Tauri `save` ダイアログを開く                                     |
| 保存パス記憶 | **する**（新パスを `vt-save-path` に上書き。以降の Save もそのパスへ） |

---

## UI 変更：AppHeader

```
┌──────────────────────────────────────────────────────────────┐
│ ← 一覧へ   visual-thinkering   [ファイル名 or 未保存]  [💾][💾+] │
└──────────────────────────────────────────────────────────────┘
                                                     Save SaveAs
```

- `Save`（`Save` アイコン）: 既存ボタン。変更なし。
- `Save As`（`SaveAll` アイコン）: 新規追加。常にダイアログを開く。

### AppHeaderProps の変更

```typescript
interface AppHeaderProps {
  filePath: string | null;
  onSave: () => void;
  onSaveAs: () => void; // 追加
  onBack?: () => void;
}
```

---

## フック変更：useFileSave

`saveAs()` を既存フックに追加する。

```typescript
interface UseFileSaveReturn {
  save: () => Promise<void>;
  saveAs: () => Promise<void>; // 追加
  filePath: string | null;
}
```

### `saveAs()` の処理フロー

```
1. store から nodes / edges / narration / projectName / projectDescription を取得
2. SaveFileData を JSON シリアライズ
3. dialog.save() でネイティブダイアログを開く
   - defaultPath: 現在のファイル名（filePath があれば）、なければ "schema.json"
   - filters: [{ name: "JSON", extensions: ["json"] }]
4. ユーザーがキャンセル → 何もしない（return）
5. パスが返った → writeTextFile(path, json) で書き込み
6. 書き込み成功 →
   a. localStorage の vt-save-path を新パスで更新
   b. setFilePath(newPath) でフック内 state を更新
   c. markClean()
   d. addRecent() に新パスを登録
   e. toast.success("保存しました", { description: newPath })
7. 例外発生 → toast.error("保存に失敗しました")
```

---

## App.tsx の変更

`useFileSave` から `saveAs` を受け取り `AppHeader` へ渡す。

```tsx
const { save, saveAs, filePath } = useFileSave();
// ...
<AppHeader
  filePath={filePath}
  onSave={save}
  onSaveAs={saveAs}
  onBack={onBack}
/>;
```

---

## テスト方針（Red → Green）

### `src/hooks/useFileSave.test.ts` に追加するテスト群

```
saveAs()
  - ダイアログでパスを選択した場合
    → writeTextFile が正しい JSON で呼ばれること
    → 選択したパスが localStorage に保存されること
    → markClean() が呼ばれること（isDirty が false になること）
    → addRecent() が呼ばれること
    → toast.success が呼ばれること
  - ダイアログをキャンセルした場合
    → writeTextFile が呼ばれないこと
    → localStorage が変化しないこと
  - writeTextFile が例外を投げた場合
    → toast.error が呼ばれること
    → localStorage が変化しないこと
```

### `src/components/AppHeader.test.tsx` に追加するテスト群

```
  - Save As ボタンが表示されること
  - Save As ボタンをクリックすると onSaveAs が呼ばれること
  - Save ボタンをクリックしても onSaveAs は呼ばれないこと
```

---

## 実装順序

1. `useFileSave.test.ts` に saveAs のテストを追加（Red）
2. `useFileSave.ts` に `saveAs()` を実装（Green）
3. `AppHeader.test.tsx` に Save As ボタンのテストを追加（Red）
4. `AppHeader.tsx` に `onSaveAs` props と Save As ボタンを追加（Green）
5. `App.tsx` で `saveAs` を取得し `AppHeader` に渡す
6. 動作確認 → `STATUS.md` 更新

---

## 対象外

- Save As 後の「元ファイルはそのまま残す」挙動（OS 標準の動作に委ねる）
- ファイルを開く（Open）は別スペック
