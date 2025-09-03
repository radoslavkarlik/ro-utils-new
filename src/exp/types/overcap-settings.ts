export const ignoreOverlevelSettings = [
  'always',
  'full-target',
  'short-of-target',
  'never',
] as const;

export type IgnoreOverlevelSettings = (typeof ignoreOverlevelSettings)[number];

export type OvercapSettings = {
  readonly ignoreOverlevel: IgnoreOverlevelSettings;
  readonly allowPercentWaste: number;
};
