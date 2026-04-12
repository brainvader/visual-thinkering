# visual-thinkering

> 主観的なナラティブ（語り）を、構造的な知識グラフへと昇華させる思考支援デスクトップツール

[![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB?logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/React-v19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-~5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-2021-CE422B?logo=rust)](https://www.rust-lang.org)

---

## 概要

**visual-thinkering** は、人間の思考や経験といった主観的なナラティブを、[TypeDB](https://typedb.com/) のセマンティクスに基づく構造的な知識グラフとして可視化・整理するためのデスクトップアプリケーションです。

「頭の中にあるものを、ただ書き留めるのではなく、*考える構造そのもの*として外在化する」—— それがこのツールの中核にある思想です。

### 解決する問題

| 課題                           | visual-thinkering のアプローチ                      |
| ------------------------------ | --------------------------------------------------- |
| 思考がテキストの羅列に埋もれる | グラフ構造として関係性を明示化                      |
| アイデア間の繋がりが見えない   | Entity / Relation / Role によるセマンティックな接続 |
| 知識の再利用が困難             | TypeQL スキーマとして出力可能な構造に昇華           |

---

## 技術スタック

```
visual-thinkering
├── フロントエンド
│   ├── React 19          — UIコンポーネント
│   ├── TypeScript ~5.8   — 型安全な開発
│   └── Vite 7            — 高速ビルド・開発サーバー
│
├── デスクトップシェル
│   └── Tauri 2           — Rust製の軽量ネイティブラッパー
│                           (Electronより ~10倍軽量)
│
└── バックエンド (Rust)
    ├── serde / serde_json — データシリアライズ
    └── tauri-plugin-opener — ファイル・URL展開
```

### なぜ Tauri か

Electronではなく Tauri を選んだ理由は、ランタイムにシステムの WebView を利用することで、バンドルサイズと起動速度を劇的に削減できるからです。思考を邪魔しないツールには、邪魔しない軽量さが必要です。

---

## TypeDB との関係

visual-thinkering は TypeDB のスキーマモデルを思考の _言語_ として採用します。

```typeql
# ナラティブから生成されるスキーマの例
define
  concept sub entity,
    owns label,
    owns description;

  relationship sub relation,
    relates source,
    relates target;

  concept plays relationship:source,
    concept plays relationship:target;
```

グラフ上でノード・エッジを操作するすべての行為が、TypeQL として意味を持つよう設計されています。

---

## プロジェクト構成

```
visual-thinkering/
├── src/                    # フロントエンド (React + TypeScript)
│   ├── main.tsx            # エントリーポイント
│   └── App.tsx             # ルートコンポーネント
│
├── src-tauri/              # バックエンド (Rust)
│   ├── src/
│   │   ├── main.rs         # バイナリエントリーポイント
│   │   └── lib.rs          # Tauri コマンド定義
│   ├── Cargo.toml          # Rust 依存関係
│   └── tauri.conf.json     # アプリケーション設定
│
├── public/                 # 静的アセット
├── CLAUDE.md               # 開発規約・アーキテクチャ正典 (Source of Truth)
├── package.json
└── pnpm-lock.yaml
```

---

## 開発環境のセットアップ

### 前提条件

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8
- [Rust](https://rustup.rs/) (stable)
- Tauri の依存ライブラリ（プラットフォーム別）→ [Tauri Prerequisites](https://tauri.app/start/prerequisites/)

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/brainvader/visual-thinkering.git
cd visual-thinkering

# 依存関係のインストール
pnpm install
```

### 起動

```bash
# 開発モード（ホットリロード付き）
pnpm tauri dev

# プロダクションビルド
pnpm tauri build
```

---

## 開発ガイドライン

このプロジェクトの開発規約は `CLAUDE.md` を正典（Source of Truth）として管理されています。

### ブランチ・コミット規約

コミットメッセージは簡潔な英語で記述します：

```
feat: add graph canvas component
fix: resolve TypeQL export serialization
refactor: extract node panel into hook
docs: update CLAUDE.md with new schema conventions
```

### コンポーネント設計方針

- 各パネルや複雑なロジックは積極的にコンポーネント・フックへ分割
- コード内コメントは実装意図を示す **日本語** で記述
- TypeDB のセマンティクス（Entity / Relation / Attribute / Role / Ownership）を尊重した命名

---

## ロードマップ

- [ ] グラフキャンバス（ノード・エッジの可視化）
- [ ] ナラティブ入力パネル
- [ ] TypeQL スキーマ出力パネル
- [ ] TypeDB への接続・同期
- [ ] スキーマのバリデーション（TypeQL 整合性チェック）

---

## ライセンス

MIT

---

> _"Thinking is not writing. But writing structures thought."_
