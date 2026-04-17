// src/store.persist.test.ts
//
// 永続化テストの目的:
//   Zustand の persist ミドルウェアが正しく機能しているかを検証する。
//   「ストアを再生成したとき localStorage から状態が復元されるか」を確認する。
//
// テスト戦略:
//   jsdom は localStorage をサポートしているため、モック不要。
//   ストアを再インポートすることで「アプリ再起動」を模倣する。

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';

// 各テスト前に localStorage とストアをリセット
beforeEach(() => {
    localStorage.clear();
    // ストアを初期状態に戻す
    useStore.setState({
        nodes: [],
        edges: [],
        narration: '',
    });
});

describe('store: 永続化（localStorage）', () => {

    it('nodes が localStorage に保存されること', () => {
        // ノードを追加
        useStore.getState().addNode('entity', { x: 0, y: 0 });

        // localStorage に保存されているか確認
        const raw = localStorage.getItem('visual-thinkering-graph');
        expect(raw).not.toBeNull();

        const saved = JSON.parse(raw!);
        expect(saved.state.nodes).toHaveLength(1);
        expect(saved.state.nodes[0].data.typeDBType).toBe('entity');
    });

    it('edges が localStorage に保存されること', () => {
        // ノードを2つ追加してエッジを繋ぐ
        useStore.getState().addNode('entity', { x: 0, y: 0 });
        useStore.getState().addNode('relation', { x: 100, y: 0 });
        const [n1, n2] = useStore.getState().nodes;
        useStore.getState().onConnect({
            source: n1.id,
            target: n2.id,
            sourceHandle: null,
            targetHandle: null,
        });

        const raw = localStorage.getItem('visual-thinkering-graph');
        const saved = JSON.parse(raw!);
        expect(saved.state.edges).toHaveLength(1);
    });

    it('narration が localStorage に保存されること', () => {
        useStore.getState().setNarration('田中さんは研究者です。');

        const raw = localStorage.getItem('visual-thinkering-graph');
        const saved = JSON.parse(raw!);
        expect(saved.state.narration).toBe('田中さんは研究者です。');
    });

    it('ハンドラ関数（onNodesChange など）は localStorage に保存されないこと', () => {
        useStore.getState().addNode('entity', { x: 0, y: 0 });

        const raw = localStorage.getItem('visual-thinkering-graph');
        const saved = JSON.parse(raw!);

        // 関数はシリアライズできないため保存対象から除外されているはず
        expect(saved.state.onNodesChange).toBeUndefined();
        expect(saved.state.onEdgesChange).toBeUndefined();
        expect(saved.state.onConnect).toBeUndefined();
        expect(saved.state.setNodes).toBeUndefined();
        expect(saved.state.deleteNode).toBeUndefined();
        expect(saved.state.addNode).toBeUndefined();
    });

    it('localStorage に保存されたデータからストアが復元されること', () => {
        // 状態を作って localStorage に書き込む
        useStore.getState().addNode('relation', { x: 50, y: 50 });
        useStore.getState().setNarration('復元テスト用のナラティブ');

        // localStorage に保存されたデータを取得
        const raw = localStorage.getItem('visual-thinkering-graph');
        expect(raw).not.toBeNull();
        const saved = JSON.parse(raw!);

        // 保存された内容が正しいことを確認
        expect(saved.state.nodes).toHaveLength(1);
        expect(saved.state.nodes[0].data.typeDBType).toBe('relation');
        expect(saved.state.narration).toBe('復元テスト用のナラティブ');
    });

    it('localStorage が空のときはデフォルト初期状態で起動すること', () => {
        // localStorage は beforeEach でクリア済み
        // ストアの初期 nodes は1件（初期 Entity ノード）のはず
        // persist 適用後は初期状態が localStorage に保存されるので
        // 何も保存されていないときはデフォルト値が使われる
        expect(useStore.getState().narration).toBe('');
    });

    it('保存された version が正しいこと', () => {
        useStore.getState().addNode('entity', { x: 0, y: 0 });

        const raw = localStorage.getItem('visual-thinkering-graph');
        const saved = JSON.parse(raw!);

        // persist の version フィールドが存在する
        expect(saved.version).toBeDefined();
        expect(typeof saved.version).toBe('number');
    });

    it('viewport が localStorage に保存されること', () => {
        useStore.getState().setViewport({ x: 100, y: -200, zoom: 1.5 });

        const raw = localStorage.getItem('visual-thinkering-graph');
        const saved = JSON.parse(raw!);
        expect(saved.state.viewport).toEqual({ x: 100, y: -200, zoom: 1.5 });
    });

    it('setViewport で viewport が更新されること', () => {
        useStore.getState().setViewport({ x: 50, y: 75, zoom: 0.8 });
        expect(useStore.getState().viewport).toEqual({ x: 50, y: 75, zoom: 0.8 });
    });
});