import { type Monster, getMonsters } from '@/exp/monsters';
import type { MonsterId } from '@/exp/types/monster-id';

export type MonsterContext = {
  readonly allMonsters: ReadonlyArray<Monster>;
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

  const allMonsters = allowedMonsters.values().map(get).toArray();

  return {
    allMonsters,
    get,
  };
};
