import { unlockedIds } from './calculator.js';
import type { Board, Progress } from './calculator.js';
import type { Generation } from './member-groups.js';

function boardDifference(
    before: Board,
    after: Board
): { edits: number; changed: number } {
    const previous = new Set(unlockedIds(before));
    const next = new Set(unlockedIds(after));
    let edits = 0;
    for (const id of previous) {
        if (!next.has(id)) {
            edits++;
        }
    }
    for (const id of next) {
        if (!previous.has(id)) {
            edits++;
        }
    }
    return {
        edits,
        changed: edits === 0 ? 0 : 1,
    };
}

function generationPlan(
    progress: Progress,
    generation: Readonly<Generation>
): Progress {
    const { members } = generation;
    if (members.length === 3) {
        return Object.fromEntries(members.map((member) => [member.id, 9]));
    }
    const preferredEleven = members.at(3) ?? members[0];
    const elevenOrder = [
        preferredEleven,
        ...members.filter((member) => member.id !== preferredEleven.id),
    ];
    const preferredKeep = members.at(4) ?? members[0];
    const keepOrder =
        members.length === 5
            ? [
                  preferredKeep,
                  ...members.filter((member) => member.id !== preferredKeep.id),
              ]
            : [undefined];
    let best: Progress = {};
    let bestEdits = Infinity;
    let bestChanged = Infinity;
    for (const keep of keepOrder) {
        for (const eleven of elevenOrder) {
            if (keep?.id === eleven.id) {
                continue;
            }
            const plan: Record<string, Board> = {};
            let edits = 0;
            let changed = 0;
            for (const member of members) {
                let target: Board = member.id === eleven.id ? 11 : 9;
                if (member.id === keep?.id) {
                    target = progress[member.id] ?? 0;
                }
                plan[member.id] = target;
                const difference = boardDifference(
                    progress[member.id] ?? 0,
                    target
                );
                edits += difference.edits;
                changed += difference.changed;
            }
            if (!(
                edits < bestEdits ||
                (edits === bestEdits && changed < bestChanged)
            )) {
                continue;
            }

            best = plan;
            bestEdits = edits;
            bestChanged = changed;
        }
    }
    return best;
}

export function applyGenerationPreset(
    progress: Progress,
    generations: readonly Generation[]
): Progress {
    let next: Progress = { ...progress };
    for (const generation of generations) {
        if (generation.members.length < 3 || generation.members.length > 5) {
            continue;
        }
        next = {
            ...next,
            ...generationPlan(progress, generation),
        };
    }
    return next;
}
