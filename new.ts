class PriorityQueue<T> {
  private queue: Array<{ item: T; priority: number }>;
  constructor() {
    this.queue = [];
  }

  enqueue(item, priority) {
    this.queue.push({ item, priority });
    this.queue.sort((a, b) => a.priority - b.priority); // Min-heap behavior
  }

  dequeue(): T | undefined {
    return this.queue.shift()?.item;
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}

function findOptimalQuestOrder(
  quests: ReadonlyArray<Quest>,
  startLevel: number,
  targetLevel: number,
  monsterXP: number,
) {
  // Graph representation
  const graph = new Map();
  const inDegree = new Map();

  for (const quest of quests) {
    graph.set(quest.id, []);
    inDegree.set(quest.id, 0);
  }

  for (const quest of quests) {
    for (const prereq of quest.prerequisites) {
      graph.get(prereq).push(quest.id);
      inDegree.set(quest.id, (inDegree.get(quest.id) || 0) + 1);
    }
  }

  // Heuristic function: XP needed to reach target / monster XP per kill
  function heuristic(currentLevel: number): number {
    return Math.max(0, Math.ceil((targetLevel - currentLevel) / monsterXP));
  }

  const availableQuests = new Set<number>();

  // Initialize queue with quests that have no prerequisites
  for (const [questId, degree] of inDegree) {
    if (degree === 0) {
      availableQuests.add(questId);
    }
  }

  const start = {
    level: startLevel,
    kills: 0,
    order: [],
    completed: new Set<number>(),
    available: availableQuests,
  };

  type QueueItem = typeof start;

  // A* Search
  const pq = new PriorityQueue<QueueItem>();

  pq.enqueue(start, heuristic(startLevel));

  let bestOrder: Array<number> | null = null;
  let minKills = Number.POSITIVE_INFINITY;

  while (!pq.isEmpty()) {
    const queueItem = pq.dequeue();

    if (!queueItem) {
      break;
    }

    const { level, kills, order, completed, available } = queueItem;

    // If already reached target level, update the best result
    if (level >= targetLevel && kills < minKills) {
      console.log(kills, minKills);
      minKills = kills;
      bestOrder = order;
      continue;
    }

    for (const questId of available) {
      const quest = quests.find((q) => q.id === questId);

      if (!quest) {
        continue;
      }

      let newLevel = level;
      let newKills = kills;
      const xpNeeded = quest.levelRequirement - newLevel;

      if (xpNeeded > 0) {
        const killsNeeded = Math.ceil(xpNeeded / monsterXP);
        newKills += killsNeeded;
        newLevel += killsNeeded * monsterXP;
      }

      if (newLevel >= quest.levelRequirement) {
        newLevel += quest.xpReward;
        const newCompleted = new Set(completed);
        newCompleted.add(quest.id);

        const newAvailable = new Set(available);
        newAvailable.delete(quest.id);

        // Reduce in-degree for dependent quests and add them to available set if they become unlocked
        for (const dependent of graph.get(quest.id)) {
          inDegree.set(dependent, inDegree.get(dependent) - 1);
          if (inDegree.get(dependent) === 0) {
            newAvailable.add(dependent);
          }
        }

        pq.enqueue(
          {
            level: newLevel,
            kills: newKills,
            order: [...order, quest.id],
            completed: newCompleted,
            available: newAvailable,
          },
          newKills + heuristic(newLevel),
        );
      }
    }

    if (level < targetLevel) {
      const xpNeeded = targetLevel - level;
      const killsNeeded = Math.ceil(xpNeeded / monsterXP);
      const newKills = kills + killsNeeded;

      if (newKills < minKills) {
        minKills = newKills;
        bestOrder = order;
      }
    }
  }

  return { bestOrder, minKills };
}

// Example usage
const quests = [
  { id: 1, levelRequirement: 1, xpReward: 2, prerequisites: [] },
  { id: 2, levelRequirement: 5, xpReward: 10, prerequisites: [1] },
  { id: 3, levelRequirement: 10, xpReward: 5, prerequisites: [4, 2] },
  { id: 4, levelRequirement: 7, xpReward: 100, prerequisites: [1] },
];

type Quest = (typeof quests)[number];

const startLevel = 1;
const targetLevel = 150;
const monsterXP = 2;

console.log(findOptimalQuestOrder(quests, startLevel, targetLevel, monsterXP));
