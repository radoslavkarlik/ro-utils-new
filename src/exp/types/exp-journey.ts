import type { Exp } from '@/exp/types/journey';
import type { MonsterId } from '@/exp/types/monster-id';
import type { QuestId } from '@/exp/types/quest-id';

type ExpJourneyMonsterStepBase =
  | {
      readonly type: 'monster';
    }
  | {
      readonly type: 'quest-monster';
      readonly questId: QuestId;
    };

export type ExpJourneyMonsterStep = ExpJourneyMonsterStepBase & {
  readonly exp: Exp;
  readonly monsterId: MonsterId;
  readonly monsterName: string;
  readonly kills: number;
};

export type ExpJourneyQuestStep = {
  readonly type: 'quest';
  readonly exp: Exp;
  readonly questId: QuestId;
};

export type ExpJourneyStep = ExpJourneyMonsterStep | ExpJourneyQuestStep;

export type ExpJourney = ReadonlyArray<ExpJourneyStep>;

export const isMonsterExpJourneyStep = (
  step: ExpJourneyStep,
): step is ExpJourneyMonsterStep => step.type === 'monster';
