# UI Specification: Role Edges

## Edge Type: `roleEdge`

- **Path**: `SmoothStep` エッジを使用（直角的なラインが構造の整理に適するため）。
- **Label Renderer**: `EdgeLabelRenderer` を使用して、線の中央にフローティングラベルを表示。

## Interaction

- ラベル（Role名）をクリックすると、小さな `shadcn/ui` の `Input` が表示される。
- `Enter` キーまたは `onBlur` で確定し、`edges` 状態を更新する。
