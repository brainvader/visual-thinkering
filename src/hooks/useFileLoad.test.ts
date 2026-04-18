// src/hooks/useFileLoad.test.ts
//
// useFileLoad フックのテスト（Red → Green）
// 起動時にファイルを読み込み、ストアに展開する動作を検証する

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileLoad } from './useFileLoad';
import { useStore } from '@/store';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useRecentProjectsStore } from '@/store/recentProjectsStore';

// vi.mock はホイストされるため、ファクトリ内で変数を参照できない。
// モックのデフォルト戻り値はファクトリ内で直接定義し、
// テストごとの上書きは vi.mocked().mockResolvedValueOnce() で行う。
const MOCK_FILE_JSON = JSON.stringify({
    version: 1,
    savedAt: '2026-04-17T00:00:00.000Z',
    nodes: [
        {
            id: 'node-1',
            type: 'entity',
            position: { x: 0, y: 0 },
            data: { label: 'Person', typeDBType: 'entity', isAbstract: false },
        },
    ],
    edges: [],
    narration: 'テストナラティブ',
});

// Tauri プラグインをモック（ファクトリ内はリテラルのみ使用）
vi.mock('@tauri-apps/plugin-fs', () => ({
    readTextFile: vi.fn(),
}));

vi.mock('@tauri-apps/api/path', () => ({
    resolveResource: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
    open: vi.fn(),
}));

const { readTextFile } = await import('@tauri-apps/plugin-fs');
const { resolveResource } = await import('@tauri-apps/api/path');
const { open: mockOpenDialog } = await import('@tauri-apps/plugin-dialog');

beforeEach(() => {
    localStorage.clear();
    useStore.setState({ nodes: [], edges: [], narration: '' });
    vi.clearAllMocks();
    // clearAllMocks でリセットされるため、毎回デフォルト戻り値を再設定する
    vi.mocked(readTextFile).mockResolvedValue(MOCK_FILE_JSON);
    vi.mocked(resolveResource).mockResolvedValue('/mock/resources/default.json');
});

describe('useFileLoad: vt-save-path なし（初回起動）', () => {
    it('resources/default.json を読み込んでストアに展開すること', async () => {
        const { result } = renderHook(() => useFileLoad());

        await act(async () => {
            await result.current.load();
        });

        expect(resolveResource).toHaveBeenCalledWith('resources/default.json');
        expect(readTextFile).toHaveBeenCalledWith('/mock/resources/default.json');
        expect(useStore.getState().nodes).toHaveLength(1);
        expect(useStore.getState().narration).toBe('テストナラティブ');
    });
});

describe('useFileLoad: vt-save-path あり（2回目以降）', () => {
    it('保存済みパスのファイルを読み込むこと', async () => {
        localStorage.setItem('vt-save-path', '/user/saved/schema.json');
        const { result } = renderHook(() => useFileLoad());

        await act(async () => {
            await result.current.load();
        });

        // resolveResource は呼ばれない
        expect(resolveResource).not.toHaveBeenCalled();
        expect(readTextFile).toHaveBeenCalledWith('/user/saved/schema.json');
        expect(useStore.getState().nodes).toHaveLength(1);
    });
});

describe('useFileLoad: ファイル読み込み失敗', () => {
    it('読み込みに失敗してもストアの既存データが壊れないこと', async () => {
        // 読み込み失敗をシミュレート
        vi.mocked(readTextFile).mockRejectedValueOnce(new Error('File not found'));
        useStore.setState({
            nodes: [{ id: 'existing', type: 'entity', position: { x: 0, y: 0 }, data: { label: 'Existing', typeDBType: 'entity', isAbstract: false } }],
            edges: [],
            narration: '',
        });

        const { result } = renderHook(() => useFileLoad());

        await act(async () => {
            await result.current.load();
        });

        // 既存データが保持されていること
        expect(useStore.getState().nodes).toHaveLength(1);
        expect(useStore.getState().nodes[0].id).toBe('existing');
    });
});

