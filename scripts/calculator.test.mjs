import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
    GRID_PITCH,
    nodePosition,
    nodeSize,
} from '../src/lib/board-geometry.ts';
import {
    boardCubes,
    boardNodeCount,
    countPatterns,
    cubeTotal,
    isPattern,
    normalizeBoard,
    PATTERNS,
    presetOf,
    toggleNode,
    unlockedIds,
} from '../src/lib/calculator.ts';
import { applyGenerationPreset } from '../src/lib/generation-presets.ts';
import { groupMembers } from '../src/lib/member-groups.ts';

const data = JSON.parse(
    readFileSync(new URL('../src/board-data.json', import.meta.url), 'utf8')
);

test('presets match the source small-cube costs and exclude Green Hexa', () => {
    for (const pattern of PATTERNS) {
        const cost = data.nodes
            .filter((node) => pattern.ids.includes(node.id))
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
    assert.equal(cubeTotal({ sora: 11 }), 860);
});

test('every preset forms a connected branch from the root', () => {
    for (const pattern of PATTERNS) {
        const remaining = [
            ...data.nodes.filter((node) => pattern.ids.includes(node.id)),
        ];
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
    assert.equal(cubeTotal(progress), 46440);
    progress[ids[0]] = 5;
    progress[ids[1]] = 7;
    progress[ids[2]] = 0;
    assert.equal(cubeTotal(progress), 44220);
    assert.deepEqual(countPatterns(progress, ids), {
        0: 1,
        5: 1,
        7: 1,
        9: 0,
        11: 51,
        custom: 0,
    });
    assert.deepEqual(countPatterns({}, ids), {
        0: 54,
        5: 0,
        7: 0,
        9: 0,
        11: 0,
        custom: 0,
    });
});

test('saved presets accept only the supported numeric values', () => {
    for (const value of [0, 5, 7, 9, 11]) assert.equal(isPattern(value), true);
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

test('9 and 11 continue down the center after the side-inclusive first seven', () => {
    assert.deepEqual(unlockedIds(9), [...unlockedIds(7), 'G-008', 'G-011']);
    assert.deepEqual(unlockedIds(11), [...unlockedIds(9), 'G-018', 'G-021']);
    assert.ok(!unlockedIds(9).includes('G-009'));
    assert.ok(!unlockedIds(11).includes('G-010'));
    assert.equal(boardCubes(9), 540);
    assert.equal(boardCubes(11), 860);
});

test('custom boards count all 25 nodes, excluding every Green Hexa', () => {
    const all = data.nodes.map((node) => node.id);
    assert.equal(all.length, 25);
    assert.equal(boardCubes(all), 3020);
    const custom = toggleNode(0, 'G-021');
    assert.equal(boardNodeCount(custom), 9);
    assert.equal(presetOf(custom), 'custom');
    assert.equal(boardCubes(custom), 820);
    assert.equal(boardCubes(toggleNode(0, 'G-014')), 900);
});

test('node removal prunes disconnected nodes but preserves alternate routes', () => {
    const all = data.nodes.map((node) => node.id);
    assert.equal(toggleNode(all, 'G-006'), 5);
    const alternate = toggleNode(all, 'G-011');
    assert.equal(boardNodeCount(alternate), 24);
    assert.ok(unlockedIds(alternate).includes('G-021'));
    assert.equal(toggleNode(0, 'invalid'), 0);
});

test('saved custom boards are sanitized, connected, and classified by shape', () => {
    assert.equal(normalizeBoard(9), 9);
    assert.equal(normalizeBoard([...unlockedIds(11)]), 11);
    assert.equal(normalizeBoard(['G-021']), 0);
    assert.deepEqual(normalizeBoard(['G-001', 'G-001', 'G-021']), ['G-001']);
    assert.equal(normalizeBoard(['not-a-node']), undefined);
    assert.equal(normalizeBoard(['G-001', 22]), undefined);
    assert.equal(presetOf(toggleNode(0, 'G-021')), 'custom');
});

test('generation optimal uses three 9s and adds one 11 for a four-person generation', () => {
    const groups = groupMembers(data.members);
    const three = groups.find((group) => group.title === 'JP Gen 2');
    const four = groups.find((group) => group.title === 'JP Gen 1');
    const choice = { eleven: four.members[2].id, keep: four.members[0].id };
    const result = applyGenerationPreset(
        { unrelated: 5 },
        [three, four],
        'optimal',
        { [four.key]: choice }
    );
    for (const member of three.members) assert.equal(result[member.id], 9);
    for (const member of four.members)
        assert.equal(result[member.id], member.id === choice.eleven ? 11 : 9);
    assert.equal(result.unrelated, 5);
    assert.equal(cubeTotal(result), 1620 + 2480 + 100);
});

test('five-person optimal preserves the fifth board; plus5 and plus7 set it explicitly', () => {
    const group = groupMembers(data.members).find(
        (group) => group.title === 'JP Gen 0'
    );
    const eleven = group.members[1].id;
    const keep = group.members[4].id;
    const custom = toggleNode(0, 'G-021');
    const progress = { [keep]: custom };
    const choices = { [group.key]: { eleven, keep } };
    const optimal = applyGenerationPreset(
        progress,
        [group],
        'optimal',
        choices
    );
    assert.equal(optimal[keep], custom);
    assert.equal(optimal[eleven], 11);
    assert.equal(cubeTotal(optimal), 2480 + 820);
    assert.equal(
        cubeTotal(applyGenerationPreset(progress, [group], 'plus5', choices)),
        2580
    );
    assert.equal(
        cubeTotal(applyGenerationPreset(progress, [group], 'plus7', choices)),
        2740
    );
    const corrected = applyGenerationPreset({}, [group], 'plus7', {
        [group.key]: { eleven, keep: eleven },
    });
    assert.equal(corrected[eleven], 11);
    assert.equal(cubeTotal(corrected), 2740);
});

test('whole-roster generation batches assign every member once', () => {
    const generations = groupMembers(data.members);
    assert.equal(
        cubeTotal(applyGenerationPreset({}, generations, 'optimal')),
        30320
    );
    assert.equal(
        cubeTotal(applyGenerationPreset({}, generations, 'plus5')),
        30520
    );
    assert.equal(
        cubeTotal(applyGenerationPreset({}, generations, 'plus7')),
        30840
    );
});

test('the default five-person mix keeps the fifth board even if it already has 11 nodes', () => {
    const group = groupMembers(data.members).find(
        (group) => group.title === 'JP Gen 0'
    );
    const fifth = group.members[4].id;
    const fourth = group.members[3].id;
    const result = applyGenerationPreset({ [fifth]: 11 }, [group], 'optimal');
    assert.equal(result[fifth], 11);
    assert.equal(result[fourth], 11);
    assert.equal(cubeTotal(result), 3340);
});
