import type { QuestId } from '@/exp/types/quest-id';

export type QuestJourney = {
  readonly completedQuests: ReadonlySet<QuestId>;
  readonly availableQuests: ReadonlySet<QuestId>;
  readonly lockedQuests: ReadonlySet<QuestId>;
};
