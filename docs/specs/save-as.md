# Spec: 名前をつけて保存（Save As）

> ステータス: **Draft**
> 対象ブランチ: `feat/file-save-as`
> 関連ファイル: `src/hooks/useFileSave.ts`, `src-tauri/capabilities/default.json`, `src-tauri/Cargo.toml`

---

## 概要

グラフの状態（nodes / edges / narration）を JSON ファイルとして任意のパスに保存する。
毎回 Tauri のネイティブ保存ダイアログを開き、保存先をユーザーが選択する（パスの記憶はしない）。

---

## スコープ

| 項目         | 内容                                                   |
| ------------ | ------------------------------------------------------ |
| 保存対象     | `nodes`, `edges`, `narration`                          |
| ファイル形式 | JSON（拡張子 `.vt.json`）                              |
| トリガー     | TypeQL パネルの「Save As」ボタン（既存 UI への追加）   |
| ダイアログ   | 毎回 Tauri `save` ダイアログを開く（パスを記憶しない） |
| 保存パス記憶 | **しない**（Open / 通常 Save は別スペックで対応）      |

---

## 保存ファイル形式

```json
{
  "version": 1,
  "nodes": [...],
  "edges": [...],
  "narration": "..."
}
```

| フィールド  | 型       | 説明                                               |
| ----------- | -------- | -------------------------------------------------- |
| `version`   | `number` | フォーマットバージョン（将来のマイグレーション用） |
| `nodes`     | `Node[]` | React Flow ノード配列（`TypeDBNodeData` を含む）   |
| `edges`     | `Edge[]` | React Flow エッジ配列（`TypeDBEdgeData` を含む）   |
| `narration` | `string` | ナラティブテキスト                                 |

---

## フック設計

### `src/hooks/useFileSave.ts`

```typescript
type SaveResult = "saved" | "cancelled" | "error";

function useFileSave(): {
  saveAs: () => Promise<SaveResult>;
};
```

#### `saveAs()` の処理フロー

```
1. store から nodes / edges / narration を取得
2. SaveFileData を JSON シリアライズ
3. dialog.save() でネイティブダイアログを開く
   - defaultPath: "schema.vt.json"
   - filters: [{ name: "Visual Thinkering", extensions: ["vt.json"] }]
4. ユーザーがキャンセル → 'cancelled' を返す
5. パスが返った → fs.writeTextFile(path, json) で書き込み
6. 書き込み成功 → 'saved' を返す
7. 例外発生 → console.error してから 'error' を返す
```

---

## Tauri 設定変更

### 追加プラグイン

`src-tauri/Cargo.toml` に追加:

```toml
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
```

### `src-tauri/src/lib.rs` への登録

```rust
.plugin(tauri_plugin_dialog::init())
.plugin(tauri_plugin_fs::init())
```

### `src-tauri/capabilities/default.json` に追加するパーミッション

```json
"dialog:allow-save",
"fs:allow-write-file",
"fs:scope-app-data-recursive"
```

---

## UI 変更

TypeQL パネル（`src/components/TypeQLPanel.tsx`）の既存ボタン行に「Save As」ボタンを追加する。

| 状態     | ボタン表示                    |
| -------- | ----------------------------- |
| 通常     | `Save As`                     |
| 保存中   | `Saving...`（disabled）       |
| 保存成功 | `Saved!`（1.5秒後に元に戻る） |
| エラー   | `Error`（1.5秒後に元に戻る）  |

---

## テスト方針（Red → Green）

Tauri API（`@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`）は jsdom 環境で動作しないため、**vi.mock でモック**する。

### `src/hooks/useFileSave.test.ts`

```
saveAs()
  - ダイアログでパスを選択した場合
    → writeTextFile が正しい JSON 文字列で呼ばれること
    → JSON に version / nodes / edges / narration が含まれること
    → 'saved' を返すこと
  - ダイアログをキャンセルした場合（dialog.save が null を返す）
    → writeTextFile が呼ばれないこと
    → 'cancelled' を返すこと
  - writeTextFile が例外を投げた場合
    → 'error' を返すこと
```

---

## 対象外（別スペックで対応）

- ファイルを開く（Open）
- 通常保存（Ctrl+S、パス記憶）
- 未保存確認ダイアログ（アプリ終了時）
