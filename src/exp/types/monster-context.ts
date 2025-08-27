import { type Monster, getMonsters } from '@/exp/monsters';
import type { MonsterId } from '@/exp/types/monster-id';
import { QuestId } from '@/exp/types/quest-id';
import { numericallyAsc, sortByProp } from '@/lib/sort-by';

type MonsterThreshold = {
  readonly baseLevel: number;
  readonly quests: ReadonlySet<QuestId>;
}

export type MonsterContext = {
  readonly thresholds: ReadonlyArray<[MonsterId, MonsterThreshold]>;
  readonly get: (id: MonsterId) => Monster;
};

export const getMonsterContext = (
  allowedMonsters: ReadonlySet<MonsterId>,
  rates: number,
): MonsterContext => {
  const monsters = getMonsters(rates);

  const get = (id: MonsterId): Monster => {
    const monster = monsters.get(id);

    if (!monster) {
      throw new Error(`Monster with id${id} was not initialized.`);
    }

    return monster;
  };

  const thresholds = allowedMonsters
    .values()
    .map(get)
    .map<[MonsterId, MonsterThreshold]>((monster) => [
      monster.id,
      { 
        baseLevel: monster.prerequisite?.baseLevel ?? 1,
        quests: monster.prerequisite?.questId ? new Set([monster.prerequisite.questId]) : new Set()
      }
    ])
    .toArray()
    .sort(
      sortByProp({
        select: ([, { baseLevel }]) => baseLevel,
        compare: numericallyAsc,
      }),
    )

  return {
    get,
    thresholds,
  };
};
