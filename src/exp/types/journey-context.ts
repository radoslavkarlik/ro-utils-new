import type { RawExpPoint } from '@/exp/types/exp-point';
import type { MonsterContext } from '@/exp/types/monster-context';
import type { QuestContext } from '@/exp/types/quest-context';

export type JourneyContext = {
  readonly targetExp: RawExpPoint;
  readonly quests: QuestContext;
  readonly monsters: MonsterContext;
};
