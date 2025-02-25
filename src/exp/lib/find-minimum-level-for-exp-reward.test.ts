import { MIN_EXP_REWARD } from '@/exp/constants';
import { findMinimumLevelForExpReward } from '@/exp/lib/find-minimum-level-for-exp-reward';
import { getMonsters } from '@/exp/monsters';
import type { LevelExpPoint } from '@/exp/types/exp-point';
import { MonsterId } from '@/exp/types/monster-id';

const monsters = getMonsters(1);

describe('findMinimumLevelForExpReward', () => {
  test('returns correct base level for base exp only', () => {
    const [result] = findMinimumLevelForExpReward({
      base: 900_000,
      job: MIN_EXP_REWARD,
    });

    expect(result).toEqual({ baseLvl: 63, jobLvl: 1 } satisfies LevelExpPoint);
  });

  test('returns correct job level for job exp only', () => {
    const [result] = findMinimumLevelForExpReward({ base: 1, job: 600_000 });

    expect(result).toEqual({ baseLvl: 1, jobLvl: 46 } satisfies LevelExpPoint);
  });

  test('returns correct base and job level for both base and job exp', () => {
    const [result] = findMinimumLevelForExpReward({
      base: 900_000,
      job: 600_000,
    });

    expect(result).toEqual({ baseLvl: 63, jobLvl: 46 } satisfies LevelExpPoint);
  });

  test('returns correct base and job level for both base and job exp if the exp is highest possible to satisfy the minimum level', () => {
    const [result] = findMinimumLevelForExpReward({
      base: 1399,
      job: MIN_EXP_REWARD,
    });

    expect(result).toEqual({ baseLvl: 14, jobLvl: 1 } satisfies LevelExpPoint);
  });

  test('returns correct base and job level for batched quests', () => {
    const [result] = findMinimumLevelForExpReward(
      [
        { base: 2_000, job: 2_000 },
        { base: MIN_EXP_REWARD, job: 1_000 },
        { base: 5_000, job: 3_000 },
      ],
      () => monsters.get(MonsterId.Spore),
    );

    expect(result).toEqual({
      baseLvl: 24.226837060702877,
      jobLvl: 15,
    } satisfies LevelExpPoint);
  });
});
