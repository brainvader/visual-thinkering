// src/components/UnsavedDialog.tsx
//
// 未保存の変更がある状態でアプリを閉じようとしたとき表示する確認ダイアログ。
// shadcn/ui の AlertDialog を使用する。

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface UnsavedDialogProps {
    open: boolean;
    onSaveAndClose: () => void;
    onDiscardAndClose: () => void;
    onCancel: () => void;
}

export function UnsavedDialog({
    open,
    onSaveAndClose,
    onDiscardAndClose,
    onCancel,
}: UnsavedDialogProps) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>未保存の変更があります</AlertDialogTitle>
                    <AlertDialogDescription>
                        閉じる前に保存しますか？
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {/* キャンセル：ダイアログを閉じてアプリに戻る */}
                    <AlertDialogCancel onClick={onCancel}>
                        キャンセル
                    </AlertDialogCancel>
                    {/* 破棄：保存せずにアプリを閉じる */}
                    <AlertDialogAction
                        variant="destructive"
                        onClick={onDiscardAndClose}
                    >
                        破棄して閉じる
                    </AlertDialogAction>
                    {/* 保存：保存してからアプリを閉じる */}
                    <AlertDialogAction onClick={onSaveAndClose}>
                        保存して閉じる
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}