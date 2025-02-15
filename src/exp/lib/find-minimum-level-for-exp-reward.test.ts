import { findMinimumLevelForExpReward } from '@/exp/lib/find-minimum-level-for-exp-reward';
import { MonsterId, monsters } from '@/exp/monsters';
import type { LevelExpPoint } from '@/exp/types/exp-point';

describe('findMinimumLevelForExpReward', () => {
  test('returns correct base level for base exp only', () => {
    const result = findMinimumLevelForExpReward({ base: 900_000, job: 0 });

    expect(result).toEqual({ baseLvl: 63, jobLvl: 1 } satisfies LevelExpPoint);
  });

  test('returns correct job level for job exp only', () => {
    const result = findMinimumLevelForExpReward({ base: 0, job: 600_000 });

    expect(result).toEqual({ baseLvl: 1, jobLvl: 45 } satisfies LevelExpPoint);
  });

  test('returns correct base and job level for both base and job exp', () => {
    const result = findMinimumLevelForExpReward({
      base: 900_000,
      job: 600_000,
    });

    expect(result).toEqual({ baseLvl: 63, jobLvl: 45 } satisfies LevelExpPoint);
  });

  test('returns correct base and job level for both base and job exp if the exp is highest possible to satisfy the minimum level', () => {
    const result = findMinimumLevelForExpReward({
      base: 1405.5,
      job: 0,
    });

    expect(result).toEqual({ baseLvl: 14, jobLvl: 1 } satisfies LevelExpPoint);
  });

  test('returns correct base and job level for batched quests', () => {
    const result = findMinimumLevelForExpReward(
      [
        { base: 2_000, job: 2_000 },
        { base: 0, job: 1_000 },
        { base: 5_000, job: 3_000 },
      ],
      () => monsters[MonsterId.Spore],
    );

    expect(result).toEqual({
      baseLvl: 24.226837060702877,
      jobLvl: 15,
    } satisfies LevelExpPoint);
  });
});
