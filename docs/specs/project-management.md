# プロジェクト管理機能仕様書

> ファイル: `docs/specs/project-management.md`  
> ブランチ: `feat/project-management`  
> ステータス: 仕様策定中

---

## 概要

現状は単一のスキーマ空間しか持たないため、用途の異なるスキーマ（HR管理、スケジュール管理等）を分離できない。プロジェクト単位でスキーマを管理する仕組みを導入する。

---

## 画面構成

```
MemoryRouter
├── ProjectListPage   path="/"           ← 新規追加
└── EditorPage        path="/project/:id" ← 既存エディタをラップ
```

### ProjectListPage

- プロジェクト一覧をカードグリッドで表示
- 「新規プロジェクト」ボタン → `NewProjectDialog` を開く
- カードクリック → `EditorPage` へ遷移
- カード上の削除ボタン → 確認後に削除

### EditorPage

- 既存の4パネルレイアウトをそのまま維持
- ヘッダーに「← 一覧へ戻る」ボタンとプロジェクト名を追加

---

## データモデル

```typescript
interface Project {
  id: string; // nanoid() で生成
  name: string; // プロジェクト名（必須）
  description: string; // 概要（任意）
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

スキーマデータ（nodes / edges）はプロジェクトとは**別キーで保存**する（後述）。

---

## localStorage 構造

### 新構造

| キー                | 型                 | 内容                       |
| ------------------- | ------------------ | -------------------------- |
| `vt-projects`       | `Project[]`        | 全プロジェクトのメタデータ |
| `vt-schema-{id}`    | `{ nodes, edges }` | プロジェクトごとのスキーマ |
| `vt-active-project` | `string`           | 最後に開いたプロジェクトID |

### 旧構造（マイグレーション対象）

| 旧キー  | 移行先                             |
| ------- | ---------------------------------- |
| `nodes` | `vt-schema-{defaultId}` の `nodes` |
| `edges` | `vt-schema-{defaultId}` の `edges` |

---

## マイグレーション

アプリ起動時（`main.tsx` または `App.tsx` の初回レンダリング）に**一度だけ**実行する。

```
1. localStorage に旧キー "nodes" or "edges" が存在するか確認
2. 存在する場合:
   a. id = nanoid() でデフォルトプロジェクトを生成
      { id, name: "デフォルトプロジェクト", description: "", createdAt, updatedAt }
   b. vt-projects に追加
   c. vt-schema-{id} に { nodes, edges } を格納
   d. 旧キー "nodes" / "edges" を削除
3. 存在しない場合: 何もしない
```

実装場所: `src/lib/migration.ts`（純粋関数 + localStorage 操作）

---

## 状態管理

### useProjectStore（新規）

```typescript
interface ProjectStore {
  projects: Project[];
  // Actions
  addProject: (name: string, description: string) => Project;
  deleteProject: (id: string) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
}
```

- `persist` middleware で `vt-projects` キーに保存
- スキーマデータ（nodes/edges）は既存の `useSchemaStore` が管理するが、`persist` キーを `vt-schema-{projectId}` に動的に変更する

### useSchemaStore の変更点

現状: `persist` キーが固定（`nodes` / `edges`）  
変更後: `EditorPage` マウント時にプロジェクトIDを受け取り、`vt-schema-{id}` を参照する

> **実装方針**: Zustand の `persist` はキーを動的に変更できないため、`EditorPage` では `projectId` を props として受け取り、マウント時に `localStorage` から直接読み込む形にする。あるいは `zustand/vanilla` ストアを動的生成する方法も検討する。（実装時に確定）

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
│   └── EditorHeader.tsx      ← 新規（戻るボタン + プロジェクト名）
├── store/
│   ├── projectStore.ts       ← 新規
│   └── schemaStore.ts        ← 既存 store.ts をリネーム・整理
└── lib/
    └── migration.ts          ← 新規
```

---

## ルーティング

`react-router-dom` v6 の `MemoryRouter` を使用（Tauri との互換性のため）。

```tsx
// main.tsx
<MemoryRouter>
  <Routes>
    <Route path="/" element={<ProjectListPage />} />
    <Route path="/project/:id" element={<EditorPage />} />
  </Routes>
</MemoryRouter>
```

---

## UIフロー詳細

```
ProjectListPage
  ┌─ 「新規プロジェクト」ボタン
  │    └─ NewProjectDialog（名前・概要入力）
  │         ├─ 保存 → addProject() → カード追加 → EditorPage へ navigate
  │         └─ キャンセル → 閉じる
  ├─ ProjectCard クリック → navigate(`/project/${id}`)
  └─ ProjectCard 削除ボタン
       └─ 確認ダイアログ → deleteProject() → カード消去

EditorPage
  └─ EditorHeader
       └─ 「← 一覧へ」 → navigate("/")
```

---

## テスト方針

| 対象                   | テスト内容                             |
| ---------------------- | -------------------------------------- |
| `migration.ts`         | 旧データあり/なしの両パターン          |
| `projectStore.ts`      | add / delete / update アクション       |
| `ProjectCard.tsx`      | 名前・概要の表示、削除ボタンのクリック |
| `NewProjectDialog.tsx` | バリデーション（名前必須）、送信       |
| `ProjectListPage.tsx`  | プロジェクト一覧のレンダリング         |

---

## 未決定事項

- `useSchemaStore` の動的キー変更の実装方針（実装フェーズで確定）
- プロジェクト名のバリデーションルール（最大文字数等）

---

## 実装順序（予定）

1. `react-router-dom` インストール・ルーティング基盤
2. `migration.ts` + テスト
3. `projectStore.ts` + テスト
4. `ProjectListPage` / `ProjectCard` / `NewProjectDialog`
5. `EditorPage` ラッパー + `EditorHeader`
6. `useSchemaStore` の動的キー対応
7. E2E 動作確認・`STATUS.md` 更新
