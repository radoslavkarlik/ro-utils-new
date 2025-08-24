import { capExpReward, getRawExpPoint } from '@/exp/calc';
import { MIN_EXP_REWARD } from '@/exp/constants';
import type { LevelExpPoint } from '@/exp/types/exp-point';
import { ExpReward } from './types/exp-reward';

describe('capExpReward', () => {
  test('returns cap exp when overlevel', () => {
    const level: LevelExpPoint = {
      baseLvl: 1,
      jobLvl: 47,
    };
    const rawExp = getRawExpPoint(level);

    const result = capExpReward(rawExp, level, {
      base: MIN_EXP_REWARD,
      job: 900_000,
    });

    expect(result).toEqual({
      base: MIN_EXP_REWARD,
      job: 819589,
    } satisfies ExpReward);
  });

  test('returns full exp when not overlevel', () => {
    const level: LevelExpPoint = {
      baseLvl: 1,
      jobLvl: 48,
    };
    const rawExp = getRawExpPoint(level);

    const result = capExpReward(rawExp, level, {
      base: MIN_EXP_REWARD,
      job: 900_000,
    });

    expect(result).toEqual({
      base: MIN_EXP_REWARD,
      job: 900_000,
    } satisfies ExpReward);
  });
});
