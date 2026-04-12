// src/hooks/useOwnershipBounds.test.ts
// ← src/hooks/useOwnershipBounds.ts が未実装なので全件 fail する

import { describe, it, expect } from 'vitest';
import { calculateOwnershipBounds } from './useOwnershipBounds';
import type { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';
import type { TypeDBNodeData, TypeDBEdgeData } from '@/types';

// -----------------------------------------------
// テスト用ファクトリ
// -----------------------------------------------
const makeNode = (
    id: string,
    typeDBType: TypeDBNodeData['typeDBType'],
    x: number,
    y: number,
    width = 120,
    height = 48
): FlowNode<TypeDBNodeData> => ({
    id,
    data: { label: id, typeDBType, isAbstract: false },
    position: { x, y },
    type: typeDBType,
    measured: { width, height },
});

const makeEdge = (
    source: string,
    target: string,
    role = ''
): FlowEdge<TypeDBEdgeData> => ({
    id: `${source}-${target}`,
    source,
    target,
    data: { role },
});

const PADDING = 20;

// -----------------------------------------------
// テスト
// -----------------------------------------------
describe('calculateOwnershipBounds', () => {
    it('selectedNode が null のとき null を返すこと', () => {
        expect(calculateOwnershipBounds(null, [], [])).toBeNull();
    });

    it('selectedNode が attribute のとき null を返すこと', () => {
        const attr = makeNode('a1', 'attribute', 0, 0);
        expect(calculateOwnershipBounds(attr, [attr], [])).toBeNull();
    });

    it('owns エッジが存在しないとき null を返すこと', () => {
        const entity = makeNode('e1', 'entity', 0, 0);
        const relation = makeNode('r1', 'relation', 100, 0);
        // entity → relation のエッジ（plays）はあるが owns はない
        const edges = [makeEdge('e1', 'r1')];
        expect(calculateOwnershipBounds(entity, [entity, relation], edges)).toBeNull();
    });

    it('owns エッジが1件あるとき正しいバウンディングボックスを返すこと', () => {
        const entity = makeNode('e1', 'entity', 100, 100, 120, 48);
        const attr = makeNode('a1', 'attribute', 300, 200, 100, 48);
        const edges = [makeEdge('e1', 'a1')];
        const nodes = [entity, attr];

        const result = calculateOwnershipBounds(entity, nodes, edges);
        expect(result).not.toBeNull();

        // 矩形の左上は min(x) - padding
        expect(result!.x).toBe(100 - PADDING);
        expect(result!.y).toBe(100 - PADDING);

        // 矩形の右下は max(x + width, y + height) + padding
        const maxX = Math.max(100 + 120, 300 + 100);
        const maxY = Math.max(100 + 48, 200 + 48);
        expect(result!.width).toBe(maxX - (100 - PADDING) + PADDING);
        expect(result!.height).toBe(maxY - (100 - PADDING) + PADDING);
    });

    it('owns エッジが複数あるとき全ノードを包む矩形を返すこと', () => {
        const entity = makeNode('e1', 'entity', 100, 100, 120, 48);
        const attr1 = makeNode('a1', 'attribute', 300, 50, 100, 48);
        const attr2 = makeNode('a2', 'attribute', 50, 300, 100, 48);
        const edges = [makeEdge('e1', 'a1'), makeEdge('e1', 'a2')];
        const nodes = [entity, attr1, attr2];

        const result = calculateOwnershipBounds(entity, nodes, edges);
        expect(result).not.toBeNull();

        // 最も左上のノードは attr2 の x=50, entity の y=100 より attr1 の y=50
        expect(result!.x).toBe(50 - PADDING);
        expect(result!.y).toBe(50 - PADDING);
    });

    it('padding が矩形に加算されること', () => {
        const entity = makeNode('e1', 'entity', 0, 0, 100, 48);
        const attr = makeNode('a1', 'attribute', 0, 0, 100, 48);
        const edges = [makeEdge('e1', 'a1')];

        const result = calculateOwnershipBounds(entity, [entity, attr], edges);
        expect(result!.x).toBe(-PADDING);
        expect(result!.y).toBe(-PADDING);
    });

    it('ノードが移動したとき矩形が再計算されること', () => {
        const entity = makeNode('e1', 'entity', 0, 0, 120, 48);
        const attr = makeNode('a1', 'attribute', 200, 0, 100, 48);
        const edges = [makeEdge('e1', 'a1')];

        const result1 = calculateOwnershipBounds(entity, [entity, attr], edges);

        // attr を近づける
        const movedAttr = makeNode('a1', 'attribute', 50, 0, 100, 48);
        const result2 = calculateOwnershipBounds(entity, [entity, movedAttr], edges);

        // 矩形が縮小している
        expect(result2!.width).toBeLessThan(result1!.width);
    });

    it('measured が undefined のときデフォルトサイズ（120x48）でフォールバックすること', () => {
        const entity: FlowNode<TypeDBNodeData> = {
            id: 'e1',
            data: { label: 'e1', typeDBType: 'entity', isAbstract: false },
            position: { x: 0, y: 0 },
            type: 'entity',
            // measured を意図的に未設定
        };
        const attr: FlowNode<TypeDBNodeData> = {
            id: 'a1',
            data: { label: 'a1', typeDBType: 'attribute', isAbstract: false },
            position: { x: 200, y: 0 },
            type: 'attribute',
        };
        const edges = [makeEdge('e1', 'a1')];

        // エラーにならずに結果を返すこと
        expect(() => {
            calculateOwnershipBounds(entity, [entity, attr], edges);
        }).not.toThrow();
    });
});