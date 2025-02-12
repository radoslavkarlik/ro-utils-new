import type { ExpReward } from './calc';
import { MonsterId } from './monsters';

export enum QuestId {
  AcolyteTraining1 = 'AcolyteTraining1',
  AcolyteTraining2 = 'AcolyteTraining2',
  AcolyteTraining3 = 'AcolyteTraining3',
  Friendship1 = 'Friendship1',
  Friendship2 = 'Friendship2',
  Bruspetti = 'Bruspetti',
  LostChild = 'LostChild',
  RachelSanctuary1 = 'RachelSanctuary1',
  RachelSanctuarySiroma = 'RachelSanctuarySiroma',
  RachelSanctuary2 = 'RachelSanctuary2',
  EyeOfHellion = 'EyeOfHellion',
  CurseOfGaebolg = 'CurseOfGaebolg',
  CrowOfDestiny = 'CrowOfDestiny',
}

export type QuestPrerequisite = {
  readonly baseLevel?: number;
  readonly questIds?: ReadonlyArray<QuestId>;
};

export type ExpQuest = ExpReward & {
  readonly id: QuestId;
  readonly prerequisite?: QuestPrerequisite;
};

export type ExpQuestWithMinLevel = ExpQuest & {
  readonly minRewardBaseLevel: number;
  readonly minRewardJobLevel: number;
};

export type MonsterQuest = {
  readonly id: QuestId;
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
  [QuestId.AcolyteTraining1]: {
    id: QuestId.AcolyteTraining1,
    base: 2_000,
    job: 2_000,
  },
  [QuestId.AcolyteTraining2]: {
    id: QuestId.AcolyteTraining2,
    base: 0,
    job: 1_000,
    prerequisite: { questIds: [QuestId.AcolyteTraining1] },
  },
  [QuestId.AcolyteTraining3]: {
    id: QuestId.AcolyteTraining3,
    base: 5_000,
    job: 3_000,
    prerequisite: { questIds: [QuestId.AcolyteTraining2] },
  },
  [QuestId.Friendship1]: {
    id: QuestId.Friendship1,
    base: 200_000,
    job: 0,
    prerequisite: { baseLevel: 50 },
  },
  [QuestId.Friendship2]: {
    id: QuestId.Friendship2,
    base: 200_000,
    job: 0,
    prerequisite: { baseLevel: 50, questIds: [QuestId.Friendship1] },
  },
  [QuestId.Bruspetti]: {
    id: QuestId.Bruspetti,
    base: 450_000,
    job: 0,
    prerequisite: { baseLevel: 50, questIds: [QuestId.Friendship2] },
  },
  [QuestId.LostChild]: {
    id: QuestId.LostChild,
    base: 900_000,
    job: 0,
    prerequisite: { baseLevel: 60 },
  },
  [QuestId.RachelSanctuary1]: {
    id: QuestId.RachelSanctuary1,
    base: 200_000,
    job: 0,
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
    base: 900_000,
    job: 600_000,
    prerequisite: {
      baseLevel: 60,
      questIds: [QuestId.RachelSanctuary1, QuestId.RachelSanctuarySiroma],
    },
  },
  [QuestId.EyeOfHellion]: {
    id: QuestId.EyeOfHellion,
    base: 1_000_000,
    job: 0,
    prerequisite: { baseLevel: 60 },
  },
  [QuestId.CurseOfGaebolg]: {
    id: QuestId.CurseOfGaebolg,
    base: 1_600_000,
    job: 0,
    prerequisite: { baseLevel: 60 },
  },
  [QuestId.CrowOfDestiny]: {
    id: QuestId.CrowOfDestiny,
    base: 900_000,
    job: 900_000,
    prerequisite: { baseLevel: 60 },
  },
};
