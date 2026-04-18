// src/components/AppHeader.test.tsx
//
// AppHeader コンポーネントのテスト
// Tooltip は jsdom 環境でポータルが動作しないため vi.mock で素通しにする

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from './AppHeader';

// Tooltip 系は jsdom 環境で動作しないため素通しコンポーネントに差し替える
vi.mock('@/components/ui/tooltip', () => ({
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipContent: () => null,
}));

describe('AppHeader: 表示', () => {
    it('アプリ名が表示されること', () => {
        render(<AppHeader filePath={null} onSave={vi.fn()} onSaveAs={vi.fn()} />);
        expect(screen.getByText('visual-thinkering')).toBeInTheDocument();
    });

    it('filePath が null のとき「未保存」と表示されること', () => {
        render(<AppHeader filePath={null} onSave={vi.fn()} onSaveAs={vi.fn()} />);
        expect(screen.getByText('未保存')).toBeInTheDocument();
    });

    it('filePath があるときファイル名が表示されること', () => {
        render(<AppHeader filePath="/path/to/default.json" onSave={vi.fn()} onSaveAs={vi.fn()} />);
        expect(screen.getByText('default.json')).toBeInTheDocument();
    });
});

describe('AppHeader: Save ボタン', () => {
    it('Save ボタンをクリックすると onSave が呼ばれること', async () => {
        const onSave = vi.fn();
        render(<AppHeader filePath={null} onSave={onSave} onSaveAs={vi.fn()} />);

        await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

        expect(onSave).toHaveBeenCalledOnce();
    });

    it('Save ボタンをクリックしても onSaveAs は呼ばれないこと', async () => {
        const onSaveAs = vi.fn();
        render(<AppHeader filePath={null} onSave={vi.fn()} onSaveAs={onSaveAs} />);

        await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

        expect(onSaveAs).not.toHaveBeenCalled();
    });
});

describe('AppHeader: Save As ボタン', () => {
    it('Save As ボタンが表示されること', () => {
        render(<AppHeader filePath={null} onSave={vi.fn()} onSaveAs={vi.fn()} />);
        expect(screen.getByRole('button', { name: /save as/i })).toBeInTheDocument();
    });

    it('Save As ボタンをクリックすると onSaveAs が呼ばれること', async () => {
        const onSaveAs = vi.fn();
        render(<AppHeader filePath={null} onSave={vi.fn()} onSaveAs={onSaveAs} />);

        await userEvent.click(screen.getByRole('button', { name: /save as/i }));

        expect(onSaveAs).toHaveBeenCalledOnce();
    });

    it('Save As ボタンをクリックしても onSave は呼ばれないこと', async () => {
        const onSave = vi.fn();
        render(<AppHeader filePath={null} onSave={onSave} onSaveAs={vi.fn()} />);

        await userEvent.click(screen.getByRole('button', { name: /save as/i }));

        expect(onSave).not.toHaveBeenCalled();
    });
});

describe('AppHeader: 戻るボタン', () => {
    it('onBack が渡されたとき「← 一覧へ」ボタンが表示されること', () => {
        render(<AppHeader filePath={null} onSave={vi.fn()} onSaveAs={vi.fn()} onBack={vi.fn()} />);
        expect(screen.getByRole('button', { name: /一覧へ/ })).toBeInTheDocument();
    });

    it('onBack が渡されないとき「← 一覧へ」ボタンが表示されないこと', () => {
        render(<AppHeader filePath={null} onSave={vi.fn()} onSaveAs={vi.fn()} />);
        expect(screen.queryByRole('button', { name: /一覧へ/ })).not.toBeInTheDocument();
    });

    it('「← 一覧へ」ボタンをクリックすると onBack が呼ばれること', async () => {
        const onBack = vi.fn();
        render(<AppHeader filePath={null} onSave={vi.fn()} onSaveAs={vi.fn()} onBack={onBack} />);
        await userEvent.click(screen.getByRole('button', { name: /一覧へ/ }));
        expect(onBack).toHaveBeenCalledOnce();
    });
});