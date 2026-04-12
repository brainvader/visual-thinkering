// src/store.edge-arrow.test.ts
// エッジの矢印マーカーに関する failed test
// ← onConnect が MarkerType.ArrowClosed を付与していないので fail する

import { describe, it, expect, beforeEach } from 'vitest';
import { MarkerType } from '@xyflow/react';
import { useStore } from './store';

beforeEach(() => {
    useStore.setState({
        nodes: [
            { id: 'n1', data: { label: 'Entity', typeDBType: 'entity' }, position: { x: 0, y: 0 }, type: 'entity' },
            { id: 'n2', data: { label: 'Relation', typeDBType: 'relation' }, position: { x: 100, y: 0 }, type: 'relation' },
        ],
        edges: [],
        narration: '',
    });
});

describe('store: onConnect でエッジに矢印が付くこと', () => {
    it('接続後のエッジに markerEnd が設定されること', () => {
        useStore.getState().onConnect({
            source: 'n1',
            target: 'n2',
            sourceHandle: null,
            targetHandle: null,
        });

        const edge = useStore.getState().edges[0];
        expect(edge.markerEnd).toBeDefined();
    });

    it('markerEnd の type が ArrowClosed であること', () => {
        useStore.getState().onConnect({
            source: 'n1',
            target: 'n2',
            sourceHandle: null,
            targetHandle: null,
        });

        const edge = useStore.getState().edges[0];
        const marker = edge.markerEnd as { type: MarkerType; width: number; height: number };
        expect(marker.type).toBe(MarkerType.ArrowClosed);
        expect(marker.width).toBe(20);
        expect(marker.height).toBe(20);
    });

    it('複数接続しても全エッジに markerEnd が付くこと', () => {
        useStore.setState({
            nodes: [
                { id: 'n1', data: { label: 'Entity', typeDBType: 'entity' }, position: { x: 0, y: 0 }, type: 'entity' },
                { id: 'n2', data: { label: 'Relation', typeDBType: 'relation' }, position: { x: 100, y: 0 }, type: 'relation' },
                { id: 'n3', data: { label: 'Attribute', typeDBType: 'attribute' }, position: { x: 200, y: 0 }, type: 'attribute' },
            ],
            edges: [],
            narration: '',
        });

        useStore.getState().onConnect({ source: 'n1', target: 'n2', sourceHandle: null, targetHandle: null });
        useStore.getState().onConnect({ source: 'n1', target: 'n3', sourceHandle: null, targetHandle: null });

        const edges = useStore.getState().edges;
        expect(edges).toHaveLength(2);
        edges.forEach((edge) => {
            expect(edge.markerEnd).toBeDefined();
        });
    });
});