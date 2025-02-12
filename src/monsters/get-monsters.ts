import monsters from '../data/mobs.json' with { type: 'json' };
import { calculateMonsterValue } from './calculate-monster-value';

export type MonsterDb = (typeof monsters)[keyof typeof monsters];
export type Monster = ReturnType<typeof getMonsters>[number];

export function getMonsters() {
  return Object.values(monsters).map(
    (monster) =>
      ({ ...monster, value: calculateMonsterValue(monster) }) as const,
  );
}
