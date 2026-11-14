import type data from '../board-data.json';

export type Member = Readonly<
    Omit<(typeof data.members)[number], 'subgroups'> & {
        subgroups: readonly string[];
    }
>;
export interface Generation {
    readonly key: string;
    readonly title: string;
    readonly members: readonly Member[];
}

function generationTitle(member: Readonly<Member>): string {
    if (member.group === 'hololive') {
        return `JP ${member.subgroup}`;
    }
    return member.group === 'hololive EN'
        ? `EN ${member.subgroup}`
        : member.subgroup;
}

export function groupMembers(
    members: readonly Member[]
): readonly Generation[] {
    const groups: Array<{ key: string; title: string; members: Member[] }> = [];
    for (const member of members) {
        const key = `${member.group}/${member.subgroup}`;
        let generation = groups.find((group) => group.key === key);
        if (!generation) {
            generation = {
                key,
                title: generationTitle(member),
                members: [],
            };
            groups.push(generation);
        }
        generation.members.push(member);
    }
    return groups;
}
