// src/pages/ProjectListPage.tsx
// プロジェクト一覧画面。最近開いたファイルの履歴を表示し、
// 新規作成・ファイルを開く・履歴から開くの3つの導線を提供する。
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus } from 'lucide-react';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/ProjectCard';
import { NewProjectDialog } from '@/components/NewProjectDialog';
import { useFileLoad } from '@/hooks/useFileLoad';
import { useRecentProjectsStore } from '@/store/recentProjectsStore';
import { useStore } from '@/store';

export function ProjectListPage() {
    const navigate = useNavigate();
    const { open } = useFileLoad();
    const { recents, addRecent, removeRecent } = useRecentProjectsStore();
    const [dialogOpen, setDialogOpen] = useState(false);

    // 「ファイルを開く」ボタンの処理
    const handleOpenFile = async () => {
        await open();
        // open() 内で vt-save-path が更新されている場合のみ遷移する
        const savedPath = localStorage.getItem('vt-save-path');
        if (savedPath) {
            navigate('/editor');
        }
    };

    // 新規プロジェクト作成の処理
    const handleCreateProject = async (values: {
        name: string;
        description: string;
    }) => {
        setDialogOpen(false);

        // 保存先ダイアログを表示する
        const filePath = await saveDialog({
            defaultPath: `${values.name}.json`,
            filters: [{ name: 'JSON', extensions: ['json'] }],
        });

        // キャンセル時は何もしない
        if (!filePath) return;

        // 空のプロジェクト JSON を書き込む
        const json = JSON.stringify(
            {
                version: 1,
                savedAt: new Date().toISOString(),
                name: values.name,
                description: values.description,
                nodes: [],
                edges: [],
                narration: '',
            },
            null,
            2
        );
        await writeTextFile(filePath, json);

        // ストアをリセットして新規プロジェクトとして開く
        useStore.setState({ nodes: [], edges: [], narration: '' });
        useStore.getState().markClean();
        localStorage.setItem('vt-save-path', filePath);

        // 履歴に追加する
        addRecent({
            filePath,
            name: values.name,
            description: values.description,
            lastOpenedAt: new Date().toISOString(),
        });

        navigate('/editor');
    };

    // 履歴カードをクリックしたときの処理
    const handleCardClick = async (filePath: string) => {
        const { load } = useFileLoad();
        // パスを直接セットして load() を呼ぶ
        localStorage.setItem('vt-save-path', filePath);
        await load();
        navigate('/editor');
    };

    return (
        <div className="h-screen w-screen bg-background flex flex-col">
            {/* ヘッダー */}
            <header className="h-10 border-b flex items-center px-4 shrink-0">
                <span className="text-sm font-medium">Visual Thinkering</span>
            </header>

            {/* メインコンテンツ */}
            <main className="flex-1 overflow-y-auto p-6">
                {/* アクションボタン */}
                <div className="flex gap-2 mb-6">
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus size={14} />
                        新規プロジェクト
                    </Button>
                    <Button variant="outline" onClick={handleOpenFile}>
                        <FolderOpen size={14} />
                        ファイルを開く
                    </Button>
                </div>

                {/* 履歴一覧 */}
                {recents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        最近開いたプロジェクトはありません
                    </p>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        {recents.map((r) => (
                            <ProjectCard
                                key={r.filePath}
                                {...r}
                                onClick={() => handleCardClick(r.filePath)}
                                onDelete={() => removeRecent(r.filePath)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* 新規プロジェクトダイアログ */}
            <NewProjectDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleCreateProject}
            />
        </div>
    );
}