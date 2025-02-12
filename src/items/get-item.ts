import items from '../data/items.json' with { type: 'json' };

type Item = {
  readonly id: string;
  readonly name_japanese: string;
  readonly price_buy_dc: number;
  readonly price_sell_oc: number;
};

export function getItem(id: number | string): Item {
  const item = items[id];

  if (!item) {
    throw new Error(`Did not find item with id ${id}`);
  }

  return item;
}
