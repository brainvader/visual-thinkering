# プロジェクト管理機能仕様書

> ファイル: `docs/specs/project-management.md`
> ブランチ: `feat/project-management`
> ステータス: 仕様策定中
> 前提: `feat/file-save` マージ済み

---

## 概要

用途の異なるスキーマ（HR管理、スケジュール管理等）をプロジェクト単位で分離して管理する。

ファイルベース保存（`feat/file-save`）の導入により、プロジェクトの実体は **JSONファイル** となった。プロジェクト管理 = 「複数の JSON ファイルを開き・切り替える仕組み」として実装する。`useSchemaStore` の動的キー問題は、この設計により**解消済み**。

---

## 設計方針

```
プロジェクト = JSON ファイル 1つ
プロジェクト切り替え = 別のファイルを useFileLoad で開く
```

localStorage はあくまで作業バッファ（`visual-thinkering-graph`）として使い続け、複数プロジェクトのスキーマを localStorage に持つ設計は**採用しない**。

---

## 画面構成

```
MemoryRouter
├── ProjectListPage   path="/"            ← 新規追加
└── EditorPage        path="/editor"      ← 既存エディタをラップ
```

### ProjectListPage

- 最近開いたファイルの一覧をカードグリッドで表示
- 「新規プロジェクト」ボタン → 名前・概要を入力 → 保存先ダイアログ → EditorPage へ遷移
- 「ファイルを開く」ボタン → ダイアログ → EditorPage へ遷移
- カードクリック → そのファイルを読み込んで EditorPage へ遷移
- カード上の削除ボタン → 履歴から除去（ファイル自体は削除しない）

### EditorPage

- 既存の4パネルレイアウト（`App.tsx`）をそのままラップ
- `AppHeader` にプロジェクト名（ファイル名）と「← 一覧へ戻る」ボタンを統合

---

## データモデル

```typescript
// 最近開いたファイルの履歴エントリ
interface RecentProject {
  filePath: string; // ファイルの絶対パス
  name: string; // プロジェクト名（JSON の name フィールド）
  description: string; // 概要（JSON の description フィールド）
  lastOpenedAt: string; // ISO 8601
}
```

プロジェクトのメタデータは JSON ファイル内に保持するため、localStorage には**ファイルパスの履歴リスト**のみを保存する。

---

## localStorage 構造

| キー                      | 型                | 内容                                 |
| ------------------------- | ----------------- | ------------------------------------ |
| `visual-thinkering-graph` | 既存              | 作業バッファ（変更なし）             |
| `vt-save-path`            | `string`          | 現在開いているファイルのパス（既存） |
| `vt-recent-projects`      | `RecentProject[]` | 最近開いたファイルの履歴（最大10件） |

マイグレーション・`vt-schema-{id}` キーは**不要**。

---

## JSON ファイルフォーマットの拡張

既存フォーマットに `name` / `description` を追加する。

```json
{
  "version": 1,
  "savedAt": "2026-04-17T00:00:00.000Z",
  "name": "HR管理システム",
  "description": "人事管理のスキーマ設計",
  "nodes": [...],
  "edges": [...],
  "narration": "..."
}
```

`name` / `description` が存在しない旧ファイルはファイル名をプロジェクト名として扱う。

---

## 状態管理

### useRecentProjectsStore（新規）

```typescript
interface RecentProjectsStore {
  recents: RecentProject[];
  addRecent: (entry: RecentProject) => void;
  removeRecent: (filePath: string) => void;
}
```

- `persist` middleware で `vt-recent-projects` キーに保存
- 最大10件。超えた場合は古いものから除去

### useFileSave / useFileLoad の変更点

- 保存・読み込み時に `addRecent()` を呼んで履歴を更新する
- `useFileSave` の `save()` 成功時に JSON の `name` / `description` も書き込む

---

## UIコンポーネント構成

```
src/
├── pages/
│   ├── ProjectListPage.tsx   ← 新規
│   └── EditorPage.tsx        ← 新規（既存 App.tsx をラップ）
├── components/
│   ├── ProjectCard.tsx       ← 新規
│   ├── NewProjectDialog.tsx  ← 新規
│   └── AppHeader.tsx         ← 既存（一覧へ戻るボタンを追加）
└── store/
    └── recentProjectsStore.ts ← 新規
```

---

## ルーティング

`react-router-dom` v6 の `MemoryRouter` を使用（Tauri との互換性のため）。

```tsx
// main.tsx
<MemoryRouter>
  <Routes>
    <Route path="/" element={<ProjectListPage />} />
    <Route path="/editor" element={<EditorPage />} />
  </Routes>
</MemoryRouter>
```

---

## UIフロー詳細

```
ProjectListPage
  ┌─ 「新規プロジェクト」ボタン
  │    └─ NewProjectDialog（名前・概要入力）
  │         ├─ 保存 → 保存先ダイアログ → JSON書き込み
  │         │        → addRecent() → navigate("/editor")
  │         └─ キャンセル → 閉じる
  ├─ 「ファイルを開く」ボタン
  │    └─ openダイアログ → useFileLoad.open()
  │         → addRecent() → navigate("/editor")
  ├─ ProjectCard クリック
  │    └─ useFileLoad.loadFrom(filePath)
  │         → addRecent() → navigate("/editor")
  └─ ProjectCard 削除ボタン → removeRecent(filePath)

EditorPage
  └─ AppHeader
       └─ 「← 一覧へ」 → navigate("/")
```

---

## テスト方針

| 対象                  | テスト内容                             |
| --------------------- | -------------------------------------- |
| `recentProjectsStore` | add（最大10件超え時の除去）/ remove    |
| `ProjectCard`         | 名前・概要の表示、削除ボタンのクリック |
| `NewProjectDialog`    | バリデーション（名前必須）、送信       |
| `ProjectListPage`     | 履歴一覧のレンダリング、空状態の表示   |

---

## 実装順序

1. `react-router-dom` インストール・`MemoryRouter` 導入
2. `recentProjectsStore` + テスト
3. `useFileLoad` に `open()` 関数を追加（ファイルを開くダイアログ）
4. `ProjectListPage` / `ProjectCard` / `NewProjectDialog`
5. `EditorPage` ラッパー + `AppHeader` に戻るボタン追加
6. `useFileSave` / `useFileLoad` に `addRecent()` 連携を追加
7. `STATUS.md` / `CLAUDE.md` 更新
