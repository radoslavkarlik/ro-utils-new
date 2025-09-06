import type { QuestId } from '@/exp/types/quest-id';

export const ignoreWasteSettings = [
  'always',
  'full-target',
  'short-of-target',
  'never',
] as const;

export type IgnoreWasteSettings = (typeof ignoreWasteSettings)[number];

export type OvercapSettings = {
  readonly allowPercentWasteQuests: ReadonlyMap<QuestId, number>;
  readonly ignoreWaste: IgnoreWasteSettings;
};
