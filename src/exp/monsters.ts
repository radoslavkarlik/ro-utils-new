import type { ExpReward } from './calc';

export enum MonsterId {
  Muka = '1055',
  Wolf = '1013',
  Metaling = '1613',
  Siroma = '1776',
}

type MonsterPrerequisite = {
  readonly baseLevel?: number;
};

export type Monster = ExpReward & {
  readonly id: MonsterId;
  readonly prerequisite?: MonsterPrerequisite;
};

export const monsters: Record<MonsterId, Monster> = {
  [MonsterId.Muka]: { id: MonsterId.Muka, base: 273, job: 120 },
  [MonsterId.Wolf]: {
    id: MonsterId.Wolf,
    base: 329,
    job: 129,
    prerequisite: { baseLevel: 45 },
  },
  [MonsterId.Metaling]: {
    id: MonsterId.Metaling,
    base: 492,
    job: 249,
    prerequisite: { baseLevel: 53 },
  },
  [MonsterId.Siroma]: {
    id: MonsterId.Siroma,
    base: 2230,
    job: 1005,
    prerequisite: { baseLevel: 66 },
  },
};
