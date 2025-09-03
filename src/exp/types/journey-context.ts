import type { Exp } from '@/exp/types/journey';
import type { MonsterContext } from '@/exp/types/monster-context';
import type { OvercapSettings } from '@/exp/types/overcap-settings';
import type { QuestContext } from '@/exp/types/quest-context';

export type JourneyContext = {
  readonly targetExp: Exp;
  readonly quests: QuestContext;
  readonly monsters: MonsterContext;
  readonly overcapSettings: OvercapSettings;
};
