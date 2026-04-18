# Spec: 名前をつけて保存（Save As）

> ステータス: **Ready**
> 対象ブランチ: `feat/file-save-as`
> 関連ファイル: `src/hooks/useFileSave.ts`, `src/components/AppHeader.tsx`, `src/App.tsx`, `src/lib/copyName.ts`

---

## 概要

現在開いているファイルとは別のパスに、常にダイアログを経由して保存する。
保存時にプロジェクト名へ連番サフィックス（`001`, `002`, ...）を自動付与し、
一覧で元プロジェクトと区別できるようにする。
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
| コピー名     | `recentProjects` の `name` 一覧を参照して連番を自動インクリメント      |

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
- 両ボタンに Tooltip を表示する（`保存 (Ctrl+S)` / `名前をつけて保存`）。

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

## コピー名ロジック：`src/lib/copyName.ts`（新規）

```typescript
// baseName と既存名一覧から次のコピー名を生成する純粋関数
// 例: baseName="HR管理", existingNames=["HR管理 001", "HR管理 002"] → "HR管理 003"
function nextCopyName(baseName: string, existingNames: string[]): string;
```

### ルール

| 条件                             | 結果                          |
| -------------------------------- | ----------------------------- |
| 既存に `baseName NNN` 形式がない | `baseName 001`                |
| 既存の最大番号が N               | `baseName N+1`（3桁ゼロ埋め） |
| 番号が飛んでいる場合（001, 003） | 最大値+1（004）を返す         |
| `existingNames` が空配列         | `baseName 001`                |

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
2. recentProjectsStore の name 一覧を取得
3. nextCopyName(projectName, existingNames) でコピー名を生成
4. data を組み立て（name をコピー名で上書き）
5. dialog.save() でネイティブダイアログを開く
   - defaultPath: 現在のファイル名（filePath があれば）、なければ "schema.json"
   - filters: [{ name: "JSON", extensions: ["json"] }]
6. ユーザーがキャンセル → 何もしない（return）
7. パスが返った → writeTextFile(path, json) で書き込み
8. 書き込み成功 →
   a. localStorage の vt-save-path を新パスで更新
   b. setFilePath(newPath) でフック内 state を更新
   c. store の projectName をコピー名で更新（setProjectMeta）
   d. markClean()
   e. addRecent() に新パスとコピー名を登録
   f. toast.success("保存しました", { description: newPath })
9. 例外発生 → toast.error("保存に失敗しました")
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

### `src/lib/copyName.test.ts`（新規）

```
nextCopyName()
  - 既存に該当名がない場合 → "baseName 001" を返すこと
  - "baseName 001" がある場合 → "baseName 002" を返すこと
  - "baseName 001" "baseName 002" がある場合 → "baseName 003" を返すこと
  - 番号が飛んでいる場合（001, 003）→ 最大値+1（004）を返すこと
  - existingNames が空配列の場合 → "baseName 001" を返すこと
  - baseName と無関係な名前が混在していても正しく動作すること
```

### `src/hooks/useFileSave.test.ts` に追加するテスト群

```
saveAs()
  - 保存時に name がコピー名（連番付き）になること
  - 既存コピーがある場合に番号がインクリメントされること
  - ダイアログでパスを選択した場合
    → writeTextFile が正しい JSON で呼ばれること
    → 選択したパスが localStorage に保存されること
    → store の projectName がコピー名に更新されること
    → markClean() が呼ばれること（isDirty が false になること）
    → addRecent() がコピー名で呼ばれること
    → toast.success が呼ばれること
  - ダイアログをキャンセルした場合
    → writeTextFile が呼ばれないこと
    → localStorage が変化しないこと
    → store の projectName が変化しないこと
  - writeTextFile が例外を投げた場合
    → toast.error が呼ばれること
    → localStorage が変化しないこと
```

### `src/components/AppHeader.test.tsx`

```
  - Save As ボタンが表示されること
  - Save As ボタンをクリックすると onSaveAs が呼ばれること
  - Save ボタンをクリックしても onSaveAs は呼ばれないこと
```

---

## 実装順序

1. `src/lib/copyName.ts` + `copyName.test.ts`（Red → Green）
2. `useFileSave.test.ts` に saveAs のテストを追加（Red）
3. `useFileSave.ts` に `saveAs()` を実装（Green）
4. `AppHeader.test.tsx` に Save As ボタンのテストを追加（Red）
5. `AppHeader.tsx` に `onSaveAs` props・Save As ボタン・Tooltip を追加（Green）
6. `App.tsx` で `saveAs` を取得し `AppHeader` に渡す
7. 動作確認 → `STATUS.md` 更新

---

## 対象外

- Save As 後の「元ファイルはそのまま残す」挙動（OS 標準の動作に委ねる）
- ファイルを開く（Open）は別スペック
