// src/components/ProjectCard.tsx
// 最近開いたプロジェクトを表示するカードコンポーネント
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectCardProps {
    filePath: string;
    name: string;
    description: string;
    lastOpenedAt: string;
    onClick: () => void;
    onDelete: () => void;
}

export function ProjectCard({
    name,
    description,
    lastOpenedAt,
    onClick,
    onDelete,
}: ProjectCardProps) {
    const formattedDate = new Date(lastOpenedAt).toLocaleDateString('ja-JP');

    return (
        // カード全体をボタンにしてクリックで遷移できるようにする
        <button
            aria-label={name}
            onClick={onClick}
            className="relative w-full text-left rounded-lg border bg-card p-4 hover:bg-accent transition-colors"
        >
            <div className="pr-8">
                <p className="font-medium text-sm truncate">{name}</p>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                        {description}
                    </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">{formattedDate}</p>
            </div>

            {/* 削除ボタン：クリックの伝播を止めてカードの onClick を発火しない */}
            <Button
                aria-label="削除"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 size-6"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
            >
                <Trash2 size={12} />
            </Button>
        </button>
    );
}