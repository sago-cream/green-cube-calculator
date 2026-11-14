import { useState } from 'react';
import type { CSSProperties, JSX } from 'react';
import { Check, CheckCheck, Search, X } from 'lucide-react';

import data from '../board-data.json';
import type { Progress } from '../lib/calculator.js';
import { groupMembers } from '../lib/member-groups.js';

const members: ReadonlyArray<(typeof data.members)[number]> = data.members;
const groupLabels: Readonly<Record<string, string>> = {
    'All': 'All',
    'DEV_IS': 'DEV_IS',
    'hololive': 'JP',
    'hololive EN': 'EN',
    'hololive ID': 'ID',
};

interface Props {
    readonly selected: ReadonlySet<string>;
    readonly progress: Progress;
    readonly onSelect: (ids: ReadonlySet<string>) => void;
}

export function Members({ selected, progress, onSelect }: Props): JSX.Element {
    const [search, setSearch] = useState('');
    const [group, setGroup] = useState('All');
    const filtered = members.filter(
        (member) =>
            (group === 'All' || member.group === group) &&
            `${member.name} ${member.shortName} ${member.subgroups.join(' ')}`
                .toLowerCase()
                .includes(search.toLowerCase().trim())
    );
    const generations = groupMembers(filtered);
    const toggle = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        onSelect(next);
    };
    return (
        <section
            aria-labelledby='members-heading'
            className='panel members-panel'
        >
            <div className='section-title'>
                <div className='heading-with-step'>
                    <span className='step'>1</span>
                    <h2 id='members-heading'>
                        Select members{' '}
                        <span className='count'>{members.length}</span>
                    </h2>
                </div>
                {selected.size > 0 && (
                    <button
                        className='selected-count'
                        onClick={() =>
                            document
                                .querySelector('#patterns-heading')
                                ?.scrollIntoView({ block: 'start' })
                        }
                    >
                        {selected.size} selected{' '}
                        <span>&middot; Set pattern &darr;</span>
                    </button>
                )}
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
                        onSelect(
                            new Set([
                                ...selected,
                                ...filtered.map((member) => member.id),
                            ])
                        );
                    }}
                >
                    <CheckCheck size={16} />
                    Select {search !== '' || group !== 'All' ? 'shown' : 'all'}
                </button>
                <button
                    className='text-button clear-selection'
                    disabled={selected.size === 0}
                    onClick={() => {
                        onSelect(new Set());
                    }}
                >
                    Clear
                </button>
            </div>
            <div aria-label='Filter members' className='group-tabs'>
                {['All', ...new Set(members.map((member) => member.group))].map(
                    (name) => (
                        <button
                            aria-label={name === 'All' ? 'All members' : name}
                            aria-pressed={group === name}
                            key={name}
                            onClick={() => {
                                setGroup(name);
                            }}
                        >
                            {groupLabels[name] ?? name}
                        </button>
                    )
                )}
            </div>
            <div className='member-list'>
                {generations.map((generation) => {
                    const allSelected = generation.members.every((member) =>
                        selected.has(member.id)
                    );
                    return (
                        <section
                            aria-label={generation.title}
                            className='generation'
                            key={generation.key}
                        >
                            <div className='generation-header'>
                                <h3>{generation.title}</h3>
                                <button
                                    aria-label={`${allSelected ? 'Deselect' : 'Select'} ${generation.title}`}
                                    aria-pressed={allSelected}
                                    className='text-button generation-select'
                                    onClick={() => {
                                        const next = new Set(selected);
                                        for (const member of generation.members) {
                                            if (allSelected) {
                                                next.delete(member.id);
                                            } else {
                                                next.add(member.id);
                                            }
                                        }
                                        onSelect(next);
                                    }}
                                >
                                    {allSelected ? (
                                        <Check size={14} />
                                    ) : (
                                        <CheckCheck size={14} />
                                    )}{' '}
                                    {allSelected ? 'Clear' : 'Select'}
                                </button>
                            </div>
                            <div className='member-grid'>
                                {generation.members.map((member) => (
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
                        </section>
                    );
                })}
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
        </section>
    );
}
