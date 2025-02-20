export class PriorityQueue<T> {
  private queue: Array<{ item: T; priority: number }>;

  constructor() {
    this.queue = [];
  }

  public enqueue(item: T, priority: number): void {
    this.queue.push({ item, priority });
    this.queue.sort((a, b) => a.priority - b.priority); // Min-heap behavior
  }

  public dequeue(): T | undefined {
    return this.queue.shift()?.item;
  }

  public isEmpty(): boolean {
    return this.queue.length === 0;
  }
}
