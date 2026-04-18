// src/components/AppHeader.test.tsx
//
// AppHeader コンポーネントのテスト

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from './AppHeader';

describe('AppHeader: 表示', () => {
    it('アプリ名が表示されること', () => {
        render(<AppHeader filePath={null} onSave={vi.fn()} />);
        expect(screen.getByText('visual-thinkering')).toBeInTheDocument();
    });

    it('filePath が null のとき「未保存」と表示されること', () => {
        render(<AppHeader filePath={null} onSave={vi.fn()} />);
        expect(screen.getByText('未保存')).toBeInTheDocument();
    });

    it('filePath があるときファイル名が表示されること', () => {
        render(<AppHeader filePath="/path/to/default.json" onSave={vi.fn()} />);
        expect(screen.getByText('default.json')).toBeInTheDocument();
    });
});

describe('AppHeader: 保存ボタン', () => {
    it('保存ボタンをクリックすると onSave が呼ばれること', async () => {
        const onSave = vi.fn();
        render(<AppHeader filePath={null} onSave={onSave} />);

        await userEvent.click(screen.getByRole('button', { name: /save/i }));

        expect(onSave).toHaveBeenCalledOnce();
    });
});

describe('AppHeader: 戻るボタン', () => {
    it('onBack が渡されたとき「← 一覧へ」ボタンが表示されること', () => {
        render(<AppHeader filePath={null} onSave={vi.fn()} onBack={vi.fn()} />);
        expect(screen.getByRole('button', { name: /一覧へ/ })).toBeInTheDocument();
    });

    it('onBack が渡されないとき「← 一覧へ」ボタンが表示されないこと', () => {
        render(<AppHeader filePath={null} onSave={vi.fn()} />);
        expect(screen.queryByRole('button', { name: /一覧へ/ })).not.toBeInTheDocument();
    });

    it('「← 一覧へ」ボタンをクリックすると onBack が呼ばれること', async () => {
        const onBack = vi.fn();
        render(<AppHeader filePath={null} onSave={vi.fn()} onBack={onBack} />);
        await userEvent.click(screen.getByRole('button', { name: /一覧へ/ }));
        expect(onBack).toHaveBeenCalledOnce();
    });
});