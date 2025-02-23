import { getQuests } from '@/exp/quests';
import type { Quest } from '@/exp/types/quest';
import type { QuestId } from '@/exp/types/quest-id';

export type QuestContext = {
  readonly get: (id: QuestId) => Quest;
};

export const getQuestContext = (rates: number): QuestContext => {
  const quests = getQuests(rates);

  const get = (id: QuestId): Quest => {
    const quest = quests.get(id);

    if (!quest) {
      throw new Error(`Quest with id${id} was not initialized.`);
    }

    return quest;
  };

  return {
    get,
  };
};