describe('useFileLoad: markClean 連携', () => {
    it('読み込み成功後に isDirty が false になること', async () => {
        useStore.getState().markDirty(); // 事前に dirty にする
        const { result } = renderHook(() => useFileLoad());

        await act(async () => { await result.current.load(); });

        expect(useStore.getState().isDirty).toBe(false);
    });

    it('読み込み失敗時は isDirty が変化しないこと', async () => {
        useStore.getState().markDirty();
        vi.mocked(readTextFile).mockRejectedValueOnce(new Error('File not found'));
        const { result } = renderHook(() => useFileLoad());

        await act(async () => { await result.current.load(); });

        expect(useStore.getState().isDirty).toBe(true);
    });
});

describe('useFileLoad: open()', () => {
    it('ダイアログでファイルを選択するとストアに展開されること', async () => {
        vi.mocked(mockOpenDialog).mockResolvedValue('/user/selected/schema.json');
        const { result } = renderHook(() => useFileLoad());

        await act(async () => {
            await result.current.open();
        });

        expect(mockOpenDialog).toHaveBeenCalled();
        expect(readTextFile).toHaveBeenCalledWith('/user/selected/schema.json');
        expect(useStore.getState().nodes).toHaveLength(1);
    });

    it('ダイアログをキャンセルしたとき何も起きないこと', async () => {
        vi.mocked(mockOpenDialog).mockResolvedValue(null);
        const { result } = renderHook(() => useFileLoad());

        await act(async () => {
            await result.current.open();
        });

        expect(readTextFile).not.toHaveBeenCalled();
        expect(useStore.getState().nodes).toHaveLength(0);
    });

    it('open() 成功後に vt-save-path が更新されること', async () => {
        vi.mocked(mockOpenDialog).mockResolvedValue('/user/selected/schema.json');
        const { result } = renderHook(() => useFileLoad());

        await act(async () => {
            await result.current.open();
        });

        expect(localStorage.getItem('vt-save-path')).toBe('/user/selected/schema.json');
    });

    it('open() 成功後に isDirty が false になること', async () => {
        vi.mocked(mockOpenDialog).mockResolvedValue('/user/selected/schema.json');
        useStore.getState().markDirty();
        const { result } = renderHook(() => useFileLoad());

        await act(async () => {
            await result.current.open();
        });

        expect(useStore.getState().isDirty).toBe(false);
    });
});

describe('useFileLoad: addRecent() 連携', () => {
    beforeEach(() => {
        useRecentProjectsStore.setState({ recents: [] });
        // name / description を含む JSON を返す
        vi.mocked(readTextFile).mockResolvedValue(JSON.stringify({
            version: 1,
            savedAt: '2026-04-17T00:00:00.000Z',
            name: 'HRシステム',
            description: '人事管理',
            nodes: [],
            edges: [],
            narration: '',
        }));
    });

    it('load() 成功時に addRecent() が呼ばれること', async () => {
        localStorage.setItem('vt-save-path', '/mock/hr.json');
        const { result } = renderHook(() => useFileLoad());
        await act(async () => { await result.current.load(); });

        const { recents } = useRecentProjectsStore.getState();
        expect(recents).toHaveLength(1);
        expect(recents[0].filePath).toBe('/mock/hr.json');
        expect(recents[0].name).toBe('HRシステム');
    });

    it('open() 成功時に addRecent() が呼ばれること', async () => {
        vi.mocked(mockOpenDialog).mockResolvedValue('/mock/selected.json');
        const { result } = renderHook(() => useFileLoad());
        await act(async () => { await result.current.open(); });

        const { recents } = useRecentProjectsStore.getState();
        expect(recents).toHaveLength(1);
        expect(recents[0].filePath).toBe('/mock/selected.json');
        expect(recents[0].name).toBe('HRシステム');
    });
});