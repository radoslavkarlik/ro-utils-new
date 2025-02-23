import type { RawExpPoint } from '@/exp/types/exp-point';
import type { ExpReward } from '@/exp/types/exp-reward';

export const addReward = (
  exp: RawExpPoint,
  reward: ExpReward,
): RawExpPoint => ({
  baseExp: exp.baseExp + reward.base,
  jobExp: exp.jobExp + reward.job,
});
