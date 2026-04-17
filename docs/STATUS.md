# STATUS.md — 実装状況

> 最終更新: 2026-04-17
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

## ファイル保存 [`save-as.md`](specs/save-as.md)

| 機能                                   | ステータス | テスト |
| -------------------------------------- | ---------- | ------ |
| Save As ダイアログを開いてファイル保存 | ❌         | ❌     |
| ダイアログキャンセル時の処理           | ❌         | ❌     |
| 保存エラー時の処理                     | ❌         | ❌     |
| TypeQL パネルに Save As ボタン追加     | ❌         | ❌     |

---

## 未保存確認ダイアログ [`unsaved-dialog.md`](specs/unsaved-dialog.md)

| 機能                                              | ステータス | テスト |
| ------------------------------------------------- | ---------- | ------ |
| isDirty フラグ（store）                           | ✅         | ✅     |
| 各アクションで markDirty() が呼ばれること         | ✅         | ✅     |
| 保存・読み込み完了時に markClean() が呼ばれること | ✅         | ✅     |
| UnsavedDialog コンポーネント（3ボタン）           | ✅         | ✅     |
| useCloseGuard（onCloseRequested 連携）            | ✅         | ✅     |
| App.tsx への統合                                  | ✅         | ✅     |

---

## プロジェクト管理 [`project-management.md`](specs/project-management.md)

| 機能                                                     | ステータス | テスト |
| -------------------------------------------------------- | ---------- | ------ |
| react-router-dom (MemoryRouter) 導入                     | ❌         | ❌     |
| recentProjectsStore（履歴の add / remove・最大10件）     | ❌         | ❌     |
| useFileLoad に open() 追加（ファイルを開くダイアログ）   | ❌         | ❌     |
| ProjectListPage（履歴カードグリッド・空状態表示）        | ❌         | ❌     |
| NewProjectDialog（名前・概要入力・保存先ダイアログ連携） | ❌         | ❌     |
| ProjectCard（クリックで遷移・履歴削除ボタン）            | ❌         | ❌     |
| EditorPage ラッパー + AppHeader に戻るボタン追加         | ❌         | ❌     |
| useFileSave / useFileLoad に addRecent() 連携            | ❌         | ❌     |
| JSON フォーマットに name / description フィールド追加    | ❌         | ❌     |

---

## ノード操作 [`node-operations.md`](specs/node-operations.md)

| 機能                                                              | ステータス | テスト |
| ----------------------------------------------------------------- | ---------- | ------ |
| 右クリックメニューからノード追加（Entity / Relation / Attribute） | ✅         | ✅     |
| 追加座標が右クリック位置になること                                | ✅         | ⚠️     |
| ノード追加後に即 Sidebar へ反映（selectedNode）                   | ✅         | ✅     |
| ラベル編集（Enter 確定 / Escape キャンセル）                      | ✅         | ✅     |
| ノード削除（コンテキストメニュー / Sidebar）                      | ✅         | ✅     |
| ノード削除後に Sidebar が閉じること                               | ✅         | ✅     |

---

## カスタムノード [`custom-nodes.md`](specs/custom-nodes.md)

| 機能                                                     | ステータス | テスト |
| -------------------------------------------------------- | ---------- | ------ |
| EntityNode（角丸矩形・青系）                             | ✅         | ✅     |
| RelationNode（SVGひし形・緑系）                          | ✅         | ✅     |
| AttributeNode（楕円・橙系）                              | ✅         | ✅     |
| 選択時のハイライト表示                                   | ✅         | ✅     |
| 全方向ソケット（上下左右 × source/target）               | ✅         | ⚠️     |
| コンテキストメニュー（ノード上・キャンバス上・エッジ上） | ✅         | ⚠️     |
| localStorage 復元後の fitView（useNodesInitialized）     | ✅         | ⚠️     |
| Easy Connect（ノード全体をHandleにする）                 | 🔁 保留    | ❌     |

---

## エッジ操作 [`edge-role-editing.md`](specs/edge-role-editing.md)

| 機能                                           | ステータス | テスト |
| ---------------------------------------------- | ---------- | ------ |
| エッジ接続（ドラッグ）                         | ✅         | ✅     |
| 矢印マーカー付きエッジ（ArrowClosed 20×20）    | ✅         | ✅     |
| エッジクリックで Sidebar にインスペクター表示  | ✅         | ✅     |
| ロール名編集（Enter 確定 / Escape キャンセル） | ✅         | ✅     |
| エッジ削除（コンテキストメニュー / Sidebar）   | ✅         | ✅     |
| エッジ削除後に Sidebar が閉じること            | ✅         | ✅     |

---

## 接続制限 [`connection-rules.md`](specs/connection-rules.md)

| 機能                                    | ステータス | テスト |
| --------------------------------------- | ---------- | ------ |
| Entity → Relation 許可（plays）         | ✅         | ✅     |
| Entity → Attribute 許可（owns）         | ✅         | ✅     |
| Relation → Relation 許可（nested）      | ✅         | ✅     |
| Relation → Attribute 許可（owns）       | ✅         | ✅     |
| Entity → Entity 禁止                    | ✅         | ✅     |
| Attribute → \* 禁止（接続元になれない） | ✅         | ✅     |
| 自己ループ禁止                          | ✅         | ✅     |

---

## 永続化 [`persistence.md`](specs/persistence.md)

| 機能                                                 | ステータス | テスト |
| ---------------------------------------------------- | ---------- | ------ |
| nodes / edges / narration を localStorage に自動保存 | ✅         | ✅     |
| アプリ再起動後に状態が復元されること                 | ✅         | ✅     |

---

## TypeQL 出力 [`typeql-panel.md`](specs/typeql-panel.md)

| 機能                                         | ステータス | テスト |
| -------------------------------------------- | ---------- | ------ |
| TypeQL パネル表示（Sidebar 第2タブ）         | ✅         | ✅     |
| `define` ブロック単体出力                    | ✅         | ✅     |
| Attribute → Entity → Relation の依存順ソート | ✅         | ✅     |
| ロール名未設定エッジへの警告表示             | ✅         | ✅     |
| TypeQL キーワードと同名ロール名への警告      | ✅         | ✅     |
| コピーボタン                                 | ✅         | ✅     |

---

## 将来実装（スペック未策定）

| 機能                                           | ステータス | 備考                                            |
| ---------------------------------------------- | ---------- | ----------------------------------------------- |
| isAbstract フラグの編集                        | ❌         | Sidebar に未実装                                |
| LLM API 接続                                   | ❌         | NarrationPanel + LLMAssistant の backend 未実装 |
| E2E テスト（Playwright）                       | ❌         | 右クリック・ドラッグ操作の自動テスト            |
| スキーマ vs データグラフの分離                 | 🔁         | ARCHITECTURE.md に保留として記録済み            |
| 型整備（Branded Types / Discriminated Unions） | ❌         | 別ブランチで実施予定                            |
