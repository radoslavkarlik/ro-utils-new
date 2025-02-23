import { type Monster, getMonsters } from '@/exp/monsters';
import type { MonsterId } from '@/exp/types/monster-id';
import { numericallyAsc, sortByProp } from '@/lib/sort-by';

export type MonsterContext = {
  readonly thresholds: ReadonlyArray<[MonsterId, number]>;
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
    .toArray()
    .sort(
      sortByProp({
        select: (monster) => monster.prerequisite?.baseLevel ?? 1,
        compare: numericallyAsc,
      }),
    )
    .map<[MonsterId, number]>((monster) => [
      monster.id,
      monster.prerequisite?.baseLevel ?? 1,
    ]);

  return {
    get,
    thresholds,
  };
};
