import { useEffect, useState } from 'react';
import type { CSSProperties, JSX } from 'react';
import {
    Check,
    CheckCheck,
    ChevronRight,
    CircleHelp,
    Leaf,
    RotateCcw,
    Search,
    Undo2,
    X,
} from 'lucide-react';

import data from '../board-data.json';
import {
    countPatterns,
    cubeTotal,
    isPattern,
    PATTERNS,
} from '../lib/calculator.js';
import type { Pattern, Progress } from '../lib/calculator.js';
import { Branch } from './Branch.js';

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
        const progress: Record<string, Pattern> = {};
        for (const member of MEMBERS) {
            const value: unknown = Reflect.get(saved.progress, member.id);
            if (isPattern(value)) {
                progress[member.id] = value;
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
    const [search, setSearch] = useState('');
    const [group, setGroup] = useState('All');
    const [previous, setPrevious] = useState<Progress | undefined>(undefined);
    const [notice, setNotice] = useState('');
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
    const filtered = MEMBERS.filter(
        (member) =>
            (group === 'All' || member.group === group) &&
            `${member.name} ${member.shortName} ${member.subgroup}`
                .toLowerCase()
                .includes(search.toLowerCase().trim())
    );
    const total = cubeTotal(progress);
    const counts = countPatterns(
        progress,
        MEMBERS.map((member) => member.id)
    );
    const selectedTotal = cubeTotal(
        Object.fromEntries([...selected].map((id) => [id, progress[id] ?? 0]))
    );
    const toggle = (id: string) => {
        setSelected((current) => {
            const next = new Set(current);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };
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
                        <span className='eyebrow'>
                            YOUR HOLOMEM BOARD, ADDED UP
                        </span>
                        <h1>Every little cube counts.</h1>
                        <p>
                            Select your members. Match their green branch. See
                            what you own.
                        </p>
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
                        <section
                            aria-labelledby='members-heading'
                            className='panel members-panel'
                        >
                            <div className='section-title'>
                                <div className='heading-with-step'>
                                    <span className='step'>1</span>
                                    <h2 id='members-heading'>
                                        Select members{' '}
                                        <span className='count'>
                                            {MEMBERS.length}
                                        </span>
                                    </h2>
                                </div>
                                <button
                                    className='selected-count'
                                    disabled={selected.size === 0}
                                    onClick={() =>
                                        document
                                            .querySelector('#patterns-heading')
                                            ?.scrollIntoView({ block: 'start' })
                                    }
                                >
                                    {selected.size} selected
                                    {selected.size > 0 && (
                                        <span>
                                            {' '}
                                            &middot; Set pattern &darr;
                                        </span>
                                    )}
                                </button>
                            </div>
                            <div className='member-tools'>
                                <label className='search'>
                                    <Search size={18} />
                                    <input
                                        aria-label='Search members'
                                        onChange={(event) => {
                                            setSearch(event.target.value);
                                        }}
                                        placeholder='Find a member...'
                                        value={search}
                                    />
                                    {search !== '' && (
                                        <button
                                            aria-label='Clear search'
                                            onClick={() => {
                                                setSearch('');
                                            }}
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </label>
                                <button
                                    className='text-button'
                                    disabled={filtered.length === 0}
                                    onClick={() => {
                                        setSelected(
                                            new Set([
                                                ...selected,
                                                ...filtered.map(
                                                    (member) => member.id
                                                ),
                                            ])
                                        );
                                    }}
                                >
                                    <CheckCheck size={16} />
                                    Select{' '}
                                    {search !== '' || group !== 'All'
                                        ? 'shown'
                                        : 'all'}
                                </button>
                                <button
                                    className='text-button clear-selection'
                                    disabled={selected.size === 0}
                                    onClick={() => {
                                        setSelected(new Set());
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                            <div
                                aria-label='Filter members'
                                className='group-tabs'
                            >
                                {[
                                    'All',
                                    ...new Set(
                                        MEMBERS.map((member) => member.group)
                                    ),
                                ].map((name) => (
                                    <button
                                        aria-pressed={group === name}
                                        key={name}
                                        onClick={() => {
                                            setGroup(name);
                                        }}
                                    >
                                        {name === 'All' ? 'All members' : name}
                                    </button>
                                ))}
                            </div>
                            <div className='member-grid'>
                                {filtered.map((member) => (
                                    <button
                                        aria-label={`${member.name}, ${progress[member.id] ?? 0} green nodes`}
                                        aria-pressed={selected.has(member.id)}
                                        className={`member ${selected.has(member.id) ? 'is-selected' : ''}`}
                                        key={member.id}
                                        onClick={() => {
                                            toggle(member.id);
                                        }}
                                    >
                                        <span
                                            className='portrait-wrap'
                                            style={
                                                {
                                                    '--member-color': `#${member.color}`,
                                                } as CSSProperties
                                            }
                                        >
                                            <img
                                                alt=''
                                                height='64'
                                                src={`/assets/${member.id}.webp`}
                                                width='64'
                                            />
                                            <span className='selection-check'>
                                                {selected.has(member.id) && (
                                                    <Check
                                                        size={12}
                                                        strokeWidth={3}
                                                    />
                                                )}
                                            </span>
                                        </span>
                                        <span className='member-name'>
                                            {member.name}
                                        </span>
                                        <span
                                            className={`node-count ${(progress[member.id] ?? 0) > 0 ? 'has-nodes' : ''}`}
                                        >
                                            <span />
                                            {progress[member.id] ?? 0} nodes
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {filtered.length === 0 && (
                                <div className='empty-state'>
                                    No members found.
                                    <button
                                        className='text-button'
                                        onClick={() => {
                                            setSearch('');
                                            setGroup('All');
                                        }}
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            )}
                            <div className='member-footer'>
                                <span>
                                    {filtered.length} of {MEMBERS.length}{' '}
                                    members
                                </span>
                                <span>Pick a group, or mix and match.</span>
                            </div>
                        </section>
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
                                <span className='pattern-instruction'>
                                    {selected.size > 0
                                        ? `Apply to ${selected.size} selected`
                                        : 'Select members above'}
                                </span>
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
                                            <span>cubes / member</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className='branch-note'>
                                <CircleHelp size={16} />
                                <span>
                                    From the root upward, including side nodes.
                                    Small Green Cubes only; Green Hexa is
                                    excluded.
                                </span>
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
                            <span className='total-unit'>
                                small cubes in total
                            </span>
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
                            <p>Board investment + unspent cubes.</p>
                        </section>
                        <section className='panel breakdown'>
                            <h2>Your boards</h2>
                            <div
                                aria-label={PATTERNS.map(
                                    (pattern) =>
                                        `${counts[pattern.nodes]} members with ${pattern.nodes} nodes`
                                ).join(', ')}
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
                        <Leaf size={14} />A little clarity for your cube
                        collection.
                    </span>
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
