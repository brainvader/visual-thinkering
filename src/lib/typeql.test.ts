// src/lib/typeql.test.ts
// generateTypeQL の failed test
// ← typeql.ts の生成ロジックが未修正なので複数件 fail する

import { describe, it, expect } from 'vitest';
import { generateTypeQL } from './typeql';
import type { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';
import type { TypeDBNodeData, TypeDBEdgeData } from '@/types';

// -----------------------------------------------
// テスト用ファクトリ
// -----------------------------------------------
const makeNode = (
    id: string,
    label: string,
    typeDBType: TypeDBNodeData['typeDBType']
): FlowNode<TypeDBNodeData> => ({
    id,
    data: { label, typeDBType, isAbstract: false },
    position: { x: 0, y: 0 },
    type: typeDBType,
});

const makeEdge = (
    id: string,
    source: string,
    target: string,
    role = ''
): FlowEdge<TypeDBEdgeData> => ({
    id,
    source,
    target,
    data: { role },
});

// -----------------------------------------------
// テストデータ
// -----------------------------------------------
const person = makeNode('n1', 'Person', 'entity');
const company = makeNode('n2', 'Company', 'entity');
const employment = makeNode('n3', 'Employment', 'relation');
const name = makeNode('n4', 'name', 'attribute');
const startDate = makeNode('n5', 'start-date', 'attribute');

describe('generateTypeQL: 基本構造', () => {
    it('グラフが空のとき空文字列を返すこと', () => {
        expect(generateTypeQL([], [])).toBe('');
    });

    it('define ブロックが1つにまとまること（各行に define が付かない）', () => {
        const result = generateTypeQL([person], []);
        // 先頭の "define" は1つだけ
        const defineCount = (result.match(/\bdefine\b/g) ?? []).length;
        expect(defineCount).toBe(1);
    });
});

describe('generateTypeQL: Entity 定義', () => {
    it('Entity ノードが sub entity として定義されること', () => {
        const result = generateTypeQL([person], []);
        expect(result).toContain('Person sub entity');
    });

    it('複数の Entity が定義されること', () => {
        const result = generateTypeQL([person, company], []);
        expect(result).toContain('Person sub entity');
        expect(result).toContain('Company sub entity');
    });
});

describe('generateTypeQL: Relation 定義', () => {
    it('Relation ノードが sub relation として定義されること', () => {
        const result = generateTypeQL([employment], []);
        expect(result).toContain('Employment sub relation');
    });

    it('ロール名ありエッジが relates として出力されること', () => {
        const edge = makeEdge('e1', 'n1', 'n3', 'employee');
        const result = generateTypeQL([person, employment], [edge]);
        expect(result).toContain('relates employee');
    });

    it('ロール名なしエッジは relates に含まれないこと', () => {
        const edge = makeEdge('e1', 'n1', 'n3', ''); // ロール名なし
        const result = generateTypeQL([person, employment], [edge]);
        expect(result).not.toContain('relates');
    });

    it('複数のロールが正しく relates を列挙すること', () => {
        const e1 = makeEdge('e1', 'n1', 'n3', 'employee');
        const e2 = makeEdge('e2', 'n2', 'n3', 'employer');
        const result = generateTypeQL([person, company, employment], [e1, e2]);
        expect(result).toContain('relates employee');
        expect(result).toContain('relates employer');
    });
});

describe('generateTypeQL: plays 定義', () => {
    it('Entity → Relation（ロール名あり）が plays として出力されること', () => {
        const edge = makeEdge('e1', 'n1', 'n3', 'employee');
        const result = generateTypeQL([person, employment], [edge]);
        // plays は Entity 定義の中に埋め込まれる
        expect(result).toContain('plays Employment:employee');
    });

    it('ロール名なしエッジは plays に含まれないこと', () => {
        const edge = makeEdge('e1', 'n1', 'n3', '');
        const result = generateTypeQL([person, employment], [edge]);
        expect(result).not.toContain('plays');
    });
});

describe('generateTypeQL: owns 定義', () => {
    it('Entity → Attribute エッジが owns として出力されること', () => {
        const edge = makeEdge('e1', 'n1', 'n4');
        const result = generateTypeQL([person, name], [edge]);
        expect(result).toContain('Person sub entity');
        expect(result).toContain('owns name');
    });

    it('Relation → Attribute エッジが owns として出力されること', () => {
        const edge = makeEdge('e1', 'n3', 'n5');
        const result = generateTypeQL([employment, startDate], [edge]);
        expect(result).toContain('Employment sub relation');
        expect(result).toContain('owns start-date');
    });
});

describe('generateTypeQL: Attribute 定義', () => {
    it('Attribute ノードが sub attribute として定義されること', () => {
        const result = generateTypeQL([name], []);
        expect(result).toContain('name sub attribute');
    });

    it('Attribute に value string がデフォルトで付くこと', () => {
        const result = generateTypeQL([name], []);
        expect(result).toContain('value string');
    });
});

describe('generateTypeQL: 警告情報', () => {
    it('ロール名未設定エッジがあるとき警告情報が返されること', () => {
        const edge = makeEdge('e1', 'n1', 'n3', ''); // plays だがロール名なし
        const { warnings } = generateTypeQL(
            [person, employment],
            [edge],
            { includeWarnings: true }
        );
        expect(warnings.length).toBeGreaterThan(0);
    });

    it('ロール名が全て設定されているとき警告がないこと', () => {
        const edge = makeEdge('e1', 'n1', 'n3', 'employee');
        const { warnings } = generateTypeQL(
            [person, employment],
            [edge],
            { includeWarnings: true }
        );
        expect(warnings).toHaveLength(0);
    });

    it('ロール名が TypeQL キーワードと同名のとき警告が返されること', () => {
        const edge = makeEdge('e1', 'n1', 'n3', 'plays'); // "plays" はキーワード
        const { warnings } = generateTypeQL(
            [person, employment],
            [edge],
            { includeWarnings: true }
        );
        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings[0].message).toContain('TypeQL のキーワード');
    });

    it('キーワードと同名でも TypeQL 自体は生成されること', () => {
        const edge = makeEdge('e1', 'n1', 'n3', 'plays');
        const { typeql } = generateTypeQL(
            [person, employment],
            [edge],
            { includeWarnings: true }
        );
        // 警告はあるが TypeQL は生成される（Employment は大文字始まり）
        expect(typeql).toContain('plays Employment:plays');
    });
});

