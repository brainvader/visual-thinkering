// src/components/NarrationPanel.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NarrationPanel } from './NarrationPanel';
import { useStore } from '@/store';

beforeEach(() => {
    useStore.setState({ narration: '' });
});

describe('NarrationPanel', () => {
    it('ヘッダーに "USER NARRATION" が表示されること', () => {
        render(<NarrationPanel />);
        expect(screen.getByText(/user narration/i)).toBeInTheDocument();
    });

    it('テキストを入力するとストアの narration が更新されること', async () => {
        render(<NarrationPanel />);
        const textarea = screen.getByPlaceholderText(/ナラティブを入力/i);
        await userEvent.type(textarea, '田中さんは研究者です。');
        expect(useStore.getState().narration).toBe('田中さんは研究者です。');
    });

    it('文字数が 0 のときフッターが表示されないこと', () => {
        render(<NarrationPanel />);
        expect(screen.queryByText(/文字/)).toBeNull();
    });

    it('文字を入力すると文字数カウントが表示されること', async () => {
        render(<NarrationPanel />);
        const textarea = screen.getByPlaceholderText(/ナラティブを入力/i);
        await userEvent.type(textarea, 'abc');
        expect(screen.getByText(/3 文字/)).toBeInTheDocument();
    });
});