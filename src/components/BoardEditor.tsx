import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, JSX } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';

import data from '../board-data.json';
import {
    GRID_PITCH,
    LINK_SIZE,
    nodeSize,
    nodePosition as point,
    ROOT_SIZE,
} from '../lib/board-geometry.js';
import {
    boardNodeCount,
    selectionNodeCount,
    selectionNodeState,
} from '../lib/calculator.js';
import type { Board } from '../lib/calculator.js';

interface Props {
    readonly boards: readonly Board[];
    readonly onToggleNode: (nodeId: string) => void;
}
const width = GRID_PITCH * 8;
const height = GRID_PITCH * 12;
const cells = [
    {
        id: 'root',
        x: 0,
        y: 0,
    },
    ...data.nodes,
];
const links = cells.flatMap((node, index) =>
    cells
        .slice(index + 1)
        .filter(
            (other) =>
                Math.abs(node.x - other.x) + Math.abs(node.y - other.y) === 1
        )
        .map((other) => ({
            id: `${node.id}-${other.id}`,
            x: (point(node.x, node.y).x + point(other.x, other.y).x) / 2,
            y: (point(node.x, node.y).y + point(other.x, other.y).y) / 2,
        }))
);

export function BoardEditor({ boards, onToggleNode }: Props): JSX.Element {
    const canvasRef = useRef<HTMLDivElement | undefined>(undefined);
    const drag = useRef<
        { x: number; y: number; startX: number; startY: number } | undefined
    >(undefined);
    const [view, setView] = useState({
        scale: 1,
        x: 0,
        y: 0,
    });
    const [nodeId, setNodeId] = useState('G-001');
    const counts = boards.map(boardNodeCount);
    const minCount = counts.length > 0 ? Math.min(...counts) : 0;
    const maxCount = Math.max(...counts, 0);
    const selectedNode =
        data.nodes.find((node) => node.id === nodeId) ?? data.nodes[0];
    const fit = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const scale =
            Math.min(canvas.clientWidth / width, canvas.clientHeight / height) *
            0.94;
        setView({
            scale,
            x: (canvas.clientWidth - width * scale) / 2,
            y: (canvas.clientHeight - height * scale) / 2,
        });
    };
    const zoom = (factor: number) => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        setView((current) => {
            const scale = Math.max(0.25, Math.min(2, current.scale * factor));
            const ratio = scale / current.scale;
            return {
                scale,
                x:
                    canvas.clientWidth / 2 -
                    (canvas.clientWidth / 2 - current.x) * ratio,
                y:
                    canvas.clientHeight / 2 -
                    (canvas.clientHeight / 2 - current.y) * ratio,
            };
        });
    };
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return undefined;
        }
        const observer = new ResizeObserver(() => {
            const scale =
                Math.min(
                    canvas.clientWidth / width,
                    canvas.clientHeight / height
                ) * 0.94;
            setView({
                scale,
                x: (canvas.clientWidth - width * scale) / 2,
                y: (canvas.clientHeight - height * scale) / 2,
            });
        });
        observer.observe(canvas);
        const wheel = (event: WheelEvent) => {
            event.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            setView((current) => {
                const scale = Math.max(
                    0.25,
                    Math.min(
                        2,
                        current.scale * Math.exp(-event.deltaY * 0.0015)
                    )
                );
                const ratio = scale / current.scale;
                return {
                    scale,
                    x: x - (x - current.x) * ratio,
                    y: y - (y - current.y) * ratio,
                };
            });
        };
        canvas.addEventListener('wheel', wheel, { passive: false });
        return () => {
            observer.disconnect();
            canvas.removeEventListener('wheel', wheel);
        };
    }, []);
    return (
        <>
            <div
                className='board-canvas'
                onPointerCancel={() => {
                    drag.current = undefined;
                }}
                onPointerDown={(event) => {
                    if (event.button !== 0) {
                        return;
                    }
                    event.currentTarget.setPointerCapture(event.pointerId);
                    drag.current = {
                        x: view.x,
                        y: view.y,
                        startX: event.clientX,
                        startY: event.clientY,
                    };
                }}
                onPointerMove={(event) => {
                    const { current } = drag;
                    if (current) {
                        setView((previous) => ({
                            ...previous,
                            x: current.x + event.clientX - current.startX,
                            y: current.y + event.clientY - current.startY,
                        }));
                    }
                }}
                onPointerUp={() => {
                    drag.current = undefined;
                }}
                ref={(element) => {
                    canvasRef.current = element ?? undefined;
                }}
            >
                <div
                    className='green-board-stage'
                    style={
                        {
                            '--owner-scale': Math.max(1, 0.5 / view.scale),
                            height,
                            'transform': `translate(${view.x}px,${view.y}px) scale(${view.scale})`,
                            width,
                        } as CSSProperties
                    }
                >
                    {links.map((link) => (
                        <img
                            alt=''
                            className='board-link'
                            height={LINK_SIZE}
                            key={link.id}
                            src='/assets/kira.webp'
                            style={{
                                left: link.x,
                                top: link.y,
                            }}
                            width={LINK_SIZE}
                        />
                    ))}
                    <div
                        className='editor-root'
                        style={{
                            height: ROOT_SIZE,
                            left: point(0, 0).x,
                            top: point(0, 0).y,
                            width: ROOT_SIZE,
                        }}
                    >
                        <img
                            alt='Root socket'
                            className='board-node-art'
                            src='/assets/socket.webp'
                        />
                    </div>
                    {data.nodes.map((node) => {
                        const p = point(node.x, node.y);
                        const grade = node.grade > 1 ? 2 : 1;
                        const size = nodeSize(grade);
                        const name = node.icon.split('/', 2)[1];
                        const state = selectionNodeState(boards, node.id);
                        const owned = state !== false;
                        const ownerCount = selectionNodeCount(boards, node.id);
                        const cost =
                            node.items.find(
                                (item) =>
                                    item.id === 'item-skill_tree_allmember-1'
                            )?.qty ?? 0;
                        return (
                            <button
                                aria-label={`${node.id}, ${cost} green cubes${boards.length > 1 ? `, ${ownerCount} of ${boards.length} members unlocked` : ''}`}
                                aria-pressed={state}
                                className='editor-node'
                                data-node-id={node.id}
                                disabled={boards.length === 0}
                                key={node.id}
                                onClick={() => {
                                    setNodeId(node.id);
                                    onToggleNode(node.id);
                                }}
                                onFocus={() => {
                                    setNodeId(node.id);
                                }}
                                onPointerDown={(event) => {
                                    event.stopPropagation();
                                }}
                                style={{
                                    height: size,
                                    left: p.x,
                                    top: p.y,
                                    width: size,
                                }}
                                title={`${node.id}: ${cost} green cubes; ${ownerCount} of ${boards.length} selected members unlocked`}
                            >
                                <img
                                    alt=''
                                    className='board-node-art'
                                    src={`/assets/node-green-lv${grade}${owned ? '' : '-off'}.webp`}
                                />
                                <img
                                    alt=''
                                    className='board-node-symbol'
                                    src={`/assets/${name}_shadow.webp`}
                                    style={
                                        {
                                            '--symbol-size':
                                                grade === 2
                                                    ? '73.91%'
                                                    : '81.25%',
                                        } as CSSProperties
                                    }
                                />
                                <img
                                    alt=''
                                    className='board-node-symbol'
                                    src={`/assets/${name}.webp`}
                                    style={
                                        {
                                            '--symbol-size':
                                                grade === 2
                                                    ? '65.22%'
                                                    : '68.75%',
                                        } as CSSProperties
                                    }
                                />
                                <img
                                    alt=''
                                    className='board-node-art'
                                    src={`/assets/node-stars-lv${grade}.webp`}
                                />
                                {boards.length > 1 && ownerCount > 0 && (
                                    <span
                                        aria-hidden='true'
                                        className='board-owner-count'
                                    >
                                        {ownerCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                {boards.length === 0 && (
                    <span className='board-prompt'>Select members to edit</span>
                )}
                <div
                    className='board-zoom'
                    onPointerDown={(event) => {
                        event.stopPropagation();
                    }}
                >
                    <button
                        aria-label='Fit green board'
                        className='icon-button'
                        onClick={fit}
                    >
                        <Maximize2 size={18} />
                    </button>
                    <button
                        aria-label='Zoom in'
                        className='icon-button'
                        onClick={() => {
                            zoom(1.25);
                        }}
                    >
                        <Plus size={18} />
                    </button>
                    <button
                        aria-label='Zoom out'
                        className='icon-button'
                        onClick={() => {
                            zoom(0.8);
                        }}
                    >
                        <Minus size={18} />
                    </button>
                </div>
            </div>
            <div className='node-detail'>
                <strong>{selectedNode.id}</strong>
                <span>
                    <img
                        alt='Green Cube'
                        height='24'
                        src='/assets/green-cube.webp'
                        width='24'
                    />
                    {selectedNode.items.find(
                        (item) => item.id === 'item-skill_tree_allmember-1'
                    )?.qty ?? 0}
                </span>
                <span className='board-selection-size'>
                    {minCount === maxCount
                        ? minCount
                        : `${minCount}-${maxCount}`}{' '}
                    nodes
                </span>
            </div>
        </>
    );
}
