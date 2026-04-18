// src/components/ProjectCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from './ProjectCard';

const baseProps = {
    filePath: '/path/to/project.json',
    name: 'HR管理システム',
    description: '人事管理のスキーマ設計',
    lastOpenedAt: '2026-04-17T00:00:00.000Z',
    onClick: vi.fn(),
    onDelete: vi.fn(),
};

describe('ProjectCard', () => {
    it('プロジェクト名が表示されること', () => {
        render(<ProjectCard {...baseProps} />);
        expect(screen.getByText('HR管理システム')).toBeInTheDocument();
    });

    it('概要が表示されること', () => {
        render(<ProjectCard {...baseProps} />);
        expect(screen.getByText('人事管理のスキーマ設計')).toBeInTheDocument();
    });

    it('カードをクリックすると onClick が呼ばれること', async () => {
        const onClick = vi.fn();
        render(<ProjectCard {...baseProps} onClick={onClick} />);
        await userEvent.click(screen.getByRole('button', { name: /HR管理システム/ }));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('削除ボタンをクリックすると onDelete が呼ばれること', async () => {
        const onDelete = vi.fn();
        render(<ProjectCard {...baseProps} onDelete={onDelete} />);
        await userEvent.click(screen.getByRole('button', { name: /削除/ }));
        expect(onDelete).toHaveBeenCalledOnce();
    });

    it('削除ボタンのクリックがカードの onClick に伝播しないこと', async () => {
        const onClick = vi.fn();
        const onDelete = vi.fn();
        render(<ProjectCard {...baseProps} onClick={onClick} onDelete={onDelete} />);
        await userEvent.click(screen.getByRole('button', { name: /削除/ }));
        expect(onClick).not.toHaveBeenCalled();
    });
});