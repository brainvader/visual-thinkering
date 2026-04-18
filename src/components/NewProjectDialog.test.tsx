// src/components/NewProjectDialog.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewProjectDialog } from './NewProjectDialog';

const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSubmit: vi.fn(),
};

describe('NewProjectDialog', () => {
    it('open=true のとき表示されること', () => {
        render(<NewProjectDialog {...baseProps} />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('open=false のとき表示されないこと', () => {
        render(<NewProjectDialog {...baseProps} open={false} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('名前が空のとき作成ボタンが disabled であること', () => {
        render(<NewProjectDialog {...baseProps} />);
        expect(screen.getByRole('button', { name: /作成/ })).toBeDisabled();
    });

    it('名前を入力すると作成ボタンが有効になること', async () => {
        render(<NewProjectDialog {...baseProps} />);
        await userEvent.type(screen.getByLabelText(/プロジェクト名/), 'テスト');
        expect(screen.getByRole('button', { name: /作成/ })).toBeEnabled();
    });

    it('作成ボタンをクリックすると name と description で onSubmit が呼ばれること', async () => {
        const onSubmit = vi.fn();
        render(<NewProjectDialog {...baseProps} onSubmit={onSubmit} />);
        await userEvent.type(screen.getByLabelText(/プロジェクト名/), 'HRシステム');
        await userEvent.type(screen.getByLabelText(/概要/), '人事管理');
        await userEvent.click(screen.getByRole('button', { name: /作成/ }));
        expect(onSubmit).toHaveBeenCalledWith({ name: 'HRシステム', description: '人事管理' });
    });

    it('キャンセルボタンをクリックすると onOpenChange(false) が呼ばれること', async () => {
        const onOpenChange = vi.fn();
        render(<NewProjectDialog {...baseProps} onOpenChange={onOpenChange} />);
        await userEvent.click(screen.getByRole('button', { name: /キャンセル/ }));
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});