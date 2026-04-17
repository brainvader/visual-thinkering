// src/components/UnsavedDialog.test.tsx
//
// UnsavedDialog コンポーネントのテスト（Red → Green）
// 3ボタンの表示と各コールバックの呼び出しを検証する

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnsavedDialog } from './UnsavedDialog';

const defaultProps = {
    open: true,
    onSaveAndClose: vi.fn(),
    onDiscardAndClose: vi.fn(),
    onCancel: vi.fn(),
};

describe('UnsavedDialog: 表示', () => {
    it('open=true のとき表示されること', () => {
        render(<UnsavedDialog {...defaultProps} open={true} />);
        expect(screen.getByText('未保存の変更があります')).toBeInTheDocument();
    });

    it('open=false のとき表示されないこと', () => {
        render(<UnsavedDialog {...defaultProps} open={false} />);
        expect(screen.queryByText('未保存の変更があります')).not.toBeInTheDocument();
    });

    it('3つのボタンが表示されること', () => {
        render(<UnsavedDialog {...defaultProps} />);
        expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '破棄して閉じる' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '保存して閉じる' })).toBeInTheDocument();
    });
});

describe('UnsavedDialog: ボタン操作', () => {
    it('「保存して閉じる」クリックで onSaveAndClose が呼ばれること', async () => {
        const onSaveAndClose = vi.fn();
        render(<UnsavedDialog {...defaultProps} onSaveAndClose={onSaveAndClose} />);

        await userEvent.click(screen.getByRole('button', { name: '保存して閉じる' }));

        expect(onSaveAndClose).toHaveBeenCalledOnce();
    });

    it('「破棄して閉じる」クリックで onDiscardAndClose が呼ばれること', async () => {
        const onDiscardAndClose = vi.fn();
        render(<UnsavedDialog {...defaultProps} onDiscardAndClose={onDiscardAndClose} />);

        await userEvent.click(screen.getByRole('button', { name: '破棄して閉じる' }));

        expect(onDiscardAndClose).toHaveBeenCalledOnce();
    });

    it('「キャンセル」クリックで onCancel が呼ばれること', async () => {
        const onCancel = vi.fn();
        render(<UnsavedDialog {...defaultProps} onCancel={onCancel} />);

        await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }));

        expect(onCancel).toHaveBeenCalledOnce();
    });
});