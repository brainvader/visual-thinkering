// src/store/recentProjectsStore.test.ts
// recentProjectsStore のユニットテスト（Red → Green）

import { describe, it, expect, beforeEach } from 'vitest';
import { useRecentProjectsStore } from './recentProjectsStore';

// 各テスト前にストアをリセット
beforeEach(() => {
    useRecentProjectsStore.setState({ recents: [] });
});

const makeEntry = (filePath: string) => ({
    filePath,
    name: `Project ${filePath}`,
    description: 'テスト用',
    lastOpenedAt: new Date().toISOString(),
});

describe('recentProjectsStore', () => {
    it('初期状態では recents が空であること', () => {
        const { recents } = useRecentProjectsStore.getState();
        expect(recents).toHaveLength(0);
    });

    it('addRecent でエントリが追加されること', () => {
        const { addRecent } = useRecentProjectsStore.getState();
        addRecent(makeEntry('/path/to/project.json'));
        expect(useRecentProjectsStore.getState().recents).toHaveLength(1);
    });

    it('同じ filePath を addRecent すると重複せず先頭に移動すること', () => {
        const { addRecent } = useRecentProjectsStore.getState();
        addRecent(makeEntry('/path/a.json'));
        addRecent(makeEntry('/path/b.json'));
        addRecent(makeEntry('/path/a.json')); // 重複
        const { recents } = useRecentProjectsStore.getState();
        expect(recents).toHaveLength(2);
        expect(recents[0].filePath).toBe('/path/a.json'); // 先頭に来ること
    });

    it('addRecent が11件目で古いものが除去され最大10件になること', () => {
        const { addRecent } = useRecentProjectsStore.getState();
        for (let i = 1; i <= 11; i++) {
            addRecent(makeEntry(`/path/${i}.json`));
        }
        expect(useRecentProjectsStore.getState().recents).toHaveLength(10);
    });

    it('最大10件超えのとき最も古いエントリが除去されること', () => {
        const { addRecent } = useRecentProjectsStore.getState();
        for (let i = 1; i <= 11; i++) {
            addRecent(makeEntry(`/path/${i}.json`));
        }
        const { recents } = useRecentProjectsStore.getState();
        // /path/1.json が最初に追加されたので除去される
        expect(recents.find(r => r.filePath === '/path/1.json')).toBeUndefined();
    });

    it('removeRecent で指定した filePath が除去されること', () => {
        const { addRecent, removeRecent } = useRecentProjectsStore.getState();
        addRecent(makeEntry('/path/a.json'));
        addRecent(makeEntry('/path/b.json'));
        removeRecent('/path/a.json');
        const { recents } = useRecentProjectsStore.getState();
        expect(recents).toHaveLength(1);
        expect(recents[0].filePath).toBe('/path/b.json');
    });

    it('存在しない filePath を removeRecent しても何も変わらないこと', () => {
        const { addRecent, removeRecent } = useRecentProjectsStore.getState();
        addRecent(makeEntry('/path/a.json'));
        removeRecent('/path/nonexistent.json');
        expect(useRecentProjectsStore.getState().recents).toHaveLength(1);
    });
});