import type { LevelExpPoint } from '@/exp/types/exp-point';
import type { MonsterId } from '@/exp/types/monster-id';
import type { QuestId } from '@/exp/types/quest-id';

export type ExpJourneyMonsterStep = {
  readonly type: 'monster';
  readonly expPoint: LevelExpPoint;
  readonly monsterId: MonsterId;
  readonly monsterName: string;
  readonly kills: number;
};

export type ExpJourneyQuestStep = {
  readonly type: 'quest';
  readonly expPoint: LevelExpPoint;
  readonly questId: QuestId;
};

export type ExpJourneyStep = ExpJourneyMonsterStep | ExpJourneyQuestStep;

export type ExpJourney = ReadonlyArray<ExpJourneyStep>;

export const isMonsterExpJourneyStep = (
  step: ExpJourneyStep,
): step is ExpJourneyMonsterStep => step.type === 'monster';
