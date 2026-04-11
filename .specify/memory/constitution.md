# Visual-Thinkering Constitution

## Core Principles

### I. Schema-First Visual Thinking

すべての視覚的要素は、TypeDB のオントロジー（スキーマ）に直結していなければならない。「ただの図形」は存在せず、すべてのノードとエッジは、常にバックエンドで実行可能な TypeQL に変換可能な論理的意味を持つ。

### II. Bidirectional Synchronization

「グラフUI」と「TypeQLソースコード」は常に双方向で同期され、どちらの変更も他方に即座に反映される。真実のソース（Source of Truth）は React Flow の状態オブジェクト（Nodes/Edges）であり、それは常に TypeQL へのシリアライズが可能であること。

### III. Radical Simplicity in UI

ビジュアル・シンカーのフローを妨げないため、UI操作は極力シンプルに保つ。

- **Entity**: 矩形。
- **Relation**: 菱形。
- **Role**: 接続線上のテキスト。
  これら基本要素以外の複雑な装飾よりも、構造の明快さを優先する。

### IV. Local-First & Privacy-Centric

Tauri 2.0 の特性を活かし、データはユーザーのローカル環境に保存されることを基本とする。デフォルトではオフラインでの思考・設計をサポートし、データの所有権をユーザーに帰属させる。

### V. Developer-AI Symbiosis

`.specs` ディレクトリは、人間とAI（Cursor/Copilot等）の共有メモリである。仕様書は人間が読みやすく、かつAIがコードを生成するために十分な「構造化された具体的指示」を含まなければならない。

## Technical Constraints

- **Stack**: Tauri 2.0, React + Vite, React Flow, shadcn/ui.
- **Package Manager**: `pnpm` 必須（fnm による Node.js 管理）。
- **Language**: TypeScript (Strict Mode).
- **Format**: 仕様管理はすべて `.specs/*.md` で行い、Git 管理下に置く。

## Development Workflow

1. **Spec-First Development**: 実装の前に、必ず `.specs/` 内の該当する Markdown を更新し、設計の合意形成を行う。
2. **Atomic Commits**: 仕様の変更と実装の変更を一つのコミットにまとめ、履歴の整合性を保つ。
3. **TypeQL Validation**: 生成された TypeQL が、TypeDB の構文規約（Syntax）に完全に準拠していることを常に検証する。

## Governance

- 本憲法はプロジェクト内のすべての設計判断、コーディング規約に優先する。
- 実装において憲法と矛盾が生じた場合、コードではなく憲法を修正するか、実装を破棄するかの議論を最初に行う。
- AI への指示（Prompting）は、常に `.specs` の内容をコンテキストとして参照させてから行うこと。

**Version**: 1.0.0 | **Ratified**: 2026-04-11 | **Last Amended**: 2026-04-11
