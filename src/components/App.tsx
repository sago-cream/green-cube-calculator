import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import {
    Check,
    ChevronRight,
    CircleHelp,
    Leaf,
    RotateCcw,
    Undo2,
    X,
} from 'lucide-react';

import data from '../board-data.json';
import {
    countPatterns,
    cubeTotal,
    normalizeBoard,
    PATTERNS,
    presetOf,
} from '../lib/calculator.js';
import type { Board, Pattern, Progress } from '../lib/calculator.js';
import { BoardEditor } from './BoardEditor.js';
import { Branch } from './Branch.js';
import { GenerationPreset } from './GenerationPreset.js';
import { Members } from './Members.js';

const STORAGE_KEY = 'green-cube-ledger-v1';
const MEMBERS: ReadonlyArray<(typeof data.members)[number]> = data.members;
const number = new Intl.NumberFormat('en-US');

function readSaved(): unknown {
    let raw: string | null;
    try {
        raw = localStorage.getItem(STORAGE_KEY);
    } catch {
        return undefined;
    }
    const serialized = raw ?? 'null';
    try {
        return JSON.parse(serialized);
    } catch {
        return undefined;
    }
}

function loadSaved(): { progress: Progress; inventory: string } {
    const saved = readSaved();
    if (
        saved !== null &&
        typeof saved === 'object' &&
        'progress' in saved &&
        typeof saved.progress === 'object' &&
        saved.progress !== null
    ) {
        const progress: Record<string, Board> = {};
        for (const member of MEMBERS) {
            const value: unknown = Reflect.get(saved.progress, member.id);
            const board = normalizeBoard(value);
            if (board !== undefined) {
                progress[member.id] = board;
            }
        }
        const inventory =
            'inventory' in saved &&
            typeof saved.inventory === 'string' &&
            /^\d{0,9}$/v.test(saved.inventory)
                ? saved.inventory
                : '';
        return {
            progress,
            inventory,
        };
    }
    return {
        progress: {},
        inventory: '',
    };
}

