# Visual-Thinkering 全体設計

## コンセプト

TypeDB の複雑なハイパーグラフ構造を、React Flow を用いて直感的に編集・可視化するエディタ。

## 技術スタック

- **Runtime**: Tauri 2.0 (Windows / fnm / pnpm)
- **Frontend**: React + Vite + TypeScript
- **Graph UI**: React Flow (Node/Edge ベースの編集)
- **Database**: TypeDB (バックエンドとして想定)
- **UI Components**: shadcn/ui

## データの流れ

[React Flow UI] <-> [Internal JSON State] <-> [TypeQL Generator] <-> [TypeDB]
