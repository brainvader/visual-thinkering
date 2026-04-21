# STATUS.md — 実装状況

> 最終更新: 2026-04-21
> 粒度: 機能単位（ユーザーが体験できる単位）
> 詳細な仕様・テスト方針は各 `docs/specs/` ファイルを参照

---

## 凡例

| 記号 | 意味                     |
| ---- | ------------------------ |
| ✅   | 実装済み・テスト済み     |
| 🚧   | 実装中                   |
| ❌   | 未着手                   |
| ⚠️   | 実装済みだがテスト未整備 |
| 🔁   | 保留・再検討中           |

---

## useFileSave フック Zustand 依存排除 [`useFileSave-decoupling.md`](specs/useFileSave-decoupling.md)

| 機能                                                   | ステータス | テスト |
| ------------------------------------------------------ | ---------- | ------ |
| SaveOptions インターフェース追加（onSuccess callback） | ✅         | ✅     |
| afterSave() の callback パターン化                     | ✅         | ✅     |
| App.tsx で callback 経由の markClean() 注入            | ✅         | ✅     |
| App.tsx で callback 経由の setProjectMeta() 注入       | ✅         | ✅     |
| callback なし時の backward compatibility テスト        | ✅         | ✅     |
| callback あり時の動作検証テスト                        | ✅         | ✅     |

---

## ファイル保存 [`file-save.md`](specs/file-save.md)

| 機能                                   | ステータス | テスト |
| -------------------------------------- | ---------- | ------ |
| Save As ダイアログを開いてファイル保存 | ✅         | ✅     |
| ダイアログキャンセル時の処理           | ✅         | ✅     |
| 保存エラー時の処理                     | ✅         | ✅     |
| 2回目以降は同パスへ上書き保存          | ✅         | ✅     |
| 保存成功時に toast 通知                | ✅         | ✅     |
| AppHeader に保存ボタン・ファイル名表示 | ✅         | ✅     |
| Ctrl+S キーボードショートカット        | ✅         | ⚠️     |

---

## 名前をつけて保存 [`save-as.md`](specs/save-as.md)

| 機能                                            | ステータス | テスト |
| ----------------------------------------------- | ---------- | ------ |
| Save As ダイアログを開いてファイル保存          | ✅         | ✅     |
| ダイアログキャンセル時の処理                    | ✅         | ✅     |
| 保存エラー時の処理                              | ✅         | ✅     |
| 新パスを vt-save-path に記憶                    | ✅         | ✅     |
| AppHeader に Save As ボタン追加（Tooltip 付き） | ✅         | ✅     |
| コピー名の連番自動インクリメント                | ✅         | ✅     |
| store の projectName をコピー名に更新           | ✅         | ✅     |

---

## 未保存確認ダイアログ [`unsaved-dialog.md`](specs/unsaved-dialog.md)

| 機能                                              | ステータス | テスト |
| ------------------------------------------------- | ---------- | ------ |
| isDirty フラグ（store）                           | ✅         | ✅     |
| 各アクションで markDirty() が呼ばれること         | ✅         | ✅     |
| 保存・読み込み完了時に markClean() が呼ばれること | ✅         | ✅     |
| UnsavedDialog コンポーネント（3ボタン）           | ✅         | ✅     |
| useCloseGuard（onCloseRequested 連携）            | ✅         | ✅     |

---

## TypeQL 出力パネル [`typeql-panel.md`](specs/typeql-panel.md)

| 機能                                     | ステータス | テスト |
| ---------------------------------------- | ---------- | ------ |
| `define` ブロックの生成                  | ✅         | ✅     |
| Attribute → Entity → Relation の出力順序 | ✅         | ✅     |
| owns / plays / relates の生成            | ✅         | ✅     |
| ロール名未設定エッジの警告               | ✅         | ✅     |
| TypeQL キーワード同名ロールの警告        | ✅         | ✅     |
| Attribute の value 型セレクター          | ✅         | ✅     |
| TypeQL パネルの Copy ボタン              | ✅         | ✅     |
| シンタックスハイライト                   | ✅         | ⚠️     |

---

## Abstract型 & Sub継承エッジ [`abstract-sub-inheritance.md`](specs/abstract-sub-inheritance.md)

| 機能                                             | ステータス | テスト |
| ------------------------------------------------ | ---------- | ------ |
| `TypeDBEdgeType` 型の追加                        | ✅         | ✅     |
| 同 typeDBType 同士の接続を sub として許可        | ✅         | ✅     |
| `onConnect` で sub エッジを自動判定              | ✅         | ✅     |
| SubEdge コンポーネント（中空三角矢印）           | ✅         | ⚠️     |
| `isAbstract` フラグの Inspector チェックボックス | ✅         | ✅     |
| `updateNodeAbstract` store アクション            | ✅         | ✅     |
| Abstract バッジのノード表示                      | ✅         | ✅     |
| TypeQL 生成: `sub` エッジ → `B sub A;`           | ✅         | ✅     |
| TypeQL 生成: `abstract` フラグ → `, abstract`    | ✅         | ✅     |
| sub のトポロジカルソート（親を先に出力）         | ✅         | ✅     |
| 循環継承の警告                                   | ✅         | ✅     |
| sub エッジ選択時 Role フィールド非表示           | ✅         | ✅     |
| SubEdge 選択時ビジュアル強調                     | ✅         | ⚠️     |

---

## 冗長な plays エッジの接続禁止 [`redundant-plays-guard.md`](specs/redundant-plays-guard.md)

| 機能                                            | ステータス | テスト |
| ----------------------------------------------- | ---------- | ------ |
| `isValidTypeDBConnection` の `edges` 引数追加   | ✅         | ✅     |
| 祖先集合の計算（`getAncestors` ユーティリティ） | ✅         | ✅     |
| 既存 plays エッジとの照合による冗長接続の拒否   | ✅         | ✅     |
| `GraphCanvas.tsx` の呼び出し側に `edges` を渡す | ✅         | -      |
| 既存テストの `edges: []` 後方互換対応           | ✅         | ✅     |

---

## useFileSave フックの Zustand 依存排除 [`useFileSave-decoupling.md`](specs/useFileSave-decoupling.md)

| 機能                                                 | ステータス | テスト |
| ---------------------------------------------------- | ---------- | ------ |
| `SaveOptions` インターフェース（callback サポート）  | ✅         | ✅     |
| `useFileSave` から `useStore` import を削除          | ✅         | ✅     |
| `afterSave()` を callback-based design に変更        | ✅         | ✅     |
| `save()` / `saveAs()` で callback を呼び出し         | ✅         | ✅     |
| `App.tsx` で callback 内に `markClean()` を注入      | ✅         | ✅     |
| `App.tsx` で callback 内に `setProjectMeta()` を注入 | ✅         | ✅     |
| callback なし時の従来互換性を保持                    | ✅         | ✅     |
| useFileSave テスト（33 tests all passing）           | ✅         | ✅     |
