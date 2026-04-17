# TESTING.md — テスト戦略

> 対象読者: 人間の開発者 + AI（スペックとして機能）  
> 関連: [`CLAUDE.md`](../CLAUDE.md) のテストポリシー要約を参照

---

## 基本思想

### なぜ failed test を先に書くか

テストを先に書く（Red → Green）ことで得られるのは「コードの検証」だけではない。

1. **インターフェースの設計強制** — 使う側の視点でAPIを先に決める
2. **テスト自体の正しさを担保** — テストが一度 fail することで「このテストは意味がある」と証明できる
3. **実装の過剰防止** — テストが green になった時点で止まれる

### AIとの協働における注意点

AIが「実装を見てからテストを書く」と、構造的な危うさが生まれる。

```typescript
// 実装にバグがある場合
const add = (a, b) => a - b; // バグ：- になっている

// 後付けテストの罠：実装に合わせてしまう
it("足し算", () => {
  expect(add(1, 2)).toBe(-1); // 通ってしまう
});
```

**AIへの依頼フロー（推奨）:**

```
1. docs/specs/ に仕様を書く（人間）
2. 「この spec を読んで failed test を書いて」と AI に依頼
3. 「このテストを通す実装を書いて」と AI に依頼
4. pnpm test で green を確認
```

---

## テストポリシー

| シナリオ         | ポリシー                                             |
| ---------------- | ---------------------------------------------------- |
| 新機能           | **failed test を先に書く**（仕様の言語化が目的）     |
| バグ修正         | **必ず再現テストを先に書く**（テストなし修正は禁止） |
| リファクタリング | **先にテストで振る舞いを固める**                     |
| 後付けテスト     | 境界値・異常系・エラーパスを意識的にカバー           |

---

## テストの種類と配置

```
src/
├── App.integration.test.tsx              # 統合テスト（複数コンポーネントの連動）
├── store/
│   ├── schemaStore.test.ts               # スキーマストアのユニットテスト
│   └── projectStore.test.ts              # プロジェクトストアのユニットテスト
├── lib/
│   ├── typeql.test.ts                    # 純粋関数のユニットテスト
│   └── migration.test.ts                 # マイグレーション関数のユニットテスト
├── pages/
│   └── ProjectListPage.test.tsx          # ページコンポーネントテスト
├── components/
│   ├── ProjectCard.test.tsx              # プロジェクトカードテスト
│   ├── NewProjectDialog.test.tsx         # 新規作成ダイアログテスト
│   ├── EditorHeader.test.tsx             # エディタヘッダーテスト
│   ├── NarrationPanel.test.tsx
│   ├── LLMAssistant.test.tsx
│   ├── Sidebar.test.tsx
│   └── nodes/
│       ├── EntityNode.test.tsx
│       ├── RelationNode.test.tsx
│       └── AttributeNode.test.tsx
└── test/setup.ts                         # ResizeObserver / Handle モック
e2e/
└── node-operations.spec.ts               # Playwright E2E テスト（将来）
```

**ルール**: テストファイルはソースと同階層に配置する。E2E テストのみ `e2e/` に分離する。

---

## 各レイヤーのテスト指針

### ストア（Zustand）

`useStore.getState()` / `useStore.setState()` で直接操作。React コンポーネント不要。

```typescript
// リセットパターン
beforeEach(() => {
  useSchemaStore.setState({ nodes: [], edges: [], narration: "" });
});
```

**schemaStore のテスト対象:**

- addNode / deleteNode / updateNodeLabel
- エッジの連動削除など副作用

**projectStore のテスト対象:**

- addProject（id・createdAt の自動生成を含む）
- deleteProject
- updateProject

### 純粋関数（lib/）

依存なし。入力と出力だけをテストする。

```typescript
expect(result).toContain("Person sub entity");
```

**migration.ts のテスト方針:**

`localStorage` のモックを使い、旧データあり/なしの両パターンを検証する。

```typescript
beforeEach(() => {
  localStorage.clear();
});

it("旧データがある場合、デフォルトプロジェクトに変換される", () => {
  localStorage.setItem("nodes", JSON.stringify([...]));
  localStorage.setItem("edges", JSON.stringify([...]));
  runMigration();
  expect(localStorage.getItem("nodes")).toBeNull();
  const projects = JSON.parse(localStorage.getItem("vt-projects")!);
  expect(projects).toHaveLength(1);
  expect(projects[0].name).toBe("デフォルトプロジェクト");
});

it("旧データがない場合、何も変化しない", () => {
  runMigration();
  expect(localStorage.getItem("vt-projects")).toBeNull();
});
```

### コンポーネント（単体）

React Testing Library + userEvent を使う。**実装の詳細ではなくユーザー視点でテストする。**

```typescript
// ✅ ユーザー視点
expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();

// ❌ 実装の詳細
expect(component.state.isDisabled).toBe(true);
```

**原則:**

- `getByRole` / `getByText` / `getByPlaceholderText` を優先
- `getByTestId` は最終手段
- ユーザーイベントは `userEvent`（`fireEvent` より現実的）
- コールバックの検証は `vi.fn()` で
- React Flow の `Handle` など Provider 依存のコンポーネントは `vi.mock` でモックする

```typescript
// Handle のモックパターン（nodes/ 配下のテストで共通）
vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  return { ...actual, Handle: () => null };
});
```

**ページコンポーネント（pages/）のテスト方針:**

ルーターのコンテキストが必要なため `MemoryRouter` でラップして render する。

```typescript
import { MemoryRouter } from "react-router-dom";

const renderWithRouter = (ui: React.ReactElement, { initialEntries = ["/"] } = {}) =>
  render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);

it("プロジェクト一覧が表示される", () => {
  renderWithRouter(<ProjectListPage />);
  expect(screen.getByText("新規プロジェクト")).toBeInTheDocument();
});
```

### 統合テスト（App レベル）

**目的:** 複数コンポーネントをまたぐ「つなぎ目」の動作を検証する。ユニットテストでは発見できない連動バグを対象にする。

**対象シナリオ:**

- ノード削除後に `selectedNode` がリセットされ Sidebar が閉じること
- ノード追加後に追加したノードが即選択されて Sidebar に表示されること
- ラベル編集が Sidebar から可能であること

**制約:** `ReactFlow` 本体はイベントハンドリングが複雑なため、統合テストでもモックが必要な場合がある。

```typescript
vi.mock('@xyflow/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@xyflow/react')>();
    return {
        ...actual,
        ReactFlow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        Handle: () => null,
    };
});
```
