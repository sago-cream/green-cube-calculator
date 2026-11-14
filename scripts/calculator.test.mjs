import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
    countPatterns,
    cubeTotal,
    isPattern,
    PATTERNS,
} from '../src/lib/calculator.ts';

const data = JSON.parse(
    readFileSync(new URL('../src/board-data.json', import.meta.url), 'utf8')
);

test('presets match the source small-cube costs and exclude Green Hexa', () => {
    for (const pattern of PATTERNS) {
        const cost = data.nodes
            .slice(0, pattern.nodes)
            .flatMap((node) => node.items)
            .filter((item) => item.id === 'item-skill_tree_allmember-1')
            .reduce((sum, item) => sum + item.qty, 0);
        assert.equal(pattern.cubes, cost);
    }
    assert.equal(
        data.nodes[10].items.find(
            (item) => item.id === 'item-skill_tree_allmember-2'
        ).qty,
        50
    );
    assert.equal(cubeTotal({ sora: 11 }), 700);
});

test('every preset forms a connected branch from the root', () => {
    for (const pattern of PATTERNS) {
        const remaining = [...data.nodes.slice(0, pattern.nodes)];
        const connected = [{ x: 0, y: 0 }];
        while (remaining.length > 0) {
            const index = remaining.findIndex((node) =>
                connected.some(
                    (parent) =>
                        Math.abs(node.x - parent.x) +
                            Math.abs(node.y - parent.y) ===
                        1
                )
            );
            assert.notEqual(
                index,
                -1,
                `${pattern.nodes} nodes must all connect to root`
            );
            connected.push(...remaining.splice(index, 1));
        }
    }
});

test('all 54 unique members contribute once; reassignment replaces their costs', () => {
    const ids = data.members.map((member) => member.id);
    assert.equal(new Set(ids).size, 54);
    const progress = Object.fromEntries(ids.map((id) => [id, 11]));
    assert.equal(cubeTotal(progress), 37800);
    progress[ids[0]] = 5;
    progress[ids[1]] = 7;
    progress[ids[2]] = 0;
    assert.equal(cubeTotal(progress), 36060);
    assert.deepEqual(countPatterns(progress, ids), {
        0: 1,
        5: 1,
        7: 1,
        11: 51,
    });
    assert.deepEqual(countPatterns({}, ids), { 0: 54, 5: 0, 7: 0, 11: 0 });
});

test('saved presets accept only the supported numeric values', () => {
    for (const value of [0, 5, 7, 11]) assert.equal(isPattern(value), true);
    for (const value of [-1, 1, 12, '5', null, undefined, {}, NaN])
        assert.equal(isPattern(value), false);
});
