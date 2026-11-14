import type { JSX } from 'react';

import data from '../board-data.json';
import type { Pattern } from '../lib/calculator.js';

const position = (x: number, y: number) => ({
    x: 72 + x * 36,
    y: 214 + y * 26,
});

export function Branch({ count }: { count: Pattern }): JSX.Element {
    const { nodes } = data;
    const edges = [
        [0, 1],
        [1, 2],
        [1, 3],
        [1, 4],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 8],
        [7, 9],
        [7, 10],
    ];
    return (
        <svg
            aria-label={`${count} connected green nodes unlocked, growing upward from the root`}
            className='branch-preview'
            role='img'
            viewBox='0 0 144 240'
        >
            <line
                className={count > 0 ? 'edge filled' : 'edge'}
                x1='72'
                x2='72'
                y1='214'
                y2='188'
            />
            {edges.map(([a, b]) => {
                const from = position(nodes[a].x, nodes[a].y);
                const to = position(nodes[b].x, nodes[b].y);
                return (
                    <line
                        className={
                            a < count && b < count ? 'edge filled' : 'edge'
                        }
                        key={`${a}-${b}`}
                        x1={from.x}
                        x2={to.x}
                        y1={from.y}
                        y2={to.y}
                    />
                );
            })}
            {nodes.map((node, index) => {
                const point = position(node.x, node.y);
                const filled = index < count;
                const radius = node.grade === 2 ? 14 : 11;
                return (
                    <g
                        className={
                            filled ? 'branch-node filled' : 'branch-node'
                        }
                        key={node.id}
                    >
                        <circle cx={point.x} cy={point.y} r={radius} />
                        {filled ? (
                            <image
                                height={(radius - 2) * 2}
                                href={`/assets/${node.icon.split('/', 2)[1]}.webp`}
                                width={(radius - 2) * 2}
                                x={point.x - radius + 2}
                                y={point.y - radius + 2}
                            />
                        ) : (
                            <circle
                                className='unfilled-center'
                                cx={point.x}
                                cy={point.y}
                                r='3'
                            />
                        )}
                    </g>
                );
            })}
            <rect
                className='root-node'
                height='18'
                rx='5'
                transform='rotate(45 72 214)'
                width='18'
                x='63'
                y='205'
            />
            <text textAnchor='middle' x='72' y='238'>
                ROOT
            </text>
        </svg>
    );
}
