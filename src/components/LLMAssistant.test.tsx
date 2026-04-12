// src/components/LLMAssistant.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LLMAssistant } from './LLMAssistant';

describe('LLMAssistant', () => {
    it('初期状態で Send ボタンが disabled であること', () => {
        render(<LLMAssistant onSendInstruction={vi.fn()} />);
        expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('テキストを入力すると Send ボタンが有効になること', async () => {
        render(<LLMAssistant onSendInstruction={vi.fn()} />);
        await userEvent.type(screen.getByRole('textbox'), 'エンティティを抽出して');
        expect(screen.getByRole('button', { name: /send/i })).toBeEnabled();
    });

    it('Send ボタンをクリックすると onSendInstruction が呼ばれること', async () => {
        const mockSend = vi.fn();
        render(<LLMAssistant onSendInstruction={mockSend} />);
        await userEvent.type(screen.getByRole('textbox'), 'エンティティを抽出して');
        await userEvent.click(screen.getByRole('button', { name: /send/i }));
        expect(mockSend).toHaveBeenCalledWith('エンティティを抽出して');
    });

    it('送信後にテキストエリアがクリアされること', async () => {
        render(<LLMAssistant onSendInstruction={vi.fn()} />);
        const textarea = screen.getByRole('textbox');
        await userEvent.type(textarea, 'エンティティを抽出して');
        await userEvent.click(screen.getByRole('button', { name: /send/i }));
        expect(textarea).toHaveValue('');
    });

    it('⌘+Enter で送信できること', async () => {
        const mockSend = vi.fn();
        render(<LLMAssistant onSendInstruction={mockSend} />);
        const textarea = screen.getByRole('textbox');
        await userEvent.type(textarea, 'エンティティを抽出して');
        await userEvent.keyboard('{Meta>}{Enter}{/Meta}');
        expect(mockSend).toHaveBeenCalledWith('エンティティを抽出して');
    });

    it('Clear ボタンでテキストがリセットされること', async () => {
        render(<LLMAssistant onSendInstruction={vi.fn()} />);
        const textarea = screen.getByRole('textbox');
        await userEvent.type(textarea, 'エンティティを抽出して');
        await userEvent.click(screen.getByRole('button', { name: /clear/i }));
        expect(textarea).toHaveValue('');
    });
});