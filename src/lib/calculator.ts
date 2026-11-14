import data from '../board-data.json' with { type: 'json' };

export const PATTERNS = [
    {
        cubes: 0,
        ids: [],
        nodes: 0,
    },
    {
        cubes: 100,
        ids: ['G-001', 'G-002', 'G-003', 'G-004', 'G-005'],
        nodes: 5,
    },
    {
        cubes: 260,
        ids: ['G-001', 'G-002', 'G-003', 'G-004', 'G-005', 'G-006', 'G-007'],
        nodes: 7,
    },
    {
        cubes: 540,
        ids: [
            'G-001',
            'G-002',
            'G-003',
            'G-004',
            'G-005',
            'G-006',
            'G-007',
            'G-008',
            'G-011',
        ],
        nodes: 9,
    },
    {
        cubes: 860,
        ids: [
            'G-001',
            'G-002',
            'G-003',
            'G-004',
            'G-005',
            'G-006',
            'G-007',
            'G-008',
            'G-011',
            'G-018',
            'G-021',
        ],
        nodes: 11,
    },
] as const;
export type Pattern = (typeof PATTERNS)[number]['nodes'];
export type Board = Pattern | readonly string[];
export type Progress = Readonly<Record<string, Board>>;
export type PatternCategory = Pattern | 'custom';

const { nodes } = data;
const { isArray } = Array;
const ids = new Set(nodes.map((node) => node.id));
const neighbors = new Map(
    nodes.map((node) => [
        node.id,
        nodes
            .filter(
                (other) =>
                    Math.abs(node.x - other.x) + Math.abs(node.y - other.y) ===
                    1
            )
            .map((other) => other.id),
    ])
);
const rootIds = nodes
    .filter((node) => Math.abs(node.x) + Math.abs(node.y) === 1)
    .map((node) => node.id);

export function isPattern(value: unknown): value is Pattern {
    return PATTERNS.some((pattern) => pattern.nodes === value);
}

export function unlockedIds(board: Board = 0): readonly string[] {
    return typeof board === 'number'
        ? (PATTERNS.find((pattern) => pattern.nodes === board)?.ids ?? [])
        : board;
}

export function boardNodeCount(board: Board = 0): number {
    return typeof board === 'number' ? board : board.length;
}

export function presetOf(board: Board = 0): PatternCategory {
    if (typeof board === 'number') {
        return board;
    }
    const set = new Set(board);
    return (
        PATTERNS.find(
            (pattern) =>
                pattern.nodes === set.size &&
                pattern.ids.every((id) => set.has(id))
        )?.nodes ?? 'custom'
    );
}

export function boardCubes(board: Board = 0): number {
    const owned = new Set(unlockedIds(board));
    return nodes
        .filter((node) => owned.has(node.id))
        .flatMap((node) => node.items)
        .filter((item) => item.id === 'item-skill_tree_allmember-1')
        .reduce((total, item) => total + item.qty, 0);
}

export function cubeTotal(progress: Progress): number {
    return Object.values(progress).reduce<number>(
        (total, board) => total + boardCubes(board),
        0
    );
}

export function countPatterns(
    progress: Progress,
    memberIds: readonly string[]
): Record<PatternCategory, number> {
    const counts: Record<PatternCategory, number> = {
        0: 0,
        5: 0,
        7: 0,
        9: 0,
        11: 0,
        custom: 0,
    };
    for (const id of memberIds) {
        counts[presetOf(progress[id] ?? 0)]++;
    }
    return counts;
}

function connectedIds(selected: ReadonlySet<string>): readonly string[] {
    const reached = new Set<string>();
    const queue = rootIds.filter((id) => selected.has(id));
    let index = 0;
    while (index < queue.length) {
        const id = queue[index];
        index++;
        if (reached.has(id)) {
            continue;
        }
        reached.add(id);
        const adjacent = neighbors.get(id);
        if (!adjacent) {
            continue;
        }
        for (const neighbor of adjacent) {
            if (selected.has(neighbor) && !reached.has(neighbor)) {
                queue.push(neighbor);
            }
        }
    }
    return nodes.filter((node) => reached.has(node.id)).map((node) => node.id);
}

export function compactBoard(owned: readonly string[]): Board {
    const category = presetOf(owned);
    return category === 'custom' ? owned : category;
}

export function normalizeBoard(value: unknown): Board | undefined {
    if (isPattern(value)) {
        return value;
    }
    return !isArray(value) ||
        value.some((id: unknown) => !(typeof id === 'string' && ids.has(id)))
        ? undefined
        : compactBoard(connectedIds(new Set(value as string[])));
}

export function toggleNode(board: Board, nodeId: string): Board {
    if (!ids.has(nodeId)) {
        return board;
    }
    const owned = new Set(unlockedIds(board));
    if (owned.has(nodeId)) {
        owned.delete(nodeId);
        return compactBoard(connectedIds(owned));
    }
    const visited = new Set(owned);
    const previous = new Map<string, string>();
    const queue = [...owned];
    for (const root of rootIds) {
        if (visited.has(root)) {
            continue;
        }

        visited.add(root);
        queue.push(root);
    }
    let index = 0;
    while (index < queue.length) {
        const id = queue[index];
        index++;
        if (id === nodeId) {
            break;
        }
        const adjacent = neighbors.get(id);
        if (!adjacent) {
            continue;
        }
        for (const neighbor of adjacent) {
            if (visited.has(neighbor)) {
                continue;
            }

            visited.add(neighbor);
            previous.set(neighbor, id);
            queue.push(neighbor);
        }
    }
    let current: string | undefined = nodeId;
    while (current !== undefined && !owned.has(current)) {
        owned.add(current);
        current = previous.get(current);
    }
    return compactBoard(
        nodes.filter((node) => owned.has(node.id)).map((node) => node.id)
    );
}

export function selectionNodeCount(
    boards: readonly Board[],
    nodeId: string
): number {
    return boards.filter((board) => unlockedIds(board).includes(nodeId)).length;
}

export function selectionNodeState(
    boards: readonly Board[],
    nodeId: string
): boolean | 'mixed' {
    const owned = selectionNodeCount(boards, nodeId);
    if (owned === 0) {
        return false;
    }
    return owned === boards.length ? true : 'mixed';
}

export function toggleSelectedNode(
    progress: Progress,
    memberIds: readonly string[],
    nodeId: string
): Progress {
    if (memberIds.length === 0 || !ids.has(nodeId)) {
        return progress;
    }
    const remove = memberIds.every((id) =>
        unlockedIds(progress[id] ?? 0).includes(nodeId)
    );
    const next = { ...progress };
    for (const id of memberIds) {
        const board = progress[id] ?? 0;
        const owned = unlockedIds(board).includes(nodeId);
        if (owned === remove) {
            next[id] = toggleNode(board, nodeId);
        }
    }
    return next;
}
