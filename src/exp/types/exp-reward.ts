export type ExpReward = {
  readonly base: number;
  readonly job: number;
};

export const emptyReward: ExpReward = {
  base: 0,
  job: 0,
};

export const addRewards = (
  reward1: ExpReward,
  reward2: ExpReward,
): ExpReward => ({
  base: reward1.base + reward2.base,
  job: reward1.job + reward2.job,
});
