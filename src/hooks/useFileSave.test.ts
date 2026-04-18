// src/hooks/useFileSave.test.ts
//
// useFileSave フックのテスト（Red → Green）
// Tauri API と sonner は vi.mock で差し替える

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileSave } from './useFileSave';
import { useStore } from '@/store';
import { useRecentProjectsStore } from '@/store/recentProjectsStore';

vi.mock('@tauri-apps/plugin-fs', () => ({
    writeTextFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
    save: vi.fn().mockResolvedValue('/mock/path/default.json'),
}));

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
    useStore.setState({ nodes: [], edges: [], narration: '', projectName: '', projectDescription: '' });
    useRecentProjectsStore.setState({ recents: [] });
    vi.clearAllMocks();
    vi.mocked(dialogSave).mockResolvedValue('/mock/path/default.json');
    vi.mocked(writeTextFile).mockResolvedValue(undefined);
});

// ─── save() のテスト群（既存） ───────────────────────────────────────────────

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
        useStore.getState().markDirty();
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

describe('useFileSave: addRecent() 連携', () => {
    it('保存成功時に addRecent() が呼ばれること', async () => {
        localStorage.setItem('vt-save-path', '/mock/path/project.json');
        useStore.setState({
            nodes: [],
            edges: [],
            narration: '',
            projectName: 'HRシステム',
            projectDescription: '人事管理',
        });

        const { result } = renderHook(() => useFileSave());
        await act(async () => { await result.current.save(); });

        const { recents } = useRecentProjectsStore.getState();
        expect(recents).toHaveLength(1);
        expect(recents[0].filePath).toBe('/mock/path/project.json');
        expect(recents[0].name).toBe('HRシステム');
    });

    it('保存キャンセル時は addRecent() が呼ばれないこと', async () => {
        vi.mocked(dialogSave).mockResolvedValueOnce(null);
        const { result } = renderHook(() => useFileSave());
        await act(async () => { await result.current.save(); });

        expect(useRecentProjectsStore.getState().recents).toHaveLength(0);
    });
});

// ─── saveAs() のテスト群（新規） ─────────────────────────────────────────────

describe('useFileSave: saveAs() 基本動作', () => {
    it('常にダイアログが開くこと（パスあり状態でも）', async () => {
        localStorage.setItem('vt-save-path', '/existing/path/schema.json');
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.saveAs(); });

        expect(dialogSave).toHaveBeenCalledOnce();
    });

    it('選択したパスに writeTextFile が呼ばれること', async () => {
        vi.mocked(dialogSave).mockResolvedValueOnce('/new/path/schema.json');
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.saveAs(); });

        expect(writeTextFile).toHaveBeenCalledWith(
            '/new/path/schema.json',
            expect.any(String)
        );
    });

    it('保存後に新しいパスが localStorage に記録されること', async () => {
        localStorage.setItem('vt-save-path', '/existing/path/schema.json');
        vi.mocked(dialogSave).mockResolvedValueOnce('/new/path/schema.json');
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.saveAs(); });

        expect(localStorage.getItem('vt-save-path')).toBe('/new/path/schema.json');
    });

    it('保存成功時に toast.success が呼ばれること', async () => {
        vi.mocked(dialogSave).mockResolvedValueOnce('/new/path/schema.json');
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.saveAs(); });

        expect(toast.success).toHaveBeenCalledOnce();
        expect(toast.success).toHaveBeenCalledWith('保存しました', expect.objectContaining({
            description: '/new/path/schema.json',
        }));
    });
});

