import type { JSX } from 'react';
import { Check, Minus } from 'lucide-react';

import data from '../board-data.json';
import { boardNodeCount, presetOf } from '../lib/calculator.js';
import type { Progress } from '../lib/calculator.js';
import { groupMembers } from '../lib/member-groups.js';

const members: ReadonlyArray<(typeof data.members)[number]> = data.members;
const generations = groupMembers(members);
interface Props {
    readonly selected: ReadonlySet<string>;
    readonly progress: Progress;
    readonly onSelect: (ids: ReadonlySet<string>) => void;
}

export function Members({ selected, progress, onSelect }: Props): JSX.Element {
    const allSelected = members.every((member) => selected.has(member.id));
    const toggle = (ids: readonly string[]) => {
        const next = new Set(selected);
        const remove = ids.every((id) => selected.has(id));
        for (const id of ids) {
            if (remove) {
                next.delete(id);
            } else {
                next.add(id);
            }
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
                    Members
                    {selected.size > 0 && (
                        <span aria-live='polite' className='selected-count'>
                            {selected.size} selected
                        </span>
                    )}
                </h2>
                <button
                    aria-pressed={
                        !allSelected && selected.size > 0
                            ? 'mixed'
                            : allSelected
                    }
                    className='select-all'
                    onClick={() => {
                        toggle(members.map((member) => member.id));
                    }}
                >
                    <span aria-hidden='true' className='selection-box'>
                        {allSelected ? (
                            <Check size={13} />
                        ) : (
                            selected.size > 0 && <Minus size={13} />
                        )}
                    </span>
                    Select all
                </button>
            </div>
            <div
                aria-label='Member generations'
                className='member-list'
                role='region'
                tabIndex={0}
            >
                {generations.map((generation) => {
                    const ids = generation.members.map((member) => member.id);
                    const complete = ids.every((id) => selected.has(id));
                    const partial =
                        !complete && ids.some((id) => selected.has(id));
                    return (
                        <section
                            aria-label={generation.title}
                            className={`generation ${complete ? 'is-selected' : ''}`}
                            key={generation.key}
                        >
                            <button
                                aria-label={`${complete ? 'Deselect' : 'Select'} ${generation.title}`}
                                aria-pressed={partial ? 'mixed' : complete}
                                className='generation-select'
                                onClick={() => {
                                    toggle(ids);
                                }}
                            >
                                <span
                                    aria-hidden='true'
                                    className='selection-box'
                                >
                                    {complete ? (
                                        <Check size={13} />
                                    ) : (
                                        partial && <Minus size={13} />
                                    )}
                                </span>
                                <span className='generation-title'>
                                    {generation.title}
                                </span>
                            </button>
                            <div className='member-grid'>
                                {generation.members.map((member) => {
                                    const count = boardNodeCount(
                                        progress[member.id]
                                    );
                                    const custom =
                                        presetOf(progress[member.id]) ===
                                        'custom';
                                    const chosen = selected.has(member.id);
                                    return (
                                        <button
                                            aria-label={`${member.name}, ${count} green nodes`}
                                            aria-pressed={chosen}
                                            className={`member ${chosen ? 'is-selected' : ''}`}
                                            key={member.id}
                                            onClick={() => {
                                                toggle([member.id]);
                                            }}
                                            title={member.name}
                                        >
                                            {chosen && (
                                                <span
                                                    aria-hidden='true'
                                                    className='selection-check'
                                                >
                                                    <Check
                                                        size={12}
                                                        strokeWidth={3}
                                                    />
                                                </span>
                                            )}
                                            <span
                                                className='portrait-wrap'
                                                style={{
                                                    backgroundColor: `#${member.color}18`,
                                                }}
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
                                            </span>
                                            <span className='member-name'>
                                                {member.shortName ===
                                                'Robocosan'
                                                    ? 'Roboco'
                                                    : member.shortName}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>
        </section>
    );
}
