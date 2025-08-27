import { applyRates } from '@/exp/calc';
import { MIN_EXP_REWARD } from '@/exp/constants';
import { MonsterId } from '@/exp/types/monster-id';
import { type Quest, isExpQuest } from '@/exp/types/quest';
import { QuestId } from '@/exp/types/quest-id';
import { isArray } from '@/lib/is-array';

export const quests: Record<QuestId, Quest> = {
  [QuestId.AcolyteTrainingZombie]: {
    type: 'monster',
    id: QuestId.AcolyteTrainingZombie,
    kills: {
      monsterId: MonsterId.Zombie,
      count: 6,
    },
  },
  [QuestId.AcolyteTraining]: {
    type: 'exp',
    id: QuestId.AcolyteTraining,
    reward: [
      { base: 2_000, job: 2_000 },
      { base: MIN_EXP_REWARD, job: 1_000 },
      { base: 5_000, job: 3_000 },
    ],
    prerequisite: { jobLevel: 17, questIds: [QuestId.AcolyteTrainingZombie] },
  },
  [QuestId.Friendship]: {
    type: 'exp',
    id: QuestId.Friendship,
    reward: [
      { base: 200_000, job: MIN_EXP_REWARD },
      { base: 200_000, job: MIN_EXP_REWARD },
    ],
    prerequisite: { baseLevel: 50 },
  },
  [QuestId.Bruspetti]: {
    type: 'exp',
    id: QuestId.Bruspetti,
    reward: {
      base: 450_000,
      job: MIN_EXP_REWARD,
    },
    prerequisite: { baseLevel: 50, questIds: [QuestId.Friendship] },
  },
  [QuestId.LostChild]: {
    type: 'exp',
    id: QuestId.LostChild,
    reward: {
      base: 900_000,
      job: MIN_EXP_REWARD,
    },
    prerequisite: { baseLevel: 60 },
  },
  [QuestId.RachelSanctuary1]: {
    type: 'exp',
    id: QuestId.RachelSanctuary1,
    reward: {
      base: 200_000,
      job: MIN_EXP_REWARD,
    },
    prerequisite: { baseLevel: 60, questIds: [QuestId.LostChild] },
  },
  [QuestId.RachelSanctuarySiroma]: {
    type: 'monster',
    id: QuestId.RachelSanctuarySiroma,
    kills: {
      monsterId: MonsterId.Siroma,
      count: 400,
    },
  },
  [QuestId.RachelSanctuary2]: {
    type: 'exp',
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
    type: 'exp',
    id: QuestId.EyeOfHellion,
    reward: {
      base: 1_000_000,
      job: MIN_EXP_REWARD,
    },
    prerequisite: { baseLevel: 60 },
  },
  [QuestId.CurseOfGaebolg]: {
    type: 'exp',
    id: QuestId.CurseOfGaebolg,
    reward: {
      base: 1_600_000,
      job: MIN_EXP_REWARD,
    },
    prerequisite: { baseLevel: 60 },
  },
  [QuestId.CrowOfDestiny]: {
    type: 'exp',
    id: QuestId.CrowOfDestiny,
    reward: {
      base: 900_000,
      job: 900_000,
    },
    prerequisite: { baseLevel: 60 },
  },
};

export const getQuests = (rates: number): ReadonlyMap<QuestId, Quest> =>
  new Map(
    Object.entries(quests).map<[QuestId, Quest]>(([questId, quest]) => [
      questId as QuestId,
      isExpQuest(quest)
        ? {
            ...quest,
            reward: isArray(quest.reward)
              ? quest.reward.map((reward) => applyRates(reward, rates))
              : applyRates(quest.reward, rates),
          }
        : quest,
    ]),
  );
