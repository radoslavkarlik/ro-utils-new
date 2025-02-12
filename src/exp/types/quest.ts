import type { ExpReward } from '@/exp/calc';
import type { MonsterId } from '@/exp/monsters';

export enum QuestId {
  AcolyteTraining1 = 'AcolyteTraining1',
  AcolyteTraining2 = 'AcolyteTraining2',
  AcolyteTraining3 = 'AcolyteTraining3',
  Friendship1 = 'Friendship1',
  Friendship2 = 'Friendship2',
  Bruspetti = 'Bruspetti',
  LostChild = 'LostChild',
  RachelSanctuary1 = 'RachelSanctuary1',
  RachelSanctuary2 = 'RachelSanctuary2',
  EyeOfHellion = 'EyeOfHellion',
  CurseOfGaebolg = 'CurseOfGaebolg',
  CrowOfDestiny = 'CrowOfDestiny',
}

export type QuestPrerequisite = {
  readonly baseLevel?: number;
  readonly questIds?: ReadonlyArray<QuestId>;
  readonly kills?: {
    readonly monsterId: MonsterId;
    readonly count: number;
  };
};

export type Quest = ExpReward & {
  readonly id: QuestId;
  readonly prerequisite?: QuestPrerequisite;
};
