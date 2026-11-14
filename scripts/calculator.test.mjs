import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
    GRID_PITCH,
    nodePosition,
    nodeSize,
} from '../src/lib/board-geometry.ts';
import {
    countPatterns,
    cubeTotal,
    isPattern,
    PATTERNS,
} from '../src/lib/calculator.ts';
import { groupMembers } from '../src/lib/member-groups.ts';

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

test('green nodes grow down on the same square grid as the source board', () => {
    const root = nodePosition(0, 0);
    const first = nodePosition(0, -1);
    assert.equal(first.y - root.y, GRID_PITCH);
    assert.equal(nodePosition(1, -2).x - nodePosition(0, -2).x, GRID_PITCH);
    assert.equal(nodePosition(0, -7).y - root.y, 7 * GRID_PITCH);
    assert.ok(Math.abs(nodeSize(2) / nodeSize(1) - 70 / 48) < 1e-10);
});

test('generation sections preserve all 54 members without double-counting Fubuki', () => {
    const groups = groupMembers(data.members);
    const ids = groups.flatMap((group) =>
        group.members.map((member) => member.id)
    );
    assert.equal(groups.length, 15);
    assert.equal(ids.length, 54);
    assert.equal(new Set(ids).size, 54);
    assert.ok(
        groups
            .find((group) => group.title === 'JP Gen 1')
            .members.some((member) => member.id === 'chr-00006')
    );
    assert.ok(
        !groups
            .find((group) => group.title === 'JP GAMERS')
            .members.some((member) => member.id === 'chr-00006')
    );
    assert.deepEqual(groupMembers([]), []);
});
