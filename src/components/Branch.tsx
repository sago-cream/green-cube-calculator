import type { JSX } from 'react';

import data from '../board-data.json';
import {
    LINK_SIZE,
    nodePosition,
    nodeSize,
    ROOT_SIZE,
} from '../lib/board-geometry.js';
import { unlockedIds } from '../lib/calculator.js';
import type { Pattern } from '../lib/calculator.js';

export function Branch({ count }: { count: Pattern }): JSX.Element {
    const previewIds = new Set([...unlockedIds(11), 'G-009', 'G-010']);
    const nodes = data.nodes.filter((node) => previewIds.has(node.id));
    const lit = new Set(unlockedIds(count));
    const root = nodePosition(0, 0);
    const cells = [
        {
            id: 'root',
            x: 0,
            y: 0,
        },
        ...nodes,
    ];
    const links = cells.flatMap((node, index) =>
        cells
            .slice(index + 1)
            .filter(
                (other) =>
                    Math.abs(node.x - other.x) + Math.abs(node.y - other.y) ===
                    1
            )
            .map((other) => ({
                id: `${node.id}-${other.id}`,
                x:
                    (nodePosition(node.x, node.y).x +
                        nodePosition(other.x, other.y).x) /
                    2,
                y:
                    (nodePosition(node.x, node.y).y +
                        nodePosition(other.x, other.y).y) /
                    2,
            }))
    );
    return (
        <svg
            aria-label={`${count} connected green nodes unlocked, extending downward from the root`}
            className='branch-preview'
            role='img'
            viewBox='0 0 144 324'
        >
            {links.map((link) => (
                <image
                    height={LINK_SIZE}
                    href='/assets/kira.webp'
                    key={link.id}
                    opacity='.65'
                    width={LINK_SIZE}
                    x={link.x - LINK_SIZE / 2}
                    y={link.y - LINK_SIZE / 2}
                />
            ))}
            <image
                className='root-node'
                height={ROOT_SIZE * 1.25}
                href='/assets/socket.webp'
                width={ROOT_SIZE * 1.25}
                x={root.x - ROOT_SIZE * 0.625}
                y={root.y - ROOT_SIZE * 0.625}
            />
            {nodes.map((node) => {
                const point = nodePosition(node.x, node.y);
                const filled = lit.has(node.id);
                const grade = node.grade > 1 ? 2 : 1;
                const size = nodeSize(grade);
                const iconSize = size * (grade === 2 ? 0.6522 : 0.6875);
                const shadowSize = size * (grade === 2 ? 0.7391 : 0.8125);
                const iconName = node.icon.split('/', 2)[1];
                return (
                    <g
                        className={`branch-node ${filled ? 'filled' : ''}`}
                        data-node-id={node.id}
                        data-x={point.x}
                        data-y={point.y}
                        key={node.id}
                    >
                        <image
                            height={size * 1.25}
                            href={`/assets/node-green-lv${grade}${filled ? '' : '-off'}.webp`}
                            width={size * 1.25}
                            x={point.x - size * 0.625}
                            y={point.y - size * 0.625}
                        />
                        <image
                            height={shadowSize}
                            href={`/assets/${iconName}_shadow.webp`}
                            width={shadowSize}
                            x={point.x - shadowSize / 2}
                            y={point.y - shadowSize / 2}
                        />
                        <image
                            height={iconSize}
                            href={`/assets/${iconName}.webp`}
                            width={iconSize}
                            x={point.x - iconSize / 2}
                            y={point.y - iconSize / 2}
                        />
                        <image
                            height={size * 1.25}
                            href={`/assets/node-stars-lv${grade}.webp`}
                            width={size * 1.25}
                            x={point.x - size * 0.625}
                            y={point.y - size * 0.625}
                        />
                    </g>
                );
            })}
        </svg>
    );
}
