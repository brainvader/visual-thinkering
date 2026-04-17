// src/hooks/useFileSave.test.ts
//
// useFileSave フックのテスト（Red → Green）
// Tauri API と sonner は vi.mock で差し替える

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileSave } from './useFileSave';
import { useStore } from '@/store';

vi.mock('@tauri-apps/plugin-fs', () => ({
    writeTextFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
    save: vi.fn().mockResolvedValue('/mock/path/default.json'),
}));

// toast の呼び出しを検証できるようにモックする
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const { writeTextFile } = await import('@tauri-apps/plugin-fs');
const { save: dialogSave } = await import('@tauri-apps/plugin-dialog');
const { toast } = await import('sonner');

beforeEach(() => {
    localStorage.clear();
    useStore.setState({ nodes: [], edges: [], narration: '' });
    vi.clearAllMocks();
    vi.mocked(dialogSave).mockResolvedValue('/mock/path/default.json');
    vi.mocked(writeTextFile).mockResolvedValue(undefined);
});

describe('useFileSave: 初回保存（パスなし）', () => {
    it('ダイアログが開き、選択したパスに writeTextFile が呼ばれること', async () => {
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.save(); });

        expect(dialogSave).toHaveBeenCalledOnce();
        expect(writeTextFile).toHaveBeenCalledWith(
            '/mock/path/default.json',
            expect.any(String)
        );
    });

    it('保存後にパスが localStorage に記録されること', async () => {
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.save(); });

        expect(localStorage.getItem('vt-save-path')).toBe('/mock/path/default.json');
    });

    it('保存成功時に toast.success が呼ばれること', async () => {
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.save(); });

        expect(toast.success).toHaveBeenCalledOnce();
        expect(toast.success).toHaveBeenCalledWith('保存しました', expect.objectContaining({
            description: '/mock/path/default.json',
        }));
    });

    it('ダイアログをキャンセルすると何も起きないこと', async () => {
        vi.mocked(dialogSave).mockResolvedValueOnce(null);
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.save(); });

        expect(writeTextFile).not.toHaveBeenCalled();
        expect(toast.success).not.toHaveBeenCalled();
        expect(localStorage.getItem('vt-save-path')).toBeNull();
    });
});

describe('useFileSave: 2回目以降の保存（パスあり）', () => {
    it('ダイアログを開かずに同じパスへ上書きすること', async () => {
        localStorage.setItem('vt-save-path', '/existing/path/schema.json');
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.save(); });

        expect(dialogSave).not.toHaveBeenCalled();
        expect(writeTextFile).toHaveBeenCalledWith(
            '/existing/path/schema.json',
            expect.any(String)
        );
    });
});

describe('useFileSave: 保存失敗', () => {
    it('writeTextFile が失敗したとき toast.error が呼ばれること', async () => {
        vi.mocked(writeTextFile).mockRejectedValueOnce(new Error('Permission denied'));
        localStorage.setItem('vt-save-path', '/existing/path/schema.json');
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.save(); });

        expect(toast.error).toHaveBeenCalledOnce();
        expect(toast.success).not.toHaveBeenCalled();
    });
});

describe('useFileSave: 保存内容の検証', () => {
    it('保存JSONに nodes / edges / narration / version が含まれること', async () => {
        useStore.setState({
            nodes: [{ id: 'n1', type: 'entity', position: { x: 0, y: 0 }, data: { label: 'Person', typeDBType: 'entity', isAbstract: false } }],
            edges: [],
            narration: 'テストナラティブ',
        });

        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.save(); });

        const written = vi.mocked(writeTextFile).mock.calls[0][1] as string;
        const parsed = JSON.parse(written);

        expect(parsed.nodes).toHaveLength(1);
        expect(parsed.narration).toBe('テストナラティブ');
        expect(parsed.version).toBeDefined();
        expect(parsed.savedAt).toBeDefined();
    });
});

describe('useFileSave: markClean 連携', () => {
    it('保存成功後に isDirty が false になること', async () => {
        useStore.getState().markDirty(); // 事前に dirty にする
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.save(); });

        expect(useStore.getState().isDirty).toBe(false);
    });

    it('ダイアログキャンセル時は isDirty が変化しないこと', async () => {
        useStore.getState().markDirty();
        vi.mocked(dialogSave).mockResolvedValueOnce(null);
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.save(); });

        expect(useStore.getState().isDirty).toBe(true);
    });

    it('保存失敗時は isDirty が変化しないこと', async () => {
        useStore.getState().markDirty();
        vi.mocked(writeTextFile).mockRejectedValueOnce(new Error('disk full'));
        localStorage.setItem('vt-save-path', '/existing/path/schema.json');
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.save(); });

        expect(useStore.getState().isDirty).toBe(true);
    });
});