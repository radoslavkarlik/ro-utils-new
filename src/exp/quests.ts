import { MonsterId } from '@/exp/types/monster-id';
import { QuestId } from '@/exp/types/quest-id';
import type { ExpReward } from './calc';

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

export type ExpQuestWithMinLevel = ExpQuest & {
  readonly minRewardBaseLevel: number;
  readonly minRewardJobLevel: number;
};

export type MonsterQuest = {
  readonly id: QuestId;
  readonly followUpQuest?: QuestId;
  readonly kills: {
    readonly monsterId: MonsterId;
    readonly count: number;
  };
};

export type Quest = ExpQuest | MonsterQuest;

export type AdjustedQuest = ExpQuestWithMinLevel | MonsterQuest;

export const isExpQuest = (quest: Quest): quest is ExpQuest =>
  !('kills' in quest);

export const isExpQuestWithMinLevel = (
  quest: AdjustedQuest,
): quest is ExpQuestWithMinLevel => 'minRewardBaseLevel' in quest;

export const quests: Record<QuestId, Quest> = {
  [QuestId.AcolyteTraining]: {
    id: QuestId.AcolyteTraining,
    reward: [
      { base: 2_000, job: 2_000 },
      { base: 0, job: 1_000 },
      { base: 5_000, job: 3_000 },
    ],
    prerequisite: { jobLevel: 17 },
  },
  [QuestId.Friendship1]: {
    id: QuestId.Friendship1,
    reward: {
      base: 200_000,
      job: 0,
    },
    prerequisite: { baseLevel: 50 },
  },
  [QuestId.Friendship2]: {
    id: QuestId.Friendship2,
    reward: {
      base: 200_000,
      job: 0,
    },
    prerequisite: { baseLevel: 50, questIds: [QuestId.Friendship1] },
  },
  [QuestId.Bruspetti]: {
    id: QuestId.Bruspetti,
    reward: {
      base: 450_000,
      job: 0,
    },
    prerequisite: { baseLevel: 50, questIds: [QuestId.Friendship2] },
  },
  [QuestId.LostChild]: {
    id: QuestId.LostChild,
    reward: {
      base: 900_000,
      job: 0,
    },
    prerequisite: { baseLevel: 60 },
  },
  [QuestId.RachelSanctuary1]: {
    id: QuestId.RachelSanctuary1,
    reward: {
      base: 200_000,
      job: 0,
    },
    prerequisite: { baseLevel: 60, questIds: [QuestId.LostChild] },
  },
  [QuestId.RachelSanctuarySiroma]: {
    id: QuestId.RachelSanctuarySiroma,
    kills: {
      monsterId: MonsterId.Siroma,
      count: 400,
    },
  },
  [QuestId.RachelSanctuary2]: {
    id: QuestId.RachelSanctuary2,
    reward: {
      base: 900_000,
      job: 600_000,
    },
    prerequisite: {
      baseLevel: 60,
      questIds: [QuestId.RachelSanctuary1, QuestId.RachelSanctuarySiroma],
    },
  },
  [QuestId.EyeOfHellion]: {
    id: QuestId.EyeOfHellion,
    reward: {
      base: 1_000_000,
      job: 0,
    },
    prerequisite: { baseLevel: 60 },
  },
  [QuestId.CurseOfGaebolg]: {
    id: QuestId.CurseOfGaebolg,
    reward: {
      base: 1_600_000,
      job: 0,
    },
    prerequisite: { baseLevel: 60 },
  },
  [QuestId.CrowOfDestiny]: {
    id: QuestId.CrowOfDestiny,
    reward: {
      base: 900_000,
      job: 900_000,
    },
    prerequisite: { baseLevel: 60 },
  },
};

export const getRewardsArray = (
  reward: ExpReward | ReadonlyArray<ExpReward>,
): ReadonlyArray<ExpReward> => (Array.isArray(reward) ? reward : [reward]);

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
