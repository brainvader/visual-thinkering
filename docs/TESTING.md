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
├── store.test.ts                       # ストアのユニットテスト
├── lib/typeql.test.ts                  # 純粋関数のユニットテスト
├── components/
│   ├── NarrationPanel.test.tsx         # コンポーネントテスト
│   ├── LLMAssistant.test.tsx           # コンポーネントテスト
│   └── Sidebar.test.tsx                # コンポーネントテスト
└── test/setup.ts                       # ResizeObserver モック
```

**ルール**: テストファイルはソースと同階層に配置する。

---

## 各レイヤーのテスト指針

### ストア（Zustand）

`useStore.getState()` / `useStore.setState()` で直接操作。React コンポーネント不要。

```typescript
// リセットパターン
beforeEach(() => {
  useStore.setState({ nodes: [...], edges: [...], narration: '' });
});
```

**テスト対象:**

- state 変更ロジック（deleteNode, setNarration など）
- エッジの連動削除など副作用

### 純粋関数（lib/）

依存なし。入力と出力だけをテストする。`generateTypeQL` は TypeQL 文字列の内容で検証する。

```typescript
expect(result).toContain("Person sub entity");
```

### コンポーネント

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

---

## セットアップ

```typescript
// src/test/setup.ts
import "@testing-library/jest-dom";
import { vi } from "vitest";

// React Flow が必要とする Web API のモック
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

---

## 実行

```bash
pnpm test           # ウォッチモード
pnpm test --run     # CI 用（1回実行）
```
