export const GRID_PITCH = 76;

export function nodePosition(x: number, y: number): { x: number; y: number } {
    return {
        x: (4 + x) * GRID_PITCH,
        y: (1 - y) * GRID_PITCH,
    };
}

export function nodeSize(grade: number): number {
    return grade > 1 ? 70 : 48;
}

export const ROOT_SIZE = 61;
export const LINK_SIZE = 6;
