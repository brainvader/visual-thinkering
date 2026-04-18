// src/components/NewProjectDialog.tsx
// 新規プロジェクト作成ダイアログ（名前・概要入力）
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: { name: string; description: string }) => void;
}

export function NewProjectDialog({
    open,
    onOpenChange,
    onSubmit,
}: NewProjectDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), description: description.trim() });
        // フォームをリセットする
        setName('');
        setDescription('');
    };

    const handleCancel = () => {
        setName('');
        setDescription('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>新規プロジェクト</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="project-name">プロジェクト名</Label>
                        <Input
                            id="project-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例：HR管理システム"
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="project-description">概要</Label>
                        <Input
                            id="project-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="例：人事管理のスキーマ設計"
                            autoComplete="off"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        キャンセル
                    </Button>
                    {/* 名前が空のとき disabled にする */}
                    <Button onClick={handleSubmit} disabled={!name.trim()}>
                        作成
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}