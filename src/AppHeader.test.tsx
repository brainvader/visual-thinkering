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