ビジュアル・シンカーのための視覚的メタファーと、`shadcn/ui` を用いた実装詳細です。

```markdown
# UI Specification: Custom Nodes

## 1. Entity Node (`typeDBEntity`)

- **Visual**: 矩形 (Rectangle)。`shadcn/ui` の `Card` コンポーネントをベースにする。
- **Styling**:
  - Border: `border-primary`
  - Background: `bg-card`
- **Interaction**:
  - ラベル部分をダブルクリックで `InlineInput` に切り替わり、名称変更が可能。

## 2. Relation Node (`typeDBRelation`)

- **Visual**: 菱形 (Diamond)。
- **Implementation**:
  - 外枠の `div` に `rotate-45` を適用。
  - 内部コンテンツは `-rotate-45` で打ち消し、テキストを水平に保つ。
- **Styling**:
  - Border: `border-accent` (アクセントカラーでEntityと差別化)

## 3. Handle (接続ポート)

- `Position.Top`, `Position.Bottom`, `Position.Left`, `Position.Right` の4箇所に配置。
```
