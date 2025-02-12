import { getItem } from '../items/get-item';
import { getDropChance } from './get-drop-chance';
import type { MonsterDb } from './get-monsters';

export function calculateMonsterValue(monster: MonsterDb) {
  const drops = {
    drop1: getValue(monster.Drop1id, monster.Drop1per),
    drop2: getValue(monster.Drop2id, monster.Drop2per),
    drop3: getValue(monster.Drop3id, monster.Drop3per),
    drop4: getValue(monster.Drop4id, monster.Drop4per),
    drop5: getValue(monster.Drop5id, monster.Drop5per),
    drop6: getValue(monster.Drop6id, monster.Drop6per),
    drop7: getValue(monster.Drop7id, monster.Drop7per),
    drop8: getValue(monster.Drop8id, monster.Drop8per),
  };

  return {
    ...drops,
    total: Object.values(drops).reduce((total, drop) => total + drop, 0),
  };
}

function getValue(itemId: string, dbChance: string): number {
  if (itemId === '0') {
    return 0;
  }

  const item = getItem(itemId);
  const chance = getDropChance(+dbChance);

  return chance * item.price_sell_oc;
}
