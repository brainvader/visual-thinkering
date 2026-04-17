# ファイル保存機能仕様書

> ファイル: `docs/specs/file-save.md`
> ブランチ: `feat/file-save`
> ステータス: 仕様策定中

---

## 概要

現状 localStorage のみに保存されているスキーマデータを、JSONファイルとして任意の場所に保存できるようにする。まず「現在の状態を `default.json` として保存する」という最小スコープから始める。

---

## スコープ（今回）

**やること**

- Tauri `fs` / `dialog` プラグインの導入
- ヘッダーバーの新設（保存ボタン + ファイル名表示）
- Ctrl+S キーボードショートカット
- 初回：保存先ダイアログ → パスを localStorage に記憶
- 2回目以降：同パスに上書き保存

**やらないこと**

- ファイルを開く（別仕様）
- 名前をつけて保存（別仕様）
- デフォルト保存先の自動設定（dev/build 環境差異を解決後に対応）
- プロジェクト管理との統合（別仕様）

---

## ファイルフォーマット

拡張子: `.json`  
デフォルトファイル名: `default.json`

```json
{
  "version": 1,
  "savedAt": "2026-04-17T12:00:00.000Z",
  "nodes": [...],
  "edges": [...],
  "narration": "..."
}
```

---

## localStorage の変更

| キー                      | 型       | 内容                                               |
| ------------------------- | -------- | -------------------------------------------------- |
| `visual-thinkering-graph` | 既存     | nodes / edges / narration のキャッシュ（変更なし） |
| `vt-save-path`            | `string` | 最後に保存したファイルの絶対パス                   |

---

## UIコンポーネント構成

```
src/
├── components/
│   └── AppHeader.tsx     ← 新規（ヘッダーバー）
└── hooks/
    └── useFileSave.ts    ← 新規（保存ロジック）
```

### AppHeader

```
┌──────────────────────────────────────────────────┐
│ Visual Thinkering   [ファイル名 or 未保存]   [💾] │
└──────────────────────────────────────────────────┘
```

- 左: アプリ名
- 中央: 現在のファイル名（パス未設定時は「未保存」）
- 右: 保存ボタン（`Save` アイコン）

### useFileSave

```typescript
const { save } = useFileSave();
// save() を呼ぶと以下のロジックが走る
```

**保存ロジック:**

```
1. localStorage から "vt-save-path" を取得
2. パスが存在する → writeTextFile(path, json) で上書き
3. パスが存在しない →
   a. save() ダイアログを表示（defaultPath: "default.json"）
   b. キャンセル → 何もしない
   c. パス選択 → writeTextFile(path, json)
              → "vt-save-path" に保存
```

---

## Tauri プラグイン導入

### フロントエンド

```bash
pnpm add @tauri-apps/plugin-fs @tauri-apps/plugin-dialog
```

### Rust 側（Cargo.toml）

```toml
[dependencies]
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
```

### lib.rs への登録

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
```

### tauri.conf.json のパーミッション

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

## App.tsx の変更点

- `AppHeader` をレイアウト最上部に追加
- Ctrl+S の `keydown` イベントリスナーを登録

```
┌─────────────────────────────────────┐
│ AppHeader                           │
├────────┬──────────────────┬─────────┤
│        │                  │         │
│Narration│  GraphCanvas    │ Sidebar │
│        ├──────────────────┤         │
│        │  LLMAssistant    │         │
└────────┴──────────────────┴─────────┘
```

---

## テスト方針

Tauri API はブラウザ環境で動作しないため `vi.mock` でモックする。

```typescript
vi.mock("@tauri-apps/plugin-fs", () => ({
  writeTextFile: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn().mockResolvedValue("/mock/path/default.json"),
}));
```

| 対象          | テスト内容                                          |
| ------------- | --------------------------------------------------- |
| `useFileSave` | パスあり → writeTextFile が呼ばれること             |
| `useFileSave` | パスなし → ダイアログが開き、パスが保存されること   |
| `useFileSave` | ダイアログキャンセル → 何も起きないこと             |
| `useFileSave` | 保存内容に nodes / edges / narration が含まれること |
| `AppHeader`   | 保存ボタンクリックで save() が呼ばれること          |
| `AppHeader`   | ファイル名が表示されること（未保存時は「未保存」）  |

---

## 実装順序

1. Tauri プラグイン導入（fs / dialog）
2. `useFileSave` フック + テスト
3. `AppHeader` コンポーネント + テスト
4. `App.tsx` にヘッダー追加 + Ctrl+S 登録
5. 動作確認・`STATUS.md` 更新
