import { capExpReward, getBaseLevel, getJobLevel } from '@/exp/calc';
import { MIN_EXP_REWARD } from '@/exp/constants';
import type { ExpReward } from './types/exp-reward';
import { Exp } from '@/exp/types/journey';

describe('capExpReward', () => {
  test('returns cap exp when overlevel', () => {
    const level = new Exp({
      baseLvl: 1,
      jobLvl: 47,
    });

    const result = capExpReward(level, {
      base: MIN_EXP_REWARD,
      job: 900_000,
    });

    expect(result).toEqual({
      base: MIN_EXP_REWARD,
      job: 819589,
    } satisfies ExpReward);
  });

  test('returns full exp when not overlevel', () => {
    const level = new Exp({
      baseLvl: 1,
      jobLvl: 48,
    });

    const result = capExpReward(level, {
      base: MIN_EXP_REWARD,
      job: 900_000,
    });

    expect(result).toEqual({
      base: MIN_EXP_REWARD,
      job: 900_000,
    } satisfies ExpReward);
  });
});

describe('getJobLevel', () => {
  test('prevents overlevel', () => {
    expect(getJobLevel(4000000)).toBe(50);
  });
});

describe('getBaseLevel', () => {
  test('prevents overlevel', () => {
    expect(getBaseLevel(450000000)).toBe(99);
  });
});
