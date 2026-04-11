# Specification: App Layout Implementation

## 1. Overview

このドキュメントは、知識駆動型投資支援システム「Sourcerror」のUIプロトタイプ『Visual-Thinkering』のメインエントリポイントである `App.tsx` の構造を定義する。
`shadcn/ui` の `Resizable` コンポーネントを使用し、3カラム構成のワークスペースを構築する。

## 2. Technical Stack

- **Framework**: React (Vite)
- **UI Components**: `shadcn/ui` (Radix UI)
- **Graph Engine**: `@xyflow/react` (React Flow)
- **Icons**: `lucide-react`
- **Styling**: Tailwind CSS v4

## 3. UI Structure

### 3.1 全体レイアウト (`ResizablePanelGroup`)

画面全体を `direction="horizontal"` のパネルグループで分割する。

| パネル                | 役割                       | 幅（初期値） | 最小幅 |
| :-------------------- | :------------------------- | :----------- | :----- |
| **Left (Palette)**    | ノードやツールの選択エリア | 15%          | 10%    |
| **Center (Canvas)**   | メインの編集・思考エリア   | 65%          | 40%    |
| **Right (Inspector)** | 選択中のノードの詳細・設定 | 20%          | 15%    |

### 3.2 コンポーネント詳細

#### A. Left Panel (Palette)

- `ScrollArea` を使用して内容をラップ。
- クラス名 `p-4` で余白を確保し、見出し「Palette」と、ドラッグ可能なノード候補（Placeholder）をリスト表示。

#### B. Center Panel (Canvas)

- `ReactFlowProvider` でラップする。
- **背景**: `Background` (variant="dots") を表示。
- **操作**: `Controls` と `MiniMap` を配置。
- **スタイル**: `h-full w-full` でパネル内を埋め尽くす。

#### C. Right Panel (Inspector)

- `ScrollArea` を使用。
- クラス名 `p-4` で余白を確保し、見出し「Inspector」を表示。
- 現在は選択状態がないため、「No node selected」というテキストを中央付近に表示。

## 4. Data & Logic

- `nodes` と `edges` は `@xyflow/react` の `useNodesState`, `useEdgesState` で管理。
- **初期ノード**: 中央に 1 つのサンプルノード（Type: "default", Data: { label: "Thinkering Node" }）を配置。

## 5. Implementation Notes for AI (Copilot)

- **Import Alias**: 必ず `@/components/ui/` エイリアスを使用すること。
- **Styles**: `@xyflow/react/dist/style.css` を必ずインポートすること。
- **Height**: `h-screen` を適用し、ビューポート全体をカバーすること。
- **Spacing**: 各パネルの境界には `ResizableHandle` (with-handle) を配置すること。
