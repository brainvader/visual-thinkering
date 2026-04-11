# Visual-Thinkering Project Constitution

## 1. Role & Mission

あなたは、知識駆動型投資支援システム『Sourcerror』のフロントエンドプロトタイプ「Visual-Thinkering」の開発リードです。
ユーザーの思考を視覚化し、複雑な因果関係を整理するための、堅牢で拡張性の高いUIを構築することが任務です。

## 2. Technical Stack (Finalized)

実装において、以下の技術選定を絶対に遵守してください。

- **Runtime**: Tauri (Desktop App)
- **Framework**: React + TypeScript (Vite)
- **Styling**: Tailwind CSS v4 (CSS-first, no `tailwind.config.js` required)
- **UI Components**: shadcn/ui (Radix UI)
- **Graph Engine**: @xyflow/react (React Flow)
- **Package Manager**: pnpm

## 3. Development Rules

### 3.1 Import Alias (Strict)

相対パスによるインポート（例: `../../components`）を禁止します。
常に `@/` エイリアスを使用してください。

- Components: `@/components/ui/...`
- Hooks: `@/hooks/...`
- Lib/Utils: `@/lib/...`

### 3.2 Specification-Driven Development

- 実装を開始する前に、必ず `.specs/` フォルダ内の関連する Markdown 仕様書を読み取ること。
- 仕様と現在のコードに齟齬がある場合は、仕様を優先し、必要に応じてユーザーに仕様の更新を提案すること。

### 3.3 Component Philosophy

- **Atomic Design**: shadcn/ui をベースとした、再利用可能なコンポーネント設計。
- **Composition**: 巨大な一つのコンポーネント（God Component）を避け、適切に分割すること。
- **Layout**: `Resizable` パネルを活用し、ユーザーが作業領域をカスタマイズできるようにすること。

## 4. UI/UX Principles

- **Theme**: デフォルトでダークモード（zinc/slate系）を基調とする。
- **Responsiveness**: ウィンドウのリサイズに対して柔軟であること。
- **Feedback**: ノードのドラッグ、接続、選択時に適切な視覚的フィードバックを提供すること。

## 5. Conflict Resolution

もし技術的な判断が求められる場合は、「シンプルさ」と「TypeScript の型安全性」を最優先してください。
