export const PATTERNS = [
    {
        cubes: 0,
        nodes: 0,
    },
    {
        cubes: 100,
        nodes: 5,
    },
    {
        cubes: 260,
        nodes: 7,
    },
    {
        cubes: 700,
        nodes: 11,
    },
] as const;

export type Pattern = (typeof PATTERNS)[number]['nodes'];
export type Progress = Readonly<Record<string, Pattern>>;

export function isPattern(value: unknown): value is Pattern {
    return PATTERNS.some((pattern) => pattern.nodes === value);
}

export function cubeTotal(progress: Progress): number {
    return Object.values(progress).reduce<number>(
        (total, nodes) =>
            total +
            (PATTERNS.find((pattern) => pattern.nodes === nodes)?.cubes ?? 0),
        0
    );
}

export function countPatterns(
    progress: Progress,
    memberIds: readonly string[]
): Record<Pattern, number> {
    const counts: Record<Pattern, number> = {
        0: 0,
        5: 0,
        7: 0,
        11: 0,
    };
    for (const id of memberIds) {
        counts[progress[id] ?? 0]++;
    }
    return counts;
}
