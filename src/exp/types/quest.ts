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
  readonly id: QuestId;
  readonly prerequisite?: QuestPrerequisite;
  readonly reward: ExpReward | ReadonlyArray<ExpReward>;
};

export type MonsterQuest = {
  readonly id: QuestId;
  readonly prerequisite?: undefined;
  readonly kills: {
    readonly monsterId: MonsterId;
    readonly count: number;
  };
};

export type Quest = ExpQuest | MonsterQuest;

export const isExpQuest = (quest: Quest): quest is ExpQuest =>
  !('kills' in quest);

export const getRewardsArray = (
  reward: ExpReward | ReadonlyArray<ExpReward>,
): ReadonlyArray<ExpReward> => (isArray(reward) ? reward : [reward]);

export const getTotalExpReward = (
  rewards: ReadonlyArray<ExpReward>,
): ExpReward =>
  rewards.reduce<ExpReward>(
    (total, reward) => ({
      base: total.base + reward.base,
      job: total.job + reward.job,
    }),
    { base: 0, job: 0 },
  );
