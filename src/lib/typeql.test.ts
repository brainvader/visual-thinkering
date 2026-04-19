// src/lib/typeql.test.ts

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
    typeDBType: TypeDBNodeData['typeDBType'],
    extra: Partial<TypeDBNodeData> = {}
): FlowNode<TypeDBNodeData> => ({
    id,
    data: { label, typeDBType, isAbstract: false, ...extra },
    position: { x: 0, y: 0 },
    type: typeDBType,
});

const makeEdge = (
    id: string,
    source: string,
    target: string,
    role = '',
    edgeType: TypeDBEdgeData['edgeType'] = 'role'
): FlowEdge<TypeDBEdgeData> => ({
    id,
    source,
    target,
    data: { role, edgeType },
});

// sub エッジ用ヘルパー
const makeSubEdge = (id: string, source: string, target: string): FlowEdge<TypeDBEdgeData> =>
    makeEdge(id, source, target, '', 'sub');

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
        const edge = makeEdge('e1', 'n1', 'n3', '');
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

    it('valueType 未指定のとき value string がデフォルトで付くこと', () => {
        const result = generateTypeQL([name], []);
        expect(result).toContain('value string');
    });

    it('valueType が long のとき value long が出力されること', () => {
        const longAttr = makeNode('n10', 'age', 'attribute', { valueType: 'long' });
        const result = generateTypeQL([longAttr], []);
        expect(result).toContain('value long');
        expect(result).not.toContain('value string');
    });

    it('valueType が double のとき value double が出力されること', () => {
        const doubleAttr = makeNode('n11', 'score', 'attribute', { valueType: 'double' });
        const result = generateTypeQL([doubleAttr], []);
        expect(result).toContain('value double');
    });

    it('valueType が boolean のとき value boolean が出力されること', () => {
        const boolAttr = makeNode('n12', 'is-active', 'attribute', { valueType: 'boolean' });
        const result = generateTypeQL([boolAttr], []);
        expect(result).toContain('value boolean');
    });

    it('valueType が datetime のとき value datetime が出力されること', () => {
        const dtAttr = makeNode('n13', 'created-at', 'attribute', { valueType: 'datetime' });
        const result = generateTypeQL([dtAttr], []);
        expect(result).toContain('value datetime');
    });

    it('valueType が string のとき value string が出力されること', () => {
        const strAttr = makeNode('n14', 'title', 'attribute', { valueType: 'string' });
        const result = generateTypeQL([strAttr], []);
        expect(result).toContain('value string');
    });

    it('複数の Attribute が異なる value 型を持てること', () => {
        const longAttr = makeNode('n10', 'age', 'attribute', { valueType: 'long' });
        const dtAttr = makeNode('n11', 'birthday', 'attribute', { valueType: 'datetime' });
        const result = generateTypeQL([longAttr, dtAttr], []);
        expect(result).toContain('age sub attribute, value long;');
        expect(result).toContain('birthday sub attribute, value datetime;');
    });
});

describe('generateTypeQL: abstract フラグ', () => {
    it('isAbstract: true の Entity に ", abstract" が含まれること', () => {
        const abstractPerson = makeNode('n1', 'Person', 'entity', { isAbstract: true });
        const result = generateTypeQL([abstractPerson], []);
        expect(result).toContain('Person sub entity, abstract');
    });

    it('isAbstract: false の Entity に abstract が含まれないこと', () => {
        const result = generateTypeQL([person], []);
        expect(result).not.toContain('abstract');
    });

    it('isAbstract: true の Relation に ", abstract" が含まれること', () => {
        const abstractRel = makeNode('n3', 'Employment', 'relation', { isAbstract: true });
        const result = generateTypeQL([abstractRel], []);
        expect(result).toContain('Employment sub relation, abstract');
    });

    it('isAbstract: true の Attribute に ", abstract" が含まれること', () => {
        const abstractAttr = makeNode('n4', 'name', 'attribute', { isAbstract: true });
        const result = generateTypeQL([abstractAttr], []);
        expect(result).toContain('name sub attribute, abstract');
    });
});

