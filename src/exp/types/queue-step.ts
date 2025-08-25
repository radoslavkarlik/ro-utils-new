import type { Monster } from '@/exp/monsters';
import type { ExpJourney } from '@/exp/types/exp-journey';
import type { RawExpPoint } from '@/exp/types/exp-point';
import type { JourneyContext } from '@/exp/types/journey-context';
import type { QuestId } from '@/exp/types/quest-id';

export type CurrentMonster = {
  readonly monster: Monster;
  readonly thresholdIndex: number;
  readonly isLast: boolean;
};

export type QueueStep = {
  readonly exp: RawExpPoint;
  readonly monster: CurrentMonster;
  readonly kills: number;
  readonly completedQuests: ReadonlySet<QuestId>;
  readonly availableQuests: ReadonlySet<QuestId>;
  readonly lockedQuests: ReadonlySet<QuestId>;
  readonly journey: ExpJourney;
  readonly context: JourneyContext;
};
