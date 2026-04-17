// src/hooks/useCloseGuard.ts
//
// アプリ終了時の未保存確認を担うフック。
// Tauri の onCloseRequested イベントを購読し、
// isDirty なときはウィンドウを止めてダイアログを表示させる。

import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useStore } from '@/store';

interface UseCloseGuardOptions {
    // isDirty=true のとき呼ばれる（ダイアログを開くトリガー）
    onRequestClose: () => void;
}

export function useCloseGuard({ onRequestClose }: UseCloseGuardOptions): void {
    const isDirty = useStore((s) => s.isDirty);

    useEffect(() => {
        let unlisten: (() => void) | null = null;

        const setup = async () => {
            const win = getCurrentWindow();
            unlisten = await win.onCloseRequested((event) => {
                if (isDirty) {
                    // 未保存の変更があるときはウィンドウを止めてダイアログを表示する
                    event.preventDefault();
                    onRequestClose();
                }
                // isDirty=false のときは何もしない（ウィンドウがそのまま閉じる）
            });
        };

        setup();

        return () => {
            // コンポーネントアンマウント時にリスナーを解除する
            unlisten?.();
        };
    }, [isDirty, onRequestClose]);
}