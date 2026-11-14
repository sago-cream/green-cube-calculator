import { useState } from 'react';
import type { JSX } from 'react';
import { ChevronRight } from 'lucide-react';

import data from '../board-data.json';
import type { Progress } from '../lib/calculator.js';
import {
    applyGenerationPreset,
    defaultGenerationChoice,
} from '../lib/generation-presets.js';
import type {
    GenerationChoice,
    GenerationMode,
} from '../lib/generation-presets.js';
import { groupMembers } from '../lib/member-groups.js';

interface Props {
    readonly selected: ReadonlySet<string>;
    readonly progress: Progress;
    readonly onApply: (progress: Progress, label: string) => void;
}

const modeLabels: Readonly<Record<GenerationMode, string>> = {
    optimal: 'Optimal',
    plus5: '+ 5',
    plus7: '+ 7',
};
const modeNames: Readonly<Record<GenerationMode, string>> = {
    optimal: 'optimal',
    plus5: 'optimal + 5',
    plus7: 'optimal + 7',
};
const fifthLabels: Readonly<Record<GenerationMode, string>> = {
    optimal: 'Keep board',
    plus5: '5 nodes',
    plus7: '7 nodes',
};
const fifthValues: Readonly<Record<GenerationMode, string>> = {
    optimal: 'keep',
    plus5: '5',
    plus7: '7',
};
function mixFormula(size: number, mode: GenerationMode): string {
    const values: Array<number | string> =
        size === 3 ? [9, 9, 9] : [9, 9, 9, 11];
    if (size === 5) {
        values.push(fifthValues[mode]);
    }
    return values.join(' / ');
}

export function GenerationPreset({
    selected,
    progress,
    onApply,
}: Props): JSX.Element | undefined {
    const [mode, setMode] = useState<GenerationMode>('optimal');
    const [choices, setChoices] = useState<
        Readonly<Record<string, GenerationChoice>>
    >({});
    const generations = groupMembers(data.members);
    const touched = generations.filter((generation) =>
        generation.members.some((member) => selected.has(member.id))
    );
    const complete = touched.filter((generation) =>
        generation.members.every((member) => selected.has(member.id))
    );
    if (selected.size === 0 || complete.length === 0) {
        return undefined;
    }
    const partial = complete.length !== touched.length;
    return (
        <div className='generation-preset'>
            <div className='generation-preset-heading'>
                <h3>Generation preset</h3>
                <div
                    aria-label='Generation preset mode'
                    className='mix-modes'
                    role='group'
                >
                    {(['optimal', 'plus5', 'plus7'] as const).map((value) => (
                        <button
                            aria-pressed={mode === value}
                            key={value}
                            onClick={() => {
                                setMode(value);
                            }}
                        >
                            {modeLabels[value]}
                        </button>
                    ))}
                </div>
            </div>
            {partial && (
                <p className='mix-hint'>
                    Select complete generations to use this preset.
                </p>
            )}
            {complete.map((generation) => {
                const initial = defaultGenerationChoice(generation);
                const choice = choices[generation.key] ?? initial;
                const eleven = generation.members.some(
                    (member) => member.id === choice.eleven
                )
                    ? choice.eleven
                    : initial.eleven;
                const others = generation.members.filter(
                    (member) => member.id !== eleven
                );
                const keep = others.some((member) => member.id === choice.keep)
                    ? choice.keep
                    : (others.at(-1)?.id ?? eleven);
                const update = (field: 'eleven' | 'keep', value: string) => {
                    setChoices((current) => ({
                        ...current,
                        [generation.key]: {
                            eleven,
                            keep,
                            [field]: value,
                        },
                    }));
                };
                return (
                    <div className='generation-mix-row' key={generation.key}>
                        <div>
                            <strong>{generation.title}</strong>
                            <span className='mix-formula'>
                                {mixFormula(generation.members.length, mode)}
                            </span>
                        </div>
                        {generation.members.length > 3 && (
                            <div className='mix-targets'>
                                <label>
                                    <span>11 nodes</span>
                                    <select
                                        aria-label={`${generation.title}: 11-node member`}
                                        onChange={(event) => {
                                            update(
                                                'eleven',
                                                event.target.value
                                            );
                                        }}
                                        value={eleven}
                                    >
                                        {generation.members.map((member) => (
                                            <option
                                                key={member.id}
                                                value={member.id}
                                            >
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                {generation.members.length === 5 && (
                                    <label>
                                        <span>{fifthLabels[mode]}</span>
                                        <select
                                            aria-label={`${generation.title}: fifth member`}
                                            onChange={(event) => {
                                                update(
                                                    'keep',
                                                    event.target.value
                                                );
                                            }}
                                            value={keep}
                                        >
                                            {others.map((member) => (
                                                <option
                                                    key={member.id}
                                                    value={member.id}
                                                >
                                                    {member.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
            <button
                className='mix-apply'
                disabled={partial || complete.length === 0}
                onClick={() => {
                    onApply(
                        applyGenerationPreset(
                            progress,
                            complete,
                            mode,
                            choices
                        ),
                        `Applied generation ${modeNames[mode]} to ${complete.length} generations.`
                    );
                }}
            >
                Apply to {complete.length}{' '}
                {complete.length === 1 ? 'generation' : 'generations'}
                <ChevronRight size={16} />
            </button>
        </div>
    );
}
