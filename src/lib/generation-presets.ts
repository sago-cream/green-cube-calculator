import type { Board, Progress } from './calculator.js';
import type { Generation } from './member-groups.js';

export type GenerationMode = 'optimal' | 'plus5' | 'plus7';
export interface GenerationChoice {
    readonly eleven: string;
    readonly keep: string;
}

export function defaultGenerationChoice(
    generation: Readonly<Generation>
): GenerationChoice {
    const eleven = (generation.members.at(3) ?? generation.members[0]).id;
    const keep = (generation.members.at(4) ?? generation.members[0]).id;
    return {
        eleven,
        keep,
    };
}

export function applyGenerationPreset(
    progress: Progress,
    generations: readonly Generation[],
    mode: GenerationMode,
    choices: Readonly<Record<string, GenerationChoice>> = {}
): Progress {
    const next: Record<string, Board> = { ...progress };
    for (const generation of generations) {
        if (generation.members.length < 3 || generation.members.length > 5) {
            continue;
        }
        if (generation.members.length === 3) {
            for (const member of generation.members) {
                next[member.id] = 9;
            }
            continue;
        }
        const choice =
            choices[generation.key] ?? defaultGenerationChoice(generation);
        const eleven = generation.members.some(
            (member) => member.id === choice.eleven
        )
            ? choice.eleven
            : generation.members[0].id;
        const candidates = generation.members.filter(
            (member) => member.id !== eleven
        );
        const keep = candidates.some((member) => member.id === choice.keep)
            ? choice.keep
            : (candidates.at(-1)?.id ?? eleven);
        for (const member of generation.members) {
            if (member.id === eleven) {
                next[member.id] = 11;
            } else if (generation.members.length === 5 && member.id === keep) {
                if (mode !== 'optimal') {
                    next[member.id] = mode === 'plus5' ? 5 : 7;
                }
            } else {
                next[member.id] = 9;
            }
        }
    }
    return next;
}