describe('generateTypeQL: sub エッジ（継承）', () => {
    it('Entity→Entity の sub エッジが "B sub A;" として出力されること', () => {
        const abstractPerson = makeNode('n1', 'Person', 'entity', { isAbstract: true });
        const employee = makeNode('n2', 'Employee', 'entity');
        const edge = makeSubEdge('e1', 'n2', 'n1'); // Employee sub Person
        const result = generateTypeQL([abstractPerson, employee], [edge]);
        expect(result).toContain('Employee sub Person');
    });

    it('Relation→Relation の sub エッジが "B sub A;" として出力されること', () => {
        const baseRel = makeNode('n1', 'BaseRelation', 'relation', { isAbstract: true });
        const childRel = makeNode('n2', 'ChildRelation', 'relation');
        const edge = makeSubEdge('e1', 'n2', 'n1');
        const result = generateTypeQL([baseRel, childRel], [edge]);
        expect(result).toContain('ChildRelation sub BaseRelation');
    });

    it('Attribute→Attribute の sub エッジが "B sub A;" として出力されること', () => {
        const baseName = makeNode('n1', 'abstract-name', 'attribute', { isAbstract: true });
        const childName = makeNode('n2', 'full-name', 'attribute');
        const edge = makeSubEdge('e1', 'n2', 'n1');
        const result = generateTypeQL([baseName, childName], [edge]);
        expect(result).toContain('full-name sub abstract-name');
    });

    it('sub エッジのとき親ノードが子ノードより先に出力されること', () => {
        const abstractPerson = makeNode('n1', 'Person', 'entity', { isAbstract: true });
        const employee = makeNode('n2', 'Employee', 'entity');
        const edge = makeSubEdge('e1', 'n2', 'n1');
        const result = generateTypeQL([employee, abstractPerson], [edge]);
        // Person（親）が Employee（子）より先に出力される
        expect(result.indexOf('Person sub entity')).toBeLessThan(result.indexOf('Employee sub Person'));
    });

    it('sub でないエッジ（role）は通常通り plays/owns として出力されること', () => {
        const edge = makeEdge('e1', 'n1', 'n3', 'employee', 'role');
        const result = generateTypeQL([person, employment], [edge]);
        expect(result).toContain('plays Employment:employee');
        expect(result).not.toContain('Person sub Employment');
    });
});

describe('generateTypeQL: 警告情報', () => {
    it('ロール名未設定エッジがあるとき警告情報が返されること', () => {
        const edge = makeEdge('e1', 'n1', 'n3', '');
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
        const edge = makeEdge('e1', 'n1', 'n3', 'plays');
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
        expect(typeql).toContain('plays Employment:plays');
    });

    it('循環継承（A sub B, B sub A）のとき警告が返されること', () => {
        const nodeA = makeNode('n1', 'A', 'entity');
        const nodeB = makeNode('n2', 'B', 'entity');
        const e1 = makeSubEdge('e1', 'n1', 'n2'); // A sub B
        const e2 = makeSubEdge('e2', 'n2', 'n1'); // B sub A
        const { warnings } = generateTypeQL([nodeA, nodeB], [e1, e2], { includeWarnings: true });
        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings[0].message).toContain('循環');
    });
});

describe('generateTypeQL: 出力順序', () => {
    it('Attribute が Entity より先に定義されること', () => {
        const edge = makeEdge('e1', 'n1', 'n4');
        const result = generateTypeQL([person, name], [edge]);
        expect(result.indexOf('name sub attribute')).toBeLessThan(result.indexOf('Person sub entity'));
    });

    it('Attribute が Relation より先に定義されること', () => {
        const edge = makeEdge('e1', 'n3', 'n5');
        const result = generateTypeQL([employment, startDate], [edge]);
        expect(result.indexOf('start-date sub attribute')).toBeLessThan(result.indexOf('Employment sub relation'));
    });

    it('Entity + Relation + Attribute の複合グラフが正しく出力されること', () => {
        const e1 = makeEdge('e1', 'n1', 'n3', 'employee');
        const e2 = makeEdge('e2', 'n2', 'n3', 'employer');
        const e3 = makeEdge('e3', 'n1', 'n4');
        const e4 = makeEdge('e4', 'n3', 'n5');

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