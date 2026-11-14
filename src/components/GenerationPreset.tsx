import type { JSX } from 'react';
import { UsersRound } from 'lucide-react';

import data from '../board-data.json';
import type { Progress } from '../lib/calculator.js';
import { applyGenerationPreset } from '../lib/generation-presets.js';
import { groupMembers } from '../lib/member-groups.js';

interface Props {
    readonly selected: ReadonlySet<string>;
    readonly progress: Progress;
    readonly onApply: (progress: Progress) => void;
}
export function GenerationPreset({
    selected,
    progress,
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
        <button
            aria-label={`Apply optimal to ${complete.length} generations`}
            className='pattern-card generation-card generation-card-action'
            disabled={disabled}
            onClick={() => {
                onApply(applyGenerationPreset(progress, complete));
            }}
        >
            <strong className='action-card-title'>Generation optimal</strong>
            <UsersRound size={28} />
            <span className='generation-formula'>9 / 9 / 9 / 11</span>
            <span className='action-card-caption'>
                {disabled
                    ? 'Select full generations'
                    : `Apply to ${complete.length} ${complete.length === 1 ? 'generation' : 'generations'}`}
            </span>
        </button>
    );
}
