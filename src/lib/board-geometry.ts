export const GRID_PITCH = 30;
const SOURCE_PITCH = 76;

export function nodePosition(x: number, y: number): { x: number; y: number } {
    return {
        x: 72 + x * GRID_PITCH,
        y: 26 - y * GRID_PITCH,
    };
}

export function nodeSize(grade: number): number {
    return ((grade > 1 ? 70 : 48) / SOURCE_PITCH) * GRID_PITCH;
}

export const ROOT_SIZE = (61 / SOURCE_PITCH) * GRID_PITCH;
export const LINK_SIZE = (6 / SOURCE_PITCH) * GRID_PITCH;
