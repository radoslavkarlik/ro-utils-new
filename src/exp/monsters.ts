import { MonsterId } from '@/exp/types/monster-id';
import { QuestId } from '@/exp/types/quest-id';
import type { ExpReward } from './calc';

type MonsterPrerequisite = {
  readonly baseLevel?: number;
  readonly questId?: QuestId;
};

export type Monster = {
  readonly id: MonsterId;
  readonly name: string;
  readonly reward: ExpReward;
  readonly prerequisite?: MonsterPrerequisite;
};

export const monsters: Record<MonsterId, Monster> = {
  [MonsterId.Spore]: {
    id: MonsterId.Spore,
    name: 'Spore',
    reward: { base: 66, job: 108 },
  },
  [MonsterId.Zombie]: {
    id: MonsterId.Zombie,
    name: 'Zombie',
    reward: {
      base: 50,
      job: 33,
    },
    prerequisite: { baseLevel: 22 },
  },
  [MonsterId.Muka]: {
    id: MonsterId.Muka,
    name: 'Muka',
    reward: {
      base: 273,
      job: 120,
    },
    prerequisite: { baseLevel: 26, questId: QuestId.AcolyteTraining },
  },
  [MonsterId.Wolf]: {
    id: MonsterId.Wolf,
    name: 'Wolf',
    reward: {
      base: 329,
      job: 199,
    },
    prerequisite: { baseLevel: 45 },
  },
  [MonsterId.Metaling]: {
    id: MonsterId.Metaling,
    name: 'Metaling',
    reward: {
      base: 492,
      job: 249,
    },
    prerequisite: { baseLevel: 53 },
  },
  [MonsterId.Siroma]: {
    id: MonsterId.Siroma,
    name: 'Siroma',
    reward: {
      base: 2230,
      job: 1005,
    },
    prerequisite: { baseLevel: 66 },
  },
};
