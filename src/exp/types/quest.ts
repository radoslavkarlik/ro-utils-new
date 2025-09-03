import type { ExpReward } from '@/exp/types/exp-reward';
import type { MonsterId } from '@/exp/types/monster-id';
import type { QuestId } from '@/exp/types/quest-id';
import { isArray } from '@/lib/is-array';

export type QuestPrerequisite = {
  readonly baseLevel?: number;
  readonly jobLevel?: number;
  readonly questIds?: ReadonlyArray<QuestId>;
};

export type ExpQuest = {
  readonly type: 'exp';
  readonly id: QuestId;
  readonly reward: ExpReward | ReadonlyArray<ExpReward>;
  readonly prerequisite?: QuestPrerequisite;
  readonly isPrerequisiteOnly?: boolean;
};

export type MonsterQuest = {
  readonly type: 'monster';
  readonly id: QuestId;
  readonly kills: {
    readonly monsterId: MonsterId;
    readonly count: number;
  };
  readonly prerequisite?: undefined;
  readonly isPrerequisiteOnly?: boolean;
};

export type Quest = ExpQuest | MonsterQuest;

export const isExpQuest = (quest: Quest): quest is ExpQuest =>
  quest.type === 'exp';

export const getRewardsArray = (
  reward: ExpReward | ReadonlyArray<ExpReward>,
): ReadonlyArray<ExpReward> => (isArray(reward) ? reward : [reward]);
