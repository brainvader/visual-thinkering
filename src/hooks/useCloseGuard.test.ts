// src/hooks/useCloseGuard.test.ts
//
// useCloseGuard フックのテスト（Red → Green）
// Tauri の onCloseRequested を購読し、isDirty に応じて
// ウィンドウを止めるかどうかを検証する

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCloseGuard } from './useCloseGuard';
import { useStore } from '@/store';

// CloseRequestedEvent の preventDefault をキャプチャするためのモック
const mockPreventDefault = vi.fn();
let capturedHandler: ((event: { preventDefault: () => void }) => void) | null = null;

// Tauri の getCurrentWindow をモックする
// onCloseRequested に渡されたハンドラをキャプチャして、テストから呼び出せるようにする
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: () => ({
        onCloseRequested: vi.fn((handler) => {
            // ハンドラをキャプチャする
            capturedHandler = handler;
            // unlisten 関数を返す（クリーンアップ用）
            return Promise.resolve(() => { });
        }),
        close: vi.fn(),
    }),
}));

beforeEach(() => {
    vi.clearAllMocks();
    capturedHandler = null;
    useStore.setState({
        nodes: [],
        edges: [],
        narration: '',
        isDirty: false,
    });
});

describe('useCloseGuard: isDirty=false のとき', () => {
    it('onCloseRequested で preventDefault が呼ばれないこと', async () => {
        const onRequestClose = vi.fn();
        renderHook(() => useCloseGuard({ onRequestClose }));

        // フック内の useEffect が走るまで待つ
        await vi.waitFor(() => expect(capturedHandler).not.toBeNull());

        // isDirty=false の状態でハンドラを呼び出す
        capturedHandler!({ preventDefault: mockPreventDefault });

        expect(mockPreventDefault).not.toHaveBeenCalled();
    });

    it('onRequestClose が呼ばれないこと', async () => {
        const onRequestClose = vi.fn();
        renderHook(() => useCloseGuard({ onRequestClose }));

        await vi.waitFor(() => expect(capturedHandler).not.toBeNull());

        capturedHandler!({ preventDefault: mockPreventDefault });

        expect(onRequestClose).not.toHaveBeenCalled();
    });
});

describe('useCloseGuard: isDirty=true のとき', () => {
    it('onCloseRequested で preventDefault が呼ばれること', async () => {
        useStore.setState({ isDirty: true });

        const onRequestClose = vi.fn();
        renderHook(() => useCloseGuard({ onRequestClose }));

        await vi.waitFor(() => expect(capturedHandler).not.toBeNull());

        capturedHandler!({ preventDefault: mockPreventDefault });

        expect(mockPreventDefault).toHaveBeenCalledOnce();
    });

    it('onRequestClose が呼ばれること', async () => {
        useStore.setState({ isDirty: true });

        const onRequestClose = vi.fn();
        renderHook(() => useCloseGuard({ onRequestClose }));

        await vi.waitFor(() => expect(capturedHandler).not.toBeNull());

        capturedHandler!({ preventDefault: mockPreventDefault });

        expect(onRequestClose).toHaveBeenCalledOnce();
    });
});