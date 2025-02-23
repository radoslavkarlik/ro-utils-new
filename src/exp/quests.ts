import { applyRates } from '@/exp/calc';
import { MIN_EXP_REWARD } from '@/exp/constants';
import { MonsterId } from '@/exp/types/monster-id';
import { type Quest, isExpQuest } from '@/exp/types/quest';
import { QuestId } from '@/exp/types/quest-id';
import { isArray } from '@/lib/is-array';

const quests: Record<QuestId, Quest> = {
  [QuestId.AcolyteTrainingZombie]: {
    id: QuestId.AcolyteTrainingZombie,
    kills: {
      monsterId: MonsterId.Zombie,
      count: 6,
    },
  },
  [QuestId.AcolyteTraining]: {
    id: QuestId.AcolyteTraining,
    reward: [
      { base: 2_000, job: 2_000 },
      { base: MIN_EXP_REWARD, job: 1_000 },
      { base: 5_000, job: 3_000 },
    ],
    prerequisite: { jobLevel: 17, questIds: [QuestId.AcolyteTrainingZombie] },
  },
  [QuestId.Friendship]: {
    id: QuestId.Friendship,
    reward: [
      { base: 200_000, job: MIN_EXP_REWARD },
      { base: 200_000, job: MIN_EXP_REWARD },
    ],
    prerequisite: { baseLevel: 50 },
  },
  [QuestId.Bruspetti]: {
    id: QuestId.Bruspetti,
    reward: {
      base: 450_000,
      job: MIN_EXP_REWARD,
    },
    prerequisite: { baseLevel: 50, questIds: [QuestId.Friendship] },
  },
  [QuestId.LostChild]: {
    id: QuestId.LostChild,
    reward: {
      base: 900_000,
      job: MIN_EXP_REWARD,
    },
    prerequisite: { baseLevel: 60 },
  },
  [QuestId.RachelSanctuary1]: {
    id: QuestId.RachelSanctuary1,
    reward: {
      base: 200_000,
      job: MIN_EXP_REWARD,
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
      job: MIN_EXP_REWARD,
    },
    prerequisite: { baseLevel: 60 },
  },
  [QuestId.CurseOfGaebolg]: {
    id: QuestId.CurseOfGaebolg,
    reward: {
      base: 1_600_000,
      job: MIN_EXP_REWARD,
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
