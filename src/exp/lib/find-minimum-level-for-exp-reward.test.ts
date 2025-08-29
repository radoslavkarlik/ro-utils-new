import { getRawExpPoint } from '@/exp/calc';
import { MIN_EXP_REWARD } from '@/exp/constants';
import { findMinimumLevelForExpReward } from '@/exp/lib/find-minimum-level-for-exp-reward';
import type { LevelExpPoint } from '@/exp/types/exp-point';
import { getMonsterContext } from '@/exp/types/monster-context';
import { MonsterId } from '@/exp/types/monster-id';

const monsters = getMonsterContext(new Set(Object.values(MonsterId)), 1)

describe('findMinimumLevelForExpReward', () => {
  test('returns correct base level for base exp only', () => {
    const [result] = findMinimumLevelForExpReward({
      base: 900_000,
      job: MIN_EXP_REWARD,
    }, monsters, new Set());

    expect(result).toEqual({ baseLvl: 63, jobLvl: 1 } satisfies LevelExpPoint);
  });

  test('returns correct job level for job exp only', () => {
    const [result] = findMinimumLevelForExpReward({ base: 1, job: 600_000 }, monsters, new Set());

    expect(result).toEqual({ baseLvl: 1, jobLvl: 46 } satisfies LevelExpPoint);
  });

  test('returns correct base and job level for both base and job exp', () => {
    const [result] = findMinimumLevelForExpReward({
      base: 900_000,
      job: 600_000,
    }, monsters, new Set());

    expect(result).toEqual({ baseLvl: 63, jobLvl: 46 } satisfies LevelExpPoint);
  });

  test('returns correct base and job level for both base and job exp if the exp is highest possible to satisfy the minimum level', () => {
    const [result] = findMinimumLevelForExpReward({
      base: 1399,
      job: MIN_EXP_REWARD,
    }, monsters, new Set());

    expect(result).toEqual({ baseLvl: 14, jobLvl: 1 } satisfies LevelExpPoint);
  });

  test('returns correct base and job level for batched quests', () => {
    const [result] = findMinimumLevelForExpReward(
      [
        { base: 2_000, job: 2_000 },
        { base: MIN_EXP_REWARD, job: 1_000 },
        { base: 5_000, job: 3_000 },
      ],
      monsters, new Set()
    );

    expect(result).toEqual({
      baseLvl: 24.226837060702877,
      jobLvl: 15,
    } satisfies LevelExpPoint);
  });

  test('returns correct base and job level according to provided thresholds', () => {
    const [result] = findMinimumLevelForExpReward(
      [
        { base: 90_000, job: 12_000 },
        { base: 30_000, job: 12_000 },
        { base: 139763, job: 12_000 },
      ],
      monsters, new Set(),
      getRawExpPoint({ baseLvl: 44, jobLvl: 23 }),
    );

    expect(result).toEqual({
      baseLvl: 45.04299970899,
      jobLvl: 15,
    } satisfies LevelExpPoint);
  });

  // test('temp', () => {
  //   const [result] = findMinimumLevelForExpReward({
  //     base: 99000,
  //     job: MIN_EXP_REWARD,
  //   }, monsters);

  //   expect(result).toEqual({ baseLvl: 14, jobLvl: 1 } satisfies LevelExpPoint);
  // });

  // test('returns correct base and job level for both base and job exp if the exp is highest possible to satisfy the minimum level', () => {
  //   const [result] = findMinimumLevelForExpReward({
  //     base: 1399,
  //     job: MIN_EXP_REWARD,
  //   }, monsters);

  //   expect(result).toEqual({ baseLvl: 14, jobLvl: 1 } satisfies LevelExpPoint);
  // });
});
