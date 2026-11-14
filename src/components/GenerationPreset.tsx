import type { JSX } from 'react';
import { UsersRound } from 'lucide-react';

import data from '../board-data.json';
import type { Progress } from '../lib/calculator.js';
import { applyGenerationPreset } from '../lib/generation-presets.js';
import type { GenerationMode } from '../lib/generation-presets.js';
import { groupMembers } from '../lib/member-groups.js';

interface Props {
    readonly selected: ReadonlySet<string>;
    readonly progress: Progress;
    readonly mode: GenerationMode;
    readonly onModeChange: (mode: GenerationMode) => void;
    readonly onApply: (progress: Progress, label: string) => void;
}
const modeLabels: Readonly<Record<GenerationMode, string>> = {
    optimal: 'Optimal',
    plus5: 'Optimal + 5',
    plus7: 'Optimal + 7',
};
const shortLabels: Readonly<Record<GenerationMode, string>> = {
    optimal: 'Optimal',
    plus5: '+ 5',
    plus7: '+ 7',
};

export function GenerationPreset({
    selected,
    progress,
    mode,
    onModeChange,
    onApply,
}: Props): JSX.Element {
    const generations = groupMembers(data.members);
    const touched = generations.filter((generation) =>
        generation.members.some((member) => selected.has(member.id))
    );
    const complete = touched.filter((generation) =>
        generation.members.every((member) => selected.has(member.id))
    );
    const partial = complete.length !== touched.length;
    const disabled = partial || complete.length === 0;
    return (
        <div className='pattern-card generation-card'>
            <button
                aria-label={`Apply ${modeLabels[mode].toLowerCase()} to ${complete.length} generations`}
                className='generation-card-action'
                disabled={disabled}
                onClick={() => {
                    onApply(
                        applyGenerationPreset(progress, complete, mode),
                        `Applied ${modeLabels[mode].toLowerCase()} to ${complete.length} generations.`
                    );
                }}
            >
                <strong className='action-card-title'>
                    Generation optimal
                </strong>
                <UsersRound size={28} />
                <span className='generation-formula'>9 / 9 / 9 / 11</span>
                <span className='action-card-caption'>
                    {disabled
                        ? 'Select full generations'
                        : `Apply to ${complete.length} ${complete.length === 1 ? 'generation' : 'generations'}`}
                </span>
            </button>
            <div
                aria-label='Generation preset mode'
                className='mix-modes'
                role='group'
            >
                {(['optimal', 'plus5', 'plus7'] as const).map((value) => (
                    <button
                        aria-label={modeLabels[value]}
                        aria-pressed={mode === value}
                        key={value}
                        onClick={() => {
                            onModeChange(value);
                        }}
                    >
                        {shortLabels[value]}
                    </button>
                ))}
            </div>
        </div>
    );
}
