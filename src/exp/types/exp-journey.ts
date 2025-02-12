import type { MonsterId } from '@/exp/monsters';
import type { QuestId } from '@/exp/quests';
import type { LevelExpPoint } from '@/exp/types/exp-point';

export type ExpJourneyMonsterStep = {
  readonly monsterId: MonsterId;
  readonly count: number;
};

export type ExpJourneQuestStep = {
  readonly questId: QuestId;
};

export type ExpJourneyStep = {
  readonly expPoint: LevelExpPoint;
} & (ExpJourneyMonsterStep | QuestId);

export type ExpJourney = ReadonlyArray<ExpJourneyStep>;
