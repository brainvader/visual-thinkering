# Logic Specification: TypeQL Generation

## Algorithm Steps

1. **Define Blocks**:
   - 全ての `Entity` ノードを抽出し `[label] sub entity;` を出力。
   - 全ての `Relation` ノードを抽出し、接続エッジから `relates [role]` を収集して出力。
2. **Relationship Binding**:
   - `Edge` を走査し、接続元(Source)が `Entity` で接続先(Target)が `Relation` の場合、`[SourceLabel] plays [TargetLabel]:[Role];` を出力。

## Edge Case: Unconnected Nodes

- 接続がないノードも、スキーマ定義（`sub entity;` 等）としては必ず出力する。
- 名前が重複している場合は、ユニークな名称になるよう警告を出すかサフィックスを付与する。
