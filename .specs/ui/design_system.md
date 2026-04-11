# UI Specification: Design System (shadcn/ui)

## 1. Core Implementation Rule

- **Framework**: すべての UI コンポーネントは `shadcn/ui` (Radix UI + Tailwind CSS) をベースとする。
- **Component Ownership**: `npx shadcn-ui@latest add [component]` で追加された `components/ui` 配下のコードを正しく参照し、プロジェクトのスタイルに合わせカスタマイズして使用する。

## 2. Shared Components Usage

本プロジェクトでは、特に以下のコンポーネントを優先的に使用する。

- **Layout**: `Resizable` (エリア分割), `ScrollArea` (サイドバー)
- **Navigation**: `Tabs` (Inspectorの切り替え), `Collapsible` (サイドバーの折りたたみ)
- **Feedback**: `Tooltip` (パレットのアイコン説明), `Alert` (バリデーション警告)
- **Inputs**: `Input`, `Label`, `Switch` (プロパティ編集用)
- **Overlay**: `Context Menu` (キャンバス上の右クリック操作)

## 3. Theme & Aesthetics

- **Mode**: Dark Mode をデフォルトとする。
- **Color Palette**:
  - `background`: 漆黒または深いグレー (思考を妨げないため)。
  - `primary`: TypeDB Entity 用 (例: Blue系)。
  - `accent`: TypeDB Relation 用 (例: Amber/Orange系)。
- **Typography**: `Geist` または `Inter` (可読性の高いサンセリフ体)。

## 4. Atomic Design Strategy

1. **Atoms**: `shadcn/ui` の基本パーツ。
2. **Molecules**: カスタムノード (`EntityNode`, `RelationNode`) や、パレット内のアイテム。
3. **Organisms**: `Palette`, `Inspector`, `OntologyCanvas`。
4. **Templates**: `.specs/ui/layout.md` で定義された全体構造。
