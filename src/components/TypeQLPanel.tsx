// src/components/TypeQLPanel.tsx
// グラフから生成した TypeQL をリアルタイムで表示するパネル

import React, { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { TypeDBNodeData, TypeDBEdgeData } from '@/types';
import { generateTypeQL } from '@/lib/typeql';
import { Button } from '@/components/ui/button';

interface TypeQLPanelProps {
    nodes: Node<TypeDBNodeData>[];
    edges: Edge<TypeDBEdgeData>[];
}

// TypeQL キーワードに色を付けるシンプルなハイライト関数
// キーワードが型名・ロール名として使われる場合は着色しない
function highlight(line: string): React.ReactNode {
    // 行頭のインデントを保持しながら各トークンを処理する
    // コメント行はそのまま薄い色で表示
    if (line.trim().startsWith('#')) {
        return <span className="text-muted-foreground">{line}</span>;
    }

    // TypeQL の構造キーワード（行頭または特定の位置に来るもの）
    // 正規表現でキーワードを単語境界で分割し、位置によって色分けする
    const parts = line.split(/(\bdefine\b|\bsub\b|\brelates\b|\bplays\b|\bowns\b|\bvalue\b|\bstring\b|\bdatetime\b|\blong\b|\bdouble\b|\bboolean\b|\battribute\b|\brelation\b|\bentity\b)/);

    return parts.map((part, i) => {
        // キーワードのみ着色（偶数インデックスが非キーワード、奇数が区切り文字=キーワード）
        const isKeyword = i % 2 === 1;
        if (isKeyword) {
            // sub の後の型名と区別するため、sub / relates / plays / owns は強調
            // entity / relation / attribute / value 型も強調
            return <span key={i} className="text-blue-600 font-semibold">{part}</span>;
        }
        return <span key={i}>{part}</span>;
    });
}

export function TypeQLPanel({ nodes, edges }: TypeQLPanelProps) {
    const [copied, setCopied] = useState(false);

    // nodes/edges が変わるたびに TypeQL を再生成
    const { typeql, warnings } = generateTypeQL(nodes, edges, { includeWarnings: true });

    const handleCopy = useCallback(async () => {
        if (!typeql) return;
        await navigator.clipboard.writeText(typeql);
        setCopied(true);
        // 2秒後にアイコンを元に戻す
        setTimeout(() => setCopied(false), 2000);
    }, [typeql]);

    return (
        <div className="flex flex-col h-full gap-2 p-3">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    TypeQL
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={handleCopy}
                    disabled={!typeql}
                    aria-label="Copy TypeQL"
                >
                    {copied ? (
                        <><Check size={12} className="text-green-500" /> Copied</>
                    ) : (
                        <><Copy size={12} /> Copy</>
                    )}
                </Button>
            </div>

            {/* 警告メッセージ */}
            {warnings.length > 0 && (
                <div className="flex items-start gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-1.5 text-xs text-amber-700">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium">ロール名が未設定のエッジがあります（{warnings.length}件）</p>
                        <p className="text-amber-600/80">エッジをクリックして Sidebar でロール名を設定してください</p>
                    </div>
                </div>
            )}

            {/* TypeQL 出力エリア */}
            {typeql ? (
                <pre className="flex-1 overflow-auto rounded-md bg-muted/30 p-3 text-xs leading-relaxed font-mono">
                    {typeql.split('\n').map((line, i) => (
                        <div key={i}>{highlight(line)}</div>
                    ))}
                </pre>
            ) : (
                // グラフが空のとき
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground text-center">
                        ノードを追加するとTypeQLが生成されます
                    </p>
                </div>
            )}
        </div>
    );
}