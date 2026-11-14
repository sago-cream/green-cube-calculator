import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { ArrowUpRight } from 'lucide-react';

import data from '../board-data.json';
import {
    cubeTotal,
    normalizeBoard,
    PATTERNS,
    presetOf,
    toggleSelectedNode,
} from '../lib/calculator.js';
import type { Board, Pattern, Progress } from '../lib/calculator.js';
import { BoardEditor } from './BoardEditor.js';
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
            setStorageError(false);
        } catch {
            setStorageError(true);
        }
    }, [progress, inventory]);
    const total = cubeTotal(progress);
    const totalText = number.format(total + Number(inventory));
    const apply = (pattern: Pattern) => {
        setProgress((current) => ({
            ...current,
            ...Object.fromEntries([...selected].map((id) => [id, pattern])),
        }));
    };
    const selectedIds = [...selected];
    const selectedBoards = selectedIds.map((id) => progress[id] ?? 0);
    const selectedMember =
        selected.size === 1
            ? MEMBERS.find((member) => selected.has(member.id))
            : undefined;
    return (
        <div className='app'>
            <main aria-label='Green Cube Calculator' className='dashboard'>
                <Members
                    onSelect={setSelected}
                    progress={progress}
                    selected={selected}
                />
                <aside className='control-column'>
                    <section
                        aria-labelledby='patterns-heading'
                        className='panel patterns-panel'
                    >
                        <div className='control-heading'>
                            <h2 id='patterns-heading'>Green board</h2>
                            <a
                                className='mobile-members-link'
                                href='#members-heading'
                            >
                                Members
                            </a>
                            {selected.size > 0 && (
                                <span>
                                    {selectedMember?.name ??
                                        `${selected.size} selected`}
                                </span>
                            )}
                        </div>
                        <div className='board-toolbar'>
                            <div
                                aria-label='Board presets'
                                className='board-presets'
                                role='group'
                            >
                                {PATTERNS.map((pattern) => (
                                    <button
                                        aria-label={`Apply ${pattern.nodes} nodes, ${pattern.cubes} green cubes`}
                                        aria-pressed={
                                            selectedBoards.length > 0 &&
                                            selectedBoards.every(
                                                (board) =>
                                                    presetOf(board) ===
                                                    pattern.nodes
                                            )
                                        }
                                        disabled={selected.size === 0}
                                        key={pattern.nodes}
                                        onClick={() => {
                                            apply(pattern.nodes);
                                        }}
                                        title={`${pattern.cubes} green cubes per member`}
                                    >
                                        {pattern.nodes === 0
                                            ? 'None'
                                            : pattern.nodes}
                                    </button>
                                ))}
                            </div>
                            <GenerationPreset
                                onApply={setProgress}
                                progress={progress}
                                selected={selected}
                            />
                        </div>
                        <BoardEditor
                            boards={selectedBoards}
                            onToggleNode={(nodeId) => {
                                setProgress((current) =>
                                    toggleSelectedNode(
                                        current,
                                        selectedIds,
                                        nodeId
                                    )
                                );
                            }}
                        />
                    </section>
                    <section
                        aria-label='Green cube total'
                        className='panel total-panel'
                    >
                        <div className='balance-inputs'>
                            <span
                                className='board-amount'
                                title='Cubes invested in boards'
                            >
                                <small>In boards</small>
                                <strong>{number.format(total)}</strong>
                            </span>
                            <span className='count-operator'>+</span>
                            <label className='inventory-field'>
                                <span>Inventory</span>
                                <input
                                    aria-label='Unspent green cubes in inventory'
                                    className='inventory-input'
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
                                    title='Unspent inventory'
                                    value={inventory}
                                />
                            </label>
                        </div>
                        <span aria-live='polite' className='total-amount'>
                            <img
                                alt='Green cubes'
                                height='40'
                                src='/assets/green-cube.webp'
                                width='40'
                            />
                            <strong
                                style={{
                                    fontSize: Math.min(
                                        44,
                                        420 / totalText.length
                                    ),
                                }}
                            >
                                {totalText}
                            </strong>
                        </span>
                    </section>
                    {storageError && (
                        <p className='save-error' role='alert'>
                            Could not save on this device.
                        </p>
                    )}
                </aside>
            </main>
            {selected.size > 0 && (
                <a className='mobile-board-shortcut' href='#patterns-heading'>
                    Board <span>{selected.size}</span>
                    <ArrowUpRight size={16} />
                </a>
            )}
        </div>
    );
}
