import { capExpReward, getBaseLevel, getJobLevel } from '@/exp/calc';
import type { ExpReward } from './types/exp-reward';
import { Exp } from '@/exp/types/exp';

describe('capExpReward', () => {
  test('returns cap exp when overlevel', () => {
    const level = new Exp({
      baseLvl: 1,
      jobLvl: 47,
    });

    const result = capExpReward(level, {
      base: 1,
      job: 900_000,
    });

    expect(result).toEqual({
      base: 1,
      job: 819589,
    } satisfies ExpReward);
  });

  test('returns full exp when not overlevel', () => {
    const level = new Exp({
      baseLvl: 1,
      jobLvl: 48,
    });

    const result = capExpReward(level, {
      base: 1,
      job: 900_000,
    });

    expect(result).toEqual({
      base: 1,
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
