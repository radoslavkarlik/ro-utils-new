export const ignoreWasteSettings = [
  'always',
  'full-target',
  'short-of-target',
  'never',
] as const;

export type IgnoreWasteSettings = (typeof ignoreWasteSettings)[number];

export type OvercapSettings = {
  readonly allowPercentWaste: number;
  readonly ignoreWaste: IgnoreWasteSettings;
};
