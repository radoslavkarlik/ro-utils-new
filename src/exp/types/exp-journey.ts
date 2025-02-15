import type { MonsterId } from '@/exp/monsters';
import type { QuestId } from '@/exp/quests';
import type { LevelExpPoint } from '@/exp/types/exp-point';

export type ExpJourneyMonsterStep = {
  readonly expPoint: LevelExpPoint;
  readonly monsterId: MonsterId;
  readonly count: number;
};

export type ExpJourneQuestStep = {
  readonly expPoint: LevelExpPoint;
  readonly questId: QuestId;
};

export type ExpJourneyStep = ExpJourneyMonsterStep | ExpJourneQuestStep;

export type ExpJourney = ReadonlyArray<ExpJourneyStep>;

export const isMonsterExpJourneyStep = (
  step: ExpJourneyStep,
): step is ExpJourneyMonsterStep => 'monsterId' in step;
