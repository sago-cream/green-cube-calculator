import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, JSX } from 'react';
import { Maximize2, Minus, Plus, Undo2, X } from 'lucide-react';

import data from '../board-data.json';
import {
    boardCubes,
    boardNodeCount,
    toggleNode,
    unlockedIds,
} from '../lib/calculator.js';
import type { Board } from '../lib/calculator.js';
import type { Member } from '../lib/member-groups.js';

interface Props {
    readonly member: Member;
    readonly board: Board;
    readonly onClose: () => void;
    readonly onSave: (board: Board) => void;
}
const formatter = new Intl.NumberFormat('en-US');
const pitch = 76;
const width = 608;
const height = 912;
const point = (x: number, y: number) => ({
    x: (x + 4) * pitch,
    y: (1 - y) * pitch,
});
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

export function BoardEditor({
    member,
    board,
    onClose,
    onSave,
}: Props): JSX.Element {
    const dialogRef = useRef<HTMLDialogElement | undefined>(undefined);
    const canvasRef = useRef<HTMLDivElement | undefined>(undefined);
    const drag = useRef<
        { x: number; y: number; startX: number; startY: number } | undefined
    >(undefined);
    const [draft, setDraft] = useState<Board>(board);
    const [history, setHistory] = useState<readonly Board[]>([]);
    const [view, setView] = useState({
        scale: 1,
        x: 0,
        y: 0,
    });
    const [nodeId, setNodeId] = useState('G-001');
    const lit = new Set(unlockedIds(draft));
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
        const dialog = dialogRef.current;
        const canvas = canvasRef.current;
        if (!dialog || !canvas) {
            return undefined;
        }
        if (!dialog.open) {
            dialog.showModal();
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
    const change = (next: Board) => {
        setHistory((current) => [...current, draft]);
        setDraft(next);
    };
    return (
        <dialog
            aria-labelledby='board-editor-heading'
            className='board-dialog'
            onCancel={onClose}
            onClose={onClose}
            ref={(element) => {
                dialogRef.current = element ?? undefined;
            }}
        >
            <header className='board-editor-header'>
                <img
                    alt=''
                    height='44'
                    src={`/assets/${member.id}.webp`}
                    width='44'
                />
                <div>
                    <h2 id='board-editor-heading'>{member.name}</h2>
                </div>
                <button
                    aria-label='Undo node edit'
                    className='icon-button'
                    disabled={history.length === 0}
                    onClick={() => {
                        const prior = history.at(-1);
                        if (prior === undefined) {
                            return;
                        }

                        setDraft(prior);
                        setHistory(history.slice(0, -1));
                    }}
                >
                    <Undo2 size={16} />
                </button>
                <button
                    aria-label='Close board editor'
                    className='icon-button'
                    onClick={onClose}
                >
                    <X size={20} />
                </button>
            </header>
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
                    style={{
                        height,
                        transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`,
                        width,
                    }}
                >
                    {links.map((link) => (
                        <img
                            alt=''
                            className='board-link'
                            height='6'
                            key={link.id}
                            src='/assets/kira.webp'
                            style={{
                                left: link.x,
                                top: link.y,
                            }}
                            width='6'
                        />
                    ))}
                    <div
                        className='editor-root'
                        style={{
                            height: 61,
                            left: point(0, 0).x,
                            top: point(0, 0).y,
                            width: 61,
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
                        const size = grade === 2 ? 70 : 48;
                        const name = node.icon.split('/', 2)[1];
                        const owned = lit.has(node.id);
                        const cost =
                            node.items.find(
                                (item) =>
                                    item.id === 'item-skill_tree_allmember-1'
                            )?.qty ?? 0;
                        return (
                            <button
                                aria-label={`${node.id}, ${cost} green cubes`}
                                aria-pressed={owned}
                                className={`editor-node ${nodeId === node.id ? 'is-focused' : ''}`}
                                key={node.id}
                                onClick={() => {
                                    setNodeId(node.id);
                                    change(toggleNode(draft, node.id));
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
                            </button>
                        );
                    })}
                </div>
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
            </div>
            <footer className='board-editor-footer'>
                <div aria-live='polite' className='draft-total'>
                    <img
                        alt=''
                        height='32'
                        src='/assets/green-cube.webp'
                        width='32'
                    />
                    <strong>{formatter.format(boardCubes(draft))}</strong>
                    <span>{boardNodeCount(draft)} nodes</span>
                </div>
                <button className='secondary-button' onClick={onClose}>
                    Cancel
                </button>
                <button
                    className='primary-button'
                    onClick={() => {
                        onSave(draft);
                    }}
                >
                    Save board
                </button>
            </footer>
        </dialog>
    );
}
