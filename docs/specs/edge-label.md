# Spec: エッジラベル常時表示

> ステータス: **Implemented**
> 関連ファイル:
>
> - `src/components/edges/RoleEdge.tsx`
> - `src/components/edges/index.ts`
> - `src/components/GraphCanvas.tsx`
> - `src/store.ts`

---

## 概要

エッジ中央にロール名を常時表示する。TypeDB のセマンティクス上、role 名はエッジの意味そのものであり、キャンバス上で視覚的に確認できることが重要。

---

## 表示ルール

| 条件              | 表示内容         |
| ----------------- | ---------------- |
| `role` が設定済み | ロール名テキスト |
| `role` が空文字   | 非表示           |

---

## 実装方針

- `BaseEdge` + `EdgeLabelRenderer` を使用したカスタムエッジ
- `getBezierPath` でパス・中点座標を取得
- ラベルは pill スタイル（背景・枠付き）
- `edgeTypes` はモジュールレベル定数として定義（再生成禁止）
- 既存エッジとの後方互換: `type` 未設定エッジは React Flow のデフォルトエッジとして描画される

---

## 変更ファイル

| ファイル                            | 変更内容                           |
| ----------------------------------- | ---------------------------------- |
| `src/components/edges/RoleEdge.tsx` | 新規：カスタムエッジコンポーネント |
| `src/components/edges/index.ts`     | 新規：edgeTypes export             |
| `src/components/GraphCanvas.tsx`    | edgeTypes import・ReactFlow に登録 |
| `src/store.ts`                      | onConnect で `type: 'role'` を付与 |
