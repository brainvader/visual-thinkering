# CLAUDE.md — Visual Thinkering

## Project Overview

**Visual Thinkering** is a desktop application for visual TypeDB schema design. Users build knowledge graphs (entities, relations, attributes) in a React Flow canvas, and the app generates TypeQL schema definitions from the visual graph. Planned LLM integration will automate entity/relation extraction from narrative text input.

Built with **React + Tauri** — a React frontend packaged as a cross-platform desktop app.

## Role & Context

あなたは、主観的なナラティブ（語り）を構造的な知識（TypeDB スキーマ/グラフ）へと昇華させる思考支援ツール「visual-thinkering」の開発パートナーです。

## Development Workflow

- **Spec First**: 実装前にまず仕様を考え、ユーザーに説明・確認を取ってください。
- **Documentation**: `CLAUDE.md` をプロジェクトの正典（Source of Truth）として扱い、構造や規約に変更があった場合は適宜更新を提案してください。
- **Modularization**: 可読性を考慮して、コンポーネントが肥大化しないよう、各パネルやロジックは積極的にコンポーネント化・フック化して分割してください。

## Communication

- **Language**: 思考は英語、対話は日本語で行ってください。
- **Comments**: コード内には実装意図を示す日本語のコメントを付与してください。
- **Commit Messages**: 変更に関しては、簡潔な英語のコミットメッセージを提示してください。
- **Tone**: 単なる作業代行者ではなく、洞察に満ちた、時折ウィットに富んだ技術的助言を行う共同開発者として振る舞ってください。

## Domain Knowledge

- TypeDB のセマンティクス（Entity, Relation, Attribute, Role, Ownership）を深く理解し、グラフ操作が TypeQL のスキーマ定義として正しく成立するように配慮してください。

## Tech Stack

| Layer           | Technology                            |
| --------------- | ------------------------------------- |
| Framework       | React 19 + TypeScript 5.8             |
| Desktop         | Tauri 2.x (Rust backend)              |
| Build           | Vite 7                                |
| Graph           | @xyflow/react 12 (React Flow)         |
| State           | Zustand 5                             |
| UI              | shadcn/ui (Radix UI + Tailwind CSS 4) |
| Testing         | Vitest 4 + React Testing Library      |
| Package Manager | pnpm                                  |

---

## Commands

```bash
# Development
pnpm dev            # Vite dev server only (port 1420)
pnpm tauri dev      # Desktop app with live reload (runs pnpm dev automatically)

# Build
pnpm build          # tsc type check + Vite build → dist/
pnpm tauri build    # Package desktop app (runs pnpm build first)

# Test
pnpm test           # Vitest (jsdom environment)

# Preview
pnpm preview        # Preview built frontend
```

---

## Directory Structure

```
visual-thinkering/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Root component — 4-panel resizable layout
│   ├── store.ts              # Zustand state (nodes, edges, handlers)
│   ├── types/
│   │   └── index.ts          # TypeDB type definitions
│   ├── components/
│   │   ├── GraphCanvas.tsx   # React Flow canvas with context menu
│   │   ├── Sidebar.tsx       # Node inspector panel
│   │   └── ui/               # shadcn/ui components (button, card, etc.)
│   ├── lib/
│   │   ├── typeql.ts         # TypeQL code generation from graph
│   │   └── utils.ts          # cn() utility (clsx + tailwind-merge)
│   └── test/
│       └── setup.ts          # Vitest setup (ResizeObserver mock for React Flow)
└── src-tauri/
    ├── src/
    │   ├── main.rs           # Entry point → lib::run()
    │   └── lib.rs            # Tauri builder + greet command
    └── tauri.conf.json       # App config (window size, dev URL, bundle settings)
```

---

## Architecture

### Layout (App.tsx)

The root component renders a 4-panel resizable layout:

| Panel  | Size | Content                                 |
| ------ | ---- | --------------------------------------- |
| Left   | 20%  | User Narration (narrative text input)   |
| Center | 60%  | GraphCanvas (75%) + LLM Assistant (25%) |
| Right  | 20%  | Sidebar / Node Inspector                |

### State Management (store.ts)

Zustand is the single source of truth for graph state. Subscribe to state selectors individually to avoid infinite re-renders with React Flow — see comment `無限ループ防止のため個別に state を取得` in App.tsx.

```typescript
// Good — subscribe to individual selectors
const nodes = useGraphStore((s) => s.nodes);
const edges = useGraphStore((s) => s.edges);

// Bad — subscribing to whole store causes infinite re-renders
const store = useGraphStore();
```

Store API:

- `nodes`, `edges` — current graph state
- `onNodesChange`, `onEdgesChange` — React Flow change handlers
- `onConnect` — new edge creation handler
- `setNodes` — batch node update
- `deleteNode(nodeId)` — remove node and all connected edges

### Type System (types/index.ts)

TypeDB-specific types:

- `TypeDBMetaType` — `"entity" | "relation" | "attribute"`
- `TypeDBNodeData` — `{ label, typeDBType, isAbstract }`
- `TypeDBEdgeData` — `{ role, isKey }`

### TypeQL Generation (lib/typeql.ts)

`generateTypeQL(nodes, edges)` converts the graph to a valid TypeQL schema definition string.

---

## Key Patterns and Conventions

- **Path alias**: `@/` maps to `./src/` — use this for all imports
- **UI components**: Add new UI primitives to `src/components/ui/` following shadcn conventions
- **shadcn/ui**: Style: `radix-nova`, icons: `lucide`, base color: `neutral`
- **Comments**: Japanese comments are expected throughout the codebase
- **Rust backend**: Minimal — only the `greet` command. Keep Rust changes minimal; logic lives in the React frontend
- **CSP**: Disabled in Tauri config (`"security": { "csp": null }`) — intentional for dev flexibility

---

## Testing

Tests use Vitest with jsdom. React Flow requires a `ResizeObserver` mock, which is set up in `src/test/setup.ts`.

```bash
pnpm test
```

Test files live alongside source files (e.g., `App.test.tsx`).

---

## Adding shadcn Components

```bash
pnpm dlx shadcn@latest add <component-name>
```

Components are added to `src/components/ui/`.
