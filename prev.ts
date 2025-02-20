const prev = () => {
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

  function findOptimalQuestOrderOld(
    quests: ReadonlyArray<Quest>,
    startLevel: number,
    targetLevel: number,
    monsterXP: number,
  ) {
    // Heuristic function: XP needed to reach target / monster XP per kill
    function heuristic(currentLevel: number): number {
      return Math.max(0, Math.ceil((targetLevel - currentLevel) / monsterXP));
    }

    const start = {
      level: startLevel,
      kills: 0,
      completed: new Set<number>(),
    };

    type QueueItem = typeof start;

    // A* Search
    const pq = new PriorityQueue<QueueItem>();

    pq.enqueue(start, heuristic(startLevel));

    let bestOrder: Set<number> | null = null;
    let minKills = Number.POSITIVE_INFINITY;

    while (!pq.isEmpty()) {
      const queueItem = pq.dequeue();

      if (!queueItem) {
        break;
      }

      const { level, kills, completed } = queueItem;

      // If already reached target level, update the best result
      if (level >= targetLevel && kills < minKills) {
        minKills = kills;
        bestOrder = completed;
        continue;
      }

      for (const quest of quests) {
        if (
          completed.has(quest.id) ||
          quest.prerequisites.some((p) => !completed.has(p))
        ) {
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

        newLevel += quest.xpReward;

        pq.enqueue(
          {
            level: newLevel,
            kills: newKills,
            completed: new Set([...completed, quest.id]),
          },
          newKills + heuristic(newLevel),
        );
      }

      if (level < targetLevel) {
        const xpNeeded = targetLevel - level;
        const killsNeeded = Math.ceil(xpNeeded / monsterXP);
        const newKills = kills + killsNeeded;

        if (newKills < minKills) {
          minKills = newKills;
          bestOrder = completed;
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

  console.log(
    findOptimalQuestOrderOld(quests, startLevel, targetLevel, monsterXP),
  );
};

prev();