describe('useFileSave: saveAs() コピー名', () => {
    it('既存コピーがない場合は "projectName 001" で保存されること', async () => {
        vi.mocked(dialogSave).mockResolvedValueOnce('/new/path/schema.json');
        useStore.setState({ projectName: 'HRシステム' });

        const { result } = renderHook(() => useFileSave());
        await act(async () => { await result.current.saveAs(); });

        const written = vi.mocked(writeTextFile).mock.calls[0][1] as string;
        expect(JSON.parse(written).name).toBe('HRシステム 001');
    });

    it('既存コピーがある場合は番号がインクリメントされること', async () => {
        vi.mocked(dialogSave).mockResolvedValueOnce('/new/path/schema.json');
        useStore.setState({ projectName: 'HRシステム' });
        useRecentProjectsStore.setState({
            recents: [
                { filePath: '/a.json', name: 'HRシステム 001', description: '', lastOpenedAt: '' },
                { filePath: '/b.json', name: 'HRシステム 002', description: '', lastOpenedAt: '' },
            ],
        });

        const { result } = renderHook(() => useFileSave());
        await act(async () => { await result.current.saveAs(); });

        const written = vi.mocked(writeTextFile).mock.calls[0][1] as string;
        expect(JSON.parse(written).name).toBe('HRシステム 003');
    });

    it('保存後に store の projectName がコピー名に更新されること', async () => {
        vi.mocked(dialogSave).mockResolvedValueOnce('/new/path/schema.json');
        useStore.setState({ projectName: 'HRシステム' });

        const { result } = renderHook(() => useFileSave());
        await act(async () => { await result.current.saveAs(); });

        expect(useStore.getState().projectName).toBe('HRシステム 001');
    });

    it('addRecent() がコピー名で呼ばれること', async () => {
        vi.mocked(dialogSave).mockResolvedValueOnce('/new/path/schema.json');
        useStore.setState({ projectName: 'HRシステム' });

        const { result } = renderHook(() => useFileSave());
        await act(async () => { await result.current.saveAs(); });

        const { recents } = useRecentProjectsStore.getState();
        expect(recents[0].name).toBe('HRシステム 001');
    });
});

describe('useFileSave: saveAs() キャンセル', () => {
    it('ダイアログをキャンセルすると writeTextFile が呼ばれないこと', async () => {
        vi.mocked(dialogSave).mockResolvedValueOnce(null);
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.saveAs(); });

        expect(writeTextFile).not.toHaveBeenCalled();
    });

    it('ダイアログをキャンセルしても localStorage が変化しないこと', async () => {
        localStorage.setItem('vt-save-path', '/existing/path/schema.json');
        vi.mocked(dialogSave).mockResolvedValueOnce(null);
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.saveAs(); });

        expect(localStorage.getItem('vt-save-path')).toBe('/existing/path/schema.json');
    });

    it('ダイアログをキャンセルしても store の projectName が変化しないこと', async () => {
        vi.mocked(dialogSave).mockResolvedValueOnce(null);
        useStore.setState({ projectName: 'HRシステム' });
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.saveAs(); });

        expect(useStore.getState().projectName).toBe('HRシステム');
    });
});

describe('useFileSave: saveAs() 保存失敗', () => {
    it('writeTextFile が失敗したとき toast.error が呼ばれること', async () => {
        vi.mocked(dialogSave).mockResolvedValueOnce('/new/path/schema.json');
        vi.mocked(writeTextFile).mockRejectedValueOnce(new Error('Permission denied'));
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.saveAs(); });

        expect(toast.error).toHaveBeenCalledOnce();
        expect(toast.success).not.toHaveBeenCalled();
    });

    it('writeTextFile が失敗したとき localStorage が変化しないこと', async () => {
        localStorage.setItem('vt-save-path', '/existing/path/schema.json');
        vi.mocked(dialogSave).mockResolvedValueOnce('/new/path/schema.json');
        vi.mocked(writeTextFile).mockRejectedValueOnce(new Error('Permission denied'));
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.saveAs(); });

        expect(localStorage.getItem('vt-save-path')).toBe('/existing/path/schema.json');
    });
});

describe('useFileSave: saveAs() markClean 連携', () => {
    it('保存成功後に isDirty が false になること', async () => {
        useStore.getState().markDirty();
        vi.mocked(dialogSave).mockResolvedValueOnce('/new/path/schema.json');
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.saveAs(); });

        expect(useStore.getState().isDirty).toBe(false);
    });

    it('ダイアログキャンセル時は isDirty が変化しないこと', async () => {
        useStore.getState().markDirty();
        vi.mocked(dialogSave).mockResolvedValueOnce(null);
        const { result } = renderHook(() => useFileSave());

        await act(async () => { await result.current.saveAs(); });

        expect(useStore.getState().isDirty).toBe(true);
    });
});