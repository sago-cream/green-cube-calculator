import { useState } from 'react';
import type { CSSProperties, JSX } from 'react';
import { Check, CheckCheck, Search, X } from 'lucide-react';

import data from '../board-data.json';
import { boardNodeCount, presetOf } from '../lib/calculator.js';
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
    const allGenerations = groupMembers(members);
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
            <div className='member-header'>
                <h2 id='members-heading'>
                    Members <span className='count'>54</span>
                </h2>
                <label className='search'>
                    <Search size={15} />
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
                            <X size={14} />
                        </button>
                    )}
                </label>
            </div>
            <div className='member-filter-row'>
                <div aria-label='Filter members' className='group-tabs'>
                    {[
                        'All',
                        ...new Set(members.map((member) => member.group)),
                    ].map((name) => (
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
                    ))}
                </div>
                <div className='selection-actions'>
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
                        <CheckCheck size={14} />
                        Select{' '}
                        {search !== '' || group !== 'All' ? 'shown' : 'all'}
                    </button>
                    <button
                        className='text-button'
                        disabled={selected.size === 0}
                        onClick={() => {
                            onSelect(new Set());
                        }}
                    >
                        Clear
                    </button>
                </div>
            </div>
            <div
                className='member-list'
                style={
                    {
                        '--generation-rows': Math.max(
                            1,
                            Math.ceil(generations.length / 3)
                        ),
                    } as CSSProperties
                }
            >
                {generations.map((generation) => {
                    const fullGeneration =
                        allGenerations.find(
                            (item) => item.key === generation.key
                        ) ?? generation;
                    const allSelected = fullGeneration.members.every((member) =>
                        selected.has(member.id)
                    );
                    return (
                        <section
                            aria-label={generation.title}
                            className={`generation ${allSelected ? 'is-selected' : ''}`}
                            key={generation.key}
                        >
                            <div className='generation-header'>
                                <h3>{generation.title}</h3>
                                <button
                                    aria-label={`${allSelected ? 'Deselect' : 'Select'} ${generation.title}`}
                                    aria-pressed={allSelected}
                                    className='generation-select'
                                    onClick={() => {
                                        const next = new Set(selected);
                                        for (const member of fullGeneration.members) {
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
                                        <Check size={13} />
                                    ) : (
                                        <CheckCheck size={13} />
                                    )}
                                    <span>
                                        {allSelected ? 'Clear' : 'Select'}
                                    </span>
                                </button>
                            </div>
                            <div
                                className='member-grid'
                                style={
                                    {
                                        '--members': generation.members.length,
                                    } as CSSProperties
                                }
                            >
                                {generation.members.map((member) => {
                                    const count = boardNodeCount(
                                        progress[member.id]
                                    );
                                    const custom =
                                        presetOf(progress[member.id]) ===
                                        'custom';
                                    return (
                                        <div
                                            className={`member-tile ${selected.has(member.id) ? 'is-selected' : ''}`}
                                            key={member.id}
                                        >
                                            <button
                                                aria-label={`${member.name}, ${count} green nodes`}
                                                aria-pressed={selected.has(
                                                    member.id
                                                )}
                                                className='member'
                                                onClick={() => {
                                                    toggle(member.id);
                                                }}
                                                title={member.name}
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
                                                        height='48'
                                                        src={`/assets/${member.id}.webp`}
                                                        width='48'
                                                    />
                                                    <span
                                                        className={`node-count ${count > 0 ? 'has-nodes' : ''}`}
                                                        title={
                                                            custom
                                                                ? `${count} nodes, custom board`
                                                                : `${count} nodes`
                                                        }
                                                    >
                                                        {count}
                                                        {custom ? '*' : ''}
                                                    </span>
                                                    {selected.has(
                                                        member.id
                                                    ) && (
                                                        <span className='selection-check'>
                                                            <Check
                                                                size={10}
                                                                strokeWidth={3}
                                                            />
                                                        </span>
                                                    )}
                                                </span>
                                                <span className='member-name'>
                                                    {member.shortName ===
                                                    'Robocosan'
                                                        ? 'Roboco'
                                                        : member.shortName}
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
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
