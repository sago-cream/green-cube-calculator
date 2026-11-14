import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Check, Network, RotateCcw, Undo2, X } from 'lucide-react';

import data from '../board-data.json';
import { cubeTotal, normalizeBoard, PATTERNS } from '../lib/calculator.js';
import type { Board, Pattern, Progress } from '../lib/calculator.js';
import { normalizeGenerationMode } from '../lib/generation-presets.js';
import type { GenerationMode } from '../lib/generation-presets.js';
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

interface SavedState {
    readonly progress: Progress;
    readonly inventory: string;
    readonly generationMode: GenerationMode;
}

function loadSaved(): SavedState {
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
            generationMode: normalizeGenerationMode(
                'generationMode' in saved ? saved.generationMode : undefined
            ),
        };
    }
    return {
        progress: {},
        inventory: '',
        generationMode: 'optimal',
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
    const [generationMode, setGenerationMode] = useState<GenerationMode>(
        saved.generationMode
    );

    useEffect(() => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    generationMode,
                    inventory,
                    progress,
                })
            );
            setStorageError(false);
        } catch {
            setStorageError(true);
        }
    }, [progress, inventory, generationMode]);
    const total = cubeTotal(progress);
    const totalText = number.format(total + Number(inventory));
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
                    <img
                        alt=''
                        className='brand-logo'
                        height='36'
                        src='/assets/green-cube.webp'
                        width='36'
                    />
                    <h1>Green Cube Calculator</h1>
                </a>
                <div className='header-actions'>
                    <button
                        aria-label='Undo board change'
                        className='header-button'
                        disabled={previous === undefined}
                        onClick={undo}
                    >
                        <Undo2 size={15} />
                        Undo
                    </button>
                    <button
                        aria-label='Reset all boards'
                        className='header-button'
                        disabled={total === 0}
                        onClick={() => {
                            setPrevious({ ...progress });
                            setProgress({});
                            setNotice('Reset all boards.');
                        }}
                    >
                        <RotateCcw size={14} />
                        Reset
                    </button>
                </div>
            </header>
            <main className='dashboard'>
                <Members
                    onSelect={setSelected}
                    progress={progress}
                    selected={selected}
                />
                <aside className='control-column'>
                    <section
                        aria-label='Green cube total'
                        className='panel total-panel'
                    >
                        <span
                            className='board-amount'
                            title='Cubes invested in boards'
                        >
                            {number.format(total)} <small>boards</small>
                        </span>
                        <span className='count-operator'>+</span>
                        <input
                            aria-label='Unspent green cubes in inventory'
                            className='inventory-input'
                            inputMode='numeric'
                            onChange={(event) => {
                                if (/^\d{0,9}$/v.test(event.target.value)) {
                                    setInventory(event.target.value);
                                }
                            }}
                            placeholder='Inventory'
                            title='Unspent inventory'
                            value={inventory}
                        />
                        <span className='count-operator'>=</span>
                        <span aria-live='polite' className='total-amount'>
                            <img
                                alt='Green cubes'
                                height='26'
                                src='/assets/green-cube.webp'
                                width='26'
                            />
                            <strong
                                style={{
                                    fontSize: totalText.length > 9 ? 17 : 26,
                                }}
                            >
                                {totalText}
                            </strong>
                        </span>
                    </section>
                    <section
                        aria-labelledby='patterns-heading'
                        className='panel patterns-panel'
                    >
                        <div className='control-heading'>
                            <h2 id='patterns-heading'>Set boards</h2>
                            {selected.size > 0 && (
                                <span>{selected.size} selected</span>
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
                                        {pattern.nodes === 0
                                            ? 'None'
                                            : `${pattern.nodes} nodes`}
                                    </span>
                                    <Branch count={pattern.nodes} />
                                    <span className='pattern-bottom'>
                                        <img
                                            alt=''
                                            height='20'
                                            src='/assets/green-cube.webp'
                                            width='20'
                                        />
                                        <strong>{pattern.cubes}</strong>
                                    </span>
                                    <span
                                        aria-hidden='true'
                                        className='pattern-magnifier'
                                    >
                                        <Branch count={pattern.nodes} />
                                    </span>
                                </button>
                            ))}
                            <GenerationPreset
                                mode={generationMode}
                                onApply={(next, label) => {
                                    setPrevious({ ...progress });
                                    setProgress(next);
                                    setSelected(new Set());
                                    setNotice(label);
                                }}
                                onModeChange={setGenerationMode}
                                progress={progress}
                                selected={selected}
                            />
                            <button
                                aria-label='Edit selected green board'
                                className='pattern-card custom-board-card'
                                disabled={selected.size !== 1}
                                onClick={() => {
                                    const member = MEMBERS.find((item) =>
                                        selected.has(item.id)
                                    );
                                    if (member) {
                                        setEditingId(member.id);
                                    }
                                }}
                            >
                                <strong className='action-card-title'>
                                    Edit board
                                </strong>
                                <Network size={28} />
                                <span className='action-card-caption'>
                                    {selected.size === 1
                                        ? 'Open interactive board'
                                        : 'Select one member'}
                                </span>
                            </button>
                        </div>
                    </section>
                    {storageError && (
                        <p className='save-error' role='alert'>
                            Could not save on this device.
                        </p>
                    )}
                    {notice !== '' && (
                        <div className='notice' role='status'>
                            <Check size={14} />
                            <span>{notice}</span>
                            <button
                                aria-label='Dismiss notification'
                                onClick={() => {
                                    setNotice('');
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </aside>
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
                        setNotice(`Saved ${editingMember.name}'s board.`);
                    }}
                />
            )}
        </div>
    );
}