export function App(): JSX.Element {
    const [saved] = useState(loadSaved);
    const [progress, setProgress] = useState<Progress>(saved.progress);
    const [inventory, setInventory] = useState(saved.inventory);
    const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
    const [previous, setPrevious] = useState<Progress | undefined>(undefined);
    const [notice, setNotice] = useState('');
    const [editingId, setEditingId] = useState<string>();
    const editingMember = MEMBERS.find((member) => member.id === editingId);
    const [storageError, setStorageError] = useState(false);
    useEffect(() => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    inventory,
                    progress,
                })
            );
        } catch {
            setStorageError(true);
        }
    }, [progress, inventory]);
    const total = cubeTotal(progress);
    const customTotal = cubeTotal(
        Object.fromEntries(
            Object.entries(progress).filter(
                ([, board]) => presetOf(board) === 'custom'
            )
        )
    );
    const counts = countPatterns(
        progress,
        MEMBERS.map((member) => member.id)
    );
    const selectedTotal = cubeTotal(
        Object.fromEntries([...selected].map((id) => [id, progress[id] ?? 0]))
    );
    const apply = (pattern: Pattern) => {
        setPrevious({ ...progress });
        setProgress((current) => ({
            ...current,
            ...Object.fromEntries([...selected].map((id) => [id, pattern])),
        }));
        setNotice(
            `Set ${selected.size} ${selected.size === 1 ? 'member' : 'members'} to ${pattern} nodes.`
        );
        setSelected(new Set());
    };
    const undo = () => {
        if (!previous) {
            return;
        }

        setProgress(previous);
        setPrevious(undefined);
        setNotice('Last change undone.');
    };
    return (
        <div className='app'>
            <header className='site-header'>
                <a className='brand' href='#'>
                    <span className='brand-mark'>
                        <Leaf size={22} />
                    </span>{' '}
                    cube garden <span className='brand-divider' />
                    <span className='brand-context'>hololive Dreams</span>
                </a>
                <a
                    className='source-link'
                    href='https://holodori.best/game-data?tab=board'
                    rel='noreferrer'
                    target='_blank'
                >
                    Board reference <ChevronRight size={16} />
                </a>
            </header>
            <main>
                <div className='page-intro'>
                    <div>
                        <h1>Every little cube counts.</h1>
                    </div>
                    <span className='save-state'>
                        <span
                            className={
                                storageError ? 'status-dot error' : 'status-dot'
                            }
                        />
                        {storageError
                            ? 'Local saving unavailable'
                            : 'Saved on this device'}
                    </span>
                </div>
                <div className='workspace'>
                    <div className='editor'>
                        <Members
                            onEdit={setEditingId}
                            onSelect={setSelected}
                            progress={progress}
                            selected={selected}
                        />
                        <section
                            aria-labelledby='patterns-heading'
                            className='panel patterns-panel'
                        >
                            <div className='section-title'>
                                <div className='heading-with-step'>
                                    <span className='step'>2</span>
                                    <h2 id='patterns-heading'>
                                        Match the green branch
                                    </h2>
                                </div>
                                {selected.size > 0 && (
                                    <span className='pattern-instruction'>
                                        Apply to {selected.size} selected
                                    </span>
                                )}
                            </div>
                            <div className='pattern-grid'>
                                {PATTERNS.map((pattern) => (
                                    <button
                                        aria-label={`Apply ${pattern.nodes} nodes, ${pattern.cubes} green cubes`}
                                        className='pattern-card'
                                        disabled={selected.size === 0}
                                        key={pattern.nodes}
                                        onClick={() => {
                                            apply(pattern.nodes);
                                        }}
                                    >
                                        <span className='pattern-top'>
                                            <strong>
                                                {pattern.nodes === 0
                                                    ? 'No nodes'
                                                    : `First ${pattern.nodes}`}
                                            </strong>
                                            <span className='pattern-arrow'>
                                                <ChevronRight size={16} />
                                            </span>
                                        </span>
                                        <Branch count={pattern.nodes} />
                                        <span className='pattern-bottom'>
                                            <img
                                                alt=''
                                                height='28'
                                                src='/assets/green-cube.webp'
                                                width='28'
                                            />
                                            <strong>{pattern.cubes}</strong>
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <GenerationPreset
                                onApply={(next, label) => {
                                    setPrevious({ ...progress });
                                    setProgress(next);
                                    setSelected(new Set());
                                    setNotice(label);
                                }}
                                progress={progress}
                                selected={selected}
                            />
                            <div className='branch-note'>
                                <CircleHelp size={16} />
                                <span>Green Hexa excluded.</span>
                            </div>
                        </section>
                    </div>
                    <aside className='summary'>
                        <section
                            aria-labelledby='total-heading'
                            className='total-panel'
                        >
                            <span className='total-icon'>
                                <img
                                    alt=''
                                    height='84'
                                    src='/assets/green-cube.webp'
                                    width='84'
                                />
                            </span>
                            <h2 id='total-heading'>Your green cubes</h2>
                            <div aria-live='polite' className='grand-total'>
                                {number.format(total + Number(inventory))}
                            </div>
                            <div className='total-divider' />
                            <div className='total-row'>
                                <span>In member boards</span>
                                <strong>{number.format(total)}</strong>
                            </div>
                            <label
                                className='inventory-label'
                                htmlFor='inventory'
                            >
                                Unspent in inventory <span>optional</span>
                            </label>
                            <div className='inventory-input'>
                                <img
                                    alt=''
                                    height='28'
                                    src='/assets/green-cube.webp'
                                    width='28'
                                />
                                <input
                                    id='inventory'
                                    inputMode='numeric'
                                    onChange={(event) => {
                                        if (
                                            /^\d{0,9}$/v.test(
                                                event.target.value
                                            )
                                        ) {
                                            setInventory(event.target.value);
                                        }
                                    }}
                                    placeholder='0'
                                    value={inventory}
                                />
                            </div>
                        </section>
                        <section className='panel breakdown'>
                            <h2>Your boards</h2>
                            <div
                                aria-label={`${PATTERNS.map(
                                    (pattern) =>
                                        `${counts[pattern.nodes]} members with ${pattern.nodes} nodes`
                                ).join(', ')}, ${counts.custom} custom boards`}
                                className='distribution'
                                role='img'
                            >
                                {PATTERNS.map((pattern) => (
                                    <span
                                        className={`segment segment-${pattern.nodes}`}
                                        key={pattern.nodes}
                                        style={{ flex: counts[pattern.nodes] }}
                                    />
                                ))}
                                {counts.custom > 0 && (
                                    <span
                                        className='segment segment-custom'
                                        style={{ flex: counts.custom }}
                                    />
                                )}
                            </div>
                            {PATTERNS.map((pattern) => (
                                <div
                                    className='breakdown-row'
                                    key={pattern.nodes}
                                >
                                    <span
                                        className={`legend-dot segment-${pattern.nodes}`}
                                    />
                                    <span>
                                        {pattern.nodes} nodes{' '}
                                        <small>
                                            {String.fromCodePoint(215)}{' '}
                                            {counts[pattern.nodes]}
                                        </small>
                                    </span>
                                    <strong>
                                        {number.format(
                                            pattern.cubes *
                                                counts[pattern.nodes]
                                        )}
                                    </strong>
                                </div>
                            ))}
                            {counts.custom > 0 && (
                                <div className='breakdown-row'>
                                    <span className='legend-dot segment-custom' />
                                    <span>
                                        Custom{' '}
                                        <small>
                                            {String.fromCodePoint(215)}{' '}
                                            {counts.custom}
                                        </small>
                                    </span>
                                    <strong>
                                        {number.format(customTotal)}
                                    </strong>
                                </div>
                            )}
                            <div className='breakdown-total'>
                                <span>
                                    {MEMBERS.length - counts[0]} /{' '}
                                    {MEMBERS.length} boards invested
                                </span>
                                <Check size={16} />
                            </div>
                        </section>
                        {selected.size > 0 && (
                            <div className='selection-summary'>
                                <strong>
                                    {selected.size} members selected
                                </strong>
                                <span>
                                    Currently {number.format(selectedTotal)}{' '}
                                    cubes in their boards.
                                </span>
                            </div>
                        )}
                        <button
                            className='reset-button'
                            disabled={total === 0}
                            onClick={() => {
                                setPrevious({ ...progress });
                                setProgress({});
                                setNotice('All boards set to 0 nodes.');
                            }}
                        >
                            <RotateCcw size={14} />
                            Reset all boards
                        </button>
                    </aside>
                </div>
                <footer className='site-footer'>
                    <span>
                        Board data & assets from{' '}
                        <a
                            href='https://holodori.best'
                            rel='noreferrer'
                            target='_blank'
                        >
                            holodori.best
                        </a>{' '}
                        &middot; Unofficial fan tool
                    </span>
                </footer>
            </main>
            {editingMember && (
                <BoardEditor
                    board={progress[editingMember.id] ?? 0}
                    member={editingMember}
                    onClose={() => {
                        setEditingId(undefined);
                    }}
                    onSave={(board) => {
                        setPrevious({ ...progress });
                        setProgress((current) => ({
                            ...current,
                            [editingMember.id]: board,
                        }));
                        setEditingId(undefined);
                        setNotice(`Saved ${editingMember.name}'s green board.`);
                    }}
                />
            )}
            {notice !== '' && (
                <div className='toast' role='status'>
                    <Check size={18} />
                    <span>{notice}</span>
                    {previous && (
                        <button onClick={undo}>
                            <Undo2 size={15} />
                            Undo
                        </button>
                    )}
                    <button
                        aria-label='Dismiss notification'
                        onClick={() => {
                            setNotice('');
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