describe('generateTypeQL: 出力順序', () => {
    it('Attribute が Entity より先に定義されること', () => {
        const edge = makeEdge('e1', 'n1', 'n4'); // Person owns name
        const result = generateTypeQL([person, name], [edge]);
        const attrPos = result.indexOf('name sub attribute');
        const entityPos = result.indexOf('Person sub entity');
        expect(attrPos).toBeLessThan(entityPos);
    });

    it('Attribute が Relation より先に定義されること', () => {
        const edge = makeEdge('e1', 'n3', 'n5'); // Employment owns start-date
        const result = generateTypeQL([employment, startDate], [edge]);
        const attrPos = result.indexOf('start-date sub attribute');
        const relationPos = result.indexOf('Employment sub relation');
        expect(attrPos).toBeLessThan(relationPos);
    });

    it('Entity + Relation + Attribute の複合グラフが正しく出力されること', () => {
        const e1 = makeEdge('e1', 'n1', 'n3', 'employee'); // Person plays Employment
        const e2 = makeEdge('e2', 'n2', 'n3', 'employer'); // Company plays Employment
        const e3 = makeEdge('e3', 'n1', 'n4');             // Person owns name
        const e4 = makeEdge('e4', 'n3', 'n5');             // Employment owns start-date

        const result = generateTypeQL(
            [person, company, employment, name, startDate],
            [e1, e2, e3, e4]
        );

        expect(result).toContain('define');
        expect(result).toContain('Person sub entity');
        expect(result).toContain('owns name');
        expect(result).toContain('plays Employment:employee');
        expect(result).toContain('Company sub entity');
        expect(result).toContain('plays Employment:employer');
        expect(result).toContain('Employment sub relation');
        expect(result).toContain('relates employee');
        expect(result).toContain('relates employer');
        expect(result).toContain('owns start-date');
        expect(result).toContain('name sub attribute');
        expect(result).toContain('start-date sub attribute');
        expect(result).toContain('value string');
    });
});