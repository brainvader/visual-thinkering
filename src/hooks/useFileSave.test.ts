// src/hooks/useFileSave.test.ts
//
// useFileSave フックのテスト（Red → Green）
// Tauri API はブラウザ環境で動作しないため vi.mock で差し替える

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileSave } from './useFileSave';
import { useStore } from '@/store';

// Tauri fs / dialog プラグインをモック
vi.mock('@tauri-apps/plugin-fs', () => ({
    writeTextFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
    save: vi.fn().mockResolvedValue('/mock/path/default.json'),
}));

// モックへの参照を取得
const { writeTextFile } = await import('@tauri-apps/plugin-fs');
const { save: dialogSave } = await import('@tauri-apps/plugin-dialog');

beforeEach(() => {
    // localStorage と store をリセット
    localStorage.clear();
    useStore.setState({ nodes: [], edges: [], narration: '' });
    vi.clearAllMocks();
});

describe('useFileSave: 初回保存（パスなし）', () => {
    it('ダイアログが開き、選択したパスに writeTextFile が呼ばれること', async () => {
        const { result } = renderHook(() => useFileSave());

        await act(async () => {
            await result.current.save();
        });

        expect(dialogSave).toHaveBeenCalledOnce();
        expect(writeTextFile).toHaveBeenCalledOnce();
        expect(writeTextFile).toHaveBeenCalledWith(
            '/mock/path/default.json',
            expect.any(String)
        );
    });

    it('保存後にパスが localStorage に記録されること', async () => {
        const { result } = renderHook(() => useFileSave());

        await act(async () => {
            await result.current.save();
        });

        expect(localStorage.getItem('vt-save-path')).toBe('/mock/path/default.json');
    });

    it('ダイアログをキャンセルすると何も起きないこと', async () => {
        vi.mocked(dialogSave).mockResolvedValueOnce(null);
        const { result } = renderHook(() => useFileSave());

        await act(async () => {
            await result.current.save();
        });

        expect(writeTextFile).not.toHaveBeenCalled();
        expect(localStorage.getItem('vt-save-path')).toBeNull();
    });
});

describe('useFileSave: 2回目以降の保存（パスあり）', () => {
    it('ダイアログを開かずに同じパスへ上書きすること', async () => {
        // 既存パスを設定
        localStorage.setItem('vt-save-path', '/existing/path/schema.json');
        const { result } = renderHook(() => useFileSave());

        await act(async () => {
            await result.current.save();
        });

        expect(dialogSave).not.toHaveBeenCalled();
        expect(writeTextFile).toHaveBeenCalledWith(
            '/existing/path/schema.json',
            expect.any(String)
        );
    });
});

describe('useFileSave: 保存内容の検証', () => {
    it('保存JSONに nodes / edges / narration が含まれること', async () => {
        // ストアにデータをセット
        useStore.setState({
            nodes: [{ id: 'n1', type: 'entity', position: { x: 0, y: 0 }, data: { label: 'Person', typeDBType: 'entity', isAbstract: false } }],
            edges: [],
            narration: 'テストナラティブ',
        });

        const { result } = renderHook(() => useFileSave());

        await act(async () => {
            await result.current.save();
        });

        const written = vi.mocked(writeTextFile).mock.calls[0][1] as string;
        const parsed = JSON.parse(written);

        expect(parsed.nodes).toHaveLength(1);
        expect(parsed.edges).toHaveLength(0);
        expect(parsed.narration).toBe('テストナラティブ');
        expect(parsed.version).toBeDefined();
        expect(parsed.savedAt).toBeDefined();
    });
});

describe('useFileSave: filePath 状態', () => {
    it('初期状態では filePath が null であること', () => {
        const { result } = renderHook(() => useFileSave());
        expect(result.current.filePath).toBeNull();
    });

    it('既存パスがあれば初期値として読み込まれること', () => {
        localStorage.setItem('vt-save-path', '/existing/path/schema.json');
        const { result } = renderHook(() => useFileSave());
        expect(result.current.filePath).toBe('/existing/path/schema.json');
    });

    it('保存後に filePath が更新されること', async () => {
        const { result } = renderHook(() => useFileSave());
        expect(result.current.filePath).toBeNull();

        await act(async () => {
            await result.current.save();
        });

        expect(result.current.filePath).toBe('/mock/path/default.json');
    });
});