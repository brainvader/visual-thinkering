# UI Specification: Overall Layout

## 1. Area Definitions

アプリを大きく3つの垂直エリアに分割し、`shadcn/ui` の `Resizable` コンポーネントを使用してユーザーが幅を調整可能にする。

### 左サイドバー: Palette (素材置き場)

- **役割**: 利用可能なノードタイプのテンプレートを提供。
- **コンポーネント**:
  - `EntityTemplate`: 矩形アイコン
  - `RelationTemplate`: 菱形アイコン
  - `AttributeTemplate`: 丸型またはタグ型アイコン
- **機能**: ドラッグ＆ドロップ（DnD）で中央キャンバスにノードを追加する起点となる。

### 中央メイン: Graph Canvas (思考の場)

- **役割**: グラフ構造の視覚的構築。
- **コンポーネント**:
  - `OntologyCanvas`: React Flow 本体。
  - `NodeController`: ズーム、パン、ミニマップなどの操作系。
- **機能**: ノードの配置、接続（Edge作成）、直感的なレイアウト。

### 右サイドバー: Inspector (詳細定義)

- **役割**: 選択された要素のプロパティ編集と、生成結果のプレビュー。
- **コンポーネント**:
  - `PropertyEditor`: ラベル名、Abstract属性の切り替え。
  - `TypeQLPreview`: 現在の選択ノードまたはグラフ全体から生成される TypeQL のリアルタイム表示。
  - `ValidationAlert`: 命名規則違反や未接続ノードの警告。

## 2. Technical Stack

- **Layout**: Tailwind CSS (Flexbox / Grid)
- **Splitting**: `lucide-react` アイコンを使用し、サイドバーは折りたたみ（Collapsible）可能とする。
- **State**: 右サイドバーは「現在選択されている Node ID」に依存して表示内容を切り替える。
