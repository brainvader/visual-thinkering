# Spec: データ永続化

> ステータス: **実装済み**
> 関連ファイル: `src/store.ts`, `src/hooks/useFileSave.ts`, `src/hooks/useFileLoad.ts`

---

## 概要

スキーマデータの永続化を2層構造で管理する。

| 層               | 仕組み                                | 役割                               |
| ---------------- | ------------------------------------- | ---------------------------------- |
| **作業バッファ** | Zustand `persist` → localStorage      | 編集中の自動保存・クラッシュ復元   |
| **ファイル保存** | Tauri `fs` プラグイン → JSON ファイル | 明示的な保存・プロジェクト間の共有 |

---

## 層1: localStorage（作業バッファ）

### 対象

| 対象           | 内容                                                   |
| -------------- | ------------------------------------------------------ |
| 保存する状態   | `nodes`, `edges`, `narration`                          |
| 保存しない状態 | `onNodesChange` などのハンドラ関数（シリアライズ不可） |
| 保存タイミング | state が変化するたびに自動保存                         |
| キー名         | `visual-thinkering-graph`                              |

### 実装

```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: 'visual-thinkering-graph',
    version: 2,
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      nodes: state.nodes,
      edges: state.edges,
      narration: state.narration,
    }),
  }
)
```

---

## 層2: ファイル保存・読み込み

### localStorage キー

| キー           | 型       | 内容                             |
| -------------- | -------- | -------------------------------- |
| `vt-save-path` | `string` | 最後に保存したファイルの絶対パス |

### ファイルフォーマット

```json
{
  "version": 1,
  "savedAt": "2026-04-17T00:00:00.000Z",
  "nodes": [...],
  "edges": [...],
  "narration": "..."
}
```

### 起動時の読み込みフロー（useFileLoad）

```
1. localStorage の "vt-save-path" を確認
2. あり → readTextFile(path) → ストアに setState
3. なし → resolveResource('resources/default.json') → readTextFile → ストアに setState
4. 失敗 → console.error のみ（ストアの既存状態を保持）
```

### 保存フロー（useFileSave）

```
1. localStorage の "vt-save-path" を確認
2. あり → writeTextFile(path, json) で上書き
3. なし → save ダイアログを開く
         → キャンセル → 何もしない
         → パス選択 → writeTextFile(path, json)
                    → "vt-save-path" に記憶
```

### resources/default.json

サンプル兼初期データ。`src-tauri/resources/default.json` に配置し、`tauri.conf.json` でバンドル登録する。

```json
// tauri.conf.json
"bundle": {
  "resources": ["resources/default.json"]
}
```

---

## Tauri プラグイン設定

### Cargo.toml

```toml
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
```

### lib.rs

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
```

### capabilities/default.json

```json
{
  "permissions": [
    "fs:allow-write-text-file",
    "fs:allow-read-text-file",
    "dialog:allow-save"
  ]
}
```

---

## テスト方針

Tauri API はブラウザ環境で動作しないため `vi.mock` で差し替える。`vi.mock` はホイストされるため、ファクトリ内では変数を参照できない点に注意（`beforeEach` でモックの戻り値を設定する）。

```typescript
vi.mock("@tauri-apps/plugin-fs", () => ({
  writeTextFile: vi.fn(),
  readTextFile: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(readTextFile).mockResolvedValue(MOCK_JSON);
});
```

| 対象          | テスト内容                                      |
| ------------- | ----------------------------------------------- |
| `useFileSave` | パスあり → 上書き保存                           |
| `useFileSave` | パスなし → ダイアログ → パス記憶                |
| `useFileSave` | キャンセル → 何もしない・toast なし             |
| `useFileSave` | 保存成功 → toast.success にフルパスが渡される   |
| `useFileSave` | 保存失敗 → toast.error が呼ばれる               |
| `useFileSave` | 保存内容に nodes / edges / narration が含まれる |
| `useFileLoad` | パスあり → そのファイルを読む                   |
| `useFileLoad` | パスなし → default.json を読む                  |
| `useFileLoad` | 失敗 → ストアの既存データを保持                 |

---

## 将来の拡張

- **デフォルト保存先の自動設定**: dev 環境と build 環境を切り替えつつ `appDataDir` / `documentDir` を使う（現在はダイアログのみ）
- **プロジェクト管理**: 複数ファイルをプロジェクト単位で扱う（`specs/project-management.md` 参照）
