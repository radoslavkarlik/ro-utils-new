import type { ExpReward } from '@/exp/types/exp-reward';
import { Exp } from '@/exp/types/exp';

export const addReward = (exp: Exp, reward: ExpReward): Exp =>
  new Exp({
    baseExp: exp.raw.baseExp + reward.base,
    jobExp: exp.raw.jobExp + reward.job,
  });
