// src/lib/copyName.test.ts
//
// nextCopyName() のユニットテスト（Red → Green）

import { describe, it, expect } from 'vitest';
import { nextCopyName } from './copyName';

describe('nextCopyName: 基本動作', () => {
    it('既存に該当名がない場合は "baseName 001" を返すこと', () => {
        expect(nextCopyName('HR管理', ['別プロジェクト'])).toBe('HR管理 001');
    });

    it('existingNames が空配列の場合は "baseName 001" を返すこと', () => {
        expect(nextCopyName('HR管理', [])).toBe('HR管理 001');
    });

    it('"baseName 001" がある場合は "baseName 002" を返すこと', () => {
        expect(nextCopyName('HR管理', ['HR管理 001'])).toBe('HR管理 002');
    });

    it('"baseName 001" "baseName 002" がある場合は "baseName 003" を返すこと', () => {
        expect(nextCopyName('HR管理', ['HR管理 001', 'HR管理 002'])).toBe('HR管理 003');
    });
});

describe('nextCopyName: 番号の扱い', () => {
    it('番号が飛んでいる場合（001, 003）は最大値+1（004）を返すこと', () => {
        expect(nextCopyName('HR管理', ['HR管理 001', 'HR管理 003'])).toBe('HR管理 004');
    });

    it('3桁ゼロ埋めで返すこと', () => {
        const names = Array.from({ length: 9 }, (_, i) =>
            `HR管理 ${String(i + 1).padStart(3, '0')}`
        );
        expect(nextCopyName('HR管理', names)).toBe('HR管理 010');
    });
});

describe('nextCopyName: 無関係な名前の混在', () => {
    it('baseName と無関係な名前が混在していても正しく動作すること', () => {
        expect(nextCopyName('HR管理', ['HR管理 001', '別システム 001', '在庫管理'])).toBe('HR管理 002');
    });

    it('baseName を部分一致する別名が混在していても誤カウントしないこと', () => {
        // "HR管理システム 001" は "HR管理" のコピーではない
        expect(nextCopyName('HR管理', ['HR管理システム 001'])).toBe('HR管理 001');
    });
});