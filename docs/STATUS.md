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
| ハンドラ関数が保存対象から除外されること             | ✅         | ✅     |
| persist version 管理（マイグレーション基盤）         | ✅         | ✅     |

---

## Ownership ハイライト [`ownership-highlight.md`](specs/ownership-highlight.md)

| 機能                                                    | ステータス | テスト |
| ------------------------------------------------------- | ---------- | ------ |
| Entity/Relation 選択時に owns 先 Attribute を矩形で囲む | ✅         | ✅     |
| ノード移動時にリアルタイムで矩形が追従・縮小すること    | ✅         | ✅     |
| Attribute 選択時は表示しないこと                        | ✅         | ✅     |
| ズーム・パン時も正しく追従すること                      | ✅         | ⚠️     |

---

## TypeQL 出力パネル [`typeql-panel.md`](specs/typeql-panel.md)

| 機能                                                  | ステータス | テスト |
| ----------------------------------------------------- | ---------- | ------ |
| Attribute → Entity → Relation の順で定義を生成        | ✅         | ✅     |
| owns（Entity/Relation → Attribute）の生成             | ✅         | ✅     |
| plays（Entity → Relation）の生成                      | ✅         | ✅     |
| relates（Relation のロール）の生成                    | ✅         | ✅     |
| Attribute の value 型出力（valueType フィールド参照） | ✅         | ✅     |
| ロール名未設定エッジの警告表示                        | ✅         | ✅     |
| TypeQL キーワードと同名ロール名の警告                 | ✅         | ✅     |
| シンタックスハイライト                                | ✅         | ⚠️     |
| Copy ボタン（クリップボードコピー）                   | ✅         | ✅     |
| Sidebar の Inspector / TypeQL タブ化                  | ✅         | ⚠️     |

---

## Sidebar インスペクター

| 機能                                                                  | ステータス | テスト |
| --------------------------------------------------------------------- | ---------- | ------ |
| Attribute ノード選択時に value 型セレクト表示                         | ✅         | ✅     |
| value 型変更の即時反映（string / long / double / boolean / datetime） | ✅         | ✅     |
| 旧データ（valueType なし）の後方互換（string フォールバック）         | ✅         | ✅     |

---

## Easy Connect [`easy-connect.md`](specs/easy-connect.md)

> ⚠️ RelationNode の SVG ひし形と Handle の干渉により実装を中断。再設計が必要。

| 機能                                | ステータス | テスト |
| ----------------------------------- | ---------- | ------ |
| ノード全体をドラッグして接続できる  | 🔁 保留    | ❌     |
| FloatingEdge（境界から最短距離）    | 🔁 保留    | ❌     |
| CustomConnectionLine（接続中の線）  | 🔁 保留    | ❌     |
| dragHandle によるドラッグ移動の維持 | 🔁 保留    | ❌     |

---

## 将来実装（スペック未策定）

| 機能                                           | ステータス | 備考                                            |
| ---------------------------------------------- | ---------- | ----------------------------------------------- |
| isAbstract フラグの編集                        | ❌         | Sidebar に未実装                                |
| ファイルへの永続化（Tauri fs）                 | 🔁         | localStorage の限界を超えた場合の候補           |
| LLM API 接続                                   | ❌         | NarrationPanel + LLMAssistant の backend 未実装 |
| E2E テスト（Playwright）                       | ❌         | 右クリック・ドラッグ操作の自動テスト            |
| スキーマ vs データグラフの分離                 | 🔁         | ARCHITECTURE.md に保留として記録済み            |
| 型整備（Branded Types / Discriminated Unions） | ❌         | 別ブランチで実施予定                            |
