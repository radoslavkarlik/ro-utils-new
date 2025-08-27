import { getQuests } from '@/exp/quests';
import type { Quest } from '@/exp/types/quest';
import type { QuestId } from '@/exp/types/quest-id';

export type QuestContext = {
  readonly get: (id: QuestId) => Quest;
  readonly allQuests: ReadonlyArray<Quest>;
};

export const  getQuestContext = (availableQuests: ReadonlySet<QuestId>, completedQuests: ReadonlySet<QuestId>, rates: number): QuestContext => {
  const quests = getQuests(rates);

  const get = (id: QuestId): Quest => {
    const quest = quests.get(id);

    if (!quest) {
      throw new Error(`Quest with id${id} was not initialized.`);
    }

    return quest;
  };

  const allQuests = availableQuests.values().filter(questId => !completedQuests.has(questId)).map(get).toArray();

  return {
    get,
    allQuests,
  };
};
