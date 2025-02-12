const hasAegisDropBug = true;

export const getDropChance = (dbValue: number): number => {
  if (hasAegisDropBug) {
    return (dbValue + 1) / (10_000 + 1);
  }

  return dbValue / 10_000;
};
