import { calcMonsterCount } from '@/exp/calc';
import type { RawExpPoint } from '@/exp/types/exp-point';
import type { QueueStep } from '@/exp/types/queue-step';

export const estimateFinalKillCount = (
  queueStep: QueueStep,
  targetExp: RawExpPoint,
): number => {
  const { exp, monster } = queueStep;

  const [count] = calcMonsterCount(exp, targetExp, monster.monster);

  return count;
};
