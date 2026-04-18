// src/pages/ProjectListPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProjectListPage } from './ProjectListPage';
import { useRecentProjectsStore } from '@/store/recentProjectsStore';

// Tauri ダイアログ・ファイル操作をモック
vi.mock('@tauri-apps/plugin-dialog', () => ({
    open: vi.fn(),
    save: vi.fn(),
}));
vi.mock('@tauri-apps/plugin-fs', () => ({
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
}));
vi.mock('@tauri-apps/api/path', () => ({
    resolveResource: vi.fn(),
}));

const renderPage = () =>
    render(
        <MemoryRouter>
            <ProjectListPage />
        </MemoryRouter>
    );

beforeEach(() => {
    useRecentProjectsStore.setState({ recents: [] });
    vi.clearAllMocks();
});

describe('ProjectListPage', () => {
    it('「新規プロジェクト」ボタンが表示されること', () => {
        renderPage();
        expect(screen.getByRole('button', { name: /新規プロジェクト/ })).toBeInTheDocument();
    });

    it('「ファイルを開く」ボタンが表示されること', () => {
        renderPage();
        expect(screen.getByRole('button', { name: /ファイルを開く/ })).toBeInTheDocument();
    });

    it('履歴が空のとき空状態メッセージが表示されること', () => {
        renderPage();
        expect(screen.getByText(/最近開いたプロジェクトはありません/)).toBeInTheDocument();
    });

    it('履歴があるとき ProjectCard が表示されること', () => {
        useRecentProjectsStore.setState({
            recents: [{
                filePath: '/path/hr.json',
                name: 'HRシステム',
                description: '人事管理',
                lastOpenedAt: '2026-04-17T00:00:00.000Z',
            }],
        });
        renderPage();
        expect(screen.getByText('HRシステム')).toBeInTheDocument();
    });

    it('「新規プロジェクト」ボタンをクリックすると NewProjectDialog が開くこと', async () => {
        renderPage();
        await userEvent.click(screen.getByRole('button', { name: /新規プロジェクト/ }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
});